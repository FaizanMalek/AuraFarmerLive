export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-950 px-6 py-24 text-zinc-50">
      <main className="mx-auto flex max-w-lg flex-col items-center gap-8 text-center">
        <p className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-xs font-medium uppercase tracking-widest text-emerald-300">
          aurafarmer.live
        </p>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Aura Farmer
        </h1>
        <p className="text-pretty text-lg leading-relaxed text-zinc-400">
          Public leaderboards and votes for whoever you think is farming—or losing—their aura.
          Stack is wired; votes and realtime come next.
        </p>
      </main>
    </div>
  );
}
