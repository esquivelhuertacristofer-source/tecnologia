import { hashVoz } from '@/lib/voz-bit/hash';

// El extractor de frases (Node) y decir() (navegador) deben calcular el mismo hash: este valor se sacó con el extractor.
it('el hash de una frase conocida coincide con el del extractor', () => {
  expect(hashVoz('Hola, soy Bit. Vamos a encender la computadora y conocer sus partes.')).toBe('1b2be8ab2a8525');
});
