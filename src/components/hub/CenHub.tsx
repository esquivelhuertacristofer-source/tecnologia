'use client';

/**
 * Hub del alumno (F1.1) — construido con el lenguaje visual de la landing:
 * hero navy con brillos radiales, franja de estadísticas encimada, los 10
 * niveles como recuadros grandes diferenciados por etapa (la rampa de azules
 * del stage-grid de la landing) y la sección transversal de Paquetería Office.
 *
 * Los datos vienen del currículo (curriculo.ts vía niveles.ts) y el progreso
 * del repositorio (progresoRepo). Esta página no conoce mecánicas de
 * actividades: solo niveles, contadores y progreso.
 */

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NIVELES, ETAPA_META, MODULOS_OFFICE, type Etapa, type Nivel } from '@/data/niveles';
import { CURRICULO, getSalaOffice, type AppOfficeId } from '@/data/curriculo';
import { getActividadRegistrada } from '@/components/activities/registry';
import { getOfficeRegistrada } from '@/components/activities/office/registroOffice';
import { progresoRepo } from '@/lib/progreso';
import type { ProgresoActividad } from '@/lib/progreso/repo';
import { calcularInsignias } from '@/lib/insignias';
import CenInsignias from './CenInsignias';
import { CenHubRoot, HubTopbar, HubFooter, usePerfil } from './shell';
import './CenOfficeBloque.css';
import './PosicionamientoAlumno.css';

// Ids de ejercicios jugables hoy, por nivel (derivado del currículo).
const DISPONIBLES_POR_NIVEL = new Map<number, string[]>(
  CURRICULO.map(nivel => [
    nivel.n,
    nivel.unidades.flatMap(u => u.actividades.filter(a => a.estado === 'disponible').map(a => a.id)),
  ]),
);

const TOTAL_DISPONIBLES = [...DISPONIBLES_POR_NIVEL.values()].reduce((s, ids) => s + ids.length, 0);

/**
 * Cuántas clases tiene una sala de Office y cuáles se pueden jugar HOY.
 *
 * No usa `resumenSalaOffice()` a propósito. Aquélla cuenta las clases con
 * `estado: 'disponible'` en el currículo, que es una declaración de intención;
 * la sala, en cambio, sólo deja jugar lo que además está en un registro. Los
 * dos números coinciden hoy por casualidad (9 y 9), y en cuanto alguien marque
 * una clase como disponible antes de registrarla, el hub prometería una clase
 * que la sala enseña bloqueada. La tarjeta del hub tiene que contar lo mismo
 * que la sala o miente. Ver `cableado`: esto debería subir a curriculo.ts.
 */
function resumenRealSala(app: AppOfficeId): { total: number; listas: number; ids: string[] } {
  const clases = (getSalaOffice(app) ?? []).flatMap(g => g.clases);
  const jugables = clases.filter(c =>
    c.estado === 'disponible'
    && (c.origen
      ? getActividadRegistrada(c.id) !== undefined
      : getOfficeRegistrada(c.id) !== undefined));
  return { total: clases.length, listas: jugables.length, ids: jugables.map(c => c.id) };
}

const SALAS_OFFICE = new Map<string, ReturnType<typeof resumenRealSala>>(
  MODULOS_OFFICE.map(m => [m.id, resumenRealSala(m.id as AppOfficeId)]),
);

/** Ids de clases `of-` (exclusivas de una sala): no están en ningún nivel, así
 *  que el efecto de progreso del hub no las cargaba y sus tarjetas nunca podían
 *  mostrarse como terminadas. */
const IDS_OFFICE_EXCLUSIVOS = [...SALAS_OFFICE.values()]
  .flatMap(s => s.ids)
  .filter(id => id.startsWith('of-'));

const ETAPAS: Etapa[] = ['primaria', 'secundaria', 'bachillerato'];

// Mini escenas dibujadas en CSS para cada ficha de Office (decorativas):
// ventanas con barra de título y cinta de pestañas, documento de Word que se
// "escribe" solo, hoja de Excel con barra de fórmulas y gráfica que crece,
// diapositiva de PowerPoint con panel de miniaturas y pastel que se dibuja,
// y nube de Microsoft 365 con colaboradores. Cada escena lleva un chip
// satélite. Los estilos viven en CenHub.css (.office-mock / .office-chip).
const OFFICE_MOCKUPS: Record<string, React.ReactNode> = {
  word: (
    <span className="office-mock mock-word">
      <span className="mock-chrome"><i /><i /><i /></span>
      <span className="mock-tabs"><i className="tab-activa" /><i /><i /></span>
      <span className="mock-body">
        <i className="doc-bar" />
        <i className="doc-line" /><i className="doc-line" /><i className="doc-line" /><i className="doc-line" />
        <span className="doc-fila"><i className="doc-line" /><i className="doc-cursor" /></span>
      </span>
      <span className="office-chip chip-ne">Autoguardado <b>✓</b></span>
    </span>
  ),
  excel: (
    <span className="office-mock mock-excel">
      <span className="mock-chrome"><i /><i /><i /></span>
      <span className="formula-bar"><b>fx</b> =SUMA(B2:B5)</span>
      <span className="mock-sheet">
        <span className="col-heads"><i>A</i><i>B</i><i>C</i><i>D</i></span>
        <i className="celda-sel" />
        <span className="chart"><i /><i /><i /><i /></span>
      </span>
      <span className="office-chip chip-se"><b>▲</b> +12%</span>
    </span>
  ),
  powerpoint: (
    <span className="office-mock mock-ppt">
      <span className="mock-chrome"><i /><i /><i /></span>
      <span className="mock-tabs"><i className="tab-activa" /><i /><i /></span>
      <span className="ppt-layout">
        <span className="ppt-panel"><i className="thumb thumb-activa" /><i className="thumb" /><i className="thumb" /></span>
        <span className="ppt-slide">
          <i className="slide-titulo" />
          <span className="slide-fila">
            <span className="pie" />
            <span className="slide-lineas"><i /><i /><i /></span>
          </span>
        </span>
      </span>
      <span className="office-chip chip-so">💬 ¡Excelente!</span>
    </span>
  ),
  m365: (
    <span className="office-mock mock-m365">
      <span className="nube" />
      <span className="logo-ms logo-ms-grande"><i /><i /><i /><i /></span>
      <span className="office-chip chip-se">
        <span className="avatars"><i>🦊</i><i>🐼</i><i>🐨</i></span> En línea
      </span>
    </span>
  ),
};

// Escenas CSS por nivel (decorativas), una por grado: computadora que se
// enciende, carpeta de la que brotan archivos, navegador con globo, bloques
// de programación, gráfica de datos, videojuego, terminal, app móvil con
// sensores, sitio web recién publicado y perfil profesional. Reutilizan las
// piezas de las fichas Office (.office-mock, .mock-chrome, .office-chip);
// cada tarjeta lleva la clase .nivel-n{n}, que fija su color de identidad
// (--nivel) y su patrón de fondo en CenHub.css — como las fichas Office
// tienen su color de marca —, y las escenas suman acentos vivos compartidos
// (--amarillo, --coral-vivo, --verde-vivo, --cielo-vivo).
const NIVEL_MOCKUPS: Record<number, React.ReactNode> = {
  1: (
    <span className="office-mock mock-n1">
      <span className="pc-pantalla"><i /><i /></span>
      <i className="pc-pie" />
      <i className="pc-base" />
      <i className="pc-teclado" />
      <span className="office-chip chip-se">🖱️ ¡Clic!</span>
    </span>
  ),
  2: (
    <span className="office-mock mock-n2">
      <i className="archivo a1" />
      <i className="archivo a2" />
      <span className="carpeta" />
      <span className="office-chip chip-ne">📁 Mis dibujos</span>
    </span>
  ),
  3: (
    <span className="office-mock mock-n3">
      <span className="mock-chrome"><i /><i /><i /></span>
      <span className="url-bar"><i /></span>
      <span className="globo"><i /><i /></span>
      <span className="office-chip chip-se">✨ Hola, IA</span>
    </span>
  ),
  4: (
    <span className="office-mock mock-n4">
      <span className="mock-chrome"><i /><i /><i /></span>
      <span className="bloques"><i className="bloque" /><i className="bloque" /><i className="bloque" /></span>
      <span className="office-chip chip-so"><b>▶</b> Ejecutar</span>
    </span>
  ),
  5: (
    <span className="office-mock mock-n5">
      <span className="mock-chrome"><i /><i /><i /></span>
      <span className="area-chart" />
      <i className="punto p1" />
      <i className="punto p2" />
      <span className="office-chip chip-se"><b>▲</b> Mis datos</span>
    </span>
  ),
  6: (
    <span className="office-mock mock-n6">
      <span className="game-dots"><i /><i /><i /></span>
      <span className="fantasma"><i /><i /></span>
      <span className="office-chip chip-ne">🏆 +100</span>
    </span>
  ),
  7: (
    <span className="office-mock mock-n7">
      <span className="mock-chrome"><i /><i /><i /></span>
      <span className="term-body">
        <span className="term-line"><b>&gt;</b><i /></span>
        <span className="term-line"><b>&gt;</b><i /></span>
        <span className="term-line"><b>&gt;</b><i /><i className="term-cursor" /></span>
      </span>
      <span className="office-chip chip-se">🐍 Python</span>
    </span>
  ),
  8: (
    <span className="office-mock mock-n8">
      <span className="fon">
        <i className="fon-notch" />
        <i className="fon-toggle" />
        <i className="fon-bar" />
        <i className="fon-bar" />
        <span className="fon-apps"><i /><i /><i /><i /></span>
      </span>
      <span className="senal"><i /><i /><i /></span>
      <span className="office-chip chip-se">📡 Sensor OK</span>
    </span>
  ),
  9: (
    <span className="office-mock mock-n9">
      <span className="mock-chrome"><i /><i /><i /></span>
      <span className="url-bar"><i /></span>
      <span className="web-hero"><i className="web-titulo" /><i className="web-btn" /></span>
      <span className="web-cols"><i /><i /></span>
      <span className="office-chip chip-ne">🚀 En línea</span>
    </span>
  ),
  10: (
    <span className="office-mock mock-n10">
      <span className="perfil-head">
        <i className="perfil-avatar" />
        <span className="perfil-datos"><i /><i /></span>
      </span>
      <span className="skills"><i className="skill" /><i className="skill" /><i className="skill" /></span>
      <span className="office-chip chip-se">⭐ Portafolio</span>
    </span>
  ),
};

export default function CenHub() {
  const router = useRouter();
  const { perfil, hidratado } = usePerfil();
  const [progreso, setProgreso] = useState<Map<string, ProgresoActividad>>(new Map());
  const [racha, setRacha] = useState(0);

  useEffect(() => {
    let activo = true;
    const ids = [...[...DISPONIBLES_POR_NIVEL.values()].flat(), ...IDS_OFFICE_EXCLUSIVOS];
    Promise.all(ids.map(async id => [id, await progresoRepo.getProgresoActividad(id)] as const))
      .then(entradas => {
        if (!activo) return;
        setProgreso(new Map(entradas.filter((e): e is [string, ProgresoActividad] => e[1] !== null)));
      });
    progresoRepo.registrarSesionHoy().then(dias => { if (activo) setRacha(dias); });
    return () => { activo = false; };
  }, []);

  const completadas = [...progreso.values()].filter(p => p.completado).length;
  const nombrePila = perfil?.nombre.split(' ')[0] ?? '';
  const nivelActual = perfil?.nivelActual ?? 1;
  const insignias = calcularInsignias(progreso, racha);
  const insigniasConseguidas = insignias.filter(i => i.conseguida).length;
  const mensajeBit =
    racha >= 7
      ? `¡${racha} días seguidos! Vas que vuelas — ¿seguimos con el Nivel ${nivelActual}?`
      : racha >= 3
        ? `${racha} días seguidos${nombrePila ? `, ${nombrePila}` : ''}. Esa constancia se nota.`
        : racha >= 1
          ? `Qué bueno verte hoy. Te espera el Nivel ${nivelActual}.`
          : `Te espero en el Nivel ${nivelActual} cuando quieras empezar.`;

  async function salir() {
    await progresoRepo.clearPerfil();
    router.push('/');
  }

  function avanceNivel(n: number): number | null {
    const ids = DISPONIBLES_POR_NIVEL.get(n) ?? [];
    if (ids.length === 0) return null;
    const hechas = ids.filter(id => progreso.get(id)?.completado).length;
    return hechas / ids.length;
  }

  function tarjetaNivel(nivel: Nivel, ancha = false) {
    const avance = avanceNivel(nivel.n);
    const jugables = DISPONIBLES_POR_NIVEL.get(nivel.n)?.length ?? 0;
    const clase = `nivel-card nivel-n${nivel.n} etapa-${nivel.etapa}${ancha ? ' ancha' : ''} reveal`;

    return (
      <Link key={nivel.n} href={`/hub/nivel/${nivel.n}`} className={clase}>
        <div className="nivel-visual" aria-hidden="true">
          <span className="nivel-marca">
            <span className="marca-palabra">Nivel</span>
            <span className="marca-numero">{nivel.n}</span>
          </span>
          {NIVEL_MOCKUPS[nivel.n]}
        </div>
        {jugables > 0 && <span className="chip-disponible">▶ Ya jugable</span>}
        <div className="nivel-cuerpo">
          <span className="nivel-num">Nivel {nivel.n} · {nivel.grado}</span>
          <h3>{nivel.titulo}</h3>
          <div className="nivel-ejes">
            {nivel.ejes.map(eje => <span key={eje}>{eje}</span>)}
          </div>
          {avance !== null && (
            <div className="nivel-progreso" role="progressbar" aria-valuenow={Math.round(avance * 100)} aria-valuemin={0} aria-valuemax={100}>
              <span style={{ width: `${Math.max(avance * 100, 4)}%` }} />
            </div>
          )}
          <div className="nivel-pie">
            <span className="nivel-meta">
              {nivel.unidades} unidades · {nivel.actividades} sesiones{nivel.conIA ? ' · IA' : ''}
            </span>
            <span className="nivel-entrar">Entrar <span aria-hidden="true">↗</span></span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <CenHubRoot>
      <HubTopbar>
        {hidratado && perfil && (
          <span className="chip-alumno">
            <span className="avatar" aria-hidden="true">{perfil.avatar}</span>
            <span className="nombre">{perfil.nombre}</span>
          </span>
        )}
        <button type="button" className="topbar-salir" onClick={salir}>Salir</button>
      </HubTopbar>

      {/* ─── Hero de bienvenida ─── */}
      <section className="hero">
        <div className="container">
          <span className="section-tag">Tu ruta de aprendizaje</span>
          <h1>
            {hidratado ? `Hola, ${nombrePila}.` : 'Hola.'}
            <span className="camino-grad">¿Qué construimos hoy?</span>
          </h1>
          <p className="hero-sub">
            Diez niveles que crecen contigo — de conocer tu primera computadora a crear
            con código, datos e inteligencia artificial — más la Paquetería Office de
            básico a experto.
          </p>
          <div className="hero-bit">
            <span className="hero-bit-retrato">
              <Image
                src="/assets/actividades/n1-enciende-y-apaga/bit-cara.png"
                alt="Bit"
                fill
                sizes="64px"
                className="object-cover"
              />
            </span>
            <p className="hero-bit-globo">{mensajeBit}</p>
          </div>
          <div className="hero-actions">
            <Link className="button-light" href={`/hub/nivel/${nivelActual}`}>
              Continuar en el Nivel {nivelActual} <span aria-hidden="true">↗</span>
            </Link>
            <a className="button-ghost" href="#office">Paquetería Office <span aria-hidden="true">↓</span></a>
          </div>
          <Link className="hero-posic-link" href="/hub/posicionamiento">
            ¿No sabes en qué nivel empezar? Haz el examen de posicionamiento <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* ─── Franja de estadísticas ─── */}
      <div className="container">
        <dl className="stats-strip">
          <div className="stat" style={{ '--accent': 'var(--blue)' } as React.CSSProperties}>
            <dt>Nivel actual</dt>
            <dd>{hidratado ? `Nivel ${nivelActual}` : '—'}</dd>
          </div>
          <div className="stat" style={{ '--accent': 'var(--lime)' } as React.CSSProperties}>
            <dt>Ejercicios completados</dt>
            <dd>{completadas} / {TOTAL_DISPONIBLES}</dd>
          </div>
          <div className="stat" style={{ '--accent': 'var(--purple)' } as React.CSSProperties}>
            <dt>Insignias</dt>
            <dd><a href="#insignias">{insigniasConseguidas} / {insignias.length} 🏅</a></dd>
          </div>
          <div className="stat" style={{ '--accent': 'var(--sky)' } as React.CSSProperties}>
            <dt>Racha de días</dt>
            <dd>{racha} 🔥</dd>
          </div>
        </dl>
      </div>

      {/* ─── Trayectoria: 10 niveles en recuadros grandes ─── */}
      <section className="section" id="trayectoria">
        <div className="container">
          <div className="section-head trayectoria-head reveal">
            <div>
              <span className="section-tag">Tu trayectoria</span>
              <h2 className="titulo-camino">
                <span>Diez niveles.</span>
                <span className="camino-grad">Un solo camino.</span>
              </h2>
              {/* El camino, literal: los 10 niveles como pasos de color
                  encadenados (reutilizan la identidad --nivel de .nivel-n{n}) */}
              <div className="camino-pasos" aria-hidden="true">
                {NIVELES.map(niv => (
                  <i key={niv.n} className={`camino-paso nivel-n${niv.n}${niv.disponible ? ' activo' : ''}`}>
                    {niv.n}
                  </i>
                ))}
              </div>
            </div>
            <p>
              Cada nivel corresponde a un grado escolar y los diez están abiertos:
              entra a cualquiera y explora su plan. Tu ruta empieza en el
              Nivel {nivelActual}; los ejercicios se irán encendiendo muy pronto.
            </p>
          </div>

          {ETAPAS.map(etapa => {
            const meta = ETAPA_META[etapa];
            const nivelesEtapa = NIVELES.filter(nv => nv.etapa === etapa);
            return (
              <div key={etapa}>
                <div
                  className="etapa-row reveal"
                  style={{ '--etapa-c': meta.color, '--etapa-soft': meta.colorSoft } as React.CSSProperties}
                >
                  <span className="etapa-sello" aria-hidden="true">{meta.label.charAt(0)}</span>
                  <h3>
                    <span className="etapa-kicker">Etapa</span>
                    {meta.label}
                  </h3>
                  <i className="etapa-linea" aria-hidden="true" />
                  <span className="etapa-rango">{meta.rango}</span>
                </div>
                <div className="niveles-grid">
                  {nivelesEtapa.map(nivel => tarjetaNivel(nivel, etapa === 'bachillerato'))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Paquetería Office ─── */}
      <section className="section section-office" id="office">
        <div className="container">
          <div className="section-head reveal">
            <div>
              <span className="section-tag">Bloque transversal</span>
              <h2>Paquetería Office, de básico a experto.</h2>
            </div>
            <p>
              Word, Excel, PowerPoint y Microsoft 365 acompañan toda la trayectoria:
              se desbloquean en 3° de primaria y suben de grado contigo.
            </p>
          </div>
          <div className="office-grid">
            {MODULOS_OFFICE.map(modulo => {
              const sala = SALAS_OFFICE.get(modulo.id) ?? { total: 0, listas: 0, ids: [] };
              const hechas = sala.ids.filter(id => progreso.get(id)?.completado).length;
              // Una sala sin una sola clase construida no puede parecer igual de
              // lista que una que tiene diecinueve: el pie lo dice y la tarjeta
              // entera baja el tono. Es lo que evita que el cliente entre a Excel
              // esperando lo que acaba de ver en Word.
              const estado = sala.listas === 0 ? 'pronto' : hechas > 0 ? 'en-marcha' : 'abierta';
              return (
              <Link
                key={modulo.id}
                href={`/hub/office/${modulo.id}`}
                className="office-card reveal"
                data-sala={estado}
                style={{ '--office': modulo.color, '--office-deep': modulo.colorDeep } as React.CSSProperties}
              >
                <div className="office-visual" aria-hidden="true">
                  {modulo.letra && <span className="office-marca">{modulo.letra}</span>}
                  {OFFICE_MOCKUPS[modulo.id]}
                </div>
                <span className="office-logo" aria-hidden="true">
                  {modulo.letra ?? (
                    <span className="logo-ms">
                      <i /><i /><i /><i />
                    </span>
                  )}
                </span>
                <div className="office-cuerpo">
                  <div className="office-titulo">
                    <h3>{modulo.nombre}</h3>
                    <span className="office-tagline">{modulo.tagline}</span>
                  </div>
                  <p>{modulo.descripcion}</p>
                  <ol className="office-ruta">
                    {modulo.grados.map(g => (
                      <li key={g.rango}>
                        <span className="ruta-nivel">{g.nivel}</span>
                        <span className="ruta-rango">{g.rango}</span>
                      </li>
                    ))}
                  </ol>
                  {/* El pie decía «🔒 Se desbloquea en {desde}» y prometía una
                      puerta que no existía: la tarjeta era un <article> sin
                      enlace. Ahora la puerta existe (doc §33) y el pie dice lo
                      único que le sirve al alumno para decidir si entra: cuántas
                      clases hay dentro, cuántas puede jugar ya y cuántas lleva.
                      Y si no hay ninguna construida, lo dice en vez de
                      esconderlo detrás de «desde 3° de primaria». */}
                  <div className="office-pie">
                    <span className="office-cuenta">
                      <b>{sala.total}</b> clases
                    </span>
                    {sala.listas > 0 ? (
                      <span className="office-listas">
                        <b>{sala.listas}</b> para jugar ya
                      </span>
                    ) : (
                      <span className="office-listas es-pronto">En construcción</span>
                    )}
                    {hechas > 0 && (
                      <span className="office-hechas">
                        <span aria-hidden="true">✔</span> {hechas} terminada{hechas === 1 ? '' : 's'}
                      </span>
                    )}
                    <span className="office-entrar">
                      {sala.listas > 0 ? 'Entrar a la sala' : 'Ver el temario'} <span aria-hidden="true">↗</span>
                    </span>
                  </div>
                  {sala.listas > 0 && (
                    <span className="office-barra" aria-hidden="true">
                      <i style={{ width: `${(hechas / sala.total) * 100}%` }} />
                      <b style={{ width: `${(sala.listas / sala.total) * 100}%` }} />
                    </span>
                  )}
                </div>
              </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Vitrina de insignias ───
          Va al final, después de la trayectoria y de Office. Es un premio: se
          entiende cuando ya viste de dónde sale. Puesta antes del contenido, lo
          primero que encuentra el alumno al entrar a su hub es una repisa de
          medallas casi todas bloqueadas, en lugar de los diez niveles a los que
          vino. El stat «Insignias» de la franja de arriba sigue anclando aquí
          con #insignias para quien la busque de inmediato. */}
      <CenInsignias insignias={insignias} />

      <HubFooter />
    </CenHubRoot>
  );
}
