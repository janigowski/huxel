# /resource/entertainment_configuration

API to manage entertainment configurations, used for Hue Entertainment functionality

## /resource/entertainment_configuration

### POST /resource/entertainment_configuration

create a new resource of this type

> Secured by hue-application-key API authorization using a hue-application-key header

#### Request

###### Body

**Media type**: application/json

**Type**: object

**Properties**

- **type**: *(entertainment_configuration)*
  Type of the supported resources
- **metadata**: *(required, object)*
  - **name**: *(required, string – minLength: 1 – maxLength: 32)*
    Friendly name of the entertainment configuration
- **configuration_type**: *(required, one of screen, monitor, music, 3dspace, other)*
  Defines for which type of application this channel assignment was optimized for “screen”: Channels are organized around content from a screen “monitor”: Channels are organized around content from one or several monitors “music”: Channels are organized for music synchronization “3dspace: Channels are organized to provide 3d spacial effects “other”: General use case
- **stream_proxy**: *(object)*
  - **mode**: *(required, one of auto, manual)*
    Proxymode used for this group
    - auto – The bridge will select a proxynode automatically. – manual – The proxynode has been set manually
  - **node**: *([ResourceIdentifier](./common.md#resourceidentifier))*
    Reference to the device acting as proxy The proxynode relays the entertainment traffic and should be located in or close to all entertainment lamps in this group. The proxynode set by the application (manual) resp selected by the bridge (auto). Writing sets proxymode to “manual”. Is not allowed to be combined with attribute “proxymode”:”auto” Can be type BridgeDevice or ZigbeeDevice
- **locations**: *(required, object)*
  Entertainment services of the lights that are in the zone have locations
  - **service_locations**: *(required, array of ServiceLocationPost)*
    **Items**: ServiceLocationPost
    - **service**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
    - **positions**: *(required, array of Position – minItems: 1 – maxItems: 2)*
      Describes the location of the service.
      **Items**: Position
      - **x**: *(required, number – minimum: -1 – maximum: 1)*
        Coordinate of a single axis
      - **y**: *(required, number – minimum: -1 – maximum: 1)*
        Coordinate of a single axis
      - **z**: *(required, number – minimum: -1 – maximum: 1)*
        Coordinate of a single axis
    - **equalization_factor**: *(number – default: 1 – maximum: 1)*
      Relative equalization factor applied to the entertainment service, to compensate for differences in brightness in the entertainment configuration. Value cannot be 0, writing 0 changes it to lowest possible value.

#### Response

##### HTTP status code 201

Resource has been created

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

### GET /resource/entertainment_configuration

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
- **data**: *(required, array of EntertainmentConfigurationGet)*
  **Items**: EntertainmentConfigurationGet
  - **id**: *(required, string – pattern: ^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$)*
    Unique identifier representing a specific resource instance
  - **id_v1**: *(string – pattern: ^(\/[a-z]{4,32}\/[0-9a-zA-Z-]{1,32})?$)*
    Clip v1 resource identifier
  - **type**: *(required, entertainment_configuration)*
    Type of the supported resources
  - **metadata**: *(required, object)*
    - **name**: *(required, string – minLength: 1 – maxLength: 32)*
      Friendly name of the entertainment configuration
  - **name**: *(string – minLength: 1 – maxLength: 32)*
    Friendly name of the entertainment configuration Deprecated: use metadata/name
  - **configuration_type**: *(required, one of screen, monitor, music, 3dspace, other)*
    Defines for which type of application this channel assignment was optimized for “screen”: Channels are organized around content from a screen “monitor”: Channels are organized around content from one or several monitors “music”: Channels are organized for music synchronization “3dspace: Channels are organized to provide 3d spacial effects “other”: General use case
  - **status**: *(required, one of active, inactive)*
    Read only field reporting if the stream is active or not
  - **active_streamer**: *([ResourceIdentifier](./common.md#resourceidentifier))*
    Expected value is of a ResourceIdentifier of the type auth_v1 i.e. an application id, only available if status is active
  - **stream_proxy**: *(required, object)*
    - **mode**: *(required, one of auto, manual)*
      Proxymode used for this group
      - auto – The bridge will select a proxynode automatically. – manual – The proxynode has been set manually
    - **node**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
      Reference to the device acting as proxy The proxynode relays the entertainment traffic and should be located in or close to all entertainment lamps in this group. The proxynode set by the application (manual) resp selected by the bridge (auto). Writing sets proxymode to “manual”. Is not allowed to be combined with attribute “proxymode”:”auto” Can be type BridgeDevice or ZigbeeDevice
  - **channels**: *(required, array of EntertainmentChannelGet)*
    Holds the channels. Each channel groups segments of one or different light
    **Items**: EntertainmentChannelGet
    - **channel_id**: *(required, integer – minimum: 0 – maximum: 255)*
      Bridge assigns a number upon creation. This is the number to be used by the HueStream API when addressing the channel
    - **position**: *(required, object)*
      xyz position of this channel. It is the average position of its members
      - **x**: *(required, number – minimum: -1 – maximum: 1)*
        Coordinate of a single axis
      - **y**: *(required, number – minimum: -1 – maximum: 1)*
        Coordinate of a single axis
      - **z**: *(required, number – minimum: -1 – maximum: 1)*
        Coordinate of a single axis
    - **members**: *(required, array of SegmentReference)*
      List that references segments that are members of that channel
      **Items**: SegmentReference
      - **service**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
      - **index**: *(required, integer)*
  - **locations**: *(required, object)*
    Entertainment services of the lights that are in the zone have locations
    - **service_locations**: *(required, array of ServiceLocationGet)*
      **Items**: ServiceLocationGet
      - **service**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
      - **position**: *(object)*
        Describes the location of the service. Deprecated: use positions
        - **x**: *(required, number – minimum: -1 – maximum: 1)*
          Coordinate of a single axis
        - **y**: *(required, number – minimum: -1 – maximum: 1)*
          Coordinate of a single axis
        - **z**: *(required, number – minimum: -1 – maximum: 1)*
          Coordinate of a single axis
      - **positions**: *(required, array of Position – minItems: 1 – maxItems: 2)*
        Describes the location of the service.
        **Items**: Position
        - **x**: *(required, number – minimum: -1 – maximum: 1)*
          Coordinate of a single axis
        - **y**: *(required, number – minimum: -1 – maximum: 1)*
          Coordinate of a single axis
        - **z**: *(required, number – minimum: -1 – maximum: 1)*
          Coordinate of a single axis
      - **equalization_factor**: *(required, number – default: 1 – maximum: 1)*
        Relative equalization factor applied to the entertainment service, to compensate for differences in brightness in the entertainment configuration. Value cannot be 0, writing 0 changes it to lowest possible value.
  - **light_services**: *(array of [ResourceIdentifier](./common.md#resourceidentifier))*
    List of light services that belong to this entertainment configuration Deprecated: resolve via entertainment services in locations object

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

## /resource/entertainment_configuration/{id}

API calls to read, update and delete a resource instance

### DELETE /resource/entertainment_configuration/{id}

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

### PUT /resource/entertainment_configuration/{id}

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
- **type**: *(entertainment_configuration)*
  Type of the supported resources
- **metadata**: *(object)*
  - **name**: *(required, string – minLength: 1 – maxLength: 32)*
    Friendly name of the entertainment configuration
- **configuration_type**: *(one of screen, monitor, music, 3dspace, other)*
  Defines for which type of application this channel assignment was optimized for “screen”: Channels are organized around content from a screen “monitor”: Channels are organized around content from one or several monitors “music”: Channels are organized for music synchronization “3dspace: Channels are organized to provide 3d spacial effects “other”: General use case
- **action**: *(one of start, stop)*
  If status is “inactive” -> write start to start streaming. Writing start when it's already active does not change the owership of the streaming. If status is “active” -> write “stop” to end the current streaming. In order to start streaming when other application is already streaming first write “stop” and then “start”
- **stream_proxy**: *(object)*
  - **mode**: *(required, one of auto, manual)*
    Proxymode used for this group
    - auto – The bridge will select a proxynode automatically. – manual – The proxynode has been set manually
  - **node**: *([ResourceIdentifier](./common.md#resourceidentifier))*
    Reference to the device acting as proxy The proxynode relays the entertainment traffic and should be located in or close to all entertainment lamps in this group. The proxynode set by the application (manual) resp selected by the bridge (auto). Writing sets proxymode to “manual”. Is not allowed to be combined with attribute “proxymode”:”auto” Can be type BridgeDevice or ZigbeeDevice
- **locations**: *(object)*
  Entertainment services of the lights that are in the zone have locations
  - **service_locations**: *(required, array of ServiceLocationPut)*
    **Items**: ServiceLocationPut
    - **service**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
    - **positions**: *(required, array of Position – minItems: 1 – maxItems: 2)*
      Describes the location of the service.
      **Items**: Position
      - **x**: *(required, number – minimum: -1 – maximum: 1)*
        Coordinate of a single axis
      - **y**: *(required, number – minimum: -1 – maximum: 1)*
        Coordinate of a single axis
      - **z**: *(required, number – minimum: -1 – maximum: 1)*
        Coordinate of a single axis
    - **equalization_factor**: *(number – default: 1 – maximum: 1)*
      Relative equalization factor applied to the entertainment service, to compensate for differences in brightness in the entertainment configuration. Value cannot be 0, writing 0 changes it to lowest possible value.

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

### GET /resource/entertainment_configuration/{id}

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
- **data**: *(required, array of EntertainmentConfigurationGet)*
  **Items**: EntertainmentConfigurationGet
  - **id**: *(required, string – pattern: ^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$)*
    Unique identifier representing a specific resource instance
  - **id_v1**: *(string – pattern: ^(\/[a-z]{4,32}\/[0-9a-zA-Z-]{1,32})?$)*
    Clip v1 resource identifier
  - **type**: *(required, entertainment_configuration)*
    Type of the supported resources
  - **metadata**: *(required, object)*
    - **name**: *(required, string – minLength: 1 – maxLength: 32)*
      Friendly name of the entertainment configuration
  - **name**: *(string – minLength: 1 – maxLength: 32)*
    Friendly name of the entertainment configuration Deprecated: use metadata/name
  - **configuration_type**: *(required, one of screen, monitor, music, 3dspace, other)*
    Defines for which type of application this channel assignment was optimized for “screen”: Channels are organized around content from a screen “monitor”: Channels are organized around content from one or several monitors “music”: Channels are organized for music synchronization “3dspace: Channels are organized to provide 3d spacial effects “other”: General use case
  - **status**: *(required, one of active, inactive)*
    Read only field reporting if the stream is active or not
  - **active_streamer**: *([ResourceIdentifier](./common.md#resourceidentifier))*
    Expected value is of a ResourceIdentifier of the type auth_v1 i.e. an application id, only available if status is active
  - **stream_proxy**: *(required, object)*
    - **mode**: *(required, one of auto, manual)*
      Proxymode used for this group
      - auto – The bridge will select a proxynode automatically. – manual – The proxynode has been set manually
    - **node**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
      Reference to the device acting as proxy The proxynode relays the entertainment traffic and should be located in or close to all entertainment lamps in this group. The proxynode set by the application (manual) resp selected by the bridge (auto). Writing sets proxymode to “manual”. Is not allowed to be combined with attribute “proxymode”:”auto” Can be type BridgeDevice or ZigbeeDevice
  - **channels**: *(required, array of EntertainmentChannelGet)*
    Holds the channels. Each channel groups segments of one or different light
    **Items**: EntertainmentChannelGet
    - **channel_id**: *(required, integer – minimum: 0 – maximum: 255)*
      Bridge assigns a number upon creation. This is the number to be used by the HueStream API when addressing the channel
    - **position**: *(required, object)*
      xyz position of this channel. It is the average position of its members
      - **x**: *(required, number – minimum: -1 – maximum: 1)*
        Coordinate of a single axis
      - **y**: *(required, number – minimum: -1 – maximum: 1)*
        Coordinate of a single axis
      - **z**: *(required, number – minimum: -1 – maximum: 1)*
        Coordinate of a single axis
    - **members**: *(required, array of SegmentReference)*
      List that references segments that are members of that channel
      **Items**: SegmentReference
      - **service**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
      - **index**: *(required, integer)*
  - **locations**: *(required, object)*
    Entertainment services of the lights that are in the zone have locations
    - **service_locations**: *(required, array of ServiceLocationGet)*
      **Items**: ServiceLocationGet
      - **service**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
      - **position**: *(object)*
        Describes the location of the service. Deprecated: use positions
        - **x**: *(required, number – minimum: -1 – maximum: 1)*
          Coordinate of a single axis
        - **y**: *(required, number – minimum: -1 – maximum: 1)*
          Coordinate of a single axis
        - **z**: *(required, number – minimum: -1 – maximum: 1)*
          Coordinate of a single axis
      - **positions**: *(required, array of Position – minItems: 1 – maxItems: 2)*
        Describes the location of the service.
        **Items**: Position
        - **x**: *(required, number – minimum: -1 – maximum: 1)*
          Coordinate of a single axis
        - **y**: *(required, number – minimum: -1 – maximum: 1)*
          Coordinate of a single axis
        - **z**: *(required, number – minimum: -1 – maximum: 1)*
          Coordinate of a single axis
      - **equalization_factor**: *(required, number – default: 1 – maximum: 1)*
        Relative equalization factor applied to the entertainment service, to compensate for differences in brightness in the entertainment configuration. Value cannot be 0, writing 0 changes it to lowest possible value.
  - **light_services**: *(array of [ResourceIdentifier](./common.md#resourceidentifier))*
    List of light services that belong to this entertainment configuration Deprecated: resolve via entertainment services in locations object

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
