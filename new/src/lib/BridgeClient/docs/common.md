# Common types

Types shared across resources. Resource files reference them by name.

## APIError

**Type**: object

**Properties**

- **description**: *(required, string)*
  A human-readable explanation specific to this occurrence of the problem.
- **error_code**: *(required, one of communication_error, attribute_may_have_no_effect, client_error, internal_error)*
  An error code associated with the problem for client handling.

## ResourceIdentifier

**Type**: object

**Properties**

- **rid**: *(required, string – pattern: ^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$)*
  The unique id of the referenced resource
- **rtype**: *(required, one of device, bridge_home, room, zone, service_group, light, button, bell_button, relative_rotary, temperature, light_level, motion, camera_motion, entertainment, contact, tamper, convenience_area_motion, security_area_motion, speaker, switch_input_configuration, power_output_configuration, grouped_light, grouped_motion, grouped_light_level, device_power, device_software_update, zigbee_connectivity, zgp_connectivity, bridge, motion_area_candidate, wifi_connectivity, zigbee_device_discovery, homekit, matter, matter_fabric, scene, entertainment_configuration, public_image, auth_v1, behavior_script, behavior_script_formula, behavior_instance, geofence_client, geolocation, smart_scene, motion_area_configuration, clip)*
  The type of the referenced resource

## ErrorResponse

**Type**: object

**Properties**

- **errors**: *(required, array of [APIError](#apierror))*

## ResourceIdentifierResponse

**Type**: object

**Properties**

- **errors**: *(required, array of [APIError](#apierror))*
- **data**: *(required, array of [ResourceIdentifier](#resourceidentifier))*
