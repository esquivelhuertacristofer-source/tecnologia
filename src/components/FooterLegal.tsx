'use client';

import Link from 'next/link';

export default function FooterLegal() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-[#E2E8F0] bg-white py-8 px-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-black text-[#011C40]">
            © {year} CEN — Campaña Educativa Nacional. Todos los derechos reservados.
          </span>
          <div className="flex items-center gap-6 text-sm text-[#94A3B8] font-medium">
            <Link href="/privacidad" className="hover:text-[#FF8C00] transition-colors">Aviso de Privacidad</Link>
            <Link href="/terminos" className="hover:text-[#FF8C00] transition-colors">Términos de Uso</Link>
            <Link href="/privacidad#arco" className="hover:text-[#FF8C00] transition-colors">Gestionar mis datos</Link>
          </div>
        </div>

        <div className="border-t border-[#F1F5F9] pt-4 space-y-2">
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            Plataforma CEN — Campaña Educativa Nacional. El contenido pedagógico, la marca, el código fuente, los diseños,
            ilustraciones, simulaciones interactivas y materiales didácticos son propiedad exclusiva de
            CEN — Campaña Educativa Nacional. Su reproducción, distribución, modificación o uso sin autorización
            expresa por escrito constituye una infracción a los derechos de autor protegidos bajo la
            Ley Federal del Derecho de Autor de México.
          </p>
          <p className="text-xs text-[#94A3B8]">
            Marcas registradas, contenido educativo, metodología pedagógica e identidad visual son propiedad de CEN — Campaña Educativa Nacional.
          </p>
        </div>
      </div>
    </footer>
  );
}
