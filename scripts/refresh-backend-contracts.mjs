import { cp, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = resolve(process.cwd(), '../backend_delivery/docs/platform/system/api');
const target = resolve(process.cwd(), 'contracts/backend');
await mkdir(target, { recursive: true });
await Promise.all([
  cp(`${source}/http-contract.json`, `${target}/http-contract.json`),
  cp(`${source}/public-edge-manifest.json`, `${target}/public-edge-manifest.json`),
]);
console.log(`Refreshed backend API contracts from ${source}`);
