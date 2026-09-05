import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, DOMWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SatisfaccionView from './SatisfaccionView.vue'
import type { Encuesta, SolicitudProceso } from '../../api/satisfaccion'
import type { CoacheeListItem } from '../../api/coachees'
import type { Ciclo } from '../../api/ciclos'

vi.mock('../../api/satisfaccion', async () => {
  const actual = await vi.importActual<typeof import('../../api/satisfaccion')>('../../api/satisfaccion')
  return {
    ...actual,
    getMisEncuestas: vi.fn(),
    getMisSolicitudes: vi.fn(),
    crearEncuesta: vi.fn(),
    crearSolicitud: vi.fn(),
  }
})
vi.mock('../../api/configuracion', async () => {
  const actual = await vi.importActual<typeof import('../../api/configuracion')>('../../api/configuracion')
  return { ...actual, getCategoriasSatisfaccion: vi.fn() }
})
vi.mock('../../api/coachees', async () => {
  const actual = await vi.importActual<typeof import('../../api/coachees')>('../../api/coachees')
  return { ...actual, listCoachees: vi.fn() }
})
vi.mock('../../api/ciclos', async () => {
  const actual = await vi.importActual<typeof import('../../api/ciclos')>('../../api/ciclos')
  return { ...actual, getCiclosDeCoachee: vi.fn() }
})

import { getMisEncuestas, getMisSolicitudes, crearEncuesta } from '../../api/satisfaccion'
import { getCategoriasSatisfaccion } from '../../api/configuracion'
import { listCoachees } from '../../api/coachees'
import { getCiclosDeCoachee } from '../../api/ciclos'

const encuestaConCiclo: Encuesta = {
  id: 'enc-1',
  empresaId: 'e1',
  cicloId: 'ciclo-cerrado',
  respuestas: [{ categoria: 'Comunicación', valor: 5 }],
  calificacion: 5,
  comentario: 'Excelente',
  createdAt: '2026-07-01T00:00:00.000Z',
  ciclo: { id: 'ciclo-cerrado', fechaCierre: '2026-06-30T00:00:00.000Z', coachee: { id: 'c1', nombre: 'Felipe Cortes' } },
}

const solicitudes: SolicitudProceso[] = [
  { id: 'sol-1', empresaId: 'e1', nombreSugerido: 'Nuevo Coachee', mensaje: null, estado: 'pendiente', createdAt: '2026-07-02T00:00:00.000Z' },
]

const coachee: CoacheeListItem = {
  id: 'c1',
  nombre: 'Felipe Cortes',
  empresaId: 'e1',
  consentimientoInformado: true,
  consentimientoFecha: null,
}

const cicloPendiente: Ciclo = {
  id: 'ciclo-pendiente',
  coacheeId: 'c1',
  totalSesiones: 10,
  fechaApertura: '2026-01-01T00:00:00.000Z',
  fechaCierre: '2026-08-01T00:00:00.000Z',
  resultado: 'logrado',
  resumenReunionInicial: null,
  informeFinal: null,
  impactoNegocio: null,
  informePdfNombre: null,
  informePdfPath: null,
  sesionesRealizadas: 10,
  sesionesRestantes: 0,
  alertaPorVencer: false,
}

const cicloYaEncuestado: Ciclo = { ...cicloPendiente, id: 'ciclo-cerrado' }

async function mountView() {
  vi.mocked(getMisEncuestas).mockResolvedValue([encuestaConCiclo])
  vi.mocked(getMisSolicitudes).mockResolvedValue(solicitudes)
  vi.mocked(getCategoriasSatisfaccion).mockResolvedValue(['Comunicación', 'Cumplimiento'])
  vi.mocked(listCoachees).mockResolvedValue([coachee])
  vi.mocked(getCiclosDeCoachee).mockResolvedValue([cicloYaEncuestado, cicloPendiente])

  const wrapper = mount(SatisfaccionView)
  await flushPromises()
  return wrapper
}

describe('SatisfaccionView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('shows respondidas with per-categoria detail, and solicitudes', async () => {
    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Felipe Cortes')
    expect(wrapper.text()).toContain('Comunicación: 5/5')
    expect(wrapper.text()).toContain('Excelente')
    expect(wrapper.text()).toContain('Nuevo Coachee')
    expect(wrapper.text()).toContain('Pendiente')
  })

  it('lists a closed ciclo without an encuesta as pending, excluding the one already answered', async () => {
    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Completar encuesta')
    // Only one pending row — the already-answered ciclo-cerrado must not appear again as pending.
    expect(wrapper.findAll('button').filter((b) => b.text() === 'Completar encuesta')).toHaveLength(1)
  })

  it('submits an encuesta for the pending ciclo with a rating per categoria', async () => {
    vi.mocked(crearEncuesta).mockResolvedValue({ ...encuestaConCiclo, id: 'enc-2', cicloId: 'ciclo-pendiente' })
    const wrapper = await mountView()

    await wrapper.find('button').element // noop to ensure DOM settled
    const completarBtn = wrapper.findAll('button').find((b) => b.text() === 'Completar encuesta')
    await completarBtn!.trigger('click')
    await flushPromises()

    const modal = new DOMWrapper(document.body)
    const ratingButtons = modal.findAll('button').filter((b) => /^[1-5]$/.test(b.text()))
    // 2 categorías × 5 botones cada una — clic en "5" de la primera y "4" de la segunda.
    await ratingButtons[4].trigger('click')
    await ratingButtons[8].trigger('click')
    await modal.find('form').trigger('submit')
    await flushPromises()

    expect(crearEncuesta).toHaveBeenCalledWith(
      'ciclo-pendiente',
      [
        { categoria: 'Comunicación', valor: 5 },
        { categoria: 'Cumplimiento', valor: 4 },
      ],
      undefined,
    )
  })
})
