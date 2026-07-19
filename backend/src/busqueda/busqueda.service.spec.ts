import { Repository } from 'typeorm';
import { BusquedaService } from './busqueda.service';
import { Coachee } from '../coachees/entities/coachee.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Competencia } from '../competencias/entities/competencia.entity';
import { Recurso } from '../recursos/entities/recurso.entity';

describe('BusquedaService', () => {
  let service: BusquedaService;
  let coacheesRepo: { find: jest.Mock };
  let empresasRepo: { find: jest.Mock };
  let competenciasRepo: { find: jest.Mock };
  let recursosRepo: { find: jest.Mock };

  beforeEach(() => {
    coacheesRepo = { find: jest.fn().mockResolvedValue([]) };
    empresasRepo = { find: jest.fn().mockResolvedValue([]) };
    competenciasRepo = { find: jest.fn().mockResolvedValue([]) };
    recursosRepo = { find: jest.fn().mockResolvedValue([]) };

    service = new BusquedaService(
      coacheesRepo as unknown as Repository<Coachee>,
      empresasRepo as unknown as Repository<Empresa>,
      competenciasRepo as unknown as Repository<Competencia>,
      recursosRepo as unknown as Repository<Recurso>,
    );
  });

  it('returns empty results for a blank query without hitting the database', async () => {
    const resultado = await service.buscar('   ');

    expect(resultado).toEqual({
      coachees: [],
      empresas: [],
      competencias: [],
      recursos: [],
    });
    expect(coacheesRepo.find).not.toHaveBeenCalled();
  });

  it('maps results from all four entities', async () => {
    coacheesRepo.find.mockResolvedValue([{ id: 'c1', nombre: 'Camila Rojas' }]);
    empresasRepo.find.mockResolvedValue([
      { id: 'e1', nombre: 'Andes Minerals' },
    ]);
    competenciasRepo.find.mockResolvedValue([
      { id: 'k1', nombre: 'Comunicación' },
    ]);
    recursosRepo.find.mockResolvedValue([
      { id: 'r1', titulo: 'Manual de liderazgo' },
    ]);

    const resultado = await service.buscar('a');

    expect(resultado.coachees).toEqual([{ id: 'c1', nombre: 'Camila Rojas' }]);
    expect(resultado.empresas).toEqual([
      { id: 'e1', nombre: 'Andes Minerals' },
    ]);
    expect(resultado.competencias).toEqual([
      { id: 'k1', nombre: 'Comunicación' },
    ]);
    expect(resultado.recursos).toEqual([
      { id: 'r1', titulo: 'Manual de liderazgo' },
    ]);
  });
});
