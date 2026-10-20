export interface SseMessage {
	data: string;
	event: string;
	id: string;
}

export interface SseParser {
	push(chunk: string): void;
	end(): void;
}

export function createSseParser(
	onMessage: (message: SseMessage) => void,
	onRetry?: (milliseconds: number) => void
): SseParser {
	let buffer = '';
	let started = false;
	let skipLineFeed = false;
	let data = '';
	let eventType = '';
	let lastEventId = '';

	function dispatch(): void {
		if (data === '') {
			eventType = '';
			return;
		}
		const message: SseMessage = {
			data: data.endsWith('\n') ? data.slice(0, -1) : data,
			event: eventType === '' ? 'message' : eventType,
			id: lastEventId
		};
		data = '';
		eventType = '';
		onMessage(message);
	}

	function processLine(line: string): void {
		if (line === '') {
			dispatch();
			return;
		}
		if (line.startsWith(':')) {
			return;
		}
		const colon = line.indexOf(':');
		const field = colon === -1 ? line : line.slice(0, colon);
		let value = colon === -1 ? '' : line.slice(colon + 1);
		if (value.startsWith(' ')) {
			value = value.slice(1);
		}
		switch (field) {
			case 'event':
				eventType = value;
				break;
			case 'data':
				data += `${value}\n`;
				break;
			case 'id':
				if (!value.includes('\0')) {
					lastEventId = value;
				}
				break;
			case 'retry':
				if (/^\d+$/.test(value)) {
					onRetry?.(Number.parseInt(value, 10));
				}
				break;
		}
	}

	return {
		push(chunk) {
			let text = chunk;
			if (text === '') {
				return;
			}
			if (!started) {
				started = true;
				if (text.charCodeAt(0) === 0xfeff) {
					text = text.slice(1);
				}
			}
			if (skipLineFeed && text !== '') {
				skipLineFeed = false;
				if (text.startsWith('\n')) {
					text = text.slice(1);
				}
			}
			buffer += text;
			let start = 0;
			for (let index = start; index < buffer.length; index++) {
				const char = buffer[index];
				if (char !== '\r' && char !== '\n') {
					continue;
				}
				const line = buffer.slice(start, index);
				if (char === '\r') {
					if (index + 1 === buffer.length) {
						skipLineFeed = true;
					} else if (buffer[index + 1] === '\n') {
						index++;
					}
				}
				start = index + 1;
				processLine(line);
			}
			buffer = buffer.slice(start);
		},
		end() {
			buffer = '';
			data = '';
			eventType = '';
			skipLineFeed = false;
		}
	};
}
