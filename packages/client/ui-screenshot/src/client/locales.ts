/** Composer screenshot dictionaries. */

/** Simplified Chinese dictionary and key source. */
export const zh = {
  'button.label': '截图并提问',
  'button.capturing': '正在截图',
  'status.cancelled': '已取消截图',
  'status.sent': '截图已发送',
  'status.failed': '截图发送失败',
  'prompt': '请分析这张截图。',
} satisfies Record<string, string>

/** Screenshot dictionary keys. */
export type ScreenshotUiKey = keyof typeof zh

/** English dictionary. */
export const en = {
  'button.label': 'Capture and ask',
  'button.capturing': 'Capturing screenshot',
  'status.cancelled': 'Screenshot cancelled',
  'status.sent': 'Screenshot sent',
  'status.failed': 'Screenshot failed',
  'prompt': 'Please analyze this screenshot.',
} satisfies Record<ScreenshotUiKey, string>
