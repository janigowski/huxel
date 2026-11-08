# /resource/bridge_home

API to manage bridge homes. Homes group rooms as well as devices not assigned to a room.

## /resource/bridge_home

### GET /resource/bridge_home

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
- **data**: *(required, array of BridgeHomeGet)*
  **Items**: BridgeHomeGet
  - **id**: *(required, string – pattern: ^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$)*
    Unique identifier representing a specific resource instance
  - **id_v1**: *(string – pattern: ^(\/[a-z]{4,32}\/[0-9a-zA-Z-]{1,32})?$)*
    Clip v1 resource identifier
  - **children**: *(required, array of [ResourceIdentifier](./common.md#resourceidentifier))*
    Child devices/services to group by the derived group
  - **services**: *(required, array of [ResourceIdentifier](./common.md#resourceidentifier))*
    References all services aggregating control and state of children in the group. This includes all services grouped in the group hierarchy given by child relation This includes all services of a device grouped in the group hierarchy given by child relation Aggregation is per service type, ie every service type which can be grouped has a corresponding definition of grouped type Supported types: – grouped_light – grouped_motion – grouped_light_level
  - **type**: *(required, bridge_home)*
    Type of the supported resources
  **Example**:
  ```json
  {
    "type": "bridge_home",
    "id": "91a6626c-8b8f-4c4a-a9e8-18a6be332373",
    "services": [
      {
        "rtype": "grouped_light",
        "rid": "709834c7-29e7-4dc9-961e-0f7a3f4c3842"
      }
    ],
    "children": [
      {
        "rtype": "device",
        "rid": "91a6626c-8b8f-4c4a-a9e8-18a6be332373"
      },
      {
        "rtype": "room",
        "rid": "a032577a-dc4e-4eee-97e1-fc2c146a6b23"
      }
    ]
  }
  ```

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

## /resource/bridge_home/{id}

API calls for resource which can be just retrieved (GET on resource instance)

### GET /resource/bridge_home/{id}

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
- **data**: *(required, array of BridgeHomeGet)*
  **Items**: BridgeHomeGet
  - **id**: *(required, string – pattern: ^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$)*
    Unique identifier representing a specific resource instance
  - **id_v1**: *(string – pattern: ^(\/[a-z]{4,32}\/[0-9a-zA-Z-]{1,32})?$)*
    Clip v1 resource identifier
  - **children**: *(required, array of [ResourceIdentifier](./common.md#resourceidentifier))*
    Child devices/services to group by the derived group
  - **services**: *(required, array of [ResourceIdentifier](./common.md#resourceidentifier))*
    References all services aggregating control and state of children in the group. This includes all services grouped in the group hierarchy given by child relation This includes all services of a device grouped in the group hierarchy given by child relation Aggregation is per service type, ie every service type which can be grouped has a corresponding definition of grouped type Supported types: – grouped_light – grouped_motion – grouped_light_level
  - **type**: *(required, bridge_home)*
    Type of the supported resources
  **Example**:
  ```json
  {
    "type": "bridge_home",
    "id": "91a6626c-8b8f-4c4a-a9e8-18a6be332373",
    "services": [
      {
        "rtype": "grouped_light",
        "rid": "709834c7-29e7-4dc9-961e-0f7a3f4c3842"
      }
    ],
    "children": [
      {
        "rtype": "device",
        "rid": "91a6626c-8b8f-4c4a-a9e8-18a6be332373"
      },
      {
        "rtype": "room",
        "rid": "a032577a-dc4e-4eee-97e1-fc2c146a6b23"
      }
    ]
  }
  ```

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
