export interface SseMessage {
	data: string;
	event: string;
	id: string;
}

const DEFAULT_EVENT_TYPE = 'message';

export class SseMessageBuilder {
	private dataLines: string[] = [];
	private eventType = '';
	private lastEventId = '';

	setEventType(eventType: string): void {
		this.eventType = eventType;
	}

	appendData(line: string): void {
		this.dataLines.push(line);
	}

	setLastEventId(id: string): void {
		if (id.includes('\0')) {
			return;
		}

		this.lastEventId = id;
	}

	build(): SseMessage | undefined {
		const hasData = this.dataLines.length > 0;
		const message: SseMessage = {
			data: this.dataLines.join('\n'),
			event: this.eventType || DEFAULT_EVENT_TYPE,
			id: this.lastEventId
		};

		this.discardPending();

		return hasData ? message : undefined;
	}

	discardPending(): void {
		this.dataLines = [];
		this.eventType = '';
	}
}
