import fs from 'node:fs';
import path from 'node:path';
import { hashVoz } from '@/lib/voz-bit/hash';
import manifiesto from '@/lib/voz-bit/manifiesto.json';

describe('voz pregrabada de Bit', () => {
  it('el hash ignora espacios de más y distingue una letra distinta', () => {
    expect(hashVoz('Hola,   soy Bit. ')).toBe(hashVoz('Hola, soy Bit.'));
    expect(hashVoz('Hola, soy Bit.')).not.toBe(hashVoz('Hola, soy Bit!'));
    expect(hashVoz('Hola, soy Bit.')).toMatch(/^[0-9a-f]{14}$/);
  });

  it('cada frase del manifiesto tiene su mp3 en public/assets/voz', () => {
    const faltan = (manifiesto as string[]).filter((h) => !fs.existsSync(path.join(process.cwd(), 'public', 'assets', 'voz', `${h}.mp3`)) && !fs.existsSync(path.join(process.cwd(), '.medios', 'assets', 'voz', `${h}.mp3`)));
    expect(faltan).toEqual([]);
  });
});
