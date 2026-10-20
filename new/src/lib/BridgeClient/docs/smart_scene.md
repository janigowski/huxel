# /resource/smart_scene

API to manage smart scenes

## /resource/smart_scene

### POST /resource/smart_scene

create a new resource of this type

> Secured by hue-application-key API authorization using a hue-application-key header

#### Request

###### Body

**Media type**: application/json

**Type**: object

**Properties**

- **type**: *(smart_scene)*
  Type of the supported resources
- **metadata**: *(required, object)*
  - **name**: *(required, string – minLength: 1 – maxLength: 32)*
    Human readable name of a resource
  - **image**: *([ResourceIdentifier](./common.md#resourceidentifier))*
    Reference with unique identifier for the image representing the scene only accepting “rtype”: “public_image” on creation
  - **appdata**: *(string – minLength: 1 – maxLength: 16)*
    Application specific data. Free format string.
- **group**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
  Group associated with this Scene. All services in the group are part of this scene. If the group is changed the scene is update (e.g. light added/removed)
- **week_timeslots**: *(required, array of DayTimeslotsPost)*
  information on what is the light state for every timeslot of the day
  **Items**: DayTimeslotsPost
  - **timeslots**: *(required, array of SmartSceneTimeslotPost)*
    **Items**: SmartSceneTimeslotPost
    - **start_time**: *(required, object)*
      - **kind**: *(required, one of time, sunset)*
      - **time**: *(object)*
        this property is only used when property “kind” is “time”
        - **hour**: *(required, integer – minimum: 0 – maximum: 23)*
        - **minute**: *(required, integer – minimum: 0 – maximum: 59)*
        - **second**: *(required, integer – minimum: 0 – maximum: 59)*
    - **target**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
      The identifier of the scene to recall
  - **recurrence**: *(required, array of WeekDay)*
- **transition_duration**: *(integer)*
  duration of the transition from on one timeslot's scene to the other (defaults to 60000ms)
  **Example**:
  ```
  800
  ```
- **recall**: *(object)*
  - **action**: *(required, one of activate, deactivate)*
    Activate will start the smart (24h) scene; deactivate will stop it

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

### GET /resource/smart_scene

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
- **data**: *(required, array of SmartSceneGet)*
  **Items**: SmartSceneGet
  - **id**: *(required, string – pattern: ^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$)*
    Unique identifier representing a specific resource instance
  - **id_v1**: *(string – pattern: ^(\/[a-z]{4,32}\/[0-9a-zA-Z-]{1,32})?$)*
    Clip v1 resource identifier
  - **type**: *(required, smart_scene)*
    Type of the supported resources
  - **metadata**: *(required, object)*
    - **name**: *(required, string – minLength: 1 – maxLength: 32)*
      Human readable name of a resource
    - **image**: *([ResourceIdentifier](./common.md#resourceidentifier))*
      Reference with unique identifier for the image representing the scene only accepting “rtype”: “public_image” on creation
    - **appdata**: *(string – minLength: 1 – maxLength: 16)*
      Application specific data. Free format string.
  - **group**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
    Group associated with this Scene. All services in the group are part of this scene. If the group is changed the scene is update (e.g. light added/removed)
  - **week_timeslots**: *(required, array of DayTimeslotsGet)*
    information on what is the light state for every timeslot of the day
    **Items**: DayTimeslotsGet
    - **timeslots**: *(required, array of SmartSceneTimeslotGet)*
      **Items**: SmartSceneTimeslotGet
      - **start_time**: *(required, object)*
        - **kind**: *(required, one of time, sunset)*
        - **time**: *(required, object)*
          this property is only used when property “kind” is “time”
          - **hour**: *(required, integer – minimum: 0 – maximum: 23)*
          - **minute**: *(required, integer – minimum: 0 – maximum: 59)*
          - **second**: *(required, integer – minimum: 0 – maximum: 59)*
      - **target**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
        The identifier of the scene to recall
    - **recurrence**: *(required, array of WeekDay)*
  - **transition_duration**: *(required, integer)*
    duration of the transition from on one timeslot's scene to the other (defaults to 60000ms)
    **Example**:
    ```
    800
    ```
  - **active_timeslot**: *(object)*
    the active time slot in execution
    - **timeslot_id**: *(required, integer)*
    - **weekday**: *(required, one of monday, tuesday, wednesday, thursday, friday, saturday, sunday)*
  - **state**: *(required, one of active, inactive)*
    the current state of the smart scene. The default state is `inactive` if no `recall` is provided

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

## /resource/smart_scene/{id}

API calls to read, update and delete a resource instance

### DELETE /resource/smart_scene/{id}

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

### PUT /resource/smart_scene/{id}

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
- **type**: *(smart_scene)*
  Type of the supported resources
- **metadata**: *(object)*
  - **name**: *(string – minLength: 1 – maxLength: 32)*
    Human readable name of a resource
  - **appdata**: *(string – minLength: 1 – maxLength: 16)*
    Application specific data. Free format string.
- **week_timeslots**: *(array of DayTimeslotsPut)*
  information on what is the light state for every timeslot of the day
  **Items**: DayTimeslotsPut
  - **timeslots**: *(required, array of SmartSceneTimeslotPut)*
    **Items**: SmartSceneTimeslotPut
    - **start_time**: *(required, object)*
      - **kind**: *(required, one of time, sunset)*
      - **time**: *(object)*
        this property is only used when property “kind” is “time”
        - **hour**: *(required, integer – minimum: 0 – maximum: 23)*
        - **minute**: *(required, integer – minimum: 0 – maximum: 59)*
        - **second**: *(integer – minimum: 0 – maximum: 59)*
    - **target**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
      The identifier of the scene to recall
  - **recurrence**: *(required, array of WeekDay)*
- **transition_duration**: *(integer)*
  duration of the transition from on one timeslot's scene to the other (defaults to 60000ms)
  **Example**:
  ```
  800
  ```
- **recall**: *(object)*
  - **action**: *(one of activate, deactivate)*
    Activate will start the smart (24h) scene; deactivate will stop it

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

### GET /resource/smart_scene/{id}

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
- **data**: *(required, array of SmartSceneGet)*
  **Items**: SmartSceneGet
  - **id**: *(required, string – pattern: ^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$)*
    Unique identifier representing a specific resource instance
  - **id_v1**: *(string – pattern: ^(\/[a-z]{4,32}\/[0-9a-zA-Z-]{1,32})?$)*
    Clip v1 resource identifier
  - **type**: *(required, smart_scene)*
    Type of the supported resources
  - **metadata**: *(required, object)*
    - **name**: *(required, string – minLength: 1 – maxLength: 32)*
      Human readable name of a resource
    - **image**: *([ResourceIdentifier](./common.md#resourceidentifier))*
      Reference with unique identifier for the image representing the scene only accepting “rtype”: “public_image” on creation
    - **appdata**: *(string – minLength: 1 – maxLength: 16)*
      Application specific data. Free format string.
  - **group**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
    Group associated with this Scene. All services in the group are part of this scene. If the group is changed the scene is update (e.g. light added/removed)
  - **week_timeslots**: *(required, array of DayTimeslotsGet)*
    information on what is the light state for every timeslot of the day
    **Items**: DayTimeslotsGet
    - **timeslots**: *(required, array of SmartSceneTimeslotGet)*
      **Items**: SmartSceneTimeslotGet
      - **start_time**: *(required, object)*
        - **kind**: *(required, one of time, sunset)*
        - **time**: *(required, object)*
          this property is only used when property “kind” is “time”
          - **hour**: *(required, integer – minimum: 0 – maximum: 23)*
          - **minute**: *(required, integer – minimum: 0 – maximum: 59)*
          - **second**: *(required, integer – minimum: 0 – maximum: 59)*
      - **target**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
        The identifier of the scene to recall
    - **recurrence**: *(required, array of WeekDay)*
  - **transition_duration**: *(required, integer)*
    duration of the transition from on one timeslot's scene to the other (defaults to 60000ms)
    **Example**:
    ```
    800
    ```
  - **active_timeslot**: *(object)*
    the active time slot in execution
    - **timeslot_id**: *(required, integer)*
    - **weekday**: *(required, one of monday, tuesday, wednesday, thursday, friday, saturday, sunday)*
  - **state**: *(required, one of active, inactive)*
    the current state of the smart scene. The default state is `inactive` if no `recall` is provided

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
