export interface ResourceRef {
	readonly rid: string;
	readonly rtype: string;
}

export interface DeviceLights {
	readonly id: string;
	readonly services: readonly ResourceRef[];
}

/** Light ids that belong to a room or zone, in child order. */
export class ChildLights {
	private readonly byDevice = new Map<string, readonly string[]>();

	replace(devices: readonly DeviceLights[]): void {
		this.byDevice.clear();

		for (const device of devices) {
			const lightIds = device.services
				.filter((service) => service.rtype === 'light')
				.map((service) => service.rid);

			this.byDevice.set(device.id, Object.freeze(lightIds));
		}
	}

	ids(children: readonly ResourceRef[]): readonly string[] {
		const lightIds: string[] = [];

		for (const child of children) {
			if (child.rtype === 'light') {
				lightIds.push(child.rid);
				continue;
			}

			if (child.rtype === 'device') {
				lightIds.push(...(this.byDevice.get(child.rid) ?? []));
			}
		}

		return Object.freeze(lightIds);
	}
}
