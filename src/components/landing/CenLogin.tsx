"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { dmSans, manrope } from "@/app/fonts";
import { PERFIL_DEMO, savePerfilDemo } from "@/data/niveles";
import { savePerfilDocente } from "@/lib/docente/queries";
import { entrarConCorreo } from "@/lib/auth/sesion";
import "./CenLogin.css";

/*
 * Login CEN — diseño original (cen-landing/login.html) convertido 1:1 a React.
 *
 * Desde el 3-sep-2026 el formulario entra DE VERDAD: pregunta a Supabase y,
 * según el rol que venga en la cuenta, lleva al hub de alumno o al de
 * profesor. Antes aceptaba cualquier correo y guardaba un perfil de demo.
 *
 * Lo que NO cambió, a propósito: «Explorar sin cuenta» sigue entrando en modo
 * demostración. La plataforma se enseña en escuelas y ferias sin repartir
 * credenciales, y ese botón es lo que hace que se pueda enseñar. Un login que
 * de pronto exige cuenta a todo el mundo no es más seguro: es una demo que ya
 * no se puede dar.
 *
 * Y el perfil local se sigue guardando tras entrar, porque todo el avance del
 * alumno vive hoy en `localStorage` (ver `progreso/repo.ts`): la sesión dice
 * QUIÉN eres, el perfil local sigue diciendo POR DÓNDE VAS. El día que el
 * progreso viaje a Supabase, ese perfil se rellena desde la base.
 */
export default function CenLogin() {
    const passwordRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState("");
    const [entering, setEntering] = useState(false);

    // html { background: var(--navy-950) } del original, solo durante el montaje.
    useEffect(() => {
        const html = document.documentElement;
        const prevBackground = html.style.background;
        html.style.background = "#031225";
        return () => {
            html.style.background = prevBackground;
        };
    }, []);

    const togglePassword = () => {
        setShowPassword((showing) => !showing);
    };

    const handleHelp = (event: React.MouseEvent) => {
        event.preventDefault();
        setStatus("Escribe a soporte para restablecer tu contraseña.");
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = formRef.current;
        if (!form) return;
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        if (entering) return;
        const datos = new FormData(form);
        const correo = String(datos.get("user") ?? "").trim();
        const contrasena = String(datos.get("password") ?? "");

        setEntering(true);
        setStatus("Comprobando tus datos…");
        const resultado = await entrarConCorreo(correo, contrasena);
        if (!resultado.ok) {
            setEntering(false);
            setStatus(resultado.mensaje);
            return;
        }

        setStatus("Entrando a la plataforma…");
        if (resultado.rol === "docente" || resultado.rol === "admin") {
            savePerfilDocente({ nombre: resultado.nombre });
            window.location.href = "/hub/docente";
            return;
        }
        savePerfilDemo({ ...PERFIL_DEMO, nombre: resultado.nombre });
        window.location.href = "/hub";
    };

    // Entrar sin cuenta: el modo demostración de siempre. No toca Supabase.
    const handleGuest = () => {
        if (entering) return;
        setEntering(true);
        setStatus("Entrando sin cuenta…");
        savePerfilDemo(PERFIL_DEMO);
        window.location.href = "/hub";
    };

    // La demo de profesor, sin cuenta. Sigue existiendo para poder enseñar el
    // hub docente en una feria sin repartir credenciales; quien tiene cuenta
    // de verdad entra por el formulario de arriba.
    const handleDocente = (event: React.MouseEvent) => {
        event.preventDefault();
        if (entering) return;
        setEntering(true);
        setStatus("Entrando a la demo docente…");
        savePerfilDocente();
        window.location.href = "/hub/docente";
    };

    return (
        <div className={`cen-login ${dmSans.variable} ${manrope.variable}`}>
            <header className="topbar">
                <Link className="brand" href="/" aria-label="CEN, volver al inicio">CEN</Link>
                <Link className="back" href="/"><span aria-hidden="true">←</span> Volver al inicio</Link>
            </header>

            <main className="page">
                <section className="access-shell" aria-labelledby="loginTitle">
                    <div className="intro">
                        <div className="intro-mark">Campaña Educativa Nacional</div>
                        <div className="intro-copy">
                            <h1>Tu espacio para<span>seguir avanzando.</span></h1>
                            <p>Accede a tus actividades, proyectos y rutas de aprendizaje desde una experiencia clara, segura y diseñada para la comunidad CEN.</p>
                        </div>
                        <div className="intro-footer">CEN · Aprendizaje y tecnología con propósito.</div>
                    </div>

                    <div className="form-side">
                        <div className="login-card">
                            <h2 id="loginTitle">Iniciar sesión</h2>
                            <p>Ingresa tus datos para acceder a la plataforma.</p>

                            <form ref={formRef} className="form" noValidate onSubmit={handleSubmit}>
                                <div className="field">
                                    <label htmlFor="user">Correo o usuario</label>
                                    <div className="input-wrap">
                                        <input id="user" name="user" type="text" autoComplete="username" inputMode="email" placeholder="Correo o usuario" required />
                                        <span className="input-icon" aria-hidden="true">@</span>
                                    </div>
                                </div>

                                <div className="field">
                                    <label htmlFor="password">Contraseña</label>
                                    <div className="input-wrap">
                                        <input
                                            ref={passwordRef}
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="current-password"
                                            placeholder="Contraseña"
                                            minLength={6}
                                            required
                                        />
                                        <button
                                            className="password-toggle"
                                            type="button"
                                            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                            aria-pressed={showPassword}
                                            onClick={togglePassword}
                                        >
                                            {showPassword ? "OCULTAR" : "VER"}
                                        </button>
                                    </div>
                                </div>

                                <div className="form-options">
                                    <label className="remember"><input type="checkbox" name="remember" /> Mantener mi sesión</label>
                                    <a className="help-link" href="#" onClick={handleHelp}>¿Olvidaste tu contraseña?</a>
                                </div>

                                <button className="submit-button" type="submit" disabled={entering}>Entrar a CEN</button>
                                <div className="form-status" aria-live="polite">{status}</div>
                            </form>

                            <div className="guest-divider" role="separator"><span>o</span></div>
                            <button
                                type="button"
                                className="guest-button"
                                onClick={handleGuest}
                                disabled={entering}
                            >
                                Explorar sin cuenta
                            </button>

                            <p className="access-note">Entra con la cuenta que te dio tu escuela. Si sólo quieres conocer la plataforma, usa «Explorar sin cuenta».</p>
                            <p className="access-note" style={{ marginTop: 10, paddingTop: 0, borderTop: "none" }}>
                                ¿Eres profesor? <a className="help-link" href="/hub/docente" onClick={handleDocente}>Entrar a la demo docente →</a>
                            </p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
