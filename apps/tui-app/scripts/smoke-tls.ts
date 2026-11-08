import { describeError } from '@huxel/app';
import { createBridgeHttpClient } from '../src/bridge/http-client';

const ip = process.env.HUE_BRIDGE_IP ?? '192.168.1.10';
const bridgeId = process.env.HUE_BRIDGE_ID ?? '001788fffe7d45eb';
const checks = [
	{ id: bridgeId, expectOk: true },
	{ id: '001788fffe000000', expectOk: false },
	{ id: bridgeId.toUpperCase(), expectOk: true },
	{ id: 'ffffffffffffffff', expectOk: false }
];

let failed = false;
for (const { id, expectOk } of checks) {
	let outcome: string;
	let ok: boolean;
	try {
		const response = await createBridgeHttpClient({ bridgeId: id }).request({
			method: 'GET',
			url: `https://${ip}/api/config`
		});
		ok = true;
		outcome = `HTTP ${response.status}`;
	} catch (error) {
		ok = false;
		outcome = `rejected: ${describeError(error)}`;
	}
	const pass = ok === expectOk;
	failed ||= !pass;
	console.log(`${pass ? 'PASS' : 'FAIL'} ${id}: ${outcome}`);
}

process.exit(failed ? 1 : 0);
