import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, DOMWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import ProspectosView from './ProspectosView.vue'
import type { Prospecto } from '../../api/prospectos'

vi.mock('../../api/prospectos', () => ({
  listProspectos: vi.fn(),
  createProspecto: vi.fn(),
  updateProspecto: vi.fn(),
  deleteProspecto: vi.fn(),
  crearGestionProspecto: vi.fn(),
  getGestionDeProspecto: vi.fn(),
  convertirAEmpresa: vi.fn(),
  convertirACoachee: vi.fn(),
  marcarPerdido: vi.fn(),
}))
vi.mock('../../api/configuracion', () => ({
  listarParametros: vi.fn(),
}))
vi.mock('../../lib/notify', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
  confirmDialog: vi.fn(),
}))

import {
  listProspectos,
  createProspecto,
  deleteProspecto,
  crearGestionProspecto,
  getGestionDeProspecto,
  convertirAEmpresa,
  convertirACoachee,
  marcarPerdido,
} from '../../api/prospectos'
import { listarParametros } from '../../api/configuracion'
import { confirmDialog } from '../../lib/notify'

const body = () => new DOMWrapper(document.body)

const prospectoEmpresa: Prospecto = {
  id: 'p1',
  nombre: 'Minera Andes',
  tipo: 'empresa',
  contactoNombre: 'Juan Soto',
  email: null,
  telefono: null,
  fuente: 'Referido',
  valorEstimado: 3000000,
  etapa: 'negociacion',
  notas: null,
  convertidoEmpresaId: null,
  convertidoCoacheeId: null,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  proximoSeguimiento: null,
}

const prospectoPersona: Prospecto = {
  id: 'p2',
  nombre: 'Juan Pérez',
  tipo: 'persona',
  contactoNombre: null,
  email: 'juan@test.com',
  telefono: null,
  fuente: 'LinkedIn',
  valorEstimado: null,
  etapa: 'contactado',
  notas: null,
  convertidoEmpresaId: null,
  convertidoCoacheeId: null,
  createdAt: '2026-09-02T00:00:00.000Z',
  updatedAt: '2026-09-02T00:00:00.000Z',
  proximoSeguimiento: null,
}

function crearRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/coach/empresas', component: { template: '<div />' } },
      { path: '/coach/coachees/:coacheeId', name: 'coach-coachee-detail', component: { template: '<div />' } },
    ],
  })
}

describe('ProspectosView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    vi.mocked(listProspectos).mockResolvedValue([prospectoEmpresa, prospectoPersona])
    vi.mocked(listarParametros).mockResolvedValue([
      { id: 'f1', grupo: 'FUENTES_PROSPECTO', clave: '1', valor: 'Referido', estado: true, createdAt: '', updatedAt: '' },
      { id: 'f2', grupo: 'FUENTES_PROSPECTO', clave: '2', valor: 'LinkedIn', estado: true, createdAt: '', updatedAt: '' },
    ])
    vi.mocked(confirmDialog).mockResolvedValue(true)
  })

  it('lists the prospectos with their etapa', async () => {
    const wrapper = mount(ProspectosView, { global: { plugins: [crearRouter()] } })
    await flushPromises()

    expect(wrapper.text()).toContain('Minera Andes')
    expect(wrapper.text()).toContain('Negociación')
    expect(wrapper.text()).toContain('Juan Pérez')
    expect(wrapper.text()).toContain('Contactado')
  })

  it('creates a prospecto with the entered fields', async () => {
    vi.mocked(createProspecto).mockResolvedValue({ ...prospectoEmpresa, id: 'p3', nombre: 'Ferronor' })
    const wrapper = mount(ProspectosView, { global: { plugins: [crearRouter()] } })
    await flushPromises()

    const nuevoBtn = wrapper.findAll('button').find((b) => b.text() === '+ Nuevo Prospecto')
    await nuevoBtn!.trigger('click')
    await flushPromises()

    await body().find('input[type="text"]').setValue('Ferronor')
    await body().find('form').trigger('submit')
    await flushPromises()

    expect(createProspecto).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Ferronor', tipo: 'empresa' }))
  })

  it('deletes a prospecto after confirming', async () => {
    vi.mocked(deleteProspecto).mockResolvedValue({ success: true })
    const wrapper = mount(ProspectosView, { global: { plugins: [crearRouter()] } })
    await flushPromises()

    const eliminarBtn = wrapper.findAll('button[title="Eliminar"]')[0]
    await eliminarBtn.trigger('click')
    await flushPromises()

    expect(deleteProspecto).toHaveBeenCalledWith('p1')
  })

  it('does not delete when the confirmation is dismissed', async () => {
    vi.mocked(confirmDialog).mockResolvedValue(false)
    const wrapper = mount(ProspectosView, { global: { plugins: [crearRouter()] } })
    await flushPromises()

    const eliminarBtn = wrapper.findAll('button[title="Eliminar"]')[0]
    await eliminarBtn.trigger('click')
    await flushPromises()

    expect(deleteProspecto).not.toHaveBeenCalled()
  })

  it('opens the gestión modal and registers a new note', async () => {
    vi.mocked(getGestionDeProspecto).mockResolvedValue([])
    vi.mocked(crearGestionProspecto).mockResolvedValue({
      id: 'g1',
      prospectoId: 'p1',
      nota: 'Llamada agendada',
      proximoSeguimiento: null,
      createdAt: '2026-09-05T00:00:00.000Z',
    })
    const wrapper = mount(ProspectosView, { global: { plugins: [crearRouter()] } })
    await flushPromises()

    const gestionarBtn = wrapper.findAll('button').find((b) => b.text() === 'Gestionar')
    await gestionarBtn!.trigger('click')
    await flushPromises()

    await body().find('textarea').setValue('Llamada agendada')
    await body().find('button[type="button"]').trigger('click')
    await flushPromises()

    expect(crearGestionProspecto).toHaveBeenCalledWith('p1', 'Llamada agendada', undefined)
  })

  it('marks a prospecto as perdido after confirming', async () => {
    vi.mocked(marcarPerdido).mockResolvedValue({ ...prospectoEmpresa, etapa: 'perdido' })
    const wrapper = mount(ProspectosView, { global: { plugins: [crearRouter()] } })
    await flushPromises()

    const perderBtn = wrapper.findAll('button').find((b) => b.text() === 'Perdido')
    await perderBtn!.trigger('click')
    await flushPromises()

    expect(marcarPerdido).toHaveBeenCalledWith('p1')
  })

  it('converts an empresa-type prospecto with the entered tarifa', async () => {
    vi.mocked(convertirAEmpresa).mockResolvedValue({
      id: 'e1',
      nombre: 'Minera Andes',
      tarifaHora: 45000,
      isActive: true,
      pagada: false,
      horasContratadas: null,
      fechaInicio: null,
      fechaFin: null,
    })
    const wrapper = mount(ProspectosView, { global: { plugins: [crearRouter()] } })
    await flushPromises()

    const ganadoBtn = wrapper.findAll('button').find((b) => b.text() === 'Ganado')
    await ganadoBtn!.trigger('click')
    await flushPromises()

    await body().find('input[type="number"]').setValue('45000')
    await body().find('form').trigger('submit')
    await flushPromises()

    expect(convertirAEmpresa).toHaveBeenCalledWith('p1', expect.objectContaining({ nombre: 'Minera Andes', tarifaHora: 45000 }))
  })

  it('converts a persona-type prospecto with the entered email', async () => {
    vi.mocked(convertirACoachee).mockResolvedValue({
      coachee: { id: 'c1', nombre: 'Juan Pérez', empresaId: null, consentimientoInformado: false, consentimientoFecha: null },
      temporaryPassword: null,
    })
    const wrapper = mount(ProspectosView, { global: { plugins: [crearRouter()] } })
    await flushPromises()

    const ganadoBtns = wrapper.findAll('button').filter((b) => b.text() === 'Ganado')
    await ganadoBtns[1].trigger('click')
    await flushPromises()

    await body().find('form').trigger('submit')
    await flushPromises()

    expect(convertirACoachee).toHaveBeenCalledWith('p2', expect.objectContaining({ nombre: 'Juan Pérez', email: 'juan@test.com' }))
  })

  it('filters by etapa', async () => {
    const wrapper = mount(ProspectosView, { global: { plugins: [crearRouter()] } })
    await flushPromises()

    await wrapper.find('select').setValue('contactado')
    await flushPromises()

    expect(wrapper.text()).toContain('Juan Pérez')
    expect(wrapper.text()).not.toContain('Minera Andes')
  })
})
