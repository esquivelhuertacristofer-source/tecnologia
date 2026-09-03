"use client";

import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cen-bg font-epilogue flex flex-col items-center justify-center px-6 text-center">

      {/* Mascot */}
      <div className="w-48 h-48 relative mb-6 animate-bounce" style={{ animationDuration: '3s' }}>
        <Image
          src="/assets/ceny.png"
          alt="CENy"
          fill
          className="object-contain drop-shadow-xl"
          priority
        />
      </div>

      {/* 404 badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-cen-orange/10 rounded-full mb-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-cen-orange">Error 404</span>
      </div>

      <h1 className="text-5xl md:text-7xl font-black text-cen-blue tracking-tighter leading-none mb-4">
        Página no<br />encontrada
      </h1>

      <p className="text-slate-500 font-medium text-lg max-w-md mb-10 leading-relaxed">
        Parece que esta página no existe o fue movida.<br />
        Vuelve al inicio y sigue aprendiendo sobre finanzas.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Link
          href="/"
          className="px-8 py-4 bg-cen-blue text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-cen-orange transition-all shadow-lg"
        >
          Ir al inicio
        </Link>
        <Link
          href="/hub"
          className="px-8 py-4 bg-white border-2 border-slate-200 text-cen-blue rounded-2xl font-black text-sm uppercase tracking-widest hover:border-cen-blue transition-all"
        >
          Mi Hub →
        </Link>
      </div>

      {/* Decoration */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cen-cyan/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cen-orange/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
