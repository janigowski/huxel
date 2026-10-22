import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

import { PrivateBrandCheckError, transformPrivateFields } from './private-fields';
import { filesystemImportTarget } from './resolve-import';
import { transformFile } from './transform-file';
import type { ImportResolver } from './resolve-import';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const resolveImports: ImportResolver = (_fromFile, specifier) => {
	if (specifier.endsWith('svelte.config.js')) {
		return 'javascript';
	}

	if (specifier.includes('missing')) {
		return 'missing';
	}

	return 'typescript';
};

test('strips .js from relative TypeScript imports and keeps real JavaScript files', () => {
	const source = [
		"import { createHueClient } from './client.js';",
		"import type { HueClient } from './client.js';",
		"export { createHueClient } from './client.js';",
		"export type * from './types/light.js';",
		"const loaded = import('./client.js');",
		"import data from './data.js?raw';",
		"import config from './svelte.config.js';",
		"import pkg from 'left-pad/index.js';",
		''
	].join('\n');

	const transformed = transformFile('src/index.ts', source, resolveImports);

	assert.equal(
		transformed.code,
		[
			"import { createHueClient } from './client';",
			"import type { HueClient } from './client';",
			"export { createHueClient } from './client';",
			"export type * from './types/light';",
			"const loaded = import('./client');",
			"import data from './data?raw';",
			"import config from './svelte.config.js';",
			"import pkg from 'left-pad/index.js';",
			''
		].join('\n')
	);
	assert.deepEqual(transformed.missing, []);
});

test('reports relative .js imports that do not resolve', () => {
	const transformed = transformFile(
		'src/index.ts',
		"import { gone } from './missing.js';\n",
		resolveImports
	);

	assert.equal(transformed.code, "import { gone } from './missing.js';\n");
	assert.deepEqual(transformed.missing, ['./missing.js']);
});

test('resolves repository imports from the filesystem', () => {
	assert.equal(
		filesystemImportTarget(path.join(repoRoot, 'packages/hue-app/src/light.ts'), './color.js'),
		'typescript'
	);
	assert.equal(
		filesystemImportTarget(
			path.join(repoRoot, 'apps/svelte-hue-app/eslint.config.js'),
			'./svelte.config.js'
		),
		'javascript'
	);
	assert.equal(
		filesystemImportTarget(path.join(repoRoot, 'packages/hue-app/src/light.ts'), 'hue-sdk'),
		'missing'
	);
});

test('replaces #private members with TypeScript private and renames collisions', () => {
	const source = `export class Light {
	readonly name: string;
	readonly #name: string;
	#disposed = false;

	constructor(name: string) {
		this.#name = name;
	}

	close(): void {
		if (this.#disposed) {
			return;
		}

		this.#disposed = true;
	}

	async #flush(): Promise<void> {
		await this.#name;
	}
}
`;

	const transformed = transformFile('src/light.ts', source, resolveImports);

	assert.equal(
		transformed.code,
		`export class Light {
	readonly name: string;
	private readonly nameState: string;
	private disposed = false;

	constructor(name: string) {
		this.nameState = name;
	}

	close(): void {
		if (this.disposed) {
			return;
		}

		this.disposed = true;
	}

	private async flush(): Promise<void> {
		await this.nameState;
	}
}
`
	);
	assert.deepEqual(
		transformed.renames.map((rename) => `${rename.className} #${rename.from} -> ${rename.to}`),
		['Light #name -> nameState']
	);
	assert.equal(
		transformFile('src/light.ts', transformed.code, resolveImports).code,
		transformed.code
	);
});

test('preserves optional chaining, assignment, static access, and unrelated hashes', () => {
	const source = `const pattern = /^#?([0-9a-f]{6})$/i;
const device = 'my_app#laptop';

class App {
	static #total = 0;
	#live: { dispose(): void } | undefined;
	#initialization: Promise<void> | undefined;

	start(): void {
		this.#live?.dispose();
		this.#initialization ??= Promise.resolve();
		App.#total += 1;
	}
}
`;

	const transformed = transformPrivateFields(source, 'src/app.ts', ts.ScriptKind.TS);

	assert.equal(
		transformed.code,
		`const pattern = /^#?([0-9a-f]{6})$/i;
const device = 'my_app#laptop';

class App {
	private static total = 0;
	private live: { dispose(): void } | undefined;
	private initialization: Promise<void> | undefined;

	start(): void {
		this.live?.dispose();
		this.initialization ??= Promise.resolve();
		App.total += 1;
	}
}
`
	);
});

test('keeps template text outside a Svelte script', () => {
	const source = `<script lang="ts">
	import { lamp } from './lamp.js';

	class Lamp {
		#on = false;

		toggle(): void {
			this.#on = !this.#on;
		}
	}
</script>

<button id="power">#power</button>
`;

	const transformed = transformFile('src/Lamp.svelte', source, resolveImports);

	assert.equal(
		transformed.code,
		`<script lang="ts">
	import { lamp } from './lamp';

	class Lamp {
		private on = false;

		toggle(): void {
			this.on = !this.on;
		}
	}
</script>

<button id="power">#power</button>
`
	);
});

test('converts auto-accessors', () => {
	const transformed = transformPrivateFields(
		'class Box {\n\taccessor #value = 1;\n}\n',
		'src/box.ts',
		ts.ScriptKind.TS
	);

	assert.equal(transformed.code, 'class Box {\n\tprivate accessor value = 1;\n}\n');
});

test('refuses private brand checks', () => {
	const source = `class Box {
	#brand = true;

	static isBox(value: object): boolean {
		return #brand in value;
	}
}
`;

	assert.throws(
		() => transformPrivateFields(source, 'src/box.ts', ts.ScriptKind.TS),
		PrivateBrandCheckError
	);
});
