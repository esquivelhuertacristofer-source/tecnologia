import { fireEvent } from '@testing-library/react';
import { LabImagenesYTexto } from '@/components/activities/office/powerpoint/LabImagenesYTexto';
import {
  avisos, celebrar, confirmar, cuenta, elegirDe, elegirItem, elegirLa, encargo,
  escribirEn, escribirNota, irADiapositiva, irAPestana, jugarDesdeLaPortada, pulsar,
  seleccionarLibre, seleccionarMarcador,
} from '@/__tests__/ayuda-ppt';

function elegirTamano(pt: number) {
  fireEvent.change(document.querySelector('[data-control="fuente-tamano"]') as HTMLSelectElement, { target: { value: String(pt) } });
}
function puntero(el: Element, tipo: string, x: number, y: number) {
  fireEvent(el, new MouseEvent(tipo, { bubbles: true, clientX: x, clientY: y }));
}
function arrastrarTirador(cual: string, dx: number, dy: number) {
  const t = document.querySelector(`[data-tirador="${cual}"]`);
  if (!t) throw new Error(`no hay tirador ${cual}`);
  const l = document.querySelector('.dpw-lienzo')!;
  puntero(t, 'pointerdown', 0, 0);
  puntero(l, 'pointermove', dx, dy);
  puntero(l, 'pointerup', dx, dy);
}
const PARRAFO = 'El desierto es un lugar muy seco donde casi no llueve en todo el año, de día hace muchísimo calor y de noche hace tanto frío que los animales se esconden.';
const PASOS = [
  () => confirmar(),
  () => elegirLa(1),
  () => { irADiapositiva(1); escribirEn('cuerpo', 'Casi no llueve\nMucho calor de día\nFrío de noche'); },
  () => { seleccionarMarcador('cuerpo'); irAPestana('inicio'); pulsar('vinetas'); },
  () => escribirNota(PARRAFO),
  () => { irADiapositiva(2); seleccionarMarcador('titulo'); elegirTamano(44); },
  () => elegirDe('color', 'data-color', '#111827'),
  () => elegirLa(1),
  () => { irAPestana('insertar'); elegirItem('imagen', 'zorro'); },
  () => { seleccionarLibre('zorro'); arrastrarTirador('se', 240, 60); },
  () => pulsar('repasar'),
];

describe('dbg', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());
  it('traza', async () => {
    await jugarDesdeLaPortada(LabImagenesYTexto);
    for (let i = 0; i < PASOS.length; i += 1) {
      const antes = encargo();
      PASOS[i]();
      await celebrar();
      console.log(`paso ${i}: «${antes}» -> «${encargo()}» | cuenta=${cuenta()} | avisos=${avisos()}`);
    }
  });
});
