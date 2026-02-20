'use client';
import { Check, X } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

const rows = [
  { feature: 'Transfer time', goblink: '<60 seconds', bridges: '10-45 minutes' },
  { feature: 'Chains supported', goblink: '29', bridges: '5-12' },
  { feature: 'Failed transfer', goblink: 'Auto-refund', bridges: 'Funds stuck' },
  { feature: 'Setup required', goblink: 'None', bridges: 'Bridge approval + gas' },
  { feature: 'Custody', goblink: 'Non-custodial', bridges: 'Varies' },
  { feature: 'Hidden fees', goblink: 'Never', bridges: 'Often' },
];

export default function ComparisonTable() {
  return (
    <ScrollReveal>
      {/* Desktop: 3-column grid */}
      <div className="hidden sm:block card overflow-hidden">
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

      {/* Mobile: stacked cards — much easier to read */}
      <div className="sm:hidden space-y-3">
        {rows.map((row) => (
          <div key={row.feature} className="card p-4">
            <div className="text-caption font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
              {row.feature}
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <Check className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--success)' }} />
              <span className="text-body-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                <span className="text-gradient">goBlink:</span> {row.goblink}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <X className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--error)' }} />
              <span className="text-body-sm" style={{ color: 'var(--text-muted)' }}>
                Bridges: {row.bridges}
              </span>
            </div>
          </div>
        ))}
      </div>
    </ScrollReveal>
  );
}
