import { spawnSync } from 'node:child_process';
import { APP_ROOT, EXTENSION_DIR } from './extension';

export default function setup(): void {
	const result = spawnSync(
		'node_modules/.bin/vp',
		['build', '--outDir', EXTENSION_DIR, '--emptyOutDir', '--logLevel', 'warn'],
		{ cwd: APP_ROOT, stdio: 'inherit' }
	);

	if (result.status !== 0) {
		throw new Error(`Extension build failed with exit code ${result.status}`);
	}
}
