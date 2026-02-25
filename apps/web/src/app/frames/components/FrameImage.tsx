/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
/**
 * FrameImage — JSX components for Satori/ImageResponse OG image generation.
 * These return React elements compatible with next/og's ImageResponse.
 *
 * Satori constraints: inline styles only, display:flex required, no Tailwind.
 * Brand: goBlink brand kit v1.0 — blue #2563EB primary, violet #7C3AED accent only.
 */

// ─── Brand Colors (from BRAND_KIT.md) ─────────────────────────────────────────
const BRAND = '#2563EB';           // primary blue
const BRAND_LIGHT = '#3B82F6';     // light variant
const VIOLET = '#7C3AED';          // accent only
const WHITE = '#fafafa';
const MUTED = '#a1a1aa';           // zinc-400
const FAINT = '#71717a';           // zinc-500
const BG_DARK = '#09090b';         // zinc-950

// Brand gradient for backgrounds
const BG_GRADIENT = `linear-gradient(135deg, ${BG_DARK} 0%, #0c1a3d 40%, #0f0a2e 70%, ${BG_DARK} 100%)`;

// Accent line gradient (blue → violet)
const ACCENT_GRADIENT = `linear-gradient(90deg, ${BRAND}, ${VIOLET})`;

// ─── Shared Components ────────────────────────────────────────────────────────

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', marginBottom: '32px' }}>
      <span style={{ fontSize: '32px', fontWeight: 400, color: MUTED }}>go</span>
      <span style={{ fontSize: '32px', fontWeight: 800, color: WHITE }}>Blink</span>
    </div>
  );
}

function AccentBar() {
  return (
    <div style={{
      display: 'flex',
      width: '60px',
      height: '3px',
      borderRadius: '2px',
      background: ACCENT_GRADIENT,
      marginBottom: '24px',
    }} />
  );
}

function Footer({ text }: { text?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '40px', fontSize: '16px', color: FAINT }}>
      <span>{text || 'goblink.io'}</span>
      <span style={{ color: MUTED }}>·</span>
      <span>Any chain, any token</span>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <div style={{
      display: 'flex',
      padding: '6px 16px',
      borderRadius: '20px',
      background: `rgba(37, 99, 235, 0.12)`,
      border: `1px solid rgba(37, 99, 235, 0.25)`,
      fontSize: '16px',
      fontWeight: 600,
      color: BRAND_LIGHT,
    }}>
      {text}
    </div>
  );
}

// ─── Pay Frame ────────────────────────────────────────────────────────────────

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
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: BG_GRADIENT, color: WHITE, fontFamily: 'sans-serif', padding: '60px',
    }}>
      <Logo />
      <AccentBar />
      <div style={{ fontSize: '24px', color: MUTED, marginBottom: '12px', display: 'flex' }}>
        Payment Request
      </div>
      <div style={{ fontSize: '72px', fontWeight: 800, marginBottom: '16px', display: 'flex' }}>
        {amount} <span style={{ color: BRAND_LIGHT, marginLeft: '12px' }}>{token}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '24px', color: MUTED }}>
        <span>to</span>
        <span style={{ color: WHITE, fontWeight: 600 }}>{shortTo}</span>
        <span>on</span>
        <span style={{ color: BRAND_LIGHT, fontWeight: 600 }}>{chain}</span>
      </div>
      <Footer text="Powered by NEAR Intents" />
    </div>
  );
}

// ─── Tip Frame ────────────────────────────────────────────────────────────────

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
  const presets = ['$1', '$5', '$10'];

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: BG_GRADIENT, color: WHITE, fontFamily: 'sans-serif', padding: '60px',
    }}>
      <Logo />
      <AccentBar />
      <div style={{ fontSize: '24px', color: MUTED, marginBottom: '8px', display: 'flex' }}>
        Send a tip to
      </div>
      <div style={{ fontSize: '48px', fontWeight: 800, marginBottom: '28px', display: 'flex' }}>
        {shortTo}
      </div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        {presets.map(amt => (
          <div
            key={amt}
            style={{
              display: 'flex',
              padding: '14px 36px',
              borderRadius: '12px',
              background: `rgba(37, 99, 235, 0.1)`,
              border: `1px solid rgba(37, 99, 235, 0.25)`,
              fontSize: '26px',
              fontWeight: 600,
              color: BRAND_LIGHT,
            }}
          >
            {amt}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px', color: MUTED }}>
        <span>{token}</span>
        <span>on</span>
        <span style={{ color: BRAND_LIGHT }}>{chain}</span>
      </div>
      <Footer text="Powered by NEAR Intents" />
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

  const filled = [sourceChain, sourceToken, destChain, destToken, amount, to].filter(Boolean).length;
  const totalDots = 7;
  const isConfirmOrSuccess = step === 'confirm' || step === 'success';
  const isStart = step === 'start';

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: BG_GRADIENT, color: WHITE, fontFamily: 'sans-serif', padding: '60px',
    }}>
      <Logo />

      {/* Progress dots */}
      {!isStart && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {Array.from({ length: totalDots }).map((_, i) => (
            <div
              key={i}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: i < filled ? BRAND : i === filled ? BRAND_LIGHT : 'rgba(255,255,255,0.12)',
                boxShadow: i === filled ? `0 0 8px ${BRAND}` : 'none',
              }}
            />
          ))}
        </div>
      )}

      {/* Accent bar on start */}
      {isStart && <AccentBar />}

      {/* Title */}
      <div style={{
        fontSize: isStart ? '42px' : isConfirmOrSuccess ? '28px' : '34px',
        fontWeight: 700,
        marginBottom: '20px',
        display: 'flex',
        textAlign: 'center',
        color: isStart ? WHITE : WHITE,
      }}>
        {title}
      </div>

      {/* Start screen — mode descriptions */}
      {isStart && (
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <Badge text="🔄 Send" />
          <Badge text="💸 Pay" />
          <Badge text="🎁 Tip" />
        </div>
      )}

      {/* Route summary — show what's been selected */}
      {!isStart && (sourceChain || destChain) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', marginBottom: '12px' }}>
          {sourceChain && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {sourceToken && <span style={{ color: WHITE, fontWeight: 600 }}>{sourceToken}</span>}
              <span style={{ color: MUTED }}>on</span>
              <span style={{ color: BRAND_LIGHT, fontWeight: 600 }}>{sourceChain}</span>
            </span>
          )}
          {sourceChain && destChain && (
            <span style={{ color: BRAND, fontSize: '28px', fontWeight: 700, display: 'flex' }}>→</span>
          )}
          {destChain && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {destToken && <span style={{ color: WHITE, fontWeight: 600 }}>{destToken}</span>}
              <span style={{ color: MUTED }}>on</span>
              <span style={{ color: BRAND_LIGHT, fontWeight: 600 }}>{destChain}</span>
            </span>
          )}
        </div>
      )}

      {/* Amount + recipient on confirm/success */}
      {isConfirmOrSuccess && amount && (
        <div style={{ fontSize: '56px', fontWeight: 800, marginTop: '8px', display: 'flex' }}>
          {amount} <span style={{ color: BRAND_LIGHT, marginLeft: '10px' }}>{sourceToken || destToken}</span>
        </div>
      )}
      {isConfirmOrSuccess && to && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '22px', color: MUTED, marginTop: '12px' }}>
          <span>to</span>
          <span style={{ color: WHITE, fontWeight: 600 }}>{shortTo}</span>
        </div>
      )}

      {step === 'success' && (
        <div style={{ display: 'flex', marginTop: '16px', fontSize: '20px', color: BRAND_LIGHT }}>
          ✓ Cross-chain transfer initiated
        </div>
      )}

      <Footer />
    </div>
  );
}

// ─── Error Frame ──────────────────────────────────────────────────────────────

export function ErrorFrameImage({ message }: { message: string }) {
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: BG_GRADIENT, color: WHITE, fontFamily: 'sans-serif', padding: '60px',
    }}>
      <Logo />
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '64px', height: '64px', borderRadius: '50%',
        background: 'rgba(239, 68, 68, 0.12)', marginBottom: '24px',
        fontSize: '32px',
      }}>
        ✕
      </div>
      <div style={{ fontSize: '32px', fontWeight: 700, marginBottom: '12px', display: 'flex' }}>
        Something went wrong
      </div>
      <div style={{ fontSize: '20px', color: MUTED, display: 'flex', textAlign: 'center', maxWidth: '500px' }}>
        {message}
      </div>
      <Footer />
    </div>
  );
}
