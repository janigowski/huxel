import ts from 'typescript';

export function scriptKindFor(fileName: string): ts.ScriptKind {
	if (fileName.endsWith('.tsx')) {
		return ts.ScriptKind.TSX;
	}

	if (fileName.endsWith('.ts') || fileName.endsWith('.mts') || fileName.endsWith('.cts')) {
		return ts.ScriptKind.TS;
	}

	if (fileName.endsWith('.jsx')) {
		return ts.ScriptKind.JSX;
	}

	return ts.ScriptKind.JS;
}

interface ParsedSource extends ts.SourceFile {
	parseDiagnostics?: readonly ts.Diagnostic[];
}

export function parseSource(
	fileName: string,
	source: string,
	scriptKind: ts.ScriptKind
): ts.SourceFile | undefined {
	const parsed = ts.createSourceFile(
		fileName,
		source,
		ts.ScriptTarget.Latest,
		true,
		scriptKind
	) as ParsedSource;

	if (parsed.parseDiagnostics && parsed.parseDiagnostics.length > 0) {
		return undefined;
	}

	return parsed;
}
