import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CicloTab from './CicloTab.vue'
import type { Ciclo } from '../../../api/ciclos'

vi.mock('../../../api/ciclos', async () => {
  const actual = await vi.importActual<typeof import('../../../api/ciclos')>('../../../api/ciclos')
  return {
    ...actual,
    abrirCiclo: vi.fn(),
    getCicloActualDeCoachee: vi.fn(),
    getCiclosDeCoachee: vi.fn(),
    actualizarImpactoNegocio: vi.fn(),
    actualizarTotalSesiones: vi.fn(),
  }
})
vi.mock('../../../api/retroalimentacion', async () => {
  const actual = await vi.importActual<typeof import('../../../api/retroalimentacion')>('../../../api/retroalimentacion')
  return {
    ...actual,
    getRetroalimentacionesDeCoachee: vi.fn(),
  }
})

import { getCicloActualDeCoachee, getCiclosDeCoachee, actualizarImpactoNegocio, actualizarTotalSesiones } from '../../../api/ciclos'
import { getRetroalimentacionesDeCoachee } from '../../../api/retroalimentacion'

const cicloAbierto: Ciclo = {
  id: 'c1',
  coacheeId: 'coachee-1',
  totalSesiones: 10,
  fechaApertura: '2026-01-01T00:00:00.000Z',
  fechaCierre: null,
  resultado: null,
  resumenReunionInicial: 'Reunión inicial.',
  informeFinal: null,
  impactoNegocio: null,
  informePdfNombre: null,
  informePdfPath: null,
  sesionesRealizadas: 3,
  sesionesRestantes: 7,
  alertaPorVencer: false,
}

describe('CicloTab (coach)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getCiclosDeCoachee).mockResolvedValue([])
    vi.mocked(getRetroalimentacionesDeCoachee).mockResolvedValue([])
  })

  it('shows the "abrir ciclo" form when there is no open cycle', async () => {
    vi.mocked(getCicloActualDeCoachee).mockResolvedValue(null)

    const wrapper = mount(CicloTab, { props: { coacheeId: 'coachee-1' } })
    await flushPromises()

    expect(wrapper.text()).toContain('Abrir nuevo ciclo')
    expect(wrapper.text()).not.toContain('Cerrar ciclo con resultado')
  })

  it('shows the management panel when a cycle is already open', async () => {
    vi.mocked(getCicloActualDeCoachee).mockResolvedValue(cicloAbierto)

    const wrapper = mount(CicloTab, { props: { coacheeId: 'coachee-1' } })
    await flushPromises()

    expect(wrapper.text()).not.toContain('Abrir nuevo ciclo')
    expect(wrapper.text()).toContain('Cerrar ciclo con resultado')
    expect(wrapper.text()).toContain('3')
  })

  it('saves the impacto en el negocio separately from the informe', async () => {
    vi.mocked(getCicloActualDeCoachee).mockResolvedValue(cicloAbierto)
    vi.mocked(actualizarImpactoNegocio).mockResolvedValue({
      ...cicloAbierto,
      impactoNegocio: 'Redujo el tiempo de entrega en 20%.',
    })

    const wrapper = mount(CicloTab, { props: { coacheeId: 'coachee-1' } })
    await flushPromises()

    const textarea = wrapper.findAll('textarea').find((t) => t.attributes('placeholder')?.includes('redujo el tiempo'))
    await textarea!.setValue('Redujo el tiempo de entrega en 20%.')

    const guardarBtn = wrapper.findAll('button').find((b) => b.text() === 'Guardar impacto en el negocio')
    await guardarBtn!.trigger('click')
    await flushPromises()

    expect(actualizarImpactoNegocio).toHaveBeenCalledWith('c1', 'Redujo el tiempo de entrega en 20%.')
  })

  it('lets the coach edit totalSesiones, only showing Guardar once the value actually changed', async () => {
    vi.mocked(getCicloActualDeCoachee).mockResolvedValue(cicloAbierto)
    vi.mocked(actualizarTotalSesiones).mockResolvedValue({ ...cicloAbierto, totalSesiones: 12, sesionesRestantes: 9 })

    const wrapper = mount(CicloTab, { props: { coacheeId: 'coachee-1' } })
    await flushPromises()

    expect(wrapper.findAll('button').find((b) => b.text() === 'Guardar')).toBeUndefined()

    const input = wrapper.find('input[type="number"]')
    await input.setValue(12)

    const guardarBtn = wrapper.findAll('button').find((b) => b.text() === 'Guardar')
    await guardarBtn!.trigger('click')
    await flushPromises()

    expect(actualizarTotalSesiones).toHaveBeenCalledWith('c1', 12)
    // El botón "Guardar" desaparece de nuevo una vez que el valor del ciclo real
    // (ya actualizado a 12) vuelve a calzar con lo que muestra el input.
    expect(wrapper.findAll('button').find((b) => b.text() === 'Guardar')).toBeUndefined()
  })

  it('shows the server error and reverts the input when the new total is rejected', async () => {
    vi.mocked(getCicloActualDeCoachee).mockResolvedValue(cicloAbierto)
    vi.mocked(actualizarTotalSesiones).mockRejectedValue(new Error('rejected'))

    const wrapper = mount(CicloTab, { props: { coacheeId: 'coachee-1' } })
    await flushPromises()

    const input = wrapper.find('input[type="number"]')
    await input.setValue(1)
    const guardarBtn = wrapper.findAll('button').find((b) => b.text() === 'Guardar')
    await guardarBtn!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('No se pudo actualizar el número de sesiones.')
    expect((input.element as HTMLInputElement).value).toBe('10')
  })
})
