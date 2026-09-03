/**
 * TECNIA CORREO · el armazón del cliente de correo.
 *
 * Se prueba en tres alturas, como `simulador-muro.test.tsx`: los datos puros,
 * la máquina (`useCorreo`) y la ventana (`VentanaCorreo`, que no debe ofrecer
 * ni un control sin que se lo pidan).
 *
 * Y se prueba JUGANDO MAL: responder a un correo que está en la papelera,
 * reenviar sin destinatario y darle a Enviar, borrar dos veces lo mismo,
 * abrir un correo que no existe, mover un correo a la carpeta en la que ya
 * está y adjuntar dos veces el mismo archivo.
 */
import { fireEvent, render, renderHook, screen, act } from '@testing-library/react';
import {
  adjuntoPeligroso,
  borradorDeReenvio,
  borradorDeRespuesta,
  dominioDe,
  enlaceEnganoso,
  marcarLeido,
  mismoDominio,
  moverA,
  revisarDireccion,
  tipoDeAdjunto,
  usuarioDe,
  type MensajeCorreo,
  type RemitenteCorreo,
} from '@/components/simuladores/correo/tiposCorreo';
import { useCorreo } from '@/components/simuladores/correo/useCorreo';
import { VentanaCorreo } from '@/components/simuladores/correo/VentanaCorreo';

const SOFI: RemitenteCorreo = { nombre: 'Sofi', direccion: 'sofi.aprendiz@tecnia-escuela.mx' };
const LUCIA: RemitenteCorreo = { nombre: 'Maestra Lucía', direccion: 'maestra.lucia@tecnia-escuela.mx' };
const DIEGO: RemitenteCorreo = { nombre: 'Diego', direccion: 'diego.equipo@tecnia-escuela.mx' };
/** El remitente que MIENTE: el nombre dice una cosa y la dirección otra. */
const FALSA_LUCIA: RemitenteCorreo = { nombre: 'Maestra Lucía', direccion: 'premios@regalos-ya.info' };

function mensaje(parcial: Partial<MensajeCorreo> & { id: string; de: RemitenteCorreo }): MensajeCorreo {
  return {
    para: [SOFI],
    cc: [],
    asunto: 'Un asunto',
    cuerpo: ['Hola.'],
    fecha: '7:42',
    adjuntos: [],
    enlaces: [],
    carpeta: 'recibidos',
    leido: false,
    marcado: false,
    ...parcial,
  };
}

const SEMILLA: MensajeCorreo[] = [
  mensaje({ id: 'm1', de: LUCIA, cc: [DIEGO], asunto: 'Materiales del viernes' }),
  mensaje({ id: 'm2', de: DIEGO, asunto: '¿A qué hora es el ensayo?' }),
];

// ═══════════════════════════════════════════════════════════════════════════
// 1 · Los datos puros
// ═══════════════════════════════════════════════════════════════════════════

describe('los datos puros', () => {
  it('revisarDireccion nombra las seis maneras de romper una dirección', () => {
    expect(revisarDireccion(LUCIA.direccion)).toEqual({ ok: true });
    const motivo = (d: string) => {
      const r = revisarDireccion(d);
      return r.ok ? null : r.motivo;
    };
    expect(motivo('   ')).toBe('vacia');
    expect(motivo('maestra lucia@tecnia-escuela.mx')).toBe('espacio');
    expect(motivo('maestra.lucia.tecnia-escuela.mx')).toBe('sin-arroba');
    expect(motivo('maestra.lucia@@tecnia-escuela.mx')).toBe('dos-arrobas');
    expect(motivo('maestra.lucía@tecnia-escuela.mx')).toBe('acento');
    expect(motivo('@tecnia-escuela.mx')).toBe('sin-usuario');
    expect(motivo('maestra.lucia@')).toBe('sin-servidor');
  });

  it('el remitente que miente: el nombre no dice de dónde viene, el dominio sí', () => {
    // Las dos se llaman «Maestra Lucía»: el nombre no distingue nada.
    expect(FALSA_LUCIA.nombre).toBe(LUCIA.nombre);
    expect(dominioDe(FALSA_LUCIA.direccion)).toBe('regalos-ya.info');
    expect(dominioDe(LUCIA.direccion)).toBe('tecnia-escuela.mx');
    expect(usuarioDe(LUCIA.direccion)).toBe('maestra.lucia');
    expect(mismoDominio(LUCIA.direccion, DIEGO.direccion)).toBe(true);
    expect(mismoDominio(LUCIA.direccion, FALSA_LUCIA.direccion)).toBe(false);
    expect(dominioDe('sin-arroba')).toBe('');
  });

  it('enlaceEnganoso es un hecho, no un veredicto: sólo si el texto aparenta otro sitio', () => {
    expect(enlaceEnganoso({ texto: 'tecnia-escuela.mx', destino: 'https://robo-cuentas.info/entrar' })).toBe(true);
    // Un texto que no aparenta ser una dirección no miente: no dice nada.
    expect(enlaceEnganoso({ texto: 'pulsa aquí', destino: 'https://robo-cuentas.info' })).toBe(false);
    // Mismo anfitrión con otra ruta, y con `www.`: no hay engaño.
    expect(enlaceEnganoso({ texto: 'tecnia-escuela.mx', destino: 'https://www.tecnia-escuela.mx/notas' })).toBe(false);
  });

  it('el adjunto peligroso lo delata la ÚLTIMA extensión, y por eso caza la doble', () => {
    expect(tipoDeAdjunto('lista-de-materiales.pdf')).toBe('documento');
    expect(tipoDeAdjunto('foto-de-la-fiesta.jpg.exe')).toBe('programa');
    expect(adjuntoPeligroso({ id: 'a', nombre: 'maqueta-final.jpg', kb: 1200 })).toBe(false);
    expect(adjuntoPeligroso({ id: 'b', nombre: 'foto-de-la-fiesta.jpg.exe', kb: 4200 })).toBe(true);
    expect(adjuntoPeligroso({ id: 'c', nombre: 'premio.bat', kb: 2 })).toBe(true);
  });

  it('marcarLeido y moverA devuelven el MISMO objeto cuando no hay cambio', () => {
    const m = mensaje({ id: 'x', de: LUCIA, leido: true });
    expect(marcarLeido(m, true)).toBe(m);
    expect(marcarLeido(m, false)).not.toBe(m);
    expect(moverA(m, 'recibidos')).toBe(m);
    expect(moverA(m, 'papelera').carpeta).toBe('papelera');
  });

  it('responder rellena el destinatario, no arrastra adjuntos y no encadena «Re: Re:»', () => {
    const con = mensaje({
      id: 'm9',
      de: LUCIA,
      asunto: 'Re: Materiales',
      adjuntos: [{ id: 'a1', nombre: 'lista.pdf', kb: 240 }],
    });
    const b = borradorDeRespuesta(con, SOFI);
    expect(b.origen).toBe('respuesta');
    expect(b.para).toEqual([LUCIA]);
    expect(b.cc).toEqual([]);
    expect(b.asunto).toBe('Re: Materiales');
    expect(b.adjuntos).toEqual([]);
    expect(b.cuerpo.some((p) => p.startsWith('> '))).toBe(true);
  });

  it('responder a todos pone en CC a los demás, nunca a uno mismo ni al remitente', () => {
    const con = mensaje({ id: 'm10', de: LUCIA, para: [SOFI, DIEGO], cc: [DIEGO, LUCIA] });
    const b = borradorDeRespuesta(con, SOFI, { aTodos: true });
    expect(b.origen).toBe('respuesta-a-todos');
    expect(b.para).toEqual([LUCIA]);
    expect(b.cc.map((p) => p.direccion)).toEqual([DIEGO.direccion]); // sin Sofi, sin Lucía, sin repetir
  });

  it('reenviar deja el destinatario VACÍO y SÍ se lleva los adjuntos', () => {
    const con = mensaje({ id: 'm11', de: LUCIA, adjuntos: [{ id: 'a1', nombre: 'lista.pdf', kb: 240 }] });
    const b = borradorDeReenvio(con);
    expect(b.origen).toBe('reenvio');
    expect(b.para).toEqual([]);
    expect(b.asunto).toBe('Rv: Un asunto');
    expect(b.adjuntos).toHaveLength(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2 · La máquina (useCorreo)
// ═══════════════════════════════════════════════════════════════════════════

describe('la máquina del correo', () => {
  const montar = () => renderHook(() => useCorreo({ yo: SOFI, mensajes: SEMILLA }));

  it('abrir selecciona, marca leído y baja el contador de sin leer', () => {
    const { result } = montar();
    expect(result.current.cuentas.recibidos).toEqual({ total: 2, sinLeer: 2 });
    act(() => {
      expect(result.current.abrir('m1')).toBe('ok');
    });
    expect(result.current.abierto?.id).toBe('m1');
    expect(result.current.cuentas.recibidos.sinLeer).toBe(1);
  });

  it('borrar no borra: manda a la papelera, y volver a borrar no destruye nada', () => {
    const { result } = montar();
    act(() => {
      expect(result.current.borrar('m1')).toBe('ok');
    });
    expect(result.current.mensajes).toHaveLength(2); // sigue ahí
    expect(result.current.enCarpeta('papelera').map((m) => m.id)).toEqual(['m1']);
    act(() => {
      expect(result.current.borrar('m1')).toBe('ya-en-papelera');
    });
    expect(result.current.mensajes).toHaveLength(2);
  });

  it('JUGAR MAL · responder a un correo que está en la papelera se rechaza y no abre borrador', () => {
    const { result } = montar();
    act(() => {
      result.current.borrar('m1');
    });
    act(() => {
      expect(result.current.responder('m1')).toBe('en-papelera');
      expect(result.current.reenviar('m1')).toBe('en-papelera');
    });
    expect(result.current.borrador).toBeNull();
  });

  it('JUGAR MAL · reenviar y darle a Enviar sin destinatario: se rechaza y el borrador NO se pierde', () => {
    const { result } = montar();
    act(() => {
      expect(result.current.reenviar('m1')).toBe('ok');
    });
    expect(result.current.borrador?.para).toEqual([]);
    act(() => {
      expect(result.current.enviar()).toBe('sin-destinatario');
    });
    expect(result.current.borrador).not.toBeNull(); // no se tira el trabajo del alumno
    expect(result.current.enCarpeta('enviados')).toHaveLength(0);
  });

  it('enviar bien deja el mensaje en Enviados, firmado por el buzón conectado', () => {
    const { result } = montar();
    act(() => {
      result.current.redactar({ para: [DIEGO], asunto: 'Ensayo', cuerpo: ['El martes a las 4.'] });
    });
    act(() => {
      expect(result.current.enviar('Ahora')).toBe('enviado');
    });
    const enviados = result.current.enCarpeta('enviados');
    expect(enviados).toHaveLength(1);
    expect(enviados[0].de).toEqual(SOFI);
    expect(enviados[0].para).toEqual([DIEGO]);
    expect(result.current.borrador).toBeNull();
  });

  it('JUGAR MAL · un id que no existe no rompe nada: «no-existe» en las cuatro puertas', () => {
    const { result } = montar();
    act(() => {
      expect(result.current.abrir('fantasma')).toBe('no-existe');
      expect(result.current.marcar('fantasma')).toBe('no-existe');
      expect(result.current.mover('fantasma', 'papelera')).toBe('no-existe');
      expect(result.current.borrar('fantasma')).toBe('no-existe');
      expect(result.current.responder('fantasma')).toBe('no-existe');
    });
    expect(result.current.mensajes).toHaveLength(2);
  });

  it('JUGAR MAL · mover a la carpeta en la que ya está avisa; a «no deseado» funciona', () => {
    const { result } = montar();
    act(() => {
      expect(result.current.mover('m1', 'recibidos')).toBe('ya-esta-ahi');
      expect(result.current.mover('m1', 'no-deseado')).toBe('ok');
    });
    expect(result.current.enCarpeta('no-deseado').map((m) => m.id)).toEqual(['m1']);
    expect(result.current.enCarpeta('recibidos').map((m) => m.id)).toEqual(['m2']);
  });

  it('JUGAR MAL · adjuntar dos veces el mismo archivo no lo duplica', () => {
    const { result } = montar();
    act(() => {
      result.current.redactar();
    });
    act(() => {
      result.current.adjuntar({ id: 'a1', nombre: 'maqueta.jpg', kb: 1200 });
      result.current.adjuntar({ id: 'a1', nombre: 'maqueta.jpg', kb: 1200 });
    });
    expect(result.current.borrador?.adjuntos).toHaveLength(1);
    act(() => {
      result.current.quitarAdjunto('a1');
    });
    expect(result.current.borrador?.adjuntos).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3 · La ventana (VentanaCorreo)
// ═══════════════════════════════════════════════════════════════════════════

describe('la ventana del correo', () => {
  const abierto = mensaje({
    id: 'm1',
    de: FALSA_LUCIA,
    asunto: 'Tu cuenta',
    enlaces: [{ texto: 'tecnia-escuela.mx', destino: 'https://robo-cuentas.info/entrar' }],
    adjuntos: [{ id: 'a1', nombre: 'premio.exe', kb: 4200 }],
  });

  it('sin `acciones` no ofrece NI UN botón; con dos, pinta esos dos', () => {
    const { rerender } = render(
      <VentanaCorreo carpetaActiva="recibidos" mensajes={[abierto]} abierto={abierto} />,
    );
    expect(screen.queryByTestId('correo-acciones')).toBeNull();
    rerender(
      <VentanaCorreo
        carpetaActiva="recibidos"
        mensajes={[abierto]}
        abierto={abierto}
        acciones={['responder', 'borrar']}
      />,
    );
    expect(screen.getByTestId('correo-acciones').querySelectorAll('button')).toHaveLength(2);
  });

  it('las dos lupas están apagadas por omisión: ni la dirección real ni el destino del enlace', () => {
    const { rerender } = render(
      <VentanaCorreo carpetaActiva="recibidos" mensajes={[abierto]} abierto={abierto} />,
    );
    // La lista enseña sólo el nombre, como un cliente de verdad: el engaño sigue en pie.
    expect(screen.getByTestId('correo-fila').textContent).toContain('Maestra Lucía');
    expect(screen.queryByText(/regalos-ya\.info/)).toBeNull();
    expect(screen.getByTestId('correo-enlace').textContent).toContain('tecnia-escuela.mx');
    expect(screen.queryByTestId('correo-enlace-destino')).toBeNull();

    rerender(
      <VentanaCorreo carpetaActiva="recibidos" mensajes={[abierto]} abierto={abierto} mostrarDireccion mostrarDestino />,
    );
    expect(screen.getByTestId('correo-lectura').textContent).toContain('premios@regalos-ya.info');
    expect(screen.getByTestId('correo-enlace-destino').textContent).toContain('robo-cuentas.info');
  });

  it('`lectura` sustituye al panel de serie, y el aviso del .exe sólo si se pide', () => {
    const { rerender } = render(
      <VentanaCorreo carpetaActiva="recibidos" mensajes={[abierto]} abierto={abierto} />,
    );
    expect(screen.queryByTestId('correo-adjunto-alarma')).toBeNull();
    rerender(<VentanaCorreo carpetaActiva="recibidos" mensajes={[abierto]} abierto={abierto} avisarAdjuntos />);
    expect(screen.getByTestId('correo-adjunto-alarma')).toBeTruthy();
    rerender(
      <VentanaCorreo
        carpetaActiva="recibidos"
        mensajes={[abierto]}
        abierto={abierto}
        lectura={<p>La lupa de la clase</p>}
      />,
    );
    expect(screen.queryByTestId('correo-lectura')).toBeNull();
    expect(screen.getByText('La lupa de la clase')).toBeTruthy();
  });

  it('las carpetas y la lista avisan a la clase de lo que se pulsa', () => {
    const carpetas: string[] = [];
    const abiertos: string[] = [];
    render(
      <VentanaCorreo
        carpetaActiva="recibidos"
        mensajes={[abierto]}
        onCarpeta={(c) => carpetas.push(c)}
        onSeleccionar={(id) => abiertos.push(id)}
      />,
    );
    fireEvent.click(screen.getByTestId('correo-carpetas').querySelector('[data-carpeta="papelera"]')!);
    fireEvent.click(screen.getByTestId('correo-fila'));
    expect(carpetas).toEqual(['papelera']);
    expect(abiertos).toEqual(['m1']);
  });
});
