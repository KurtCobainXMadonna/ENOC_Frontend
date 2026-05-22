import { render } from '@testing-library/react'
import type { ComponentType } from 'react'
import { describe, expect, it } from 'vitest'
import { Icon } from '../shared/components/Icon'

describe('Icon', () => {
  it('renderiza cada variante como un svg independiente', () => {
    for (const [, IconComponent] of Object.entries(Icon)) {
      const CurrentIcon = IconComponent as ComponentType
      const { container, unmount } = render(<CurrentIcon />)

      expect(container.querySelector('svg')).toBeInTheDocument()
      expect(container.querySelector('svg')).toHaveAttribute('width')
      expect(container.querySelector('svg')).toHaveAttribute('height')

      unmount()
    }
  })
})