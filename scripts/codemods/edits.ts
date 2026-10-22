export interface TextEdit {
	start: number;
	end: number;
	text: string;
}

export function applyEdits(source: string, edits: readonly TextEdit[]): string {
	if (edits.length === 0) {
		return source;
	}

	const ordered = [...edits].sort(
		(left, right) => right.end - left.end || right.start - left.start
	);
	let next = source;

	for (const edit of ordered) {
		next = next.slice(0, edit.start) + edit.text + next.slice(edit.end);
	}

	return next;
}
