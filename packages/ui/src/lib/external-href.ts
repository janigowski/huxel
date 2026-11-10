const httpUrl = /^https?:\/\//i;

export function externalAnchorProps(href: string): { target?: '_blank'; rel?: string } {
	if (!httpUrl.test(href)) {
		return {};
	}

	return {
		target: '_blank',
		rel: 'noopener noreferrer'
	};
}
