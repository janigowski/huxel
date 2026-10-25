#!/usr/bin/env bun
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SessionError } from './errors';
import { createHueMcpServer } from './server';
import { createDefaultSession } from './session';

const session = createDefaultSession();
const [command, bridgeId] = process.argv.slice(2);

try {
	if (command === undefined) {
		await createHueMcpServer(session).connect(new StdioServerTransport());
	} else if (command === 'status') {
		console.log(JSON.stringify(await session.status(), null, '\t'));
	} else if (command === 'link') {
		console.error('Press the link button on the Hue bridge.');
		console.log(
			JSON.stringify(await session.linkUntil(bridgeId === undefined ? {} : { bridgeId }))
		);
	} else {
		console.error('Usage: hue-mcp [status | link [bridgeId]]');
		process.exitCode = 1;
	}
} catch (error) {
	console.error(error instanceof SessionError ? error.message : error);
	process.exitCode = 1;
}
