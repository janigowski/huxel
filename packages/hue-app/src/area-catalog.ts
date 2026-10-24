import type { GroupedLightGet } from 'hue-sdk';
import type { ChildLights, ResourceRef } from './child-lights';
import { xyColorFrom, type XyColor } from './color';
import type { BridgeArea } from './gateway';

export interface AreaGroup {
	id: string;
	metadata: { name: string };
	services: readonly { rid: string; rtype: string }[];
	children: readonly ResourceRef[];
}

export interface AreaControl {
	isOn?: boolean;
	brightness?: number;
	color?: XyColor;
}

export class AreaCatalog {
	join(
		groups: readonly AreaGroup[],
		lights: readonly GroupedLightGet[],
		children: ChildLights
	): BridgeArea[] {
		const grouped = new Map(lights.map((light) => [light.id, light]));
		const areas: BridgeArea[] = [];

		for (const group of groups) {
			const serviceId = this.groupedLightId(group.services);
			const light = serviceId ? grouped.get(serviceId) : undefined;
			if (!serviceId || !light) {
				continue;
			}

			areas.push(
				this.fromGroupedLight(
					group.id,
					group.metadata.name,
					serviceId,
					light,
					children.ids(group.children)
				)
			);
		}

		return areas;
	}

	groupedLightId(services: readonly { rid: string; rtype: string }[]): string | undefined {
		return services.find((service) => service.rtype === 'grouped_light')?.rid;
	}

	fromGroupedLight(
		id: string,
		name: string,
		serviceId: string,
		light: GroupedLightGet,
		children: readonly string[],
		overlay?: AreaControl
	): BridgeArea {
		const area: BridgeArea = {
			id,
			name,
			serviceId,
			isOn: light.on?.on ?? false,
			brightness: typeof light.dimming?.brightness === 'number' ? light.dimming.brightness : null,
			color: xyColorFrom(light.color?.xy),
			children
		};

		return overlay ? { ...area, ...overlay } : area;
	}
}
