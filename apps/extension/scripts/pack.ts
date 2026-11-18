import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { packExtension, releaseFileName } from './pack-extension';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(appRoot, 'dist');
const destination = path.join(appRoot, 'release', releaseFileName(dist));

packExtension(dist, destination);
console.log(destination);
