import { describe, expect, it } from 'vitest';
import { createSseParser, type SseMessage } from '../src/sse.js';

function parse(...chunks: string[]) {
	const messages: SseMessage[] = [];
	const retries: number[] = [];
	const parser = createSseParser(
		(message) => messages.push(message),
		(milliseconds) => retries.push(milliseconds)
	);
	for (const chunk of chunks) {
		parser.push(chunk);
	}
	parser.end();
	return { messages, retries, data: messages.map((message) => message.data) };
}

describe('createSseParser line endings', () => {
	it.each([
		['LF', 'data: a\n\ndata: b\n\n'],
		['CRLF', 'data: a\r\n\r\ndata: b\r\n\r\n'],
		['CR', 'data: a\r\rdata: b\r\r'],
		['mixed', 'data: a\r\n\ndata: b\r\r']
	])('handles %s line endings', (_name, stream) => {
		expect(parse(stream).data).toEqual(['a', 'b']);
	});

	it('handles chunks split in the middle of a line', () => {
		expect(parse('da', 'ta: hel', 'lo\n', '\n').data).toEqual(['hello']);
	});

	it('treats CR and LF split across chunks as one line break', () => {
		const { data } = parse('data: a\r', '\ndata: b\r', '\n\r', '\n');
		expect(data).toEqual(['a\nb']);
	});

	it('treats a CR followed by an empty chunk and then LF as one line break', () => {
		expect(parse('data: a\r', '', '\n', 'data: b\n\n').data).toEqual(['a\nb']);
	});

	it('treats a CR at a chunk end followed by another CR as two line breaks', () => {
		expect(parse('data: a\r', '\rdata: b\n\n').data).toEqual(['a', 'b']);
	});

	it('handles one character per chunk', () => {
		const stream = 'data: x\r\ndata: y\r\n\r\n';
		expect(parse(...stream.split('')).data).toEqual(['x\ny']);
	});
});

describe('createSseParser fields', () => {
	it('joins multi-line data with LF and removes the trailing LF', () => {
		expect(parse('data: one\ndata: two\ndata\n\n').data).toEqual(['one\ntwo\n']);
	});

	it('ignores comment lines', () => {
		expect(parse(': hi\n\n: keep-alive\ndata: x\n:\n\n').data).toEqual(['x']);
	});

	it('removes only a single leading space after the colon', () => {
		expect(parse('data:no-space\n\ndata:  two\n\n').data).toEqual(['no-space', ' two']);
	});

	it('treats a line without a colon as a field with an empty value', () => {
		expect(parse('data\ndata\n\n').data).toEqual(['\n']);
	});

	it('ignores unknown fields', () => {
		expect(parse('foo: bar\ndata: x\n\n').messages).toEqual([
			{ data: 'x', event: 'message', id: '' }
		]);
	});

	it('uses the event field for the type and resets it after dispatch', () => {
		const { messages } = parse('event: custom\ndata: a\n\ndata: b\n\n');
		expect(messages.map((message) => message.event)).toEqual(['custom', 'message']);
	});

	it('keeps the last event id across events and ignores ids containing NUL', () => {
		const { messages } = parse('id: 1\ndata: a\n\ndata: b\n\nid: 2\0x\ndata: c\n\nid\ndata: d\n\n');
		expect(messages.map((message) => message.id)).toEqual(['1', '1', '1', '']);
	});

	it('reports retry values made of digits only', () => {
		const { retries, messages } = parse('retry: 3000\nretry: 1.5\nretry: x\nretry:\nretry: 42\n\n');
		expect(retries).toEqual([3000, 42]);
		expect(messages).toEqual([]);
	});
});

describe('createSseParser dispatch', () => {
	it('strips a BOM at the start of the stream only', () => {
		expect(parse('\uFEFFdata: a\n\n', '\uFEFFdata: b\n\n').data).toEqual(['a']);
	});

	it('strips a BOM delivered as its own chunk', () => {
		expect(parse('\uFEFF', 'data: a\n\n').data).toEqual(['a']);
	});

	it('does not dispatch until a blank line is received', () => {
		const messages: SseMessage[] = [];
		const parser = createSseParser((message) => messages.push(message));
		parser.push('data: a\n');
		expect(messages).toEqual([]);
		parser.push('\n');
		expect(messages).toHaveLength(1);
	});

	it('does not dispatch events with an empty data buffer', () => {
		expect(parse('event: x\n\nid: 1\n\n\n\n').messages).toEqual([]);
	});

	it('dispatches an event whose data is an empty string', () => {
		expect(parse('data:\n\n').data).toEqual(['']);
	});

	it('discards an incomplete final event at the end of the stream', () => {
		expect(parse('data: a\n\ndata: b\n').data).toEqual(['a']);
		expect(parse('data: a\n\ndata: b').data).toEqual(['a']);
	});

	it('parses a Hue bridge payload', () => {
		const payload = JSON.stringify([
			{ id: 'e1', creationtime: '2026-01-01T00:00:00Z', type: 'update', data: [] }
		]);
		const { data } = parse(': hi\n\n', `id: 1:0\ndata: ${payload}\n\n`);
		expect(data.map((item) => JSON.parse(item))).toEqual([JSON.parse(payload)]);
	});
});
