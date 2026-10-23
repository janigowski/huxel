import { parseSseLine } from './sse-line';
import { SseLineSplitter } from './sse-line-splitter';
import { SseMessageBuilder, type SseMessage } from './sse-message-builder';

export class SseParser {
	private readonly lines = new SseLineSplitter((line) => this.handleLine(line));
	private readonly message = new SseMessageBuilder();

	constructor(
		private readonly onMessage: (message: SseMessage) => void,
		private readonly onRetry?: (milliseconds: number) => void
	) {}

	push(chunk: string): void {
		this.lines.push(chunk);
	}

	end(): void {
		this.lines.reset();
		this.message.discardPending();
	}

	private handleLine(text: string): void {
		const line = parseSseLine(text);

		if (line.kind === 'end-of-message') {
			this.dispatchMessage();
		} else if (line.kind === 'field') {
			this.handleField(line.name, line.value);
		}
	}

	private handleField(name: string, value: string): void {
		switch (name) {
			case 'event':
				this.message.setEventType(value);
				break;
			case 'data':
				this.message.appendData(value);
				break;
			case 'id':
				this.message.setLastEventId(value);
				break;
			case 'retry':
				this.handleRetry(value);
				break;
		}
	}

	private handleRetry(value: string): void {
		if (!/^\d+$/.test(value)) {
			return;
		}

		this.onRetry?.(Number.parseInt(value, 10));
	}

	private dispatchMessage(): void {
		const message = this.message.build();

		if (message) {
			this.onMessage(message);
		}
	}
}
