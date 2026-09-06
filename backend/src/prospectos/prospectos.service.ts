import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prospecto } from './entities/prospecto.entity';
import { GestionProspecto } from './entities/gestion-prospecto.entity';
import { CreateProspectoDto } from './dto/create-prospecto.dto';
import { UpdateProspectoDto } from './dto/update-prospecto.dto';
import { CreateGestionProspectoDto } from './dto/create-gestion-prospecto.dto';
import { EtapaProspecto } from './enums/etapa-prospecto.enum';
import { EmpresasService } from '../empresas/empresas.service';
import { CoacheesService } from '../coachees/coachees.service';
import { CreateEmpresaDto } from '../empresas/dto/create-empresa.dto';
import { CreateCoacheeDto } from '../coachees/dto/create-coachee.dto';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Coachee } from '../coachees/entities/coachee.entity';

// Probabilidad fija por etapa — tabla de diseño, no editable (mismo criterio que
// resultadoColor/nivelProgreso en el frontend): alimenta el pipeline ponderado de Comercial.
// `ganado`/`perdido` no aparecen: ya salieron del pipeline (se resolvieron).
const PROBABILIDAD_ETAPA: Partial<Record<EtapaProspecto, number>> = {
  [EtapaProspecto.CONTACTADO]: 0.1,
  [EtapaProspecto.PROPUESTA_ENVIADA]: 0.4,
  [EtapaProspecto.NEGOCIACION]: 0.65,
};

@Injectable()
export class ProspectosService {
  constructor(
    @InjectRepository(Prospecto)
    private readonly prospectos: Repository<Prospecto>,
    @InjectRepository(GestionProspecto)
    private readonly gestiones: Repository<GestionProspecto>,
    private readonly empresasService: EmpresasService,
    private readonly coacheesService: CoacheesService,
  ) {}

  create(dto: CreateProspectoDto): Promise<Prospecto> {
    return this.prospectos.save(this.prospectos.create(dto));
  }

  // Cada prospecto viene con su próximo seguimiento (fecha de la última entrada de la
  // bitácora) ya resuelto — el mantenedor y el Panorama del coach lo necesitan siempre, así
  // que se calcula una sola vez acá en vez de que cada consumidor pida la bitácora completa.
  async findAll(
    etapa?: EtapaProspecto,
  ): Promise<Array<Prospecto & { proximoSeguimiento: string | null }>> {
    const [prospectos, ultimaGestion] = await Promise.all([
      this.prospectos.find({
        where: etapa ? { etapa } : {},
        order: { createdAt: 'DESC' },
      }),
      this.ultimaGestionPorProspecto(),
    ]);
    return prospectos.map((p) => ({
      ...p,
      proximoSeguimiento: ultimaGestion.get(p.id)?.proximoSeguimiento ?? null,
    }));
  }

  private async ultimaGestionPorProspecto(): Promise<
    Map<string, GestionProspecto>
  > {
    const todas = await this.gestiones.find({ order: { createdAt: 'DESC' } });
    const mapa = new Map<string, GestionProspecto>();
    for (const gestion of todas) {
      if (!mapa.has(gestion.prospectoId))
        mapa.set(gestion.prospectoId, gestion);
    }
    return mapa;
  }

  async findById(id: string): Promise<Prospecto> {
    const prospecto = await this.prospectos.findOne({ where: { id } });
    if (!prospecto) {
      throw new NotFoundException('Prospecto no encontrado.');
    }
    return prospecto;
  }

  async update(id: string, dto: UpdateProspectoDto): Promise<Prospecto> {
    const prospecto = await this.findById(id);
    Object.assign(prospecto, dto);
    return this.prospectos.save(prospecto);
  }

  async eliminar(id: string): Promise<string> {
    const prospecto = await this.findById(id);
    if (prospecto.convertidoEmpresaId || prospecto.convertidoCoacheeId) {
      throw new ConflictException(
        'No se puede eliminar un prospecto que ya se convirtió en cliente.',
      );
    }
    const nombre = prospecto.nombre;
    await this.prospectos.remove(prospecto);
    return nombre;
  }

  async crearGestion(
    prospectoId: string,
    dto: CreateGestionProspectoDto,
  ): Promise<GestionProspecto> {
    await this.findById(prospectoId);
    return this.gestiones.save(
      this.gestiones.create({
        prospectoId,
        nota: dto.nota,
        proximoSeguimiento: dto.proximoSeguimiento ?? null,
      }),
    );
  }

  async listGestionDeProspecto(
    prospectoId: string,
  ): Promise<GestionProspecto[]> {
    await this.findById(prospectoId);
    return this.gestiones.find({
      where: { prospectoId },
      order: { createdAt: 'DESC' },
    });
  }

  private asegurarAbierto(prospecto: Prospecto): void {
    if (
      prospecto.etapa === EtapaProspecto.GANADO ||
      prospecto.etapa === EtapaProspecto.PERDIDO
    ) {
      throw new BadRequestException('Este prospecto ya está cerrado.');
    }
  }

  async convertirAEmpresa(id: string, dto: CreateEmpresaDto): Promise<Empresa> {
    const prospecto = await this.findById(id);
    this.asegurarAbierto(prospecto);
    const empresa = await this.empresasService.create(dto);
    prospecto.etapa = EtapaProspecto.GANADO;
    prospecto.convertidoEmpresaId = empresa.id;
    await this.prospectos.save(prospecto);
    return empresa;
  }

  async convertirACoachee(
    id: string,
    dto: CreateCoacheeDto,
  ): Promise<{ coachee: Coachee; temporaryPassword: string | null }> {
    const prospecto = await this.findById(id);
    this.asegurarAbierto(prospecto);
    const resultado = await this.coacheesService.create(dto);
    prospecto.etapa = EtapaProspecto.GANADO;
    prospecto.convertidoCoacheeId = resultado.coachee.id;
    await this.prospectos.save(prospecto);
    return resultado;
  }

  async marcarPerdido(id: string, motivo?: string): Promise<Prospecto> {
    const prospecto = await this.findById(id);
    this.asegurarAbierto(prospecto);
    prospecto.etapa = EtapaProspecto.PERDIDO;
    await this.prospectos.save(prospecto);
    if (motivo) {
      await this.crearGestion(id, { nota: `Perdido: ${motivo}` });
    }
    return prospecto;
  }

  async pipelinePonderado(): Promise<number> {
    const abiertos = await this.prospectos.find({
      where: Object.keys(PROBABILIDAD_ETAPA).map((etapa) => ({
        etapa: etapa as EtapaProspecto,
      })),
    });
    return Math.round(
      abiertos.reduce(
        (total, p) =>
          total + (p.valorEstimado ?? 0) * (PROBABILIDAD_ETAPA[p.etapa] ?? 0),
        0,
      ),
    );
  }
}
