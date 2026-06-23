export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-aqua">
        Software Engineer · Full-Stack + AI
      </p>

      <h1 className="font-display text-6xl leading-[0.95] text-foam sm:text-7xl md:text-8xl">
        Alberto Tuveri
      </h1>

      <p className="max-w-md text-balance text-ink-mute">
        From the cliffs of Pan di Zucchero to production-grade systems. Immersive
        ocean-themed portfolio — currently being built.
      </p>

      <div className="mt-2 h-px w-24 bg-rule" />

      <p className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
        Gate 2 · scaffold ✓
      </p>
    </main>
  );
}
