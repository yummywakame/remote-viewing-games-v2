'use client'

// Deterministic star field — stable across renders
function lcg(seed) {
  let s = seed
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }
}
const _r = lcg(42)
const STARS = Array.from({ length: 160 }, (_, i) => ({
  id: i,
  x: _r() * 100,
  y: _r() * 100,
  size: _r() * 1.8 + 0.4,
  opacity: _r() * 0.55 + 0.15,
  twinkle: _r() > 0.6,
  duration: _r() * 3 + 2,
  delay: _r() * 5,
}))

export default function CosmicBackground() {
  return (
    <>
      <div className="absolute inset-0 bg-[#0a0a1a]" />
      <style>{`
        @keyframes pulse-a{0%,100%{opacity:.25;transform:scale(1)}50%{opacity:.55;transform:scale(1.08)}}
        @keyframes pulse-b{0%,100%{opacity:.20;transform:scale(1)}50%{opacity:.50;transform:scale(1.07)}}
        @keyframes pulse-c{0%,100%{opacity:.15;transform:scale(1)}50%{opacity:.45;transform:scale(1.09)}}
        @keyframes pulse-d{0%,100%{opacity:.20;transform:scale(1)}50%{opacity:.50;transform:scale(1.07)}}
        @keyframes pulse-e{0%,100%{opacity:.10;transform:scale(1)}50%{opacity:.35;transform:scale(1.08)}}
        @keyframes twinkle{0%,100%{opacity:var(--so)}50%{opacity:calc(var(--so)*0.15)}}
      `}</style>
      {/* Nebula glow orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute rounded-full blur-[120px]" style={{ width: '60vw', height: '60vw', top: '-10%', left: '-15%', background: 'radial-gradient(circle, #4f46e5, transparent 70%)', animation: 'pulse-a 9s ease-in-out infinite', animationFillMode: 'backwards' }} />
        <div className="absolute rounded-full blur-[100px]" style={{ width: '50vw', height: '50vw', top: '20%', right: '-10%', background: 'radial-gradient(circle, #7c3aed, transparent 70%)', animation: 'pulse-b 12s ease-in-out infinite 2s', animationFillMode: 'backwards' }} />
        <div className="absolute rounded-full blur-[140px]" style={{ width: '55vw', height: '55vw', bottom: '-15%', left: '20%', background: 'radial-gradient(circle, #1d4ed8, transparent 70%)', animation: 'pulse-c 15s ease-in-out infinite 1s', animationFillMode: 'backwards' }} />
        <div className="absolute rounded-full blur-[90px]"  style={{ width: '30vw', height: '30vw', top: '40%', left: '30%', background: 'radial-gradient(circle, #6d28d9, transparent 70%)', animation: 'pulse-d 10s ease-in-out infinite 4s', animationFillMode: 'backwards' }} />
        <div className="absolute rounded-full blur-[120px]" style={{ width: '40vw', height: '40vw', top: '10%', left: '40%', background: 'radial-gradient(circle, #0ea5e9, transparent 70%)', animation: 'pulse-e 13s ease-in-out infinite 3s', animationFillMode: 'backwards' }} />
      </div>
      {/* Twinkling starfield */}
      <div className="absolute inset-0 overflow-hidden">
        {STARS.map(star => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              '--so': star.opacity,
              opacity: star.opacity,
              animation: star.twinkle ? `twinkle ${star.duration}s ${star.delay}s ease-in-out infinite` : 'none',
            }}
          />
        ))}
      </div>
    </>
  )
}
