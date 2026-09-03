# Tecnia — Plataforma educativa de tecnología

Plataforma de CEN Campaña Educativa Nacional: 10 niveles (1° primaria → bachillerato) + bloque Office transversal, con actividades interactivas construidas bajo un contrato de actividad.

El plan de trabajo, los principios de arquitectura y el Definition of Done viven en [PLAN-MAESTRO-TECNIA.md](./PLAN-MAESTRO-TECNIA.md). El temario completo está en `../TEMARIO-PROPUESTA-V1.md`.

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Frontend | React 19, Tailwind CSS v4 |
| Animaciones | Framer Motion (UI) · CSS/WebAudio dentro de actividades |
| Iconos | Lucide React |
| Backend | Supabase (pendiente: proyecto NUEVO, nunca infra de otros clientes) |
| Pruebas | Jest + React Testing Library |

## Correr en modo demo

Sin Supabase: `.env.local` con `NEXT_PUBLIC_DEMO_MODE=1` y envs dummy de Supabase. Todo el estado (perfil, XP, progreso) vive en `localStorage` bajo llaves `tecnia_*`.

```bash
npm install
npm run dev
```

Rutas principales: `/` (landing), `/log-in` (botón demo), `/hub` (10 niveles + Office), `/hub/nivel/1` (actividad firma «Arma tu computadora»).

## Arquitectura de actividades

- Cada actividad es un **componente libre** que implementa `ActivityProps` (`src/types/activity-contract.ts`): `onProgress`, `onScore`, `onComplete`, `savedState`/`onSaveState`.
- **No hay motor de plantillas**: se comparten *utilidades* (sonido, drag, confeti), nunca mecánicas.
- El temario vive como datos tipados; la UI se deriva de los datos.

## Verificación

```bash
npx tsc --noEmit
npm run lint
npm test
```
