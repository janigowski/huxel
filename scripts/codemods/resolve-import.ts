import fs from 'node:fs';
import path from 'node:path';

export type ImportTarget = 'typescript' | 'javascript' | 'missing';

export type ImportResolver = (fromFile: string, specifier: string) => ImportTarget;

const TYPESCRIPT_EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts', '.d.ts'] as const;

export function filesystemImportTarget(fromFile: string, specifier: string): ImportTarget {
	const pathPart = specifier.split(/[?#]/)[0] ?? specifier;

	if (!pathPart.startsWith('.') || !pathPart.endsWith('.js')) {
		return 'missing';
	}

	const directory = path.dirname(fromFile);
	const javascriptFile = path.resolve(directory, pathPart);
	const stem = javascriptFile.slice(0, -'.js'.length);
	const typescriptCandidates = [
		...TYPESCRIPT_EXTENSIONS.map((extension) => `${stem}${extension}`),
		...TYPESCRIPT_EXTENSIONS.map((extension) => path.join(stem, `index${extension}`))
	];

	if (typescriptCandidates.some((candidate) => fs.existsSync(candidate))) {
		return 'typescript';
	}

	if (
		fs.existsSync(javascriptFile) ||
		fs.existsSync(`${stem}.mjs`) ||
		fs.existsSync(`${stem}.cjs`) ||
		fs.existsSync(`${stem}.jsx`)
	) {
		return 'javascript';
	}

	return 'missing';
}

export function stripJsSpecifier(specifier: string): string | undefined {
	const match = /^(.*)\.js([?#].*)?$/.exec(specifier);

	if (!match?.[1]?.startsWith('.')) {
		return undefined;
	}

	return `${match[1]}${match[2] ?? ''}`;
}
