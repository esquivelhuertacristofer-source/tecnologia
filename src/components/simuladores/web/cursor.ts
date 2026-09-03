/**
 * Tecnia Web · `cursor.ts` — un dedo sobre el texto que sabe en qué línea va.
 *
 * Lo comparten el léxico de HTML y el de CSS porque **el número de línea es la
 * mitad del valor de este armazón**: un error sin línea manda al alumno a
 * leerse el archivo entero. Tenerlo escrito dos veces era tenerlo mal una vez.
 *
 * La columna no se guarda: se calcula restando el principio de la línea, que
 * es un número que ya se lleva. Y el avance cuenta los saltos de línea uno a
 * uno en vez de buscarlos después con una expresión regular, porque el coste
 * de todo el recorrido es una pasada y así no hay una segunda.
 */

export class Cursor {
  i = 0;
  linea = 1;
  private inicioLinea = 0;

  constructor(readonly texto: string) {}

  get col(): number {
    return this.i - this.inicioLinea + 1;
  }

  get fin(): boolean {
    return this.i >= this.texto.length;
  }

  ver(desplazamiento = 0): string {
    return this.texto[this.i + desplazamiento] ?? '';
  }

  avanzar(n = 1): void {
    for (let k = 0; k < n && this.i < this.texto.length; k += 1) {
      if (this.texto[this.i] === '\n') {
        this.linea += 1;
        this.inicioLinea = this.i + 1;
      }
      this.i += 1;
    }
  }

  /** Avanza hasta la posición dada, contando los saltos de línea del camino. */
  saltarHasta(posicion: number): void {
    this.avanzar(Math.max(0, posicion - this.i));
  }

  saltarEspacios(): void {
    while (!this.fin) {
      const c = this.texto[this.i];
      if (c !== ' ' && c !== '\t' && c !== '\n' && c !== '\r' && c !== '\f') break;
      this.avanzar();
    }
  }
}
