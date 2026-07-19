import { Repository } from 'typeorm';
import { LegalService } from './legal.service';
import { DocumentoLegal } from './entities/documento-legal.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Coachee } from '../coachees/entities/coachee.entity';
import { TipoDocumentoLegal } from './enums/tipo-documento-legal.enum';
import { EstadoDocumentoLegal } from './enums/estado-documento-legal.enum';

type PartialDocumento = Partial<DocumentoLegal>;

describe('LegalService', () => {
  let service: LegalService;
  let documentosRepo: {
    findOne: jest.Mock;
    create: jest.Mock<PartialDocumento, [PartialDocumento]>;
    save: jest.Mock;
    find: jest.Mock;
  };
  let empresasRepo: { find: jest.Mock };
  let coacheesRepo: { find: jest.Mock };

  beforeEach(() => {
    documentosRepo = {
      findOne: jest.fn(),
      create: jest.fn((data: PartialDocumento) => data),
      save: jest.fn((data: PartialDocumento) =>
        Promise.resolve({ id: 'generated-id', ...data }),
      ),
      find: jest.fn().mockResolvedValue([]),
    };
    empresasRepo = { find: jest.fn().mockResolvedValue([]) };
    coacheesRepo = { find: jest.fn().mockResolvedValue([]) };

    service = new LegalService(
      documentosRepo as unknown as Repository<DocumentoLegal>,
      empresasRepo as unknown as Repository<Empresa>,
      coacheesRepo as unknown as Repository<Coachee>,
    );
  });

  describe('upsertDocumento', () => {
    it('creates a new document when none exists for that empresa/tipo', async () => {
      documentosRepo.findOne.mockResolvedValue(null);

      const doc = await service.upsertDocumento('e1', TipoDocumentoLegal.NDA, {
        estado: EstadoDocumentoLegal.FIRMADO,
        fecha: '2026-01-01',
      });

      expect(doc.empresaId).toBe('e1');
      expect(doc.tipo).toBe(TipoDocumentoLegal.NDA);
      expect(doc.estado).toBe(EstadoDocumentoLegal.FIRMADO);
      expect(doc.fecha).toBe('2026-01-01');
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
        'e1',
        TipoDocumentoLegal.CONTRATO,
        {
          estado: EstadoDocumentoLegal.FIRMADO,
        },
      );

      expect(doc.id).toBe('d1');
      expect(doc.estado).toBe(EstadoDocumentoLegal.FIRMADO);
      expect(documentosRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('resumen', () => {
    it('defaults contrato/nda to pendiente when no document exists yet', async () => {
      empresasRepo.find.mockResolvedValue([{ id: 'e1', nombre: 'Empresa A' }]);

      const resumen = await service.resumen();

      expect(resumen[0].contrato.estado).toBe(EstadoDocumentoLegal.PENDIENTE);
      expect(resumen[0].nda.estado).toBe(EstadoDocumentoLegal.PENDIENTE);
    });

    it('counts coachees with consentimiento por empresa', async () => {
      empresasRepo.find.mockResolvedValue([{ id: 'e1', nombre: 'Empresa A' }]);
      coacheesRepo.find.mockResolvedValue([
        { id: 'c1', empresaId: 'e1', consentimientoInformado: true },
        { id: 'c2', empresaId: 'e1', consentimientoInformado: false },
        { id: 'c3', empresaId: 'other', consentimientoInformado: true },
      ]);

      const resumen = await service.resumen();

      expect(resumen[0].coacheesTotal).toBe(2);
      expect(resumen[0].coacheesConConsentimiento).toBe(1);
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
});
