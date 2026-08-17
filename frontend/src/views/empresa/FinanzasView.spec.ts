import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import FinanzasView from './FinanzasView.vue'
import type { ResumenFinanzasEmpresa, ProyeccionMesEmpresa } from '../../api/negocio'

vi.mock('../../api/negocio', async () => {
  const actual = await vi.importActual<typeof import('../../api/negocio')>('../../api/negocio')
  return { ...actual, getMiResumenFinanciero: vi.fn(), getMiProyeccionFinanciera: vi.fn() }
})

import { getMiResumenFinanciero, getMiProyeccionFinanciera } from '../../api/negocio'

const resumenPendiente: ResumenFinanzasEmpresa = {
  pagada: false,
  horasContratadas: 40,
  horasConsumidas: 5,
  gastoDelPeriodo: 150000,
  gastoProyectado: 60000,
  gastoPendiente: 150000,
  porCoachee: [
    {
      coacheeId: 'c1',
      nombre: 'QA Paleta Verify',
      empresaNombre: 'QA Empresa Verify',
      horasRealizadas: 5,
      gastoBrutoDelPeriodo: 150000,
      gastoBrutoProyectado: 60000,
    },
  ],
}

const proyeccion: ProyeccionMesEmpresa[] = [
  { mes: '2026-08', etiqueta: "Ago '26", total: 210000, porCoachee: [{ nombre: 'QA Paleta Verify', monto: 210000 }] },
]

async function mountView() {
  const wrapper = mount(FinanzasView)
  await flushPromises()
  return wrapper
}

describe('FinanzasView (empresa)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getMiProyeccionFinanciera).mockResolvedValue(proyeccion)
  })

  it('shows gasto del período, horas and the "Pendiente" badge when not pagada', async () => {
    vi.mocked(getMiResumenFinanciero).mockResolvedValue(resumenPendiente)

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('$150.000')
    expect(wrapper.text()).toContain('5 / 40')
    expect(wrapper.text()).toContain('Pendiente')
  })

  it('shows the "Al día" badge and $0 pendiente once pagada', async () => {
    vi.mocked(getMiResumenFinanciero).mockResolvedValue({
      ...resumenPendiente,
      pagada: true,
      gastoPendiente: 0,
    })

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Al día')
    expect(wrapper.text()).toContain('$0')
  })

  it('lists gasto por coachee and the 6-month projection', async () => {
    vi.mocked(getMiResumenFinanciero).mockResolvedValue(resumenPendiente)

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('QA Paleta Verify')
    expect(wrapper.text()).toContain("Ago '26")
  })
})
