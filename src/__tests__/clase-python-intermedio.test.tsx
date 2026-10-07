/**
 * N10 · «Python intermedio» — la clase jugada entera (§69.21).
 *
 * Lo que vigila y el test del juez no puede: que haya una pestaña por archivo y
 * el editor escriba en la que está abierta; que un error dentro de clima.py
 * abra su pestaña; que ▶ con clima.py abierto corra clima.py; que el juez reciba
 * el clima.py que el alumno escribió (y no el de la plantilla); que reporte.txt
 * aparezca como pestaña cuando el programa lo escribe; y que ↺ devuelva el
 * proyecto entero. Jugando MAL antes que bien.
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { CLIMA, LabPythonIntermedio, PLANTILLA } from '@/components/activities/n10/python-intermedio/LabPythonIntermedio';

type Celda = 'La librería' | 'Problema 1' | 'Problema 2' | 'Problema 3';

function enCeldas(programas: Partial<Record<Celda, string>>): string {
  const lineas = PLANTILLA.split('\n');
  for (const [celda, programa] of Object.entries(programas)) {
    const i = lineas.findIndex((l) => l.startsWith(`# %% ${celda}`));
    lineas.splice(i + 1, 0, ...(programa as string).split('\n'));
  }
  return lineas.join('\n');
}

const CLASIFICA = 'def clasifica(t):\n    if t < UMBRAL_FRIO:\n        return "frío"\n    if t <= UMBRAL_CALOR:\n        return "templado"\n    return "calor"\n';
const CLIMA_BIEN = CLIMA.replace('# ↓ aquí va la función clasifica\n', `# ↓ aquí va la función clasifica\n${CLASIFICA}`);

const LIBRERIA = 'import statistics\nn = [3, 8, 1, 9, 4]\nprint(statistics.median(n))\nprint(statistics.mean(n))';
const SEMANA_NUMEROS = [
  'dias = []',
  'maximas = []',
  'with open("lecturas.csv") as f:',
  '    f.readline()',
  '    for linea in f:',
  '        partes = linea.strip().split(",")',
  '        dias.append(partes[0])',
  '        maximas.append(float(partes[1]))',
  'mejor = 0',
  'for i in range(len(maximas)):',
  '    if maximas[i] > maximas[mejor]:',
  '        mejor = i',
  'print("Días:", len(dias))',
  'print("Máxima promedio:", round(sum(maximas) / len(maximas), 1))',
  'print("Día más caluroso:", dias[mejor], "(" + str(maximas[mejor]) + ")")',
].join('\n');
const CLASIFICAR = [
  'from clima import clasifica',
  'with open("lecturas.csv") as f:',
  '    f.readline()',
  '    for linea in f:',
  '        partes = linea.strip().split(",")',
  '        print(partes[0] + ":", clasifica(float(partes[1])))',
].join('\n');
const EN_EL_PRINCIPAL = [
  'with open("lecturas.csv") as f:',
  '    f.readline()',
  '    for linea in f:',
  '        partes = linea.strip().split(",")',
  '        t = float(partes[1])',
  '        if t < 15:',
  '            c = "frío"',
  '        elif t <= 25:',
  '            c = "templado"',
  '        else:',
  '            c = "calor"',
  '        print(partes[0] + ":", c)',
].join('\n');
const REPORTE = [
  'from clima import clasifica',
  'f = open("lecturas.csv")',
  'lineas = f.readlines()[1:]',
  'f.close()',
  'r = open("reporte.txt", "w")',
  'for linea in lineas:',
  '    partes = linea.strip().split(",")',
  '    t = float(partes[1])',
  '    r.write(partes[0] + " " + str(t) + " " + clasifica(t) + "\\n")',
  'r.close()',
  'print("Días en el reporte:", len(lineas))',
].join('\n');

function montar() {
  const onComplete = jest.fn();
  render(<LabPythonIntermedio config={{}} onProgress={jest.fn()} onScore={jest.fn()} onComplete={onComplete} />);
  const api = {
    onComplete,
    entrar: () => {
      fireEvent.click(screen.getByTestId('pyc-empezar'));
      fireEvent.click(document.querySelector('[data-vel="rayo"]') as HTMLElement);
      return api;
    },
    pestana: (nombre: string) => document.querySelector(`[role="tab"][data-archivo="${nombre}"]`) as HTMLElement,
    abrir: (nombre: string) => fireEvent.click(api.pestana(nombre)),
    area: () => screen.getByTestId('cod-area') as HTMLTextAreaElement,
    escribir: (texto: string) => fireEvent.change(screen.getByTestId('cod-area'), { target: { value: texto } }),
    correr: () => fireEvent.click(screen.getByTestId('cod-ejecutar')),
    enviar: () => fireEvent.click(screen.getByTestId('jz-enviar')),
    veredicto: () => screen.getByTestId('jz-veredicto'),
    encargo: () => screen.getByTestId('cod-encargo').getAttribute('data-paso'),
    logrado: () => screen.queryByTestId('cod-logrado'),
    siguiente: () => fireEvent.click(screen.getByText('Siguiente encargo →')),
    salida: () => screen.getByTestId('cod-salida').textContent ?? '',
  };
  return api;
}

/** Llega al problema 2 con lo de antes hecho. */
function hastaElModulo() {
  const lab = montar().entrar();
  lab.escribir(enCeldas({ 'La librería': LIBRERIA }));
  lab.correr();
  lab.siguiente();
  lab.escribir(enCeldas({ 'La librería': LIBRERIA, 'Problema 1': SEMANA_NUMEROS }));
  lab.enviar();
  lab.siguiente();
  lab.escribir(enCeldas({ 'La librería': LIBRERIA, 'Problema 1': SEMANA_NUMEROS + '\nopen("semana.csv")' }));
  lab.correr();
  lab.siguiente();
  return lab;
}

describe('el proyecto en pestañas', () => {
  it('tres pestañas, y el editor enseña y escribe la que está abierta', () => {
    const lab = montar().entrar();
    expect(lab.pestana('estacion.py')).not.toBeNull();
    expect(lab.pestana('clima.py')).not.toBeNull();
    expect(lab.pestana('lecturas.csv')).not.toBeNull();
    expect(lab.area().value).toBe(PLANTILLA);

    lab.abrir('clima.py');
    expect(lab.pestana('clima.py').getAttribute('aria-selected')).toBe('true');
    expect(lab.area().value).toBe(CLIMA);
    lab.escribir(CLIMA_BIEN);
    expect(screen.getByTestId('cod-corre').textContent).toContain('corre clima.py');

    lab.abrir('estacion.py');
    expect(lab.area().value).toBe(PLANTILLA);
    lab.abrir('clima.py');
    expect(lab.area().value).toBe(CLIMA_BIEN);
    expect(document.querySelector('[data-testid="jz-fuera"] [data-archivo="clima.py"]')?.getAttribute('data-funciones')).toBe('clasifica');
  });

  it('↺ devuelve el proyecto entero, no sólo el principal', () => {
    const lab = montar().entrar();
    lab.abrir('clima.py');
    lab.escribir(CLIMA_BIEN);
    fireEvent.click(screen.getByTestId('cod-reiniciar'));
    expect(lab.pestana('estacion.py').getAttribute('aria-selected')).toBe('true');
    lab.abrir('clima.py');
    expect(lab.area().value).toBe(CLIMA);
  });
});

describe('jugando mal a propósito', () => {
  it('la regla copiada en el principal pasa los datos y el juez, probando el módulo solo, la rechaza', () => {
    const lab = hastaElModulo();
    expect(lab.encargo()).toBe('clasifica-la-semana');
    lab.escribir(enCeldas({ 'Problema 2': EN_EL_PRINCIPAL }));
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('no');
    expect(lab.veredicto().textContent).toContain('4 de 5 casos');
    expect(lab.veredicto().textContent).toContain('el juez importó tu módulo');
    /* El programa del juez no se asoma. */
    expect(document.body.textContent).not.toContain('clasifica(14.9)');
    expect(lab.logrado()).toBeNull();
  });

  it('un error dentro de clima.py abre su pestaña y dice el archivo', () => {
    const lab = hastaElModulo();
    lab.abrir('clima.py');
    lab.escribir(CLIMA_BIEN.replace('return "calor"', 'return calr'));
    lab.abrir('estacion.py');
    lab.escribir(enCeldas({ 'Problema 2': CLASIFICAR }));
    lab.correr();
    expect(screen.getByTestId('cod-error')).toBeInTheDocument();
    expect(lab.pestana('clima.py').getAttribute('aria-selected')).toBe('true');
    expect(screen.getByTestId('cod-error-linea').textContent).toMatch(/^clima\.py · Línea \d+/);
  });
});

describe('el recorrido de punta a punta', () => {
  it('los siete encargos hasta la insignia', () => {
    const lab = montar().entrar();

    expect(lab.encargo()).toBe('la-libreria');
    lab.escribir(enCeldas({ 'La librería': LIBRERIA }));
    lab.correr();
    expect(lab.salida()).toContain('4');
    expect(lab.logrado()).not.toBeNull();
    lab.siguiente();

    expect(lab.encargo()).toBe('la-semana-en-numeros');
    expect(screen.getByTestId('jz-ej-archivos').textContent).toContain('lecturas.csv');
    lab.escribir(enCeldas({ 'La librería': LIBRERIA, 'Problema 1': SEMANA_NUMEROS }));
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('si');
    lab.siguiente();

    expect(lab.encargo()).toBe('el-archivo-que-no-existe');
    lab.escribir(enCeldas({ 'La librería': LIBRERIA, 'Problema 1': SEMANA_NUMEROS + '\nopen("semana.csv")' }));
    lab.correr();
    expect(screen.getByTestId('cod-error').textContent).toContain('FileNotFoundError');
    expect(lab.logrado()).not.toBeNull();
    lab.siguiente();

    expect(lab.encargo()).toBe('clasifica-la-semana');
    lab.abrir('clima.py');
    lab.escribir(CLIMA_BIEN);
    lab.abrir('estacion.py');
    const conModulo = enCeldas({ 'La librería': LIBRERIA, 'Problema 1': SEMANA_NUMEROS, 'Problema 2': CLASIFICAR });
    lab.escribir(conModulo);
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('si');
    lab.siguiente();

    expect(lab.encargo()).toBe('corre-el-modulo');
    lab.correr();
    expect(lab.logrado()).toBeNull();
    lab.abrir('clima.py');
    lab.correr();
    expect(lab.salida()).toContain('Probando clima.py: templado');
    expect(lab.logrado()).not.toBeNull();
    lab.siguiente();

    expect(lab.encargo()).toBe('el-reporte');
    lab.abrir('estacion.py');
    lab.escribir(enCeldas({ 'La librería': LIBRERIA, 'Problema 1': SEMANA_NUMEROS, 'Problema 2': CLASIFICAR, 'Problema 3': REPORTE }));
    lab.correr();
    const generado = lab.pestana('reporte.txt');
    expect(generado.getAttribute('data-tipo')).toBe('generado');
    fireEvent.click(generado);
    expect(lab.area().value.split('\n')[0]).toBe('lunes 24.5 templado');
    lab.escribir('lo cambio a mano');
    expect(screen.getByTestId('cod-aviso').textContent).toContain('lo escribió tu programa');
    lab.abrir('estacion.py');
    expect(within(screen.getByTestId('cod-panel')).getAllByText(/lo escribió tu programa · 7 renglones/).length).toBeGreaterThan(0);
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('si');
    lab.siguiente();

    expect(lab.encargo()).toBe('por-que-no-salio');
    fireEvent.click(screen.getByText('Porque import sólo lee las funciones de un archivo y se salta todo lo demás.'));
    fireEvent.click(
      screen.getByText(
        'Porque al importarlo, __name__ vale "clima" y no "__main__": el bloque de prueba sólo corre cuando clima.py es el archivo que se ejecuta.',
      ),
    );
    expect(screen.getByText('Insignia · Arquitecto de módulos')).toBeInTheDocument();
    expect(lab.onComplete).toHaveBeenCalledTimes(1);
  });
});
