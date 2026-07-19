import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CicloView from './CicloView.vue'
import type { Ciclo } from '../../api/ciclos'
import type { Coachee } from '../../api/coachees'

vi.mock('../../api/ciclos', async () => {
  const actual = await vi.importActual<typeof import('../../api/ciclos')>('../../api/ciclos')
  return {
    ...actual,
    abrirCiclo: vi.fn(),
    getCicloActualDeCoachee: vi.fn(),
    getCiclosDeCoachee: vi.fn(),
  }
})
vi.mock('../../api/coachees', async () => {
  const actual = await vi.importActual<typeof import('../../api/coachees')>('../../api/coachees')
  return { ...actual, getCoachee: vi.fn() }
})

import { getCicloActualDeCoachee, getCiclosDeCoachee } from '../../api/ciclos'
import { getCoachee } from '../../api/coachees'

const coacheeBase: Coachee = {
  id: 'coachee-1',
  nombre: 'Coachee Uno',
  empresaId: null,
  telefono: null,
  emailContacto: null,
}

const cicloAbierto: Ciclo = {
  id: 'c1',
  coacheeId: 'coachee-1',
  totalSesiones: 10,
  fechaApertura: '2026-01-01T00:00:00.000Z',
  fechaCierre: null,
  resultado: null,
  resumenReunionInicial: 'Reunión inicial.',
  informeFinal: null,
  informePdfNombre: null,
  informePdfPath: null,
  sesionesRealizadas: 3,
  sesionesRestantes: 7,
  alertaPorVencer: false,
}

describe('CicloView (coach)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getCoachee).mockResolvedValue(coacheeBase)
    vi.mocked(getCiclosDeCoachee).mockResolvedValue([])
  })

  it('shows the "abrir ciclo" form when there is no open cycle', async () => {
    vi.mocked(getCicloActualDeCoachee).mockResolvedValue(null)

    const wrapper = mount(CicloView, { props: { coacheeId: 'coachee-1' } })
    await flushPromises()

    expect(wrapper.text()).toContain('Abrir nuevo ciclo')
    expect(wrapper.text()).not.toContain('Cerrar ciclo con resultado')
  })

  it('shows the management panel when a cycle is already open', async () => {
    vi.mocked(getCicloActualDeCoachee).mockResolvedValue(cicloAbierto)

    const wrapper = mount(CicloView, { props: { coacheeId: 'coachee-1' } })
    await flushPromises()

    expect(wrapper.text()).not.toContain('Abrir nuevo ciclo')
    expect(wrapper.text()).toContain('Cerrar ciclo con resultado')
    expect(wrapper.text()).toContain('3')
  })
})
