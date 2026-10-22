import ts from 'typescript';

import { applyEdits, type TextEdit } from './edits';
import { parseSource } from './parse';
import { stripJsSpecifier, type ImportResolver } from './resolve-import';

export interface ImportTransform {
	code: string;
	missing: string[];
	unparsed: boolean;
}

export function transformRelativeImports(
	source: string,
	fileName: string,
	scriptKind: ts.ScriptKind,
	resolve: ImportResolver
): ImportTransform {
	const parsed = parseSource(fileName, source, scriptKind);

	if (!parsed) {
		return { code: source, missing: [], unparsed: true };
	}

	const edits: TextEdit[] = [];
	const missing: string[] = [];

	const visit = (node: ts.Node): void => {
		const specifier = moduleSpecifier(node);

		if (specifier && ts.isStringLiteral(specifier)) {
			const stripped = strippedSpecifier(parsed, specifier, fileName, resolve, missing);

			if (stripped) {
				edits.push(stripped);
			}
		}

		ts.forEachChild(node, visit);
	};

	visit(parsed);

	return { code: applyEdits(source, edits), missing, unparsed: false };
}

function moduleSpecifier(node: ts.Node): ts.Expression | undefined {
	if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
		return node.moduleSpecifier;
	}

	if (
		ts.isImportTypeNode(node) &&
		ts.isLiteralTypeNode(node.argument) &&
		ts.isStringLiteral(node.argument.literal)
	) {
		return node.argument.literal;
	}

	if (ts.isExternalModuleReference(node)) {
		return node.expression;
	}

	if (
		ts.isCallExpression(node) &&
		node.expression.kind === ts.SyntaxKind.ImportKeyword &&
		node.arguments[0]
	) {
		return node.arguments[0];
	}

	if (
		ts.isCallExpression(node) &&
		ts.isIdentifier(node.expression) &&
		node.expression.text === 'require' &&
		node.arguments[0]
	) {
		return node.arguments[0];
	}

	return undefined;
}

function strippedSpecifier(
	parsed: ts.SourceFile,
	literal: ts.StringLiteral,
	fileName: string,
	resolve: ImportResolver,
	missing: string[]
): TextEdit | undefined {
	const stripped = stripJsSpecifier(literal.text);

	if (!stripped) {
		return undefined;
	}

	const raw = literal.getText(parsed);

	if (raw.slice(1, -1) !== literal.text) {
		return undefined;
	}

	const target = resolve(fileName, literal.text);

	if (target !== 'typescript') {
		if (target === 'missing') {
			missing.push(literal.text);
		}

		return undefined;
	}

	return {
		start: literal.getStart(parsed) + 1,
		end: literal.getEnd() - 1,
		text: stripped
	};
}
