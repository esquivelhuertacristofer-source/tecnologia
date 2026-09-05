/**
 * Estudio de impacto — registro de consentimiento (§4).
 *
 * Existe una ruta de servidor por UNA razón: la dirección IP. El navegador no
 * la conoce, y el encargo pide guardarla truncada. Todo lo demás del estudio
 * se escribe desde el cliente por la cola.
 *
 * SE ESCRIBE CON LA SESIÓN DEL PROPIO USUARIO, no con la llave de servicio.
 * Eso importa: la llave de servicio se salta TODAS las políticas RLS y no está
 * desplegada a propósito (ver `DESPLIEGUE-CLOUDFLARE.md`). Aquí se usa el
 * cliente de servidor que lee la sesión de las cookies, así que la política
 * `consentimientos_propio_escribe` sigue mandando: nadie puede registrar un
 * consentimiento a nombre de otra persona, ni siquiera desde este endpoint.
 */

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { truncarIp } from '@/lib/estudio/dispositivo';

export const runtime = 'nodejs';

const TIPOS = new Set(['alumno', 'tutor', 'docente', 'institucion']);

/**
 * La IP del visitante según la cabecera que ponga el borde.
 * `CF-Connecting-IP` es la de Cloudflare y es la que manda en producción;
 * `x-forwarded-for` puede traer una lista y la primera es el cliente.
 */
function ipDelVisitante(cabeceras: Headers): string | null {
  const cf = cabeceras.get('cf-connecting-ip');
  if (cf) return cf.trim();
  const xff = cabeceras.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() ?? null;
  return cabeceras.get('x-real-ip');
}

export async function POST(peticion: Request) {
  try {
    const cuerpo = (await peticion.json().catch(() => ({}))) as {
      tipo?: string;
      version_aviso?: string;
    };

    const tipo = cuerpo.tipo ?? 'alumno';
    const version = cuerpo.version_aviso;
    if (!TIPOS.has(tipo) || !version) {
      return NextResponse.json({ ok: false, motivo: 'datos incompletos' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      // Sin sesión no hay a quién ligar el consentimiento. No es un error del
      // usuario —«Explorar sin cuenta» pasa por aquí—, así que se responde
      // 200 con `registrado: false` y el cliente sigue su camino.
      return NextResponse.json({ ok: true, registrado: false, motivo: 'sin sesión' });
    }

    const { error: errorAlta } = await supabase.from('consentimientos').insert({
      cuenta: data.user.id,
      tipo,
      version_aviso: version,
      ip_truncada: truncarIp(ipDelVisitante(peticion.headers)),
      user_agent: (peticion.headers.get('user-agent') ?? '').slice(0, 400),
    });

    if (errorAlta) throw errorAlta;
    return NextResponse.json({ ok: true, registrado: true });
  } catch (e) {
    // El cliente no cambia de comportamiento con esto: el consentimiento se
    // registra o se pierde, pero nadie se queda fuera de la plataforma.
    console.error('[estudio] consentimiento', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
