/** Device-neutral Desktop input registry, gesture recognition, and action dispatch. */

import { randomUUID } from 'node:crypto'
import { Context, Service } from '@deepseek-ai/cordis'
import { brandString, type Branded } from '@deepseek-ai/dsh-brand'

/** Opaque semantic action identifier. */
export type InputActionId = Branded<'InputActionId'>

/** Opaque connected-device identifier owned by an input provider. */
export type InputDeviceId = Branded<'InputDeviceId'>

/** Opaque physical control identifier owned by an input provider. */
export type InputControlId = Branded<'InputControlId'>

/** Opaque identity of one registered physical-to-semantic mapping. */
export type InputBindingId = Branded<'InputBindingId'>

/** Stable identity of one physical press cycle. */
export type InputPressId = Branded<'InputPressId'>

/**
 * Validate and brand one semantic action identifier.
 * @param value - Candidate action id.
 * @returns The branded action id.
 */
export function InputActionId(value: string): InputActionId {
  if (!/^[a-z0-9][a-z0-9.-]{0,95}$/.test(value)) throw new Error(`invalid input action id: ${value}`)
  return brandString<InputActionId>(value)
}

/**
 * Brand one provider-owned device identity.
 * @param value - Non-empty provider identity.
 * @returns The branded device id.
 */
export function InputDeviceId(value: string): InputDeviceId {
  if (value.length === 0) throw new Error('input device id must not be empty')
  return brandString<InputDeviceId>(value)
}

/**
 * Brand one provider-owned physical control identity.
 * @param value - Non-empty provider control identity.
 * @returns The branded control id.
 */
export function InputControlId(value: string): InputControlId {
  if (value.length === 0) throw new Error('input control id must not be empty')
  return brandString<InputControlId>(value)
}

/**
 * Validate and brand one binding identity.
 * @param value - Candidate binding id.
 * @returns The branded binding id.
 */
export function InputBindingId(value: string): InputBindingId {
  if (!/^[a-z0-9][a-z0-9.-]{0,95}$/.test(value)) throw new Error(`invalid input binding id: ${value}`)
  return brandString<InputBindingId>(value)
}

/** Normalized event published by an installed Desktop input provider. */
export type DesktopInputEvent =
  | { readonly type: 'button'; readonly deviceId: InputDeviceId; readonly controlId: InputControlId; readonly pressed: boolean }
  | { readonly type: 'disconnected'; readonly deviceId: InputDeviceId }

/** Source information retained for a complete physical press. */
export interface InputSource {
  readonly kind: 'mouse' | 'keyboard'
  readonly deviceId: InputDeviceId
  readonly controlId: InputControlId
}

/** Semantic event delivered after a registered press or hold gesture is recognized. */
export interface InputActionEvent {
  readonly pressId: InputPressId
  readonly gesture: 'press' | 'hold'
  readonly phase: 'trigger' | 'release' | 'cancel'
  readonly heldMs: number
  readonly source: InputSource
}

/** One business feature's handler for a semantic action. */
export type InputActionHandler = (event: InputActionEvent) => void | Promise<void>

/** One dynamically registered physical-input mapping. */
export type InputBinding = {
  readonly id: InputBindingId
  readonly deviceId: InputDeviceId | '*'
  readonly controlId: InputControlId
  readonly gesture: 'press'
  readonly actionId: InputActionId
} | {
  readonly id: InputBindingId
  readonly deviceId: InputDeviceId | '*'
  readonly controlId: InputControlId
  readonly gesture: 'hold'
  readonly actionId: InputActionId
  readonly holdMs: number
}

interface ActiveHold {
  readonly binding: InputBinding
  triggered: boolean
  readonly timer: NodeJS.Timeout
}

interface ActivePress {
  readonly pressId: InputPressId
  readonly source: InputSource
  readonly startedAt: number
  readonly presses: readonly InputBinding[]
  readonly holds: readonly ActiveHold[]
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    desktopInput: DesktopInput
  }
}

/** Shared Desktop input service; providers publish controls and business plugins own mappings. */
export default class DesktopInput extends Service {
  private readonly actions = new Map<InputActionId, InputActionHandler>()
  private readonly bindings = new Map<InputBindingId, InputBinding>()
  private readonly active = new Map<string, ActivePress>()

  constructor(ctx: Context) {
    super(ctx, 'desktopInput')
    ctx.effect(() => () => { this.cancelAll() }, 'desktop-input: active presses')
  }

  /**
   * Register one semantic action until the returned disposer runs.
   * @param id - Unique semantic action id.
   * @param handler - Action event handler.
   * @returns The idempotent registration disposer.
   */
  registerAction(id: InputActionId, handler: InputActionHandler): () => void {
    if (this.actions.has(id)) throw new Error(`input action already registered: ${id}`)
    this.actions.set(id, handler)
    return () => {
      if (this.actions.get(id) === handler) this.actions.delete(id)
    }
  }

  /**
   * Register one binding contribution without replacing other business plugins' mappings.
   * @param binding - Physical control to semantic action mapping.
   * @returns The idempotent registration disposer.
   */
  registerBinding(binding: InputBinding): () => void {
    if (binding.gesture === 'hold' && (!Number.isSafeInteger(binding.holdMs) || binding.holdMs < 0)) {
      throw new Error('input binding holdMs must be a non-negative integer')
    }
    if (this.bindings.has(binding.id)) throw new Error(`input binding already registered: ${binding.id}`)
    this.bindings.set(binding.id, binding)
    return () => {
      if (this.bindings.get(binding.id) !== binding) return
      this.bindings.delete(binding.id)
      this.cancelBindings(binding.id)
    }
  }

  /**
   * Publish one normalized provider event. Action failures are contained.
   * @param event - Provider event to recognize and dispatch.
   */
  publish(event: DesktopInputEvent): void {
    if (event.type === 'disconnected') {
      this.cancelDevice(event.deviceId)
      return
    }
    const key = this.keyOf(event.deviceId, event.controlId)
    if (!event.pressed) {
      this.release(key)
      return
    }
    if (this.active.has(key)) return
    const matched = [...this.bindings.values()].filter(binding =>
      (binding.deviceId === '*' || binding.deviceId === event.deviceId)
      && binding.controlId === event.controlId,
    )
    if (matched.length === 0) return
    const pressId = brandString<InputPressId>(randomUUID())
    const source: InputSource = { kind: 'mouse', deviceId: event.deviceId, controlId: event.controlId }
    const startedAt = Date.now()
    const holds = matched.filter(binding => binding.gesture === 'hold').map((binding) => {
      const hold: ActiveHold = {
        binding,
        triggered: false,
        timer: setTimeout(() => {
          hold.triggered = true
          this.dispatch(binding.actionId, { pressId, gesture: 'hold', phase: 'trigger', heldMs: Date.now() - startedAt, source })
        }, binding.holdMs),
      }
      return hold
    })
    this.active.set(key, {
      pressId,
      source,
      startedAt,
      presses: matched.filter(binding => binding.gesture === 'press'),
      holds,
    })
  }

  private keyOf(deviceId: InputDeviceId, controlId: InputControlId): string {
    return `${deviceId}\0${controlId}`
  }

  private release(key: string): void {
    const active = this.active.get(key)
    if (active === undefined) return
    this.active.delete(key)
    for (const hold of active.holds) clearTimeout(hold.timer)
    const heldMs = Math.max(0, Date.now() - active.startedAt)
    const triggeredHolds = active.holds.filter(hold => hold.triggered)
    if (triggeredHolds.length === 0) {
      for (const binding of active.presses) {
        this.dispatch(binding.actionId, { pressId: active.pressId, gesture: 'press', phase: 'trigger', heldMs, source: active.source })
      }
      return
    }
    for (const hold of triggeredHolds) {
      this.dispatch(hold.binding.actionId, { pressId: active.pressId, gesture: 'hold', phase: 'release', heldMs, source: active.source })
    }
  }

  private cancelBindings(bindingId: InputBindingId): void {
    for (const [key, active] of this.active) {
      if (!active.presses.some(binding => binding.id === bindingId)
        && !active.holds.some(hold => hold.binding.id === bindingId)) continue
      this.cancel(key, active)
    }
  }

  private cancelDevice(deviceId: InputDeviceId): void {
    const prefix = `${deviceId}\0`
    for (const [key, active] of this.active) if (key.startsWith(prefix)) this.cancel(key, active)
  }

  private cancelAll(): void {
    for (const [key, active] of this.active) this.cancel(key, active)
  }

  private cancel(key: string, active: ActivePress): void {
    this.active.delete(key)
    for (const hold of active.holds) {
      clearTimeout(hold.timer)
      if (!hold.triggered) continue
      this.dispatch(hold.binding.actionId, {
        pressId: active.pressId,
        gesture: 'hold',
        phase: 'cancel',
        heldMs: Math.max(0, Date.now() - active.startedAt),
        source: active.source,
      })
    }
  }

  private dispatch(actionId: InputActionId, event: InputActionEvent): void {
    const handler = this.actions.get(actionId)
    if (handler === undefined) {
      this.ctx.logger.warn(`input action is unavailable: ${actionId}`)
      return
    }
    void Promise.resolve(handler(event)).catch((error: unknown) => { this.ctx.logger.warn(error) })
  }
}
