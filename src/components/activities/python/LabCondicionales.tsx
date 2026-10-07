'use client';

import type { ActivityProps } from '@/types/activity-contract';
import type { GuionCodigo, PanelCodigoProps, PasoCodigo } from '@/components/simuladores/codigo/ventana';
import { aceptado, crearPanelJuezProgramas, type ProblemaPrograma } from '@/components/simuladores/juez';
import { SalaCodigo, type ClaseCodigo } from './SalaCodigo';
import { C1, C2, C3, C4, CELDAS_CONDICIONALES, MANUAL_CONDICIONALES, PROBLEMAS_CONDICIONALES } from './problemasCondicionales';

/**
 * N7 · U «Programación en texto I (Python)» · parada 3 — «Condicionales».
 * **1.º de secundaria, 12–13 años**, comprobado en `curriculo.ts`.
 *
 * Documento maestro §68.5. Reescrita el 12-sep-2026 sobre el juez de programas.
 *
 * ── Qué era y por qué se reescribió ─────────────────────────────────────────
 *
 * Nueve encargos cuya instrucción era el programa («escribe `altura = 130` y
 * luego `if altura >= 120:`…») y cuyos predicados exigían esas líneas con
 * expresiones regulares. La altura estaba **fijada en el código**, así que un
 * `if` que siempre toma el mismo camino aprobaba igual que uno bien hecho: un
 * condicional que no decide sobre nada que no haya escrito el propio alumno no
 * se está probando.
 *
 * Y el clímax era un error que Python no da: `120 <= altura <= 150` es Python
 * válido y quien lo rechazaba era el intérprete. Desde el mismo día el
 * intérprete encadena comparaciones como Python (`COMP_CADENA`), y la clase ya
 * no enseña un límite del editor como si fuera del lenguaje.
 *
 * ── Qué es ahora ────────────────────────────────────────────────────────────
 *
 * Cuatro problemas con juez sobre La Serpiente (`problemasCondicionales.ts`),
 * con los casos ocultos en las **fronteras** —justo en 120, a un centímetro,
 * justo en 150— y en el **orden** de las preguntas, que es el error de un
 * condicional que no revienta. Una exploración (comparar con un solo `=`) y un
 * cierre sobre el `elif` al revés que el juez aceptó en los ejemplos y rechazó
 * en un oculto.
 *
 * ── El panel ────────────────────────────────────────────────────────────────
 *
 * El tablero del juez con su ficha del manual y, debajo, **El Semáforo**, que
 * se conserva de la versión anterior: qué rama tomó la última ejecución. Con
 * celdas `# %%` (ver `simuladores/codigo/celdas.ts`) ▶ corre sólo el problema
 * del encargo, así que el Semáforo habla de ese problema y no de los cuatro.
 */

/* ─────────────────────────────── el archivo ──────────────────────────────── */

const ARCHIVO = 'acceso.py';

export const PLANTILLA = [
  '# acceso.py · La Serpiente, la montaña rusa del parque',
  '#',
  '# Cada «# %%» abre una celda. ▶ corre la celda del encargo en que vas y',
  '# «Enviar al juez» corre la de su problema, tecleando los datos por ti.',
  '',
  '# %% Problema 1 · ¿Alcanzas?',
  '',
  '',
  '# %% Problema 2 · Tres caminos',
  '',
  '',
  '# %% Problema 3 · El pase VIP',
  '',
  '',
  '# %% Problema 4 · Entrada gratis',
  '',
].join('\n');

/* ─────────────────────────────── el panel ────────────────────────────────── */

interface RamaCondicion {
  linea: number;
  tipo: 'if' | 'elif' | 'else';
  condicion: string;
  texto: string | null;
}

const CABECERA_RAMA = /^\s*(if|elif|else)\b\s*([^:]*):\s*$/;
const PRINT_TEXTO = /^\s*print\(\s*"([^"]*)"\s*\)\s*$/;

/** Cada línea if/elif/else de la celda en que va el alumno, con el texto de su print. */
function ramas(fuente: string, celda: string | undefined): RamaCondicion[] {
  const lineas = fuente.split('\n');
  const salida: RamaCondicion[] = [];
  let dentro = celda === undefined;
  lineas.forEach((linea, i) => {
    const marca = /^\s*#\s*%%(.*)$/.exec(linea);
    if (marca && celda !== undefined) {
      dentro = marca[1].trim().startsWith(celda);
      return;
    }
    if (!dentro) return;
    const m = CABECERA_RAMA.exec(linea);
    if (!m) return;
    const pm = PRINT_TEXTO.exec(lineas[i + 1] ?? '');
    salida.push({ linea: i + 1, tipo: m[1] as RamaCondicion['tipo'], condicion: m[2].trim(), texto: pm ? pm[1] : null });
  });
  return salida;
}

/**
 * «El Semáforo» — qué camino tomó tu programa en la última ejecución.
 *
 * No decide nada: el juez es quien acepta. Sólo enseña, por cada `if`/`elif`/
 * `else` de la celda, si el texto de su `print` salió en la consola.
 */
function PanelSemaforo({ ejecucion, texto, senalarLinea, encargoId }: PanelCodigoProps) {
  const filas = ramas(texto, encargoId ? CELDAS_CONDICIONALES[encargoId] : undefined);

  if (filas.length === 0) {
    return (
      <p className="pyc-vacio" data-testid="pyc-semaforo-vacio">
        El Semáforo: en cuanto escribas un if en esta celda y ejecutes, aquí vas a ver qué camino tomó tu programa.
      </p>
    );
  }

  return (
    <div data-testid="pyc-semaforo-caja">
      <h5 className="pyc-semaforo-titulo">El Semáforo · la última vez que pulsaste ▶</h5>
      <ul className="pyc-filas" data-testid="pyc-semaforo">
        {filas.map((r) => {
          const tomada = r.texto !== null && ejecucion.salida.includes(r.texto);
          return (
            <li key={r.linea}>
              <button
                type="button"
                className={`pyc-fila${tomada ? ' es-hecha' : ''}`}
                data-tomada={tomada ? 'si' : 'no'}
                onClick={() => senalarLinea(r.linea)}
              >
                <span className="pyc-fila-textos">
                  <span className="pyc-fila-nombre">{r.tipo === 'else' ? 'else' : `${r.tipo} ${r.condicion}`}</span>
                  <span className="pyc-fila-detalle">{tomada ? 'Se tomó este camino.' : '— no se tomó —'}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="pyc-nota">Python revisa de arriba abajo y se queda en la PRIMERA condición que sea cierta.</p>
    </div>
  );
}

const PanelSerpiente = crearPanelJuezProgramas({
  problemas: PROBLEMAS_CONDICIONALES,
  manual: MANUAL_CONDICIONALES,
  fuera: PanelSemaforo,
  pie: PanelSemaforo,
});

/* ─────────────────────────────── el guion ────────────────────────────────── */

const APRENDIDO: Readonly<Record<string, string>> = {
  [C1.id]:
    'if y else parten el programa en dos caminos, y la frontera se lee con lupa: «120 o más» es mayor o igual, y alguien de 120 justos también sube.',
  [C2.id]:
    'elif añade caminos sin meter un if dentro de otro. Python se queda con la primera condición cierta, así que las fronteras se ordenan de un extremo al otro.',
  [C3.id]:
    'Cuando dos reglas se cruzan, la que descarta va primero. Y un texto se compara con ==, entre comillas, igual que se escribió.',
  [C4.id]:
    'or basta con que una condición sea cierta; and pide las dos. Elegir entre ellos es leer bien la regla, no la sintaxis.',
};

function pasoDeProblema(p: ProblemaPrograma): PasoCodigo {
  return {
    id: p.id,
    titulo: p.titulo,
    instruccion: `${p.enunciado} Escríbelo en la celda «${p.celda}» (▶ corre sólo esa celda) y, cuando creas que está listo, pulsa «Enviar al juez».`,
    pista: p.pistas[0],
    senal: { control: 'editor' },
    logro: { tipo: 'ejecucion', comprueba: (_e, fuente) => aceptado(p.id, fuente) },
    aprendido: APRENDIDO[p.id],
  };
}

const GUION: GuionCodigo = {
  pasos: [
    pasoDeProblema(C1),
    pasoDeProblema(C2),
    {
      id: 'un-igual-o-dos',
      titulo: 'Un igual o dos',
      instruccion:
        'Antes del pase VIP, un experimento. En la celda «Problema 3», pregunta el boleto y compáralo con el texto vip usando un solo signo igual, como cuando guardas un valor en una variable. Ejecuta y lee con calma lo que te contesta el editor.',
      pista: 'El error no es de Python en general: es el editor diciéndote qué signo esperaba. Léelo hasta el final.',
      senal: { control: 'consola' },
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => e.fase === 'error' && e.error?.clase === 'sintaxis' && !!e.error?.mensaje.includes('«==»'),
      },
      aprendido:
        'Un solo = guarda un valor; dos == preguntan si dos cosas son iguales. Confundirlos es de los errores más comunes al empezar, y por eso el editor lo explica en vez de sólo marcarlo.',
    },
    pasoDeProblema(C3),
    pasoDeProblema(C4),
    {
      id: 'el-orden-importa',
      titulo: 'Para cerrar · El elif que acierta a medias',
      instruccion:
        'Un compañero escribió el Problema 2 preguntando primero si la altura es menor que 150 y después si es menor que 120. El juez le aceptó los dos ejemplos, 130 y 170, y le rechazó un solo caso oculto: «alguien que no alcanza». ¿Por qué?',
      pista: 'Recorre sus preguntas en orden con alguien de 100 centímetros. ¿En cuál entra primero?',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Porque Python revisa de arriba abajo: a alguien de 100 le toca primero «menor que 150», que ya es cierta, y nunca llega a preguntar por 120.',
          'Porque 100 es un número demasiado pequeño para compararlo con 150.',
          'Porque el juez sólo acepta las condiciones escritas de menor a mayor.',
          'Porque a alguien de 100 se le cumplen las dos condiciones y Python imprime las dos frases.',
        ],
        correcta: 0,
      },
      aprendido:
        'Un elif mal ordenado no revienta: responde mal sin avisar, y acierta con los ejemplos que no pasan por la frontera equivocada. Por eso existen los casos ocultos, y por eso se ordenan las condiciones de un extremo al otro.',
    },
  ],
  cierre:
    'Tus programas deciden sobre datos que teclea otro, y un juez los probó justo en las fronteras: 120 exactos, 149, 150, un niño con boleto vip. Decidir bien es leer bien la regla.',
};

/* ─────────────────────────────── la clase ────────────────────────────────── */

export const CLASE: ClaseCodigo = {
  actividadId: 'n7-condicionales-python',
  titulo: 'Condicionales',
  archivo: ARCHIVO,
  insignia: { nombre: 'Tu programa ya decide', emoji: '🔀' },
  minutos: 35,
  portada: {
    situacion: 'Nivel 7 · Programación en texto I · Parada 3 de 5',
    tema: 'Condicionales: que tu programa decida',
    objetivo:
      'La Serpiente, la montaña rusa del parque, necesita un programa en la entrada que decida quién sube, con quién y por qué fila. Vas a escribirlo tú, sin líneas dictadas, y un juez lo va a probar con alturas y boletos justo en las fronteras.',
    vasAHacer: [
      'Decidir entre dos caminos con if y else, leyendo la frontera con lupa.',
      'Encadenar tres caminos con elif y descubrir por qué el orden de las preguntas importa.',
      'Comparar textos con == y ver qué pasa si usas un solo =.',
      'Juntar dos condiciones con and y con or, y explicar un elif que acierta a medias.',
    ],
  },
  plantilla: PLANTILLA,
  celdas: CELDAS_CONDICIONALES,
  guion: GUION,
  panelFijo: { titulo: 'El juez de la Serpiente', Cuerpo: PanelSerpiente },
  bit: {
    inicio:
      'Hoy tu programa decide quién sube a La Serpiente. El juez va a probarlo con gente que mide justo lo que marca el letrero, que es donde se equivocan los programas.',
    cierre: 'Tu programa ya decide, y decide bien en las fronteras. Eso es lo difícil de un condicional, no escribir el if.',
  },
  final: {
    titulo: 'Tu programa ya decide',
    detalle:
      'Cuatro programas que deciden quién sube, con quién, por qué fila y quién no paga, aceptados por un juez que probó cada frontera. Y sabes por qué un elif mal ordenado acierta con los ejemplos y falla con quien no esperabas.',
  },
};

export function LabCondicionales(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaCodigo {...props} clase={CLASE} />;
}

export default LabCondicionales;
