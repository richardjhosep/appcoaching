import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CuentaView from './CuentaView.vue'
import type { Coachee } from '../../api/coachees'
import type { MisDocumentosLegales } from '../../api/legal'
import type { MiInversion } from '../../api/negocio'

vi.mock('../../api/coachees', async () => {
  const actual = await vi.importActual<typeof import('../../api/coachees')>('../../api/coachees')
  return { ...actual, getMyCoachee: vi.fn() }
})
vi.mock('../../api/legal', async () => {
  const actual = await vi.importActual<typeof import('../../api/legal')>('../../api/legal')
  return { ...actual, getMisDocumentosLegales: vi.fn(), descargarMiAcuerdo: vi.fn() }
})
vi.mock('../../api/negocio', async () => {
  const actual = await vi.importActual<typeof import('../../api/negocio')>('../../api/negocio')
  return { ...actual, getMiInversion: vi.fn() }
})
vi.mock('../../lib/notify', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}))

import { getMyCoachee } from '../../api/coachees'
import { getMisDocumentosLegales, descargarMiAcuerdo } from '../../api/legal'
import { getMiInversion } from '../../api/negocio'

const coacheeEmpresa: Coachee = {
  id: 'c1',
  nombre: 'Ana Reagenda',
  empresaId: 'e1',
  telefono: null,
  emailContacto: null,
  fotoPath: null,
  fotoNombre: null,
  bio: null,
  compartirPerfilConCoach: false,
  consentimientoInformado: true,
  consentimientoFecha: null,
}

const coacheeIndependiente: Coachee = { ...coacheeEmpresa, id: 'c2', empresaId: null }

const documentosVacios: MisDocumentosLegales = {
  contrato: { estado: 'pendiente', fecha: null, vigencia: null, tieneArchivo: false },
  nda: { estado: 'pendiente', fecha: null, vigencia: null, tieneArchivo: false },
  alcance: 'empresa',
}

describe('CuentaView (coachee)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getMisDocumentosLegales).mockResolvedValue(documentosVacios)
  })

  it('shows a scope hint for an empresa-scoped contract', async () => {
    vi.mocked(getMyCoachee).mockResolvedValue(coacheeEmpresa)

    const wrapper = mount(CuentaView)
    await flushPromises()

    expect(wrapper.text()).toContain('Este es el contrato entre tu empresa y tu coach.')
    expect(wrapper.text()).toContain('Contrato')
    expect(wrapper.text()).toContain('NDA')
  })

  it('does not show "Mi inversión" for a coachee that belongs to an empresa', async () => {
    vi.mocked(getMyCoachee).mockResolvedValue(coacheeEmpresa)

    const wrapper = mount(CuentaView)
    await flushPromises()

    expect(wrapper.text()).not.toContain('Mi inversión')
    expect(getMiInversion).not.toHaveBeenCalled()
  })

  it('shows a download button when the document has a file, and downloads it on click', async () => {
    vi.mocked(getMyCoachee).mockResolvedValue(coacheeIndependiente)
    vi.mocked(getMisDocumentosLegales).mockResolvedValue({
      ...documentosVacios,
      alcance: 'individual',
      contrato: { estado: 'firmado', fecha: '2026-01-01', vigencia: null, tieneArchivo: true },
    })
    vi.mocked(getMiInversion).mockResolvedValue(null)

    const wrapper = mount(CuentaView)
    await flushPromises()

    expect(wrapper.text()).toContain('Tu contrato personal con tu coach.')
    const descargarBtn = wrapper.findAll('button').find((b) => b.text().includes('Descargar'))
    await descargarBtn!.trigger('click')

    expect(descargarMiAcuerdo).toHaveBeenCalledWith('contrato', 'Contrato.pdf')
  })

  it('shows "Mi inversión" with the período figures for an independent coachee', async () => {
    vi.mocked(getMyCoachee).mockResolvedValue(coacheeIndependiente)
    const inversion: MiInversion = {
      periodo: 'mes',
      horasRealizadas: 3,
      montoDelPeriodo: 120000,
      montoProyectado: 40000,
      tarifaPropia: 40000,
    }
    vi.mocked(getMiInversion).mockResolvedValue(inversion)

    const wrapper = mount(CuentaView)
    await flushPromises()

    expect(getMiInversion).toHaveBeenCalledWith('mes')
    expect(wrapper.text()).toContain('Mi inversión')
    expect(wrapper.text()).toContain('$120.000')
    expect(wrapper.text()).toContain('$40.000')
    expect(wrapper.text()).not.toContain('Pagado')
    expect(wrapper.text()).not.toContain('Pendiente de pago')
  })

  it('reloads "Mi inversión" when the período changes', async () => {
    vi.mocked(getMyCoachee).mockResolvedValue(coacheeIndependiente)
    vi.mocked(getMiInversion).mockResolvedValue({
      periodo: 'mes',
      horasRealizadas: 1,
      montoDelPeriodo: 40000,
      montoProyectado: 0,
      tarifaPropia: 40000,
    })

    const wrapper = mount(CuentaView)
    await flushPromises()

    const semestreBtn = wrapper.findAll('button').find((b) => b.text().includes('Semestre actual'))
    await semestreBtn!.trigger('click')
    await flushPromises()

    expect(getMiInversion).toHaveBeenCalledWith('semestre')
  })
})
