'use client';

import { useCallback, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { ArcadeSala, AvisoRonda, useBit } from '../../n1/arcade/ArcadeSala';
import { formatTiempo, useLabActividad } from '../../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import {
  ANCHO_ESCRITORIO,
  ANCHO_MOVIL,
  EstudioWeb,
  analizarPagina,
  caja,
  estilo,
  primero,
  useEstudioWeb,
  type ArchivoWeb,
  type GuionWeb,
  type HerramientaWeb,
  type PaginaAnalizada,
  type ResumenWeb,
} from '@/components/simuladores/web';
import { PortadaWeb, type DatosPortadaWeb } from '../../n6/web/PortadaWeb';
import '../../n6/web/paginasWeb.css';

/**
 * N8·U «Desarrollo web II», parada 1 · «CSS responsivo»
 * **N8 = 2.º de Secundaria = 13–14 años**.
 *
 * ── El hilo con `n7-css-estilo` ──────────────────────────────────────────────
 *
 * N7 enseñó selectores, colores, tipografía y el modelo de cajas. Esta clase
 * NO repite nada de eso: el HTML llega con candado y el CSS llega **ya
 * escrito**, con una hoja de estilos completa que se ve perfecta en
 * escritorio y se rompe en un celular. El trabajo del alumno no es escribir
 * estilo desde cero — es hacer que el que ya existe se adapte.
 *
 * ── Lo que el subconjunto SÍ soporta, verificado en `subconjunto.ts` ────────
 *
 * - `@media (max-width: …px)` / `(min-width: …px)`, sólo en píxeles y sólo
 *   `screen` (§4.1 de `subconjunto.ts`: entra completo, fue el propio encargo
 *   el que lo pidió al describir la fila 48 como «los puntos de quiebre»).
 * - `flex` con sus seis propiedades: `display: flex`, `flex-direction`,
 *   `justify-content`, `align-items`, `gap`, `flex-wrap`.
 * - Cuatro unidades: `px`, `%`, `em`, `rem` (`UNIDADES` en `subconjunto.ts`).
 *
 * ── Lo que NO soporta, y por qué esta clase no lo usa ────────────────────────
 *
 * **`vw` y `vh` no están en `UNIDADES`.** El encargo original pedía «unidades
 * relativas… `vw`/`vh`, `rem` vs `px`»; se comprobó en `subconjunto.ts` antes
 * de escribir un solo encargo y la lista real es `['px', '%', 'em', 'rem']`.
 * La clase enseña la unidad relativa que sí existe y hace el mismo trabajo
 * pedagógico: `%` (relativa al contenedor) y `rem` (relativa a la letra base)
 * contra `px` (fija). `grid`, `position` y `float` tampoco entran — están en
 * `PROPIEDADES_PROHIBIDAS` con su motivo — así que el layout se resuelve con
 * `flex`, que es lo único que este taller da para acomodar cajas.
 *
 * ── Cómo se corrige un punto de quiebre, y por qué no es un encargo `pagina`
 *    como los demás ───────────────────────────────────────────────────────
 *
 * `useEstudioWeb` corrige contra `pagina`, que es **una sola** vista — la que
 * el alumno tiene delante (`vista === 'movil' ? movil : escritorio`, nunca las
 * dos). Para un encargo que cambia de comportamiento SEGÚN el ancho, hace
 * falta ver el resultado en los dos anchos a la vez, y eso es exactamente lo
 * que `pagina.ts` deja escrito de antemano: «la vista doble de
 * `n8-css-responsivo` es exactamente eso: dos llamadas, no una vista que se
 * encoge». Por eso los tres encargos de punto de quiebre (6, 7 y 8) son de
 * tipo `codigo` y llaman a `analizarPagina` dos veces —a `ANCHO_ESCRITORIO` y
 * a `ANCHO_MOVIL`— dentro del propio predicado, sin importar qué botón de
 * vista tenga pulsado el alumno en ese momento. La vista por omisión de este
 * estudio es `'ambas'`: el alumno ve las dos pantallas desde el primer
 * segundo, que es el punto entero de la clase.
 */

export const PLANTILLA_HTML_CSS_RESPONSIVO_N8 = `<!DOCTYPE html>
<html lang="es">
<head>
  <title>TecniZine</title>
  <link rel="stylesheet" href="estilo.css">
</head>
<body>

  <header>
    <h1>📰 TecniZine</h1>
    <nav class="menu">
      <a href="#">Noticias</a>
      <a href="#">Reseñas</a>
      <a href="#">Tutoriales</a>
      <a href="#">Foro</a>
    </nav>
  </header>

  <main>
    <section class="portada">
      <h2>La consola que todos esperaban ya tiene fecha</h2>
      <p>Un vistazo a las novedades de la semana en el mundo gamer.</p>
    </section>

    <section class="tarjetas">
      <article class="tarjeta">
        <h3>Reseña: el teclado mecánico del año</h3>
        <p>Lo probamos dos semanas seguidas. Esto encontramos.</p>
      </article>
      <article class="tarjeta">
        <h3>5 trucos para tu primera partida en línea</h3>
        <p>Consejos rápidos antes de conectarte con tu equipo.</p>
      </article>
      <article class="tarjeta">
        <h3>Cómo armar tu primera PC gamer</h3>
        <p>Guía paso a paso, sin gastar de más.</p>
      </article>
    </section>
  </main>

  <footer>
    <p>© 2026 TecniZine — hecho por estudiantes, para estudiantes</p>
  </footer>

</body>
</html>`;

export const PLANTILLA_CSS_RESPONSIVO_N8 = `/* estilo.css — hecho para una pantalla de escritorio.
   Se ve perfecto en un monitor y se rompe en un celular:
   ese es el problema que resuelves hoy. */

body {
  background: #0b1220;
  color: #e8f1ff;
  font-family: system-ui, sans-serif;
  margin: 0;
}

header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background: #111a2e;
}

.menu {
  display: flex;
  flex-direction: row;
  gap: 24px;
}

.menu a {
  color: #7dd3fc;
  text-decoration: none;
}

.portada {
  width: 900px;
  margin: 40px auto;
  padding: 32px;
  background: #111a2e;
  border-radius: 16px;
}

.portada h2 {
  font-size: 32px;
}

.tarjetas {
  display: flex;
  flex-direction: row;
  gap: 20px;
  width: 900px;
  margin: 0 auto 40px;
}

.tarjeta {
  width: 280px;
  padding: 20px;
  background: #16213e;
  border-radius: 12px;
}

footer {
  text-align: center;
  padding: 20px;
  color: #64748b;
}
`;

export function archivosInicialesCssResponsivoN8(): ArchivoWeb[] {
  return [
    { nombre: 'index.html', lenguaje: 'html', texto: PLANTILLA_HTML_CSS_RESPONSIVO_N8, soloLectura: true },
    { nombre: 'estilo.css', lenguaje: 'css', texto: PLANTILLA_CSS_RESPONSIVO_N8 },
  ];
}

/**
 * Analiza el proyecto a los dos anchos declarados a la vez — nunca uno
 * medido en pantalla (§39, «cuadricular, no medir»; `ANCHO_ESCRITORIO` y
 * `ANCHO_MOVIL` son los mismos 1024/390 con los que ya se ve la vista previa).
 */
function analizarAmbosAnchos(archivos: readonly ArchivoWeb[]): { escritorio: PaginaAnalizada; movil: PaginaAnalizada } {
  const html = archivos.find((a) => a.nombre === 'index.html')?.texto ?? '';
  const hojas = archivos.filter((a) => a.lenguaje === 'css').map((a) => ({ nombre: a.nombre, texto: a.texto }));
  return {
    escritorio: analizarPagina({ html, archivo: 'index.html', hojas, ancho: ANCHO_ESCRITORIO }),
    movil: analizarPagina({ html, archivo: 'index.html', hojas, ancho: ANCHO_MOVIL }),
  };
}

export const GUION_CSS_RESPONSIVO_N8: GuionWeb = {
  pasos: [
    {
      id: 'ancho-relativo-portada',
      titulo: '1. Del ancho fijo al ancho relativo (portada)',
      instruccion:
        'En "estilo.css", la regla ".portada" tiene "width: 900px": un ancho fijo, el mismo en un teléfono que en un monitor. Cámbialo por un ancho relativo: "width: 90%".',
      pista: '.portada {\n  width: 90%;\n  ...\n}',
      senal: { archivo: 'estilo.css', control: 'editor' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const portada = primero(p, '.portada');
          if (!portada) return false;
          const ancho = estilo(p, portada, 'width');
          return ancho !== null && ancho.endsWith('%');
        },
      },
      aprendido:
        'Un ancho en "px" es un número fijo: mide lo mismo sin importar la pantalla. Un ancho en "%" se calcula sobre el contenedor — si el contenedor es angosto, la caja también lo es.',
    },
    {
      id: 'tope-de-ancho',
      titulo: '2. El tope que evita que crezca sin límite (max-width)',
      instruccion:
        'Un "width: 90%" en una pantalla enorme se estira demasiado. Añade a ".portada" la propiedad "max-width: 900px": el ancho sigue siendo relativo, pero nunca pasa de 900 píxeles.',
      pista: '.portada {\n  width: 90%;\n  max-width: 900px;\n}',
      senal: { archivo: 'estilo.css', control: 'editor' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const portada = primero(p, '.portada');
          if (!portada) return false;
          const ancho = estilo(p, portada, 'width');
          const tope = estilo(p, portada, 'max-width');
          return ancho !== null && ancho.endsWith('%') && tope !== null;
        },
      },
      aprendido:
        '"max-width" no reemplaza a "width": lo limita. Con los dos juntos, la caja se encoge en pantallas chicas y deja de crecer en las gigantes — el patrón que usa casi cualquier sitio real.',
    },
    {
      id: 'tipografia-rem',
      titulo: '3. Una tipografía que no está clavada en píxeles (rem)',
      instruccion:
        'El título de la portada (".portada h2") usa "font-size: 32px". Cámbialo a "font-size: 2rem": "rem" no es un tamaño fijo, es un múltiplo del tamaño de letra que el usuario tiene configurado en su navegador.',
      pista: '.portada h2 {\n  font-size: 2rem;\n}',
      senal: { archivo: 'estilo.css', control: 'editor' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const h2 = primero(p, '.portada h2');
          if (!h2) return false;
          const tamano = estilo(p, h2, 'font-size');
          return tamano !== null && tamano.endsWith('rem');
        },
      },
      aprendido:
        '"rem" viene de "root em": es un múltiplo del tamaño de letra base de la página. Alguien que agranda la letra en su navegador para leer mejor agranda también tu "2rem". Un "32px" nunca se mueve.',
    },
    {
      id: 'tarjetas-relativas',
      titulo: '4. El mismo problema, en las tarjetas',
      instruccion:
        'La regla ".tarjetas" también tiene "width: 900px". Cámbialo por "width: 90%", igual que hiciste en la portada: el mismo problema tiene la misma solución.',
      pista: '.tarjetas {\n  width: 90%;\n  ...\n}',
      senal: { archivo: 'estilo.css', control: 'editor' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const tarjetas = primero(p, '.tarjetas');
          if (!tarjetas) return false;
          const ancho = estilo(p, tarjetas, 'width');
          return ancho !== null && ancho.endsWith('%');
        },
      },
      aprendido:
        'No es casualidad que se repita: cualquier contenedor con un ancho fijo tiene el mismo problema. Detectarlo es la mitad del trabajo de hacer un sitio responsivo.',
    },
    {
      id: 'flex-wrap-tarjetas',
      titulo: '5. Cuando ni el contenedor relativo alcanza (flex-wrap)',
      instruccion:
        'Las tres tarjetas dentro de ".tarjetas" siguen midiendo "280px" cada una: un ancho fijo. Aunque el contenedor ya se adapta, tres tarjetas de 280px no caben en un celular. Añade "flex-wrap: wrap" a ".tarjetas" para que las que no quepan salten a la siguiente fila.',
      pista: '.tarjetas {\n  ...\n  flex-wrap: wrap;\n}',
      senal: { archivo: 'estilo.css', control: 'editor' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const tarjetas = primero(p, '.tarjetas');
          if (!tarjetas) return false;
          return estilo(p, tarjetas, 'flex-wrap') === 'wrap';
        },
      },
      aprendido:
        '"flex-wrap: wrap" le dice a una fila flexible que, cuando sus hijos no caben, puede romperse en varias filas en vez de apretarlos o desbordar la pantalla. Sin "wrap", "flex" nunca reparte en más de una línea.',
    },
    {
      id: 'punto-de-quiebre-menu',
      titulo: '6. El primer punto de quiebre (@media)',
      instruccion:
        'Todo lo anterior ayuda, pero un menú de cuatro enlaces en fila sigue sin caber bien en un celular. Al final de "estilo.css" escribe tu primer punto de quiebre: "@media (max-width: 600px) { .menu { flex-direction: column; } }". En pantallas de 600px o menos, el menú pasa de estar en fila a estar en columna.',
      pista: '@media (max-width: 600px) {\n  .menu {\n    flex-direction: column;\n  }\n}',
      senal: { archivo: 'estilo.css', control: 'movil' },
      logro: {
        tipo: 'codigo',
        comprueba: (archivos) => {
          const { escritorio, movil } = analizarAmbosAnchos(archivos);
          const menuEsc = primero(escritorio, '.menu');
          const menuMov = primero(movil, '.menu');
          if (!menuEsc || !menuMov) return false;
          const dirEsc = estilo(escritorio, menuEsc, 'flex-direction');
          const dirMov = estilo(movil, menuMov, 'flex-direction');
          return dirEsc !== 'column' && dirMov === 'column';
        },
      },
      aprendido:
        '"@media (max-width: 600px)" es una pregunta que el navegador se hace todo el tiempo: «¿el ancho de la pantalla es 600px o menos?». Si la respuesta es sí, las reglas de dentro se aplican; si no, se ignoran por completo. Por eso el menú cambia solo, sin que nadie mueva un dedo.',
    },
    {
      id: 'punto-de-quiebre-tarjetas',
      titulo: '7. Una segunda regla dentro del mismo punto de quiebre',
      instruccion:
        'Un punto de quiebre puede llevar más de una regla adentro. Dentro del mismo "@media (max-width: 600px) { }", agrega ".tarjetas { flex-direction: column; }" para que en el celular las tarjetas se apilen una debajo de otra en vez de ir en fila.',
      pista: '@media (max-width: 600px) {\n  .menu { flex-direction: column; }\n  .tarjetas {\n    flex-direction: column;\n  }\n}',
      senal: { archivo: 'estilo.css', control: 'movil' },
      logro: {
        tipo: 'codigo',
        comprueba: (archivos) => {
          const { escritorio, movil } = analizarAmbosAnchos(archivos);
          const tarjetasEsc = primero(escritorio, '.tarjetas');
          const tarjetasMov = primero(movil, '.tarjetas');
          if (!tarjetasEsc || !tarjetasMov) return false;
          const dirEsc = estilo(escritorio, tarjetasEsc, 'flex-direction');
          const dirMov = estilo(movil, tarjetasMov, 'flex-direction');
          return dirEsc !== 'column' && dirMov === 'column';
        },
      },
      aprendido:
        'Un solo "@media" agrupa todos los cambios de un mismo tamaño de pantalla: no hace falta abrir uno nuevo por cada regla. Así queda claro, en un solo lugar del archivo, todo lo que cambia cuando la pantalla se achica.',
    },
    {
      id: 'padding-header-movil',
      titulo: '8. El mismo selector, dos valores distintos',
      instruccion:
        'El "header" tiene "padding: 20px 40px" pensado para una pantalla grande; en un celular sobra espacio. Dentro del mismo "@media (max-width: 600px) { }", agrega "header { padding: 12px 16px; }": la MISMA etiqueta puede tener un relleno distinto según el ancho de la pantalla.',
      pista: '@media (max-width: 600px) {\n  ...\n  header {\n    padding: 12px 16px;\n  }\n}',
      senal: { archivo: 'estilo.css', control: 'movil' },
      logro: {
        tipo: 'codigo',
        comprueba: (archivos) => {
          const { escritorio, movil } = analizarAmbosAnchos(archivos);
          const hEsc = primero(escritorio, 'header');
          const hMov = primero(movil, 'header');
          if (!hEsc || !hMov) return false;
          const padEsc = Number.parseFloat(caja(escritorio, hEsc).relleno.izquierda);
          const padMov = Number.parseFloat(caja(movil, hMov).relleno.izquierda);
          return !Number.isNaN(padEsc) && !Number.isNaN(padMov) && padMov < padEsc;
        },
      },
      aprendido:
        'Una regla normal y una regla dentro de un "@media" pueden apuntar a la MISMA etiqueta sin pelearse: cuando la pantalla es angosta, gana la de dentro del punto de quiebre; cuando es ancha, ni siquiera se aplica.',
    },
    {
      id: 'quiz-relativo-vs-fijo',
      titulo: '9. Antes de cerrar: ¿por qué funciona?',
      instruccion: '¿Por qué un ancho en "%" se adapta a la pantalla y uno en "px" no?',
      pista: 'Vuelve a mirar el encargo 1: ¿qué le pasó a ".portada" al cambiar de "900px" a "90%"?',
      logro: {
        tipo: 'eleccion',
        opciones: [
          '"%" es más rápido de escribir que "px".',
          '"%" se calcula sobre el tamaño del contenedor; "px" siempre mide lo mismo, sin importar la pantalla.',
          '"px" no existe en los celulares.',
          'No hay ninguna diferencia real entre los dos.',
        ],
        correcta: 1,
      },
      aprendido:
        'Esa es la idea completa de esta clase: "px" es un número fijo; "%" y "rem" se calculan respecto a algo —el contenedor, o la letra base— y por eso pueden adaptarse. Un punto de quiebre ("@media") hace lo mismo pero a otra escala: cambia la regla entera según el ancho de la pantalla.',
    },
  ],
};

const TOTAL_PASOS = GUION_CSS_RESPONSIVO_N8.pasos.length;

const PORTADA: DatosPortadaWeb = {
  situacion: 'Parada 1 de 3 · Una hoja de estilos que se rompe en un celular',
  tema: 'CSS responsivo (N8): que tu página se adapte sola',
  objetivo:
    'Aprenderás a hacer que una página escrita para escritorio se vea bien también en un celular: anchos relativos en vez de fijos, tipografía en "rem", cajas que saltan de renglón con "flex-wrap" y puntos de quiebre con "@media" que cambian el estilo según el ancho de la pantalla.',
  vasAHacer: [
    'Cambiar un ancho fijo en "px" por uno relativo en "%".',
    'Ponerle un tope con "max-width" para que no crezca sin límite.',
    'Escribir una tipografía en "rem" en vez de "px".',
    'Repetir el ancho relativo en un segundo contenedor.',
    'Dejar que las tarjetas salten de renglón con "flex-wrap".',
    'Escribir tu primer punto de quiebre con "@media (max-width: 600px)".',
    'Agregar una segunda regla dentro del mismo punto de quiebre.',
    'Darle a un mismo selector dos valores distintos según la pantalla.',
  ],
  encargos: TOTAL_PASOS,
  minutos: 25,
  insignia: { nombre: 'Diseño Responsivo', emoji: '📱' },
  boton: 'Abrir la hoja de estilos',
  acento: '#38bdf8',
};

const LINEAS = {
  inicio:
    'Bienvenido a Desarrollo Web II (N8). TecniZine ya tiene una hoja de estilos completa, hecha para un monitor de escritorio. Hoy vas a hacer que esa misma hoja se adapte a un celular, sin borrar nada de lo que ya funciona.',
  fin: '¡TecniZine ya se adapta sola! Cambiaste anchos fijos por relativos, una tipografía por "rem", dejaste que las tarjetas saltaran de renglón y escribiste tu primer punto de quiebre con "@media": las cuatro piezas de un sitio responsivo.',
};

interface PropsLab extends ActivityProps {
  alSalir?: () => void;
}

export function LabCssResponsivo(props: PropsLab) {
  const [intento, setIntento] = useState(0);
  const { onProgress, onScore } = props;

  const repetir = useCallback(() => {
    onProgress(0);
    onScore(100);
    setIntento((n) => n + 1);
  }, [onProgress, onScore]);

  return <Practica key={intento} {...props} alRepetir={repetir} />;
}

function Practica({ alRepetir, ...props }: PropsLab & { alRepetir: () => void }) {
  const [empezado, setEmpezado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const { pasos, terminado, tiempoFinal, erroresFinal, avanzar, terminar } = useLabActividad(props, TOTAL_PASOS);
  const { linea, hablar } = useBit();

  const alAvanzar = useCallback(
    (avance: number) => {
      const hechos = Math.round(avance * TOTAL_PASOS);
      avanzar();
      setAviso('✔ ¡Regla aplicada!');
      if (hechos < TOTAL_PASOS) {
        reproducirTono('correct');
        const paso = GUION_CSS_RESPONSIVO_N8.pasos[hechos - 1];
        if (paso) hablar(paso.aprendido);
      }
    },
    [avanzar, hablar],
  );

  const alTerminado = useCallback(
    (resumen: ResumenWeb) => {
      setAviso(null);
      terminar(resumen.segundos, () => hablar(LINEAS.fin));
    },
    [terminar, hablar],
  );

  const estudio = useEstudioWeb({
    archivos: archivosInicialesCssResponsivoN8(),
    // Las dos vistas desde el primer segundo: es el punto entero de la clase
    // (`pagina.ts`, «la vista doble… no una vista que se encoge»).
    vista: 'ambas',
    guion: GUION_CSS_RESPONSIVO_N8,
    onAvance: alAvanzar,
    onTerminado: alTerminado,
  });

  const empezar = useCallback(() => {
    setEmpezado(true);
    reproducirTono('select');
    hablar(LINEAS.inicio);
  }, [hablar]);

  const herramientas: HerramientaWeb[] = [
    {
      id: 'restaurar-css-n8-responsivo',
      etiqueta: 'Restaurar estilo.css',
      glifo: '↺',
      // `escribir` siempre apunta al archivo abierto (`estudio.activo`); con
      // otra pestaña abierta esto sobrescribiría "index.html" con el texto de
      // "estilo.css". Mismo candado que usan `n8-javascript-basico` y
      // `n7-css-estilo` para el suyo.
      deshabilitada: estudio.activo.nombre !== 'estilo.css' || terminado,
      onClick: () => {
        estudio.escribir(PLANTILLA_CSS_RESPONSIVO_N8);
        setAviso('↺ estilo.css restaurado');
      },
    },
  ];

  const hechos = terminado ? TOTAL_PASOS : pasos;

  return (
    <ArcadeSala
      titulo="CSS responsivo"
      pasoEtiqueta="Encargo"
      pasoActual={hechos}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="Completados"
      marcadorValor={`${hechos}/${TOTAL_PASOS}`}
      bit={empezado ? linea : null}
      base={<p className="gabinete-nota">Tecnia Web N8 · Anchos relativos, rem, flex-wrap y puntos de quiebre</p>}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Diseño Responsivo',
              insigniaEmoji: '📱',
              titulo: '¡Tu página ya se adapta sola!',
              detalle:
                'Convertiste una hoja de estilos de escritorio en una hoja responsiva: anchos en "%" con "max-width", tipografía en "rem", "flex-wrap" para las tarjetas y un punto de quiebre con "@media" que cambia el menú, las tarjetas y el relleno del header en un celular.',
              resumen: [
                { etiqueta: 'Encargos', valor: `${TOTAL_PASOS}` },
                { etiqueta: 'Tiempo', valor: formatTiempo(tiempoFinal) },
                { etiqueta: 'Errores', valor: `${erroresFinal}` },
              ],
              alRepetir,
            }
          : null
      }
    >
      <VentanaBase claseMarco="pgw-marco" marca="Tecnia Web N8" subtitulo="tecnizine · CSS responsivo">
        <EstudioWeb estudio={estudio} proyecto="tecnizine" inspector={true} herramientas={herramientas} />
      </VentanaBase>
      {!empezado && <PortadaWeb portada={PORTADA} onEmpezar={empezar} />}
      {aviso && <AvisoRonda texto={aviso} clave={`${aviso}-${pasos}`} />}
    </ArcadeSala>
  );
}

export default LabCssResponsivo;
