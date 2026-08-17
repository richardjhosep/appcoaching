import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, DOMWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import CicloView from './CicloView.vue'
import type { Coachee } from '../../api/coachees'
import type { Ciclo } from '../../api/ciclos'
import type { PlanDesarrollo } from '../../api/planesDesarrollo'

vi.mock('../../api/coachees', async () => {
  const actual = await vi.importActual<typeof import('../../api/coachees')>('../../api/coachees')
  return { ...actual, getCoachee: vi.fn() }
})
vi.mock('../../api/planesDesarrollo', async () => {
  const actual = await vi.importActual<typeof import('../../api/planesDesarrollo')>('../../api/planesDesarrollo')
  return { ...actual, getPlanByCoachee: vi.fn() }
})
vi.mock('../../api/ciclos', async () => {
  const actual = await vi.importActual<typeof import('../../api/ciclos')>('../../api/ciclos')
  return { ...actual, getCicloActualDeCoachee: vi.fn(), getCiclosDeCoachee: vi.fn() }
})
vi.mock('../../api/seguimiento', async () => {
  const actual = await vi.importActual<typeof import('../../api/seguimiento')>('../../api/seguimiento')
  return { ...actual, getAvanceDeCoachee: vi.fn() }
})

import { getCoachee } from '../../api/coachees'
import { getPlanByCoachee } from '../../api/planesDesarrollo'
import { getCicloActualDeCoachee, getCiclosDeCoachee } from '../../api/ciclos'
import { getAvanceDeCoachee } from '../../api/seguimiento'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/empresa/coachees', name: 'empresa-coachees', component: { template: '<div />' } },
    { path: '/empresa/coachees/:coacheeId/ciclos/:cicloId/certificado', name: 'empresa-certificado', component: { template: '<div />' } },
  ],
})

const coachee: Coachee = {
  id: 'coachee-1',
  nombre: 'QA Paleta Verify',
  empresaId: 'empresa-1',
  telefono: null,
  emailContacto: null,
  consentimientoInformado: true,
  consentimientoFecha: null,
}

const plan = {
  id: 'plan-1',
  coacheeId: 'coachee-1',
  competencia: { id: 'comp-1', nombre: 'Comunicación' },
  objetivoGeneral: 'Fortalecer la comunicación',
} as PlanDesarrollo

const cicloCerrado: Ciclo = {
  id: 'c1',
  coacheeId: 'coachee-1',
  totalSesiones: 10,
  fechaApertura: '2026-01-01T00:00:00.000Z',
  fechaCierre: '2026-03-01T00:00:00.000Z',
  resultado: 'logrado',
  resumenReunionInicial: null,
  informeFinal: null,
  informePdfNombre: null,
  informePdfPath: null,
  sesionesRealizadas: 10,
  sesionesRestantes: 0,
  alertaPorVencer: false,
}

async function mountView() {
  const wrapper = mount(CicloView, {
    props: { coacheeId: 'coachee-1' },
    global: { plugins: [router] },
  })
  await flushPromises()
  return wrapper
}

describe('CicloView (empresa)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getCoachee).mockResolvedValue(coachee)
    vi.mocked(getPlanByCoachee).mockResolvedValue(plan)
    vi.mocked(getCicloActualDeCoachee).mockResolvedValue(null)
  })

  it('shows the avance general bar', async () => {
    vi.mocked(getCiclosDeCoachee).mockResolvedValue([])
    vi.mocked(getAvanceDeCoachee).mockResolvedValue({ avance: 72 })

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('72%')
  })

  it('shows a certificate card with a working preview and a download link', async () => {
    vi.mocked(getCiclosDeCoachee).mockResolvedValue([cicloCerrado])
    vi.mocked(getAvanceDeCoachee).mockResolvedValue({ avance: 100 })

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Certificado de finalización')
    const descargarLink = wrapper.findAll('a').find((a) => a.text() === 'Descargar')
    expect(descargarLink?.attributes('href')).toBe('/empresa/coachees/coachee-1/ciclos/c1/certificado')

    const previewBtn = wrapper.findAll('button').find((b) => b.text() === 'Vista previa')
    await previewBtn!.trigger('click')
    await flushPromises()

    const modal = new DOMWrapper(document.body)
    expect(modal.text()).toContain('QA Paleta Verify')
    expect(modal.text()).toContain('Fortalecer la comunicación')
  })
})
