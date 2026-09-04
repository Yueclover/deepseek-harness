/** Extract the authenticated loopback URL printed by the dsh web profile. */

const WEB_URL = /https?:\/\/127\.0\.0\.1:\d+\/\?token=[A-Za-z0-9_-]+/

/**
 * Find the first complete dsh web URL in accumulated process output.
 * @param output - accumulated UTF-8 standard output from the dsh child process.
 * @returns authenticated URL when one is complete, otherwise undefined.
 */
export function findWebUrl(output: string): string | undefined {
  return WEB_URL.exec(output)?.[0]
}
