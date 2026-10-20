# /resource/bridge

API to manage the bridge

## /resource/bridge

### GET /resource/bridge

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
- **data**: *(required, array of BridgeGet)*
  **Items**: BridgeGet
  - **id**: *(required, string – pattern: ^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$)*
    Unique identifier representing a specific resource instance
  - **id_v1**: *(string – pattern: ^(\/[a-z]{4,32}\/[0-9a-zA-Z-]{1,32})?$)*
    Clip v1 resource identifier
  - **owner**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
    Owner of the service, in case the owner service is deleted, the service also gets deleted
  - **type**: *(required, bridge)*
    Type of the supported resources
  - **bridge_id**: *(required, string)*
    Unique identifier of the bridge as printed on the device. Lower case.
  - **time_zone**: *(required, object)*
    - **time_zone**: *(required, string)*
      Time zone where the user's home is located (as Olson ID).
  - **import**: *(object)*
    - **origin**: *(required, string)*
      Bridge ID (in lower case) where the imported data originates from.
    - **time**: *(required, datetime)*
      UTC date and time when the import took place.
  **Example**:
  ```json
  {
    "type": "bridge",
    "id": "91a6626c-8b8f-4c4a-a9e8-18a6be332373",
    "owner": {
      "rid": "08221fb4-ce0c-4914-845d-50aa5033f126",
      "rtype": "device"
    },
    "bridge_id": "001788fffe21055d",
    "time_zone": {
      "time_zone": "Europe/Brussels"
    },
    "import": {
      "origin": "c42996fffec02aea",
      "time": "2024-11-28T10:19:33.637Z"
    }
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

## /resource/bridge/{id}

API calls for resource which cannot be deleted (PUT and GET on resource instance)

### PUT /resource/bridge/{id}

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
- **type**: *(bridge)*
  Type of the supported resources

**Example**:

```json
{
  "type": "bridge",
  "id": "91a6626c-8b8f-4c4a-a9e8-18a6be332373",
  "owner": {
    "rid": "08221fb4-ce0c-4914-845d-50aa5033f126",
    "rtype": "device"
  },
  "bridge_id": "001788fffe21055d",
  "time_zone": {
    "time_zone": "Europe/Brussels"
  },
  "import": {
    "origin": "c42996fffec02aea",
    "time": "2024-11-28T10:19:33.637Z"
  }
}
```

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

### GET /resource/bridge/{id}

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
- **data**: *(required, array of BridgeGet)*
  **Items**: BridgeGet
  - **id**: *(required, string – pattern: ^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$)*
    Unique identifier representing a specific resource instance
  - **id_v1**: *(string – pattern: ^(\/[a-z]{4,32}\/[0-9a-zA-Z-]{1,32})?$)*
    Clip v1 resource identifier
  - **owner**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
    Owner of the service, in case the owner service is deleted, the service also gets deleted
  - **type**: *(required, bridge)*
    Type of the supported resources
  - **bridge_id**: *(required, string)*
    Unique identifier of the bridge as printed on the device. Lower case.
  - **time_zone**: *(required, object)*
    - **time_zone**: *(required, string)*
      Time zone where the user's home is located (as Olson ID).
  - **import**: *(object)*
    - **origin**: *(required, string)*
      Bridge ID (in lower case) where the imported data originates from.
    - **time**: *(required, datetime)*
      UTC date and time when the import took place.
  **Example**:
  ```json
  {
    "type": "bridge",
    "id": "91a6626c-8b8f-4c4a-a9e8-18a6be332373",
    "owner": {
      "rid": "08221fb4-ce0c-4914-845d-50aa5033f126",
      "rtype": "device"
    },
    "bridge_id": "001788fffe21055d",
    "time_zone": {
      "time_zone": "Europe/Brussels"
    },
    "import": {
      "origin": "c42996fffec02aea",
      "time": "2024-11-28T10:19:33.637Z"
    }
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
