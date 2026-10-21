import { hostPermissionPattern } from '../bridge/bridge-host';
import type { HostAccess } from '../ports';

export function createChromeHostAccess(
	permissions: typeof chrome.permissions = chrome.permissions
): HostAccess {
	return {
		contains: (origin) => permissions.contains({ origins: [hostPermissionPattern(origin)] }),
		request: (origin) => permissions.request({ origins: [hostPermissionPattern(origin)] })
	};
}
