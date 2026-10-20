# /resource/grouped_light

API to manage grouped light services. These are offered by rooms, zones, and homes.

## /resource/grouped_light

### GET /resource/grouped_light

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
- **data**: *(required, array of GroupedLightGet)*
  **Items**: GroupedLightGet
  - **id**: *(required, string – pattern: ^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$)*
    Unique identifier representing a specific resource instance
  - **id_v1**: *(string – pattern: ^(\/[a-z]{4,32}\/[0-9a-zA-Z-]{1,32})?$)*
    Clip v1 resource identifier
  - **owner**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
    Owner of the service, in case the owner service is deleted, the service also gets deleted
  - **type**: *(required, grouped_light)*
    Type of the supported resources
  - **on**: *(object)*
    Joined on control & aggregated on state.| – “on” is true if any light in the group is on
    - **on**: *(required, boolean)*
      On/Off state of the light on=true, off=false
  - **dimming**: *(object)*
    Joined dimming control – “dimming.brightness” contains average brightness of group containing turned-on lights only.
    - **brightness**: *(required, number – maximum: 100)*
      Brightness percentage. Value 0 is the lowest possible brightness.
      **Example**:
      ```
      80
      ```
    **Example**:
    ```json
    {
      "brightness": 80
    }
    ```
  - **dimming_delta**: *(object)*
    **Example**:
    ```json
    {
      "action": "up",
      "brightness_delta": 10.5
    }
    ```
  - **color_temperature**: *(object)*
    Joined color temperature control
    **Example**:
    ```json
    {
      "mirek": 202
    }
    ```
  - **color_temperature_delta**: *(object)*
    **Example**:
    ```json
    {
      "action": "up",
      "mirek_delta": 200
    }
    ```
  - **color**: *(object)*
    Joined color control
    **Example**:
    ```json
    {
      "xy": {
        "x": 0.6915,
        "y": 0.3083
      }
    }
    ```
  - **alert**: *(object)*
    Joined alert control
    - **action_values**: *(required, array of AlertEffectType)*
      Alert effects that the light supports.
  - **signaling**: *(object)*
    Feature containing basic signaling properties.
    - **signal_values**: *(required, array of SupportedSignals)*
      Signals that the light supports.
  - **dynamics**: *(object)*

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

## /resource/grouped_light/{id}

API calls for resource which cannot be deleted (PUT and GET on resource instance)

### PUT /resource/grouped_light/{id}

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
- **type**: *(grouped_light)*
  Type of the supported resources
- **on**: *(object)*
  Joined on control & aggregated on state.| – “on” is true if any light in the group is on
  - **on**: *(boolean)*
    On/Off state of the light on=true, off=false
- **dimming**: *(object)*
  Joined dimming control – “dimming.brightness” contains average brightness of group containing turned-on lights only.
  - **brightness**: *(number – maximum: 100)*
    Brightness percentage. Value 0 is the lowest possible brightness.
    **Example**:
    ```
    80
    ```
  **Example**:
  ```json
  {
    "brightness": 80
  }
  ```
- **dimming_delta**: *(object)*
  - **action**: *(required, one of up, down, stop)*
    The delta action to apply
  - **brightness_delta**: *(number – maximum: 100)*
    Brightness percentage of full-scale increase delta to current dimlevel. Clip at Max-level or Min-level.
    **Example**:
    ```
    20
    ```
  **Example**:
  ```json
  {
    "action": "up",
    "brightness_delta": 10.5
  }
  ```
- **color_temperature**: *(object)*
  Joined color temperature control
  - **mirek**: *(integer – minimum: 50 – maximum: 1000)*
    color temperature in mirek or null when the light color is not in the ct spectrum
    **Example**:
    ```
    233
    ```
  **Example**:
  ```json
  {
    "mirek": 202
  }
  ```
- **color_temperature_delta**: *(object)*
  - **action**: *(required, one of up, down, stop)*
    The delta action to apply
  - **mirek_delta**: *(integer – maximum: 950)*
    Mirek delta to current mirek. Clip at mirek_minimum and mirek_maximum of mirek_schema.
    **Example**:
    ```
    10
    ```
  **Example**:
  ```json
  {
    "action": "up",
    "mirek_delta": 200
  }
  ```
- **color**: *(object)*
  Joined color control
  - **xy**: *(object)*
    CIE XY gamut position
    - **x**: *(required, number – minimum: 0 – maximum: 1)*
      X position in color gamut
    - **y**: *(required, number – minimum: 0 – maximum: 1)*
      Y position in color gamut
    **Example**:
    ```json
    {
      "x": 0.369,
      "y": 0.445
    }
    ```
  **Example**:
  ```json
  {
    "xy": {
      "x": 0.6915,
      "y": 0.3083
    }
  }
  ```
- **alert**: *(object)*
  Joined alert control
  - **action**: *(required, breathe)*
    Alert to set the light to
- **signaling**: *(object)*
  Feature containing basic signaling properties.
  - **signal**: *(required, one of no_signal, on_off, on_off_color, alternating)*
    Signal to set the light to
  - **duration**: *(required, integer)*
    Duration in milliseconds. Maximum value is 65534000 ms and a stepsize of 1 second. Values inbetween steps will be rounded. Duration is ignored for no_signal.
    **Example**:
    ```
    800
    ```
  - **colors**: *(array of ColorFeatureBasicPut – minItems: 1 – maxItems: 2)*
    List of colors to apply to the signal (not supported by all signals)
    **Items**: ColorFeatureBasicPut
    - **xy**: *(object)*
      CIE XY gamut position
      - **x**: *(required, number – minimum: 0 – maximum: 1)*
        X position in color gamut
      - **y**: *(required, number – minimum: 0 – maximum: 1)*
        Y position in color gamut
      **Example**:
      ```json
      {
        "x": 0.369,
        "y": 0.445
      }
      ```
    **Example**:
    ```json
    {
      "xy": {
        "x": 0.6915,
        "y": 0.3083
      }
    }
    ```
- **dynamics**: *(object)*
  - **duration**: *(integer)*
    Duration of a light transition in ms.
    **Example**:
    ```
    800
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

### GET /resource/grouped_light/{id}

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
- **data**: *(required, array of GroupedLightGet)*
  **Items**: GroupedLightGet
  - **id**: *(required, string – pattern: ^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$)*
    Unique identifier representing a specific resource instance
  - **id_v1**: *(string – pattern: ^(\/[a-z]{4,32}\/[0-9a-zA-Z-]{1,32})?$)*
    Clip v1 resource identifier
  - **owner**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
    Owner of the service, in case the owner service is deleted, the service also gets deleted
  - **type**: *(required, grouped_light)*
    Type of the supported resources
  - **on**: *(object)*
    Joined on control & aggregated on state.| – “on” is true if any light in the group is on
    - **on**: *(required, boolean)*
      On/Off state of the light on=true, off=false
  - **dimming**: *(object)*
    Joined dimming control – “dimming.brightness” contains average brightness of group containing turned-on lights only.
    - **brightness**: *(required, number – maximum: 100)*
      Brightness percentage. Value 0 is the lowest possible brightness.
      **Example**:
      ```
      80
      ```
    **Example**:
    ```json
    {
      "brightness": 80
    }
    ```
  - **dimming_delta**: *(object)*
    **Example**:
    ```json
    {
      "action": "up",
      "brightness_delta": 10.5
    }
    ```
  - **color_temperature**: *(object)*
    Joined color temperature control
    **Example**:
    ```json
    {
      "mirek": 202
    }
    ```
  - **color_temperature_delta**: *(object)*
    **Example**:
    ```json
    {
      "action": "up",
      "mirek_delta": 200
    }
    ```
  - **color**: *(object)*
    Joined color control
    **Example**:
    ```json
    {
      "xy": {
        "x": 0.6915,
        "y": 0.3083
      }
    }
    ```
  - **alert**: *(object)*
    Joined alert control
    - **action_values**: *(required, array of AlertEffectType)*
      Alert effects that the light supports.
  - **signaling**: *(object)*
    Feature containing basic signaling properties.
    - **signal_values**: *(required, array of SupportedSignals)*
      Signals that the light supports.
  - **dynamics**: *(object)*

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
