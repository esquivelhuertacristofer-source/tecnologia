export default function HubLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0118] gap-8">
      <div className="relative">
        <div className="w-20 h-20 rounded-3xl border-4 border-[#FF8C00]/20 border-t-[#FF8C00] animate-spin" />
        <div className="absolute inset-3 rounded-2xl bg-[#FF8C00]/5 animate-pulse" />
      </div>

      {/* Skeleton cards */}
      <div className="w-full max-w-4xl px-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="h-40 rounded-3xl bg-white/[0.03] border border-white/5 animate-pulse"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>

      <p className="text-white/30 text-xs font-bold tracking-widest uppercase animate-pulse">
        Cargando tu progreso...
      </p>
    </div>
  );
}
