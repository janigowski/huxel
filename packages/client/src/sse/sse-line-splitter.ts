const BYTE_ORDER_MARK = '\uFEFF';
const LINE_BREAK = /\r\n|\r|\n/;

export class SseLineSplitter {
	private incompleteLine = '';
	private atStreamStart = true;
	private previousChunkEndedWithCarriageReturn = false;

	constructor(private readonly onLine: (line: string) => void) {}

	push(chunk: string): void {
		const text = this.withoutLeadingByteOrderMark(chunk);

		if (text === '') {
			return;
		}

		const lines = this.completeLines(this.withoutSplitLineFeed(text));
		this.previousChunkEndedWithCarriageReturn = text.endsWith('\r');

		for (const line of lines) {
			this.onLine(line);
		}
	}

	reset(): void {
		this.incompleteLine = '';
		this.previousChunkEndedWithCarriageReturn = false;
	}

	private withoutLeadingByteOrderMark(chunk: string): string {
		if (!this.atStreamStart || chunk === '') {
			return chunk;
		}

		this.atStreamStart = false;

		return chunk.startsWith(BYTE_ORDER_MARK) ? chunk.slice(BYTE_ORDER_MARK.length) : chunk;
	}

	private withoutSplitLineFeed(text: string): string {
		const isSecondHalfOfCrLf = this.previousChunkEndedWithCarriageReturn && text.startsWith('\n');

		return isSecondHalfOfCrLf ? text.slice(1) : text;
	}

	private completeLines(text: string): string[] {
		const lines = (this.incompleteLine + text).split(LINE_BREAK);
		this.incompleteLine = lines.pop() ?? '';

		return lines;
	}
}
