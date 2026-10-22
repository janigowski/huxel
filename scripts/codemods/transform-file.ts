import path from 'node:path';
import ts from 'typescript';

import { scriptKindFor } from './parse';
import { transformPrivateFields, type PrivateRename } from './private-fields';
import { transformRelativeImports } from './relative-imports';
import type { ImportResolver } from './resolve-import';

const SOURCE_EXTENSIONS = new Set([
	'.ts',
	'.tsx',
	'.mts',
	'.cts',
	'.js',
	'.mjs',
	'.cjs',
	'.svelte'
]);

export interface FileTransform {
	code: string;
	renames: PrivateRename[];
	missing: string[];
	unparsed: boolean;
}

export function isSourceFile(fileName: string): boolean {
	return SOURCE_EXTENSIONS.has(path.extname(fileName));
}

export function transformFile(
	fileName: string,
	source: string,
	resolve: ImportResolver
): FileTransform {
	if (fileName.endsWith('.svelte')) {
		return transformSvelte(fileName, source, resolve);
	}

	return transformModule(fileName, source, scriptKindFor(fileName), resolve);
}

function transformModule(
	fileName: string,
	source: string,
	scriptKind: ts.ScriptKind,
	resolve: ImportResolver
): FileTransform {
	const imports = transformRelativeImports(source, fileName, scriptKind, resolve);

	if (imports.unparsed) {
		return { code: source, renames: [], missing: [], unparsed: true };
	}

	const fields = transformPrivateFields(imports.code, fileName, scriptKind);

	if (fields.unparsed) {
		return { code: source, renames: [], missing: imports.missing, unparsed: true };
	}

	return {
		code: fields.code,
		renames: fields.renames,
		missing: imports.missing,
		unparsed: false
	};
}

function transformSvelte(fileName: string, source: string, resolve: ImportResolver): FileTransform {
	const pattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/g;
	let next = '';
	let cursor = 0;
	const renames: PrivateRename[] = [];
	const missing: string[] = [];

	for (const match of source.matchAll(pattern)) {
		const index = match.index ?? 0;
		const attributes = match[1] ?? '';
		const body = match[2] ?? '';
		const language = scriptLanguage(attributes);
		next += source.slice(cursor, index);

		if (language === 'skip') {
			next += match[0];
			cursor = index + match[0].length;
			continue;
		}

		const transformed = transformModule(
			fileName,
			body,
			language === 'js' ? ts.ScriptKind.JS : ts.ScriptKind.TS,
			resolve
		);

		if (transformed.unparsed) {
			return { code: source, renames: [], missing: [], unparsed: true };
		}

		const openLength = match[0].length - body.length - '</script>'.length;
		next += match[0].slice(0, openLength) + transformed.code + '</script>';
		renames.push(...transformed.renames);
		missing.push(...transformed.missing);
		cursor = index + match[0].length;
	}

	next += source.slice(cursor);

	return { code: next, renames, missing, unparsed: false };
}

function scriptLanguage(attributes: string): 'ts' | 'js' | 'skip' {
	const match = /\blang\s*=\s*["']([^"']+)["']/.exec(attributes);

	if (!match) {
		return 'js';
	}

	if (match[1] === 'ts' || match[1] === 'js') {
		return match[1];
	}

	return 'skip';
}
