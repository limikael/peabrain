import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

export function getDirname(metaUrl) {
	return dirname(fileURLToPath(metaUrl));
}