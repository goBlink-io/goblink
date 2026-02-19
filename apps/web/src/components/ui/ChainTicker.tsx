'use client';
import { getChainsByType } from '@/lib/chain-logos';

export default function ChainTicker() {
  const chains = [...getChainsByType().wallet, ...getChainsByType().destinationOnly];
  // Double for seamless loop
  const doubled = [...chains, ...chains];

  return (
    <div
      className="relative overflow-hidden py-6"
      style={{ maskImage: 'linear-gradient(90deg, transparent, black 10%, black 90%, transparent)' }}
    >
      <div className="flex gap-8 animate-ticker">
        {doubled.map((chain, i) => (
          <div
            key={`${chain.id}-${i}`}
            className="flex items-center gap-2 flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
          >
            <img
              src={chain.icon}
              alt={chain.name}
              className="w-6 h-6 rounded-full"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="text-sm font-medium whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
              {chain.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
