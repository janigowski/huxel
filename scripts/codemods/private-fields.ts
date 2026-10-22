import ts from 'typescript';

import { applyEdits, type TextEdit } from './edits';
import { parseSource } from './parse';

const COLLISION_SUFFIX = 'State';

export interface PrivateRename {
	className: string;
	from: string;
	to: string;
	line: number;
}

export class PrivateBrandCheckError extends Error {
	constructor(fileName: string, line: number, name: string) {
		super(
			`${fileName}:${line} uses \`#${name} in\` brand check, which has no TypeScript private equivalent`
		);
		this.name = 'PrivateBrandCheckError';
	}
}

export interface PrivateFieldTransform {
	code: string;
	renames: PrivateRename[];
	unparsed: boolean;
}

export function transformPrivateFields(
	source: string,
	fileName: string,
	scriptKind: ts.ScriptKind
): PrivateFieldTransform {
	const parsed = parseSource(fileName, source, scriptKind);

	if (!parsed) {
		return { code: source, renames: [], unparsed: true };
	}

	const renamesByClass = new Map<ts.ClassLikeDeclaration, Map<string, string>>();
	const reported: PrivateRename[] = [];

	const collect = (node: ts.Node): void => {
		if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) {
			const allocated = allocatePrivateNames(node);
			renamesByClass.set(node, allocated.names);

			for (const rename of allocated.collisions) {
				const start = rename.member.getStart(parsed);
				reported.push({
					className: node.name?.text ?? '<anonymous>',
					from: rename.from,
					to: rename.to,
					line: parsed.getLineAndCharacterOfPosition(start).line + 1
				});
			}
		}

		ts.forEachChild(node, collect);
	};

	collect(parsed);

	const edits: TextEdit[] = [];

	const rewrite = (node: ts.Node): void => {
		if (ts.isPrivateIdentifier(node)) {
			const rename = renameFor(node, renamesByClass);

			if (!rename) {
				ts.forEachChild(node, rewrite);
				return;
			}

			if (isBrandCheck(node)) {
				const line = parsed.getLineAndCharacterOfPosition(node.getStart(parsed)).line + 1;
				throw new PrivateBrandCheckError(fileName, line, rename.from);
			}

			edits.push({
				start: node.getStart(parsed),
				end: node.getEnd(),
				text: rename.to
			});

			const member = declaringMember(node);

			if (member) {
				edits.push({
					start: modifierInsertionPoint(member, parsed),
					end: modifierInsertionPoint(member, parsed),
					text: 'private '
				});
			}
		}

		ts.forEachChild(node, rewrite);
	};

	rewrite(parsed);

	return { code: applyEdits(source, edits), renames: reported, unparsed: false };
}

function allocatePrivateNames(node: ts.ClassLikeDeclaration): {
	names: Map<string, string>;
	collisions: { from: string; to: string; member: ts.ClassElement }[];
} {
	const used = new Set(publicMemberNames(node));
	const names = new Map<string, string>();
	const collisions: { from: string; to: string; member: ts.ClassElement }[] = [];

	for (const member of node.members) {
		const identifier = privateMemberName(member);

		if (!identifier) {
			continue;
		}

		const from = privateIdentifierName(identifier);

		if (names.has(from)) {
			continue;
		}

		const to = allocateName(from, used);
		names.set(from, to);

		if (to !== from) {
			collisions.push({ from, to, member });
		}
	}

	return { names, collisions };
}

function publicMemberNames(node: ts.ClassLikeDeclaration): string[] {
	const names: string[] = [];

	for (const member of node.members) {
		if (ts.isConstructorDeclaration(member)) {
			for (const parameter of member.parameters) {
				if (isParameterProperty(parameter) && ts.isIdentifier(parameter.name)) {
					names.push(parameter.name.text);
				}
			}

			continue;
		}

		if (!('name' in member) || !member.name || ts.isPrivateIdentifier(member.name)) {
			continue;
		}

		const name = propertyNameText(member.name);

		if (name) {
			names.push(name);
		}
	}

	return names;
}

function isParameterProperty(parameter: ts.ParameterDeclaration): boolean {
	const modifiers = ts.canHaveModifiers(parameter) ? ts.getModifiers(parameter) : undefined;

	return (
		modifiers?.some(
			(modifier) =>
				modifier.kind === ts.SyntaxKind.PrivateKeyword ||
				modifier.kind === ts.SyntaxKind.PublicKeyword ||
				modifier.kind === ts.SyntaxKind.ProtectedKeyword ||
				modifier.kind === ts.SyntaxKind.ReadonlyKeyword ||
				modifier.kind === ts.SyntaxKind.AccessorKeyword
		) ?? false
	);
}

function propertyNameText(name: ts.PropertyName): string | undefined {
	if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
		return name.text;
	}

	return undefined;
}

function privateMemberName(member: ts.ClassElement): ts.PrivateIdentifier | undefined {
	if (
		!ts.isPropertyDeclaration(member) &&
		!ts.isMethodDeclaration(member) &&
		!ts.isGetAccessorDeclaration(member) &&
		!ts.isSetAccessorDeclaration(member)
	) {
		return undefined;
	}

	const named = member as ts.PropertyDeclaration;

	if (named.name && ts.isPrivateIdentifier(named.name)) {
		return named.name;
	}

	return undefined;
}

function allocateName(name: string, used: Set<string>): string {
	if (!used.has(name)) {
		used.add(name);
		return name;
	}

	let candidate = `${name}${COLLISION_SUFFIX}`;
	let suffix = 2;

	while (used.has(candidate)) {
		candidate = `${name}${COLLISION_SUFFIX}${suffix}`;
		suffix += 1;
	}

	used.add(candidate);
	return candidate;
}

function renameFor(
	node: ts.PrivateIdentifier,
	renamesByClass: Map<ts.ClassLikeDeclaration, Map<string, string>>
): { from: string; to: string } | undefined {
	const from = privateIdentifierName(node);
	let current: ts.Node | undefined = node.parent;

	while (current) {
		if (ts.isClassDeclaration(current) || ts.isClassExpression(current)) {
			const to = renamesByClass.get(current)?.get(from);

			if (to) {
				return { from, to };
			}
		}

		current = current.parent;
	}

	return undefined;
}

function privateIdentifierName(node: ts.PrivateIdentifier): string {
	const text = node.escapedText as string;

	return text.startsWith('#') ? text.slice(1) : text;
}

function isBrandCheck(node: ts.PrivateIdentifier): boolean {
	return (
		ts.isBinaryExpression(node.parent) &&
		node.parent.operatorToken.kind === ts.SyntaxKind.InKeyword &&
		node.parent.left === node
	);
}

function declaringMember(node: ts.PrivateIdentifier): ts.ClassElement | undefined {
	if (node.parent && privateMemberName(node.parent as ts.ClassElement) === node) {
		return node.parent as ts.ClassElement;
	}

	return undefined;
}

function modifierInsertionPoint(member: ts.ClassElement, sourceFile: ts.SourceFile): number {
	const modifiers = ts.canHaveModifiers(member) ? ts.getModifiers(member) : undefined;
	const firstModifier = modifiers?.[0];

	if (firstModifier) {
		return firstModifier.getStart(sourceFile);
	}

	const decorators = ts.canHaveDecorators(member) ? ts.getDecorators(member) : undefined;

	if (decorators && decorators.length > 0) {
		return skipWhitespace(sourceFile.text, decorators[decorators.length - 1]!.end);
	}

	return member.getStart(sourceFile);
}

function skipWhitespace(text: string, index: number): number {
	while (
		index < text.length &&
		(text[index] === ' ' || text[index] === '\t' || text[index] === '\n' || text[index] === '\r')
	) {
		index += 1;
	}

	return index;
}
