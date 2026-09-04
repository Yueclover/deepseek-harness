import { useEffect, useRef, useState } from 'react'
import { Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { ScreenshotButtonInjected } from './index.ts'
import css from './ScreenshotButton.module.css'

/** Screenshot button state displayed beside the composer tools. */
export type ScreenshotButtonState = 'idle' | 'capturing' | 'cancelled' | 'sent' | 'failed'

/** Props supplied by the slot runtime and screenshot plugin. */
export type ScreenshotButtonProps = PropsRuntime<'conversation.input.left'> & InjectFace<ScreenshotButtonInjected> & PropsLocale<'screenshotAssistant'>

/** Desktop screenshot composer action with terminal status feedback. */
export function ScreenshotButton(props: ScreenshotButtonProps) {
  const [state, setState] = useState<ScreenshotButtonState>('idle')
  const [failure, setFailure] = useState<string | undefined>()
  const alive = useRef(true)
  useEffect(() => () => { alive.current = false }, [])

  const run = (): void => {
    if (state === 'capturing') return
    setState('capturing')
    setFailure(undefined)
    void props.capture(props.t('prompt')).then((result) => {
      if (!alive.current) return
      setState(result)
    }, (error: unknown) => {
      if (!alive.current) return
      setFailure(error instanceof Error ? error.message : String(error))
      setState('failed')
    })
  }
  const label = state === 'capturing' ? props.t('button.capturing') : props.t('button.label')
  const status = state === 'idle' || state === 'capturing' ? undefined : props.t(`status.${state}`)
  return <span className={css.wrap}>
    <Tooltip label={label} side="top" delayMs={500}>
      <button type="button" className={css.button} aria-label={label} disabled={state === 'capturing'} onClick={run}>
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden><path fill="currentColor" d="M6.7 3.5 5.8 5H3.5A1.5 1.5 0 0 0 2 6.5v8A1.5 1.5 0 0 0 3.5 16h13a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 16.5 5h-2.3l-.9-1.5H6.7ZM10 7a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Zm0 1.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/></svg>
      </button>
    </Tooltip>
    {status === undefined ? null : <span className={`${css.status} ${state === 'failed' ? css.error : ''}`} role="status" title={failure}>{status}</span>}
  </span>
}
