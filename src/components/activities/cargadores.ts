/**
 * Cargadores de actividad — los `import()` de las 197 actividades de nivel.
 *
 * Vivian dentro de `registry.ts`, junto a los metadatos, y eso tenia un precio
 * que no se veia: `registry.ts` lo importa tambien codigo de servidor (la
 * planeacion docente lee `meta` de aqui), asi que webpack compilaba las 197
 * actividades —y con ellas three.js, jsPDF, ProseMirror y recharts— TAMBIEN
 * para el servidor. En Cloudflare eso son megas dentro de un Worker que tiene
 * un techo duro de 10 MiB comprimido, cargando codigo de WebGL que en el
 * servidor no se ejecuta jamas: el host monta la actividad en un `useEffect`,
 * y los efectos no corren en el servidor.
 *
 * Con los cargadores aparte, lo unico que llega al servidor son los metadatos.
 * Este archivo lo alcanzan solo los dos hosts de actividad, que se cargan con
 * `ssr: false` (ver `HostActividadCliente.tsx`), y por eso su contenido no
 * entra en el paquete del servidor.
 *
 * ESTE ARCHIVO ES GENERADO A PARTIR DEL REGISTRO. Si anades una actividad,
 * anade aqui su cargador y su `meta` en `registry.ts`: la prueba
 * `registro-actividades.test.ts` comprueba que las dos listas coinciden.
 */

import type { ActividadComponente } from './registry';

export const CARGADORES: Record<string, () => Promise<ActividadComponente>> = {
  'n1-conoce-las-partes': async () =>
      (await import('./n1/mision/entradas')).ConoceLasPartes as unknown as ActividadComponente,
  'n1-dentro-del-gabinete': async () =>
      (await import('./n1/mision/entradas')).DentroDelGabinete as unknown as ActividadComponente,
  'n1-conecta-el-equipo': async () =>
      (await import('./n1/mision/entradas')).ConectaElEquipo as unknown as ActividadComponente,
  'n1-enciende-con-seguridad': async () =>
      (await import('./n1/mision/entradas')).EnciendeConSeguridad as unknown as ActividadComponente,
  'n1-explora-eduos': async () =>
      (await import('./n1/mision/entradas')).ExploraEduOS as unknown as ActividadComponente,
  'n1-caza-clics': async () =>
      (await import('./n1/arcade/EntradaCazaClics')).EntradaCazaClics as unknown as ActividadComponente,
  'n1-laberinto-del-mouse': async () =>
      (await import('./n1/arcade/EntradaLaberintoDelMouse')).EntradaLaberintoDelMouse as unknown as ActividadComponente,
  'n1-lluvia-de-letras': async () =>
      (await import('./n1/arcade/EntradaLluviaDeLetras')).EntradaLluviaDeLetras as unknown as ActividadComponente,
  'n1-teclas-gigantes': async () =>
      (await import('./n1/arcade/EntradaTeclasGigantes')).EntradaTeclasGigantes as unknown as ActividadComponente,
  'n1-mapa-de-flechas': async () =>
      (await import('./n1/arcade/EntradaMapaDeFlechas')).EntradaMapaDeFlechas as unknown as ActividadComponente,
  'n1-ordena-los-pasos': async () =>
      (await import('./n1/arcade/EntradaOrdenaLosPasos')).EntradaOrdenaLosPasos as unknown as ActividadComponente,
  'n1-sigue-el-patron': async () =>
      (await import('./n1/arcade/EntradaSigueElPatron')).EntradaSigueElPatron as unknown as ActividadComponente,
  'n1-quien-usa-que': async () =>
      (await import('./n1/arcade/EntradaQuienUsaQue')).EntradaQuienUsaQue as unknown as ActividadComponente,
  'n1-utiliza-programas': async () =>
      (await import('./n1/mision/entradas')).UtilizaProgramas as unknown as ActividadComponente,
  'n1-pinta-con-la-compu': async () =>
      (await import('./n1/arcade/EntradaPintaConLaCompu')).EntradaPintaConLaCompu as unknown as ActividadComponente,
  'n1-guarda-tu-obra': async () =>
      (await import('./n1/arcade/EntradaGuardaTuObra')).EntradaGuardaTuObra as unknown as ActividadComponente,
  'n1-semaforo-de-pantalla': async () =>
      (await import('./n1/arcade/EntradaSemaforoDePantalla')).EntradaSemaforoDePantalla as unknown as ActividadComponente,
  'n1-pide-ayuda': async () =>
      (await import('./n1/arcade/EntradaPideAyuda')).EntradaPideAyuda as unknown as ActividadComponente,
  'n1-mis-datos-son-un-tesoro': async () =>
      (await import('./n1/arcade/EntradaMisDatosSonUnTesoro')).EntradaMisDatosSonUnTesoro as unknown as ActividadComponente,
  'n1-mision-final': async () =>
      (await import('./n1/mision/entradas')).MisionFinal as unknown as ActividadComponente,
  'n2-safari-de-dispositivos': async () =>
      (await import('./n2/arcade/EntradaSafariDeDispositivos')).EntradaSafariDeDispositivos as unknown as ActividadComponente,
  'n2-entrada-o-salida': async () =>
      (await import('./n2/arcade/EntradaEntradaOSalida')).EntradaEntradaOSalida as unknown as ActividadComponente,
  'n2-donde-viven-mis-archivos': async () =>
      (await import('./n2/arcade/EntradaDondeVivenMisArchivos')).EntradaDondeVivenMisArchivos as unknown as ActividadComponente,
  'n2-explora-tu-teclado': async () =>
      (await import('./n2/arcade/EntradaExploraTuTeclado')).EntradaExploraTuTeclado as unknown as ActividadComponente,
  'n2-mayusculas-y-acentos': async () =>
      (await import('./n2/arcade/EntradaMayusculasYAcentos')).EntradaMayusculasYAcentos as unknown as ActividadComponente,
  'n2-escribe-a-dos-manos': async () =>
      (await import('./n2/arcade/EntradaEscribeADosManos')).EntradaEscribeADosManos as unknown as ActividadComponente,
  'n2-abre-y-cierra-ventanas': async () =>
      (await import('./n2/arcade/EntradaAbreYCierraVentanas')).EntradaAbreYCierraVentanas as unknown as ActividadComponente,
  'n2-guarda-y-encuentra': async () =>
      (await import('./n2/arcade/EntradaGuardaYEncuentra')).EntradaGuardaYEncuentra as unknown as ActividadComponente,
  'n2-laberinto-de-bloques': async () =>
      (await import('./n2/arcade/EntradaLaberintoDeBloques')).EntradaLaberintoDeBloques as unknown as ActividadComponente,
  'n2-caza-el-error': async () =>
      (await import('./n2/arcade/EntradaCazaElError')).EntradaCazaElError as unknown as ActividadComponente,
  'n2-repite-repite': async () =>
      (await import('./n2/arcade/EntradaRepiteRepite')).EntradaRepiteRepite as unknown as ActividadComponente,
  'n2-mis-primeras-oraciones': async () =>
      (await import('./n2/arcade/EntradaMisPrimerasOraciones'))
        .EntradaMisPrimerasOraciones as unknown as ActividadComponente,
  'n2-viste-tus-letras': async () =>
      (await import('./n2/arcade/EntradaVisteTusLetras')).EntradaVisteTusLetras as unknown as ActividadComponente,
  'n2-cuento-ilustrado': async () =>
      (await import('./n2/arcade/EntradaCuentoIlustrado')).EntradaCuentoIlustrado as unknown as ActividadComponente,
  'n2-secreto-o-publico': async () =>
      (await import('./n2/arcade/EntradaSecretoOPublico')).EntradaSecretoOPublico as unknown as ActividadComponente,
  'n2-con-quien-hablo': async () =>
      (await import('./n2/arcade/EntradaConQuienHablo')).EntradaConQuienHablo as unknown as ActividadComponente,
  'n2-heroes-del-respeto': async () =>
      (await import('./n2/arcade/EntradaHeroesDelRespeto')).EntradaHeroesDelRespeto as unknown as ActividadComponente,
  'n3-viaje-en-el-tiempo': async () =>
      (await import('./n3/arcade/EntradaViajeEnElTiempo')).EntradaViajeEnElTiempo as unknown as ActividadComponente,
  'n3-generaciones-de-compus': async () =>
      (await import('./n3/arcade/EntradaGeneracionesDeCompus'))
        .EntradaGeneracionesDeCompus as unknown as ActividadComponente,
  'n3-conoce-a-los-inventores': async () =>
      (await import('./n3/arcade/EntradaConoceALosInventores'))
        .EntradaConoceALosInventores as unknown as ActividadComponente,
  'n3-hardware-o-software': async () =>
      (await import('./n3/arcade/EntradaHardwareOSoftware'))
        .EntradaHardwareOSoftware as unknown as ActividadComponente,
  'n3-explora-el-escritorio': async () =>
      (await import('./n3/arcade/EntradaExploraElEscritorio'))
        .EntradaExploraElEscritorio as unknown as ActividadComponente,
  'n3-carpetas-y-atajos': async () =>
      (await import('./n3/arcade/EntradaCarpetasYAtajos'))
        .EntradaCarpetasYAtajos as unknown as ActividadComponente,
  'n3-que-es-internet': async () =>
      (await import('./n3/arcade/EntradaQueEsInternet'))
        .EntradaQueEsInternet as unknown as ActividadComponente,
  'n3-busca-con-palabras-clave': async () =>
      (await import('./n3/arcade/EntradaBuscaConPalabrasClave'))
        .EntradaBuscaConPalabrasClave as unknown as ActividadComponente,
  'n3-detector-de-sitios-confiables': async () =>
      (await import('./n3/arcade/EntradaDetectorDeSitiosConfiables'))
        .EntradaDetectorDeSitiosConfiables as unknown as ActividadComponente,
  'n3-netiqueta-y-contrasenas': async () =>
      (await import('./n3/arcade/EntradaNetiquetaYContrasenas'))
        .EntradaNetiquetaYContrasenas as unknown as ActividadComponente,
  'n3-conoce-scratch': async () =>
      (await import('./n3/arcade/EntradaConoceScratch'))
        .EntradaConoceScratch as unknown as ActividadComponente,
  'n3-eventos-y-movimiento': async () =>
      (await import('./n3/arcade/EntradaEventosYMovimiento'))
        .EntradaEventosYMovimiento as unknown as ActividadComponente,
  'n3-mi-primera-animacion': async () =>
      (await import('./n3/arcade/EntradaMiPrimeraAnimacion'))
        .EntradaMiPrimeraAnimacion as unknown as ActividadComponente,
  'n3-dale-formato': async () =>
      (await import('./n3/arcade/EntradaDaleFormato'))
        .EntradaDaleFormato as unknown as ActividadComponente,
  'n3-ortografia-e-imagenes': async () =>
      (await import('./n3/arcade/EntradaOrtografiaEImagenes'))
        .EntradaOrtografiaEImagenes as unknown as ActividadComponente,
  'n3-la-fila-guia': async () =>
      (await import('./n3/arcade/EntradaLaFilaGuia'))
        .EntradaLaFilaGuia as unknown as ActividadComponente,
  'n3-la-ia-en-mi-dia': async () =>
      (await import('./n3/arcade/EntradaLaIaEnMiDia'))
        .EntradaLaIaEnMiDia as unknown as ActividadComponente,
  'n3-piensan-las-maquinas': async () =>
      (await import('./n3/arcade/EntradaPiensanLasMaquinas'))
        .EntradaPiensanLasMaquinas as unknown as ActividadComponente,
  'n3-la-ia-se-equivoca': async () =>
      (await import('./n3/arcade/EntradaLaIaSeEquivoca'))
        .EntradaLaIaSeEquivoca as unknown as ActividadComponente,
  'n4-el-viaje-de-un-mensaje': async () =>
      (await import('./n4/estudio/EntradaElViajeDeUnMensaje'))
        .EntradaElViajeDeUnMensaje as unknown as ActividadComponente,
  'n4-busca-y-compara': async () =>
      (await import('./n4/estudio/EntradaBuscaYCompara'))
        .EntradaBuscaYCompara as unknown as ActividadComponente,
  'n4-que-es-la-nube': async () =>
      (await import('./n4/estudio/EntradaQueEsLaNube'))
        .EntradaQueEsLaNube as unknown as ActividadComponente,
  'n4-mi-primera-cuenta': async () =>
      (await import('./n4/estudio/EntradaMiPrimeraCuenta'))
        .EntradaMiPrimeraCuenta as unknown as ActividadComponente,
  'n4-partes-del-correo': async () =>
      (await import('./n4/estudio/EntradaPartesDelCorreo'))
        .EntradaPartesDelCorreo as unknown as ActividadComponente,
  'n4-envia-responde-adjunta': async () =>
      (await import('./n4/estudio/EntradaEnviaRespondeAdjunta'))
        .EntradaEnviaRespondeAdjunta as unknown as ActividadComponente,
  'n4-videollamadas-con-respeto': async () =>
      (await import('./n4/estudio/EntradaVideollamadasConRespeto'))
        .EntradaVideollamadasConRespeto as unknown as ActividadComponente,
  'n4-si-pasa-esto': async () =>
      (await import('./n4/estudio/EntradaSiPasaEsto'))
        .EntradaSiPasaEsto as unknown as ActividadComponente,
  'n4-variables-y-puntajes': async () =>
      (await import('./n4/estudio/EntradaVariablesYPuntajes'))
        .EntradaVariablesYPuntajes as unknown as ActividadComponente,
  'n4-crea-tu-videojuego': async () =>
      (await import('./n4/estudio/EntradaCreaTuVideojuego'))
        .EntradaCreaTuVideojuego as unknown as ActividadComponente,
  'n4-depura-tu-juego': async () =>
      (await import('./n4/estudio/EntradaDepuraTuJuego'))
        .EntradaDepuraTuJuego as unknown as ActividadComponente,
  'n4-tablas-y-columnas': async () =>
      (await import('./n4/estudio/EntradaTablasYColumnas'))
        .EntradaTablasYColumnas as unknown as ActividadComponente,
  'n4-formas-y-wordart': async () =>
      (await import('./n4/estudio/EntradaFormasYWordArt'))
        .EntradaFormasYWordArt as unknown as ActividadComponente,
  'n4-documento-de-varias-paginas': async () =>
      (await import('./office/word/n4-varias-paginas/Entrada'))
        .EntradaVariasPaginas as unknown as ActividadComponente,
  'n4-tus-primeras-diapositivas': async () =>
      (await import('./office/powerpoint/EntradaTusPrimerasDiapositivas'))
        .EntradaTusPrimerasDiapositivas as unknown as ActividadComponente,
  'n4-imagenes-y-texto': async () =>
      (await import('./office/powerpoint/EntradaImagenesYTexto'))
        .EntradaImagenesYTexto as unknown as ActividadComponente,
  'n4-presenta-al-grupo': async () =>
      (await import('./office/powerpoint/EntradaPresentaAlGrupo'))
        .EntradaPresentaAlGrupo as unknown as ActividadComponente,
  'n4-virus-y-antivirus': async () =>
      (await import('./n4/estudio/EntradaVirusYAntivirus'))
        .EntradaVirusYAntivirus as unknown as ActividadComponente,
  'n4-atrapa-el-phishing': async () =>
      (await import('./n4/estudio/EntradaAtrapaElPhishing'))
        .EntradaAtrapaElPhishing as unknown as ActividadComponente,
  'n4-si-algo-me-incomoda': async () =>
      (await import('./n4/estudio/EntradaSiAlgoMeIncomoda'))
        .EntradaSiAlgoMeIncomoda as unknown as ActividadComponente,
  'n4-pregunta-a-la-ia': async () =>
      (await import('./n4/estudio/EntradaPreguntaALaIA'))
        .EntradaPreguntaALaIA as unknown as ActividadComponente,
  'n4-comprueba-la-respuesta': async () =>
      (await import('./n4/estudio/EntradaCompruebaLaRespuesta'))
        .EntradaCompruebaLaRespuesta as unknown as ActividadComponente,
  'n4-real-o-generado': async () =>
      (await import('./n4/estudio/EntradaRealOGenerado'))
        .EntradaRealOGenerado as unknown as ActividadComponente,
  'n5-el-cerebro-de-la-compu': async () =>
      (await import('./n5/estudio/EntradaElCerebroDeLaCompu'))
        .EntradaElCerebroDeLaCompu as unknown as ActividadComponente,
  'n5-nube-o-local': async () =>
      (await import('./n5/estudio/EntradaNubeOLocal'))
        .EntradaNubeOLocal as unknown as ActividadComponente,
  'n5-celdas-filas-columnas': async () =>
      (await import('./office/excel/celdas-filas-columnas/Entrada'))
        .EntradaCeldasFilasColumnas as unknown as ActividadComponente,
  'n5-captura-y-ordena': async () =>
      (await import('./office/excel/captura-y-ordena/Entrada'))
        .EntradaCapturaYOrdena as unknown as ActividadComponente,
  'n5-tus-primeras-formulas': async () =>
      (await import('./office/excel/tus-primeras-formulas/Entrada'))
        .EntradaTusPrimerasFormulas as unknown as ActividadComponente,
  'n5-mi-primera-grafica': async () =>
      (await import('./office/excel/mi-primera-grafica/Entrada'))
        .EntradaMiPrimeraGrafica as unknown as ActividadComponente,
  'n5-transiciones-con-proposito': async () =>
      (await import('./office/powerpoint/EntradaTransicionesConProposito'))
        .EntradaTransicionesConProposito as unknown as ActividadComponente,
  'n5-audio-e-imagenes': async () =>
      (await import('./office/powerpoint/EntradaAudioEImagenes'))
        .EntradaAudioEImagenes as unknown as ActividadComponente,
  'n5-la-buena-diapositiva': async () =>
      (await import('./office/powerpoint/EntradaLaBuenaDiapositiva'))
        .EntradaLaBuenaDiapositiva as unknown as ActividadComponente,
  'n5-lo-que-publico-permanece': async () =>
      (await import('./n5/estudio/EntradaLoQuePublicoPermanece'))
        .EntradaLoQuePublicoPermanece as unknown as ActividadComponente,
  'n5-mi-identidad-digital': async () =>
      (await import('./n5/estudio/EntradaMiIdentidadDigital'))
        .EntradaMiIdentidadDigital as unknown as ActividadComponente,
  'n5-documentos-compartidos': async () =>
      (await import('./n5/estudio/EntradaDocumentosCompartidos'))
        .EntradaDocumentosCompartidos as unknown as ActividadComponente,
  'n5-la-ia-en-mi-vida': async () =>
      (await import('./ia/EntradaLaIaEnMiVida'))
        .EntradaLaIaEnMiVida as unknown as ActividadComponente,
  'n5-la-ia-aprende-con-datos': async () =>
      (await import('./ia/EntradaLaIaAprendeConDatos'))
        .EntradaLaIaAprendeConDatos as unknown as ActividadComponente,
  'n5-uso-responsable-de-ia': async () =>
      (await import('./ia/EntradaUsoResponsableDeIa'))
        .EntradaUsoResponsableDeIa as unknown as ActividadComponente,
  'n7-como-aprende-la-ia': async () =>
      (await import('./ia/EntradaComoAprendeLaIa'))
        .EntradaComoAprendeLaIa as unknown as ActividadComponente,
  'n7-buenos-prompts': async () =>
      (await import('./ia/EntradaBuenosPrompts'))
        .EntradaBuenosPrompts as unknown as ActividadComponente,
  'n7-verifica-a-la-ia': async () =>
      (await import('./ia/EntradaVerificaALaIa'))
        .EntradaVerificaALaIa as unknown as ActividadComponente,
  'n8-genera-con-ia': async () =>
      (await import('./ia/EntradaGeneraConIa')).EntradaGeneraConIa as unknown as ActividadComponente,
  'n8-sesgos-y-errores': async () =>
      (await import('./ia/EntradaSesgosYErrores')).EntradaSesgosYErrores as unknown as ActividadComponente,
  'n9-ia-copiloto': async () =>
      (await import('./ia/EntradaIaCopiloto')).EntradaIaCopiloto as unknown as ActividadComponente,
  'n9-ia-y-trabajo': async () =>
      (await import('./ia/EntradaIaYTrabajo')).EntradaIaYTrabajo as unknown as ActividadComponente,
  'n9-proyecto-integrador': async () =>
      (await import('./n9/integrador/EntradaProyectoIntegrador'))
        .EntradaProyectoIntegrador as unknown as ActividadComponente,
  'n8-etica-de-la-ia': async () =>
      (await import('./ia/EntradaEticaDeLaIa')).EntradaEticaDeLaIa as unknown as ActividadComponente,
  'n6-primeras-lineas-python': async () =>
      (await import('./python/EntradaPrimerasLineasPython'))
        .EntradaPrimerasLineasPython as unknown as ActividadComponente,
  'n6-bloques-vs-codigo': async () =>
      (await import('./bloques/EntradaBloquesVsCodigo'))
        .EntradaBloquesVsCodigo as unknown as ActividadComponente,
  'n7-variables-y-tipos': async () =>
      (await import('./python/EntradaVariablesYTipos'))
        .EntradaVariablesYTipos as unknown as ActividadComponente,
  'n7-entrada-y-salida': async () =>
      (await import('./python/EntradaEntradaYSalida'))
        .EntradaEntradaYSalida as unknown as ActividadComponente,
  'n7-condicionales-python': async () =>
      (await import('./python/EntradaCondicionales'))
        .EntradaCondicionales as unknown as ActividadComponente,
  'n7-bucles-python': async () =>
      (await import('./python/EntradaBucles')).EntradaBucles as unknown as ActividadComponente,
  'n7-retos-python': async () =>
      (await import('./python/EntradaRetosPython'))
        .EntradaRetosPython as unknown as ActividadComponente,
  'n8-listas-y-diccionarios': async () =>
      (await import('./n8/python/EntradaListasYDiccionarios'))
        .EntradaListasYDiccionarios as unknown as ActividadComponente,
  'n8-funciones-python': async () =>
      (await import('./n8/python/EntradaFunciones')).EntradaFunciones as unknown as ActividadComponente,
  'n8-proyectos-consola': async () =>
      (await import('./n8/python/EntradaProyectosConsola'))
        .EntradaProyectosConsola as unknown as ActividadComponente,
  'n8-buenas-practicas': async () =>
      (await import('./n8/python/EntradaBuenasPracticas'))
        .EntradaBuenasPracticas as unknown as ActividadComponente,
  'n6-que-es-un-robot': async () =>
      (await import('./lab3d/EntradaQueEsUnRobot'))
        .EntradaQueEsUnRobot as unknown as ActividadComponente,
  'n6-programa-un-microbit': async () =>
      (await import('./bloques/EntradaProgramaUnMicrobit'))
        .EntradaProgramaUnMicrobit as unknown as ActividadComponente,
  'n6-reto-robot': async () =>
      (await import('./bloques/EntradaRetoRobot'))
        .EntradaRetoRobot as unknown as ActividadComponente,
  'n5-bloques-propios': async () =>
      (await import('./bloques/EntradaBloquesPropios'))
        .EntradaBloquesPropios as unknown as ActividadComponente,
  'n5-juego-con-niveles': async () =>
      (await import('./bloques/EntradaJuegoConNiveles'))
        .EntradaJuegoConNiveles as unknown as ActividadComponente,
  'n9-automatiza-tareas': async () =>
      (await import('./bloques/EntradaAutomatizaTareas'))
        .EntradaAutomatizaTareas as unknown as ActividadComponente,
  'n7-dentro-del-gabinete': async () =>
      (await import('./n7/bahia/EntradaDentroDelGabinete'))
        .EntradaDentroDelGabinete as unknown as ActividadComponente,
  'n7-binario-y-unidades': async () =>
      (await import('./n7/binario/EntradaBinarioYUnidades'))
        .EntradaBinarioYUnidades as unknown as ActividadComponente,
  'n7-sistemas-operativos': async () =>
      (await import('./n7/sistemas/EntradaSistemasOperativos'))
        .EntradaSistemasOperativos as unknown as ActividadComponente,
  'n7-referencias': async () =>
      (await import('./office/excel/referencias/Entrada'))
        .EntradaReferencias as unknown as ActividadComponente,
  'n7-funcion-si': async () =>
      (await import('./office/excel/funcion-si/Entrada'))
        .EntradaFuncionSi as unknown as ActividadComponente,
  'n6-funciones-esenciales': async () =>
      (await import('./office/excel/funciones-esenciales/Entrada'))
        .EntradaFuncionesEsenciales as unknown as ActividadComponente,
  'n6-elige-la-grafica': async () =>
      (await import('./office/excel/elige-la-grafica/Entrada'))
        .EntradaEligeLaGrafica as unknown as ActividadComponente,
  'n7-formato-condicional': async () =>
      (await import('./office/excel/formato-condicional/Entrada'))
        .EntradaFormatoCondicional as unknown as ActividadComponente,
  'n7-datos-reales': async () =>
      (await import('./office/excel/datos-reales/Entrada'))
        .EntradaDatosReales as unknown as ActividadComponente,
  'n6-interpreta-la-informacion': async () =>
      (await import('./office/excel/interpreta-la-informacion/Entrada'))
        .EntradaInterpretaLaInformacion as unknown as ActividadComponente,
  'n8-limpieza-de-datos': async () =>
      (await import('./office/excel/limpieza-de-datos/Entrada'))
        .EntradaLimpiezaDeDatos as unknown as ActividadComponente,
  'n8-tablas-dinamicas': async () =>
      (await import('./office/excel/tablas-dinamicas/Entrada'))
        .EntradaTablasDinamicas as unknown as ActividadComponente,
  'n8-visualizacion-efectiva': async () =>
      (await import('./office/excel/visualizacion-efectiva/Entrada'))
        .EntradaVisualizacionEfectiva as unknown as ActividadComponente,
  'n8-concluye-con-datos': async () =>
      (await import('./office/excel/concluye-con-datos/Entrada'))
        .EntradaConcluyeConDatos as unknown as ActividadComponente,
  'n10-portafolio-y-cv': async () =>
      (await import('./office/word/portafolio-y-cv/Entrada'))
        .EntradaPortafolioYCv as unknown as ActividadComponente,
  'n10-carreras-y-certificaciones': async () =>
      (await import('./n10/carreras-certificaciones/EntradaCarrerasCertificaciones'))
        .EntradaCarrerasCertificaciones as unknown as ActividadComponente,
  'n10-capstone': async () =>
      (await import('./n10/capstone/EntradaCapstone'))
        .EntradaCapstone as unknown as ActividadComponente,
  'n6-como-se-hace-una-pagina': async () =>
      (await import('./n6/web/EntradaComoSeHaceUnaPagina'))
        .EntradaComoSeHaceUnaPagina as unknown as ActividadComponente,
  'n6-html-basico': async () =>
      (await import('./n6/web/EntradaHtmlBasico')).EntradaHtmlBasico as unknown as ActividadComponente,
  'n6-publica-tu-pagina': async () =>
      (await import('./n6/web/EntradaPublicaTuPagina')).EntradaPublicaTuPagina as unknown as ActividadComponente,
  'n7-html-estructura': async () =>
      (await import('./n7/web/EntradaHtmlEstructura')).EntradaHtmlEstructura as unknown as ActividadComponente,
  'n7-css-estilo': async () =>
      (await import('./n7/web/EntradaCssEstilo')).EntradaCssEstilo as unknown as ActividadComponente,
  'n7-tu-sitio-personal': async () =>
      (await import('./n7/web/EntradaTuSitioPersonal')).EntradaTuSitioPersonal as unknown as ActividadComponente,
  'n8-css-responsivo': async () =>
      (await import('./n8/web/EntradaCssResponsivo')).EntradaCssResponsivo as unknown as ActividadComponente,
  'n8-javascript-basico': async () =>
      (await import('./n8/web/EntradaJavascriptBasico')).EntradaJavascriptBasico as unknown as ActividadComponente,
  'n8-disena-tu-videojuego': async () =>
      (await import('./n8/videojuegos/EntradaDisenaTuVideojuego')).EntradaDisenaTuVideojuego as unknown as ActividadComponente,
  'n8-video-y-audio': async () =>
      (await import('./n8/multimedia/EntradaVideoYAudio')).EntradaVideoYAudio as unknown as ActividadComponente,
  'n8-derechos-y-licencias': async () =>
      (await import('./n8/multimedia/EntradaDerechosYLicencias')).EntradaDerechosYLicencias as unknown as ActividadComponente,
  'n8-sitio-multipagina': async () =>
      (await import('./n8/web/EntradaSitioMultipagina')).EntradaSitioMultipagina as unknown as ActividadComponente,
  'n9-casa-inteligente': async () =>
      (await import('./n9/robotica/EntradaCasaInteligente')).EntradaCasaInteligente as unknown as ActividadComponente,
  'n9-sensores-iot': async () =>
      (await import('./n9/robotica/EntradaSensoresIot')).EntradaSensoresIot as unknown as ActividadComponente,
  'n9-automatiza-un-espacio': async () =>
      (await import('./n9/robotica/EntradaAutomatizaUnEspacio'))
        .EntradaAutomatizaUnEspacio as unknown as ActividadComponente,
  'n10-proyecto-web-real': async () =>
      (await import('./n10/web/EntradaProyectoWebReal')).EntradaProyectoWebReal as unknown as ActividadComponente,
  'n10-publica-tu-sitio': async () =>
      (await import('./n10/web-publicacion/EntradaPublicaTuSitio'))
        .EntradaPublicaTuSitio as unknown as ActividadComponente,
  'n10-ux-ui': async () =>
      (await import('./n10/web-ux/EntradaUxUi')).EntradaUxUi as unknown as ActividadComponente,
  'n10-amenazas-y-defensa': async () =>
      (await import('./n10/ciberseguridad/EntradaAmenazasYDefensa')).EntradaAmenazasYDefensa as unknown as ActividadComponente,
  'n10-identidad-y-cifrado': async () =>
      (await import('./n10/ciber-identidad/EntradaIdentidadYCifrado'))
        .EntradaIdentidadYCifrado as unknown as ActividadComponente,
  'n10-carreras-ciber': async () =>
      (await import('./n10/ciber-carreras/EntradaCarrerasCiber'))
        .EntradaCarrerasCiber as unknown as ActividadComponente,
  'n6-carteles-e-infografias': async () =>
      (await import('./diseno/EntradaCartelesEInfografias')).EntradaCartelesEInfografias as unknown as ActividadComponente,
  'n6-crea-con-ia': async () =>
      (await import('./ia/EntradaCreaConIa')).EntradaCreaConIa as unknown as ActividadComponente,
  'n6-edita-imagen-y-video': async () =>
      (await import('./diseno/EntradaEditaImagenYVideo'))
        .EntradaEditaImagenYVideo as unknown as ActividadComponente,
  'n8-imagen-con-capas': async () =>
      (await import('./diseno/EntradaImagenConCapas')).EntradaImagenConCapas as unknown as ActividadComponente,
  'n9-boceta-tu-app': async () =>
      (await import('./diseno/EntradaBocetaTuApp')).EntradaBocetaTuApp as unknown as ActividadComponente,
  'n9-construye-low-code': async () =>
      (await import('./diseno/EntradaConstruyeLowCode')).EntradaConstruyeLowCode as unknown as ActividadComponente,
  'n9-pruebas-con-usuarios': async () =>
      (await import('./diseno/EntradaPruebasConUsuarios')).EntradaPruebasConUsuarios as unknown as ActividadComponente,
  'n5-planea-tu-proyecto': async () =>
      (await import('./diseno/EntradaPlaneaTuProyecto')).EntradaPlaneaTuProyecto as unknown as ActividadComponente,
  'n5-conecta-perifericos': async () =>
      (await import('./lab3d/EntradaConectaPerifericos'))
        .EntradaConectaPerifericos as unknown as ActividadComponente,
  'n5-manos-al-mantenimiento': async () =>
      (await import('./lab3d/EntradaManosAlMantenimiento'))
        .EntradaManosAlMantenimiento as unknown as ActividadComponente,
  'n7-diagnostica-y-soluciona': async () =>
      (await import('./lab3d/EntradaDiagnosticaYSoluciona'))
        .EntradaDiagnosticaYSoluciona as unknown as ActividadComponente,
  'n6-privacidad-en-juegos': async () =>
      (await import('./n6/ciberseguridad/EntradaPrivacidadEnJuegos'))
        .EntradaPrivacidadEnJuegos as unknown as ActividadComponente,
  'n6-alto-al-ciberacoso': async () =>
      (await import('./n6/ciberseguridad/EntradaAltoAlCiberacoso'))
        .EntradaAltoAlCiberacoso as unknown as ActividadComponente,
  'n6-contrasenas-fuertes': async () =>
      (await import('./n6/ciberseguridad/EntradaContrasenasFuertes'))
        .EntradaContrasenasFuertes as unknown as ActividadComponente,
  'n6-proyecto-integrador': async () =>
      (await import('./n6/proyecto-integrador/EntradaProyectoIntegrador'))
        .EntradaProyectoIntegrador as unknown as ActividadComponente,
  'n7-privacidad-en-redes': async () =>
      (await import('./n7/situacion/EntradaPrivacidadEnRedes'))
        .EntradaPrivacidadEnRedes as unknown as ActividadComponente,
  'n7-riesgos-y-marco-legal': async () =>
      (await import('./n7/situacion/EntradaRiesgosYMarcoLegal'))
        .EntradaRiesgosYMarcoLegal as unknown as ActividadComponente,
  'n7-equilibrio-digital': async () =>
      (await import('./n7/situacion/EntradaEquilibrioDigital'))
        .EntradaEquilibrioDigital as unknown as ActividadComponente,
  'n8-malware-e-ingenieria-social': async () =>
      (await import('./n8/ciberseguridad/EntradaMalwareEIngenieriaSocial'))
        .EntradaMalwareEIngenieriaSocial as unknown as ActividadComponente,
  'n8-ip-wifi-servidores': async () =>
      (await import('./n8/ciberseguridad/EntradaIpWifiServidores'))
        .EntradaIpWifiServidores as unknown as ActividadComponente,
  'n8-cifrado-basico': async () =>
      (await import('./n8/ciberseguridad/EntradaCifradoBasico'))
        .EntradaCifradoBasico as unknown as ActividadComponente,
  'n8-habitos-de-proteccion': async () =>
      (await import('./n8/ciberseguridad/EntradaHabitosDeProteccion'))
        .EntradaHabitosDeProteccion as unknown as ActividadComponente,
  'n9-gestiona-tu-proyecto': async () =>
      (await import('./n9/colaboracion/EntradaGestionaTuProyecto'))
        .EntradaGestionaTuProyecto as unknown as ActividadComponente,
  'n9-trabajo-colaborativo': async () =>
      (await import('./n9/colaboracion/EntradaTrabajoColaborativo'))
        .EntradaTrabajoColaborativo as unknown as ActividadComponente,
  'n9-marca-personal': async () =>
      (await import('./n9/emprendimiento/EntradaMarcaPersonal')).EntradaMarcaPersonal as unknown as ActividadComponente,
  'n9-ecommerce-y-marketing': async () =>
      (await import('./n9/emprendimiento/EntradaEcommerceYMarketing'))
        .EntradaEcommerceYMarketing as unknown as ActividadComponente,
  'n9-empleos-tecnologicos': async () =>
      (await import('./n9/emprendimiento/EntradaEmpleosTecnologicos'))
        .EntradaEmpleosTecnologicos as unknown as ActividadComponente,
  'n9-bases-de-datos-iniciales': async () =>
      (await import('./datos/EntradaBasesDeDatosIniciales'))
        .EntradaBasesDeDatosIniciales as unknown as ActividadComponente,
  'n9-busqueda-y-ordenamiento': async () =>
      (await import('./datos/EntradaBusquedaYOrdenamiento'))
        .EntradaBusquedaYOrdenamiento as unknown as ActividadComponente,
  'n9-datos-con-python': async () =>
      (await import('./datos/EntradaDatosConPython')).EntradaDatosConPython as unknown as ActividadComponente,
  'n10-modela-tus-datos': async () =>
      (await import('./datos/EntradaModelaTusDatos'))
        .EntradaModelaTusDatos as unknown as ActividadComponente,
  'n10-consultas-sql': async () =>
      (await import('./datos/EntradaConsultasSql'))
        .EntradaConsultasSql as unknown as ActividadComponente,
  'n10-conecta-tus-datos': async () =>
      (await import('./n10/datos/EntradaConectaTusDatos'))
        .EntradaConectaTusDatos as unknown as ActividadComponente,
  'n10-python-intermedio': async () =>
      (await import('./n10/python-intermedio/EntradaPythonIntermedio'))
        .EntradaPythonIntermedio as unknown as ActividadComponente,
  'n10-problemas-de-concurso': async () =>
      (await import('./n10/problemas-de-concurso/EntradaProblemasDeConcurso'))
        .EntradaProblemasDeConcurso as unknown as ActividadComponente,
  'n10-analisis-con-codigo': async () =>
      (await import('./n10/analisis-con-codigo/EntradaAnalisisConCodigo'))
        .EntradaAnalisisConCodigo as unknown as ActividadComponente,
  'n10-como-funcionan-los-modelos': async () =>
      (await import('./n10/ia-modelos/EntradaComoFuncionanLosModelos'))
        .EntradaComoFuncionanLosModelos as unknown as ActividadComponente,
  'n10-flujos-con-ia': async () =>
      (await import('./n10/ia-flujos/EntradaFlujosConIa'))
        .EntradaFlujosConIa as unknown as ActividadComponente,
  'n10-etica-y-regulacion': async () =>
      (await import('./n10/ia-etica/EntradaEticaYRegulacion'))
        .EntradaEticaYRegulacion as unknown as ActividadComponente,
};

/** El componente de una actividad, o `null` si el id no existe. */
export async function cargarActividad(id: string): Promise<ActividadComponente | null> {
  const cargar = CARGADORES[id];
  return cargar ? cargar() : null;
}
