import { describe, it, expect } from 'vitest'
import { tipoIconoDe } from './tipoRecurso'
import type { Recurso } from '../api/recursos'

function archivo(nombre: string): Recurso {
  return {
    id: 'r1',
    titulo: 't',
    descripcion: null,
    etiquetas: null,
    tipo: 'archivo',
    url: null,
    archivoNombre: nombre,
    archivoPath: '/x',
    createdAt: '2026-01-01T00:00:00.000Z',
  }
}

function link(url: string): Recurso {
  return {
    id: 'r1',
    titulo: 't',
    descripcion: null,
    etiquetas: null,
    tipo: 'link',
    url,
    archivoNombre: null,
    archivoPath: null,
    createdAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('tipoIconoDe', () => {
  it('detects pdf', () => {
    expect(tipoIconoDe(archivo('informe.pdf'))).toBe('pdf')
  })

  it('detects word (doc/docx)', () => {
    expect(tipoIconoDe(archivo('plan.docx'))).toBe('word')
    expect(tipoIconoDe(archivo('plan.doc'))).toBe('word')
  })

  it('detects excel (xls/xlsx/csv)', () => {
    expect(tipoIconoDe(archivo('datos.xlsx'))).toBe('excel')
    expect(tipoIconoDe(archivo('datos.csv'))).toBe('excel')
  })

  it('detects video files by extension', () => {
    expect(tipoIconoDe(archivo('sesion.mp4'))).toBe('video')
  })

  it('falls back to archivo for unknown extensions', () => {
    expect(tipoIconoDe(archivo('nota.txt'))).toBe('archivo')
    expect(tipoIconoDe(archivo('sin-extension'))).toBe('archivo')
  })

  it('detects youtube links as video', () => {
    expect(tipoIconoDe(link('https://www.youtube.com/watch?v=abc'))).toBe('video')
    expect(tipoIconoDe(link('https://youtu.be/abc'))).toBe('video')
  })

  it('falls back to link for any other URL', () => {
    expect(tipoIconoDe(link('https://drive.google.com/file/d/abc'))).toBe('link')
  })
})
