/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
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

// ─── Send Frame (Multi-step wizard) ───────────────────────────────────────────

const STEP_TITLES: Record<string, string> = {
  'start': 'Send, pay, or tip — any chain',
  'source-chain': 'Which chain are you paying from?',
  'source-token': 'Which token are you paying with?',
  'dest-chain': 'Where should it go?',
  'dest-token': 'What token should they get?',
  'amount': 'How much?',
  'recipient': 'Who are you paying?',
  'send-recipient': 'Who are you sending to?',
  'tip-presets': 'How much do you want to tip?',
  'tip-custom': 'Enter a custom tip amount',
  'confirm': 'Review your transfer',
  'success': 'Sent!',
};

export function SendFrameImage({
  step,
  sourceChain,
  sourceToken,
  destChain,
  destToken,
  amount,
  to,
}: {
  step: string;
  sourceChain: string;
  sourceToken: string;
  destChain: string;
  destToken: string;
  amount: string;
  to: string;
}) {
  const shortTo = to && to.length > 12 ? `${to.slice(0, 6)}\u2026${to.slice(-4)}` : to;
  const title = STEP_TITLES[step] || 'Send crypto anywhere';

  // Dynamic progress based on what's filled — simple: count completed selections
  const filled = [sourceChain, sourceToken, destChain, destToken, amount, to].filter(Boolean).length;
  const totalDots = 7;
  const isConfirmOrSuccess = step === 'confirm' || step === 'success';
  const isStart = step === 'start';

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

      {/* Progress dots */}
      {!isStart && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
          {Array.from({ length: totalDots }).map((_, i) => (
            <div
              key={i}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: i < filled ? ACCENT : i === filled ? BLUE : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>
      )}

      {/* Title */}
      <div style={{ fontSize: isConfirmOrSuccess ? '28px' : '36px', fontWeight: 700, marginBottom: '20px', display: 'flex', textAlign: 'center' }}>
        {title}
      </div>

      {/* Route summary */}
      {(sourceChain || destChain) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', marginBottom: '12px' }}>
          {sourceChain && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {sourceToken && <span style={{ color: WHITE, fontWeight: 600 }}>{sourceToken}</span>}
              <span style={{ color: MUTED }}>on</span>
              <span style={{ color: BLUE, fontWeight: 600 }}>{sourceChain}</span>
            </span>
          )}
          {sourceChain && destChain && (
            <span style={{ color: ACCENT, fontSize: '28px', display: 'flex' }}>→</span>
          )}
          {destChain && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {destToken && <span style={{ color: WHITE, fontWeight: 600 }}>{destToken}</span>}
              <span style={{ color: MUTED }}>on</span>
              <span style={{ color: BLUE, fontWeight: 600 }}>{destChain}</span>
            </span>
          )}
        </div>
      )}

      {/* Amount + recipient on confirm/success */}
      {isConfirmOrSuccess && amount && (
        <div style={{ fontSize: '56px', fontWeight: 800, marginTop: '8px', display: 'flex' }}>
          {amount} {sourceToken || destToken}
        </div>
      )}
      {isConfirmOrSuccess && to && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '22px', color: MUTED, marginTop: '12px' }}>
          <span>to</span>
          <span style={{ color: WHITE, fontWeight: 600 }}>{shortTo}</span>
        </div>
      )}

      {step === 'success' && (
        <div style={{ display: 'flex', marginTop: '16px', fontSize: '20px', color: ACCENT }}>
          Cross-chain transfer initiated
        </div>
      )}

      <PoweredBy />
    </div>
  );
}
