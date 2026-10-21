import type { KeyValueStorage } from '../ports';

export function createChromeStorage(
	area: chrome.storage.StorageArea = chrome.storage.local
): KeyValueStorage {
	return {
		async get(key) {
			const items = await area.get(key);

			return items[key];
		},
		set: (key, value) => area.set({ [key]: value }),
		remove: (key) => area.remove(key)
	};
}
