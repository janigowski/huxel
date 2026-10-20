# /resource/device

API to manage devices. Devices have device level properties and offer services such as light. Bridge device cannot be deleted.

## /resource/device

### GET /resource/device

List all resources of this type

> Secured by hue-application-key API authorization using a hue-application-key header

#### Response

##### HTTP status code 200

Request was on resource path was successful. Result of request is in data.

###### Body

**Media type**: application/json

**Type**: object

**Properties**

- **errors**: *(required, array of [APIError](./common.md#apierror))*
- **data**: *(required, array of DeviceGet)*
  **Items**: DeviceGet
  - **id**: *(required, string – pattern: ^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$)*
    Unique identifier representing a specific resource instance
  - **id_v1**: *(string – pattern: ^(\/[a-z]{4,32}\/[0-9a-zA-Z-]{1,32})?$)*
    Clip v1 resource identifier
  - **type**: *(required, device)*
    Type of the supported resources
  - **product_data**: *(required, object)*
    - **model_id**: *(required, string)*
      unique identification of device model
    - **manufacturer_name**: *(required, string)*
      Name of device manufacturer
    - **product_name**: *(required, string)*
      Name of the product.
    - **product_archetype**: *(required, one of bridge_v2, bridge_v3, unknown_archetype, classic_bulb, sultan_bulb, flood_bulb, spot_bulb, candle_bulb, luster_bulb, pendant_round, pendant_long, ceiling_round, ceiling_square, floor_shade, floor_lantern, table_shade, recessed_ceiling, recessed_floor, single_spot, double_spot, table_wash, wall_lantern, wall_shade, flexible_lamp, ground_spot, wall_spot, plug, hue_go, hue_lightstrip, hue_iris, hue_bloom, bollard, wall_washer, hue_play, hue_chime, vintage_bulb, vintage_candle_bulb, ellipse_bulb, triangle_bulb, small_globe_bulb, large_globe_bulb, edison_bulb, christmas_tree, string_light, hue_centris, hue_lightstrip_tv, hue_lightstrip_pc, hue_tube, hue_signe, pendant_spot, ceiling_horizontal, ceiling_tube, up_and_down, up_and_down_up, up_and_down_down, hue_floodlight_camera, twilight, twilight_front, twilight_back, hue_play_wallwasher, hue_omniglow, hue_neon, string_globe, string_permanent, hue_go_xxl, hue_switch_module, rigid_tube, flexible_tube, panels, pendant_tube, vertical_tube, recessed_ceiling_tube, wall_rectangle, string_icicle, string_grid, string_net, hue_omniglow_arc, hue_flux_arc)*
      Archetype of the product
    - **certified**: *(required, boolean)*
      This device is Hue certified
    - **software_version**: *(required, string – pattern: \d+\.\d+\.\d+)*
      Software version of the product
    - **hardware_platform_type**: *(string)*
      Hardware type; identified by Manufacturer code and ImageType
    **Example**:
    ```json
    {
      "model_id": "LCB001",
      "manufacturer_name": "Signify Netherlands B.V.",
      "product_name": "Hue color downlight",
      "product_archetype": "flood_bulb",
      "certified": true,
      "software_version": "1.122.8",
      "hardware_platform_type": "100b-112"
    }
    ```
  - **metadata**: *(required, object)*
    Additional metadata including a user given name
    - **name**: *(required, string – minLength: 1 – maxLength: 32)*
      Human readable name of a resource
    - **archetype**: *(required, one of bridge_v2, bridge_v3, unknown_archetype, classic_bulb, sultan_bulb, flood_bulb, spot_bulb, candle_bulb, luster_bulb, pendant_round, pendant_long, ceiling_round, ceiling_square, floor_shade, floor_lantern, table_shade, recessed_ceiling, recessed_floor, single_spot, double_spot, table_wash, wall_lantern, wall_shade, flexible_lamp, ground_spot, wall_spot, plug, hue_go, hue_lightstrip, hue_iris, hue_bloom, bollard, wall_washer, hue_play, hue_chime, vintage_bulb, vintage_candle_bulb, ellipse_bulb, triangle_bulb, small_globe_bulb, large_globe_bulb, edison_bulb, christmas_tree, string_light, hue_centris, hue_lightstrip_tv, hue_lightstrip_pc, hue_tube, hue_signe, pendant_spot, ceiling_horizontal, ceiling_tube, up_and_down, up_and_down_up, up_and_down_down, hue_floodlight_camera, twilight, twilight_front, twilight_back, hue_play_wallwasher, hue_omniglow, hue_neon, string_globe, string_permanent, hue_go_xxl, hue_switch_module, rigid_tube, flexible_tube, panels, pendant_tube, vertical_tube, recessed_ceiling_tube, wall_rectangle, string_icicle, string_grid, string_net, hue_omniglow_arc, hue_flux_arc)*
      By default archetype given by manufacturer. Can be changed by user.
  - **identify**: *(required, object)*
  - **usertest**: *(object)*
    - **status**: *(required, one of set, changing)*
    - **usertest**: *(required, boolean)*
      Activates or extends user usertest mode of device for 120 seconds. false deactivates usertest mode. In usertest mode, devices report changes in state faster and indicate state changes on device LED (if applicable)
  - **device_mode**: *(object)*
    Deprecated. Use switch_mode in SwitchInputConfiguration.
    - **status**: *(required, one of set, changing)*
    - **mode**: *(required, one of switch_single_rocker, switch_single_pushbutton, switch_dual_rocker, switch_dual_pushbutton, switch_none)*
      Current mode (on read) or requested mode (on write) of the switch
    - **mode_values**: *(required, array of SwitchModeType)*
      The modes that the switch supports
  - **services**: *(required, array of [ResourceIdentifier](./common.md#resourceidentifier))*
    References all services providing control and state of the device.
  - **geometry**: *(object)*
    Data describing geometry information of the device. Only positioning of lightservices is supported.
    - **objects**: *(array of GeometryObject)*
      **Items**: GeometryObject
      - **reference**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
      - **transform**: *(required, object)*
        - **position**: *(required, object)*
          A 3D coordinate in space in meters.
          - **x**: *(required, number)*
          - **y**: *(required, number)*
          - **z**: *(required, number)*
        - **rotation**: *(required, object)*
          A quaternion representing rotation in 3D space.
          - **x**: *(required, number – minimum: -1 – maximum: 1)*
          - **y**: *(required, number – minimum: -1 – maximum: 1)*
          - **z**: *(required, number – minimum: -1 – maximum: 1)*
          - **w**: *(required, number – minimum: -1 – maximum: 1)*

##### HTTP status code 401

Client is not authorized

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

##### HTTP status code 403

Client is not allowed to perform operation on this resource.

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

##### HTTP status code 404

Resource or resource path does not exist

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

##### HTTP status code 405

Method is not supported by the resource

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

##### HTTP status code 406

Query parameter has invalid value.

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

##### HTTP status code 409

Request conflict with the current state of the target resource

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

##### HTTP status code 429

Too many requests

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

##### HTTP status code 500

Internal Server Error

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

##### HTTP status code 503

Busy, try again later.

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

##### HTTP status code 507

Insufficient resources

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

#### Security

#### Secured by hue-application-key

###### Headers

- **hue-application-key**: *(required, string)*
  API token

## /resource/device/{id}

API calls to read, update and delete a resource instance

### DELETE /resource/device/{id}

> Secured by hue-application-key API authorization using a hue-application-key header

#### Request

###### URI Parameters

- **id**: *(required, string)*

#### Response

##### HTTP status code 200

Resource has been deleted

###### Body

**Media type**: application/json

**Type**: [ResourceIdentifierResponse](./common.md#resourceidentifierresponse)

##### HTTP status code 401

Client is not authorized

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

##### HTTP status code 403

Client is not allowed to perform operation on this resource.

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

##### HTTP status code 404

Resource or resource path does not exist

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

##### HTTP status code 405

Method is not supported by the resource

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

##### HTTP status code 409

Request conflict with the current state of the target resource

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

##### HTTP status code 429

Too many requests

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

##### HTTP status code 500

Internal Server Error

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

##### HTTP status code 503

Busy, try again later.

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

##### HTTP status code 507

Insufficient resources

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

#### Security

#### Secured by hue-application-key

###### Headers

- **hue-application-key**: *(required, string)*
  API token

### PUT /resource/device/{id}

> Secured by hue-application-key API authorization using a hue-application-key header

#### Request

###### URI Parameters

- **id**: *(required, string)*

###### Body

**Media type**: application/json

**Type**: object

**Properties**

- **id**: *(string – pattern: ^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$)*
  Unique identifier representing a specific resource instance
- **type**: *(device)*
  Type of the supported resources
- **metadata**: *(object)*
  Additional metadata including a user given name
  - **name**: *(string – minLength: 1 – maxLength: 32)*
    Human readable name of a resource
  - **archetype**: *(one of bridge_v2, bridge_v3, unknown_archetype, classic_bulb, sultan_bulb, flood_bulb, spot_bulb, candle_bulb, luster_bulb, pendant_round, pendant_long, ceiling_round, ceiling_square, floor_shade, floor_lantern, table_shade, recessed_ceiling, recessed_floor, single_spot, double_spot, table_wash, wall_lantern, wall_shade, flexible_lamp, ground_spot, wall_spot, plug, hue_go, hue_lightstrip, hue_iris, hue_bloom, bollard, wall_washer, hue_play, hue_chime, vintage_bulb, vintage_candle_bulb, ellipse_bulb, triangle_bulb, small_globe_bulb, large_globe_bulb, edison_bulb, christmas_tree, string_light, hue_centris, hue_lightstrip_tv, hue_lightstrip_pc, hue_tube, hue_signe, pendant_spot, ceiling_horizontal, ceiling_tube, up_and_down, up_and_down_up, up_and_down_down, hue_floodlight_camera, twilight, twilight_front, twilight_back, hue_play_wallwasher, hue_omniglow, hue_neon, string_globe, string_permanent, hue_go_xxl, hue_switch_module, rigid_tube, flexible_tube, panels, pendant_tube, vertical_tube, recessed_ceiling_tube, wall_rectangle, string_icicle, string_grid, string_net, hue_omniglow_arc, hue_flux_arc)*
    By default archetype given by manufacturer. Can be changed by user.
- **identify**: *(object)*
  - **action**: *(required, identify)*
    - identify: Triggers a visual identification sequence, current implemented as (which can change in the future): Bridge performs Zigbee LED identification cycles for 5 seconds Lights perform one breathe cycle Sensors perform LED identification cycles for 15 seconds
  - **duration**: *(integer)*
    Duration in milliseconds to perform the identify cycle.
    **Example**:
    ```
    800
    ```
- **usertest**: *(object)*
  - **usertest**: *(boolean)*
    Activates or extends user usertest mode of device for 120 seconds. false deactivates usertest mode. In usertest mode, devices report changes in state faster and indicate state changes on device LED (if applicable)
- **device_mode**: *(object)*
  Deprecated. Use switch_mode in SwitchInputConfiguration.
  - **mode**: *(required, one of switch_single_rocker, switch_single_pushbutton, switch_dual_rocker, switch_dual_pushbutton, switch_none)*
    Current mode (on read) or requested mode (on write) of the switch
- **geometry**: *(object)*
  Data describing geometry information of the device. Only positioning of lightservices is supported.
  - **objects**: *(array of GeometryObject)*
    **Items**: GeometryObject
    - **reference**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
    - **transform**: *(required, object)*
      - **position**: *(required, object)*
        A 3D coordinate in space in meters.
        - **x**: *(required, number)*
        - **y**: *(required, number)*
        - **z**: *(required, number)*
      - **rotation**: *(required, object)*
        A quaternion representing rotation in 3D space.
        - **x**: *(required, number – minimum: -1 – maximum: 1)*
        - **y**: *(required, number – minimum: -1 – maximum: 1)*
        - **z**: *(required, number – minimum: -1 – maximum: 1)*
        - **w**: *(required, number – minimum: -1 – maximum: 1)*

#### Response

##### HTTP status code 200

Request was on resource path was successful.

###### Body

**Media type**: application/json

**Type**: [ResourceIdentifierResponse](./common.md#resourceidentifierresponse)

##### HTTP status code 207

Request was partially successful, resource has been updated. Failed requests and errors are listed in error object.

###### Body

**Media type**: application/json

**Type**: [ResourceIdentifierResponse](./common.md#resourceidentifierresponse)

##### HTTP status code 400

Request was on resource path was unsuccessful, body of request contains errors.

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

##### HTTP status code 401

Client is not authorized

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

##### HTTP status code 403

Client is not allowed to perform operation on this resource.

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

##### HTTP status code 404

Resource or resource path does not exist

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

##### HTTP status code 405

Method is not supported by the resource

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

##### HTTP status code 409

Request conflict with the current state of the target resource

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

##### HTTP status code 429

Too many requests

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

##### HTTP status code 500

Internal Server Error

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

##### HTTP status code 503

Busy, try again later.

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

##### HTTP status code 507

Insufficient resources

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

#### Security

#### Secured by hue-application-key

###### Headers

- **hue-application-key**: *(required, string)*
  API token

### GET /resource/device/{id}

> Secured by hue-application-key API authorization using a hue-application-key header

#### Request

###### URI Parameters

- **id**: *(required, string)*

#### Response

##### HTTP status code 200

Request was on resource path was successful. Result of request is in data.

###### Body

**Media type**: application/json

**Type**: object

**Properties**

- **errors**: *(required, array of [APIError](./common.md#apierror))*
- **data**: *(required, array of DeviceGet)*
  **Items**: DeviceGet
  - **id**: *(required, string – pattern: ^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$)*
    Unique identifier representing a specific resource instance
  - **id_v1**: *(string – pattern: ^(\/[a-z]{4,32}\/[0-9a-zA-Z-]{1,32})?$)*
    Clip v1 resource identifier
  - **type**: *(required, device)*
    Type of the supported resources
  - **product_data**: *(required, object)*
    - **model_id**: *(required, string)*
      unique identification of device model
    - **manufacturer_name**: *(required, string)*
      Name of device manufacturer
    - **product_name**: *(required, string)*
      Name of the product.
    - **product_archetype**: *(required, one of bridge_v2, bridge_v3, unknown_archetype, classic_bulb, sultan_bulb, flood_bulb, spot_bulb, candle_bulb, luster_bulb, pendant_round, pendant_long, ceiling_round, ceiling_square, floor_shade, floor_lantern, table_shade, recessed_ceiling, recessed_floor, single_spot, double_spot, table_wash, wall_lantern, wall_shade, flexible_lamp, ground_spot, wall_spot, plug, hue_go, hue_lightstrip, hue_iris, hue_bloom, bollard, wall_washer, hue_play, hue_chime, vintage_bulb, vintage_candle_bulb, ellipse_bulb, triangle_bulb, small_globe_bulb, large_globe_bulb, edison_bulb, christmas_tree, string_light, hue_centris, hue_lightstrip_tv, hue_lightstrip_pc, hue_tube, hue_signe, pendant_spot, ceiling_horizontal, ceiling_tube, up_and_down, up_and_down_up, up_and_down_down, hue_floodlight_camera, twilight, twilight_front, twilight_back, hue_play_wallwasher, hue_omniglow, hue_neon, string_globe, string_permanent, hue_go_xxl, hue_switch_module, rigid_tube, flexible_tube, panels, pendant_tube, vertical_tube, recessed_ceiling_tube, wall_rectangle, string_icicle, string_grid, string_net, hue_omniglow_arc, hue_flux_arc)*
      Archetype of the product
    - **certified**: *(required, boolean)*
      This device is Hue certified
    - **software_version**: *(required, string – pattern: \d+\.\d+\.\d+)*
      Software version of the product
    - **hardware_platform_type**: *(string)*
      Hardware type; identified by Manufacturer code and ImageType
    **Example**:
    ```json
    {
      "model_id": "LCB001",
      "manufacturer_name": "Signify Netherlands B.V.",
      "product_name": "Hue color downlight",
      "product_archetype": "flood_bulb",
      "certified": true,
      "software_version": "1.122.8",
      "hardware_platform_type": "100b-112"
    }
    ```
  - **metadata**: *(required, object)*
    Additional metadata including a user given name
    - **name**: *(required, string – minLength: 1 – maxLength: 32)*
      Human readable name of a resource
    - **archetype**: *(required, one of bridge_v2, bridge_v3, unknown_archetype, classic_bulb, sultan_bulb, flood_bulb, spot_bulb, candle_bulb, luster_bulb, pendant_round, pendant_long, ceiling_round, ceiling_square, floor_shade, floor_lantern, table_shade, recessed_ceiling, recessed_floor, single_spot, double_spot, table_wash, wall_lantern, wall_shade, flexible_lamp, ground_spot, wall_spot, plug, hue_go, hue_lightstrip, hue_iris, hue_bloom, bollard, wall_washer, hue_play, hue_chime, vintage_bulb, vintage_candle_bulb, ellipse_bulb, triangle_bulb, small_globe_bulb, large_globe_bulb, edison_bulb, christmas_tree, string_light, hue_centris, hue_lightstrip_tv, hue_lightstrip_pc, hue_tube, hue_signe, pendant_spot, ceiling_horizontal, ceiling_tube, up_and_down, up_and_down_up, up_and_down_down, hue_floodlight_camera, twilight, twilight_front, twilight_back, hue_play_wallwasher, hue_omniglow, hue_neon, string_globe, string_permanent, hue_go_xxl, hue_switch_module, rigid_tube, flexible_tube, panels, pendant_tube, vertical_tube, recessed_ceiling_tube, wall_rectangle, string_icicle, string_grid, string_net, hue_omniglow_arc, hue_flux_arc)*
      By default archetype given by manufacturer. Can be changed by user.
  - **identify**: *(required, object)*
  - **usertest**: *(object)*
    - **status**: *(required, one of set, changing)*
    - **usertest**: *(required, boolean)*
      Activates or extends user usertest mode of device for 120 seconds. false deactivates usertest mode. In usertest mode, devices report changes in state faster and indicate state changes on device LED (if applicable)
  - **device_mode**: *(object)*
    Deprecated. Use switch_mode in SwitchInputConfiguration.
    - **status**: *(required, one of set, changing)*
    - **mode**: *(required, one of switch_single_rocker, switch_single_pushbutton, switch_dual_rocker, switch_dual_pushbutton, switch_none)*
      Current mode (on read) or requested mode (on write) of the switch
    - **mode_values**: *(required, array of SwitchModeType)*
      The modes that the switch supports
  - **services**: *(required, array of [ResourceIdentifier](./common.md#resourceidentifier))*
    References all services providing control and state of the device.
  - **geometry**: *(object)*
    Data describing geometry information of the device. Only positioning of lightservices is supported.
    - **objects**: *(array of GeometryObject)*
      **Items**: GeometryObject
      - **reference**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
      - **transform**: *(required, object)*
        - **position**: *(required, object)*
          A 3D coordinate in space in meters.
          - **x**: *(required, number)*
          - **y**: *(required, number)*
          - **z**: *(required, number)*
        - **rotation**: *(required, object)*
          A quaternion representing rotation in 3D space.
          - **x**: *(required, number – minimum: -1 – maximum: 1)*
          - **y**: *(required, number – minimum: -1 – maximum: 1)*
          - **z**: *(required, number – minimum: -1 – maximum: 1)*
          - **w**: *(required, number – minimum: -1 – maximum: 1)*

##### HTTP status code 401

Client is not authorized

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

##### HTTP status code 403

Client is not allowed to perform operation on this resource.

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

##### HTTP status code 404

Resource or resource path does not exist

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

##### HTTP status code 405

Method is not supported by the resource

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

##### HTTP status code 409

Request conflict with the current state of the target resource

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

##### HTTP status code 429

Too many requests

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

##### HTTP status code 500

Internal Server Error

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

##### HTTP status code 503

Busy, try again later.

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

##### HTTP status code 507

Insufficient resources

###### Body

**Media type**: application/json

**Type**: [ErrorResponse](./common.md#errorresponse)

#### Security

#### Secured by hue-application-key

###### Headers

- **hue-application-key**: *(required, string)*
  API token
