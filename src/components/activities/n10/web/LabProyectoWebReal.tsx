'use client';

import { useCallback, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { ArcadeSala, AvisoRonda, useBit } from '../../n1/arcade/ArcadeSala';
import { formatTiempo, useLabActividad } from '../../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import {
  EstudioWeb,
  estilo,
  primero,
  texto,
  useEstudioWeb,
  type ArchivoWeb,
  type GuionWeb,
  type HerramientaWeb,
  type ResumenWeb,
} from '@/components/simuladores/web';
import { PortadaWeb, type DatosPortadaWeb } from '../../n6/web/PortadaWeb';
import '../../n6/web/paginasWeb.css';

/**
 * N10·U «Desarrollo web integral», parada 1 · «HTML/CSS/JS en un proyecto real»
 * **N10 = Bachillerato = 15–18 años**.
 */

export const PLANTILLA_HTML_N10 = `<!DOCTYPE html>
<html lang="es">
<head>
  <title>Nexus Analytics Dashboard</title>
  <link rel="stylesheet" href="estilo.css">
</head>
<body>

  <div class="dashboard-container">
    <!-- Header Principal -->
    <header class="header">
      <div class="logo">⚡ NEXUS <span>ANALYTICS</span></div>
      <div class="status-badge"><span class="dot"></span> En Vivo</div>
    </header>

    <!-- Grid de Métricas KPI -->
    <section class="kpi-grid">
      <div class="kpi-card" id="kpi-ventas">
        <h3>Ventas Totales</h3>
        <p class="valor">$48,250 USD</p>
        <span class="tendencia positivo">+14.2% este mes</span>
      </div>
    </section>

    <!-- Buscador y Tabla de Usuarios -->
    <main class="panel-datos">
      <h2>Servidores Activos</h2>
      <input type="text" id="buscador" placeholder="🔍 Buscar por región o estado..." />
      <ul id="lista-servidores">
        <li>US-East-1 — 🟢 Operativo — Latencia: 12ms</li>
        <li>EU-West-1 — 🟢 Operativo — Latencia: 24ms</li>
        <li>SA-East-1 — 🟡 Mantenimiento — Latencia: 85ms</li>
      </ul>
    </main>
  </div>

  <script src="script.js"></script>
</body>
</html>`;

export const PLANTILLA_CSS_N10 = `/* estilo.css — Nexus High Tech Dashboard */

body {
  background: #060913;
  color: #f8fafc;
  font-family: system-ui, -apple-system, sans-serif;
  margin: 0;
  padding: 24px;
  min-height: 100vh;
  box-sizing: border-box;
}

.dashboard-container {
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #1e293b;
  padding-bottom: 14px;
}

.logo {
  font-size: 1.4rem;
  font-weight: 900;
  letter-spacing: 1px;
  color: #38bdf8;
}

.logo span {
  color: #a855f7;
}

.status-badge {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid #10b981;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
}

.kpi-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.kpi-card {
  background: #0f172a;
  border: 2px solid #38bdf8;
  padding: 18px;
  border-radius: 14px;
  width: 220px;
}

.kpi-card h3 {
  margin: 0;
  font-size: 0.9rem;
  color: #94a3b8;
}

.kpi-card .valor {
  font-size: 1.6rem;
  font-weight: 800;
  margin: 8px 0;
  color: #f8fafc;
}

.tendencia.positivo {
  color: #34d399;
  font-size: 0.8rem;
  font-weight: 600;
}

.panel-datos {
  background: #0f172a;
  border: 1px solid #334155;
  padding: 20px;
  border-radius: 14px;
}

#buscador {
  width: 100%;
  padding: 10px 14px;
  background: #060913;
  border: 1px solid #38bdf8;
  color: white;
  border-radius: 8px;
  margin-bottom: 14px;
  box-sizing: border-box;
}

#lista-servidores {
  list-style: none;
  padding: 0;
  margin: 0;
}

#lista-servidores li {
  padding: 10px 12px;
  border-bottom: 1px solid #1e293b;
  font-size: 0.9rem;
}`;

export const PLANTILLA_JS_N10 = `// script.js — Nexus Analytics Engine
console.log("Iniciando Nexus Analytics System...");

const buscador = document.querySelector('#buscador');
const lista = document.querySelector('#lista-servidores');

if (buscador && lista) {
  buscador.addEventListener('input', (e) => {
    const termino = e.target.value.toLowerCase();
    const items = lista.querySelectorAll('li');

    items.forEach((li) => {
      const texto = li.textContent.toLowerCase();
      li.style.display = texto.includes(termino) ? 'block' : 'none';
    });
  });
}`;

export function archivosInicialesN10(): ArchivoWeb[] {
  return [
    { nombre: 'index.html', lenguaje: 'html', texto: PLANTILLA_HTML_N10 },
    { nombre: 'estilo.css', lenguaje: 'css', texto: PLANTILLA_CSS_N10 },
    { nombre: 'script.js', lenguaje: 'js', texto: PLANTILLA_JS_N10 },
  ];
}

export const GUION_N10: GuionWeb = {
  pasos: [
    {
      id: 'kpi-usuarios',
      titulo: '1. Añade una tarjeta KPI de Usuarios Activos',
      instruccion:
        'En index.html, añade una segunda tarjeta KPI dentro de <section class="kpi-grid">: <div class="kpi-card" id="kpi-usuarios"><h3>Usuarios Activos</h3><p class="valor">1,420</p></div>',
      pista: 'Agrega <div class="kpi-card" id="kpi-usuarios">...</div> dentro de <section class="kpi-grid">.',
      senal: { archivo: 'index.html', control: 'editor' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const card = primero(p, '#kpi-usuarios');
          return card !== null && texto(card).includes('Usuarios Activos');
        },
      },
      aprendido: 'Las estructuras modulares HTML (Cards/KPIs) facilitan la escalabilidad del diseño web empresarial.',
    },
    {
      id: 'kpi-style',
      titulo: '2. Personaliza el borde de la nueva tarjeta',
      instruccion:
        'En estilo.css, agrega una regla específica para resaltar la tarjeta de usuarios con un borde violeta más grueso: #kpi-usuarios { border-color: #a855f7; border-width: 3px; }',
      pista: 'Añade al final de estilo.css la regla para #kpi-usuarios.',
      senal: { archivo: 'estilo.css', control: 'editor' },
      logro: {
        /*
         * CORREGIDO 1-sep-2026 (auditoría). Este encargo era `tipo: 'codigo'` y
         * se aprobaba con `css.includes('#kpi-usuarios') && css.includes('border-color')`
         * — coincidencia de texto sobre el archivo fuente, teniendo al lado el
         * motor de cascada real que los encargos 1 y 3 de esta misma clase ya
         * usan. Dos formas de estar mal, las dos reales:
         *
         *   · Falso positivo: la propia `instruccion` de arriba contiene las dos
         *     cadenas. Pegarla dentro de un comentario CSS, sin escribir
         *     ninguna regla, aprobaba el encargo igual.
         *   · Falso negativo: escribir la forma corta `border: 3px solid #a855f7`
         *     pinta exactamente el borde pedido y NO contiene la subcadena
         *     `border-color`, así que rechazaba a quien lo había resuelto bien.
         *
         * Ahora se pregunta por el estilo RESUELTO del elemento. Se aceptan las
         * dos escrituras a propósito: la cascada sólo expande `margin` y
         * `padding` (`cascada.ts::expandir`), así que la forma corta no deja
         * `border-color` detrás y hay que leerla por su propio nombre. Lo que
         * se exige es lo que la clase enseña —que la regla del ID gane sobre el
         * estilo base—, no una redacción concreta.
         */
        tipo: 'pagina',
        comprueba: (p) => {
          const tarjeta = primero(p, '#kpi-usuarios');
          if (tarjeta === null) return false;
          const corto = estilo(p, tarjeta, 'border') ?? '';
          const color = estilo(p, tarjeta, 'border-color');
          const grosor = estilo(p, tarjeta, 'border-width');
          const hayColor = color !== null || corto.includes('#');
          const hayGrosor = grosor !== null || corto.includes('px');
          return hayColor && hayGrosor;
        },
      },
      aprendido: 'Los selectores por ID permiten sobreescribir estilos base con alta especificidad.',
    },
    {
      id: 'server-item',
      titulo: '3. Añade un nuevo nodo de servidor al listado',
      instruccion:
        'En index.html, añade un nuevo servidor a la lista: <li id="server-ap">AP-South-1 — 🟢 Operativo — Latencia: 18ms</li> dentro de <ul id="lista-servidores">.',
      pista: 'Ingresa la etiqueta <li> con id="server-ap" dentro de #lista-servidores.',
      senal: { archivo: 'index.html', control: 'editor' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const node = primero(p, '#server-ap');
          return node !== null && texto(node).includes('AP-South-1');
        },
      },
      aprendido: 'El DOM representa elementos dinamizables mediante listas y selectores.',
    },
    {
      id: 'js-metric-update',
      titulo: '4. Actualiza datos en tiempo real mediante JS',
      instruccion:
        'En script.js, añade una orden para modificar dinámicamente la latencia al hacer clic en el buscador: console.log("Filtro en tiempo real activado");',
      pista: 'Agrega console.log("Filtro en tiempo real activado"); dentro de script.js.',
      senal: { archivo: 'script.js', control: 'editor' },
      logro: {
        tipo: 'codigo',
        comprueba: (archivos) => {
          const js = archivos.find((a) => a.nombre === 'script.js')?.texto ?? '';
          return js.includes('console.log') && js.includes('Filtro');
        },
      },
      aprendido: 'Los eventos de entrada (input) permiten filtrado reactivo de colecciones de datos.',
    },
    {
      id: 'system-ready',
      titulo: '5. Emitir estado de preparación del sistema',
      instruccion:
        'En script.js, añade al final del archivo el mensaje oficial: console.log("Nexus Analytics Suite 100% Operativo");',
      pista: 'Añade console.log("Nexus Analytics Suite 100% Operativo"); al final de script.js.',
      senal: { archivo: 'script.js', control: 'editor' },
      logro: {
        tipo: 'codigo',
        comprueba: (archivos) => {
          const js = archivos.find((a) => a.nombre === 'script.js')?.texto ?? '';
          return js.includes('100% Operativo');
        },
      },
      aprendido: 'El desarrollo web integral une HTML5 semántico, CSS3 modular y JS reactivo en un producto profesional.',
    },
  ],
};

const TOTAL_PASOS = GUION_N10.pasos.length;

const PORTADA: DatosPortadaWeb = {
  situacion: 'Parada 1 de 3 · Dashboard de Analítica Empresarial',
  tema: 'HTML5 Semántico + CSS3 Responsive + JavaScript Reactivo',
  objetivo:
    'Construirás una aplicación web profesional completa: arquitectura de Dashboard multi-tarjeta, estilos CSS3 con bordes de alto contraste y filtrado dinámico en tiempo real.',
  vasAHacer: [
    'Crear tarjetas de datos KPI dinámicas con diseño responsivo.',
    'Resaltar una tarjeta con un borde de acento de alto contraste.',
    'Programar filtrado reactivo de colecciones de datos en JavaScript.',
    'Validar métricas de tiempo real y depuración en consola.',
  ],
  encargos: TOTAL_PASOS,
  minutos: 25,
  insignia: { nombre: 'Arquitecto Web Full-Stack', emoji: '🌐' },
  boton: 'Iniciar el proyecto web real',
  acento: '#38bdf8',
};

const LINEAS = {
  inicio:
    'Bienvenido a Desarrollo Web Integral (N10). Construirás un Dashboard de analítica empresarial en tiempo real.',
  fin: '¡Felicitaciones! Has completado tu Dashboard web profesional listo para producción.',
};

interface PropsLab extends ActivityProps {
  alSalir?: () => void;
}

export function LabProyectoWebReal(props: PropsLab) {
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
      setAviso('⚡ ¡Módulo Nexus Actualizado!');
      if (hechos < TOTAL_PASOS) {
        reproducirTono('correct');
        const paso = GUION_N10.pasos[hechos - 1];
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
    archivos: archivosInicialesN10(),
    guion: GUION_N10,
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
      id: 'devolver-plantilla-n10',
      etiqueta: 'Reiniciar script.js',
      glifo: '↺',
      // `escribir` siempre apunta al archivo abierto (`estudio.activo`), nunca a
      // uno con nombre fijo — con otra pestaña abierta, esto sobrescribiría
      // index.html o estilo.css con el texto de script.js. Mismo candado que
      // `n7-html-estructura` usa para su propia plantilla.
      deshabilitada: estudio.activo.nombre !== 'script.js' || terminado,
      onClick: () => {
        estudio.escribir(PLANTILLA_JS_N10);
        setAviso('↺ script.js reiniciado');
      },
    },
  ];

  const hechos = terminado ? TOTAL_PASOS : pasos;

  return (
    <ArcadeSala
      titulo="Proyecto web real"
      pasoEtiqueta="Encargo"
      pasoActual={hechos}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="Completados"
      marcadorValor={`${hechos}/${TOTAL_PASOS}`}
      bit={empezado ? linea : null}
      base={<p className="gabinete-nota">Tecnia Web Studio N10 · Nexus Analytics Dashboard</p>}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Arquitecto Web Full-Stack',
              insigniaEmoji: '🌐',
              titulo: '¡Dashboard Profesional Completado!',
              detalle:
                'Has integrado HTML5 semántico, CSS3 High-Tech y JavaScript dinámico creando un Dashboard empresarial interactivo en tiempo real.',
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
      <VentanaBase claseMarco="pgw-marco" marca="Tecnia Web Studio N10" subtitulo="nexus-dashboard · HTML5 + CSS3 + JS">
        <EstudioWeb
          estudio={estudio}
          proyecto="nexus-dashboard"
          inspector={true}
          herramientas={herramientas}
        />
      </VentanaBase>
      {!empezado && <PortadaWeb portada={PORTADA} onEmpezar={empezar} />}
      {aviso && <AvisoRonda texto={aviso} clave={`${aviso}-${pasos}`} />}
    </ArcadeSala>
  );
}

export default LabProyectoWebReal;
