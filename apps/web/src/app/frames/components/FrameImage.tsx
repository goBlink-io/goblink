/* eslint-disable @next/next/no-img-element */
/**
 * FrameImage — JSX components for Satori/ImageResponse OG image generation.
 * These return React elements compatible with next/og's ImageResponse.
 *
 * Satori constraints: inline styles only, display:flex required, no Tailwind.
 */

const BG_GRADIENT = 'linear-gradient(135deg, #09090b 0%, #1a1045 50%, #09090b 100%)';
const ACCENT = '#a78bfa';   // violet-400
const BLUE = '#60a5fa';     // blue-400
const MUTED = '#a1a1aa';    // zinc-400
const WHITE = '#fafafa';

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
      <span style={{ fontSize: '28px' }}>&#9889;</span>
      <span style={{ fontSize: '26px', fontWeight: 700, color: ACCENT }}>goBlink</span>
    </div>
  );
}

function PoweredBy() {
  return (
    <div style={{ display: 'flex', marginTop: '40px', fontSize: '18px', color: MUTED }}>
      Powered by NEAR Intents &middot; 12+ chains
    </div>
  );
}

export function PayFrameImage({
  to,
  amount,
  token,
  chain,
}: {
  to: string;
  amount: string;
  token: string;
  chain: string;
}) {
  const shortTo = to.length > 12 ? `${to.slice(0, 6)}\u2026${to.slice(-4)}` : to;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: BG_GRADIENT,
        color: WHITE,
        fontFamily: 'sans-serif',
        padding: '60px',
      }}
    >
      <Logo />
      <div style={{ fontSize: '30px', color: MUTED, marginBottom: '12px', display: 'flex' }}>
        Pay
      </div>
      <div style={{ fontSize: '72px', fontWeight: 800, marginBottom: '20px', display: 'flex' }}>
        {amount} {token}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '26px', color: MUTED }}>
        <span>to</span>
        <span style={{ color: WHITE, fontWeight: 600 }}>{shortTo}</span>
        <span>on</span>
        <span style={{ color: BLUE, fontWeight: 600 }}>{chain}</span>
      </div>
      <PoweredBy />
    </div>
  );
}

export function TipFrameImage({
  to,
  token,
  chain,
}: {
  to: string;
  token: string;
  chain: string;
}) {
  const shortTo = to.length > 12 ? `${to.slice(0, 6)}\u2026${to.slice(-4)}` : to;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: BG_GRADIENT,
        color: WHITE,
        fontFamily: 'sans-serif',
        padding: '60px',
      }}
    >
      <Logo />
      <div style={{ fontSize: '30px', color: MUTED, marginBottom: '8px', display: 'flex' }}>
        Send a tip to
      </div>
      <div style={{ fontSize: '48px', fontWeight: 800, marginBottom: '24px', display: 'flex' }}>
        {shortTo}
      </div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            padding: '14px 36px',
            borderRadius: '12px',
            background: 'rgba(96, 165, 250, 0.12)',
            border: '1px solid rgba(96, 165, 250, 0.3)',
            fontSize: '26px',
            fontWeight: 600,
            color: BLUE,
          }}
        >
          $1
        </div>
        <div
          style={{
            display: 'flex',
            padding: '14px 36px',
            borderRadius: '12px',
            background: 'rgba(96, 165, 250, 0.12)',
            border: '1px solid rgba(96, 165, 250, 0.3)',
            fontSize: '26px',
            fontWeight: 600,
            color: BLUE,
          }}
        >
          $5
        </div>
        <div
          style={{
            display: 'flex',
            padding: '14px 36px',
            borderRadius: '12px',
            background: 'rgba(96, 165, 250, 0.12)',
            border: '1px solid rgba(96, 165, 250, 0.3)',
            fontSize: '26px',
            fontWeight: 600,
            color: BLUE,
          }}
        >
          $10
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '22px', color: MUTED }}>
        <span>{token}</span>
        <span>on</span>
        <span style={{ color: BLUE }}>{chain}</span>
      </div>
      <PoweredBy />
    </div>
  );
}
