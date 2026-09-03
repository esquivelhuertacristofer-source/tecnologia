/**
 * OpenNext — adaptador de Cloudflare (3-sep-2026).
 *
 * Traduce la salida de `next build` (que aquí es `output: 'standalone'`, ver
 * `next.config.ts`) a un Worker. No lleva `incrementalCache` a propósito: esta
 * plataforma no usa ISR en ninguna página —cero `export const revalidate`,
 * cero `generateStaticParams`, cero `revalidateTag`—, así que un caché
 * incremental sería un bucket de R2 y un binding más que mantener sin que
 * nada los use. El día que una página se regenere sola, aquí se enchufa
 * `r2IncrementalCache` y se añade el bucket a `wrangler.jsonc`.
 */
import { defineCloudflareConfig } from '@opennextjs/cloudflare';

export default defineCloudflareConfig();
