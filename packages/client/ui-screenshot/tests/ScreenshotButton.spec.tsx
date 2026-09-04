// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import { ScreenshotButton, type ScreenshotButtonProps } from '../src/client/ScreenshotButton.tsx'
import { en } from '../src/client/locales.ts'

afterEach(cleanup)

function props(capture: ScreenshotButtonProps['capture']): ScreenshotButtonProps {
  return { capture, t: makeTranslate(en) } as ScreenshotButtonProps
}

describe('ScreenshotButton', () => {
  it('prevents duplicate captures and reports a sent screenshot', async () => {
    let finish: ((value: 'sent') => void) | undefined
    const capture = vi.fn(() => new Promise<'sent'>((resolve) => { finish = resolve }))
    render(<ScreenshotButton {...props(capture)} />)

    const button = screen.getByRole('button', { name: en['button.label'] })
    fireEvent.click(button)
    fireEvent.click(button)
    expect(capture).toHaveBeenCalledOnce()
    expect(capture).toHaveBeenCalledWith(en.prompt)
    expect(screen.getByRole<HTMLButtonElement>('button', { name: en['button.capturing'] }).disabled).toBe(true)

    finish?.('sent')
    expect((await screen.findByRole('status')).textContent).toBe(en['status.sent'])
  })

  it('reports cancellation and failures without submitting another capture', async () => {
    const cancelled = vi.fn(async () => 'cancelled' as const)
    const view = render(<ScreenshotButton {...props(cancelled)} />)
    fireEvent.click(screen.getByRole('button', { name: en['button.label'] }))
    expect((await screen.findByRole('status')).textContent).toBe(en['status.cancelled'])

    const failed = vi.fn(async () => { throw new Error('bridge disconnected') })
    view.rerender(<ScreenshotButton {...props(failed)} />)
    fireEvent.click(screen.getByRole('button', { name: en['button.label'] }))
    const status = await screen.findByRole('status')
    expect(status.textContent).toBe(en['status.failed'])
    expect(status.getAttribute('title')).toBe('bridge disconnected')
  })
})
