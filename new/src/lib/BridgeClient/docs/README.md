# Hue CLIP API version v2

https://{bridge}/clip/v2

- **bridge**: *(required, string)*
  The ip address or hostname of the bridge

## Common types

- [Common types](./common.md): APIError, ResourceIdentifier, ErrorResponse, ResourceIdentifierResponse

## Resources

- [`/resource`](./resource.md) — API to retrieve all API resources
- [`/resource/light`](./light.md) — API to manage light services. These are offered by devices with lighting capabilities.
- [`/resource/scene`](./scene.md) — API to manage scenes. Scenes are used to store and recall settings for a group of lights.
- [`/resource/room`](./room.md) — API to manage rooms. Rooms group devices and each device can only be part of one room.
- [`/resource/zone`](./zone.md) — API to manage zones. Zones group services and each service can be part of multiple zones.
- [`/resource/bridge_home`](./bridge_home.md) — API to manage bridge homes. Homes group rooms as well as devices not assigned to a room.
- [`/resource/grouped_light`](./grouped_light.md) — API to manage grouped light services. These are offered by rooms, zones, and homes.
- [`/resource/device`](./device.md) — API to manage devices. Devices have device level properties and offer services such as light. Bridge device cannot be deleted.
- [`/resource/bridge`](./bridge.md) — API to manage the bridge
- [`/resource/device_software_update`](./device_software_update.md) — API to manage device update services. These services are present for devices that support software update.
- [`/resource/device_power`](./device_power.md) — API to manage device power services. These are offered by battery powered devices.
- [`/resource/zigbee_connectivity`](./zigbee_connectivity.md) — API to manage zigbee connectivity services. These are offered by zigbee connected devices.
- [`/resource/zgp_connectivity`](./zgp_connectivity.md) — API to manage zgp connectivity services. These are offered by zigbee green power devices.
- [`/resource/zigbee_device_discovery`](./zigbee_device_discovery.md) — API to manage zigbee device discovery service. This is offered by the bridge for commissioning.
- [`/resource/motion`](./motion.md) — API to manage motion services. These are offered by devices with motion sensing capabilities.
- [`/resource/service_group`](./service_group.md) — API to manage service group services. These are services that aggregate their distinct children into grouped services. For example, adding one or more motion services as children will result in a grouped_motion service that aggregates the motions service report.
- [`/resource/grouped_motion`](./grouped_motion.md) — API to manage grouped motion services. These are offered by service groups with archetype “sensor_group”.
- [`/resource/grouped_light_level`](./grouped_light_level.md) — API to manage grouped light-level services. These are offered by service groups with archetype “sensor_group”.
- [`/resource/camera_motion`](./camera_motion.md) — API to manage camera_motion services. These are offered by devices with camera based motion sensing capabilities.
- [`/resource/temperature`](./temperature.md) — API to manage temperature services. These are offered by devices with temperature sensing capabilities.
- [`/resource/light_level`](./light_level.md) — API to manage light level services. These are offered by devices with light level sensing capabilities.
- [`/resource/button`](./button.md) — API to manage button services. These are offered by devices with buttons.
- [`/resource/bell_button`](./bell_button.md) — API to manage button services. These are offered by devices with buttons.
- [`/resource/relative_rotary`](./relative_rotary.md) — API to manage relative rotary services. These are offered by devices with rotary capabilities.
- [`/resource/switch_input_configuration`](./switch_input_configuration.md) — API to manage switch input configuration services. These are offered by devices with configurable switch modes.
- [`/resource/power_output_configuration`](./power_output_configuration.md) — API to manage power output configuration services. These are offered by devices with configurable power output modes.
- [`/resource/behavior_script`](./behavior_script.md) — API to discover firmware embedded scripts that can be instantiated.
- [`/resource/behavior_script_formula`](./behavior_script_formula.md) — API to manage user-authored HSL formula scripts. This endpoint is separate from /behavior_script, which remains scoped to firmware-embedded scripts. Formula creation is currently restricted.
- [`/resource/behavior_instance`](./behavior_instance.md) — API to manage instances of script. When a behavior_instance references a behavior_script_formula, deleting either resource also deletes the other.
- [`/resource/geofence_client`](./geofence_client.md) — API for geofencing functionality
- [`/resource/geolocation`](./geolocation.md) — API for setting the geolocation
- [`/resource/entertainment_configuration`](./entertainment_configuration.md) — API to manage entertainment configurations, used for Hue Entertainment functionality
- [`/resource/entertainment`](./entertainment.md) — API to manage entertainment services. These are offered by devices with color lighting capabilities.
- [`/resource/homekit`](./homekit.md) — API to manage homekit service
- [`/resource/matter`](./matter.md) — API to manage matter service
- [`/resource/matter_fabric`](./matter_fabric.md) — API to manage matter fabrics
- [`/resource/smart_scene`](./smart_scene.md) — API to manage smart scenes
- [`/resource/contact`](./contact.md) — API to manage contact sensor state for general purpose cases. These are offered by devices that have a static “switch” position. Not necessarily a physical switch.
- [`/resource/tamper`](./tamper.md) — API to manage device tamper state. Offered by devices capable of detecting tampering.
- [`/resource/motion_area_configuration`](./motion_area_configuration.md) — API to manage motion area's
- [`/resource/motion_area_candidate`](./motion_area_candidate.md) — API to manage motion area services of lights
- [`/resource/convenience_area_motion`](./convenience_area_motion.md) — API to motion area based motion sensors for convenience use case
- [`/resource/security_area_motion`](./security_area_motion.md) — API to motion area based motion sensors for security use case
- [`/resource/speaker`](./speaker.md) — API to manage speaker services. These are offered by devices with speakers.
- [`/resource/clip`](./clip.md) — API to reflect public clip services
- [`/resource/wifi_connectivity`](./wifi_connectivity.md) — API to expose wifi_connectivity status
