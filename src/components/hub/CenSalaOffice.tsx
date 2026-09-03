'use client';

/**
 * Sala de un programa del bloque Office transversal (doc §33) — /hub/office/[app].
 *
 * LO QUE ESTA PANTALLA NO HACE, y es lo que la define: no inventa contenido.
 * Todo sale de `getSalaOffice()`, que recorre el currículo buscando la marca
 * `office` de cada actividad y le suma los ejercicios exclusivos. Por eso las
 * clases prestadas llevan su CHAPA DE ORIGEN («Nivel 3 · Procesador de textos
 * I»): no son una copia, son la misma clase vista desde otro ángulo. Marcar una
 * actividad nueva con `office` la hace aparecer aquí sola.
 *
 * ─── Reconstrucción del 10-ago-2026 ───────────────────────────────────────
 * La sala es la primera pantalla que ve el cliente y era la única que nadie
 * había revisado. Se rehízo entera por cinco motivos, medidos en navegador
 * antes de tocar nada:
 *
 *  1. FONDO OSCURO. El cuerpo heredaba `--paper` (#f4f8fc): sólo el hero era
 *     oscuro y las 19 fichas de color pleno flotaban sobre casi-blanco. Ahora
 *     la sala entera va sobre navy y el color de marca es la única luz.
 *  2. UNA CLASE HECHA SE VE HECHA. Con 5 de 9 terminadas, lo único que
 *     cambiaba era el texto del botón. Ahora la ficha terminada lleva sello de
 *     palomita, canto dorado y cinta: se lee de un vistazo desde lejos.
 *  3. LA INSIGNIA POR SALA (§33.5 punto 4), que estaba pendiente. Vive aquí y
 *     no en `insignias.ts` porque necesita saber qué clases están CONSTRUIDAS,
 *     y eso vive en los registros, no en el currículo. Ver `cableado`.
 *  4. NUMERACIÓN CONTINUA 1…19. Antes reiniciaba en cada grado y había tres
 *     fichas con el número 1 en una sala de 19 clases.
 *  5. NINGUNA FICHA MIENTE. Lo que no se puede jugar se dibuja aparte, dice
 *     «Muy pronto» una sola vez y no finge ser un botón.
 *
 * Se dejó de reutilizar `unidad-card`/`ejercicio-card` del hub de nivel: esas
 * clases están calculadas para fondo claro y las comparte `CenNivelHub`, así
 * que oscurecerlas habría roto los diez niveles. La gramática visual —banner
 * de grado, lista de temas, rejilla de fichas— se conserva idéntica; lo que
 * cambia es que ahora tiene CSS propio (`CenSalaOffice.css`) y puede ir oscura.
 */

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { MODULOS_OFFICE } from '@/data/niveles';
import {
  OFFICE_CURRICULO,
  getSalaOffice,
  type AppOfficeId,
  type ClaseSalaOffice,
  type GradoDominio,
} from '@/data/curriculo';
import { getActividadRegistrada } from '@/components/activities/registry';
import { getOfficeRegistrada } from '@/components/activities/office/registroOffice';
import { progresoRepo } from '@/lib/progreso';
import type { ProgresoActividad } from '@/lib/progreso/repo';
import { CenHubRoot, HubTopbar, HubFooter } from './shell';
import './CenSalaOffice.css';

const NOMBRE_GRADO: Record<GradoDominio, string> = {
  basico: 'Básico',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

/** Cifra romana del grado — el sello de la medalla y el del banner. */
const CIFRA_GRADO: Record<GradoDominio, string> = {
  basico: 'I',
  intermedio: 'II',
  avanzado: 'III',
};

/**
 * Qué significa cada grado, dicho para el alumno y no para el docente. Va en el
 * banner del bloque porque «Intermedio» a secas no le dice nada a nadie: lo que
 * orienta es saber qué vas a ser capaz de hacer al salir de ahí.
 */
const PROMESA_GRADO: Record<AppOfficeId, Record<GradoDominio, string>> = {
  word: {
    basico: 'Escribir un texto y que se vea bien: formato, imágenes y guardarlo donde toca.',
    intermedio: 'Documentos largos que se ordenan solos y trabajo sobre el texto de otra persona.',
    avanzado: 'Que el documento trabaje por ti: cartas en serie, plantillas, formularios y coautoría.',
  },
  excel: {
    basico: 'Capturar datos sin errores, sumarlos y verlos en una primera gráfica.',
    intermedio: 'Que la hoja responda preguntas: funciones, filtros y tablas que se hablan entre sí.',
    // Reescrito con el §45.3, cuando el grado pasó de cuatro clases a ocho: el
    // rótulo anterior —«resumir miles de filas y montar un tablero»— describía
    // sólo las cuatro de antes y dejaba fuera la auditoría, la protección y el
    // «Y si». Un rótulo que se queda con el reparto viejo miente igual que una
    // entrada portada que sólo cambió el import (§36.12).
    avanzado: 'Limpiar y auditar la hoja, resumir miles de filas y automatizarla con una macro.',
  },
  powerpoint: {
    basico: 'Armar diapositivas que se entienden y presentarlas delante del grupo.',
    intermedio: 'Contar con diagramas, gráficos y video, y medir cuánto dura de verdad.',
    avanzado: 'Cambiar una vez y que cambien las cuarenta, y entregar sin dejar rastro.',
  },
  m365: {
    basico: '',
    intermedio: 'Correo, nube y reuniones: trabajar con otras personas sin perder nada por el camino.',
    avanzado: 'Lo que aprendiste no era el programa, era el oficio — y qué hace una IA dentro de él.',
  },
};

/**
 * LA INSIGNIA POR SALA (doc §33.5, punto 4).
 *
 * Qué se gana al terminar la sala entera. No es XP ni una estrella: es un
 * emblema con nombre propio, del tamaño de un trofeo, que sólo existe aquí.
 * El lema es la frase que el alumno puede decir de sí mismo cuando lo tiene.
 */
const TROFEO_SALA: Record<AppOfficeId, { titulo: string; lema: string }> = {
  word: {
    titulo: 'Maestro de Word',
    lema: 'Ya no le tienes miedo a un documento en blanco: lo escribes, lo ordenas y lo entregas.',
  },
  excel: {
    titulo: 'Maestro de Excel',
    lema: 'Le haces preguntas a una tabla de mil filas y te contesta.',
  },
  powerpoint: {
    titulo: 'Maestro de PowerPoint',
    lema: 'Te paras frente al grupo y la presentación trabaja a tu favor.',
  },
  m365: {
    titulo: 'Maestro de Microsoft 365',
    lema: 'Trabajas con otras personas en la nube sin perder nada por el camino.',
  },
};

/**
 * ¿Esta clase se puede jugar ya? Una clase PRESTADA vive en el registro de
 * niveles y una EXCLUSIVA en el de Office; la sala mezcla las dos, así que
 * tiene que preguntar en los dos sitios o las suyas propias saldrían siempre
 * como «en construcción».
 */
const estaConstruida = (id: string, prestada: boolean) =>
  prestada ? getActividadRegistrada(id) !== undefined : getOfficeRegistrada(id) !== undefined;

/**
 * Los cinco estados de una insignia, y por qué son cinco y no dos.
 *
 * La sala tiene 19 clases pero hoy sólo 9 están construidas. Con «ganada / no
 * ganada» habría que elegir entre dos mentiras: coronar a alguien que hizo 9 de
 * 19, o dejarle una medalla imposible de ganar durante meses. Así que la
 * medalla mide contra lo que HOY se puede jugar y dice en voz alta cuánto falta
 * por abrir:
 *
 *   cerrada   — no hay ni una clase construida todavía  → «Muy pronto»
 *   pendiente — hay clases y no has hecho ninguna
 *   en-marcha — vas a medias
 *   al-dia    — hiciste todo lo que está abierto, pero falta contenido por venir
 *   ganada    — están las 19 y las 19 están hechas. Ésta sí es la corona.
 */
type EstadoInsignia = 'cerrada' | 'pendiente' | 'en-marcha' | 'al-dia' | 'ganada';

function estadoInsignia(hechas: number, jugables: number, total: number): EstadoInsignia {
  if (jugables === 0) return 'cerrada';
  if (hechas === 0) return 'pendiente';
  if (hechas < jugables) return 'en-marcha';
  return jugables === total ? 'ganada' : 'al-dia';
}

interface Cuenta {
  total: number;
  jugables: number;
  hechas: number;
}

/**
 * La medalla. Anillo de avance en `conic-gradient`, emblema al centro y pie que
 * dice la verdad de su estado. `grande` la usa el trofeo de sala.
 */
function Medalla({
  emblema,
  titulo,
  cuenta,
  grande = false,
}: {
  emblema: React.ReactNode;
  titulo: string;
  cuenta: Cuenta;
  grande?: boolean;
}) {
  const estado = estadoInsignia(cuenta.hechas, cuenta.jugables, cuenta.total);
  const pct = cuenta.jugables > 0 ? Math.round((cuenta.hechas / cuenta.jugables) * 100) : 0;
  const porAbrir = cuenta.total - cuenta.jugables;

  const pie =
    estado === 'cerrada' ? 'Muy pronto'
      : estado === 'ganada' ? '¡Ganada!'
        : estado === 'al-dia' ? `¡Al corriente! Faltan ${porAbrir} por abrir`
          : `${cuenta.hechas} de ${cuenta.jugables}`;

  return (
    <div
      className={`sala-medalla${grande ? ' es-grande' : ''}`}
      data-estado={estado}
      style={{ '--pct': `${pct}%` } as CSSProperties}
    >
      <div className="medalla-disco">
        <span className="medalla-anillo" aria-hidden="true" />
        <span className="medalla-cara">
          <span className="medalla-emblema" aria-hidden="true">{emblema}</span>
        </span>
        {estado === 'ganada' && <span className="medalla-palomita" aria-hidden="true">✔</span>}
      </div>
      <strong className="medalla-titulo">{titulo}</strong>
      <span className="medalla-pie">{pie}</span>
    </div>
  );
}

export default function CenSalaOffice({ app }: { app: string }) {
  const [progreso, setProgreso] = useState<Map<string, ProgresoActividad>>(new Map());

  const appId = app as AppOfficeId;
  // `getSalaOffice` DERIVA la sala recorriendo el currículo: devuelve un array
  // nuevo en cada llamada. Sin memoizarlo aquí, `idsConstruidos` sería nuevo en
  // cada render, el efecto de abajo se volvería a disparar y la pantalla
  // entraría en un bucle de render infinito.
  const sala = useMemo(
    () => (OFFICE_CURRICULO.some(a => a.id === app) ? getSalaOffice(appId) : undefined),
    [app, appId],
  );
  const marca = MODULOS_OFFICE.find(m => m.id === app);

  // Los ids que pueden tener progreso: sólo los que existen de verdad. Se
  // memoiza porque el efecto de abajo depende de él y se deriva de un currículo
  // estático — sin esto, cada render dispararía otra ronda de lecturas.
  const idsConstruidos = useMemo(
    () => (sala ?? [])
      .flatMap(g => g.clases)
      .filter(c => c.estado === 'disponible' && estaConstruida(c.id, c.origen !== null))
      .map(c => c.id),
    [sala],
  );

  useEffect(() => {
    let activo = true;
    Promise.all(idsConstruidos.map(async id =>
      [id, await progresoRepo.getProgresoActividad(id)] as const))
      .then(entradas => {
        if (!activo) return;
        setProgreso(new Map(entradas.filter((e): e is [string, ProgresoActividad] => e[1] !== null)));
      });
    return () => { activo = false; };
  }, [idsConstruidos]);

  if (!sala || !marca) {
    return (
      <CenHubRoot>
        <HubTopbar back={{ href: '/hub#office', label: 'Volver al hub' }} />
        <div className="sala-office">
          <section className="hero sala-hero">
            <div className="container">
              <span className="section-tag">Programa no encontrado</span>
              <h1>Ese programa no existe.<span>La paquetería son Word, Excel, PowerPoint y Microsoft 365.</span></h1>
              <div className="hero-actions">
                <Link className="button-light" href="/hub#office">Volver al hub <span aria-hidden="true">↗</span></Link>
              </div>
            </div>
          </section>
        </div>
        <HubFooter />
      </CenHubRoot>
    );
  }

  const todas = sala.flatMap(g => g.clases);
  const jugables = todas.filter(c => c.estado === 'disponible' && estaConstruida(c.id, c.origen !== null));
  const hechas = jugables.filter(c => progreso.get(c.id)?.completado).length;
  const prestadas = todas.filter(c => c.origen !== null).length;
  const cuentaSala: Cuenta = { total: todas.length, jugables: jugables.length, hechas };

  // La siguiente clase por jugar: la primera sin terminar, y si están todas
  // terminadas, la primera de todas. Es lo que promete el botón del hero, así
  // que tiene que ser cierto.
  const siguiente = jugables.find(c => !progreso.get(c.id)?.completado) ?? jugables[0];

  const rutaDe = (clase: ClaseSalaOffice) =>
    clase.origen
      // El `?sala=` no lo lee nadie todavía: es el gancho para que el botón de
      // volver de una clase PRESTADA regrese aquí en vez de al hub de su nivel.
      // La otra mitad del cable va en CenActividadHost (ver `cableado`).
      ? `/hub/nivel/${clase.origen.nivel}/actividad/${clase.id}?sala=${app}`
      : `/hub/office/${app}/actividad/${clase.id}`;

  const tono = {
    '--office': marca.color,
    '--office-deep': marca.colorDeep,
  } as CSSProperties;

  // Numeración continua 1…19: la sala es un recorrido, no tres listas sueltas.
  let contador = 0;
  const numeroDe = new Map<string, number>();
  for (const clase of todas) numeroDe.set(clase.id, ++contador);

  const logo = marca.letra ?? <span className="logo-ms"><i /><i /><i /><i /></span>;

  /** Una clase: ficha jugable con enlace, o aviso de «muy pronto» sin enlace. */
  const pintarClase = (clase: ClaseSalaOffice) => {
    const construida = estaConstruida(clase.id, clase.origen !== null);
    const jugable = clase.estado === 'disponible' && construida;
    const minutos = clase.origen
      ? getActividadRegistrada(clase.id)?.meta.duracionMin
      : getOfficeRegistrada(clase.id)?.meta.duracionMin;
    const avance = progreso.get(clase.id);
    const hecha = avance?.completado === true;
    const icono = clase.icono ?? '📘';
    const num = numeroDe.get(clase.id) ?? 0;

    const chapa = clase.origen ? (
      <span className="clase-chapa">
        <span aria-hidden="true">↗</span> Nivel {clase.origen.nivel} · {clase.origen.unidad}
      </span>
    ) : (
      // Sin estrella: Cristofer las rechazó por escrito y este sello llevaba una.
      <span className="clase-chapa es-exclusiva">Sólo aquí</span>
    );

    if (!jugable) {
      return (
        <div key={clase.id} className="clase-card es-pronto">
          <span className="clase-num" aria-hidden="true">{num}</span>
          <span className="clase-escena" aria-hidden="true">
            <span className="clase-icono">{icono}</span>
          </span>
          <strong className="clase-titulo">{clase.titulo}</strong>
          {chapa}
          {/* Qué va a enseñar, tomado del currículo. Sin esto la ficha era un
              hueco con un rótulo: el cliente que revisa el temario merece ver
              de qué trata la clase aunque todavía no se pueda jugar. */}
          {clase.aprendizaje && <span className="clase-teaser">{clase.aprendizaje}</span>}
          <span className="clase-cta es-pronto">Muy pronto</span>
        </div>
      );
    }

    return (
      <Link
        key={clase.id}
        className={`clase-card es-jugable${hecha ? ' es-hecha' : ''}`}
        href={rutaDe(clase)}
      >
        <span className="clase-num" aria-hidden="true">{num}</span>
        <span className="clase-escena" aria-hidden="true">
          <span className="clase-icono">{icono}</span>
        </span>
        <strong className="clase-titulo">{clase.titulo}</strong>
        {chapa}
        <span className="clase-detalle">
          {minutos ? `≈ ${minutos} min` : ''}
          {hecha && avance ? ` · mejor ${avance.score}` : ''}
        </span>
        <span className="clase-cta">
          {hecha ? 'Otra vez' : '¡Jugar!'} <span aria-hidden="true">▶</span>
        </span>
        {hecha && <span className="clase-cinta" aria-hidden="true">Terminada</span>}
      </Link>
    );
  };

  return (
    <CenHubRoot>
      <HubTopbar back={{ href: '/hub#office', label: 'Volver al hub' }} />

      <div className="sala-office" style={tono}>
        {/* ─── Encabezado teñido con el color de marca del programa ─── */}
        <section className="hero sala-hero">
          <span className="sala-hero-marca" aria-hidden="true">{logo}</span>
          <div className="container">
            <span className="section-tag">Bloque transversal · {marca.tagline}</span>
            <h1>
              <span className="sala-hero-logo" aria-hidden="true">{logo}</span>
              {' '}{marca.nombre}
            </h1>
            <p className="hero-sub">{marca.descripcion}</p>

            {/* Lo primero que necesita saber quien entra: cuántas hay, cuántas
                puede jugar HOY y cuántas lleva. El resto es letra chica. */}
            <div className="sala-stats">
              <span className="sala-stat es-fuerte">
                <b>{cuentaSala.total}</b> clases en total
              </span>
              <span className="sala-stat es-viva">
                <b>{cuentaSala.jugables}</b> para jugar hoy
              </span>
              <span className="sala-stat">
                <b>{cuentaSala.hechas}</b> terminadas
              </span>
              <span className="sala-stat es-tenue">
                {sala.length} grados · {prestadas} vienen de tus niveles
              </span>
            </div>

            {siguiente && (
              <div className="hero-actions">
                <Link className="button-light" href={rutaDe(siguiente)}>
                  ▶ {cuentaSala.hechas > 0 ? 'Seguir' : 'Empezar'}: {siguiente.titulo}
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ─── El trofeo de la sala y las tres medallas de grado (§33.5) ─── */}
        <section className="sala-trofeo">
          <div className="container">
            <div className="trofeo-caja reveal">
              <div className="trofeo-principal">
                <Medalla
                  grande
                  emblema={logo}
                  titulo={TROFEO_SALA[appId].titulo}
                  cuenta={cuentaSala}
                />
                <div className="trofeo-texto">
                  <span className="section-tag">Lo que se gana aquí</span>
                  <h2>{TROFEO_SALA[appId].titulo}</h2>
                  <p>{TROFEO_SALA[appId].lema}</p>
                  <div className="trofeo-barra" aria-hidden="true">
                    <i style={{ width: `${cuentaSala.total ? (cuentaSala.hechas / cuentaSala.total) * 100 : 0}%` }} />
                    <b style={{ width: `${cuentaSala.total ? (cuentaSala.jugables / cuentaSala.total) * 100 : 0}%` }} />
                  </div>
                  <p className="trofeo-cuenta">
                    <strong>{cuentaSala.hechas}</strong> de <strong>{cuentaSala.total}</strong> clases terminadas
                    {cuentaSala.total > cuentaSala.jugables && (
                      <span> · {cuentaSala.total - cuentaSala.jugables} todavía por abrir</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="trofeo-grados">
                {sala.map(grado => {
                  const gTotal = grado.clases.length;
                  const gJug = grado.clases.filter(c =>
                    c.estado === 'disponible' && estaConstruida(c.id, c.origen !== null));
                  const gHechas = gJug.filter(c => progreso.get(c.id)?.completado).length;
                  return (
                    <Medalla
                      key={grado.dominio}
                      emblema={CIFRA_GRADO[grado.dominio]}
                      titulo={NOMBRE_GRADO[grado.dominio]}
                      cuenta={{ total: gTotal, jugables: gJug.length, hechas: gHechas }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Los tres grados ─── */}
        <section className="sala-cuerpo">
          <div className="container">
            <div className="sala-head reveal">
              <div>
                <span className="section-tag">Cómo se recorre</span>
                <h2>De básico a experto, sin repetir nada.</h2>
              </div>
              <p>
                Las clases marcadas con su nivel ya las tienes en tu trayectoria: son
                las mismas, aquí sólo están ordenadas por programa. Las que dicen
                «Sólo aquí» no aparecen en ningún nivel y se estudian en esta sala.
              </p>
            </div>

            <div className="sala-grados">
              {sala.map((grado, idx) => {
                const gTotal = grado.clases.length;
                const gJug = grado.clases.filter(c =>
                  c.estado === 'disponible' && estaConstruida(c.id, c.origen !== null));
                const gHechas = gJug.filter(c => progreso.get(c.id)?.completado).length;
                const gPronto = gTotal - gJug.length;
                const estado = estadoInsignia(gHechas, gJug.length, gTotal);
                const listas = gJug.filter(c => !progreso.get(c.id)?.completado);

                return (
                  <article key={grado.dominio} className="grado-bloque reveal" data-estado={estado}>
                    <header className="grado-banner">
                      <span className="grado-sello" aria-hidden="true">{CIFRA_GRADO[grado.dominio]}</span>
                      <div className="grado-textos">
                        <span className="grado-kicker">
                          Grado {String(idx + 1).padStart(2, '0')} ·{' '}
                          {grado.nivelesSugeridos.length === 1 ? 'Nivel' : 'Niveles'}{' '}
                          {grado.nivelesSugeridos.join(', ')}
                        </span>
                        <h3>{NOMBRE_GRADO[grado.dominio]}</h3>
                        <p className="grado-promesa">{PROMESA_GRADO[appId][grado.dominio]}</p>
                      </div>

                      {/* El marcador del grado: la respuesta de un vistazo a
                          «cuántas hay aquí y cuántas llevo». */}
                      <div className="grado-marcador">
                        <span className="marcador-cifra">
                          {gHechas}<i>/{gTotal}</i>
                        </span>
                        <span className="marcador-lbl">terminadas</span>
                        <span className="marcador-barra" aria-hidden="true">
                          <i style={{ width: `${gTotal ? (gHechas / gTotal) * 100 : 0}%` }} />
                          <b style={{ width: `${gTotal ? (gJug.length / gTotal) * 100 : 0}%` }} />
                        </span>
                        <span className="marcador-reparto">
                          {gJug.length > 0
                            ? `${listas.length > 0 ? `${listas.length} por jugar` : 'todo hecho'}${gPronto > 0 ? ` · ${gPronto} muy pronto` : ''}`
                            : `${gPronto} muy pronto`}
                        </span>
                      </div>
                    </header>

                    <ul className="grado-temas" aria-label={`Temas del grado ${NOMBRE_GRADO[grado.dominio]}`}>
                      {grado.temas.map(tema => <li key={tema}>{tema}</li>)}
                    </ul>

                    <div className="grado-clases">
                      {grado.clases.map(pintarClase)}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <HubFooter />
    </CenHubRoot>
  );
}
