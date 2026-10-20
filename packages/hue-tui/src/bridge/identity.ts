export interface BridgeCertificate {
	subject?: { CN?: unknown };
}

export function checkBridgeIdentity(
	bridgeId: string,
	certificate: BridgeCertificate
): Error | undefined {
	const commonName = certificate.subject?.CN;
	if (typeof commonName === 'string' && commonName.toLowerCase() === bridgeId.toLowerCase()) {
		return undefined;
	}
	return new Error(
		`Bridge certificate is for ${typeof commonName === 'string' ? commonName : 'an unknown bridge'}, expected bridge ${bridgeId}`
	);
}
