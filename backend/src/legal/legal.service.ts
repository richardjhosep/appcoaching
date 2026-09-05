import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentoLegal } from './entities/documento-legal.entity';
import { DocumentoAdicionalLegal } from './entities/documento-adicional-legal.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Coachee } from '../coachees/entities/coachee.entity';
import { TipoDocumentoLegal } from './enums/tipo-documento-legal.enum';
import { EstadoDocumentoLegal } from './enums/estado-documento-legal.enum';
import { UpsertDocumentoLegalDto } from './dto/upsert-documento-legal.dto';
import { UPLOADS_DIR } from '../recursos/uploads-dir.util';
import { validarPdfSubido } from '../common/file-type-filter.util';

/** Exactamente uno de los dos debe estar presente — empresa o coachee independiente. */
export interface TargetLegal {
  empresaId?: string;
  coacheeId?: string;
}

export interface DocumentoLegalResumen {
  estado: EstadoDocumentoLegal;
  fecha: string | null;
  vigencia: string | null;
  tieneArchivo: boolean;
}

export interface EmpresaLegal {
  empresaId: string;
  nombre: string;
  contrato: DocumentoLegalResumen;
  nda: DocumentoLegalResumen;
  coacheesConConsentimiento: number;
  coacheesTotal: number;
  createdAt: Date;
}

export interface IndependienteLegal {
  coacheeId: string;
  nombre: string;
  contrato: DocumentoLegalResumen;
  nda: DocumentoLegalResumen;
  consentimientoInformado: boolean;
  createdAt: Date;
}

export interface ResumenLegal {
  empresas: EmpresaLegal[];
  independientes: IndependienteLegal[];
}

export interface MedidaCumplimiento {
  id: string;
  descripcion: string;
  activa: boolean;
}

export interface DocumentoAdicionalResumen {
  id: string;
  empresaId: string | null;
  coacheeId: string | null;
  titulo: string;
  archivoNombre: string;
  createdAt: Date;
}

const DOCUMENTO_DEFAULT: DocumentoLegalResumen = {
  estado: EstadoDocumentoLegal.PENDIENTE,
  fecha: null,
  vigencia: null,
  tieneArchivo: false,
};

function aResumen(documento?: DocumentoLegal): DocumentoLegalResumen {
  if (!documento) return DOCUMENTO_DEFAULT;
  return {
    estado: documento.estado,
    fecha: documento.fecha,
    vigencia: documento.vigencia,
    tieneArchivo: !!documento.archivoPath,
  };
}

function validarTarget(target: TargetLegal): void {
  const cantidad = [target.empresaId, target.coacheeId].filter(Boolean).length;
  if (cantidad !== 1) {
    throw new BadRequestException(
      'Debe indicarse exactamente una empresa o un coachee, no ambos ni ninguno.',
    );
  }
}

@Injectable()
export class LegalService {
  constructor(
    @InjectRepository(DocumentoLegal)
    private readonly documentos: Repository<DocumentoLegal>,
    @InjectRepository(DocumentoAdicionalLegal)
    private readonly adicionales: Repository<DocumentoAdicionalLegal>,
    @InjectRepository(Empresa) private readonly empresas: Repository<Empresa>,
    @InjectRepository(Coachee) private readonly coachees: Repository<Coachee>,
  ) {}

  async upsertDocumento(
    target: TargetLegal,
    tipo: TipoDocumentoLegal,
    dto: UpsertDocumentoLegalDto,
    archivo?: Express.Multer.File,
  ): Promise<DocumentoLegal> {
    validarTarget(target);
    let documento = await this.documentos.findOne({
      where: target.empresaId
        ? { empresaId: target.empresaId, tipo }
        : { coacheeId: target.coacheeId, tipo },
    });
    if (!documento) {
      documento = this.documentos.create({
        empresaId: target.empresaId ?? null,
        coacheeId: target.coacheeId ?? null,
        tipo,
      });
    }
    documento.estado = dto.estado;
    documento.fecha = dto.fecha ?? null;
    documento.vigencia = dto.vigencia ?? null;
    if (archivo) {
      await validarPdfSubido(archivo, UPLOADS_DIR);
      documento.archivoPath = archivo.filename;
      documento.archivoNombre = archivo.originalname;
    }
    return this.documentos.save(documento);
  }

  async obtenerArchivo(
    target: TargetLegal,
    tipo: TipoDocumentoLegal,
  ): Promise<DocumentoLegal | null> {
    validarTarget(target);
    return this.documentos.findOne({
      where: target.empresaId
        ? { empresaId: target.empresaId, tipo }
        : { coacheeId: target.coacheeId, tipo },
    });
  }

  async resumen(): Promise<ResumenLegal> {
    const [empresas, documentos, coachees] = await Promise.all([
      this.empresas.find({ order: { nombre: 'ASC' } }),
      this.documentos.find(),
      this.coachees.find({ order: { nombre: 'ASC' } }),
    ]);

    const empresasResumen = empresas.map((empresa) => {
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
        contrato: aResumen(contrato),
        nda: aResumen(nda),
        coacheesConConsentimiento: coacheesEmpresa.filter(
          (c) => c.consentimientoInformado,
        ).length,
        coacheesTotal: coacheesEmpresa.length,
        createdAt: empresa.createdAt,
      };
    });

    const independientesResumen = coachees
      .filter((c) => !c.empresaId)
      .map((coachee) => {
        const propios = documentos.filter((d) => d.coacheeId === coachee.id);
        const contrato = propios.find(
          (d) => d.tipo === TipoDocumentoLegal.CONTRATO,
        );
        const nda = propios.find((d) => d.tipo === TipoDocumentoLegal.NDA);

        return {
          coacheeId: coachee.id,
          nombre: coachee.nombre,
          contrato: aResumen(contrato),
          nda: aResumen(nda),
          consentimientoInformado: coachee.consentimientoInformado,
          createdAt: coachee.createdAt,
        };
      });

    return { empresas: empresasResumen, independientes: independientesResumen };
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

  async listarAdicionales(): Promise<DocumentoAdicionalResumen[]> {
    const items = await this.adicionales.find({ order: { createdAt: 'DESC' } });
    return items.map((d) => ({
      id: d.id,
      empresaId: d.empresaId,
      coacheeId: d.coacheeId,
      titulo: d.titulo,
      archivoNombre: d.archivoNombre,
      createdAt: d.createdAt,
    }));
  }

  async subirAdicional(
    target: TargetLegal,
    titulo: string,
    archivo: Express.Multer.File,
  ): Promise<DocumentoAdicionalLegal> {
    validarTarget(target);
    if (!archivo) {
      throw new BadRequestException('Debe adjuntarse un archivo.');
    }
    await validarPdfSubido(archivo, UPLOADS_DIR);
    const documento = this.adicionales.create({
      empresaId: target.empresaId ?? null,
      coacheeId: target.coacheeId ?? null,
      titulo,
      archivoPath: archivo.filename,
      archivoNombre: archivo.originalname,
    });
    return this.adicionales.save(documento);
  }

  async obtenerAdicional(id: string): Promise<DocumentoAdicionalLegal> {
    const documento = await this.adicionales.findOne({ where: { id } });
    if (!documento) {
      throw new NotFoundException('Documento no encontrado.');
    }
    return documento;
  }

  async eliminarAdicional(id: string): Promise<void> {
    const result = await this.adicionales.delete(id);
    if (!result.affected) {
      throw new NotFoundException('Documento no encontrado.');
    }
  }
}
