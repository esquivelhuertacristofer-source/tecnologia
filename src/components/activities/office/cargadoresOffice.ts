/**
 * Cargadores de las 38 clases exclusivas del bloque Office.
 *
 * Mismo motivo que `../cargadores.ts`: los `import()` fuera del registro para
 * que el Worker de Cloudflare no cargue con el codigo del navegador. Lo
 * alcanza solo el host de Office, que se monta con `ssr: false`.
 *
 * ESTE ARCHIVO ES GENERADO A PARTIR DEL REGISTRO. La prueba
 * `registro-office.test.ts` comprueba que las dos listas coinciden.
 */

import type { ComponenteOffice } from './registroOffice';

export const CARGADORES_OFFICE: Record<string, () => Promise<ComponenteOffice>> = {
  'of-word-la-cinta': async () =>
      (await import('./word/EntradaLaCinta')).EntradaLaCinta as unknown as ComponenteOffice,
  'of-word-parrafos-que-respiran': async () =>
      (await import('./word/parrafos-que-respiran/Entrada')).Entrada as unknown as ComponenteOffice,
  'of-word-guardar-e-imprimir': async () =>
      (await import('./word/guardar-e-imprimir/Entrada'))
        .EntradaGuardarEImprimir as unknown as ComponenteOffice,
  'of-word-estilos-e-indice': async () =>
      (await import('./word/estilos-e-indice/Entrada')).Entrada as unknown as ComponenteOffice,
  'of-word-revisa-y-comenta': async () =>
      (await import('./word/revisa-y-comenta/Entrada')).Entrada as unknown as ComponenteOffice,
  'of-word-busca-y-reemplaza': async () =>
      (await import('./word/busca-y-reemplaza/Entrada')).Entrada as unknown as ComponenteOffice,
  'of-word-correspondencia': async () =>
      (await import('./word/correspondencia/Entrada')).Entrada as unknown as ComponenteOffice,
  'of-word-plantillas': async () =>
      (await import('./word/plantillas/Entrada'))
        .EntradaPlantillas as unknown as ComponenteOffice,
  'of-word-formularios': async () =>
      (await import('./word/formularios/Entrada')).Entrada as unknown as ComponenteOffice,
  'of-word-coautoria': async () =>
      (await import('./word/coautoria/Entrada')).EntradaCoautoria as unknown as ComponenteOffice,
  'of-ppt-presenta-y-comparte': async () =>
      (await import('./powerpoint/presenta-y-comparte/Entrada'))
        .EntradaPresentaYComparte as unknown as ComponenteOffice,
  'of-ppt-ordena-el-mazo': async () =>
      (await import('./powerpoint/ordena-el-mazo/Entrada'))
        .EntradaOrdenaElMazo as unknown as ComponenteOffice,
  'of-ppt-smartart-y-graficos': async () =>
      (await import('./powerpoint/smartart-y-graficos/Entrada'))
        .EntradaSmartArtYGraficos as unknown as ComponenteOffice,
  'of-ppt-video-e-intervalos': async () =>
      (await import('./powerpoint/video-e-intervalos/Entrada'))
        .EntradaVideoEIntervalos as unknown as ComponenteOffice,
  'of-ppt-formas-y-cajas': async () =>
      (await import('./powerpoint/formas-y-cajas/Entrada'))
        .EntradaFormasYCajas as unknown as ComponenteOffice,
  'of-ppt-patron': async () =>
      (await import('./powerpoint/patron/Entrada')).EntradaPatron as unknown as ComponenteOffice,
  'of-ppt-interactiva': async () =>
      (await import('./powerpoint/interactiva/Entrada'))
        .EntradaInteractiva as unknown as ComponenteOffice,
  'of-ppt-revision': async () =>
      (await import('./powerpoint/revision/Entrada')).EntradaRevision as unknown as ComponenteOffice,
  'of-ppt-exporta-video': async () =>
      (await import('./powerpoint/exporta-video/Entrada'))
        .EntradaExportaVideo as unknown as ComponenteOffice,
  'of-ppt-en-papel': async () =>
      (await import('./powerpoint/en-papel/Entrada')).EntradaEnPapel as unknown as ComponenteOffice,
  'of-ppt-traela-hecha': async () =>
      (await import('./powerpoint/traela-hecha/Entrada'))
        .EntradaTraelaHecha as unknown as ComponenteOffice,
  'of-ppt-grabala': async () =>
      (await import('./powerpoint/grabala/Entrada')).EntradaGrabala as unknown as ComponenteOffice,
  'of-ppt-para-que-pantalla': async () =>
      (await import('./powerpoint/para-que-pantalla/Entrada'))
        .EntradaParaQuePantalla as unknown as ComponenteOffice,
  'of-excel-formato-de-celda': async () =>
      (await import('./excel/formato-de-celda/Entrada'))
        .EntradaFormatoDeCelda as unknown as ComponenteOffice,
  'of-excel-buscarx': async () =>
      (await import('./excel/buscarx/Entrada')).EntradaBuscarx as unknown as ComponenteOffice,
  'of-excel-tablas-y-filtros': async () =>
      (await import('./excel/tablas-y-filtros/Entrada'))
        .EntradaTablasYFiltros as unknown as ComponenteOffice,
  'of-excel-datos-limpios': async () =>
      (await import('./excel/datos-limpios/Entrada'))
        .EntradaDatosLimpios as unknown as ComponenteOffice,
  'of-excel-auditoria': async () => (await import('./excel/auditoria/Entrada')).EntradaAuditoria as unknown as ComponenteOffice,
  'of-excel-consolida-y-protege': async () =>
      (await import('./excel/consolida-y-protege/Entrada'))
        .EntradaConsolidaYProtege as unknown as ComponenteOffice,
  'of-excel-y-si': async () => (await import('./excel/y-si/Entrada')).EntradaYSi as unknown as ComponenteOffice,
  'of-excel-tabla-dinamica': async () =>
      (await import('./excel/tabla-dinamica/Entrada'))
        .EntradaTablaDinamica as unknown as ComponenteOffice,
  'of-excel-grafico-dinamico': async () =>
      (await import('./excel/grafico-dinamico/Entrada'))
        .EntradaGraficoDinamico as unknown as ComponenteOffice,
  'of-excel-validacion': async () =>
      (await import('./excel/validacion/Entrada')).EntradaValidacion as unknown as ComponenteOffice,
  'of-excel-macros': async () =>
      (await import('./excel/macros/Entrada')).EntradaMacros as unknown as ComponenteOffice,
  'of-excel-dashboard': async () =>
      (await import('./excel/dashboard/Entrada')).EntradaDashboard as unknown as ComponenteOffice,
  'of-m365-otra-caja': async () =>
      (await import('./m365/otra-caja/Entrada')).Entrada as unknown as ComponenteOffice,
  'of-m365-calendario': async () =>
      (await import('./m365/calendario/Entrada')).Entrada as unknown as ComponenteOffice,
  'of-m365-copiloto': async () =>
      (await import('./m365/copiloto/Entrada')).Entrada as unknown as ComponenteOffice,
};

/** El componente de una actividad, o `null` si el id no existe. */
export async function cargarOffice(id: string): Promise<ComponenteOffice | null> {
  const cargar = CARGADORES_OFFICE[id];
  return cargar ? cargar() : null;
}
