import type { ResourceIdentifier } from './common';

export type WeekDay =
	| 'monday'
	| 'tuesday'
	| 'wednesday'
	| 'thursday'
	| 'friday'
	| 'saturday'
	| 'sunday';

export type SmartSceneStartTimeKind = 'time' | 'sunset';

export type SmartSceneRecallAction = 'activate' | 'deactivate';

export type SmartSceneState = 'active' | 'inactive';

export interface SmartSceneTimeGet {
	/** minimum: 0, maximum: 23 */
	hour: number;
	/** minimum: 0, maximum: 59 */
	minute: number;
	/** minimum: 0, maximum: 59 */
	second: number;
}

export interface SmartSceneTimePost {
	/** minimum: 0, maximum: 23 */
	hour: number;
	/** minimum: 0, maximum: 59 */
	minute: number;
	/** minimum: 0, maximum: 59 */
	second: number;
}

export interface SmartSceneTimePut {
	/** minimum: 0, maximum: 23 */
	hour: number;
	/** minimum: 0, maximum: 59 */
	minute: number;
	/** minimum: 0, maximum: 59 */
	second?: number;
}

export interface SmartSceneStartTimeGet {
	kind: SmartSceneStartTimeKind;
	/** this property is only used when property “kind” is “time” */
	time: SmartSceneTimeGet;
}

export interface SmartSceneStartTimePost {
	kind: SmartSceneStartTimeKind;
	/** this property is only used when property “kind” is “time” */
	time?: SmartSceneTimePost;
}

export interface SmartSceneStartTimePut {
	kind: SmartSceneStartTimeKind;
	/** this property is only used when property “kind” is “time” */
	time?: SmartSceneTimePut;
}

export interface SmartSceneTimeslotGet {
	start_time: SmartSceneStartTimeGet;
	/** The identifier of the scene to recall */
	target: ResourceIdentifier;
}

export interface SmartSceneTimeslotPost {
	start_time: SmartSceneStartTimePost;
	/** The identifier of the scene to recall */
	target: ResourceIdentifier;
}

export interface SmartSceneTimeslotPut {
	start_time: SmartSceneStartTimePut;
	/** The identifier of the scene to recall */
	target: ResourceIdentifier;
}

export interface DayTimeslotsGet {
	timeslots: SmartSceneTimeslotGet[];
	recurrence: WeekDay[];
}

export interface DayTimeslotsPost {
	timeslots: SmartSceneTimeslotPost[];
	recurrence: WeekDay[];
}

export interface DayTimeslotsPut {
	timeslots: SmartSceneTimeslotPut[];
	recurrence: WeekDay[];
}

export interface SmartSceneMetadataGet {
	/** Human readable name of a resource. minLength: 1, maxLength: 32 */
	name: string;
	/** Reference with unique identifier for the image representing the scene only accepting “rtype”: “public_image” on creation */
	image?: ResourceIdentifier;
	/** Application specific data. Free format string. minLength: 1, maxLength: 16 */
	appdata?: string;
}

export interface SmartSceneMetadataPost {
	/** Human readable name of a resource. minLength: 1, maxLength: 32 */
	name: string;
	/** Reference with unique identifier for the image representing the scene only accepting “rtype”: “public_image” on creation */
	image?: ResourceIdentifier;
	/** Application specific data. Free format string. minLength: 1, maxLength: 16 */
	appdata?: string;
}

export interface SmartSceneMetadataPut {
	/** Human readable name of a resource. minLength: 1, maxLength: 32 */
	name?: string;
	/** Application specific data. Free format string. minLength: 1, maxLength: 16 */
	appdata?: string;
}

/** the active time slot in execution */
export interface SmartSceneActiveTimeslot {
	timeslot_id: number;
	weekday: WeekDay;
}

export interface SmartSceneRecallPost {
	/** Activate will start the smart (24h) scene; deactivate will stop it */
	action: SmartSceneRecallAction;
}

export interface SmartSceneRecallPut {
	/** Activate will start the smart (24h) scene; deactivate will stop it */
	action?: SmartSceneRecallAction;
}

export interface SmartSceneGet {
	/** Unique identifier representing a specific resource instance. Pattern: `^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$` */
	id: string;
	/** Clip v1 resource identifier. Pattern: `^(\/[a-z]{4,32}\/[0-9a-zA-Z-]{1,32})?$` */
	id_v1?: string;
	/** Type of the supported resources */
	type: 'smart_scene';
	metadata: SmartSceneMetadataGet;
	/** Group associated with this Scene. All services in the group are part of this scene. If the group is changed the scene is update (e.g. light added/removed) */
	group: ResourceIdentifier;
	/** information on what is the light state for every timeslot of the day */
	week_timeslots: DayTimeslotsGet[];
	/** duration of the transition from on one timeslot's scene to the other (defaults to 60000ms) */
	transition_duration: number;
	/** the active time slot in execution */
	active_timeslot?: SmartSceneActiveTimeslot;
	/** the current state of the smart scene. The default state is `inactive` if no `recall` is provided */
	state: SmartSceneState;
}

export interface SmartScenePost {
	/** Type of the supported resources */
	type?: 'smart_scene';
	metadata: SmartSceneMetadataPost;
	/** Group associated with this Scene. All services in the group are part of this scene. If the group is changed the scene is update (e.g. light added/removed) */
	group: ResourceIdentifier;
	/** information on what is the light state for every timeslot of the day */
	week_timeslots: DayTimeslotsPost[];
	/** duration of the transition from on one timeslot's scene to the other (defaults to 60000ms) */
	transition_duration?: number;
	recall?: SmartSceneRecallPost;
}

export interface SmartScenePut {
	/** Unique identifier representing a specific resource instance. Pattern: `^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$` */
	id?: string;
	/** Type of the supported resources */
	type?: 'smart_scene';
	metadata?: SmartSceneMetadataPut;
	/** information on what is the light state for every timeslot of the day */
	week_timeslots?: DayTimeslotsPut[];
	/** duration of the transition from on one timeslot's scene to the other (defaults to 60000ms) */
	transition_duration?: number;
	recall?: SmartSceneRecallPut;
}
