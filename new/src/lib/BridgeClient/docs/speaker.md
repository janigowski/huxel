# /resource/speaker

API to manage speaker services. These are offered by devices with speakers.

## /resource/speaker

### GET /resource/speaker

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
- **data**: *(required, array of SpeakerGet)*
  **Items**: SpeakerGet
  - **id**: *(required, string – pattern: ^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$)*
    Unique identifier representing a specific resource instance
  - **id_v1**: *(string – pattern: ^(\/[a-z]{4,32}\/[0-9a-zA-Z-]{1,32})?$)*
    Clip v1 resource identifier
  - **owner**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
    Owner of the service, in case the owner service is deleted, the service also gets deleted
  - **type**: *(required, speaker)*
    Type of the supported resources
  - **alarm**: *(object)*
    - **sound_values**: *(required, array of SupportedSounds – minItems: 1)*
    - **status**: *(required, object)*
      Status of the current active feature
      - **sound**: *(required, one of no_sound, alert, bleep, ding_dong_classic, ding_dong_modern, rise, siren, westminster_classic, westminster_modern, ding_dong_xylo, hue_default, sonar, swing, bright, glow, bounce, reveal, welcome, bright_modern, fairy, galaxy, echo)*
      - **sound_values**: *(required, array of SupportedSounds – minItems: 2)*
      - **estimated_end**: *(object)*
        only present for siren. Estimated end-time based on requested duration.
        - **estimate**: *(required, datetime)*
  - **chime**: *(object)*
    - **sound_values**: *(required, array of SupportedSounds – minItems: 1)*
    - **status**: *(required, object)*
      Status of the current active feature
      - **sound**: *(required, one of no_sound, alert, bleep, ding_dong_classic, ding_dong_modern, rise, siren, westminster_classic, westminster_modern, ding_dong_xylo, hue_default, sonar, swing, bright, glow, bounce, reveal, welcome, bright_modern, fairy, galaxy, echo)*
      - **sound_values**: *(required, array of SupportedSounds – minItems: 2)*
      - **estimated_end**: *(object)*
        only present for siren. Estimated end-time based on requested duration.
        - **estimate**: *(required, datetime)*
  - **alert**: *(object)*
    - **sound_values**: *(required, array of SupportedSounds – minItems: 1)*
    - **status**: *(required, object)*
      Status of the current active feature
      - **sound**: *(required, one of no_sound, alert, bleep, ding_dong_classic, ding_dong_modern, rise, siren, westminster_classic, westminster_modern, ding_dong_xylo, hue_default, sonar, swing, bright, glow, bounce, reveal, welcome, bright_modern, fairy, galaxy, echo)*
      - **sound_values**: *(required, array of SupportedSounds – minItems: 2)*
      - **estimated_end**: *(object)*
        only present for siren. Estimated end-time based on requested duration.
        - **estimate**: *(required, datetime)*
  - **mute**: *(object)*
    Device has only one global mute-property. Siren will not be affected by value of mute feature
    - **mute**: *(required, one of mute, unmute)*

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

## /resource/speaker/{id}

API calls for resource which cannot be deleted (PUT and GET on resource instance)

### PUT /resource/speaker/{id}

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
- **type**: *(speaker)*
  Type of the supported resources
- **alarm**: *(object)*
  - **sound**: *(required, one of no_sound, alert, bleep, ding_dong_classic, ding_dong_modern, rise, siren, westminster_classic, westminster_modern, ding_dong_xylo, hue_default, sonar, swing, bright, glow, bounce, reveal, welcome, bright_modern, fairy, galaxy, echo)*
  - **volume**: *(object)*
    Requested volume on play sound request
    - **level**: *(required, number – minimum: 0 – maximum: 100)*
  - **duration**: *(number – minimum: 0 – maximum: 65534000)*
    Stepsize of 1000 ms. Values in-between steps will round-up to next multiple of 1000
- **chime**: *(object)*
  - **sound**: *(required, one of no_sound, alert, bleep, ding_dong_classic, ding_dong_modern, rise, siren, westminster_classic, westminster_modern, ding_dong_xylo, hue_default, sonar, swing, bright, glow, bounce, reveal, welcome, bright_modern, fairy, galaxy, echo)*
  - **volume**: *(object)*
    Requested volume on play sound request
    - **level**: *(required, number – minimum: 0 – maximum: 100)*
- **alert**: *(object)*
  - **sound**: *(required, one of no_sound, alert, bleep, ding_dong_classic, ding_dong_modern, rise, siren, westminster_classic, westminster_modern, ding_dong_xylo, hue_default, sonar, swing, bright, glow, bounce, reveal, welcome, bright_modern, fairy, galaxy, echo)*
  - **volume**: *(object)*
    Requested volume on play sound request
    - **level**: *(required, number – minimum: 0 – maximum: 100)*
- **mute**: *(object)*
  Device has only one global mute-property. Siren will not be affected by value of mute feature
  - **mute**: *(required, one of mute, unmute)*

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

### GET /resource/speaker/{id}

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
- **data**: *(required, array of SpeakerGet)*
  **Items**: SpeakerGet
  - **id**: *(required, string – pattern: ^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$)*
    Unique identifier representing a specific resource instance
  - **id_v1**: *(string – pattern: ^(\/[a-z]{4,32}\/[0-9a-zA-Z-]{1,32})?$)*
    Clip v1 resource identifier
  - **owner**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
    Owner of the service, in case the owner service is deleted, the service also gets deleted
  - **type**: *(required, speaker)*
    Type of the supported resources
  - **alarm**: *(object)*
    - **sound_values**: *(required, array of SupportedSounds – minItems: 1)*
    - **status**: *(required, object)*
      Status of the current active feature
      - **sound**: *(required, one of no_sound, alert, bleep, ding_dong_classic, ding_dong_modern, rise, siren, westminster_classic, westminster_modern, ding_dong_xylo, hue_default, sonar, swing, bright, glow, bounce, reveal, welcome, bright_modern, fairy, galaxy, echo)*
      - **sound_values**: *(required, array of SupportedSounds – minItems: 2)*
      - **estimated_end**: *(object)*
        only present for siren. Estimated end-time based on requested duration.
        - **estimate**: *(required, datetime)*
  - **chime**: *(object)*
    - **sound_values**: *(required, array of SupportedSounds – minItems: 1)*
    - **status**: *(required, object)*
      Status of the current active feature
      - **sound**: *(required, one of no_sound, alert, bleep, ding_dong_classic, ding_dong_modern, rise, siren, westminster_classic, westminster_modern, ding_dong_xylo, hue_default, sonar, swing, bright, glow, bounce, reveal, welcome, bright_modern, fairy, galaxy, echo)*
      - **sound_values**: *(required, array of SupportedSounds – minItems: 2)*
      - **estimated_end**: *(object)*
        only present for siren. Estimated end-time based on requested duration.
        - **estimate**: *(required, datetime)*
  - **alert**: *(object)*
    - **sound_values**: *(required, array of SupportedSounds – minItems: 1)*
    - **status**: *(required, object)*
      Status of the current active feature
      - **sound**: *(required, one of no_sound, alert, bleep, ding_dong_classic, ding_dong_modern, rise, siren, westminster_classic, westminster_modern, ding_dong_xylo, hue_default, sonar, swing, bright, glow, bounce, reveal, welcome, bright_modern, fairy, galaxy, echo)*
      - **sound_values**: *(required, array of SupportedSounds – minItems: 2)*
      - **estimated_end**: *(object)*
        only present for siren. Estimated end-time based on requested duration.
        - **estimate**: *(required, datetime)*
  - **mute**: *(object)*
    Device has only one global mute-property. Siren will not be affected by value of mute feature
    - **mute**: *(required, one of mute, unmute)*

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
