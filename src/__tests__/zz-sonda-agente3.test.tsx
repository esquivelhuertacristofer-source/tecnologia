/** Sonda temporal: ¿se puede salir del SmartArt equivocado? SE BORRA. */
import { LabSmartArtYGraficos } from '@/components/activities/office/powerpoint/smartart-y-graficos/Lab';
import {
  avisos,
  celebrar,
  elegirItem,
  encargo,
  irAPestana,
  irADiapositiva,
  jugarDesdeLaPortada,
  pulsar,
  seleccionarLibre,
} from './ayuda-ppt';

describe('sonda', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('elegir la forma equivocada y volver', async () => {
    const partida = await jugarDesdeLaPortada(LabSmartArtYGraficos);
    irADiapositiva(1);
    irAPestana('insertar');
    elegirItem('smartart', 'jerarquia');
    await celebrar();
    // eslint-disable-next-line no-console
    console.log('SONDA tras jerarquia · encargo:', encargo());
    // eslint-disable-next-line no-console
    console.log('SONDA libres:', Array.from(document.querySelectorAll('[data-libre]')).map((x) => (x as HTMLElement).dataset.libre).join(','));

    // El alumno se va a mirar otra y vuelve: eso suelta la selección.
    irADiapositiva(2);
    irADiapositiva(1);
    pulsar('smartart');
    // eslint-disable-next-line no-console
    console.log('SONDA botón muerto · aviso:', avisos(), '· galería:', document.querySelector('.dpw-galeria') !== null);

    // Y ahora seleccionando el dibujo.
    seleccionarLibre('smartart-1');
    elegirItem('smartart', 'proceso');
    await celebrar();
    // eslint-disable-next-line no-console
    console.log('SONDA tras rehacer · encargo:', encargo());
    partida.desmontar();
  });
});
