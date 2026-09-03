import Link from 'next/link';
import FooterLegal from '../../components/FooterLegal';

export const metadata = { title: `Términos de Uso — ${process.env.NEXT_PUBLIC_BRAND_NAME ?? 'Plataforma'}` };

export default function TerminosPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FB] font-epilogue">
      <header className="w-full border-b border-[#E2E8F0] bg-white px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 bg-[#011C40] rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-xl tracking-tighter">C</span>
            </div>
            <span className="text-[#011C40] font-black tracking-widest text-lg">CEN</span>
          </Link>
          <Link href="/log-in" className="text-sm font-bold text-[#FF8C00] hover:underline">Iniciar Sesión</Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-16">
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-8 md:p-12 space-y-8">
          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#FF8C00]">Documento Legal</p>
            <h1 className="text-4xl font-black text-[#011C40] tracking-tight">Términos de Uso</h1>
            <p className="text-[#64748B] font-medium">Última actualización: mayo 2026</p>
          </div>

          <section className="space-y-4 text-[#334155] leading-relaxed">
            <h2 className="text-xl font-black text-[#011C40]">1. Aceptación de los términos</h2>
            <p>
              Al acceder y utilizar la plataforma CEN (en adelante &ldquo;la Plataforma&rdquo;), usted acepta quedar vinculado por los presentes Términos de Uso. Si no está de acuerdo con alguno de estos términos, le pedimos que se abstenga de utilizar la Plataforma.
            </p>
          </section>

          <section className="space-y-4 text-[#334155] leading-relaxed">
            <h2 className="text-xl font-black text-[#011C40]">2. Uso permitido</h2>
            <p>La Plataforma está diseñada para uso educativo en el contexto institucional. Usted se compromete a:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Utilizar la Plataforma únicamente para fines educativos legítimos</li>
              <li>No compartir sus credenciales de acceso con terceros</li>
              <li>No intentar acceder a cuentas, datos o funcionalidades no autorizadas</li>
              <li>Respetar los derechos de propiedad intelectual de los contenidos</li>
            </ul>
          </section>

          <section className="space-y-4 text-[#334155] leading-relaxed">
            <h2 className="text-xl font-black text-[#011C40]">3. Propiedad intelectual</h2>
            <p>
              Todos los contenidos de la Plataforma, incluyendo textos, imágenes, actividades, cuestionarios y materiales de aprendizaje, son propiedad de CEN — Campaña Educativa Nacional o de sus licenciantes y están protegidos por las leyes de propiedad intelectual aplicables. Queda prohibida su reproducción, distribución o uso fuera del contexto educativo autorizado sin permiso previo y por escrito.
            </p>
          </section>

          <section className="space-y-4 text-[#334155] leading-relaxed">
            <h2 className="text-xl font-black text-[#011C40]">4. Cuentas de usuario</h2>
            <p>
              Las cuentas son de carácter personal e intransferible. CEN se reserva el derecho de suspender o cancelar cuentas que incumplan estos términos o realicen un uso indebido de la Plataforma. Las instituciones educativas son responsables del uso que hagan sus estudiantes y docentes de las cuentas que administran.
            </p>
          </section>

          <section className="space-y-4 text-[#334155] leading-relaxed">
            <h2 className="text-xl font-black text-[#011C40]">5. Limitación de responsabilidad</h2>
            <p>
              CEN provee la Plataforma &ldquo;tal como está&rdquo; y no garantiza que estará libre de interrupciones o errores. En ningún caso CEN será responsable por daños indirectos, incidentales o consecuentes derivados del uso o imposibilidad de uso de la Plataforma.
            </p>
          </section>

          <section className="space-y-4 text-[#334155] leading-relaxed">
            <h2 className="text-xl font-black text-[#011C40]">6. Modificaciones</h2>
            <p>
              CEN se reserva el derecho de modificar estos Términos de Uso en cualquier momento. El uso continuado de la Plataforma tras la publicación de cambios constituye su aceptación de los nuevos términos.
            </p>
          </section>

          <section className="space-y-4 text-[#334155] leading-relaxed">
            <h2 className="text-xl font-black text-[#011C40]">7. Legislación aplicable</h2>
            <p>
              Estos Términos de Uso se rigen por la legislación mexicana vigente. Cualquier controversia derivada de su interpretación o ejecución se someterá a la jurisdicción de los tribunales competentes.
            </p>
          </section>
        </div>
      </main>

      <FooterLegal />
    </div>
  );
}
