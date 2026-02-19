'use client';
import ScrollReveal from './ScrollReveal';

const rows = [
  { feature: 'Transfer time', goblink: '<30 seconds', bridges: '10-45 minutes', winner: 'goblink' },
  { feature: 'Chains supported', goblink: '29', bridges: '5-12', winner: 'goblink' },
  { feature: 'Failed transfer', goblink: 'Auto-refund', bridges: 'Funds stuck', winner: 'goblink' },
  { feature: 'Setup required', goblink: 'None', bridges: 'Bridge approval + gas', winner: 'goblink' },
  { feature: 'Custody', goblink: 'Non-custodial', bridges: 'Varies', winner: 'goblink' },
  { feature: 'Hidden fees', goblink: 'Never', bridges: 'Often', winner: 'goblink' },
];

export default function ComparisonTable() {
  return (
    <ScrollReveal>
      <div className="card overflow-hidden">
        <div
          className="grid grid-cols-3 text-center font-semibold text-body-sm border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="p-4" style={{ color: 'var(--text-muted)' }}>Feature</div>
          <div className="p-4 text-gradient">goBlink</div>
          <div className="p-4" style={{ color: 'var(--text-muted)' }}>Traditional Bridges</div>
        </div>
        {rows.map((row) => (
          <div
            key={row.feature}
            className="grid grid-cols-3 text-center text-body-sm border-b last:border-0"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div className="p-4 font-medium text-left" style={{ color: 'var(--text-primary)' }}>
              {row.feature}
            </div>
            <div className="p-4 font-medium" style={{ color: 'var(--success-text)' }}>
              {row.goblink}
            </div>
            <div className="p-4" style={{ color: 'var(--text-muted)' }}>
              {row.bridges}
            </div>
          </div>
        ))}
      </div>
    </ScrollReveal>
  );
}
