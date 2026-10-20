# /resource/relative_rotary

API to manage relative rotary services. These are offered by devices with rotary capabilities.

## /resource/relative_rotary

### GET /resource/relative_rotary

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
- **data**: *(required, array of RelativeRotaryGet)*
  **Items**: RelativeRotaryGet
  - **id**: *(required, string – pattern: ^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$)*
    Unique identifier representing a specific resource instance
  - **id_v1**: *(string – pattern: ^(\/[a-z]{4,32}\/[0-9a-zA-Z-]{1,32})?$)*
    Clip v1 resource identifier
  - **owner**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
    Owner of the service, in case the owner service is deleted, the service also gets deleted
  - **type**: *(required, relative_rotary)*
    Type of the supported resources
  - **relative_rotary**: *(required, object)*
    - **last_event**: *(object)*
      Deprecated. Renamed to RelativeRotaryReport. Indicate which type of rotary event is received
      - **action**: *(required, one of start, repeat)*
        Indicate which type of rotary event is received
      - **rotation**: *(required, object)*
        - **direction**: *(required, one of clock_wise, counter_clock_wise)*
          A rotation opposite to the previous rotation, will always start with new start command.
        - **steps**: *(required, integer – minimum: 0 – maximum: 32767)*
          amount of rotation since previous event in case of repeat, amount of rotation since start in case of a start_event. Resolution = 1000 steps / 360 degree rotation.
        - **duration**: *(required, integer – minimum: 0 – maximum: 65534)*
          duration of rotation since previous event in case of repeat, amount of rotation since start in case of a start_event. duration is specified in miliseconds.
    - **rotary_report**: *(object)*
      - **updated**: *(required, datetime)*
        Last time the value of this property is updated.
      - **action**: *(required, one of start, repeat)*
        Indicate which type of rotary event is received
      - **rotation**: *(required, object)*
        - **direction**: *(required, one of clock_wise, counter_clock_wise)*
          A rotation opposite to the previous rotation, will always start with new start command.
        - **steps**: *(required, integer – minimum: 0 – maximum: 32767)*
          amount of rotation since previous event in case of repeat, amount of rotation since start in case of a start_event. Resolution = 1000 steps / 360 degree rotation.
        - **duration**: *(required, integer – minimum: 0 – maximum: 65534)*
          duration of rotation since previous event in case of repeat, amount of rotation since start in case of a start_event. duration is specified in miliseconds.

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

## /resource/relative_rotary/{id}

API calls for resource which cannot be deleted (PUT and GET on resource instance)

### PUT /resource/relative_rotary/{id}

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
- **type**: *(relative_rotary)*
  Type of the supported resources

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

### GET /resource/relative_rotary/{id}

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
- **data**: *(required, array of RelativeRotaryGet)*
  **Items**: RelativeRotaryGet
  - **id**: *(required, string – pattern: ^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$)*
    Unique identifier representing a specific resource instance
  - **id_v1**: *(string – pattern: ^(\/[a-z]{4,32}\/[0-9a-zA-Z-]{1,32})?$)*
    Clip v1 resource identifier
  - **owner**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
    Owner of the service, in case the owner service is deleted, the service also gets deleted
  - **type**: *(required, relative_rotary)*
    Type of the supported resources
  - **relative_rotary**: *(required, object)*
    - **last_event**: *(object)*
      Deprecated. Renamed to RelativeRotaryReport. Indicate which type of rotary event is received
      - **action**: *(required, one of start, repeat)*
        Indicate which type of rotary event is received
      - **rotation**: *(required, object)*
        - **direction**: *(required, one of clock_wise, counter_clock_wise)*
          A rotation opposite to the previous rotation, will always start with new start command.
        - **steps**: *(required, integer – minimum: 0 – maximum: 32767)*
          amount of rotation since previous event in case of repeat, amount of rotation since start in case of a start_event. Resolution = 1000 steps / 360 degree rotation.
        - **duration**: *(required, integer – minimum: 0 – maximum: 65534)*
          duration of rotation since previous event in case of repeat, amount of rotation since start in case of a start_event. duration is specified in miliseconds.
    - **rotary_report**: *(object)*
      - **updated**: *(required, datetime)*
        Last time the value of this property is updated.
      - **action**: *(required, one of start, repeat)*
        Indicate which type of rotary event is received
      - **rotation**: *(required, object)*
        - **direction**: *(required, one of clock_wise, counter_clock_wise)*
          A rotation opposite to the previous rotation, will always start with new start command.
        - **steps**: *(required, integer – minimum: 0 – maximum: 32767)*
          amount of rotation since previous event in case of repeat, amount of rotation since start in case of a start_event. Resolution = 1000 steps / 360 degree rotation.
        - **duration**: *(required, integer – minimum: 0 – maximum: 65534)*
          duration of rotation since previous event in case of repeat, amount of rotation since start in case of a start_event. duration is specified in miliseconds.

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
