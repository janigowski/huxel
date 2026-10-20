# /resource/scene

API to manage scenes. Scenes are used to store and recall settings for a group of lights.

## /resource/scene

### POST /resource/scene

create a new resource of this type

> Secured by hue-application-key API authorization using a hue-application-key header

#### Request

###### Body

**Media type**: application/json

**Type**: object

**Properties**

- **actions**: *(required, array of ActionPost)*
  List of actions to be executed synchronously on recall
  **Items**: ActionPost
  - **target**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
    The identifier of the light to execute the action on
  - **action**: *(required, object)*
    the action to be executed on recall
    - **on**: *(object)*
      - **on**: *(required, boolean)*
        On/Off state of the light on=true, off=false
    - **dimming**: *(object)*
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
    - **color**: *(object)*
      - **xy**: *(required, object)*
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
    - **color_temperature**: *(object)*
      - **mirek**: *(required, integer – minimum: 50 – maximum: 1000)*
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
    - **gradient**: *(object)*
      Basic feature containing gradient properties and rotation_2d.
      - **points**: *(required, array of GradientPointPost – maxItems: 5)*
        Collection of gradients points. For control of the gradient points through a PUT a minimum of 2 points need to be provided.
        **Items**: GradientPointPost
        - **color**: *(required, object)*
          - **xy**: *(required, object)*
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
      - **mode**: *(one of interpolated_palette, interpolated_palette_mirrored, random_pixelated, segmented_palette)*
        Mode in which the points are currently being deployed. If not provided during PUT/POST it will be defaulted to interpolated_palette
    - **effects**: *(object)*
      Deprecated: use effects_v2
      - **effect**: *(one of prism, opal, glisten, sparkle, fire, candle, underwater, cosmos, sunbeam, enchant, no_effect)*
    - **effects_v2**: *(object)*
      Basic feature containing effects v2 properties
      - **action**: *(required, object)*
        - **effect**: *(required, one of prism, opal, glisten, sparkle, fire, candle, underwater, cosmos, sunbeam, enchant, no_effect)*
        - **parameters**: *(object)*
          - **color**: *(object)*
            - **xy**: *(required, object)*
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
          - **color_temperature**: *(object)*
            - **mirek**: *(required, integer – minimum: 50 – maximum: 1000)*
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
          - **speed**: *(number – minimum: 0 – maximum: 1)*
    - **dynamics**: *(object)*
      - **duration**: *(integer)*
        Duration of a light transition in ms.
        **Example**:
        ```
        800
        ```
- **palette**: *(object)*
  Group of colors that describe the palette of colors to be used when playing dynamics
  - **color**: *(required, array of ColorPalettePost – minItems: 0 – maxItems: 9)*
    **Items**: ColorPalettePost
    - **color**: *(required, object)*
      - **xy**: *(required, object)*
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
    - **dimming**: *(required, object)*
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
  - **dimming**: *(required, array of DimmingFeatureBasicPost – minItems: 0 – maxItems: 1)*
    **Items**: DimmingFeatureBasicPost
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
  - **color_temperature**: *(required, array of ColorTemperaturePalettePost – minItems: 0 – maxItems: 1)*
    **Items**: ColorTemperaturePalettePost
    - **color_temperature**: *(required, object)*
      - **mirek**: *(required, integer – minimum: 50 – maximum: 1000)*
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
    - **dimming**: *(required, object)*
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
  - **effects**: *(array of EffectFeatureBasicPost – minItems: 0 – maxItems: 3)*
    Deprecated. use effects_v2
    **Items**: EffectFeatureBasicPost
    - **effect**: *(one of prism, opal, glisten, sparkle, fire, candle, underwater, cosmos, sunbeam, enchant, no_effect)*
  - **effects_v2**: *(array of EffectV2FeatureBasicPost – minItems: 0 – maxItems: 3)*
    **Items**: EffectV2FeatureBasicPost
    - **action**: *(required, object)*
      - **effect**: *(required, one of prism, opal, glisten, sparkle, fire, candle, underwater, cosmos, sunbeam, enchant, no_effect)*
      - **parameters**: *(object)*
        - **color**: *(object)*
          - **xy**: *(required, object)*
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
        - **color_temperature**: *(object)*
          - **mirek**: *(required, integer – minimum: 50 – maximum: 1000)*
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
        - **speed**: *(number – minimum: 0 – maximum: 1)*
- **type**: *(scene)*
  Type of the supported resources
- **metadata**: *(required, object)*
  - **name**: *(required, string – minLength: 1 – maxLength: 32)*
    Human readable name of a resource
  - **image**: *([ResourceIdentifier](./common.md#resourceidentifier))*
    Reference with unique identifier for the image representing the scene only accepting “rtype”: “public_image” on creation
  - **appdata**: *(string – minLength: 1 – maxLength: 16)*
    Application specific data. Free format string.
- **group**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
  Group associated with this Scene. All services in the group are part of this scene. If the group is changed the scene is updated (e.g. light added/removed)
- **speed**: *(number – minimum: 0 – maximum: 1)*
  Speed of dynamic palette for this scene
- **auto_dynamic**: *(boolean)*
  Indicates whether to automatically start the scene dynamically on active recall
- **mapping**: *(object)*
  Details about the used scene mapping. Only available with SpatialAware.
  - **algorithm**: *(one of classic, spatial)*
    Algorithm used for the mapping

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

### GET /resource/scene

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
- **data**: *(required, array of SceneGet)*
  **Items**: SceneGet
  - **id**: *(required, string – pattern: ^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$)*
    Unique identifier representing a specific resource instance
  - **id_v1**: *(string – pattern: ^(\/[a-z]{4,32}\/[0-9a-zA-Z-]{1,32})?$)*
    Clip v1 resource identifier
  - **actions**: *(required, array of ActionGet)*
    List of actions to be executed synchronously on recall
    **Items**: ActionGet
    - **target**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
      The identifier of the light to execute the action on
    - **action**: *(required, object)*
      the action to be executed on recall
      - **on**: *(object)*
        - **on**: *(required, boolean)*
          On/Off state of the light on=true, off=false
      - **dimming**: *(object)*
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
      - **color**: *(object)*
        - **xy**: *(required, object)*
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
      - **color_temperature**: *(object)*
        - **mirek**: *(required, integer – minimum: 50 – maximum: 1000)*
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
      - **gradient**: *(object)*
        Basic feature containing gradient properties and rotation_2d.
        - **points**: *(required, array of GradientPointGet – maxItems: 5)*
          Collection of gradients points. For control of the gradient points through a PUT a minimum of 2 points need to be provided.
          **Items**: GradientPointGet
          - **color**: *(required, object)*
            - **xy**: *(required, object)*
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
        - **mode**: *(required, one of interpolated_palette, interpolated_palette_mirrored, random_pixelated, segmented_palette)*
          Mode in which the points are currently being deployed. If not provided during PUT/POST it will be defaulted to interpolated_palette
      - **effects**: *(object)*
        Deprecated: use effects_v2
        - **effect**: *(required, one of prism, opal, glisten, sparkle, fire, candle, underwater, cosmos, sunbeam, enchant, no_effect)*
      - **effects_v2**: *(object)*
        Basic feature containing effects v2 properties
        - **action**: *(required, object)*
          - **effect**: *(required, one of prism, opal, glisten, sparkle, fire, candle, underwater, cosmos, sunbeam, enchant, no_effect)*
          - **parameters**: *(object)*
            - **color**: *(object)*
              - **xy**: *(required, object)*
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
            - **color_temperature**: *(object)*
              - **mirek**: *(required, integer – minimum: 50 – maximum: 1000)*
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
            - **speed**: *(number – minimum: 0 – maximum: 1)*
      - **dynamics**: *(object)*
        - **duration**: *(integer)*
          Duration of a light transition in ms.
          **Example**:
          ```
          800
          ```
  - **palette**: *(object)*
    Group of colors that describe the palette of colors to be used when playing dynamics
    - **color**: *(required, array of ColorPaletteGet – minItems: 0 – maxItems: 9)*
      **Items**: ColorPaletteGet
      - **color**: *(required, object)*
        - **xy**: *(required, object)*
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
      - **dimming**: *(required, object)*
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
    - **dimming**: *(required, array of DimmingFeatureBasicGet – minItems: 0 – maxItems: 1)*
      **Items**: DimmingFeatureBasicGet
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
    - **color_temperature**: *(required, array of ColorTemperaturePaletteGet – minItems: 0 – maxItems: 1)*
      **Items**: ColorTemperaturePaletteGet
      - **color_temperature**: *(required, object)*
        - **mirek**: *(required, integer – minimum: 50 – maximum: 1000)*
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
      - **dimming**: *(required, object)*
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
    - **effects**: *(required, array of EffectFeatureBasicGet – minItems: 0 – maxItems: 3)*
      Deprecated. use effects_v2
      **Items**: EffectFeatureBasicGet
      - **effect**: *(required, one of prism, opal, glisten, sparkle, fire, candle, underwater, cosmos, sunbeam, enchant, no_effect)*
    - **effects_v2**: *(required, array of EffectV2FeatureBasicGet – minItems: 0 – maxItems: 3)*
      **Items**: EffectV2FeatureBasicGet
      - **action**: *(required, object)*
        - **effect**: *(required, one of prism, opal, glisten, sparkle, fire, candle, underwater, cosmos, sunbeam, enchant, no_effect)*
        - **parameters**: *(object)*
          - **color**: *(object)*
            - **xy**: *(required, object)*
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
          - **color_temperature**: *(object)*
            - **mirek**: *(required, integer – minimum: 50 – maximum: 1000)*
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
          - **speed**: *(number – minimum: 0 – maximum: 1)*
  - **recall**: *(required, object)*
  - **type**: *(required, scene)*
    Type of the supported resources
  - **metadata**: *(required, object)*
    - **name**: *(required, string – minLength: 1 – maxLength: 32)*
      Human readable name of a resource
    - **image**: *([ResourceIdentifier](./common.md#resourceidentifier))*
      Reference with unique identifier for the image representing the scene only accepting “rtype”: “public_image” on creation
    - **appdata**: *(string – minLength: 1 – maxLength: 16)*
      Application specific data. Free format string.
  - **group**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
    Group associated with this Scene. All services in the group are part of this scene. If the group is changed the scene is updated (e.g. light added/removed)
  - **speed**: *(required, number – minimum: 0 – maximum: 1)*
    Speed of dynamic palette for this scene
  - **auto_dynamic**: *(required, boolean)*
    Indicates whether to automatically start the scene dynamically on active recall
  - **status**: *(required, object)*
    Consists the information about the current status and last time it is recalled
    - **active**: *(one of inactive, static, dynamic_palette)*
    - **last_recall**: *(datetime)*
  - **mapping**: *(object)*
    Details about the used scene mapping. Only available with SpatialAware.
    - **algorithm**: *(one of classic, spatial)*
      Algorithm used for the mapping
  - **last_actions_update**: *(object)*
    - **source**: *(required, one of clip, autogrow)*
      Source of most recent actions list update. Autogrow means the system updated the scene because lights were added or removed.

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

## /resource/scene/{id}

API calls to read, update and delete a resource instance

### DELETE /resource/scene/{id}

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

### PUT /resource/scene/{id}

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
- **actions**: *(array of ActionPut)*
  List of actions to be executed synchronously on recall
  **Items**: ActionPut
  - **target**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
    The identifier of the light to execute the action on
  - **action**: *(required, object)*
    the action to be executed on recall
    - **on**: *(object)*
      - **on**: *(boolean)*
        On/Off state of the light on=true, off=false
    - **dimming**: *(object)*
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
    - **color**: *(object)*
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
    - **color_temperature**: *(object)*
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
    - **gradient**: *(object)*
      Basic feature containing gradient properties and rotation_2d.
      - **points**: *(required, array of GradientPointPut – maxItems: 5)*
        Collection of gradients points. For control of the gradient points through a PUT a minimum of 2 points need to be provided.
        **Items**: GradientPointPut
        - **color**: *(required, object)*
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
      - **mode**: *(one of interpolated_palette, interpolated_palette_mirrored, random_pixelated, segmented_palette)*
        Mode in which the points are currently being deployed. If not provided during PUT/POST it will be defaulted to interpolated_palette
    - **effects**: *(object)*
      Deprecated: use effects_v2
      - **effect**: *(one of prism, opal, glisten, sparkle, fire, candle, underwater, cosmos, sunbeam, enchant, no_effect)*
    - **effects_v2**: *(object)*
      Basic feature containing effects v2 properties
      - **action**: *(object)*
        - **effect**: *(required, one of prism, opal, glisten, sparkle, fire, candle, underwater, cosmos, sunbeam, enchant, no_effect)*
        - **parameters**: *(object)*
          - **color**: *(object)*
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
          - **color_temperature**: *(object)*
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
          - **speed**: *(number – minimum: 0 – maximum: 1)*
    - **dynamics**: *(object)*
      - **duration**: *(integer)*
        Duration of a light transition in ms.
        **Example**:
        ```
        800
        ```
- **palette**: *(object)*
  Group of colors that describe the palette of colors to be used when playing dynamics
  - **color**: *(required, array of ColorPalettePut – minItems: 0 – maxItems: 9)*
    **Items**: ColorPalettePut
    - **color**: *(required, object)*
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
    - **dimming**: *(required, object)*
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
  - **dimming**: *(required, array of DimmingFeatureBasicPut – minItems: 0 – maxItems: 1)*
    **Items**: DimmingFeatureBasicPut
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
  - **color_temperature**: *(required, array of ColorTemperaturePalettePut – minItems: 0 – maxItems: 1)*
    **Items**: ColorTemperaturePalettePut
    - **color_temperature**: *(required, object)*
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
    - **dimming**: *(required, object)*
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
  - **effects**: *(array of EffectFeatureBasicPut – minItems: 0 – maxItems: 3)*
    Deprecated. use effects_v2
    **Items**: EffectFeatureBasicPut
    - **effect**: *(one of prism, opal, glisten, sparkle, fire, candle, underwater, cosmos, sunbeam, enchant, no_effect)*
  - **effects_v2**: *(array of EffectV2FeatureBasicPut – minItems: 0 – maxItems: 3)*
    **Items**: EffectV2FeatureBasicPut
    - **action**: *(object)*
      - **effect**: *(required, one of prism, opal, glisten, sparkle, fire, candle, underwater, cosmos, sunbeam, enchant, no_effect)*
      - **parameters**: *(object)*
        - **color**: *(object)*
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
        - **color_temperature**: *(object)*
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
        - **speed**: *(number – minimum: 0 – maximum: 1)*
- **recall**: *(object)*
  - **action**: *(one of active, dynamic_palette, static)*
    When writing active, the actions in the scene are executed on the target. dynamic_palette starts dynamic scene with colors in the Palette object.
  - **duration**: *(integer)*
    transition to the scene within the timeframe given by duration
    **Example**:
    ```
    800
    ```
  - **dimming**: *(object)*
    override the scene dimming/brightness
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
- **type**: *(scene)*
  Type of the supported resources
- **metadata**: *(object)*
  - **name**: *(string – minLength: 1 – maxLength: 32)*
    Human readable name of a resource
  - **appdata**: *(string – minLength: 1 – maxLength: 16)*
    Application specific data. Free format string.
- **speed**: *(number – minimum: 0 – maximum: 1)*
  Speed of dynamic palette for this scene
- **auto_dynamic**: *(boolean)*
  Indicates whether to automatically start the scene dynamically on active recall
- **mapping**: *(object)*
  Details about the used scene mapping. Only available with SpatialAware.
  - **algorithm**: *(one of classic, spatial)*
    Algorithm used for the mapping

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

### GET /resource/scene/{id}

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
- **data**: *(required, array of SceneGet)*
  **Items**: SceneGet
  - **id**: *(required, string – pattern: ^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$)*
    Unique identifier representing a specific resource instance
  - **id_v1**: *(string – pattern: ^(\/[a-z]{4,32}\/[0-9a-zA-Z-]{1,32})?$)*
    Clip v1 resource identifier
  - **actions**: *(required, array of ActionGet)*
    List of actions to be executed synchronously on recall
    **Items**: ActionGet
    - **target**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
      The identifier of the light to execute the action on
    - **action**: *(required, object)*
      the action to be executed on recall
      - **on**: *(object)*
        - **on**: *(required, boolean)*
          On/Off state of the light on=true, off=false
      - **dimming**: *(object)*
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
      - **color**: *(object)*
        - **xy**: *(required, object)*
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
      - **color_temperature**: *(object)*
        - **mirek**: *(required, integer – minimum: 50 – maximum: 1000)*
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
      - **gradient**: *(object)*
        Basic feature containing gradient properties and rotation_2d.
        - **points**: *(required, array of GradientPointGet – maxItems: 5)*
          Collection of gradients points. For control of the gradient points through a PUT a minimum of 2 points need to be provided.
          **Items**: GradientPointGet
          - **color**: *(required, object)*
            - **xy**: *(required, object)*
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
        - **mode**: *(required, one of interpolated_palette, interpolated_palette_mirrored, random_pixelated, segmented_palette)*
          Mode in which the points are currently being deployed. If not provided during PUT/POST it will be defaulted to interpolated_palette
      - **effects**: *(object)*
        Deprecated: use effects_v2
        - **effect**: *(required, one of prism, opal, glisten, sparkle, fire, candle, underwater, cosmos, sunbeam, enchant, no_effect)*
      - **effects_v2**: *(object)*
        Basic feature containing effects v2 properties
        - **action**: *(required, object)*
          - **effect**: *(required, one of prism, opal, glisten, sparkle, fire, candle, underwater, cosmos, sunbeam, enchant, no_effect)*
          - **parameters**: *(object)*
            - **color**: *(object)*
              - **xy**: *(required, object)*
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
            - **color_temperature**: *(object)*
              - **mirek**: *(required, integer – minimum: 50 – maximum: 1000)*
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
            - **speed**: *(number – minimum: 0 – maximum: 1)*
      - **dynamics**: *(object)*
        - **duration**: *(integer)*
          Duration of a light transition in ms.
          **Example**:
          ```
          800
          ```
  - **palette**: *(object)*
    Group of colors that describe the palette of colors to be used when playing dynamics
    - **color**: *(required, array of ColorPaletteGet – minItems: 0 – maxItems: 9)*
      **Items**: ColorPaletteGet
      - **color**: *(required, object)*
        - **xy**: *(required, object)*
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
      - **dimming**: *(required, object)*
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
    - **dimming**: *(required, array of DimmingFeatureBasicGet – minItems: 0 – maxItems: 1)*
      **Items**: DimmingFeatureBasicGet
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
    - **color_temperature**: *(required, array of ColorTemperaturePaletteGet – minItems: 0 – maxItems: 1)*
      **Items**: ColorTemperaturePaletteGet
      - **color_temperature**: *(required, object)*
        - **mirek**: *(required, integer – minimum: 50 – maximum: 1000)*
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
      - **dimming**: *(required, object)*
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
    - **effects**: *(required, array of EffectFeatureBasicGet – minItems: 0 – maxItems: 3)*
      Deprecated. use effects_v2
      **Items**: EffectFeatureBasicGet
      - **effect**: *(required, one of prism, opal, glisten, sparkle, fire, candle, underwater, cosmos, sunbeam, enchant, no_effect)*
    - **effects_v2**: *(required, array of EffectV2FeatureBasicGet – minItems: 0 – maxItems: 3)*
      **Items**: EffectV2FeatureBasicGet
      - **action**: *(required, object)*
        - **effect**: *(required, one of prism, opal, glisten, sparkle, fire, candle, underwater, cosmos, sunbeam, enchant, no_effect)*
        - **parameters**: *(object)*
          - **color**: *(object)*
            - **xy**: *(required, object)*
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
          - **color_temperature**: *(object)*
            - **mirek**: *(required, integer – minimum: 50 – maximum: 1000)*
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
          - **speed**: *(number – minimum: 0 – maximum: 1)*
  - **recall**: *(required, object)*
  - **type**: *(required, scene)*
    Type of the supported resources
  - **metadata**: *(required, object)*
    - **name**: *(required, string – minLength: 1 – maxLength: 32)*
      Human readable name of a resource
    - **image**: *([ResourceIdentifier](./common.md#resourceidentifier))*
      Reference with unique identifier for the image representing the scene only accepting “rtype”: “public_image” on creation
    - **appdata**: *(string – minLength: 1 – maxLength: 16)*
      Application specific data. Free format string.
  - **group**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
    Group associated with this Scene. All services in the group are part of this scene. If the group is changed the scene is updated (e.g. light added/removed)
  - **speed**: *(required, number – minimum: 0 – maximum: 1)*
    Speed of dynamic palette for this scene
  - **auto_dynamic**: *(required, boolean)*
    Indicates whether to automatically start the scene dynamically on active recall
  - **status**: *(required, object)*
    Consists the information about the current status and last time it is recalled
    - **active**: *(one of inactive, static, dynamic_palette)*
    - **last_recall**: *(datetime)*
  - **mapping**: *(object)*
    Details about the used scene mapping. Only available with SpatialAware.
    - **algorithm**: *(one of classic, spatial)*
      Algorithm used for the mapping
  - **last_actions_update**: *(object)*
    - **source**: *(required, one of clip, autogrow)*
      Source of most recent actions list update. Autogrow means the system updated the scene because lights were added or removed.

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
