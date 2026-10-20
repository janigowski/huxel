export type SseLine =
	{ kind: 'end-of-message' } | { kind: 'comment' } | { kind: 'field'; name: string; value: string };

export function parseSseLine(line: string): SseLine {
	if (line === '') {
		return { kind: 'end-of-message' };
	}

	if (line.startsWith(':')) {
		return { kind: 'comment' };
	}

	const colon = line.indexOf(':');

	if (colon === -1) {
		return { kind: 'field', name: line, value: '' };
	}

	const value = line.slice(colon + 1);

	return {
		kind: 'field',
		name: line.slice(0, colon),
		value: value.startsWith(' ') ? value.slice(1) : value
	};
}
