import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { isSourceFile, transformFile } from './transform-file';
import { filesystemImportTarget } from './resolve-import';

const IGNORE_DIRECTORIES = new Set([
	'node_modules',
	'dist',
	'.git',
	'.svelte-kit',
	'build',
	'coverage',
	'.e2e'
]);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const check = process.argv.includes('--check');

const files = listSourceFiles(root);
const updates: { file: string; code: string }[] = [];
const renames: string[] = [];
const missing: string[] = [];
const unparsed: string[] = [];

for (const file of files) {
	const source = fs.readFileSync(file, 'utf8');
	const transformed = transformFile(file, source, filesystemImportTarget);
	const relative = path.relative(root, file);

	if (transformed.unparsed) {
		unparsed.push(relative);
		continue;
	}

	if (transformed.code !== source) {
		updates.push({ file, code: transformed.code });
	}

	for (const rename of transformed.renames) {
		renames.push(`${relative}:${rename.line} ${rename.className} #${rename.from} -> ${rename.to}`);
	}

	for (const specifier of transformed.missing) {
		missing.push(`${relative} ${specifier}`);
	}
}

if (unparsed.length > 0) {
	console.error('Skipped files that did not parse:');

	for (const file of unparsed) {
		console.error(`  ${file}`);
	}

	process.exit(1);
}

if (missing.length > 0) {
	console.error('Relative .js imports with no TypeScript or JavaScript file were left unchanged:');

	for (const specifier of missing) {
		console.error(`  ${specifier}`);
	}

	process.exit(1);
}

if (check) {
	if (updates.length === 0) {
		console.log('Codemod check passed.');
		process.exit(0);
	}

	console.error('Relative .js imports or #private fields are still present.');
	console.error('Run `bun run codemod` instead of editing them by hand.');

	for (const update of updates) {
		console.error(`  ${path.relative(root, update.file)}`);
	}

	process.exit(1);
}

for (const update of updates) {
	fs.writeFileSync(update.file, update.code);
}

console.log(`Updated ${updates.length} file${updates.length === 1 ? '' : 's'}.`);

if (renames.length > 0) {
	console.log('Renamed private members that collided with a public name:');

	for (const rename of renames) {
		console.log(`  ${rename}`);
	}
}

function listSourceFiles(directory: string): string[] {
	const files: string[] = [];

	for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
		if (IGNORE_DIRECTORIES.has(entry.name)) {
			continue;
		}

		const fullPath = path.join(directory, entry.name);

		if (entry.isDirectory()) {
			files.push(...listSourceFiles(fullPath));
			continue;
		}

		if (entry.isFile() && isSourceFile(entry.name)) {
			files.push(fullPath);
		}
	}

	return files;
}
