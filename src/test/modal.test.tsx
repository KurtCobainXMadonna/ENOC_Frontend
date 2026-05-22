import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from '../shared/components/Modal'

describe('Modal', () => {
  it('no renderiza cuando open es false', () => {
    const onClose = vi.fn()
    const { container } = render(<Modal open={false} onClose={onClose} title="T">contenido</Modal>)
    expect(container.firstChild).toBeNull()
  })

  it('renderiza contenido y botón de cierre cuando open es true y maneja clicks', () => {
    const onClose = vi.fn()
    const { getByText, container } = render(<Modal open={true} onClose={onClose} title="Hola">Contenido</Modal>)

    expect(getByText('Hola')).toBeTruthy()
    expect(getByText('Contenido')).toBeTruthy()

    // click en backdrop debe llamar onClose
    fireEvent.click(container.firstChild as Element)
    expect(onClose).toHaveBeenCalled()
  })
})
