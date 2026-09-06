import { describe, it, expect, afterEach } from 'vitest'
import { mount, DOMWrapper, type VueWrapper } from '@vue/test-utils'
import GestionModal from './GestionModal.vue'

// AppModal teletransporta su contenido a document.body, que no se limpia solo entre tests —
// hay que desmontar explícitamente al final de cada uno para no arrastrar el modal anterior.
const body = () => new DOMWrapper(document.body)
let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

const historialBase = [
  { id: 'g1', nota: 'Llamada inicial', proximoSeguimiento: '2026-10-01', createdAt: '2026-09-01T00:00:00.000Z' },
]

describe('GestionModal', () => {
  it('muestra el historial recibido', () => {
    wrapper = mount(GestionModal, {
      props: { title: 'Gestión — Andes Minerals', historial: historialBase, cargando: false, guardando: false },
    })

    expect(body().text()).toContain('Llamada inicial')
  })

  it('muestra el estado vacío cuando no hay historial', () => {
    wrapper = mount(GestionModal, {
      props: { title: 'Gestión', historial: [], cargando: false, guardando: false },
    })

    expect(body().text()).toContain('Todavía no hay gestión registrada.')
  })

  it('emite guardar con la nota y el próximo seguimiento, y limpia el formulario', async () => {
    wrapper = mount(GestionModal, {
      props: { title: 'Gestión', historial: [], cargando: false, guardando: false },
    })

    await body().find('textarea').setValue('Se envió propuesta')
    await body().find('input[type="date"]').setValue('2026-10-15')
    await body().find('button[type="button"]').trigger('click')

    expect(wrapper.emitted('guardar')).toEqual([['Se envió propuesta', '2026-10-15']])
    expect((body().find('textarea').element as HTMLTextAreaElement).value).toBe('')
  })

  it('no emite guardar si la nota está vacía', async () => {
    wrapper = mount(GestionModal, {
      props: { title: 'Gestión', historial: [], cargando: false, guardando: false },
    })

    await body().find('button[type="button"]').trigger('click')

    expect(wrapper.emitted('guardar')).toBeUndefined()
  })

  it('emite close al cerrar el modal', async () => {
    wrapper = mount(GestionModal, {
      props: { title: 'Gestión', historial: [], cargando: false, guardando: false },
    })

    await body().find('button[aria-label="Cerrar"]').trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
