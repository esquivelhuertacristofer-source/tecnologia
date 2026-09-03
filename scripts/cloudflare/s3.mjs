/**
 * Firma de peticiones S3 (AWS Signature V4) para hablar con R2.
 *
 * POR QUÉ ESTO Y NO LA API DE CLOUDFLARE. Un token de R2 del tipo «Object Read
 * & Write» —el que hay que usar, porque el de Admin puede borrar buckets
 * enteros de toda la cuenta— **no vale para la API REST de Cloudflare**: se
 * midió, y `/accounts/…/r2/buckets` responde 403 y
 * `/accounts/…/r2/buckets/<b>/objects/<k>` responde 401. Ese token es una
 * credencial de S3 y nada más: sólo entiende el endpoint
 * `https://<cuenta>.r2.cloudflarestorage.com`.
 *
 * POR QUÉ A MANO Y NO CON EL SDK DE AWS. `@aws-sdk/client-s3` son ~20 MB en
 * `node_modules` para dos operaciones (subir un objeto y listar el bucket).
 * SigV4 son cuarenta líneas y no envejece.
 */
import crypto from 'node:crypto';

const sha256 = (d) => crypto.createHash('sha256').update(d).digest('hex');
const hmac = (clave, dato) => crypto.createHmac('sha256', clave).update(dato).digest();

/**
 * AWS exige que la ruta vaya codificada carácter a carácter dejando intactos
 * sólo `A-Za-z0-9-_.~`. `encodeURIComponent` deja pasar `!'()*`, así que hay
 * que rematarlos; las barras se conservan porque separan segmentos.
 */
export const codificaRuta = (clave) => clave
  .split('/')
  .map((trozo) => encodeURIComponent(trozo)
    .replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase()))
  .join('/');

/**
 * Devuelve las cabeceras firmadas para una petición. `host` entra en la firma
 * pero NO se devuelve: `fetch` la pone por su cuenta y Node prohíbe fijarla.
 */
export function firma({ metodo, host, ruta, consulta = '', cuerpo = '', tipo, claveAcceso, secreto }) {
  const marca = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dia = marca.slice(0, 8);
  const huella = sha256(cuerpo);

  const cabeceras = { host, 'x-amz-content-sha256': huella, 'x-amz-date': marca };
  if (tipo) cabeceras['content-type'] = tipo;

  const nombres = Object.keys(cabeceras).sort();
  const firmadas = nombres.join(';');
  const peticionCanonica = [
    metodo,
    ruta,
    consulta,
    nombres.map((n) => `${n}:${cabeceras[n]}`).join('\n') + '\n',
    firmadas,
    huella,
  ].join('\n');

  const alcance = `${dia}/auto/s3/aws4_request`;
  const aFirmar = ['AWS4-HMAC-SHA256', marca, alcance, sha256(peticionCanonica)].join('\n');

  let clave = hmac('AWS4' + secreto, dia);
  clave = hmac(clave, 'auto');
  clave = hmac(clave, 's3');
  clave = hmac(clave, 'aws4_request');
  const rubrica = crypto.createHmac('sha256', clave).update(aFirmar).digest('hex');

  delete cabeceras.host;
  cabeceras.Authorization = `AWS4-HMAC-SHA256 Credential=${claveAcceso}/${alcance}, `
    + `SignedHeaders=${firmadas}, Signature=${rubrica}`;
  return cabeceras;
}

/**
 * Lista un bucket entero. Devuelve un Map clave → tamaño en bytes.
 *
 * S3 pagina de 1000 en 1000 y avisa con `<IsTruncated>true`; se sigue el
 * `NextContinuationToken` hasta el final. Se lee el XML con expresiones
 * regulares a propósito: la respuesta es un formato fijo de tres campos y no
 * merece una dependencia de parseo.
 */
export async function listar({ host, bucket, claveAcceso, secreto }) {
  const objetos = new Map();
  let token = null;
  do {
    const partes = ['list-type=2', 'max-keys=1000'];
    if (token) partes.push('continuation-token=' + encodeURIComponent(token));
    const consulta = partes.sort().join('&');
    const ruta = '/' + bucket;
    const cabeceras = firma({ metodo: 'GET', host, ruta, consulta, claveAcceso, secreto });
    const r = await fetch(`https://${host}${ruta}?${consulta}`, { headers: cabeceras });
    if (!r.ok) throw new Error(`listar dio HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const xml = await r.text();
    for (const m of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
      const clave = /<Key>([\s\S]*?)<\/Key>/.exec(m[1])?.[1];
      const tam = /<Size>(\d+)<\/Size>/.exec(m[1])?.[1];
      if (clave) objetos.set(clave, Number(tam));
    }
    token = /<IsTruncated>true<\/IsTruncated>/.test(xml)
      ? /<NextContinuationToken>([\s\S]*?)<\/NextContinuationToken>/.exec(xml)?.[1] ?? null
      : null;
  } while (token);
  return objetos;
}
