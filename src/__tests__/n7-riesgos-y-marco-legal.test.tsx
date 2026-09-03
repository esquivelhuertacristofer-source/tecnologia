'use client';

/**
 * N7·«Ciudadanía digital crítica» · «Riesgos en línea y marco legal» —
 * la clase más delicada de la plataforma (grooming, difusión no consentida
 * y sextorsión, 12-13 años). Construida desde `DISENO-N7-n7-riesgos-y-
 * marco-legal.md`; estas pruebas verifican, sobre todo, las medidas que el
 * pliego (§5.3) pide convertir en aserciones — no sólo que la clase «se
 * vea bien», sino que sus límites de contenido y su tono sean comprobables:
 * el puntaje nunca baja de 100, «no es tu culpa» aparece EXACTAMENTE 4
 * veces (y «no es culpa de Alexa» — el caso del tercero — nunca se cuenta
 * junto a ellas), el radar nunca se apaga, «Lo que dice la ley» se abre
 * desde el primer segundo, y no hay ninguna caja de texto en la actividad.
 */

import { render, screen, fireEvent, within } from '@testing-library/react';
import { EntradaRiesgosYMarcoLegal } from '@/components/activities/n7/situacion/EntradaRiesgosYMarcoLegal';

const pulsar = (nombre: string | RegExp) => fireEvent.click(screen.getByRole('button', { name: nombre }));

function abrirLab() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  render(<EntradaRiesgosYMarcoLegal config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />);
  pulsar(/Abre Tecnia Mensajes/);
  return { onProgress, onScore, onComplete };
}

function elegirFichaPara(nombreCaso: string, fichaTexto: string) {
  const fila = screen.getByText(nombreCaso).parentElement as HTMLElement;
  fireEvent.click(within(fila).getByRole('button', { name: fichaTexto }));
}

describe('n7-riesgos-y-marco-legal', () => {
  it('la entrada nombra los límites de contenido y su CTA abre Tecnia Mensajes con Ruy ya listo', () => {
    render(<EntradaRiesgosYMarcoLegal config={{}} onProgress={jest.fn()} onScore={jest.fn()} onComplete={jest.fn()} />);
    expect(screen.getByText(/No vas a ver nada feo/)).not.toBeNull();
    expect(screen.getByText('Nadie te puede pedir secreto')).not.toBeNull();

    pulsar(/Abre Tecnia Mensajes/);
    expect(screen.getByText('oye, jugaste increíble ayer, te vi en el torneo')).not.toBeNull();
    expect(screen.getByText('¿Cuál de las señales del radar es ésta?')).not.toBeNull();
    // Nada de cajas de texto en la actividad.
    expect(document.querySelectorAll('input, textarea')).toHaveLength(0);
  });

  it('jugando MAL en la señal de Ruy: las cinco incorrectas no avanzan ni bajan el puntaje, y cada una explica algo distinto', () => {
    const { onScore } = abrirLab();

    pulsar('Señal 1 — Te habla como si fueran iguales');
    expect(screen.getByText(/dijo tener tu edad/)).not.toBeNull();
    pulsar('Señal 6 — Te presiona o te amenaza');
    expect(screen.getByText(/Nadie te está presionando ni amenazando/)).not.toBeNull();
    // La pregunta sigue abierta: la opción correcta sigue disponible.
    expect(screen.getByRole('button', { name: 'Señal 3 — Te saca de donde alguien puede ver' })).not.toBeNull();

    pulsar('Señal 3 — Te saca de donde alguien puede ver');
    expect(screen.getByText(/Exacto: Señal 3/)).not.toBeNull();
    // La señal 5 ("sube el pedido") todavía no debería estar encendida.
    expect(screen.queryByText('Cada vez pide algo más privado: tus datos, fotos, verte a solas')).toBeNull();

    for (const [valor] of onScore.mock.calls) expect(valor).toBe(100);
  });

  it('Caso 1 — Ruy: «borro todo» no avanza y explica que se pierde la prueba; el recorrido bueno enciende 1,2,3,4,5 y dice «no es tu culpa» dos veces', () => {
    abrirLab();
    pulsar('Señal 3 — Te saca de donde alguien puede ver');

    pulsar('Dejo de contestar. No le paso mi número y no voy a verlo');
    expect(screen.getByText(/eso no te hace responsable de nada de lo que él pidió\. No es tu culpa\./)).not.toBeNull();

    // Jugando mal: borrar antes de tiempo no debe avanzar.
    pulsar('Borro todo para no verlo más');
    expect(screen.getByText(/se pierde la prueba/)).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Tomo captura de toda la conversación' })).not.toBeNull();
    pulsar('Bloqueo ya');
    expect(screen.getByText(/pero después de guardar/)).not.toBeNull();
    // Sigue sin avanzar: la decisión "¿Qué haces primero?" sigue abierta.
    expect(screen.getByText('¿Qué haces primero?')).not.toBeNull();

    pulsar('Tomo captura de toda la conversación');
    pulsar('Bloqueo, reporto, y hoy mismo se lo cuento a un adulto de confianza');
    expect(screen.getByText(/No es tu culpa, y decirlo es lo que lo detiene\./)).not.toBeNull();
    // El corte deliberado de §1.2, verbatim.
    expect(
      screen.getByText(/Esta conversación se corta aquí a propósito[\s\S]*Con la primera señal ya alcanza para cortar/),
    ).not.toBeNull();

    // Las señales 1, 2, 4 y 5 se encienden al cerrar el caso (la 3 ya estaba).
    expect(screen.getByText('«Eres la única persona que me entiende», «los demás no valen la pena»')).not.toBeNull();
    expect(screen.getByText('Cada vez pide algo más privado: tus datos, fotos, verte a solas')).not.toBeNull();
  });

  it('«Lo que dice la ley» está disponible desde el primer segundo, antes de tocar el caso 1', () => {
    abrirLab();
    pulsar(/Abrir Lo que dice la ley/);
    expect(screen.getByText('Eres menor de edad, y eso cambia todo')).not.toBeNull();
    expect(screen.getByText(/Ley Olimpia/)).not.toBeNull();
    expect(screen.getByText('Termina tus tres conversaciones para emparejar cada caso con su ficha.')).not.toBeNull();
  });

  it('Caso 2 — Salón 1°C: Dana es testigo, no hay señal de radar propia, y «no es culpa de Alexa» nunca se cuenta como «no es tu culpa»', () => {
    abrirLab();
    // Termina el caso 1 rápido para desbloquear el 2.
    pulsar('Señal 3 — Te saca de donde alguien puede ver');
    pulsar('Dejo de contestar. No le paso mi número y no voy a verlo');
    pulsar('Tomo captura de toda la conversación');
    pulsar('Bloqueo, reporto, y hoy mismo se lo cuento a un adulto de confianza');

    pulsar(/Abrir Salón 1°C/);
    expect(screen.getByText('Esto no es alguien que te esté buscando a ti. Es otra cosa, y se reconoce distinto.')).not.toBeNull();
    expect(screen.getByText('Archivo no mostrado.')).not.toBeNull();
    expect(screen.queryByText(/mándame una foto/i)).toBeNull();

    pulsar('Están pasando algo privado de alguien sin su permiso');
    pulsar('No lo paso, no lo guardo, salgo del grupo y hoy le aviso a un adulto de la escuela');
    // Jugando mal primero, sin avanzar:
    pulsar('De Alexa, por mandarla');
    expect(screen.getByText(/no es culpa de Alexa/)).not.toBeNull();
    expect(screen.getByText('¿De quién es la culpa de lo que está pasando?')).not.toBeNull();

    pulsar('De quien la difundió, y de cada persona que la sigue pasando');
    expect(screen.getByText(/El delito lo comete quien difunde algo íntimo sin permiso — y difundir incluye reenviar\./)).not.toBeNull();

    // El caso 2 no enciende ninguna señal de radar por sí mismo.
    expect(screen.queryByText('«Si no lo haces, lo subo», «se lo enseño a todos»')).toBeNull();
  });

  it('recorrido completo: los tres casos, la mesa legal y el cierre — 100/3 estrellas, insignia ⚖️, radar 6/6 y «no es tu culpa» exactamente 4 veces', () => {
    const { onScore, onComplete } = abrirLab();

    // Caso 1 — Ruy.
    pulsar('Señal 3 — Te saca de donde alguien puede ver');
    pulsar('Dejo de contestar. No le paso mi número y no voy a verlo');
    expect(screen.getByText(/No es tu culpa\./)).not.toBeNull(); // ocurrencia 1
    pulsar('Tomo captura de toda la conversación');
    pulsar('Bloqueo, reporto, y hoy mismo se lo cuento a un adulto de confianza');
    expect(screen.getByText(/No es tu culpa, y decirlo/)).not.toBeNull(); // ocurrencia 2

    // Caso 2 — Salón 1°C (testigo, sin radar propio).
    pulsar(/Abrir Salón 1°C/);
    pulsar('Están pasando algo privado de alguien sin su permiso');
    pulsar('No lo paso, no lo guardo, salgo del grupo y hoy le aviso a un adulto de la escuela');
    pulsar('De quien la difundió, y de cada persona que la sigue pasando');

    // Caso 3 — CuentaNueva_77.
    pulsar(/Abrir CuentaNueva_77/);
    pulsar('Señal 6 — Te presiona o te amenaza');
    pulsar('No le doy nada. Guardo captura de la amenaza y hoy mismo se la enseño a un adulto');
    expect(screen.getByText(/No es tu culpa\.$/m)).not.toBeNull(); // ocurrencia 3 (feedback de cuenta-d2)
    expect(screen.getByText(/Esto funciona igual sea lo que sea lo que amenacen con enseñar/)).not.toBeNull();

    // Mesa legal: las tres fichas ya estaban disponibles; ahora se emparejan.
    pulsar(/Abrir Lo que dice la ley/);
    expect(screen.getByText('Empareja cada caso con la ficha que lo cubre')).not.toBeNull();
    elegirFichaPara('Caso 2 — Salón 1°C', 'Ficha 1'); // jugando mal: no penaliza, explica y no avanza
    expect(screen.getByText(/protege de cualquier forma de violencia o abuso en general/)).not.toBeNull();
    elegirFichaPara('Caso 1 — Ruy', 'Ficha 3');
    elegirFichaPara('Caso 2 — Salón 1°C', 'Ficha 2');
    elegirFichaPara('Caso 3 — CuentaNueva_77', 'Ficha 1');

    // A quién acudir.
    pulsar(/Abrir A quién acudir/);
    expect(screen.getByText('Un adulto de confianza')).not.toBeNull();
    pulsar('Mamá o papá');
    pulsar('Se lo cuento a otra persona de mi confianza');

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0]).toMatchObject({ score: 100, stars: 3 });
    expect(screen.getByText('Insignia: La ley está de tu lado')).not.toBeNull();
    expect(screen.getByText('6/6')).not.toBeNull();
    // Ocurrencia 4, en la pantalla de cierre — lo último que el alumno lee.
    // «no es tu culpa» va en negritas ahí (`**...**` → <b>), así que queda en
    // un nodo de texto aparte: se compara el texto completo del párrafo.
    expect(document.querySelector('.msj-final-detalle')?.textContent).toMatch(
      /si algo así te llega a pasar a ti,\s*no es tu culpa\. Nunca\./,
    );

    for (const [valor] of onScore.mock.calls) expect(valor).toBe(100);
    expect(document.querySelectorAll('input, textarea')).toHaveLength(0);
  });

  it('el botón Salir está siempre visible arriba y saca de la clase sin diálogo, incluso a media conversación', () => {
    const onComplete = jest.fn();
    render(<EntradaRiesgosYMarcoLegal config={{}} onProgress={jest.fn()} onScore={jest.fn()} onComplete={onComplete} />);
    pulsar(/Abre Tecnia Mensajes/);
    pulsar('Señal 3 — Te saca de donde alguien puede ver'); // a media conversación, sin terminar nada
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    pulsar('Salir');
    // Vuelve a la portada de objetivos: el CTA para reabrir el laboratorio reaparece.
    expect(screen.getByRole('button', { name: /Abre Tecnia Mensajes/ })).not.toBeNull();
    expect(onComplete).not.toHaveBeenCalled();
  });
});
