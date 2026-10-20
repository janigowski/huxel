# /resource/behavior_script

API to discover firmware embedded scripts that can be instantiated.

## /resource/behavior_script

### GET /resource/behavior_script

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
- **data**: *(required, array of BehaviorScriptGet)*
  **Items**: BehaviorScriptGet
  - **type**: *(required, behavior_script)*
    Type of the supported resources
  - **id**: *(required, string – pattern: ^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$)*
    Unique identifier representing a specific resource instance
  - **id_v1**: *(string – pattern: ^(\/[a-z]{4,32}\/[0-9a-zA-Z-]{1,32})?$)*
    Clip v1 resource identifier
  - **description**: *(required, string – maxLength: 512)*
    Short description of script.
  - **configuration_schema**: *(required, object)*
    JSON schema object used for validating ScriptInstance.configuration property.
  - **trigger_schema**: *(object)*
    JSON schema object used for validating ScriptInstance.trigger property.
  - **state_schema**: *(object)*
    JSON schema of ScriptInstance.state property.
  - **version**: *(required, string – pattern: ^[1-9][0-9]{0,2}([.][0-9]{1,3}){1,2})*
    Version of script.
  - **metadata**: *(required, object)*
    - **name**: *(string – minLength: 1 – maxLength: 32)*
      Human readable name of a resource
    - **category**: *(required, one of automation, entertainment, accessory, other)*
  - **supported_features**: *(array of string)*
    Features that the script supports.
  - **max_number_instances**: *(integer – minimum: 0 – maximum: 255)*
    Max number of script instances.

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

## /resource/behavior_script/{id}

API calls for resource which can be just retrieved (GET on resource instance)

### GET /resource/behavior_script/{id}

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
- **data**: *(required, array of BehaviorScriptGet)*
  **Items**: BehaviorScriptGet
  - **type**: *(required, behavior_script)*
    Type of the supported resources
  - **id**: *(required, string – pattern: ^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$)*
    Unique identifier representing a specific resource instance
  - **id_v1**: *(string – pattern: ^(\/[a-z]{4,32}\/[0-9a-zA-Z-]{1,32})?$)*
    Clip v1 resource identifier
  - **description**: *(required, string – maxLength: 512)*
    Short description of script.
  - **configuration_schema**: *(required, object)*
    JSON schema object used for validating ScriptInstance.configuration property.
  - **trigger_schema**: *(object)*
    JSON schema object used for validating ScriptInstance.trigger property.
  - **state_schema**: *(object)*
    JSON schema of ScriptInstance.state property.
  - **version**: *(required, string – pattern: ^[1-9][0-9]{0,2}([.][0-9]{1,3}){1,2})*
    Version of script.
  - **metadata**: *(required, object)*
    - **name**: *(string – minLength: 1 – maxLength: 32)*
      Human readable name of a resource
    - **category**: *(required, one of automation, entertainment, accessory, other)*
  - **supported_features**: *(array of string)*
    Features that the script supports.
  - **max_number_instances**: *(integer – minimum: 0 – maximum: 255)*
    Max number of script instances.

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
