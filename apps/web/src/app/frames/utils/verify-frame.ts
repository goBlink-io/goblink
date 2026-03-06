/**
 * Farcaster frame message verification utilities.
 *
 * TODO: When NEYNAR_API_KEY is configured, verify trustedData.messageBytes via
 * the Neynar API (POST https://api.neynar.com/v2/farcaster/frame/validate)
 * before trusting any data from the frame message body.
 *
 * For now: validate address format and log a warning that frame data is unverified.
 */

const EVM_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

/**
 * Validate and extract the payer address from a Farcaster frame body.
 * Returns null if the address is missing or obviously invalid.
 */
export function extractVerifiedAddress(body: Record<string, unknown>): string | null {
  const address = (body?.untrustedData as Record<string, unknown>)?.address;
  if (typeof address !== 'string' || !address) return null;

  // Farcaster Frames v1 only supports EVM addresses
  if (!EVM_ADDRESS_RE.test(address)) {
    console.warn('[FRAME_VERIFY] Invalid EVM address format from untrustedData:', address);
    return null;
  }

  // TODO: Verify trustedData.messageBytes when NEYNAR_API_KEY is available
  if (!process.env.NEYNAR_API_KEY) {
    console.warn('[FRAME_VERIFY] Frame data is UNVERIFIED — set NEYNAR_API_KEY to enable verification');
  }

  return address;
}

/**
 * Validate and extract inputText from a Farcaster frame body.
 * Returns empty string if missing.
 */
export function extractVerifiedInputText(body: Record<string, unknown>): string {
  const inputText = (body?.untrustedData as Record<string, unknown>)?.inputText;
  if (typeof inputText !== 'string') return '';

  // TODO: Verify trustedData.messageBytes when NEYNAR_API_KEY is available
  if (!process.env.NEYNAR_API_KEY) {
    console.warn('[FRAME_VERIFY] Frame data is UNVERIFIED — set NEYNAR_API_KEY to enable verification');
  }

  return inputText;
}
