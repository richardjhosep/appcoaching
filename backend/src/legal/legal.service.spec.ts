import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { LegalService } from './legal.service';
import { DocumentoLegal } from './entities/documento-legal.entity';
import { DocumentoAdicionalLegal } from './entities/documento-adicional-legal.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Coachee } from '../coachees/entities/coachee.entity';
import { TipoDocumentoLegal } from './enums/tipo-documento-legal.enum';
import { EstadoDocumentoLegal } from './enums/estado-documento-legal.enum';
import { validarPdfSubido } from '../common/file-type-filter.util';

jest.mock('../common/file-type-filter.util', () => ({
  validarPdfSubido: jest.fn(),
}));

type PartialDocumento = Partial<DocumentoLegal>;
type PartialAdicional = Partial<DocumentoAdicionalLegal>;

describe('LegalService', () => {
  let service: LegalService;
  let documentosRepo: {
    findOne: jest.Mock;
    create: jest.Mock<PartialDocumento, [PartialDocumento]>;
    save: jest.Mock;
    find: jest.Mock;
  };
  let adicionalesRepo: {
    findOne: jest.Mock;
    create: jest.Mock<PartialAdicional, [PartialAdicional]>;
    save: jest.Mock;
    find: jest.Mock;
    delete: jest.Mock;
  };
  let empresasRepo: { find: jest.Mock };
  let coacheesRepo: { find: jest.Mock; findOne: jest.Mock };

  beforeEach(() => {
    jest.mocked(validarPdfSubido).mockResolvedValue(undefined);
    documentosRepo = {
      findOne: jest.fn(),
      create: jest.fn((data: PartialDocumento) => data),
      save: jest.fn((data: PartialDocumento) =>
        Promise.resolve({ id: 'generated-id', ...data }),
      ),
      find: jest.fn().mockResolvedValue([]),
    };
    adicionalesRepo = {
      findOne: jest.fn(),
      create: jest.fn((data: PartialAdicional) => data),
      save: jest.fn((data: PartialAdicional) =>
        Promise.resolve({ id: 'adicional-id', ...data }),
      ),
      find: jest.fn().mockResolvedValue([]),
      delete: jest.fn(),
    };
    empresasRepo = { find: jest.fn().mockResolvedValue([]) };
    coacheesRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
    };

    service = new LegalService(
      documentosRepo as unknown as Repository<DocumentoLegal>,
      adicionalesRepo as unknown as Repository<DocumentoAdicionalLegal>,
      empresasRepo as unknown as Repository<Empresa>,
      coacheesRepo as unknown as Repository<Coachee>,
    );
  });

  describe('upsertDocumento', () => {
    it('creates a new document for an empresa when none exists yet', async () => {
      documentosRepo.findOne.mockResolvedValue(null);

      const doc = await service.upsertDocumento(
        { empresaId: 'e1' },
        TipoDocumentoLegal.NDA,
        {
          estado: EstadoDocumentoLegal.FIRMADO,
          fecha: '2026-01-01',
        },
      );

      expect(doc.empresaId).toBe('e1');
      expect(doc.coacheeId).toBeNull();
      expect(doc.tipo).toBe(TipoDocumentoLegal.NDA);
      expect(doc.estado).toBe(EstadoDocumentoLegal.FIRMADO);
      expect(doc.fecha).toBe('2026-01-01');
    });

    it('creates a new document for an independiente coachee when none exists yet', async () => {
      documentosRepo.findOne.mockResolvedValue(null);

      const doc = await service.upsertDocumento(
        { coacheeId: 'c1' },
        TipoDocumentoLegal.CONTRATO,
        {
          estado: EstadoDocumentoLegal.PENDIENTE,
        },
      );

      expect(doc.coacheeId).toBe('c1');
      expect(doc.empresaId).toBeNull();
      expect(documentosRepo.findOne).toHaveBeenCalledWith({
        where: { coacheeId: 'c1', tipo: TipoDocumentoLegal.CONTRATO },
      });
    });

    it('rejects when both empresaId and coacheeId are given', async () => {
      await expect(
        service.upsertDocumento(
          { empresaId: 'e1', coacheeId: 'c1' },
          TipoDocumentoLegal.NDA,
          { estado: EstadoDocumentoLegal.FIRMADO },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when neither empresaId nor coacheeId is given', async () => {
      await expect(
        service.upsertDocumento({}, TipoDocumentoLegal.NDA, {
          estado: EstadoDocumentoLegal.FIRMADO,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('updates the existing document in place instead of duplicating it', async () => {
      const existente = {
        id: 'd1',
        empresaId: 'e1',
        tipo: TipoDocumentoLegal.CONTRATO,
        estado: EstadoDocumentoLegal.PENDIENTE,
      };
      documentosRepo.findOne.mockResolvedValue(existente);

      const doc = await service.upsertDocumento(
        { empresaId: 'e1' },
        TipoDocumentoLegal.CONTRATO,
        {
          estado: EstadoDocumentoLegal.FIRMADO,
        },
      );

      expect(doc.id).toBe('d1');
      expect(doc.estado).toBe(EstadoDocumentoLegal.FIRMADO);
      expect(documentosRepo.create).not.toHaveBeenCalled();
    });

    it('stores the uploaded file path/name when an archivo is provided', async () => {
      documentosRepo.findOne.mockResolvedValue(null);

      const doc = await service.upsertDocumento(
        { empresaId: 'e1' },
        TipoDocumentoLegal.NDA,
        { estado: EstadoDocumentoLegal.FIRMADO },
        {
          filename: 'uuid-1234.pdf',
          originalname: 'nda-firmado.pdf',
        } as Express.Multer.File,
      );

      expect(doc.archivoPath).toBe('uuid-1234.pdf');
      expect(doc.archivoNombre).toBe('nda-firmado.pdf');
      expect(validarPdfSubido).toHaveBeenCalledWith(
        expect.objectContaining({ filename: 'uuid-1234.pdf' }),
        expect.any(String),
      );
    });

    it('rejects the upload and never saves when the file is not really a PDF', async () => {
      documentosRepo.findOne.mockResolvedValue(null);
      jest
        .mocked(validarPdfSubido)
        .mockRejectedValue(
          new BadRequestException('El archivo no es un PDF válido.'),
        );

      await expect(
        service.upsertDocumento(
          { empresaId: 'e1' },
          TipoDocumentoLegal.NDA,
          { estado: EstadoDocumentoLegal.FIRMADO },
          {
            filename: 'uuid-evil.pdf',
            originalname: 'nda.pdf',
          } as Express.Multer.File,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(documentosRepo.save).not.toHaveBeenCalled();
    });

    it('keeps the existing archivo when the caller only updates estado/fechas', async () => {
      documentosRepo.findOne.mockResolvedValue({
        id: 'd1',
        empresaId: 'e1',
        tipo: TipoDocumentoLegal.NDA,
        estado: EstadoDocumentoLegal.FIRMADO,
        archivoPath: 'existing.pdf',
        archivoNombre: 'existing.pdf',
      });

      const doc = await service.upsertDocumento(
        { empresaId: 'e1' },
        TipoDocumentoLegal.NDA,
        {
          estado: EstadoDocumentoLegal.FIRMADO,
          vigencia: '2027-01-01',
        },
      );

      expect(doc.archivoPath).toBe('existing.pdf');
    });
  });

  describe('resumen', () => {
    it('defaults contrato/nda to pendiente when no document exists yet', async () => {
      empresasRepo.find.mockResolvedValue([{ id: 'e1', nombre: 'Empresa A' }]);

      const { empresas } = await service.resumen();

      expect(empresas[0].contrato.estado).toBe(EstadoDocumentoLegal.PENDIENTE);
      expect(empresas[0].nda.estado).toBe(EstadoDocumentoLegal.PENDIENTE);
      expect(empresas[0].contrato.tieneArchivo).toBe(false);
    });

    it('reports tieneArchivo true only when the document has an archivoPath', async () => {
      empresasRepo.find.mockResolvedValue([{ id: 'e1', nombre: 'Empresa A' }]);
      documentosRepo.find.mockResolvedValue([
        {
          empresaId: 'e1',
          tipo: TipoDocumentoLegal.NDA,
          estado: EstadoDocumentoLegal.FIRMADO,
          archivoPath: 'firmado.pdf',
        },
      ]);

      const { empresas } = await service.resumen();

      expect(empresas[0].nda.tieneArchivo).toBe(true);
      expect(empresas[0].contrato.tieneArchivo).toBe(false);
    });

    it('passes through createdAt for empresas and independientes, used to prioritize by age', async () => {
      const empresaCreatedAt = new Date('2025-01-01');
      const coacheeCreatedAt = new Date('2024-06-01');
      empresasRepo.find.mockResolvedValue([
        { id: 'e1', nombre: 'Empresa A', createdAt: empresaCreatedAt },
      ]);
      coacheesRepo.find.mockResolvedValue([
        {
          id: 'c1',
          nombre: 'Independiente Uno',
          empresaId: null,
          consentimientoInformado: false,
          createdAt: coacheeCreatedAt,
        },
      ]);

      const { empresas, independientes } = await service.resumen();

      expect(empresas[0].createdAt).toBe(empresaCreatedAt);
      expect(independientes[0].createdAt).toBe(coacheeCreatedAt);
    });

    it('counts coachees with consentimiento por empresa', async () => {
      empresasRepo.find.mockResolvedValue([{ id: 'e1', nombre: 'Empresa A' }]);
      coacheesRepo.find.mockResolvedValue([
        {
          id: 'c1',
          nombre: 'Uno',
          empresaId: 'e1',
          consentimientoInformado: true,
        },
        {
          id: 'c2',
          nombre: 'Dos',
          empresaId: 'e1',
          consentimientoInformado: false,
        },
        {
          id: 'c3',
          nombre: 'Tres',
          empresaId: 'other',
          consentimientoInformado: true,
        },
      ]);

      const { empresas } = await service.resumen();

      expect(empresas[0].coacheesTotal).toBe(2);
      expect(empresas[0].coacheesConConsentimiento).toBe(1);
    });

    it('lists coachees without empresaId as independientes with their own contrato/nda', async () => {
      coacheesRepo.find.mockResolvedValue([
        {
          id: 'c1',
          nombre: 'Independiente Uno',
          empresaId: null,
          consentimientoInformado: true,
        },
        {
          id: 'c2',
          nombre: 'Con Empresa',
          empresaId: 'e1',
          consentimientoInformado: false,
        },
      ]);
      documentosRepo.find.mockResolvedValue([
        {
          coacheeId: 'c1',
          tipo: TipoDocumentoLegal.CONTRATO,
          estado: EstadoDocumentoLegal.FIRMADO,
          archivoPath: 'acuerdo.pdf',
        },
      ]);

      const { independientes } = await service.resumen();

      expect(independientes).toHaveLength(1);
      expect(independientes[0].coacheeId).toBe('c1');
      expect(independientes[0].nombre).toBe('Independiente Uno');
      expect(independientes[0].contrato.estado).toBe(
        EstadoDocumentoLegal.FIRMADO,
      );
      expect(independientes[0].contrato.tieneArchivo).toBe(true);
      expect(independientes[0].nda.estado).toBe(EstadoDocumentoLegal.PENDIENTE);
      expect(independientes[0].consentimientoInformado).toBe(true);
    });
  });

  describe('cumplimiento', () => {
    it('marks consentimiento_informado as inactive when not every coachee has signed', async () => {
      coacheesRepo.find.mockResolvedValue([
        { consentimientoInformado: true },
        { consentimientoInformado: false },
      ]);

      const medidas = await service.cumplimiento();
      const consentimiento = medidas.find(
        (m) => m.id === 'consentimiento_informado',
      )!;

      expect(consentimiento.activa).toBe(false);
      expect(consentimiento.descripcion).toContain('1 de 2');
    });

    it('marks consentimiento_informado as active when every coachee has signed', async () => {
      coacheesRepo.find.mockResolvedValue([
        { consentimientoInformado: true },
        { consentimientoInformado: true },
      ]);

      const medidas = await service.cumplimiento();
      const consentimiento = medidas.find(
        (m) => m.id === 'consentimiento_informado',
      )!;

      expect(consentimiento.activa).toBe(true);
    });

    it('always reports the architectural measures as active', async () => {
      const medidas = await service.cumplimiento();

      expect(medidas.find((m) => m.id === 'notas_privadas')!.activa).toBe(true);
      expect(
        medidas.find((m) => m.id === 'contacto_autogestionado')!.activa,
      ).toBe(true);
      expect(
        medidas.find((m) => m.id === 'datos_agregados_empresa')!.activa,
      ).toBe(true);
    });
  });

  describe('obtenerArchivo', () => {
    it('returns the empresa document with its archivo fields', async () => {
      documentosRepo.findOne.mockResolvedValue({
        archivoPath: 'firmado.pdf',
        archivoNombre: 'contrato.pdf',
      });

      const documento = await service.obtenerArchivo(
        { empresaId: 'e1' },
        TipoDocumentoLegal.CONTRATO,
      );

      expect(documento?.archivoNombre).toBe('contrato.pdf');
      expect(documentosRepo.findOne).toHaveBeenCalledWith({
        where: { empresaId: 'e1', tipo: TipoDocumentoLegal.CONTRATO },
      });
    });

    it('rejects an ambiguous target', async () => {
      await expect(
        service.obtenerArchivo({}, TipoDocumentoLegal.CONTRATO),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('misDocumentos', () => {
    it('resuelve al documento de la EMPRESA cuando el coachee pertenece a una', async () => {
      coacheesRepo.findOne.mockResolvedValue({
        id: 'c1',
        userId: 'user-1',
        empresaId: 'empresa-1',
      });
      documentosRepo.findOne.mockImplementation(
        ({
          where,
        }: {
          where: { empresaId?: string; tipo: TipoDocumentoLegal };
        }) =>
          Promise.resolve(
            where.empresaId === 'empresa-1' &&
              where.tipo === TipoDocumentoLegal.CONTRATO
              ? {
                  estado: EstadoDocumentoLegal.FIRMADO,
                  archivoPath: 'contrato-empresa.pdf',
                }
              : null,
          ),
      );

      const resultado = await service.misDocumentos('user-1');

      expect(resultado.alcance).toBe('empresa');
      expect(resultado.contrato.estado).toBe(EstadoDocumentoLegal.FIRMADO);
      expect(resultado.contrato.tieneArchivo).toBe(true);
      expect(documentosRepo.findOne).toHaveBeenCalledWith({
        where: { empresaId: 'empresa-1', tipo: TipoDocumentoLegal.CONTRATO },
      });
    });

    it('resuelve al documento PROPIO cuando el coachee es independiente', async () => {
      coacheesRepo.findOne.mockResolvedValue({
        id: 'c2',
        userId: 'user-2',
        empresaId: null,
      });
      documentosRepo.findOne.mockResolvedValue(null);

      const resultado = await service.misDocumentos('user-2');

      expect(resultado.alcance).toBe('individual');
      expect(documentosRepo.findOne).toHaveBeenCalledWith({
        where: { coacheeId: 'c2', tipo: TipoDocumentoLegal.CONTRATO },
      });
      expect(documentosRepo.findOne).toHaveBeenCalledWith({
        where: { coacheeId: 'c2', tipo: TipoDocumentoLegal.NDA },
      });
    });

    it('lanza NotFoundException si el actor no tiene perfil de coachee', async () => {
      coacheesRepo.findOne.mockResolvedValue(null);

      await expect(service.misDocumentos('user-x')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('obtenerArchivoPropio', () => {
    it('nunca cruza al documento de otro coachee', async () => {
      coacheesRepo.findOne.mockResolvedValue({
        id: 'c1',
        userId: 'user-1',
        empresaId: null,
      });
      documentosRepo.findOne.mockResolvedValue({
        archivoPath: 'mi-contrato.pdf',
      });

      await service.obtenerArchivoPropio('user-1', TipoDocumentoLegal.CONTRATO);

      expect(documentosRepo.findOne).toHaveBeenCalledWith({
        where: { coacheeId: 'c1', tipo: TipoDocumentoLegal.CONTRATO },
      });
    });
  });

  describe('adicionales', () => {
    it('rejects subirAdicional when the target is ambiguous', async () => {
      await expect(
        service.subirAdicional(
          {},
          'Correo de aprobación',
          {} as Express.Multer.File,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects subirAdicional without an archivo', async () => {
      await expect(
        service.subirAdicional(
          { empresaId: 'e1' },
          'Correo de aprobación',
          undefined as unknown as Express.Multer.File,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('stores an adicional attached to an empresa', async () => {
      const documento = await service.subirAdicional(
        { empresaId: 'e1' },
        'Correo de aprobación',
        {
          filename: 'uuid-9.pdf',
          originalname: 'correo.pdf',
        } as Express.Multer.File,
      );

      expect(documento.empresaId).toBe('e1');
      expect(documento.coacheeId).toBeNull();
      expect(documento.titulo).toBe('Correo de aprobación');
      expect(documento.archivoNombre).toBe('correo.pdf');
      expect(validarPdfSubido).toHaveBeenCalled();
    });

    it('rejects subirAdicional and never saves when the file is not really a PDF', async () => {
      jest
        .mocked(validarPdfSubido)
        .mockRejectedValue(
          new BadRequestException('El archivo no es un PDF válido.'),
        );

      await expect(
        service.subirAdicional({ empresaId: 'e1' }, 'Correo de aprobación', {
          filename: 'uuid-evil.pdf',
          originalname: 'correo.pdf',
        } as Express.Multer.File),
      ).rejects.toThrow(BadRequestException);
      expect(adicionalesRepo.save).not.toHaveBeenCalled();
    });

    it('stores an adicional attached to a coachee', async () => {
      const documento = await service.subirAdicional(
        { coacheeId: 'c1' },
        'Addendum',
        {
          filename: 'uuid-8.pdf',
          originalname: 'addendum.pdf',
        } as Express.Multer.File,
      );

      expect(documento.coacheeId).toBe('c1');
      expect(documento.empresaId).toBeNull();
    });

    it('lists adicionales ordered by most recent first', async () => {
      adicionalesRepo.find.mockResolvedValue([
        {
          id: 'a1',
          empresaId: 'e1',
          coacheeId: null,
          titulo: 'Correo',
          archivoNombre: 'correo.pdf',
          createdAt: new Date('2026-01-01'),
        },
      ]);

      const lista = await service.listarAdicionales();

      expect(adicionalesRepo.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(lista).toHaveLength(1);
      expect(lista[0].titulo).toBe('Correo');
    });

    it('throws NotFoundException when eliminarAdicional targets a missing row', async () => {
      adicionalesRepo.delete.mockResolvedValue({ affected: 0 });

      await expect(service.eliminarAdicional('gone')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deletes an existing adicional', async () => {
      adicionalesRepo.delete.mockResolvedValue({ affected: 1 });

      await expect(service.eliminarAdicional('a1')).resolves.toBeUndefined();
      expect(adicionalesRepo.delete).toHaveBeenCalledWith('a1');
    });
  });
});
