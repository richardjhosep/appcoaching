import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { ProspectosService } from './prospectos.service';
import { Prospecto } from './entities/prospecto.entity';
import { GestionProspecto } from './entities/gestion-prospecto.entity';
import { EtapaProspecto } from './enums/etapa-prospecto.enum';
import { TipoProspecto } from './enums/tipo-prospecto.enum';
import { EmpresasService } from '../empresas/empresas.service';
import { CoacheesService } from '../coachees/coachees.service';

type PartialProspecto = Partial<Prospecto>;
type PartialGestion = Partial<GestionProspecto>;

describe('ProspectosService', () => {
  let service: ProspectosService;
  let repo: {
    findOne: jest.Mock<Promise<PartialProspecto | null>, unknown[]>;
    find: jest.Mock<Promise<PartialProspecto[]>, unknown[]>;
    create: jest.Mock<PartialProspecto, [PartialProspecto]>;
    save: jest.Mock<Promise<PartialProspecto>, [PartialProspecto]>;
    remove: jest.Mock<Promise<PartialProspecto>, [PartialProspecto]>;
  };
  let gestionesRepo: {
    find: jest.Mock<Promise<PartialGestion[]>, unknown[]>;
    create: jest.Mock<PartialGestion, [PartialGestion]>;
    save: jest.Mock<Promise<PartialGestion>, [PartialGestion]>;
  };
  let empresasService: { create: jest.Mock };
  let coacheesService: { create: jest.Mock };

  beforeEach(() => {
    repo = {
      findOne: jest.fn<Promise<PartialProspecto | null>, unknown[]>(),
      find: jest
        .fn<Promise<PartialProspecto[]>, unknown[]>()
        .mockResolvedValue([]),
      create: jest.fn((data: PartialProspecto) => data),
      save: jest.fn((data: PartialProspecto) =>
        Promise.resolve({ id: 'generated-id', ...data }),
      ),
      remove: jest.fn((data: PartialProspecto) => Promise.resolve(data)),
    };
    gestionesRepo = {
      find: jest
        .fn<Promise<PartialGestion[]>, unknown[]>()
        .mockResolvedValue([]),
      create: jest.fn((data: PartialGestion) => data),
      save: jest.fn((data: PartialGestion) =>
        Promise.resolve({ id: 'gestion-generated-id', ...data }),
      ),
    };
    empresasService = { create: jest.fn() };
    coacheesService = { create: jest.fn() };
    service = new ProspectosService(
      repo as unknown as Repository<Prospecto>,
      gestionesRepo as unknown as Repository<GestionProspecto>,
      empresasService as unknown as EmpresasService,
      coacheesService as unknown as CoacheesService,
    );
  });

  describe('create', () => {
    it('crea un prospecto con etapa contactado por defecto', async () => {
      const prospecto = await service.create({
        nombre: 'Minera Andes',
        tipo: TipoProspecto.EMPRESA,
      });

      expect(prospecto.nombre).toBe('Minera Andes');
    });
  });

  describe('findAll', () => {
    it('agrega el próximo seguimiento a partir de la última entrada de bitácora', async () => {
      repo.find.mockResolvedValue([
        { id: 'p1', nombre: 'Minera Andes' },
        { id: 'p2', nombre: 'Juan Pérez' },
      ]);
      gestionesRepo.find.mockResolvedValue([
        {
          id: 'g2',
          prospectoId: 'p1',
          proximoSeguimiento: '2026-10-15',
          createdAt: '2026-09-10',
        },
        {
          id: 'g1',
          prospectoId: 'p1',
          proximoSeguimiento: '2026-09-20',
          createdAt: '2026-09-01',
        },
      ]);

      const lista = await service.findAll();

      expect(lista.find((p) => p.id === 'p1')?.proximoSeguimiento).toBe(
        '2026-10-15',
      );
      expect(lista.find((p) => p.id === 'p2')?.proximoSeguimiento).toBeNull();
    });
  });

  describe('findById', () => {
    it('lanza NotFoundException si no existe', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('eliminar', () => {
    it('elimina un prospecto que nunca se convirtió', async () => {
      repo.findOne.mockResolvedValue({ id: 'p1', nombre: 'Minera Andes' });

      const nombre = await service.eliminar('p1');

      expect(nombre).toBe('Minera Andes');
      expect(repo.remove).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'p1' }),
      );
    });

    it('rechaza eliminar un prospecto ya convertido en empresa', async () => {
      repo.findOne.mockResolvedValue({
        id: 'p1',
        nombre: 'Minera Andes',
        convertidoEmpresaId: 'e1',
      });

      await expect(service.eliminar('p1')).rejects.toThrow(ConflictException);
      expect(repo.remove).not.toHaveBeenCalled();
    });
  });

  describe('crearGestion', () => {
    it('agrega una nota de seguimiento', async () => {
      repo.findOne.mockResolvedValue({ id: 'p1', nombre: 'Minera Andes' });

      const gestion = await service.crearGestion('p1', {
        nota: 'Llamada agendada',
        proximoSeguimiento: '2026-10-01',
      });

      expect(gestion).toEqual(
        expect.objectContaining({
          prospectoId: 'p1',
          nota: 'Llamada agendada',
          proximoSeguimiento: '2026-10-01',
        }),
      );
    });
  });

  describe('convertirAEmpresa', () => {
    it('crea la empresa y marca el prospecto como ganado', async () => {
      repo.findOne.mockResolvedValue({
        id: 'p1',
        nombre: 'Minera Andes',
        etapa: EtapaProspecto.NEGOCIACION,
      });
      empresasService.create.mockResolvedValue({
        id: 'e1',
        nombre: 'Minera Andes',
      });

      const empresa = await service.convertirAEmpresa('p1', {
        nombre: 'Minera Andes',
        tarifaHora: 45000,
      });

      expect(empresa.id).toBe('e1');
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          etapa: EtapaProspecto.GANADO,
          convertidoEmpresaId: 'e1',
        }),
      );
    });

    it('rechaza convertir un prospecto ya cerrado', async () => {
      repo.findOne.mockResolvedValue({
        id: 'p1',
        nombre: 'Minera Andes',
        etapa: EtapaProspecto.GANADO,
      });

      await expect(
        service.convertirAEmpresa('p1', {
          nombre: 'Minera Andes',
          tarifaHora: 45000,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(empresasService.create).not.toHaveBeenCalled();
    });
  });

  describe('convertirACoachee', () => {
    it('crea el coachee y marca el prospecto como ganado', async () => {
      repo.findOne.mockResolvedValue({
        id: 'p2',
        nombre: 'Juan Pérez',
        etapa: EtapaProspecto.PROPUESTA_ENVIADA,
      });
      coacheesService.create.mockResolvedValue({
        coachee: { id: 'c1', nombre: 'Juan Pérez' },
        temporaryPassword: 'temp123',
      });

      const resultado = await service.convertirACoachee('p2', {
        nombre: 'Juan Pérez',
        email: 'juan@test.com',
      });

      expect(resultado.coachee.id).toBe('c1');
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          etapa: EtapaProspecto.GANADO,
          convertidoCoacheeId: 'c1',
        }),
      );
    });
  });

  describe('marcarPerdido', () => {
    it('marca el prospecto como perdido y registra el motivo', async () => {
      repo.findOne.mockResolvedValue({
        id: 'p1',
        nombre: 'Minera Andes',
        etapa: EtapaProspecto.CONTACTADO,
      });

      await service.marcarPerdido('p1', 'Eligió a otro coach');

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ etapa: EtapaProspecto.PERDIDO }),
      );
      expect(gestionesRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ nota: 'Perdido: Eligió a otro coach' }),
      );
    });
  });

  describe('pipelinePonderado', () => {
    it('suma el valor estimado ponderado por probabilidad de las etapas abiertas', async () => {
      repo.find.mockResolvedValue([
        { etapa: EtapaProspecto.CONTACTADO, valorEstimado: 1000000 },
        { etapa: EtapaProspecto.PROPUESTA_ENVIADA, valorEstimado: 2000000 },
        { etapa: EtapaProspecto.NEGOCIACION, valorEstimado: 1000000 },
      ]);

      const total = await service.pipelinePonderado();

      // 1.000.000*0.1 + 2.000.000*0.4 + 1.000.000*0.65 = 100.000 + 800.000 + 650.000
      expect(total).toBe(1550000);
    });

    it('devuelve 0 cuando no hay prospectos abiertos', async () => {
      repo.find.mockResolvedValue([]);

      expect(await service.pipelinePonderado()).toBe(0);
    });
  });
});
