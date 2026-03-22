'use client';
import { getChainsByType } from '@/lib/chain-logos';

export default function ChainTicker() {
  const chains = [...getChainsByType().wallet, ...getChainsByType().destinationOnly];
  // Double for seamless loop
  const doubled = [...chains, ...chains];

  return (
    <div
      className="relative overflow-hidden py-4 sm:py-6 -mx-4 sm:mx-0"
      style={{
        maskImage: 'linear-gradient(90deg, transparent, black 5%, black 95%, transparent)',
        WebkitMaskImage: 'linear-gradient(90deg, transparent, black 5%, black 95%, transparent)',
      }}
    >
      <div className="flex gap-5 sm:gap-8 animate-ticker" style={{ willChange: 'transform' }}>
        {doubled.map((chain, i) => (
          <div
            key={`${chain.id}-${i < chains.length ? 'a' : 'b'}`}
            className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
          >
            <img
              src={chain.icon}
              alt={chain.name}
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="text-xs sm:text-sm font-medium whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
              {chain.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
