import { Context } from '@deepseek-ai/cordis'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DesktopInput, {
  InputActionId,
  InputBindingId,
  InputControlId,
  InputDeviceId,
} from '../src/index.ts'

describe('DesktopInput', () => {
  afterEach(() => { vi.useRealTimers() })

  it('dispatches a short press only after release', async () => {
    vi.useFakeTimers()
    const ctx = new Context()
    const fiber = ctx.plugin(DesktopInput)
    await fiber.await()
    const events: string[] = []
    ctx.desktopInput.registerAction(InputActionId('screenshot.capture'), (event) => {
      events.push(`${event.gesture}:${event.phase}`)
    })
    ctx.desktopInput.registerBinding({
      id: InputBindingId('screenshot.default'),
      deviceId: '*',
      controlId: InputControlId('mimouse.screenshot'),
      gesture: 'press',
      actionId: InputActionId('screenshot.capture'),
    })
    const deviceId = InputDeviceId('mimouse:test')
    const controlId = InputControlId('mimouse.screenshot')

    ctx.desktopInput.publish({ type: 'button', deviceId, controlId, pressed: true })
    expect(events).toEqual([])
    await vi.advanceTimersByTimeAsync(200)
    ctx.desktopInput.publish({ type: 'button', deviceId, controlId, pressed: false })
    await Promise.resolve()
    expect(events).toEqual(['press:trigger'])
    await fiber.dispose()
  })

  it('routes a hold independently and cancels it when the device disconnects', async () => {
    vi.useFakeTimers()
    const ctx = new Context()
    const fiber = ctx.plugin(DesktopInput)
    await fiber.await()
    const events: string[] = []
    ctx.desktopInput.registerAction(InputActionId('screenshot.voice'), (event) => {
      events.push(`${event.gesture}:${event.phase}`)
    })
    ctx.desktopInput.registerBinding({
      id: InputBindingId('screenshot.voice'),
      deviceId: '*',
      controlId: InputControlId('mimouse.screenshot'),
      gesture: 'hold',
      actionId: InputActionId('screenshot.voice'),
      holdMs: 500,
    })
    const deviceId = InputDeviceId('mimouse:test')
    const controlId = InputControlId('mimouse.screenshot')

    ctx.desktopInput.publish({ type: 'button', deviceId, controlId, pressed: true })
    await vi.advanceTimersByTimeAsync(500)
    ctx.desktopInput.publish({ type: 'disconnected', deviceId })
    await Promise.resolve()
    expect(events).toEqual(['hold:trigger', 'hold:cancel'])
    await fiber.dispose()
  })

  it('removes action and binding registrations with their owners', async () => {
    const ctx = new Context()
    const fiber = ctx.plugin(DesktopInput)
    await fiber.await()
    const handler = vi.fn()
    const disposeAction = ctx.desktopInput.registerAction(InputActionId('screenshot.capture'), handler)
    const disposeBinding = ctx.desktopInput.registerBinding({
      id: InputBindingId('screenshot.default'),
      deviceId: '*',
      controlId: InputControlId('mimouse.screenshot'),
      gesture: 'press',
      actionId: InputActionId('screenshot.capture'),
    })
    disposeBinding()
    disposeAction()
    const deviceId = InputDeviceId('mimouse:test')
    const controlId = InputControlId('mimouse.screenshot')
    ctx.desktopInput.publish({ type: 'button', deviceId, controlId, pressed: true })
    ctx.desktopInput.publish({ type: 'button', deviceId, controlId, pressed: false })
    await Promise.resolve()
    expect(handler).not.toHaveBeenCalled()
    await fiber.dispose()
  })
})
