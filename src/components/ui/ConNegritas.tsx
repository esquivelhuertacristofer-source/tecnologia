/**
 * Un texto **con sus negritas puestas**.
 *
 * ── SALIÓ MIRANDO UNA CAPTURA, Y LLEVABA DIECISÉIS CLASES AHÍ ───────────────
 *
 * Los guiones escriben lo importante entre asteriscos dobles desde la primera
 * clase de PowerPoint —«a eso se le llama **documento**»— y el panel lo pintaba
 * tal cual, con los asteriscos a la vista. Nadie lo había visto porque nunca se
 * había mirado una captura del panel en el momento del acierto: es el instante
 * en que el alumno ya pulsó bien y la atención está en la diapositiva.
 *
 * Vivía en `office/chrome/piezas.tsx` hasta que §44.6 encontró el mismo defecto
 * una puerta más atrás: **veintiuna entradas** escriben sus fichas con
 * asteriscos dobles y ninguna los pintaba, así que el alumno veía los
 * asteriscos antes incluso de entrar al laboratorio. Bajó aquí porque la
 * entrada de una actividad no es una pieza de Office, y una segunda copia de
 * cuatro líneas es una segunda copia que un día se porta distinto.
 *
 * Deliberadamente **sólo negrita**. No es un motor de Markdown: es la única
 * marca que los guiones usan, y añadir cursivas o enlaces sería construir para
 * un uso que no existe. Sin `dangerouslySetInnerHTML`: se parte y se alterna,
 * así que un guion no puede inyectar etiquetas ni por descuido.
 */
export function ConNegritas({ texto }: { texto: string }) {
  return (
    <>
      {texto.split('**').map((trozo, i) =>
        // Los impares son lo que iba entre asteriscos. Un asterisco doble suelto
        // —sin pareja— deja su trozo en par y se pinta normal, que es lo que hay
        // que hacer con un guion mal escrito: enseñarlo, no romperse.
        i % 2 ? <b key={i}>{trozo}</b> : <span key={i}>{trozo}</span>,
      )}
    </>
  );
}

export default ConNegritas;
