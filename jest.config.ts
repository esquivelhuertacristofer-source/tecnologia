import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jest-environment-jsdom",
  /*
   * 30 s en vez de los 5 de fábrica. No es tapar una lentitud: es que el tope de
   * jest no mide nada, sólo corta un cuelgue, y con 5 s estaba cortando pruebas
   * sanas.
   *
   * Quiénes se caían: los recorridos completos —los que juegan una clase entera
   * de once encargos con DOM de verdad— que son **las pruebas más valiosas del
   * proyecto**, las únicas que cazan que una clase se ha quedado imposible de
   * terminar. Se caían sólo cuando la máquina iba cargada, así que fallaban a
   * ratos y por turnos: hoy `buscarx`, mañana `datos-reales`. Una prueba que
   * falla según lo ocupada que esté la máquina no se la cree nadie, y lo que
   * pasa después es que se mira para otro lado cuando falla de verdad.
   *
   * El tope no afecta a lo que sí mide tiempo: el criterio 3 del §45.5 lleva su
   * propio cronómetro y su propio listón de 16 ms, y ése no se toca.
   *
   * ── 2-sep-2026: de 30 a 90 s, por el mismo razonamiento de arriba ──────────
   *
   * Los 30 s se les quedaron cortos a los recorridos completos. Medido en cuatro
   * corridas seguidas de la suite entera esa noche, cayeron DOS suites cada vez
   * y **nunca las mismas**: primero `tablas-clase` y `elige-grafica`, luego
   * `buscarx` y `condicional`. Corridas a solas, las cuatro pasan —16 de 16 en
   * 46 s las dos últimas, contra 214 s bajo carga—. Es exactamente el «hoy
   * `buscarx`, mañana `datos-reales`» que ya avisa el párrafo de arriba: la
   * misma enfermedad, un tamaño más grande. La suite ha crecido a 153 archivos
   * y 3 567 pruebas, y la máquina a ratos tiene encima otra sesión trabajando en
   * otra plataforma —navegadores, dos servidores y ComfyUI—.
   *
   * Se sube el tope y no se reparten excepciones prueba a prueba: un `}, 60_000)`
   * suelto por aquí y por allá acaba siendo un tope MÁS BAJO que el global el día
   * que el global vuelva a subir, que es justo el error que se quiere evitar.
   *
   * Lo que cuesta: un cuelgue de verdad tarda 90 s en salir en vez de 30. La
   * corrida completa ya son diez minutos; no se nota.
   */
  testTimeout: 90_000,
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  testPathIgnorePatterns: ["/node_modules/", "/.next/", "/dist/"],
  testMatch: [
    "**/__tests__/**/*.test.ts",
    "**/__tests__/**/*.test.tsx",
  ],
  collectCoverageFrom: [
    "src/lib/**/*.ts",
    "src/app/actions/**/*.ts",
    "src/components/dashboard/**/*.tsx",
    "!src/**/*.d.ts",
  ],
  // Ojo: next/jest NO reemplaza esta lista, la CONCATENA a la suya, y basta con
  // que un patrón haga match para que el archivo se ignore. Así que esta lista
  // tiene que dejar pasar exactamente los mismos paquetes que
  // `transpilePackages` de next.config.ts o vuelve a ignorarlos por la puerta de
  // atrás. Son todos ESM y el harness de contrato monta las 56 actividades, así
  // que el rig 3D —y con él el composer— sí se importa dentro de jsdom aunque
  // nunca llegue a dibujar.
  transformIgnorePatterns: [
    "/node_modules/(?!(@react-three/postprocessing|n8ao|maath|three)/)",
  ],
};

export default createJestConfig(config);
