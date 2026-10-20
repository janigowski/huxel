export interface SseMessage {
	data: string;
	event: string;
	id: string;
}

class SseLineDecoder {
	private buffer = '';
	private started = false;
	private skipLineFeed = false;

	constructor(private readonly onLine: (line: string) => void) {}

	push(chunk: string): void {
		if (chunk === '') {
			return;
		}

		let text = this.stripByteOrderMark(chunk);

		if (this.skipLineFeed && text !== '') {
			this.skipLineFeed = false;

			if (text.startsWith('\n')) {
				text = text.slice(1);
			}
		}

		this.buffer += text;
		this.splitLines();
	}

	reset(): void {
		this.buffer = '';
		this.skipLineFeed = false;
	}

	private stripByteOrderMark(chunk: string): string {
		if (this.started) {
			return chunk;
		}

		this.started = true;

		return chunk.charCodeAt(0) === 0xfeff ? chunk.slice(1) : chunk;
	}

	private splitLines(): void {
		let start = 0;

		for (let index = start; index < this.buffer.length; index++) {
			const char = this.buffer[index];

			if (char !== '\r' && char !== '\n') {
				continue;
			}

			const line = this.buffer.slice(start, index);

			if (char === '\r') {
				if (index + 1 === this.buffer.length) {
					this.skipLineFeed = true;
				} else if (this.buffer[index + 1] === '\n') {
					index++;
				}
			}

			start = index + 1;
			this.onLine(line);
		}

		this.buffer = this.buffer.slice(start);
	}
}

export class SseParser {
	private readonly lines = new SseLineDecoder((line) => this.processLine(line));
	private data = '';
	private eventType = '';
	private lastEventId = '';

	constructor(
		private readonly onMessage: (message: SseMessage) => void,
		private readonly onRetry?: (milliseconds: number) => void
	) {}

	push(chunk: string): void {
		this.lines.push(chunk);
	}

	end(): void {
		this.lines.reset();
		this.data = '';
		this.eventType = '';
	}

	private processLine(line: string): void {
		if (line === '') {
			this.dispatch();
			return;
		}

		if (line.startsWith(':')) {
			return;
		}

		const colon = line.indexOf(':');
		const field = colon === -1 ? line : line.slice(0, colon);
		const value = colon === -1 ? '' : line.slice(colon + 1);

		this.processField(field, value.startsWith(' ') ? value.slice(1) : value);
	}

	private processField(field: string, value: string): void {
		switch (field) {
			case 'event':
				this.eventType = value;
				break;
			case 'data':
				this.data += `${value}\n`;
				break;
			case 'id':
				if (!value.includes('\0')) {
					this.lastEventId = value;
				}
				break;
			case 'retry':
				if (/^\d+$/.test(value)) {
					this.onRetry?.(Number.parseInt(value, 10));
				}
				break;
		}
	}

	private dispatch(): void {
		if (this.data === '') {
			this.eventType = '';
			return;
		}

		const message: SseMessage = {
			data: this.data.endsWith('\n') ? this.data.slice(0, -1) : this.data,
			event: this.eventType === '' ? 'message' : this.eventType,
			id: this.lastEventId
		};

		this.data = '';
		this.eventType = '';
		this.onMessage(message);
	}
}
