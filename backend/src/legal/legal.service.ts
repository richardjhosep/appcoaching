import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentoLegal } from './entities/documento-legal.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Coachee } from '../coachees/entities/coachee.entity';
import { TipoDocumentoLegal } from './enums/tipo-documento-legal.enum';
import { EstadoDocumentoLegal } from './enums/estado-documento-legal.enum';
import { UpsertDocumentoLegalDto } from './dto/upsert-documento-legal.dto';

export interface DocumentoLegalResumen {
  estado: EstadoDocumentoLegal;
  fecha: string | null;
  vigencia: string | null;
}

export interface EmpresaLegal {
  empresaId: string;
  nombre: string;
  contrato: DocumentoLegalResumen;
  nda: DocumentoLegalResumen;
  coacheesConConsentimiento: number;
  coacheesTotal: number;
}

export interface MedidaCumplimiento {
  id: string;
  descripcion: string;
  activa: boolean;
}

const DOCUMENTO_DEFAULT: DocumentoLegalResumen = {
  estado: EstadoDocumentoLegal.PENDIENTE,
  fecha: null,
  vigencia: null,
};

@Injectable()
export class LegalService {
  constructor(
    @InjectRepository(DocumentoLegal)
    private readonly documentos: Repository<DocumentoLegal>,
    @InjectRepository(Empresa) private readonly empresas: Repository<Empresa>,
    @InjectRepository(Coachee) private readonly coachees: Repository<Coachee>,
  ) {}

  async upsertDocumento(
    empresaId: string,
    tipo: TipoDocumentoLegal,
    dto: UpsertDocumentoLegalDto,
  ): Promise<DocumentoLegal> {
    let documento = await this.documentos.findOne({
      where: { empresaId, tipo },
    });
    if (!documento) {
      documento = this.documentos.create({ empresaId, tipo });
    }
    documento.estado = dto.estado;
    documento.fecha = dto.fecha ?? null;
    documento.vigencia = dto.vigencia ?? null;
    return this.documentos.save(documento);
  }

  async resumen(): Promise<EmpresaLegal[]> {
    const [empresas, documentos, coachees] = await Promise.all([
      this.empresas.find({ order: { nombre: 'ASC' } }),
      this.documentos.find(),
      this.coachees.find(),
    ]);

    return empresas.map((empresa) => {
      const propios = documentos.filter((d) => d.empresaId === empresa.id);
      const contrato = propios.find(
        (d) => d.tipo === TipoDocumentoLegal.CONTRATO,
      );
      const nda = propios.find((d) => d.tipo === TipoDocumentoLegal.NDA);
      const coacheesEmpresa = coachees.filter(
        (c) => c.empresaId === empresa.id,
      );

      return {
        empresaId: empresa.id,
        nombre: empresa.nombre,
        contrato: contrato ?? DOCUMENTO_DEFAULT,
        nda: nda ?? DOCUMENTO_DEFAULT,
        coacheesConConsentimiento: coacheesEmpresa.filter(
          (c) => c.consentimientoInformado,
        ).length,
        coacheesTotal: coacheesEmpresa.length,
      };
    });
  }

  async cumplimiento(): Promise<MedidaCumplimiento[]> {
    const coachees = await this.coachees.find();
    const total = coachees.length;
    const conConsentimiento = coachees.filter(
      (c) => c.consentimientoInformado,
    ).length;

    return [
      {
        id: 'notas_privadas',
        descripcion:
          'Las notas privadas de sesión del coach nunca son visibles para el coachee ni la empresa.',
        activa: true,
      },
      {
        id: 'contacto_autogestionado',
        descripcion:
          'El teléfono y email de contacto del coachee son autogestionados por el propio coachee.',
        activa: true,
      },
      {
        id: 'datos_agregados_empresa',
        descripcion:
          'La empresa solo accede a datos agregados del proceso (avance, resultado, resumen inicial), nunca a notas de sesión individuales.',
        activa: true,
      },
      {
        id: 'consentimiento_informado',
        descripcion:
          total > 0
            ? `Consentimiento informado firmado: ${conConsentimiento} de ${total} coachees (${Math.round((conConsentimiento / total) * 100)}%).`
            : 'Consentimiento informado: todavía no hay coachees registrados.',
        activa: total > 0 && conConsentimiento === total,
      },
    ];
  }
}
