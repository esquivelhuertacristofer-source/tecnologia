/**
 * Identificador de una frase de Bit (cyrb53, 14 dígitos hex). Lo calculan igual el extractor de frases,
 * que genera el audio con Qwen3-TTS, y `decir()`, que lo busca: si cambia una sola letra de la frase,
 * el hash cambia y Bit cae a la voz del navegador en vez de leer un audio que ya no corresponde.
 */
export function hashVoz(mensaje: string): string {
  const t = mensaje.replace(/\s+/g, ' ').trim();
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < t.length; i++) {
    const c = t.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
}
