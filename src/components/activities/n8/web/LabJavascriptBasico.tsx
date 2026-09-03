'use client';

import { useCallback, useMemo, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { ArcadeSala, AvisoRonda, useBit } from '../../n1/arcade/ArcadeSala';
import { formatTiempo, useLabActividad } from '../../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import {
  EstudioWeb,
  primero,
  texto,
  useEstudioWeb,
  type ArchivoWeb,
  type EfectoWeb,
  type EventoPagina,
  type GuionWeb,
  type HerramientaWeb,
  type ResumenWeb,
} from '@/components/simuladores/web';
import { PortadaWeb, type DatosPortadaWeb } from '../../n6/web/PortadaWeb';
import '../../n6/web/paginasWeb.css';

/**
 * N8·U «Desarrollo web II», parada 2 · «JavaScript básico»
 * **N8 = 2.º de Secundaria = 13–14 años**.
 */

export const PLANTILLA_HTML_N8 = `<!DOCTYPE html>
<html lang="es">
<head>
  <title>CyberStudio JS N8</title>
  <link rel="stylesheet" href="estilo.css">
</head>
<body>

  <div class="card">
    <h1 id="titulo-app">⚡ Panel Interactivo JS</h1>
    
    <div class="contador-box">
      <span class="etiqueta">Puntuación:</span>
      <span id="contador">0</span>
    </div>

    <div class="botones">
      <button id="btn-sumar">🚀 +1 Puntos</button>
      <button id="btn-modo">🌙 Cambiar Modo</button>
    </div>
  </div>

  <script src="script.js"></script>
</body>
</html>`;

export const PLANTILLA_CSS_N8 = `/* estilo.css — CyberStudio High Contrast */

body {
  background: #090d16;
  color: #f8fafc;
  font-family: system-ui, -apple-system, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  margin: 0;
  padding: 16px;
  box-sizing: border-box;
}

body.cyber-light {
  background: #f1f5f9;
  color: #0f172a;
}

.card {
  background: #1e293b;
  border: 2px solid #38bdf8;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 0 25px rgba(56, 189, 248, 0.4);
  text-align: center;
  width: 100%;
  max-width: 320px;
}

body.cyber-light .card {
  background: #ffffff;
  border-color: #6366f1;
  box-shadow: 0 10px 25px rgba(99, 102, 241, 0.2);
}

h1 {
  font-size: 1.3rem;
  color: #38bdf8;
  margin: 0 0 16px 0;
}

body.cyber-light h1 {
  color: #4f46e5;
}

.contador-box {
  background: #0f172a;
  border: 1px solid #38bdf8;
  padding: 14px;
  border-radius: 10px;
  margin: 16px 0;
  font-size: 1.6rem;
  font-weight: 800;
  color: #a855f7;
}

body.cyber-light .contador-box {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #4f46e5;
}

.botones {
  display: flex;
  gap: 10px;
  justify-content: center;
}

button {
  background: #6366f1;
  color: #ffffff;
  border: none;
  padding: 10px 14px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
}

button:hover {
  background: #4f46e5;
}`;

export const PLANTILLA_JS_N8 = `// script.js — Lógica interactiva con el DOM
let puntos = 0;

// 1. Selecciona los elementos del HTML por su ID
const btnSumar = document.querySelector('#btn-sumar');
const contador = document.querySelector('#contador');
const btnModo = document.querySelector('#btn-modo');

// 2. Escucha clics para aumentar el contador
btnSumar.addEventListener('click', () => {
  puntos = puntos + 1;
  contador.textContent = puntos;
  console.log("Puntos actuales:", puntos);
});

// 3. Cambia el tema de luz y sombra
btnModo.addEventListener('click', () => {
  document.body.classList.toggle('cyber-light');
});`;

export function archivosInicialesN8(): ArchivoWeb[] {
  return [
    { nombre: 'index.html', lenguaje: 'html', texto: PLANTILLA_HTML_N8 },
    { nombre: 'estilo.css', lenguaje: 'css', texto: PLANTILLA_CSS_N8 },
    { nombre: 'script.js', lenguaje: 'js', texto: PLANTILLA_JS_N8 },
  ];
}

export const GUION_N8: GuionWeb = {
  pasos: [
    {
      id: 'dom-select',
      titulo: '1. Selección del DOM (querySelector)',
      instruccion:
        'En index.html, añade una nueva etiqueta con id="mensaje": <p id="mensaje">¡Listo para la acción!</p> dentro de la tarjeta.',
      pista: 'Añade <p id="mensaje">¡Listo para la acción!</p> justo debajo del contador.',
      senal: { archivo: 'index.html', control: 'editor' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const msg = primero(p, '#mensaje');
          return msg !== null && texto(msg).trim().length >= 5;
        },
      },
      aprendido: 'Los IDs (id="...") permiten que JavaScript identifique elementos específicos del DOM.',
    },
    {
      id: 'js-select',
      titulo: '2. Enlaza el mensaje en JavaScript',
      instruccion:
        'Abre script.js y añade la línea para seleccionar tu mensaje: const mensaje = document.querySelector("#mensaje");',
      pista: 'Añade al inicio de script.js: const mensaje = document.querySelector("#mensaje");',
      senal: { archivo: 'script.js', control: 'editor' },
      logro: {
        tipo: 'codigo',
        comprueba: (archivos) => {
          const js = archivos.find((a) => a.nombre === 'script.js')?.texto ?? '';
          return js.includes('querySelector("#mensaje")') || js.includes("querySelector('#mensaje')");
        },
      },
      aprendido: 'document.querySelector captura cualquier nodo HTML usando su selector CSS.',
    },
    {
      id: 'event-listener',
      titulo: '3. Actualiza el mensaje al hacer clic',
      instruccion:
        'Dentro de la función btnSumar.addEventListener, cambia el texto del mensaje: mensaje.textContent = "🚀 ¡Ganaste un punto!";',
      pista: 'Escribe dentro del evento de btnSumar: mensaje.textContent = "🚀 ¡Ganaste un punto!";',
      senal: { archivo: 'script.js', control: 'editor' },
      logro: {
        tipo: 'codigo',
        comprueba: (archivos) => {
          const js = archivos.find((a) => a.nombre === 'script.js')?.texto ?? '';
          return js.includes('mensaje.textContent');
        },
      },
      aprendido: '.textContent modifica el contenido de texto en el DOM de forma instantánea.',
    },
    {
      id: 'class-toggle',
      titulo: '4. Agrega un registro en consola',
      instruccion:
        'En script.js, añade una orden console.log al cambiar de modo: console.log("Modo visual alternado"); dentro de btnModo.addEventListener.',
      pista: 'Añade console.log("Modo visual alternado"); dentro del callback de btnModo.',
      senal: { archivo: 'script.js', control: 'editor' },
      logro: {
        tipo: 'codigo',
        comprueba: (archivos) => {
          const js = archivos.find((a) => a.nombre === 'script.js')?.texto ?? '';
          return js.includes('console.log');
        },
      },
      aprendido: 'console.log transmite mensajes de depuración a la consola del desarrollador.',
    },
    {
      id: 'dynamic-style',
      titulo: '5. Estilo dinámico con CSS',
      instruccion:
        'En estilo.css, añade una regla para resaltar el mensaje con color oro: #mensaje { color: #facc15; font-weight: bold; }',
      pista: 'Agrega al final de estilo.css: #mensaje { color: #facc15; font-weight: bold; }',
      senal: { archivo: 'estilo.css', control: 'editor' },
      logro: {
        tipo: 'codigo',
        comprueba: (archivos) => {
          const css = archivos.find((a) => a.nombre === 'estilo.css')?.texto ?? '';
          return css.includes('#mensaje') && css.includes('color');
        },
      },
      aprendido: 'La combinación de HTML, CSS y JS crea aplicaciones web dinámicas de nivel profesional.',
    },
  ],
};

const TOTAL_PASOS = GUION_N8.pasos.length;

const PORTADA: DatosPortadaWeb = {
  situacion: 'Parada 2 de 3 · Programación Dinámica del DOM',
  tema: 'JavaScript Interactivo & Manipulación HTML/CSS',
  objetivo:
    'Aprenderás a controlar el DOM con JavaScript puro: selección de nodos, respuesta a eventos en tiempo real, manipulación de clases CSS y depuración en consola.',
  vasAHacer: [
    'Identificar nodos HTML mediante selectores de ID (#mensaje).',
    'Conectar eventos de clic (addEventListener) con funciones JS.',
    'Actualizar el contenido del DOM en tiempo real con textContent.',
    'Alternar clases de diseño (classList.toggle) para modo claro/oscuro.',
    'Emitir registros de depuración con console.log.',
  ],
  encargos: TOTAL_PASOS,
  minutos: 20,
  insignia: { nombre: 'Desarrollador JS Interactivo', emoji: '⚡' },
  boton: 'Iniciar el estudio interactivo',
  acento: '#a855f7',
};

const LINEAS = {
  inicio:
    'Bienvenido a Desarrollo Web II (N8). Hoy darás vida a tu aplicación web conectando JavaScript con la interfaz de usuario.',
  fin: '¡Increíble! Has creado tu primera aplicación web interactiva con HTML, CSS y JavaScript.',
};

interface PropsLab extends ActivityProps {
  alSalir?: () => void;
}

export function LabJavascriptBasico(props: PropsLab) {
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

  // El JS del alumno no se ejecuta (tiposWeb.ts, «el guardián del JS»): la
  // vista previa avisa de los clics y el armazón decide el efecto, para que
  // los botones «hagan algo» de verdad aunque el que ejecuta sea la clase y
  // no el navegador.
  const [puntos, setPuntos] = useState(0);
  const [modoClaro, setModoClaro] = useState(false);

  const alAvanzar = useCallback(
    (avance: number) => {
      const hechos = Math.round(avance * TOTAL_PASOS);
      avanzar();
      setAviso('⚡ ¡Código JavaScript Ejecutado!');
      if (hechos < TOTAL_PASOS) {
        reproducirTono('correct');
        const paso = GUION_N8.pasos[hechos - 1];
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
    archivos: archivosInicialesN8(),
    guion: GUION_N8,
    onAvance: alAvanzar,
    onTerminado: alTerminado,
  });

  const alEvento = useCallback((evento: EventoPagina) => {
    if (evento.tipo !== 'clic') return;
    if (evento.id === 'btn-sumar') {
      setPuntos((p) => p + 1);
      reproducirTono('correct');
    } else if (evento.id === 'btn-modo') {
      setModoClaro((m) => !m);
    }
  }, []);

  // El contador ya «funciona» desde el inicio (viene en la plantilla, no es
  // parte del guion). El mensaje y el cambio de tema son lo que el alumno
  // programa en los encargos 3 y 4: sólo se ven una vez que los escribió,
  // para no enseñar el resultado antes que el código.
  const efectos = useMemo<EfectoWeb[]>(() => {
    const lista: EfectoWeb[] = [{ selector: '#contador', cambio: { tipo: 'texto', texto: String(puntos) } }];
    if (estudio.hechos >= 3 && puntos > 0) {
      lista.push({ selector: '#mensaje', cambio: { tipo: 'texto', texto: '🚀 ¡Ganaste un punto!' } });
    }
    if (estudio.hechos >= 4 && modoClaro) {
      lista.push({ selector: '.card', cambio: { tipo: 'estilo', propiedad: 'background', valor: '#ffffff' } });
      lista.push({ selector: '.card', cambio: { tipo: 'estilo', propiedad: 'color', valor: '#0f172a' } });
    }
    return lista;
  }, [puntos, modoClaro, estudio.hechos]);

  const empezar = useCallback(() => {
    setEmpezado(true);
    reproducirTono('select');
    hablar(LINEAS.inicio);
  }, [hablar]);

  const herramientas: HerramientaWeb[] = [
    {
      id: 'devolver-plantilla-n8',
      etiqueta: 'Reiniciar script.js',
      glifo: '↺',
      // `escribir` siempre apunta al archivo abierto (`estudio.activo`), nunca a
      // uno con nombre fijo — con otra pestaña abierta, esto sobrescribiría
      // index.html o estilo.css con el texto de script.js. Mismo candado que
      // `n7-html-estructura` y `n10-proyecto-web-real` usan para el suyo.
      deshabilitada: estudio.activo.nombre !== 'script.js' || terminado,
      onClick: () => {
        estudio.escribir(PLANTILLA_JS_N8);
        setAviso('↺ script.js reiniciado');
      },
    },
  ];

  const hechos = terminado ? TOTAL_PASOS : pasos;

  return (
    <ArcadeSala
      titulo="JavaScript básico"
      pasoEtiqueta="Encargo"
      pasoActual={hechos}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="Completados"
      marcadorValor={`${hechos}/${TOTAL_PASOS}`}
      bit={empezado ? linea : null}
      base={<p className="gabinete-nota">Tecnia Web Studio N8 · App web interactiva HTML + CSS + JS</p>}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Desarrollador JS Interactivo',
              insigniaEmoji: '⚡',
              titulo: '¡Aplicación Interactiva Lista!',
              detalle:
                'Has conectado HTML5, CSS3 Glassmorphism y JavaScript dinámico creando una aplicación interactiva con eventos en vivo.',
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
      <VentanaBase claseMarco="pgw-marco" marca="Tecnia Web Studio N8" subtitulo="cyber-app · HTML5 + CSS3 + JS">
        <EstudioWeb
          estudio={estudio}
          proyecto="cyber-app"
          inspector={true}
          herramientas={herramientas}
          efectos={efectos}
          onEvento={alEvento}
        />
      </VentanaBase>
      {!empezado && <PortadaWeb portada={PORTADA} onEmpezar={empezar} />}
      {aviso && <AvisoRonda texto={aviso} clave={`${aviso}-${pasos}`} />}
    </ArcadeSala>
  );
}

export default LabJavascriptBasico;
