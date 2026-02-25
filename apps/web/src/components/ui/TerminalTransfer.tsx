'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TRANSFERS = [
  { from: 'SOL', fromChain: 'Solana', to: 'USDC', toChain: 'Base', amount: '2.4', receive: '412.80', time: '38s' },
  { from: 'ETH', fromChain: 'Ethereum', to: 'NEAR', toChain: 'NEAR', amount: '0.15', receive: '94.21', time: '44s' },
  { from: 'USDC', fromChain: 'Arbitrum', to: 'SUI', toChain: 'Sui', amount: '500', receive: '136.98', time: '31s' },
  { from: 'NEAR', fromChain: 'NEAR', to: 'USDT', toChain: 'Polygon', amount: '200', receive: '193.40', time: '42s' },
  { from: 'SUI', fromChain: 'Sui', to: 'ETH', toChain: 'Base', amount: '850', receive: '0.088', time: '36s' },
];

export default function TerminalTransfer() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'routing' | 'done'>('typing');

  const transfer = TRANSFERS[currentIndex];

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    // Phase: typing → routing → done → next
    setPhase('typing');
    timers.push(setTimeout(() => setPhase('routing'), 1200));
    timers.push(setTimeout(() => setPhase('done'), 2800));
    timers.push(setTimeout(() => {
      setCurrentIndex((i) => (i + 1) % TRANSFERS.length);
    }, 5000));

    return () => timers.forEach(clearTimeout);
  }, [currentIndex]);

  return (
    <div
      className="rounded-2xl overflow-hidden font-mono text-xs sm:text-sm"
      style={{ background: '#0a0a0a', border: '1px solid var(--border)' }}
    >
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ff5f57' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#febc2e' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#28c840' }} />
        </div>
        <span className="text-[10px] ml-2" style={{ color: 'var(--text-faint)' }}>goblink — live transfers</span>
      </div>

      {/* Terminal body */}
      <div className="p-4 sm:p-5 space-y-2 min-h-[140px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2"
          >
            {/* Command line */}
            <div className="flex items-center gap-2 flex-wrap">
              <span style={{ color: '#28c840' }}>❯</span>
              <span style={{ color: 'var(--text-muted)' }}>send</span>
              <span style={{ color: 'var(--brand)' }}>{transfer.amount} {transfer.from}</span>
              <span style={{ color: 'var(--text-faint)' }}>→</span>
              <span style={{ color: '#28c840' }}>{transfer.to}</span>
              <span style={{ color: 'var(--text-faint)' }}>on {transfer.toChain}</span>
            </div>

            {/* Routing */}
            {(phase === 'routing' || phase === 'done') && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <span style={{ color: 'var(--text-faint)' }}>
                  ⟡ routing {transfer.fromChain} → {transfer.toChain}
                  {phase === 'routing' && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                    >...</motion.span>
                  )}
                </span>
              </motion.div>
            )}

            {/* Result */}
            {phase === 'done' && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-1"
              >
                <div>
                  <span style={{ color: '#28c840' }}>✓ delivered</span>
                  <span style={{ color: 'var(--text-muted)' }}> — </span>
                  <span style={{ color: 'var(--text-primary)' }}>{transfer.receive} {transfer.to}</span>
                  <span style={{ color: 'var(--text-faint)' }}> in {transfer.time}</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
