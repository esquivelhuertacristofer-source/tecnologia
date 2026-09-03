'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { PISO_Y } from '../../arcade3d/EscenaArcade3D';
import { SondaEscena3D } from '../../arcade3d/SondaEscena3D';
import { CajonRejilla3D, MesaMaquetacion3D } from './piezasN4U4';

/**
 * N4·U4 · Parada 1 «Tablas y columnas» (documento §26.1).
 *
 * La primera parada de la Mesa de Maquetación, y la que cambia el verbo de la
 * unidad: en N3·U5 el alumno daba FORMATO —negrita, cursiva, alineación— y aquí
 * empieza a MAQUETAR, que es decidir dónde va cada cosa.
 *
 * ── POR QUÉ LA TABLA SE INSERTA DESDE UN CAJÓN Y NO DESDE UN BOTÓN ──────────
 * Un botón «insertar tabla» no enseña nada: aparece una rejilla y ya. Estirar
 * una malla hasta tres por tres obliga a contar filas y columnas ANTES de tener
 * la tabla, que es justo el concepto de la parada. Por eso la rejilla es un
 * cajón de la mesa con celdas de verdad (raycast, §26.1-bis C) y su placa lleva
 * la cuenta en puntos, no en cifras.
 *
 * ── POR QUÉ EL ERROR SE COBRA EN LA COLUMNA Y NO EN LA CELDA ────────────────
 * Lo que la teórica pide entender no es «esta ficha va en este cuadrito» sino
 * «cada columna guarda el mismo tipo de dato». Así que soltar «insectos» en la
 * columna de Sale cuesta un error y Bit recuerda la regla; soltarlo en la fila
 * equivocada de su propia columna también, porque entonces el camello estaría
 * comiendo lo del zorro. Las dos cosas son el mismo fallo visto de dos maneras.
 *
 * ── EL FOLLETO SE CONSTRUYE ENCIMA DE SÍ MISMO ──────────────────────────────
 * La misión 2 no borra la tabla: el párrafo del desierto vive debajo de ella en
 * la misma hoja (§26.1-bis D). Por eso el párrafo es corto —tiene que caber— y
 * por eso al final se ve un folleto y no dos ejercicios seguidos.
 */

const LINEAS = {
  inicio: 'Hoy vamos a acomodar la información. Saca la rejilla: haremos una tabla.',
  tabla: 'Tres filas y tres columnas. ¿Ves los cuadritos? Cada uno es una celda.',
  tamanoMal: 'Casi. Necesito tres filas y tres columnas: cuenta los puntos de la placa.',
  encabezado: 'La primera fila es el encabezado: dice qué guarda cada columna.',
  encabezadoMal: 'Ese nombre no dice qué guarda la columna. Piensa qué vas a escribir debajo.',
  negrita: 'La primera fila es el encabezado: ponla en negrita para que se distinga.',
  negritaMal: 'Esa palanca todavía no. Primero pon el encabezado en negrita.',
  datos: 'Ahora los datos. Cada columna guarda el mismo tipo de cosa: no las mezcles.',
  datoMal: 'Ojo: esa columna era para lo que come. Ahí no va un color.',
  columnas: 'Dos columnas se leen mejor cuando el texto es largo, como en las revistas.',
  columnasYaEsUna: 'Ya está en una sola columna. Prueba a pasarlo a dos y mira qué pasa.',
  casos: 'Ahora decide tú. Para cada uno: ¿una columna o dos?',
  fin: '¡Qué bien acomodado quedó! Así cualquiera lo entiende de un vistazo.',
};

type Etapa = 'tabla' | 'encabezado' | 'negrita' | 'datos' | 'columnas' | 'casos';

/** Lo que dice cada columna, en orden. Es el orden del encabezado y del dato. */
const COLUMNAS = ['Animal', 'Come', 'Sale'] as const;

interface Ficha {
  id: string;
  texto: string;
  /** Fila de destino: 0 es el encabezado, 1 y 2 son los datos. */
  fila: number;
  /** Columna de destino, o `null` si la ficha no va en ninguna parte. */
  columna: number | null;
}

/**
 * Las cinco etiquetas de la charola del encabezado: las tres que nombran lo que
 * guarda su columna y dos distractoras. «Color» y «Bonito» no están puestas al
 * azar: la primera es un dato que sí existe pero que nadie pidió, y la segunda
 * es una opinión, no un dato. Entre las dos cubren las dos maneras de arruinar
 * un encabezado.
 */
const FICHAS_ENCABEZADO: Ficha[] = [
  { id: 'h-animal', texto: 'Animal', fila: 0, columna: 0 },
  { id: 'h-color', texto: 'Color', fila: 0, columna: null },
  { id: 'h-come', texto: 'Come', fila: 0, columna: 1 },
  { id: 'h-bonito', texto: 'Bonito', fila: 0, columna: null },
  { id: 'h-sale', texto: 'Sale', fila: 0, columna: 2 },
];

const FICHAS_DATO: Ficha[] = [
  { id: 'd-zorro', texto: 'Zorro del desierto', fila: 1, columna: 0 },
  { id: 'd-insectos', texto: 'insectos', fila: 1, columna: 1 },
  { id: 'd-noche', texto: 'de noche', fila: 1, columna: 2 },
  { id: 'd-camello', texto: 'Camello', fila: 2, columna: 0 },
  { id: 'd-plantas', texto: 'plantas secas', fila: 2, columna: 1 },
  { id: 'd-dia', texto: 'de día', fila: 2, columna: 2 },
];

/**
 * El párrafo del folleto.
 *
 * Su largo está medido, no elegido: el primero tenía dos renglones y al pasarlo
 * a dos columnas seguía midiendo 32 px de alto —un renglón por columna—, así
 * que la lección entera se quedaba invisible. Con cinco renglones a una columna
 * el reparto se ve: el bloque se parte en dos ríos y sube la mitad. Y sigue
 * cabiendo: la tabla llena termina en el píxel 375 y la hoja llega al 574.
 */
const PARRAFO =
  'En el desierto casi nunca llueve y el sol pega tan fuerte que el suelo quema. Por eso casi ningún animal sale a mediodía: se meten bajo una piedra o cavan un túnel donde el aire está fresco, y esperan. Cuando el sol baja, el desierto se despierta. Entonces salen a buscar comida y agua, y muchos aprovechan hasta el rocío de la mañana para beber.';

interface Caso {
  id: string;
  texto: string;
  correcta: 1 | 2;
  porque: string;
}

const CASOS: Caso[] = [
  {
    id: 'cuento',
    texto: 'Un cuento de dos páginas',
    correcta: 2,
    porque: 'Es texto largo: en dos columnas los renglones son más cortos y el ojo no se pierde al regresar.',
  },
  {
    id: 'titulo',
    texto: 'El título del folleto',
    correcta: 1,
    porque: 'Un título en dos columnas se ve aplastado. Ese déjalo en una.',
  },
  {
    id: 'tabla',
    texto: 'La tabla de animales que acabas de hacer',
    correcta: 1,
    porque: 'Una tabla es ancha: partida en dos, sus columnas quedan tan estrechas que ya no se leen.',
  },
];

/** Un paso por cada decisión: la tabla, tres etiquetas, la negrita, seis datos,
 *  las columnas y tres casos. */
const TOTAL_PASOS = 1 + 3 + 1 + 6 + 1 + CASOS.length;

const ENCARGO: Record<Etapa, string> = {
  tabla: 'Estira la rejilla del cajón hasta tres por tres y suéltala.',
  encabezado: 'Llena el encabezado: qué guarda cada columna.',
  negrita: 'Pon el encabezado en negrita con la palanca N.',
  datos: 'Coloca cada dato en su columna.',
  columnas: 'Pasa el párrafo a dos columnas.',
  casos: '¿Una columna o dos? Decide en los tres casos.',
};

/** Lo que la barra dice de sí misma en cada etapa: la herramienta, no el encargo. */
const HERRAMIENTA: Record<Etapa, string> = {
  tabla: 'Herramientas en reposo · la tabla se saca del cajón',
  encabezado: 'Herramientas en reposo · primero el encabezado',
  negrita: 'Palanca N · negrita',
  datos: 'Herramientas en reposo · primero los datos',
  columnas: 'Palancas 1 y 2 · columnas de texto',
  casos: 'Decisión de maquetación',
};

function formatTiempo(segundos: number): string {
  return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`;
}

/** Tres filas de tres celdas, todas vacías. */
function tablaVacia(): (string | null)[][] {
  return [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ];
}

export function LabTablasYColumnas(props: ActivityProps & { alSalir?: () => void }) {
  const [etapa, setEtapa] = useState<Etapa>('tabla');
  const [senalado, setSenalado] = useState({ filas: 0, columnas: 0 });
  const [tablaPuesta, setTablaPuesta] = useState(false);
  const [celdas, setCeldas] = useState<(string | null)[][]>(tablaVacia);
  const [colocadas, setColocadas] = useState<string[]>([]);
  const [enMano, setEnMano] = useState<string | null>(null);
  const [negrita, setNegrita] = useState(false);
  const [columnas, setColumnas] = useState<1 | 2>(1);
  const [caso, setCaso] = useState(0);
  const [malCelda, setMalCelda] = useState<string | null>(null);
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
    (tablaPuesta ? 1 : 0) +
    celdas[0].filter(Boolean).length +
    (negrita ? 1 : 0) +
    celdas[1].filter(Boolean).length +
    celdas[2].filter(Boolean).length +
    (columnas === 2 ? 1 : 0) +
    caso;

  useEffect(() => {
    propsRef.current.onProgress(Math.min(1, hechos / TOTAL_PASOS));
  }, [hechos]);

  const puntaje = () => Math.max(60, Math.min(100, 100 - sim.current.errores * 5));

  const restar = () => {
    reproducirTono('error');
    sim.current.errores += 1;
    propsRef.current.onScore(puntaje());
  };

  const avisar = (texto: string) => {
    setAviso(texto);
    timers.despues(() => setAviso(null), 3000);
  };

  const marcarMal = (clave: string) => {
    setMalCelda(clave);
    timers.despues(() => setMalCelda(null), 900);
  };

  // El tiempo entra por parámetro y no se lee aquí dentro: `react-hooks/purity`
  // marca `Date.now()` en el cuerpo de una función del componente, así que el
  // reloj se consulta en el sitio de la llamada, que ya es un diferido. Es el
  // mismo trato que en `LabSiPasaEsto`.
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

  /* ── Misión 1a · la rejilla del cajón ────────────────────────────────────── */

  const senalar = (filas: number, cols: number) => {
    if (etapa !== 'tabla' || terminado) return;
    setSenalado({ filas, columnas: cols });
  };

  const soltarRejilla = () => {
    if (etapa !== 'tabla' || terminado) return;
    if (senalado.filas !== 3 || senalado.columnas !== 3) {
      hablar(LINEAS.tamanoMal);
      avisar('Tres por tres');
      return;
    }
    reproducirTono('complete');
    setTablaPuesta(true);
    setEtapa('encabezado');
    hablar(`${LINEAS.tabla} ${LINEAS.encabezado}`);
  };

  /* ── Misión 1b y 1d · llenar celdas con las fichas de la charola ─────────── */

  const fichasVisibles: Ficha[] =
    etapa === 'encabezado' ? FICHAS_ENCABEZADO : etapa === 'datos' ? FICHAS_DATO : [];

  const tomar = (id: string) => {
    if (terminado) return;
    reproducirTono('select');
    setEnMano((previo) => (previo === id ? null : id));
  };

  const soltarEn = (fila: number, col: number) => {
    if (terminado || enMano === null) return;
    if (etapa !== 'encabezado' && etapa !== 'datos') return;
    const ficha = [...FICHAS_ENCABEZADO, ...FICHAS_DATO].find((f) => f.id === enMano);
    if (!ficha) return;
    // Una etapa sólo acepta su propia fila: en el encabezado no se pueden meter
    // datos, y al revés tampoco.
    const filaEsperada = etapa === 'encabezado' ? 0 : ficha.fila;
    if (fila !== filaEsperada || ficha.columna !== col) {
      restar();
      marcarMal(`${fila}:${col}`);
      hablar(etapa === 'encabezado' ? LINEAS.encabezadoMal : LINEAS.datoMal);
      avisar(etapa === 'encabezado' ? 'Ese nombre no' : 'Esa columna no');
      setEnMano(null);
      return;
    }
    reproducirTono('select');
    const nuevas = celdas.map((f) => [...f]);
    nuevas[fila][col] = ficha.texto;
    setCeldas(nuevas);
    setColocadas((previas) => [...previas, ficha.id]);
    setEnMano(null);

    if (etapa === 'encabezado' && nuevas[0].every(Boolean)) {
      reproducirTono('complete');
      setEtapa('negrita');
      hablar(LINEAS.negrita);
      return;
    }
    if (etapa === 'datos' && nuevas[1].every(Boolean) && nuevas[2].every(Boolean)) {
      reproducirTono('complete');
      setEtapa('columnas');
      hablar(LINEAS.columnas);
    }
  };

  /* ── Las palancas de la barra ────────────────────────────────────────────── */

  const palancaNegrita = () => {
    if (terminado) return;
    if (etapa !== 'negrita') {
      hablar(etapa === 'encabezado' ? LINEAS.encabezado : LINEAS.negritaMal);
      return;
    }
    reproducirTono('complete');
    setNegrita(true);
    setEtapa('datos');
    hablar(LINEAS.datos);
  };

  const palancaColumnas = (cuantas: 1 | 2) => {
    if (terminado) return;
    if (etapa !== 'columnas') {
      hablar(LINEAS.negritaMal);
      return;
    }
    if (cuantas === 1) {
      hablar(LINEAS.columnasYaEsUna);
      return;
    }
    reproducirTono('complete');
    setColumnas(2);
    setEtapa('casos');
    hablar(LINEAS.casos);
  };

  /* ── Misión 2b · los tres casos ──────────────────────────────────────────── */

  const responderCaso = (cuantas: 1 | 2) => {
    if (terminado || etapa !== 'casos') return;
    const actual = CASOS[caso];
    if (cuantas !== actual.correcta) {
      restar();
      hablar(actual.porque);
      avisar('No es ésa');
      return;
    }
    reproducirTono('complete');
    hablar(actual.porque);
    const siguiente = caso + 1;
    setCaso(siguiente);
    if (siguiente >= CASOS.length) {
      timers.despues(
        () => terminar(Math.max(1, Math.round((Date.now() - sim.current.inicio) / 1000))),
        1400,
      );
    }
  };

  const repetir = () => {
    sim.current = { errores: 0, inicio: Date.now() };
    setEtapa('tabla');
    setSenalado({ filas: 0, columnas: 0 });
    setTablaPuesta(false);
    setCeldas(tablaVacia());
    setColocadas([]);
    setEnMano(null);
    setNegrita(false);
    setColumnas(1);
    setCaso(0);
    setTerminado(false);
    setTiempoFinal(0);
    setErroresFinal(0);
    propsRef.current.onProgress(0);
    hablar(LINEAS.inicio);
  };

  /* ── La hoja: el folleto que se va construyendo ──────────────────────────── */

  const hoja = (
    <div className="maqueta3d-hoja">
      <span className="maqueta3d-hoja-membrete">Estudio de creadores · folleto</span>
      <h3 className="maqueta3d-hoja-titulo">Los animales del desierto</h3>

      {tablaPuesta ? (
        <table className="maqueta3d-tabla">
          <tbody>
            {celdas.map((fila, f) => (
              <tr key={f} className={f === 0 && negrita ? 'es-encabezado' : undefined}>
                {fila.map((valor, c) => {
                  const clave = `${f}:${c}`;
                  const activa =
                    !terminado &&
                    ((etapa === 'encabezado' && f === 0) || (etapa === 'datos' && f > 0)) &&
                    valor === null;
                  return (
                    <td
                      key={clave}
                      className={[
                        'maqueta3d-celda',
                        activa ? 'es-libre' : '',
                        malCelda === clave ? 'es-mal' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {activa ? (
                        <button
                          type="button"
                          className="maqueta3d-celda-boton"
                          aria-label={`Poner la ficha en la fila ${f + 1}, columna ${c + 1} (${COLUMNAS[c]})`}
                          disabled={enMano === null}
                          onClick={() => soltarEn(f, c)}
                        />
                      ) : (
                        valor
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="maqueta3d-hueco">Aquí va la tabla</p>
      )}

      <p className={`maqueta3d-parrafo${columnas === 2 ? ' es-dos' : ''}`}>{PARRAFO}</p>
    </div>
  );

  /* ── La barra: palancas arriba, charola abajo ────────────────────────────── */

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
          className={`maqueta3d-palanca${negrita ? ' es-activa' : ''}${etapa === 'negrita' ? ' es-pedida' : ''}`}
          aria-label="Poner en negrita la fila seleccionada"
          aria-pressed={negrita}
          disabled={terminado}
          onClick={palancaNegrita}
        >
          <span className="maqueta3d-palanca-letra">N</span>
        </button>
        {([1, 2] as const).map((n) => (
          <button
            key={n}
            type="button"
            className={[
              'maqueta3d-palanca',
              'es-columnas',
              columnas === n ? 'es-activa' : '',
              etapa === 'columnas' && n === 2 ? 'es-pedida' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-label={`Repartir el párrafo en ${n} columna${n === 2 ? 's' : ''}`}
            aria-pressed={columnas === n}
            disabled={terminado}
            onClick={() => palancaColumnas(n)}
          >
            <span className="maqueta3d-cols" aria-hidden="true">
              <i />
              {n === 2 && <i />}
            </span>
            <span className="maqueta3d-palanca-pie">{n}</span>
          </button>
        ))}
      </div>

      <div className="maqueta3d-charola">
        {etapa === 'casos' && !terminado ? (
          <>
            <span className="maqueta3d-charola-titulo">
              Caso {Math.min(caso + 1, CASOS.length)} de {CASOS.length}
            </span>
            <span className="maqueta3d-caso">{CASOS[Math.min(caso, CASOS.length - 1)].texto}</span>
            {([1, 2] as const).map((n) => (
              <button
                key={n}
                type="button"
                className="maqueta3d-ficha es-caso"
                onClick={() => responderCaso(n)}
              >
                {n} columna{n === 2 ? 's' : ''}
              </button>
            ))}
          </>
        ) : fichasVisibles.length > 0 && !terminado ? (
          <>
            <span className="maqueta3d-charola-titulo">Charola</span>
            {fichasVisibles.map((f) => {
              const puesta = colocadas.includes(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  className={[
                    'maqueta3d-ficha',
                    enMano === f.id ? 'es-mano' : '',
                    puesta ? 'es-puesta' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-label={puesta ? `${f.texto} (ya colocada)` : `Tomar la ficha ${f.texto}`}
                  aria-pressed={enMano === f.id}
                  disabled={puesta}
                  onClick={() => tomar(f.id)}
                >
                  {f.texto}
                </button>
              );
            })}
          </>
        ) : (
          // La charola NO repite la consigna: ésa vive en la cartela de la
          // cornisa y verla dos veces en la misma pantalla hace que ninguna de
          // las dos se lea. Aquí va sólo qué herramienta toca.
          <span className="maqueta3d-charola-titulo es-sola">{HERRAMIENTA[etapa]}</span>
        )}
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
              {etapa === 'casos' ? 'Misión 2' : etapa === 'columnas' ? 'Misión 2' : 'Misión 1'}
            </span>
            {terminado ? 'El folleto quedó acomodado.' : ENCARGO[etapa]}
          </p>
        }
        hoja={hoja}
        barra={barra}
      >
        <CajonRejilla3D
          filas={senalado.filas}
          columnas={senalado.columnas}
          onSenalar={senalar}
          onElegir={soltarRejilla}
          bloqueado={etapa !== 'tabla' || terminado}
          reduceMotion={reduceMotion}
        />
      </MesaMaquetacion3D>
    </>
  );

  const respaldo = (
    <div className="escena3d-respaldo-lista">
      <p className="escena3d-respaldo-titulo">{ENCARGO[etapa]}</p>
      {etapa === 'tabla' && (
        <div className="escena3d-respaldo-fila">
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`Insertar una tabla de ${n} por ${n}`}
              onClick={() => {
                setSenalado({ filas: n, columnas: n });
                timers.despues(() => soltarRejilla(), 0);
              }}
            >
              {n} × {n}
            </button>
          ))}
        </div>
      )}
      {fichasVisibles.length > 0 && (
        <div className="escena3d-respaldo-fila">
          {fichasVisibles.map((f) => (
            <button key={f.id} type="button" aria-label={`Tomar ${f.texto}`} onClick={() => tomar(f.id)}>
              {f.texto}
            </button>
          ))}
        </div>
      )}
      {hoja}
    </div>
  );

  return (
    <ArcadeSala3D
      titulo="Tablas y columnas"
      pasoEtiqueta="Paso"
      pasoActual={Math.min(TOTAL_PASOS, hechos)}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="celdas"
      marcadorValor={`${celdas.flat().filter(Boolean).length}/9`}
      bit={linea}
      paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
      sinMostrador
      activa={!terminado}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={<p className="gabinete-nota">La mesa de maquetación · una tabla ordena, dos columnas se leen mejor</p>}
      final={
        terminado
          ? {
              insigniaNombre: 'Arquitecto de tablas',
              insigniaEmoji: '🧾',
              titulo: '¡Qué bien acomodado!',
              detalle:
                'Armaste una tabla de tres por tres, pusiste su encabezado en negrita, colocaste cada dato en su columna y repartiste el párrafo en dos ríos. Ahora cualquiera entiende tu folleto de un vistazo.',
              resumen: [
                { etiqueta: 'Celdas', valor: '9' },
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

export default LabTablasYColumnas;
