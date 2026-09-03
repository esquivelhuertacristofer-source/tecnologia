export default function GlobalLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0118]">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl border-4 border-[#FF8C00]/20 border-t-[#FF8C00] animate-spin" />
          <div className="absolute inset-2 rounded-xl bg-[#FF8C00]/5" />
        </div>
        <div className="text-white/40 text-sm font-bold tracking-widest uppercase animate-pulse">
          Cargando CEN
        </div>
      </div>
    </div>
  );
}
