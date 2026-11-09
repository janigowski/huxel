export function scrollTo(target: Element | Window, options: { top?: number; left?: number }): void {
	const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth';
	const destination: ScrollToOptions = {
		behavior,
		left: options.left,
		top: options.top
	};

	if (isWindow(target)) {
		target.scrollTo(destination);

		return;
	}

	target.scrollTo(destination);
}

function isWindow(target: Element | Window): target is Window {
	return typeof Window !== 'undefined' && target instanceof Window;
}

function prefersReducedMotion(): boolean {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
		return false;
	}

	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
