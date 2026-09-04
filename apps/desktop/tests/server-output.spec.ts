import { describe, expect, it } from 'vitest'
import { findWebUrl } from '../src/server-output.ts'

describe('desktop dsh web output', () => {
  it('extracts the authenticated loopback URL', () => {
    expect(findWebUrl('dsh web: http://127.0.0.1:43125/?token=abc_DEF-123\n'))
      .toBe('http://127.0.0.1:43125/?token=abc_DEF-123')
  })

  it('waits for a complete token', () => {
    expect(findWebUrl('dsh web: http://127.0.0.1:43125/')).toBeUndefined()
  })
})
