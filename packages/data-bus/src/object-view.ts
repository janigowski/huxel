const rawByProxy = new WeakMap<object, object>();

function isPlainObject(value: unknown): value is Record<PropertyKey, unknown> {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		return false;
	}

	const prototype: unknown = Object.getPrototypeOf(value);

	return prototype === Object.prototype || prototype === null;
}

export function unwrapValue<T>(value: T): T {
	if (!isPlainObject(value)) {
		return value;
	}

	const raw = rawByProxy.get(value);

	if (!raw) {
		return value;
	}

	return raw as T;
}

export class ObjectView {
	private readonly proxies = new WeakMap<object, object>();

	constructor(
		private readonly notify: () => void,
		private readonly isCurrent: (root: object) => boolean
	) {}

	expose<T>(value: T): T {
		if (!isPlainObject(value)) {
			return value;
		}

		return this.wrap(value, value) as T;
	}

	private wrap(root: object, value: object): object {
		const existing = this.proxies.get(value);

		if (existing) {
			return existing;
		}

		const proxy = new Proxy(value, {
			get: (target, property, receiver) => {
				const child: unknown = Reflect.get(target, property, receiver);

				if (!isPlainObject(child)) {
					return child;
				}

				return this.wrap(root, unwrapValue(child));
			},

			set: (target, property, next, receiver) => {
				const stored = unwrapValue(next);
				const current = unwrapValue(Reflect.get(target, property, receiver));

				if (Object.is(current, stored)) {
					return true;
				}

				const wrote = Reflect.set(target, property, stored, receiver);

				if (wrote && this.isCurrent(root)) {
					this.notify();
				}

				return wrote;
			},

			deleteProperty: (target, property) => {
				if (!Reflect.has(target, property)) {
					return true;
				}

				const deleted = Reflect.deleteProperty(target, property);

				if (deleted && this.isCurrent(root)) {
					this.notify();
				}

				return deleted;
			}
		});

		this.proxies.set(value, proxy);
		rawByProxy.set(proxy, value);

		return proxy;
	}
}
