import Link from 'next/link';
import FooterLegal from '../../components/FooterLegal';

export const metadata = { title: `Aviso de Privacidad — ${process.env.NEXT_PUBLIC_BRAND_NAME ?? 'Plataforma'}` };

export default function PrivacidadPage() {
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
            <h1 className="text-4xl font-black text-[#011C40] tracking-tight">Aviso de Privacidad</h1>
            <p className="text-[#64748B] font-medium">Última actualización: mayo 2026</p>
            <p className="text-xs text-[#94A3B8]">
              Elaborado conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP),
              su Reglamento y los Lineamientos del Aviso de Privacidad publicados en el DOF.
            </p>
          </div>

          <div className="bg-[#FFF7ED] border border-[#FDBA74] rounded-2xl p-5 space-y-2">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#C2410C]">Estado actual de la plataforma — agosto 2026</p>
            <p className="text-sm text-[#7C2D12] leading-relaxed">
              CEN Campaña Educativa Nacional opera hoy en <strong>fase piloto/demostración</strong>: el acceso se realiza mediante un
              perfil de demostración compartido, sin captura de nombre real, correo, contraseña ni ningún otro dato de identificación
              de un alumno o docente concreto. Las secciones de este aviso relativas a cuentas autenticadas, inicio/cierre de sesión,
              reportes docentes o institucionales, y almacenamiento/cifrado de datos mediante Supabase describen el
              <strong> modelo de operación al que la plataforma migrará</strong> cuando entre en funcionamiento con instituciones
              educativas contratantes; mientras dure la fase piloto, esas funciones no están activas y no se recaban, almacenan ni
              transfieren datos personales de menores de edad. Esta nota se retirará en cuanto el modelo autenticado entre en operación real.
            </p>
          </div>

          <section className="space-y-4 text-[#334155] leading-relaxed">
            <h2 className="text-xl font-black text-[#011C40]">I. Identidad y domicilio del responsable</h2>
            <p>
              <strong>CEN — Campaña Educativa Nacional</strong> (en adelante &ldquo;CEN&rdquo; o &ldquo;el Responsable&rdquo;) es el responsable
              del tratamiento de los datos personales que usted proporciona al utilizar la plataforma CEN Campaña Educativa Nacional.
            </p>
            <ul className="list-none pl-0 space-y-1 text-sm">
              <li><strong>Denominación:</strong> CEN — Campaña Educativa Nacional</li>
              <li><strong>Correo de contacto:</strong> campanaeducativanacional@gmail.com</li>
            </ul>
          </section>

          <section className="space-y-4 text-[#334155] leading-relaxed">
            <h2 className="text-xl font-black text-[#011C40]">II. Datos personales que se recaban</h2>
            <p>Para la prestación del servicio educativo, CEN recaba las siguientes categorías de datos:</p>
            <div className="space-y-3">
              <div>
                <p className="font-bold text-[#011C40] text-sm">Datos de identificación e contacto</p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Nombre completo</li>
                  <li>Correo electrónico institucional</li>
                  <li>Grado escolar / grupo asignado (alumnos)</li>
                  <li>Rol en la plataforma (alumno, docente, administrador)</li>
                </ul>
              </div>
              <div>
                <p className="font-bold text-[#011C40] text-sm">Datos académicos y de uso</p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Actividades completadas, puntuaciones y tiempo de estudio</li>
                  <li>Avance por módulo, pilar y segmento curricular</li>
                  <li>Registros de inicio/cierre de sesión y dispositivos utilizados</li>
                </ul>
              </div>
              <div>
                <p className="font-bold text-[#011C40] text-sm">Datos sensibles</p>
                <p className="text-sm">
                  CEN <strong>no recaba datos sensibles</strong> en el sentido del artículo 3, fracción VI de la LFPDPPP
                  (origen racial, estado de salud, creencias religiosas, etc.).
                </p>
              </div>
              <div>
                <p className="font-bold text-[#011C40] text-sm">Menores de edad</p>
                <p className="text-sm">
                  Cuando los usuarios sean menores de edad, el tratamiento se realiza bajo la supervisión y responsabilidad
                  de la institución educativa contratante, quien actúa como representante legal conforme a la normativa aplicable.
                  CEN no recaba directamente datos de menores fuera del contexto institucional.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4 text-[#334155] leading-relaxed">
            <h2 className="text-xl font-black text-[#011C40]">III. Finalidades del tratamiento</h2>
            <div className="space-y-3">
              <div>
                <p className="font-bold text-[#011C40] text-sm">Finalidades primarias (necesarias para la relación jurídica)</p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Proveer acceso autenticado a los contenidos, actividades y evaluaciones de la plataforma</li>
                  <li>Registrar y mostrar el progreso académico individual del alumno</li>
                  <li>Generar reportes de avance grupal para docentes y administradores institucionales</li>
                  <li>Administrar cuentas de usuario, grupos y permisos de acceso</li>
                  <li>Cumplir con obligaciones legales y normativas aplicables al servicio educativo</li>
                </ul>
              </div>
              <div>
                <p className="font-bold text-[#011C40] text-sm">Finalidades secundarias (requieren consentimiento adicional)</p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Envío de comunicaciones informativas o promocionales sobre nuevos módulos y funcionalidades</li>
                  <li>Elaboración de estadísticas agregadas y anonimizadas para investigación educativa</li>
                </ul>
                <p className="text-sm mt-2">
                  Si usted no desea que sus datos sean tratados para las finalidades secundarias, puede manifestarlo
                  enviando un correo a{' '}
                  <a href="mailto:campanaeducativanacional@gmail.com?subject=Oposici%C3%B3n%20a%20finalidades%20secundarias" className="text-[#FF8C00] underline font-bold">campanaeducativanacional@gmail.com</a>{' '}
                  con el asunto &ldquo;Oposición a finalidades secundarias&rdquo;.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4 text-[#334155] leading-relaxed">
            <h2 className="text-xl font-black text-[#011C40]">IV. Transferencias de datos personales</h2>
            <p>
              CEN podrá transferir sus datos personales a los siguientes terceros, sin requerir su consentimiento
              conforme al artículo 37 de la LFPDPPP:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC]">
                    <th className="text-left py-2 px-3 border border-[#E2E8F0] font-bold text-[#011C40]">Receptor</th>
                    <th className="text-left py-2 px-3 border border-[#E2E8F0] font-bold text-[#011C40]">Finalidad</th>
                    <th className="text-left py-2 px-3 border border-[#E2E8F0] font-bold text-[#011C40]">Fundamento</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2 px-3 border border-[#E2E8F0]">Supabase Inc. (EE.UU.)</td>
                    <td className="py-2 px-3 border border-[#E2E8F0]">Almacenamiento y gestión de base de datos</td>
                    <td className="py-2 px-3 border border-[#E2E8F0]">Art. 37 fr. I — necesario para la relación contractual</td>
                  </tr>
                  <tr className="bg-[#F8FAFC]">
                    <td className="py-2 px-3 border border-[#E2E8F0]">Vercel Inc. (EE.UU.)</td>
                    <td className="py-2 px-3 border border-[#E2E8F0]">Hospedaje y despliegue de la plataforma</td>
                    <td className="py-2 px-3 border border-[#E2E8F0]">Art. 37 fr. I — necesario para la relación contractual</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 border border-[#E2E8F0]">Institución educativa contratante</td>
                    <td className="py-2 px-3 border border-[#E2E8F0]">Reportes de progreso académico de sus alumnos</td>
                    <td className="py-2 px-3 border border-[#E2E8F0]">Art. 37 fr. I — cumplimiento de obligación contractual</td>
                  </tr>
                  <tr className="bg-[#F8FAFC]">
                    <td className="py-2 px-3 border border-[#E2E8F0]">Autoridades competentes</td>
                    <td className="py-2 px-3 border border-[#E2E8F0]">Cumplimiento de obligaciones legales</td>
                    <td className="py-2 px-3 border border-[#E2E8F0]">Art. 37 fr. IV — mandato legal</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm">
              Las transferencias a proveedores tecnológicos ubicados en el extranjero (Supabase, Vercel) se realizan
              mediante contratos que garantizan un nivel de protección equivalente al de la LFPDPPP.
            </p>
          </section>

          <section id="arco" className="space-y-4 text-[#334155] leading-relaxed">
            <h2 className="text-xl font-black text-[#011C40]">V. Medios para ejercer los derechos ARCO</h2>
            <p>
              Como titular de los datos, usted tiene derecho a <strong>Acceder, Rectificar, Cancelar u Oponerse</strong> (derechos ARCO)
              al tratamiento de sus datos personales, así como a <strong>revocar el consentimiento</strong> otorgado,
              conforme a los artículos 28–37 de la LFPDPPP.
            </p>
            <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-2 text-sm">
              <p><strong>Para ejercer sus derechos ARCO, presente una solicitud que incluya:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Nombre completo y correo institucional registrado en la plataforma</li>
                <li>Descripción clara del derecho que desea ejercer y los datos involucrados</li>
                <li>Copia de identificación oficial vigente</li>
              </ul>
              <p className="mt-2">
                <strong>Enviar a:</strong>{' '}
                <a href="mailto:campanaeducativanacional@gmail.com?subject=Solicitud%20de%20derechos%20ARCO" className="text-[#FF8C00] underline">campanaeducativanacional@gmail.com</a><br />
                <strong>Asunto:</strong> Solicitud de derechos ARCO — [nombre del titular]
              </p>
              <p>
                CEN responderá en un plazo máximo de <strong>20 días hábiles</strong> contados a partir de la recepción
                de la solicitud completa, conforme al artículo 32 de la LFPDPPP.
              </p>
            </div>
          </section>

          <section className="space-y-4 text-[#334155] leading-relaxed">
            <h2 className="text-xl font-black text-[#011C40]">VI. Mecanismos para revocar el consentimiento</h2>
            <p>
              En cualquier momento usted puede revocar el consentimiento otorgado para el tratamiento de sus datos,
              siempre que ello sea compatible con la prestación del servicio educativo. La revocación no tendrá efectos
              retroactivos sobre los tratamientos ya realizados.
            </p>
            <p className="text-sm">
              Para solicitar la revocación, envíe un correo a{' '}
              <a href="mailto:campanaeducativanacional@gmail.com?subject=Revocaci%C3%B3n%20de%20consentimiento" className="text-[#FF8C00] underline font-bold">campanaeducativanacional@gmail.com</a>{' '}
              con el asunto &ldquo;Revocación de consentimiento&rdquo;. Tenga en cuenta que la revocación puede implicar la
              imposibilidad de continuar utilizando la plataforma.
            </p>
          </section>

          <section className="space-y-4 text-[#334155] leading-relaxed">
            <h2 className="text-xl font-black text-[#011C40]">VII. Uso de cookies y tecnologías de rastreo</h2>
            <p>
              La plataforma utiliza cookies de sesión estrictamente necesarias para mantener la autenticación del usuario.
              No se utilizan cookies de rastreo publicitario ni herramientas de análisis de comportamiento que impliquen
              la reidentificación del titular.
            </p>
            <p className="text-sm">
              Usted puede configurar su navegador para rechazar cookies; sin embargo, esto impedirá el funcionamiento
              correcto de la plataforma, ya que la autenticación depende de ellas.
            </p>
          </section>

          <section className="space-y-4 text-[#334155] leading-relaxed">
            <h2 className="text-xl font-black text-[#011C40]">VIII. Medidas de seguridad</h2>
            <p>
              CEN implementa medidas técnicas, administrativas y físicas para proteger sus datos personales contra
              pérdida, robo, uso no autorizado, divulgación, alteración o destrucción:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Cifrado en tránsito (TLS 1.3) y en reposo (AES-256) mediante infraestructura Supabase</li>
              <li>Autenticación con contraseña hasheada (bcrypt) y tokens de sesión seguros</li>
              <li>Acceso a datos restringido por roles (Row Level Security en base de datos)</li>
              <li>Actualizaciones periódicas de dependencias y revisiones de seguridad</li>
            </ul>
          </section>

          <section className="space-y-4 text-[#334155] leading-relaxed">
            <h2 className="text-xl font-black text-[#011C40]">IX. Conservación de los datos</h2>
            <p>
              Los datos personales se conservarán durante el tiempo que dure la relación contractual con la institución
              educativa y, una vez concluida, por el período que señalen las obligaciones legales aplicables o durante
              <strong> 5 (cinco) años </strong>
              adicionales para fines de respaldo e historial académico, tras lo cual serán eliminados o anonimizados.
            </p>
          </section>

          <section className="space-y-4 text-[#334155] leading-relaxed">
            <h2 className="text-xl font-black text-[#011C40]">X. Cambios al aviso de privacidad</h2>
            <p>
              CEN se reserva el derecho de modificar este aviso de privacidad en cualquier momento para reflejar cambios
              legislativos, operativos o en la prestación del servicio. Las modificaciones serán publicadas en esta página
              con la fecha de actualización y, cuando sean sustanciales, se notificarán a los titulares por correo
              electrónico institucional.
            </p>
          </section>

          <section className="space-y-4 text-[#334155] leading-relaxed">
            <h2 className="text-xl font-black text-[#011C40]">XI. Autoridad competente</h2>
            <p>
              Si considera que su derecho a la protección de datos personales ha sido vulnerado, tiene derecho a
              interponer una queja o denuncia ante el <strong>Instituto Nacional de Transparencia, Acceso a la
              Información y Protección de Datos Personales (INAI)</strong>, www.inai.org.mx, o ante los tribunales
              competentes conforme a la legislación mexicana.
            </p>
          </section>
        </div>
      </main>

      <FooterLegal />
    </div>
  );
}
