import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../api/client', () => ({ apiDownload: vi.fn() }))

import { apiDownload } from '../api/client'
import { verArchivo } from './verArchivo'

describe('verArchivo', () => {
  const pestana = { location: { href: '' }, close: vi.fn() }

  beforeEach(() => {
    pestana.location.href = ''
    pestana.close.mockReset()
    vi.mocked(apiDownload).mockReset()
    vi.spyOn(window, 'open').mockReturnValue(pestana as unknown as Window)
    URL.createObjectURL = vi.fn(() => 'blob:fake')
    URL.revokeObjectURL = vi.fn()
  })

  it('opens previewable files (PDF) in the tab opened before the request', async () => {
    vi.mocked(apiDownload).mockResolvedValue(new Blob(['x'], { type: 'application/pdf' }))

    await verArchivo('/x/archivo', 'a.pdf')

    expect(window.open).toHaveBeenCalledWith('', '_blank')
    expect(pestana.location.href).toBe('blob:fake')
    expect(pestana.close).not.toHaveBeenCalled()
  })

  it('closes the tab and downloads files the browser cannot preview', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    vi.mocked(apiDownload).mockResolvedValue(
      new Blob(['x'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
    )

    await verArchivo('/x/archivo', 'a.docx')

    expect(pestana.close).toHaveBeenCalled()
    expect(click).toHaveBeenCalled()
  })

  it('closes the blank tab when the request fails', async () => {
    vi.mocked(apiDownload).mockRejectedValue(new Error('403'))

    await expect(verArchivo('/x/archivo', 'a.pdf')).rejects.toThrow('403')
    expect(pestana.close).toHaveBeenCalled()
  })
})
