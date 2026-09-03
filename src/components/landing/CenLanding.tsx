"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { dmSans, manrope } from "@/app/fonts";
import "./CenLanding.css";

// Landing CEN v4 — «sala oscura, pantallas encendidas».
// El documento de diseño vive en LANDING-V4-DISENO.md (raíz del proyecto).
// Las fotografías son de Unsplash (licencia Unsplash, uso comercial sin
// atribución) y se sirven desde public/assets/landing-v4 vía next/image.

const FOTO = "/assets/landing-v4";

// Cifras del hero: verificadas contra el temario y las actividades construidas,
// no redondeos de marketing.
const CIFRAS = [
    { dato: "10", unidad: "niveles", pie: "De fundamentos a inteligencia artificial" },
    { dato: "3", unidad: "etapas", pie: "Primaria, secundaria y bachillerato" },
    { dato: "+50", unidad: "actividades", pie: "Jugables en 3D dentro del navegador" },
    { dato: "0", unidad: "instalaciones", pie: "Se abre y funciona, sin descargar nada" },
];

const ETAPAS = [
    {
        etapa: "Primaria",
        indice: "01",
        foto: `${FOTO}/primaria-robots.jpg`,
        alt: "Niño de primaria programando con una tableta unos robots educativos de luz azul",
        titulo: "Descubrir sin miedo.",
        copy: "Los fundamentos digitales entran jugando: partes de la computadora, archivos, internet seguro y las primeras secuencias lógicas.",
        puntos: ["Manejo del equipo", "Creatividad digital", "Internet con criterio"],
    },
    {
        etapa: "Secundaria",
        indice: "02",
        foto: `${FOTO}/secundaria.jpg`,
        alt: "Estudiante de secundaria de perfil, con el rostro iluminado por la pantalla, trabajando en una computadora portátil dentro de un aula a oscuras",
        titulo: "Crear con propósito.",
        copy: "Simuladores de software real, pensamiento computacional y proyectos que resuelven un problema concreto de su entorno.",
        puntos: ["Ofimática aplicada", "Programación por bloques", "Proyectos en equipo"],
    },
    {
        etapa: "Bachillerato",
        indice: "03",
        foto: `${FOTO}/bachillerato.jpg`,
        alt: "Estudiante de bachillerato con lentes, de perfil en un laboratorio de cómputo a oscuras, entre monitores con código y un portátil con un asistente de inteligencia artificial abierto",
        titulo: "Aplicar para transformar.",
        copy: "Datos, automatización e inteligencia artificial usada con criterio, en proyectos que conectan con lo académico y lo profesional.",
        puntos: ["Análisis de datos", "IA responsable", "Portafolio propio"],
    },
];

// Altura en porcentaje de cada barra de la gráfica del panel de seguimiento:
// doce semanas de actividad, con la tendencia al alza que produce una ruta continua.
const SEMANAS = [32, 45, 38, 57, 49, 66, 60, 74, 68, 83, 77, 94];

const BENEFICIOS = [
    { n: "01", titulo: "Ruta formativa continua", copy: "Una sola progresión de primaria a bachillerato, sin repetir ni dejar huecos entre grados." },
    { n: "02", titulo: "Seguimiento por grupo", copy: "Avance, actividades completadas e insignias obtenidas, legibles de un vistazo." },
    { n: "03", titulo: "Acompañamiento CEN", copy: "Implementación, formación docente y orientación para integrar la propuesta en la escuela." },
    { n: "04", titulo: "Sin infraestructura nueva", copy: "Funciona en el navegador del equipo que la escuela ya tiene. Nada que instalar ni mantener." },
];

export default function CenLanding() {
    const rootRef = useRef<HTMLDivElement>(null);
    const yearRef = useRef<HTMLSpanElement>(null);
    const [menuOpen, setMenuOpen] = useState(false);

    // html { scroll-behavior: smooth; background: var(--navy) }, sólo mientras
    // la landing está montada.
    useEffect(() => {
        const html = document.documentElement;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const prevBehavior = html.style.scrollBehavior;
        const prevBackground = html.style.background;
        if (!reduced) html.style.scrollBehavior = "smooth";
        html.style.background = "#04122a";
        return () => {
            html.style.scrollBehavior = prevBehavior;
            html.style.background = prevBackground;
        };
    }, []);

    useEffect(() => {
        document.body.style.overflow = menuOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [menuOpen]);

    useEffect(() => {
        if (yearRef.current) yearRef.current.textContent = String(new Date().getFullYear());
    }, []);

    // La cabecera se compacta al salir del hero.
    useEffect(() => {
        const alScroll = () => {
            rootRef.current?.classList.toggle("is-scrolled", window.scrollY > 40);
        };
        alScroll();
        window.addEventListener("scroll", alScroll, { passive: true });
        return () => window.removeEventListener("scroll", alScroll);
    }, []);

    // Reveals al entrar en pantalla (threshold .12, se deja de observar al entrar).
    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        const revealEls = root.querySelectorAll(".reveal");
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduced || !("IntersectionObserver" in window)) {
            revealEls.forEach((el) => el.classList.add("in-view"));
            return;
        }
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("in-view");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12 },
        );
        revealEls.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const closeMenu = () => setMenuOpen(false);

    return (
        <div ref={rootRef} className={`cen-landing ${dmSans.variable} ${manrope.variable}`}>
            <header className="site-header">
                <div className="container nav">
                    <a className="brand" href="#inicio" aria-label="CEN, inicio">CEN</a>
                    <button
                        className="menu-toggle"
                        type="button"
                        aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((open) => !open)}
                    >
                        <span></span>
                    </button>
                    <nav className={`nav-links${menuOpen ? " is-open" : ""}`} aria-label="Navegación principal">
                        <a href="#trayectoria" onClick={closeMenu}>Trayectoria</a>
                        <a href="#aprendizaje" onClick={closeMenu}>Aprendizaje</a>
                        <a href="#escuelas" onClick={closeMenu}>Para escuelas</a>
                        <Link className="nav-cta" href="/log-in" onClick={closeMenu}>Iniciar sesión</Link>
                    </nav>
                </div>
            </header>

            <main>
                <section className="hero" id="inicio">
                    <div className="hero-glow" aria-hidden="true"></div>
                    <div className="container hero-grid">
                        <div className="hero-content reveal">
                            <span className="eyebrow">Campaña Educativa Nacional</span>
                            <h1>Una generación que<span>crea tecnología.</span></h1>
                            <p className="hero-copy">
                                CEN es la ruta completa de tecnología para primaria, secundaria y bachillerato:
                                diez niveles de actividades que se juegan en 3D dentro del navegador, simuladores
                                de software real y proyectos donde el alumno construye, programa y crea.
                            </p>
                            <div className="hero-actions">
                                <Link className="button-primary" href="/log-in">Entrar a la plataforma <span aria-hidden="true">↗</span></Link>
                                <a className="button-ghost" href="#trayectoria">Ver la trayectoria <span aria-hidden="true">↓</span></a>
                            </div>
                            <div className="hero-meta" aria-label="Cobertura educativa">
                                <span>Primaria</span><span>Secundaria</span><span>Bachillerato</span>
                            </div>
                        </div>

                        <div className="hero-art reveal">
                            <figure className="shot shot-main">
                                <Image
                                    src={`${FOTO}/hero-robotica.jpg`}
                                    alt="Grupo de niñas y niños rodeando un robot humanoide en el aula"
                                    fill
                                    priority
                                    sizes="(max-width: 1050px) 92vw, 46vw"
                                />
                                <figcaption><b>Nivel 7</b> Robótica y automatización</figcaption>
                            </figure>
                            <figure className="shot shot-a">
                                <Image
                                    src={`${FOTO}/concentracion.jpg`}
                                    alt="Estudiante concentrada frente a una computadora portátil"
                                    fill
                                    sizes="(max-width: 1050px) 44vw, 20vw"
                                />
                            </figure>
                            <figure className="shot shot-b">
                                <Image
                                    src={`${FOTO}/teclado.jpg`}
                                    alt="Manos de una niña sobre el teclado de una computadora portátil"
                                    fill
                                    sizes="(max-width: 1050px) 44vw, 20vw"
                                />
                            </figure>
                            <div className="progress-chip">
                                <small>Ruta del alumno</small>
                                <strong>Dentro del gabinete</strong>
                                <div className="progress-track"><i style={{ width: "68%" }}></i></div>
                                <span>Nivel 1 · Unidad 2 · módulo 2 de 7</span>
                            </div>
                            <div className="badge-chip">
                                <span aria-hidden="true">★</span>
                                <div><small>Insignia obtenida</small><b>Experto en componentes</b></div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="numbers-strip">
                    <div className="container numbers-grid reveal">
                        {CIFRAS.map((c) => (
                            <div className="number-item" key={c.unidad}>
                                <strong>{c.dato}<em>{c.unidad}</em></strong>
                                <p>{c.pie}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <section className="section journey" id="trayectoria">
                    <div className="container">
                        <div className="section-head reveal">
                            <div>
                                <span className="eyebrow">Una experiencia que evoluciona</span>
                                <h2>Crece con el alumno, no se queda atrás.</h2>
                            </div>
                            <p>Cada etapa recibe los retos, las herramientas y los proyectos que le tocan. La tecnología deja de ser una materia aislada y se vuelve una forma de pensar y de crear.</p>
                        </div>
                        <div className="stage-grid">
                            {ETAPAS.map((e) => (
                                <article className="stage-card reveal" key={e.etapa}>
                                    <div className="stage-photo">
                                        <Image src={e.foto} alt={e.alt} fill sizes="(max-width: 820px) 92vw, 32vw" />
                                    </div>
                                    <div className="stage-body">
                                        <div className="stage-top">
                                            <span className="stage-index">{e.indice}</span>
                                            <span className="stage-name">{e.etapa}</span>
                                        </div>
                                        <h3>{e.titulo}</h3>
                                        <p>{e.copy}</p>
                                        <ul className="stage-list">
                                            {e.puntos.map((p) => <li key={p}>{p}</li>)}
                                        </ul>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="section capabilities light" id="aprendizaje">
                    <div className="container">
                        <div className="section-head reveal">
                            <div>
                                <span className="eyebrow">Aprendizaje activo</span>
                                <h2>Menos teoría aislada. Más cosas que sí pueden hacer.</h2>
                            </div>
                            <p>Habilidades digitales, creatividad, productividad, pensamiento lógico e inteligencia artificial dentro de una misma experiencia, visual y progresiva.</p>
                        </div>
                        <div className="bento">
                            <article className="bento-card large reveal">
                                <div className="bento-photo">
                                    <Image
                                        src={`${FOTO}/creacion.jpg`}
                                        alt="Mano dibujando con un lápiz digital sobre una tableta gráfica"
                                        fill
                                        sizes="(max-width: 820px) 92vw, 42vw"
                                    />
                                </div>
                                <div className="bento-text">
                                    <span className="bento-chip">Creación digital</span>
                                    <h3>De consumidores a creadores.</h3>
                                    <p>Los alumnos producen carteles, presentaciones, animaciones y soluciones digitales que después explican y comparten con su grupo.</p>
                                </div>
                            </article>

                            <article className="bento-card reveal">
                                <div className="bento-photo">
                                    <Image
                                        src={`${FOTO}/datos.jpg`}
                                        alt="Gráfica circular de datos sobre fondo azul marino, con anillos concéntricos, marcas de escala y puntos azules y dorados de distinto tamaño"
                                        fill
                                        sizes="(max-width: 820px) 92vw, 26vw"
                                    />
                                </div>
                                <div className="bento-text">
                                    <span className="bento-chip">Datos</span>
                                    <h3>Comprender información.</h3>
                                    <p>Organizar, interpretar y comunicar datos de forma visual.</p>
                                </div>
                            </article>

                            <article className="bento-card reveal">
                                <div className="bento-photo">
                                    <Image
                                        src={`${FOTO}/logica.jpg`}
                                        alt="Placa de circuito azul marino a primer plano, con pistas doradas que salen en todas direcciones desde un chip central"
                                        fill
                                        sizes="(max-width: 820px) 92vw, 26vw"
                                    />
                                </div>
                                <div className="bento-text">
                                    <span className="bento-chip">Pensamiento lógico</span>
                                    <h3>Pensar paso a paso.</h3>
                                    <p>Secuencias, condiciones, repetición y depuración de errores.</p>
                                </div>
                            </article>

                            <article className="bento-card wide reveal">
                                <div className="bento-photo">
                                    <Image
                                        src={`${FOTO}/ia.jpg`}
                                        alt="Onda de partículas azules luminosas sobre fondo negro"
                                        fill
                                        sizes="(max-width: 820px) 92vw, 54vw"
                                    />
                                </div>
                                <div className="bento-text">
                                    <span className="bento-chip">Inteligencia artificial</span>
                                    <h3>Usar IA con criterio, creatividad y acompañamiento.</h3>
                                    <p>Una introducción progresiva al uso responsable de herramientas inteligentes, que apoya el proceso de aprendizaje en vez de sustituirlo.</p>
                                </div>
                            </article>
                        </div>
                    </div>
                </section>

                <section className="section schools" id="escuelas">
                    <div className="container">
                        <div className="section-head reveal">
                            <div>
                                <span className="eyebrow">CEN para escuelas</span>
                                <h2>Atractiva para el alumno. Legible para la institución.</h2>
                            </div>
                            <p>Aprendizaje, seguimiento y acompañamiento en la misma propuesta, para que la implementación tenga sentido dentro de cada comunidad escolar.</p>
                        </div>
                        <div className="school-grid">
                            <div className="school-visual reveal">
                                <div className="school-photo">
                                    <Image
                                        src={`${FOTO}/escuelas.jpg`}
                                        alt="Aula a media luz con la clase frente a una pantalla encendida y la docente al frente"
                                        fill
                                        sizes="(max-width: 1050px) 92vw, 54vw"
                                    />
                                </div>
                                <div className="dashboard" aria-label="Vista de seguimiento escolar">
                                    <div className="dashboard-head">
                                        <strong>Seguimiento académico</strong>
                                        <span>Vista de ejemplo</span>
                                    </div>
                                    <div className="dash-row">
                                        <div className="dash-card"><small>Grupos activos</small><strong>14</strong></div>
                                        <div className="dash-card"><small>Actividades completadas</small><strong>1 286</strong></div>
                                    </div>
                                    <div className="dash-card dash-chart">
                                        <small>Actividades por semana</small>
                                        <div className="dashboard-chart" aria-hidden="true">
                                            {SEMANAS.map((alto, i) => (
                                                <i key={`sem-${i}`} style={{ height: `${alto}%` }}></i>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="school-benefits">
                                {BENEFICIOS.map((b) => (
                                    <article className="benefit-card reveal" key={b.n}>
                                        <span className="benefit-icon">{b.n}</span>
                                        <div><h3>{b.titulo}</h3><p>{b.copy}</p></div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="cta-section">
                    <div className="cta-photo">
                        <Image
                            src={`${FOTO}/aula-docente.jpg`}
                            alt="Docente guiando a un grupo de estudiantes frente a los monitores del aula"
                            fill
                            sizes="100vw"
                        />
                    </div>
                    <div className="container">
                        <div className="cta-inner reveal">
                            <span className="eyebrow">Empieza hoy</span>
                            <h2>La clase de tecnología que sus alumnos van a querer tomar.</h2>
                            <p>Entra a la plataforma para continuar tus actividades, o escríbenos para llevar CEN a tu escuela.</p>
                            <div className="cta-actions">
                                <Link className="button-primary" href="/log-in">Iniciar sesión <span aria-hidden="true">↗</span></Link>
                                <a className="button-ghost" href="#escuelas">Propuesta para escuelas</a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer>
                <div className="container">
                    <div className="footer-grid">
                        <div>
                            <div className="footer-brand"><strong>CEN</strong></div>
                            <p>Campaña Educativa Nacional · Tecnología educativa para aprender, crear y transformar.</p>
                        </div>
                        <nav className="footer-links" aria-label="Navegación del pie">
                            <a href="#trayectoria">Trayectoria</a>
                            <a href="#aprendizaje">Aprendizaje</a>
                            <a href="#escuelas">Para escuelas</a>
                            <Link href="/log-in">Iniciar sesión</Link>
                        </nav>
                    </div>
                    <div className="footer-bottom">© <span ref={yearRef}></span> CEN · Campaña Educativa Nacional.</div>
                </div>
            </footer>
        </div>
    );
}
