'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { PISO_Y } from '../../arcade3d/EscenaArcade3D';
import { SondaEscena3D } from '../../arcade3d/SondaEscena3D';
import { CajonPortada3D, MesaMaquetacion3D, type Charola } from './piezasN4U4';

/**
 * N4·U4 · Parada 2 «Formas, WordArt e imágenes» (documento §26.2).
 *
 * La segunda parada de la Mesa de Maquetación, y la que cambia el sujeto: en la
 * parada 1 el alumno acomodaba DATOS y aquí compone una PÁGINA. La hoja del
 * caballete ya no es la de la tabla —eso está medido y no cabe, §26.2-bis B—:
 * es la PORTADA del mismo folleto, que es otra página.
 *
 * ── POR QUÉ EL TÍTULO SE ELIGE VIÉNDOLO PUESTO ──────────────────────────────
 * Las tres placas de estilo viven en el cajón, pero al pasar por encima el
 * título de la hoja se previsualiza con ese estilo. Elegir entre tres nombres
 * sería una pregunta de opción múltiple; elegir entre tres títulos que ya se
 * ven puestos es maquetar, y es lo que hace la galería de WordArt de verdad.
 *
 * ── POR QUÉ «VER DE LEJOS» ENCOGE LA PÁGINA Y NO ALEJA LA CÁMARA ────────────
 * El rig lleva el zoom desactivado a propósito: los paneles son billboards de
 * tamaño fijo en píxeles y alejar la cámara agranda el mueble dejando el panel
 * igual. Pero además la solución correcta era la otra: un procesador de textos
 * no te aleja de la mesa, te baja el zoom de la página. Al cuarenta y cinco por
 * ciento un título ilegible se pierde de verdad, y ésa es la corrección: no la
 * dice Bit, la ve el alumno.
 *
 * ── POR QUÉ LOS TIRADORES SON BOTONES ───────────────────────────────────────
 * La imagen mide unos ciento treinta píxeles dentro de la hoja, así que sus
 * ocho tiradores medirían diez cada uno: intocables con el dedo. Son botones, y
 * al pulsar uno la imagen se reescala con animación —el de esquina crece
 * proporcionado, el de lado se estira y se ve deformado—. El gesto cambia, la
 * consecuencia visual no, que es lo único que enseña. Y el estirón se deshace
 * solo: un error que no se puede deshacer no sirve para enseñar.
 */

/**
 * Las líneas de Bit, con un tope de largo que está MEDIDO: su globo cabe en dos
 * renglones de unos cuarenta y siete caracteres, y al tercero empieza en el
 * píxel 665 y se come la esquina inferior izquierda de la barra, que acaba en
 * el 685. Por eso las líneas que encadenan «bien hecho» con «ahora esto otro»
 * tienen su propia versión corta en vez de concatenar las dos largas.
 */
const LINEAS = {
  inicio: 'Vamos a hacer una portada de verdad. Empecemos por el título.',
  estiloBueno: '¡Ese sí se lee de lejos! Un título tiene que leerse, no sólo verse bonito.',
  estiloBuenoYPrueba: 'Ése promete. Pero compruébalo: bájale el zoom y míralo de lejos.',
  estiloDuda: 'Puede que de cerca te guste. Baja el zoom y míralo de lejos, a ver si se lee.',
  finoLejos: '¿Ves? Tan delgado y del color del papel, de lejos ya no está. Prueba otro.',
  recargadoLejos: 'Ese estilo tiene tantos efectos que las letras se pisan. Prueba otro.',
  buenoLejos: 'Se lee igual de lejos que de cerca. Ése es el trabajo de un título.',
  buenoLejosYForma: 'Se lee igual de lejos. Ahora marca con una forma el dato del zorro.',
  forma: 'Una forma sirve para marcar lo importante. Marca que el zorro sale de noche.',
  formaBien: '¡Eso es! Ahora ese dato salta a la vista antes que nada.',
  formaBienYFoto: '¡Eso es! Ahora saca la foto y ponla junto al renglón del zorro.',
  formaCirculoYFoto: 'Sirve, aunque rodea peor que un recuadro. Ahora saca la foto.',
  formaCirculo: 'Sirve, aunque un círculo rodea un renglón entero peor que un recuadro.',
  formaGlobo: 'Un globo es para que alguien hable, y aquí no habla nadie. Usa otra.',
  formaTitulo: 'El título ya destaca solo, no necesita marco. Marca el dato del zorro.',
  formaHueco: 'Ahí no hay nada que marcar, y una forma sin motivo estorba.',
  imagen: 'Ahora la foto del zorro. Ponla cerca del renglón que habla de él.',
  imagenLejos: 'Al final del todo queda lejísimos de lo que explica. Ponla junto a su renglón.',
  imagenBien: 'Ahí sí: la foto y su texto se leen juntos.',
  imagenBienYAjuste: 'La foto y su texto ya se leen juntos. Ahora acomoda el texto.',
  ajuste: 'Falta acomodar el texto alrededor de la foto. Prueba las dos palancas.',
  ajusteHueco: 'Arriba y abajo deja ese hueco enorme al lado. Prueba «alrededor».',
  ajusteBien: 'Así el texto abraza la foto y no queda ni un hueco raro.',
  ajusteBienYTamano: 'Así el texto abraza la foto. Se ve chiquita: agrándala de una esquina.',
  tamano: 'Se ve chiquita. Agrándala jalando de una esquina, nunca de un lado.',
  deforma: '¡Jala de la esquina, no del lado! Mira cómo se deforma. Te lo deshago.',
  tamanoBien: 'Ese es el tamaño justo: se ve bien y no tapa el texto.',
  tamanoBienYRevisa: 'Ése es el tamaño justo. Bájale el zoom y mira tu portada entera.',
  tamanoTope: 'Más grande ya taparía el texto. Del tamaño justo, no del más grande.',
  revisa: 'Última cosa: bájale el zoom y mira tu portada entera, como la verá quien la lea.',
  fin: '¡Quedó de revista! Título, forma e imagen en su lugar.',
};

type Etapa = 'estilo' | 'forma' | 'imagenDonde' | 'ajuste' | 'tamano' | 'revisa';

type Estilo = 'est-grueso' | 'est-fino' | 'est-recargado';
type Forma = 'for-recuadro' | 'for-circulo' | 'for-flecha' | 'for-globo';
type Ancla = 'dato' | 'titulo' | 'hueco';

/** Los tres tamaños por los que pasa la imagen; el tercero es el bueno. */
const ESCALAS = [70, 85, 100] as const;

const ESTILOS: Estilo[] = ['est-grueso', 'est-fino', 'est-recargado'];
const FORMAS: Forma[] = ['for-recuadro', 'for-circulo', 'for-flecha', 'for-globo'];

/** Qué charola tiene fuera el cajón en cada etapa. */
const CHAROLA_DE: Record<Etapa, Charola> = {
  estilo: 'titulo',
  forma: 'formas',
  imagenDonde: 'imagen',
  ajuste: 'imagen',
  tamano: 'imagen',
  revisa: 'imagen',
};

const PIEZAS_DE: Record<Etapa, string[]> = {
  estilo: ESTILOS,
  forma: FORMAS,
  imagenDonde: ['img-zorro'],
  ajuste: ['img-zorro'],
  tamano: ['img-zorro'],
  revisa: ['img-zorro'],
};

const ENCARGO: Record<Etapa, string> = {
  estilo: 'Elige el estilo del título y compruébalo de lejos.',
  forma: 'Marca con una forma el dato del zorro.',
  imagenDonde: 'Saca la foto del cajón y ponla junto a su renglón.',
  ajuste: 'Acomoda el texto alrededor de la foto.',
  tamano: 'Agranda la foto jalando de una esquina.',
  revisa: 'Mira tu portada de lejos para darla por buena.',
};

/** Lo que la barra dice de sí misma: la herramienta, nunca el encargo. */
const HERRAMIENTA: Record<Etapa, string> = {
  estilo: 'Galería de estilos · zoom de página',
  forma: 'Formas · suéltala en la hoja',
  imagenDonde: 'Imagen · elige dónde va',
  ajuste: 'Ajuste de texto',
  tamano: 'Tiradores de tamaño',
  revisa: 'Zoom de página',
};

const TITULO = 'El desierto';
// Un renglón, y está contado. El presupuesto de la hoja son 228 px de contenido
// (258 menos el relleno y el borde) y el caso peor —ajuste «arriba y abajo»,
// con la foto sin flotar y el texto entero debajo— pedía 238 con la entradilla
// a dos renglones. Manda el caso peor, no el bonito.
const ENTRADILLA = 'Éstos son los animales del desierto y cómo aguantan el sol.';
const DATO = 'El zorro del desierto sale de noche.';
// Medido: con el ajuste «arriba y abajo» la portada crece de 258 a 268 px y se
// sale de su chapa, porque el texto deja de abrazar la foto y baja entero. El
// caso peor es el que manda, así que el cuerpo se acorta hasta que el modo
// bloque también cabe.
const CUERPO =
  'De día se esconde bajo la arena, y en cuanto baja el sol sale a cazar con esas orejas enormes que le sirven para oír.';

/** Un paso por cada decisión: estilo, mirada de lejos, forma, dónde va la foto,
 *  ajuste, los dos tirones de esquina que faltan y la revisión final. */
const TOTAL_PASOS = 1 + 1 + 1 + 1 + 1 + (ESCALAS.length - 1) + 1;

function formatTiempo(segundos: number): string {
  return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`;
}

export function LabFormasYWordArt(props: ActivityProps & { alSalir?: () => void }) {
  const [etapa, setEtapa] = useState<Etapa>('estilo');
  const [estilo, setEstilo] = useState<Estilo | null>(null);
  const [previa, setPrevia] = useState<Estilo | null>(null);
  const [lejos, setLejos] = useState(false);
  const [vistoDeLejos, setVistoDeLejos] = useState(false);
  const [forma, setForma] = useState<Forma | null>(null);
  const [enMano, setEnMano] = useState<string | null>(null);
  const [imagenPuesta, setImagenPuesta] = useState(false);
  const [ajuste, setAjuste] = useState<'alrededor' | 'bloque' | null>(null);
  const [escala, setEscala] = useState(0);
  const [deformada, setDeformada] = useState<'ancho' | 'alto' | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  // El reloj arranca en un efecto y no en el `useRef`: `Date.now()` en el cuerpo
  // del render es una llamada impura y la regla `react-hooks/purity` la rechaza.
  const sim = useRef({ errores: 0, inicio: 0 });
  useEffect(() => {
    sim.current.inicio = Date.now();
  }, []);

  const propsRef = useRef(props);
  useEffect(() => {
    propsRef.current = props;
  });

  const hechos =
    (estilo === 'est-grueso' ? 1 : 0) +
    (vistoDeLejos ? 1 : 0) +
    (forma ? 1 : 0) +
    (imagenPuesta ? 1 : 0) +
    (ajuste === 'alrededor' ? 1 : 0) +
    escala +
    (terminado ? 1 : 0);

  useEffect(() => {
    propsRef.current.onProgress(Math.min(1, hechos / TOTAL_PASOS));
  }, [hechos]);

  const puntaje = () => Math.max(60, Math.min(100, 100 - sim.current.errores * 6));

  const restar = () => {
    reproducirTono('error');
    sim.current.errores += 1;
    propsRef.current.onScore(puntaje());
  };

  const avisar = (texto: string) => {
    setAviso(texto);
    timers.despues(() => setAviso(null), 3000);
  };

  // El tiempo entra por parámetro y no se lee aquí dentro: `react-hooks/purity`
  // marca `Date.now()` en el cuerpo de una función del componente, así que el
  // reloj se consulta en el sitio de la llamada, que ya es un diferido.
  const terminar = (tiempoSegundos: number) => {
    reproducirTono('complete');
    hablar(LINEAS.fin);
    const score = puntaje();
    propsRef.current.onProgress(1);
    propsRef.current.onScore(score);
    propsRef.current.onComplete({
      score,
      stars: 3,
      xp: score,
      errores: sim.current.errores,
      tiempoSegundos,
    });
    setTiempoFinal(tiempoSegundos);
    setErroresFinal(sim.current.errores);
    setTerminado(true);
  };

  /* ── Misión 1 · el título artístico ──────────────────────────────────────── */

  const tomarPieza = (id: string) => {
    if (terminado) return;
    if (etapa === 'estilo') {
      elegirEstilo(id as Estilo);
      return;
    }
    reproducirTono('select');
    setEnMano((previo) => (previo === id ? null : id));
  };

  const elegirEstilo = (elegido: Estilo) => {
    reproducirTono('select');
    setEstilo(elegido);
    setPrevia(null);
    if (elegido === 'est-grueso') {
      // Ni siquiera el estilo bueno se da por bueno sin comprobarlo: la regla de
      // la parada es que un título se juzga de lejos, y eso vale también cuando
      // se acertó a la primera.
      hablar(LINEAS.estiloBuenoYPrueba);
      avisar('Compruébalo de lejos');
      return;
    }
    // Con un estilo malo NO se cobra error todavía: la corrección no la dice
    // Bit, la ve el alumno cuando baja el zoom. Cobrar aquí sería castigar por
    // no adivinar lo que la actividad todavía no ha enseñado.
    hablar(LINEAS.estiloDuda);
    avisar('Míralo de lejos');
  };

  const palancaLejos = () => {
    if (terminado) return;
    const nuevo = !lejos;
    setLejos(nuevo);
    reproducirTono('select');
    if (!nuevo) return;

    if (etapa === 'estilo') {
      if (estilo === 'est-grueso') {
        if (!vistoDeLejos) {
          reproducirTono('complete');
          setVistoDeLejos(true);
          hablar(LINEAS.buenoLejosYForma);
          setEtapa('forma');
        }
        return;
      }
      if (estilo === 'est-fino') {
        restar();
        hablar(LINEAS.finoLejos);
        avisar('No se lee');
        return;
      }
      if (estilo === 'est-recargado') {
        restar();
        hablar(LINEAS.recargadoLejos);
        avisar('Las letras se pisan');
      }
      return;
    }

    if (etapa === 'revisa') {
      reproducirTono('complete');
      timers.despues(
        () => terminar(Math.max(1, Math.round((Date.now() - sim.current.inicio) / 1000))),
        900,
      );
    }
  };

  /* ── Misión 2 · la forma que marca ───────────────────────────────────────── */

  const soltarEnAncla = (ancla: Ancla) => {
    if (terminado || etapa !== 'forma' || enMano === null) return;
    const pieza = enMano as Forma;
    setEnMano(null);

    if (pieza === 'for-globo') {
      restar();
      hablar(LINEAS.formaGlobo);
      avisar('Aquí nadie habla');
      return;
    }
    if (ancla === 'titulo') {
      restar();
      hablar(LINEAS.formaTitulo);
      avisar('El título ya destaca');
      return;
    }
    if (ancla === 'hueco') {
      restar();
      hablar(LINEAS.formaHueco);
      avisar('Ahí no hay nada');
      return;
    }

    reproducirTono('complete');
    setForma(pieza);
    hablar(pieza === 'for-circulo' ? LINEAS.formaCirculoYFoto : LINEAS.formaBienYFoto);
    setEtapa('imagenDonde');
  };

  /* ── Misión 3 · la imagen ────────────────────────────────────────────────── */

  const soltarImagen = (donde: 'junto' | 'final') => {
    if (terminado || etapa !== 'imagenDonde' || enMano === null) return;
    setEnMano(null);
    if (donde === 'final') {
      restar();
      hablar(LINEAS.imagenLejos);
      avisar('Queda lejos del texto');
      return;
    }
    reproducirTono('complete');
    setImagenPuesta(true);
    hablar(LINEAS.imagenBienYAjuste);
    setEtapa('ajuste');
  };

  const palancaAjuste = (cual: 'alrededor' | 'bloque') => {
    if (terminado || etapa !== 'ajuste') return;
    reproducirTono('select');
    setAjuste(cual);
    if (cual === 'bloque') {
      // Probarlo es parte de la lección: no cuesta error, cuesta verlo.
      hablar(LINEAS.ajusteHueco);
      avisar('Mira ese hueco');
      return;
    }
    reproducirTono('complete');
    hablar(LINEAS.ajusteBienYTamano);
    setEtapa('tamano');
  };

  const tirador = (cual: 'esquina' | 'lado', eje: 'ancho' | 'alto') => {
    if (terminado || etapa !== 'tamano' || deformada) return;
    if (cual === 'lado') {
      // El estirón se deshace solo. Un error irreversible no enseña: asusta.
      reproducirTono('error');
      sim.current.errores += 1;
      propsRef.current.onScore(puntaje());
      setDeformada(eje);
      hablar(LINEAS.deforma);
      avisar('Se deformó');
      timers.despues(() => setDeformada(null), 2200);
      return;
    }
    if (escala >= ESCALAS.length - 1) {
      hablar(LINEAS.tamanoTope);
      avisar('Ya taparía el texto');
      return;
    }
    reproducirTono('select');
    const siguiente = escala + 1;
    setEscala(siguiente);
    if (siguiente === ESCALAS.length - 1) {
      reproducirTono('complete');
      hablar(LINEAS.tamanoBienYRevisa);
      setEtapa('revisa');
    }
  };

  const repetir = () => {
    sim.current = { errores: 0, inicio: Date.now() };
    setEtapa('estilo');
    setEstilo(null);
    setPrevia(null);
    setLejos(false);
    setVistoDeLejos(false);
    setForma(null);
    setEnMano(null);
    setImagenPuesta(false);
    setAjuste(null);
    setEscala(0);
    setDeformada(null);
    setAviso(null);
    setTerminado(false);
    setTiempoFinal(0);
    setErroresFinal(0);
    propsRef.current.onProgress(0);
    propsRef.current.onScore(100);
    hablar(LINEAS.inicio);
  };

  /* ── La hoja: la portada del folleto ─────────────────────────────────────── */

  const estiloVisible = previa ?? estilo;
  const claseTitulo = [
    'maqueta3d-titular',
    estiloVisible ? `es-${estiloVisible.replace('est-', '')}` : 'es-vacio',
  ].join(' ');

  const anclaBoton = (ancla: Ancla, etiqueta: string) => (
    <button
      type="button"
      className={`maqueta3d-ancla${enMano ? ' es-lista' : ''}`}
      aria-label={`Soltar la forma ${etiqueta}`}
      disabled={!enMano}
      onClick={() => soltarEnAncla(ancla)}
    >
      <span aria-hidden="true">+</span>
    </button>
  );

  const hoja = (
    <div className={`maqueta3d-hoja maqueta3d-portada${lejos ? ' es-lejos' : ''}`}>
      <div className="maqueta3d-doc">
        <span className="maqueta3d-hoja-membrete">Estudio de creadores · folleto</span>

        <div className="maqueta3d-fila-titulo">
          <h3 className={claseTitulo}>{estiloVisible ? TITULO : 'Aquí va el título'}</h3>
          {etapa === 'forma' && anclaBoton('titulo', 'sobre el título')}
        </div>

        <p className="maqueta3d-entradilla">{ENTRADILLA}</p>

        <div className={`maqueta3d-bloque-zorro${ajuste === 'alrededor' && imagenPuesta ? ' es-alrededor' : ''}`}>
          {imagenPuesta && (
            <figure
              className={[
                'maqueta3d-foto',
                `es-${ESCALAS[escala]}`,
                deformada ? `es-deformada-${deformada}` : '',
                ajuste === 'alrededor' ? 'es-flota' : 'es-bloque',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="maqueta3d-foto-cielo" aria-hidden="true" />
              <span className="maqueta3d-foto-duna" aria-hidden="true" />
              <span className="maqueta3d-foto-zorro" aria-hidden="true" />
              <span className="maqueta3d-foto-zorro-hocico" aria-hidden="true" />
              {etapa === 'tamano' && (
                <>
                  {(['ancho', 'alto'] as const).map((eje) =>
                    [-1, 1].map((s) => (
                      <button
                        key={`lado-${eje}-${s}`}
                        type="button"
                        className={`maqueta3d-tirador es-lado es-${eje}-${s > 0 ? 'mas' : 'menos'}`}
                        aria-label={`Jalar del lado ${eje === 'ancho' ? 'derecho o izquierdo' : 'de arriba o de abajo'}`}
                        onClick={() => tirador('lado', eje)}
                      />
                    )),
                  )}
                  {([-1, 1] as const).map((sx) =>
                    ([-1, 1] as const).map((sy) => (
                      <button
                        key={`esq-${sx}-${sy}`}
                        type="button"
                        className={`maqueta3d-tirador es-esquina es-x${sx > 0 ? 'mas' : 'menos'} es-y${sy > 0 ? 'mas' : 'menos'}`}
                        aria-label="Jalar de la esquina para agrandar sin deformar"
                        onClick={() => tirador('esquina', 'ancho')}
                      />
                    )),
                  )}
                </>
              )}
            </figure>
          )}

          <p className={`maqueta3d-dato${forma ? ` es-marcado es-${forma.replace('for-', '')}` : ''}`}>
            {DATO}
            {etapa === 'forma' && anclaBoton('dato', 'junto al dato del zorro')}
          </p>
          <p className="maqueta3d-cuerpo">{CUERPO}</p>
          {etapa === 'imagenDonde' && (
            <button
              type="button"
              className={`maqueta3d-hueco-foto${enMano ? ' es-lista' : ''}`}
              aria-label="Poner la foto junto al renglón del zorro"
              disabled={!enMano}
              onClick={() => soltarImagen('junto')}
            >
              Aquí, junto a su texto
            </button>
          )}
        </div>

        <div className="maqueta3d-pie-hoja">
          {etapa === 'forma' && anclaBoton('hueco', 'en el hueco de abajo')}
          {etapa === 'imagenDonde' && (
            <button
              type="button"
              className={`maqueta3d-hueco-foto es-final${enMano ? ' es-lista' : ''}`}
              aria-label="Poner la foto al final del documento"
              disabled={!enMano}
              onClick={() => soltarImagen('final')}
            >
              Al final del todo
            </button>
          )}
        </div>
      </div>
    </div>
  );

  /* ── La barra: palancas arriba, estado abajo ─────────────────────────────── */

  const barra = (
    <div className="maqueta3d-barra">
      <div className="maqueta3d-palancas">
        <span className="maqueta3d-barra-titulo">
          Barra de
          <br />
          maquetación
        </span>
        <button
          type="button"
          className={[
            'maqueta3d-palanca',
            'es-lejos',
            lejos ? 'es-activa' : '',
            (etapa === 'revisa' || (etapa === 'estilo' && estilo !== null && !lejos)) ? 'es-pedida' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-label={lejos ? 'Volver al zoom normal de la página' : 'Ver la página de lejos'}
          aria-pressed={lejos}
          disabled={terminado}
          onClick={palancaLejos}
        >
          <span className="maqueta3d-lupa-icono" aria-hidden="true" />
          <span className="maqueta3d-palanca-pie">{lejos ? '100%' : 'Lejos'}</span>
        </button>
        {(['alrededor', 'bloque'] as const).map((cual) => (
          <button
            key={cual}
            type="button"
            className={[
              'maqueta3d-palanca',
              'es-ajuste',
              ajuste === cual ? 'es-activa' : '',
              etapa === 'ajuste' && cual === 'alrededor' ? 'es-pedida' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-label={
              cual === 'alrededor' ? 'Ajustar el texto alrededor de la foto' : 'Ajustar el texto arriba y abajo'
            }
            aria-pressed={ajuste === cual}
            disabled={terminado || etapa !== 'ajuste'}
            onClick={() => palancaAjuste(cual)}
          >
            <span className={`maqueta3d-ajuste-icono es-${cual}`} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="maqueta3d-palanca-pie">{cual === 'alrededor' ? 'Alrededor' : 'Bloque'}</span>
          </button>
        ))}
      </div>

      <div className="maqueta3d-charola">
        <span className="maqueta3d-charola-titulo es-sola">{HERRAMIENTA[etapa]}</span>
        {enMano && <span className="maqueta3d-en-mano">En la mano: {NOMBRE_PIEZA[enMano] ?? enMano}</span>}
      </div>
    </div>
  );

  const escena = (
    <>
      <SondaEscena3D />
      <MesaMaquetacion3D
        position={[-0.2, PISO_Y, 0]}
        reduceMotion={reduceMotion}
        cartela={
          <p className="maqueta3d-cartela">
            <span className="maqueta3d-cartela-tag">
              {etapa === 'estilo' ? 'Misión 1' : etapa === 'forma' ? 'Misión 2' : 'Misión 3'}
            </span>
            {terminado ? 'La portada quedó compuesta.' : ENCARGO[etapa]}
          </p>
        }
        hoja={hoja}
        barra={barra}
      >
        <CajonPortada3D
          charola={CHAROLA_DE[etapa]}
          piezas={PIEZAS_DE[etapa]}
          elegida={etapa === 'estilo' ? estilo : enMano}
          usadas={imagenPuesta ? ['img-zorro'] : []}
          onSenalar={(id) => {
            if (etapa === 'estilo') setPrevia(id as Estilo | null);
          }}
          onElegir={tomarPieza}
          bloqueado={terminado || etapa === 'ajuste' || etapa === 'tamano' || etapa === 'revisa'}
          reduceMotion={reduceMotion}
        />
      </MesaMaquetacion3D>
    </>
  );

  const respaldo = (
    <div className="escena3d-respaldo-lista">
      <p className="escena3d-respaldo-titulo">{ENCARGO[etapa]}</p>
      <div className="escena3d-respaldo-fila">
        {PIEZAS_DE[etapa].map((id) => (
          <button key={id} type="button" aria-label={`Tomar ${NOMBRE_PIEZA[id] ?? id}`} onClick={() => tomarPieza(id)}>
            {NOMBRE_PIEZA[id] ?? id}
          </button>
        ))}
      </div>
      {hoja}
      {barra}
    </div>
  );

  return (
    <ArcadeSala3D
      titulo="Formas y WordArt"
      pasoEtiqueta="Paso"
      pasoActual={Math.min(TOTAL_PASOS, hechos)}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="zoom"
      marcadorValor={lejos ? '45%' : '100%'}
      bit={linea}
      paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
      sinMostrador
      activa={!terminado}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={<p className="gabinete-nota">La mesa de maquetación · un título se lee, una forma marca, una foto acompaña</p>}
      final={
        terminado
          ? {
              insigniaNombre: 'Artista del título',
              insigniaEmoji: '✨',
              titulo: '¡Quedó de revista!',
              detalle:
                'Elegiste un título que se lee de lejos, marcaste con una forma el dato que importa y pusiste la foto junto a su texto, del tamaño justo y sin deformarla. Eso es componer una portada.',
              resumen: [
                { etiqueta: 'Pasos', valor: `${TOTAL_PASOS}` },
                { etiqueta: 'Tiempo', valor: formatTiempo(tiempoFinal) },
                { etiqueta: 'Errores', valor: `${erroresFinal}` },
              ],
              alRepetir: repetir,
            }
          : null
      }
    >
      {aviso && <AvisoRonda3D texto={aviso} clave={aviso} />}
    </ArcadeSala3D>
  );
}

/** Cómo se llama cada pieza cuando hay que nombrarla con palabras. */
const NOMBRE_PIEZA: Record<string, string> = {
  'est-grueso': 'Grueso con contorno',
  'est-fino': 'Delgado y claro',
  'est-recargado': 'Con muchos efectos',
  'for-recuadro': 'Recuadro',
  'for-circulo': 'Círculo',
  'for-flecha': 'Flecha',
  'for-globo': 'Globo de diálogo',
  'img-zorro': 'Foto del zorro',
};

export default LabFormasYWordArt;
