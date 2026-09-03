import { LabPresentaAlGrupo } from '@/components/activities/office/powerpoint/LabPresentaAlGrupo';
import {
  celebrar, cuenta, elegirLa, encargo, escribirNota, irADiapositiva, irAPestana,
  jugarDesdeLaPortada, pulsar, confirmar,
} from '@/__tests__/ayuda-ppt';

const NOTA_PORTADA = 'Buenos días. Hoy les voy a hablar del desierto y de un animal muy raro que vive ahí.';
const NOTA_ZORRO = 'Tiene las orejas enormes para soltar el calor y casi no necesita tomar agua nunca.';
const NOTA_FINAL = 'Los dos viven en el mismo lugar y lo resuelven distinto. Eso fue todo, ¿tienen preguntas?';

describe('dbg presenta', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());
  it('traza', async () => {
    await jugarDesdeLaPortada(LabPresentaAlGrupo);
    const pasos: Array<() => void> = [
      () => elegirLa(1),
      () => escribirNota(NOTA_PORTADA),
      () => { irADiapositiva(1); confirmar(); },
      () => { irADiapositiva(2); escribirNota(NOTA_ZORRO); },
      () => { irADiapositiva(3); escribirNota(NOTA_FINAL); },
      () => { irAPestana('presentacion'); pulsar('desde-principio'); },
    ];
    for (let i = 0; i < pasos.length; i += 1) {
      const antes = encargo();
      pasos[i]();
      await celebrar();
      console.log(`paso ${i}: «${antes}» -> «${encargo()}» | ${cuenta()}`);
    }
    console.log('¿ensayo en pantalla?', document.querySelector('.aud-ensayo') !== null);
    console.log('¿canvas?', document.querySelector('canvas') !== null);
    console.log('¿ficha?', document.querySelector('[data-ficha]') !== null);
    console.log('botones aud:', Array.from(document.querySelectorAll('.aud-boton')).map((b) => b.textContent));
  });
});
