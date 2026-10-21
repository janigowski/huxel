# /resource/light

API to manage light services. These are offered by devices with lighting capabilities.

## /resource/light

### PUT /resource/light

> Secured by hue-application-key API authorization using a hue-application-key header

#### Request

###### Body

**Media type**: application/json

**Type**: array of OwnedResourcePut

**Items**: LightPut

- **id**: *(string – pattern: ^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$)*
  Unique identifier representing a specific resource instance
- **type**: *(light)*
  Type of the supported resources
- **metadata**: *(object)*
  Additional metadata including a user given name
  - **name**: *(string – minLength: 1 – maxLength: 32)*
    Human readable name of a resource
  - **archetype**: *(one of unknown_archetype, classic_bulb, sultan_bulb, flood_bulb, spot_bulb, candle_bulb, luster_bulb, pendant_round, pendant_long, ceiling_round, ceiling_square, floor_shade, floor_lantern, table_shade, recessed_ceiling, recessed_floor, single_spot, double_spot, table_wash, wall_lantern, wall_shade, flexible_lamp, ground_spot, wall_spot, plug, hue_go, hue_lightstrip, hue_iris, hue_bloom, bollard, wall_washer, hue_play, vintage_bulb, vintage_candle_bulb, ellipse_bulb, triangle_bulb, small_globe_bulb, large_globe_bulb, edison_bulb, christmas_tree, string_light, hue_centris, hue_lightstrip_tv, hue_lightstrip_pc, hue_tube, hue_signe, pendant_spot, ceiling_horizontal, ceiling_tube, up_and_down, up_and_down_up, up_and_down_down, hue_floodlight_camera, twilight, twilight_front, twilight_back, hue_play_wallwasher, hue_omniglow, hue_neon, string_globe, string_permanent, hue_go_xxl, rigid_tube, flexible_tube, panels, pendant_tube, vertical_tube, recessed_ceiling_tube, wall_rectangle, string_icicle, string_grid, string_net, hue_omniglow_arc, hue_flux_arc)*
    Deprecated: use metadata on device level
  - **function**: *(one of functional, decorative, mixed, unknown)*
    Function of the lightservice
- **identify**: *(object)*
  - **action**: *(required, identify)*
    - identify: Triggers a visual identification sequence, current implemented as (which can change in the future): Bridge performs Zigbee LED identification cycles for 5 seconds Lights perform one breathe cycle Sensors perform LED identification cycles for 15 seconds
  - **duration**: *(integer)*
    Duration in milliseconds to perform the identify cycle.
    **Example**:
    ```
    800
    ```
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
- **dimming_configuration**: *(object)*
  - **min_level**: *(required, number – maximum: 100)*
    Brightness percentage. Value 0 is the lowest possible brightness.
    **Example**:
    ```
    80
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
    "mirek_schema": {
      "mirek_minimum": 153,
      "mirek_maximum": 500
    },
    "mirek": 202,
    "mirek_valid": true
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
    },
    "gamut_type": "C",
    "gamut": {
      "red": {
        "x": 0.6915,
        "y": 0.3083
      },
      "green": {
        "x": 0.17,
        "y": 0.7
      },
      "blue": {
        "x": 0.1532,
        "y": 0.0475
      }
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
  - **speed**: *(number – minimum: 0 – maximum: 1)*
    speed of dynamic palette. The speed is only valid if the status is dynamic_palette.
- **alert**: *(object)*
  - **action**: *(required, breathe)*
    Alert to set the light to
- **signaling**: *(object)*
  Feature containing signaling properties.
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
- **gradient**: *(object)*
  Basic feature containing gradient properties.
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
    Effect to set the light to.
- **effects_v2**: *(object)*
  - **action**: *(object)*
    - **effect**: *(required, one of prism, opal, glisten, sparkle, fire, candle, underwater, cosmos, sunbeam, enchant, no_effect)*
      Effect to set the light to.
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
          "mirek": 202,
          "mirek_valid": true
        }
        ```
      - **speed**: *(number – minimum: 0 – maximum: 1)*
- **timed_effects**: *(object)*
  - **effect**: *(one of sunrise, sunset, no_effect)*
    Timed effect to set to the light.
  - **duration**: *(integer)*
    Duration in milliseconds. Duration is mandatory when timed effect is set except for no_effect. Resolution decreases for a larger duration. e.g Effects with duration smaller than a minute will be rounded to a resolution of 1s, while effects with duration larger than an hour will be arounded up to a resolution of 300s. Duration has a max of 21600000 ms.
    **Example**:
    ```
    800
    ```
- **powerup**: *(object)*
  Feature containing properties to configure powerup behaviour of a lightsource.
  - **preset**: *(required, one of safety, powerfail, last_on_state, custom)*
    When setting the custom preset the additional properties can be set. For all other presets, no other properties can be included.
  - **on**: *(object)*
    - **mode**: *(required, one of on, toggle, previous)*
      State to activate after powerup. On will use the value specified in the “on” property. When setting mode “on”, the on property must be included. Toggle will alternate between on and off on each subsequent power toggle. Previous will return to the state it was in before powering off.
    - **on**: *(object)*
      - **on**: *(boolean)*
        On/Off state of the light on=true, off=false
  - **dimming**: *(object)*
    - **mode**: *(required, one of dimming, previous)*
      Dimming will set the brightness to the specified value after power up. When setting mode “dimming”, the dimming property must be included. Previous will set brightness to the state it was in before powering off.
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
    - **mode**: *(required, one of color_temperature, color, previous)*
      State to activate after powerup. Availability of “color_temperature” and “color” modes depend on the capabilities of the lamp. Colortemperature will set the colortemperature to the specified value after power up. When setting color_temperature, the color_temperature property must be included Color will set the color tot he specified value after power up. When setting color mode, the color property must be included Previous will set color to the state it was in before powering off.
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
- **content_configuration**: *(object)*
  Configuration parameters that affect how content is deployed on a product
  - **orientation**: *(object)*
    Orientation for content deployed on pixelated products when applicable (e.g. sunrise, candle)
    - **orientation**: *(one of horizontal, vertical)*
  - **order**: *(object)*
    Order in which the content is represented on the pixels
    - **order**: *(one of forward, reversed)*
  - **association**: *(object)*
    Indicates if the service is associated with something, e.g. a screen
    - **association**: *(one of not_associated, screen)*
      Defines what object the service is associated with
      - not_associated: Not associated – screen: Associated with a screen by placing it behind or around the screen following an arc
- **geometry**: *(object)*
  Feature describing the geometry a light service.
  - **pixel_positions**: *(array of PixelPosition – maxItems: 5)*
    **Items**: PixelPosition
    - **index**: *(required, integer – minimum: 0)*
      Index of the pixel to which the position belongs, use 0 for non-gradient lights
    - **position**: *(required, object)*
      Position of the pixel in 3D space. Range of coordinates is -100 to 100 meters.
      - **x**: *(required, number)*
      - **y**: *(required, number)*
      - **z**: *(required, number)*

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

### GET /resource/light

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
- **data**: *(required, array of LightGet)*
  **Items**: LightGet
  - **id**: *(required, string – pattern: ^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$)*
    Unique identifier representing a specific resource instance
  - **id_v1**: *(string – pattern: ^(\/[a-z]{4,32}\/[0-9a-zA-Z-]{1,32})?$)*
    Clip v1 resource identifier
  - **owner**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
    Owner of the service, in case the owner service is deleted, the service also gets deleted
  - **type**: *(required, light)*
    Type of the supported resources
  - **metadata**: *(required, object)*
    Additional metadata including a user given name
    - **name**: *(required, string – minLength: 1 – maxLength: 32)*
      Human readable name of a resource
    - **archetype**: *(required, one of unknown_archetype, classic_bulb, sultan_bulb, flood_bulb, spot_bulb, candle_bulb, luster_bulb, pendant_round, pendant_long, ceiling_round, ceiling_square, floor_shade, floor_lantern, table_shade, recessed_ceiling, recessed_floor, single_spot, double_spot, table_wash, wall_lantern, wall_shade, flexible_lamp, ground_spot, wall_spot, plug, hue_go, hue_lightstrip, hue_iris, hue_bloom, bollard, wall_washer, hue_play, vintage_bulb, vintage_candle_bulb, ellipse_bulb, triangle_bulb, small_globe_bulb, large_globe_bulb, edison_bulb, christmas_tree, string_light, hue_centris, hue_lightstrip_tv, hue_lightstrip_pc, hue_tube, hue_signe, pendant_spot, ceiling_horizontal, ceiling_tube, up_and_down, up_and_down_up, up_and_down_down, hue_floodlight_camera, twilight, twilight_front, twilight_back, hue_play_wallwasher, hue_omniglow, hue_neon, string_globe, string_permanent, hue_go_xxl, rigid_tube, flexible_tube, panels, pendant_tube, vertical_tube, recessed_ceiling_tube, wall_rectangle, string_icicle, string_grid, string_net, hue_omniglow_arc, hue_flux_arc)*
      Deprecated: use metadata on device level
    - **fixed_mired**: *(integer – minimum: 50 – maximum: 1000)*
      A fixed mired value of the white lamp
      **Example**:
      ```
      233
      ```
    - **function**: *(required, one of functional, decorative, mixed, unknown)*
      Function of the lightservice
  - **product_data**: *(object)*
    Factory defaults of the product data
    - **name**: *(string – minLength: 1 – maxLength: 32)*
      Name of the lightservice, only available for devices with multiple lightservices
    - **archetype**: *(one of unknown_archetype, classic_bulb, sultan_bulb, flood_bulb, spot_bulb, candle_bulb, luster_bulb, pendant_round, pendant_long, ceiling_round, ceiling_square, floor_shade, floor_lantern, table_shade, recessed_ceiling, recessed_floor, single_spot, double_spot, table_wash, wall_lantern, wall_shade, flexible_lamp, ground_spot, wall_spot, plug, hue_go, hue_lightstrip, hue_iris, hue_bloom, bollard, wall_washer, hue_play, vintage_bulb, vintage_candle_bulb, ellipse_bulb, triangle_bulb, small_globe_bulb, large_globe_bulb, edison_bulb, christmas_tree, string_light, hue_centris, hue_lightstrip_tv, hue_lightstrip_pc, hue_tube, hue_signe, pendant_spot, ceiling_horizontal, ceiling_tube, up_and_down, up_and_down_up, up_and_down_down, hue_floodlight_camera, twilight, twilight_front, twilight_back, hue_play_wallwasher, hue_omniglow, hue_neon, string_globe, string_permanent, hue_go_xxl, rigid_tube, flexible_tube, panels, pendant_tube, vertical_tube, recessed_ceiling_tube, wall_rectangle, string_icicle, string_grid, string_net, hue_omniglow_arc, hue_flux_arc)*
      Archetype of the lightservice, only available for devices with multiple lightservices
    - **function**: *(required, one of functional, decorative, mixed, unknown)*
      Function of the lightservice
  - **identify**: *(required, object)*
  - **service_id**: *(required, integer – minimum: 0)*
    Service identification number. 0 indicates service of a single instance
  - **on**: *(required, object)*
    - **on**: *(required, boolean)*
      On/Off state of the light on=true, off=false
  - **dimming**: *(object)*
    - **brightness**: *(required, number – maximum: 100)*
      Brightness percentage. Value 0 is the lowest possible brightness.
      **Example**:
      ```
      80
      ```
    - **min_dim_level**: *(number – minimum: 0 – maximum: 100)*
      Percentage of the maximum lumen the device outputs on minimum brightness
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
  - **dimming_configuration**: *(object)*
    - **status**: *(required, one of set, changing)*
    - **min_level**: *(required, number – maximum: 100)*
      Brightness percentage. Value 0 is the lowest possible brightness.
      **Example**:
      ```
      80
      ```
  - **color_temperature**: *(object)*
    - **mirek**: *(required, integer – minimum: 50 – maximum: 1000)*
      color temperature in mirek or null when the light color is not in the ct spectrum
      **Example**:
      ```
      233
      ```
    - **mirek_valid**: *(required, boolean)*
      Indication whether the value presented in mirek is valid
    - **mirek_schema**: *(required, object)*
      - **mirek_minimum**: *(required, integer – minimum: 50 – maximum: 1000)*
        minimum color temperature this light supports
        **Example**:
        ```
        233
        ```
      - **mirek_maximum**: *(required, integer – minimum: 50 – maximum: 1000)*
        maximum color temperature this light supports
        **Example**:
        ```
        233
        ```
    **Example**:
    ```json
    {
      "mirek_schema": {
        "mirek_minimum": 153,
        "mirek_maximum": 500
      },
      "mirek": 202,
      "mirek_valid": true
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
    - **gamut**: *(object)*
      Color gamut of color bulb. Some bulbs do not properly return the Gamut information. In this case this is not present.
      - **red**: *(required, object)*
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
      - **green**: *(required, object)*
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
      - **blue**: *(required, object)*
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
    - **gamut_type**: *(required, one of A, B, C, other)*
      The gammut types supported by hue – A Gamut of early Philips color-only products – B Limited gamut of first Hue color products – C Richer color gamut of Hue white and color ambiance products – other Color gamut of non-hue products with non-hue gamuts resp w/o gamut
    **Example**:
    ```json
    {
      "xy": {
        "x": 0.6915,
        "y": 0.3083
      },
      "gamut_type": "C",
      "gamut": {
        "red": {
          "x": 0.6915,
          "y": 0.3083
        },
        "green": {
          "x": 0.17,
          "y": 0.7
        },
        "blue": {
          "x": 0.1532,
          "y": 0.0475
        }
      }
    }
    ```
  - **dynamics**: *(object)*
    - **status**: *(required, one of dynamic_palette, none)*
      Current status of the lamp with dynamics.
    - **status_values**: *(required, array of SupportedDynamicStatus)*
      Statuses in which a lamp could be when playing dynamics.
    - **speed**: *(required, number – minimum: 0 – maximum: 1)*
      speed of dynamic palette. The speed is only valid if the status is dynamic_palette.
    - **speed_valid**: *(required, boolean)*
      Indicates whether the value presented in speed is valid
  - **alert**: *(object)*
    - **action_values**: *(required, array of AlertEffectType)*
      Alert effects that the light supports.
  - **signaling**: *(object)*
    Feature containing signaling properties.
    - **signal_values**: *(required, array of SupportedSignals)*
      Signals that the light supports.
    - **status**: *(object)*
      Indicates status of active signal. Not available when inactive.
      - **signal**: *(required, one of no_signal, on_off, on_off_color, alternating)*
        Indicates which signal is currently active.
      - **estimated_end**: *(required, datetime)*
        Timestamp indicating when the active signal is expected to end. Value is not set if there is no_signal
      - **colors**: *(required, array of ColorFeatureBasicGet)*
        Colors that were provided for the active effect.
        **Items**: ColorFeatureBasicGet
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
  - **mode**: *(required, one of normal, streaming)*
    Mode the light is currently in
  - **gradient**: *(object)*
    Basic feature containing gradient properties.
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
    - **points_capable**: *(required, integer)*
      Number of color points that gradient lamp is capable of showing with gradience.
    - **mode_values**: *(required, array of SupportedGradientModes)*
      Modes a gradient device can deploy the gradient palette of colors
    - **pixel_count**: *(integer)*
      Number of pixels in the device
  - **effects**: *(object)*
    Deprecated: use effects_v2
    - **status_values**: *(required, array of SupportedEffects)*
      Possible status values in which a light could be when playing an effect.
    - **status**: *(required, one of prism, opal, glisten, sparkle, fire, candle, underwater, cosmos, sunbeam, enchant, no_effect)*
      Current status values the light is in regarding effects
    - **effect_values**: *(required, array of SupportedEffects)*
      Possible effect values you can set in a light.
  - **effects_v2**: *(object)*
    - **action**: *(required, object)*
      - **effect_values**: *(required, array of SupportedEffects)*
        Possible effect values you can set in a light.
    - **status**: *(required, object)*
      - **effect**: *(required, one of prism, opal, glisten, sparkle, fire, candle, underwater, cosmos, sunbeam, enchant, no_effect)*
      - **effect_values**: *(required, array of SupportedEffects)*
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
          - **mirek_valid**: *(required, boolean)*
            Indication whether the value presented in mirek is valid
          **Example**:
          ```json
          {
            "mirek": 202,
            "mirek_valid": true
          }
          ```
        - **speed**: *(required, number – minimum: 0 – maximum: 1)*
  - **timed_effects**: *(object)*
    - **status_values**: *(required, array of SupportedTimedEffects)*
      Possible status values in which a light could be when playing a timed effect.
    - **status**: *(required, one of sunrise, sunset, no_effect)*
      Current status values the light is in regarding timed effects
    - **effect_values**: *(required, array of SupportedTimedEffects)*
      Possible timed effect values you can set in a light.
  - **powerup**: *(object)*
    Feature containing properties to configure powerup behaviour of a lightsource.
    - **preset**: *(required, one of safety, powerfail, last_on_state, custom)*
      When setting the custom preset the additional properties can be set. For all other presets, no other properties can be included.
    - **configured**: *(required, boolean)*
      Indicates if the shown values have been configured in the lightsource.
    - **on**: *(required, object)*
      - **mode**: *(required, one of on, toggle, previous)*
        State to activate after powerup. On will use the value specified in the “on” property. When setting mode “on”, the on property must be included. Toggle will alternate between on and off on each subsequent power toggle. Previous will return to the state it was in before powering off.
      - **on**: *(object)*
        - **on**: *(required, boolean)*
          On/Off state of the light on=true, off=false
    - **dimming**: *(object)*
      - **mode**: *(required, one of dimming, previous)*
        Dimming will set the brightness to the specified value after power up. When setting mode “dimming”, the dimming property must be included. Previous will set brightness to the state it was in before powering off.
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
      - **mode**: *(required, one of color_temperature, color, previous)*
        State to activate after powerup. Availability of “color_temperature” and “color” modes depend on the capabilities of the lamp. Colortemperature will set the colortemperature to the specified value after power up. When setting color_temperature, the color_temperature property must be included Color will set the color tot he specified value after power up. When setting color mode, the color property must be included Previous will set color to the state it was in before powering off.
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
  - **content_configuration**: *(object)*
    Configuration parameters that affect how content is deployed on a product
    - **orientation**: *(object)*
      Orientation for content deployed on pixelated products when applicable (e.g. sunrise, candle)
      - **status**: *(required, one of set, changing)*
      - **configurable**: *(required, boolean)*
        Indicates if the product allows modifying the configuration attribute
      - **orientation**: *(required, one of horizontal, vertical)*
    - **order**: *(object)*
      Order in which the content is represented on the pixels
      - **status**: *(required, one of set, changing)*
      - **configurable**: *(required, boolean)*
        Indicates if the product allows modifying the configuration attribute
      - **order**: *(required, one of forward, reversed)*
    - **association**: *(object)*
      Indicates if the service is associated with something, e.g. a screen
      - **association**: *(required, one of not_associated, screen)*
        Defines what object the service is associated with
        - not_associated: Not associated – screen: Associated with a screen by placing it behind or around the screen following an arc
  - **geometry**: *(object)*
    Feature describing the geometry a light service.
    - **pixel_positions**: *(array of PixelPosition – maxItems: 5)*
      **Items**: PixelPosition
      - **index**: *(required, integer – minimum: 0)*
        Index of the pixel to which the position belongs, use 0 for non-gradient lights
      - **position**: *(required, object)*
        Position of the pixel in 3D space. Range of coordinates is -100 to 100 meters.
        - **x**: *(required, number)*
        - **y**: *(required, number)*
        - **z**: *(required, number)*

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

## /resource/light/{id}

API calls for resource which cannot be deleted (PUT and GET on resource instance)

### PUT /resource/light/{id}

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
- **type**: *(light)*
  Type of the supported resources
- **metadata**: *(object)*
  Additional metadata including a user given name
  - **name**: *(string – minLength: 1 – maxLength: 32)*
    Human readable name of a resource
  - **archetype**: *(one of unknown_archetype, classic_bulb, sultan_bulb, flood_bulb, spot_bulb, candle_bulb, luster_bulb, pendant_round, pendant_long, ceiling_round, ceiling_square, floor_shade, floor_lantern, table_shade, recessed_ceiling, recessed_floor, single_spot, double_spot, table_wash, wall_lantern, wall_shade, flexible_lamp, ground_spot, wall_spot, plug, hue_go, hue_lightstrip, hue_iris, hue_bloom, bollard, wall_washer, hue_play, vintage_bulb, vintage_candle_bulb, ellipse_bulb, triangle_bulb, small_globe_bulb, large_globe_bulb, edison_bulb, christmas_tree, string_light, hue_centris, hue_lightstrip_tv, hue_lightstrip_pc, hue_tube, hue_signe, pendant_spot, ceiling_horizontal, ceiling_tube, up_and_down, up_and_down_up, up_and_down_down, hue_floodlight_camera, twilight, twilight_front, twilight_back, hue_play_wallwasher, hue_omniglow, hue_neon, string_globe, string_permanent, hue_go_xxl, rigid_tube, flexible_tube, panels, pendant_tube, vertical_tube, recessed_ceiling_tube, wall_rectangle, string_icicle, string_grid, string_net, hue_omniglow_arc, hue_flux_arc)*
    Deprecated: use metadata on device level
  - **function**: *(one of functional, decorative, mixed, unknown)*
    Function of the lightservice
- **identify**: *(object)*
  - **action**: *(required, identify)*
    - identify: Triggers a visual identification sequence, current implemented as (which can change in the future): Bridge performs Zigbee LED identification cycles for 5 seconds Lights perform one breathe cycle Sensors perform LED identification cycles for 15 seconds
  - **duration**: *(integer)*
    Duration in milliseconds to perform the identify cycle.
    **Example**:
    ```
    800
    ```
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
- **dimming_configuration**: *(object)*
  - **min_level**: *(required, number – maximum: 100)*
    Brightness percentage. Value 0 is the lowest possible brightness.
    **Example**:
    ```
    80
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
    "mirek_schema": {
      "mirek_minimum": 153,
      "mirek_maximum": 500
    },
    "mirek": 202,
    "mirek_valid": true
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
    },
    "gamut_type": "C",
    "gamut": {
      "red": {
        "x": 0.6915,
        "y": 0.3083
      },
      "green": {
        "x": 0.17,
        "y": 0.7
      },
      "blue": {
        "x": 0.1532,
        "y": 0.0475
      }
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
  - **speed**: *(number – minimum: 0 – maximum: 1)*
    speed of dynamic palette. The speed is only valid if the status is dynamic_palette.
- **alert**: *(object)*
  - **action**: *(required, breathe)*
    Alert to set the light to
- **signaling**: *(object)*
  Feature containing signaling properties.
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
- **gradient**: *(object)*
  Basic feature containing gradient properties.
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
    Effect to set the light to.
- **effects_v2**: *(object)*
  - **action**: *(object)*
    - **effect**: *(required, one of prism, opal, glisten, sparkle, fire, candle, underwater, cosmos, sunbeam, enchant, no_effect)*
      Effect to set the light to.
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
          "mirek": 202,
          "mirek_valid": true
        }
        ```
      - **speed**: *(number – minimum: 0 – maximum: 1)*
- **timed_effects**: *(object)*
  - **effect**: *(one of sunrise, sunset, no_effect)*
    Timed effect to set to the light.
  - **duration**: *(integer)*
    Duration in milliseconds. Duration is mandatory when timed effect is set except for no_effect. Resolution decreases for a larger duration. e.g Effects with duration smaller than a minute will be rounded to a resolution of 1s, while effects with duration larger than an hour will be arounded up to a resolution of 300s. Duration has a max of 21600000 ms.
    **Example**:
    ```
    800
    ```
- **powerup**: *(object)*
  Feature containing properties to configure powerup behaviour of a lightsource.
  - **preset**: *(required, one of safety, powerfail, last_on_state, custom)*
    When setting the custom preset the additional properties can be set. For all other presets, no other properties can be included.
  - **on**: *(object)*
    - **mode**: *(required, one of on, toggle, previous)*
      State to activate after powerup. On will use the value specified in the “on” property. When setting mode “on”, the on property must be included. Toggle will alternate between on and off on each subsequent power toggle. Previous will return to the state it was in before powering off.
    - **on**: *(object)*
      - **on**: *(boolean)*
        On/Off state of the light on=true, off=false
  - **dimming**: *(object)*
    - **mode**: *(required, one of dimming, previous)*
      Dimming will set the brightness to the specified value after power up. When setting mode “dimming”, the dimming property must be included. Previous will set brightness to the state it was in before powering off.
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
    - **mode**: *(required, one of color_temperature, color, previous)*
      State to activate after powerup. Availability of “color_temperature” and “color” modes depend on the capabilities of the lamp. Colortemperature will set the colortemperature to the specified value after power up. When setting color_temperature, the color_temperature property must be included Color will set the color tot he specified value after power up. When setting color mode, the color property must be included Previous will set color to the state it was in before powering off.
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
- **content_configuration**: *(object)*
  Configuration parameters that affect how content is deployed on a product
  - **orientation**: *(object)*
    Orientation for content deployed on pixelated products when applicable (e.g. sunrise, candle)
    - **orientation**: *(one of horizontal, vertical)*
  - **order**: *(object)*
    Order in which the content is represented on the pixels
    - **order**: *(one of forward, reversed)*
  - **association**: *(object)*
    Indicates if the service is associated with something, e.g. a screen
    - **association**: *(one of not_associated, screen)*
      Defines what object the service is associated with
      - not_associated: Not associated – screen: Associated with a screen by placing it behind or around the screen following an arc
- **geometry**: *(object)*
  Feature describing the geometry a light service.
  - **pixel_positions**: *(array of PixelPosition – maxItems: 5)*
    **Items**: PixelPosition
    - **index**: *(required, integer – minimum: 0)*
      Index of the pixel to which the position belongs, use 0 for non-gradient lights
    - **position**: *(required, object)*
      Position of the pixel in 3D space. Range of coordinates is -100 to 100 meters.
      - **x**: *(required, number)*
      - **y**: *(required, number)*
      - **z**: *(required, number)*

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

### GET /resource/light/{id}

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
- **data**: *(required, array of LightGet)*
  **Items**: LightGet
  - **id**: *(required, string – pattern: ^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$)*
    Unique identifier representing a specific resource instance
  - **id_v1**: *(string – pattern: ^(\/[a-z]{4,32}\/[0-9a-zA-Z-]{1,32})?$)*
    Clip v1 resource identifier
  - **owner**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
    Owner of the service, in case the owner service is deleted, the service also gets deleted
  - **type**: *(required, light)*
    Type of the supported resources
  - **metadata**: *(required, object)*
    Additional metadata including a user given name
    - **name**: *(required, string – minLength: 1 – maxLength: 32)*
      Human readable name of a resource
    - **archetype**: *(required, one of unknown_archetype, classic_bulb, sultan_bulb, flood_bulb, spot_bulb, candle_bulb, luster_bulb, pendant_round, pendant_long, ceiling_round, ceiling_square, floor_shade, floor_lantern, table_shade, recessed_ceiling, recessed_floor, single_spot, double_spot, table_wash, wall_lantern, wall_shade, flexible_lamp, ground_spot, wall_spot, plug, hue_go, hue_lightstrip, hue_iris, hue_bloom, bollard, wall_washer, hue_play, vintage_bulb, vintage_candle_bulb, ellipse_bulb, triangle_bulb, small_globe_bulb, large_globe_bulb, edison_bulb, christmas_tree, string_light, hue_centris, hue_lightstrip_tv, hue_lightstrip_pc, hue_tube, hue_signe, pendant_spot, ceiling_horizontal, ceiling_tube, up_and_down, up_and_down_up, up_and_down_down, hue_floodlight_camera, twilight, twilight_front, twilight_back, hue_play_wallwasher, hue_omniglow, hue_neon, string_globe, string_permanent, hue_go_xxl, rigid_tube, flexible_tube, panels, pendant_tube, vertical_tube, recessed_ceiling_tube, wall_rectangle, string_icicle, string_grid, string_net, hue_omniglow_arc, hue_flux_arc)*
      Deprecated: use metadata on device level
    - **fixed_mired**: *(integer – minimum: 50 – maximum: 1000)*
      A fixed mired value of the white lamp
      **Example**:
      ```
      233
      ```
    - **function**: *(required, one of functional, decorative, mixed, unknown)*
      Function of the lightservice
  - **product_data**: *(object)*
    Factory defaults of the product data
    - **name**: *(string – minLength: 1 – maxLength: 32)*
      Name of the lightservice, only available for devices with multiple lightservices
    - **archetype**: *(one of unknown_archetype, classic_bulb, sultan_bulb, flood_bulb, spot_bulb, candle_bulb, luster_bulb, pendant_round, pendant_long, ceiling_round, ceiling_square, floor_shade, floor_lantern, table_shade, recessed_ceiling, recessed_floor, single_spot, double_spot, table_wash, wall_lantern, wall_shade, flexible_lamp, ground_spot, wall_spot, plug, hue_go, hue_lightstrip, hue_iris, hue_bloom, bollard, wall_washer, hue_play, vintage_bulb, vintage_candle_bulb, ellipse_bulb, triangle_bulb, small_globe_bulb, large_globe_bulb, edison_bulb, christmas_tree, string_light, hue_centris, hue_lightstrip_tv, hue_lightstrip_pc, hue_tube, hue_signe, pendant_spot, ceiling_horizontal, ceiling_tube, up_and_down, up_and_down_up, up_and_down_down, hue_floodlight_camera, twilight, twilight_front, twilight_back, hue_play_wallwasher, hue_omniglow, hue_neon, string_globe, string_permanent, hue_go_xxl, rigid_tube, flexible_tube, panels, pendant_tube, vertical_tube, recessed_ceiling_tube, wall_rectangle, string_icicle, string_grid, string_net, hue_omniglow_arc, hue_flux_arc)*
      Archetype of the lightservice, only available for devices with multiple lightservices
    - **function**: *(required, one of functional, decorative, mixed, unknown)*
      Function of the lightservice
  - **identify**: *(required, object)*
  - **service_id**: *(required, integer – minimum: 0)*
    Service identification number. 0 indicates service of a single instance
  - **on**: *(required, object)*
    - **on**: *(required, boolean)*
      On/Off state of the light on=true, off=false
  - **dimming**: *(object)*
    - **brightness**: *(required, number – maximum: 100)*
      Brightness percentage. Value 0 is the lowest possible brightness.
      **Example**:
      ```
      80
      ```
    - **min_dim_level**: *(number – minimum: 0 – maximum: 100)*
      Percentage of the maximum lumen the device outputs on minimum brightness
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
  - **dimming_configuration**: *(object)*
    - **status**: *(required, one of set, changing)*
    - **min_level**: *(required, number – maximum: 100)*
      Brightness percentage. Value 0 is the lowest possible brightness.
      **Example**:
      ```
      80
      ```
  - **color_temperature**: *(object)*
    - **mirek**: *(required, integer – minimum: 50 – maximum: 1000)*
      color temperature in mirek or null when the light color is not in the ct spectrum
      **Example**:
      ```
      233
      ```
    - **mirek_valid**: *(required, boolean)*
      Indication whether the value presented in mirek is valid
    - **mirek_schema**: *(required, object)*
      - **mirek_minimum**: *(required, integer – minimum: 50 – maximum: 1000)*
        minimum color temperature this light supports
        **Example**:
        ```
        233
        ```
      - **mirek_maximum**: *(required, integer – minimum: 50 – maximum: 1000)*
        maximum color temperature this light supports
        **Example**:
        ```
        233
        ```
    **Example**:
    ```json
    {
      "mirek_schema": {
        "mirek_minimum": 153,
        "mirek_maximum": 500
      },
      "mirek": 202,
      "mirek_valid": true
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
    - **gamut**: *(object)*
      Color gamut of color bulb. Some bulbs do not properly return the Gamut information. In this case this is not present.
      - **red**: *(required, object)*
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
      - **green**: *(required, object)*
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
      - **blue**: *(required, object)*
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
    - **gamut_type**: *(required, one of A, B, C, other)*
      The gammut types supported by hue – A Gamut of early Philips color-only products – B Limited gamut of first Hue color products – C Richer color gamut of Hue white and color ambiance products – other Color gamut of non-hue products with non-hue gamuts resp w/o gamut
    **Example**:
    ```json
    {
      "xy": {
        "x": 0.6915,
        "y": 0.3083
      },
      "gamut_type": "C",
      "gamut": {
        "red": {
          "x": 0.6915,
          "y": 0.3083
        },
        "green": {
          "x": 0.17,
          "y": 0.7
        },
        "blue": {
          "x": 0.1532,
          "y": 0.0475
        }
      }
    }
    ```
  - **dynamics**: *(object)*
    - **status**: *(required, one of dynamic_palette, none)*
      Current status of the lamp with dynamics.
    - **status_values**: *(required, array of SupportedDynamicStatus)*
      Statuses in which a lamp could be when playing dynamics.
    - **speed**: *(required, number – minimum: 0 – maximum: 1)*
      speed of dynamic palette. The speed is only valid if the status is dynamic_palette.
    - **speed_valid**: *(required, boolean)*
      Indicates whether the value presented in speed is valid
  - **alert**: *(object)*
    - **action_values**: *(required, array of AlertEffectType)*
      Alert effects that the light supports.
  - **signaling**: *(object)*
    Feature containing signaling properties.
    - **signal_values**: *(required, array of SupportedSignals)*
      Signals that the light supports.
    - **status**: *(object)*
      Indicates status of active signal. Not available when inactive.
      - **signal**: *(required, one of no_signal, on_off, on_off_color, alternating)*
        Indicates which signal is currently active.
      - **estimated_end**: *(required, datetime)*
        Timestamp indicating when the active signal is expected to end. Value is not set if there is no_signal
      - **colors**: *(required, array of ColorFeatureBasicGet)*
        Colors that were provided for the active effect.
        **Items**: ColorFeatureBasicGet
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
  - **mode**: *(required, one of normal, streaming)*
    Mode the light is currently in
  - **gradient**: *(object)*
    Basic feature containing gradient properties.
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
    - **points_capable**: *(required, integer)*
      Number of color points that gradient lamp is capable of showing with gradience.
    - **mode_values**: *(required, array of SupportedGradientModes)*
      Modes a gradient device can deploy the gradient palette of colors
    - **pixel_count**: *(integer)*
      Number of pixels in the device
  - **effects**: *(object)*
    Deprecated: use effects_v2
    - **status_values**: *(required, array of SupportedEffects)*
      Possible status values in which a light could be when playing an effect.
    - **status**: *(required, one of prism, opal, glisten, sparkle, fire, candle, underwater, cosmos, sunbeam, enchant, no_effect)*
      Current status values the light is in regarding effects
    - **effect_values**: *(required, array of SupportedEffects)*
      Possible effect values you can set in a light.
  - **effects_v2**: *(object)*
    - **action**: *(required, object)*
      - **effect_values**: *(required, array of SupportedEffects)*
        Possible effect values you can set in a light.
    - **status**: *(required, object)*
      - **effect**: *(required, one of prism, opal, glisten, sparkle, fire, candle, underwater, cosmos, sunbeam, enchant, no_effect)*
      - **effect_values**: *(required, array of SupportedEffects)*
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
          - **mirek_valid**: *(required, boolean)*
            Indication whether the value presented in mirek is valid
          **Example**:
          ```json
          {
            "mirek": 202,
            "mirek_valid": true
          }
          ```
        - **speed**: *(required, number – minimum: 0 – maximum: 1)*
  - **timed_effects**: *(object)*
    - **status_values**: *(required, array of SupportedTimedEffects)*
      Possible status values in which a light could be when playing a timed effect.
    - **status**: *(required, one of sunrise, sunset, no_effect)*
      Current status values the light is in regarding timed effects
    - **effect_values**: *(required, array of SupportedTimedEffects)*
      Possible timed effect values you can set in a light.
  - **powerup**: *(object)*
    Feature containing properties to configure powerup behaviour of a lightsource.
    - **preset**: *(required, one of safety, powerfail, last_on_state, custom)*
      When setting the custom preset the additional properties can be set. For all other presets, no other properties can be included.
    - **configured**: *(required, boolean)*
      Indicates if the shown values have been configured in the lightsource.
    - **on**: *(required, object)*
      - **mode**: *(required, one of on, toggle, previous)*
        State to activate after powerup. On will use the value specified in the “on” property. When setting mode “on”, the on property must be included. Toggle will alternate between on and off on each subsequent power toggle. Previous will return to the state it was in before powering off.
      - **on**: *(object)*
        - **on**: *(required, boolean)*
          On/Off state of the light on=true, off=false
    - **dimming**: *(object)*
      - **mode**: *(required, one of dimming, previous)*
        Dimming will set the brightness to the specified value after power up. When setting mode “dimming”, the dimming property must be included. Previous will set brightness to the state it was in before powering off.
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
      - **mode**: *(required, one of color_temperature, color, previous)*
        State to activate after powerup. Availability of “color_temperature” and “color” modes depend on the capabilities of the lamp. Colortemperature will set the colortemperature to the specified value after power up. When setting color_temperature, the color_temperature property must be included Color will set the color tot he specified value after power up. When setting color mode, the color property must be included Previous will set color to the state it was in before powering off.
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
  - **content_configuration**: *(object)*
    Configuration parameters that affect how content is deployed on a product
    - **orientation**: *(object)*
      Orientation for content deployed on pixelated products when applicable (e.g. sunrise, candle)
      - **status**: *(required, one of set, changing)*
      - **configurable**: *(required, boolean)*
        Indicates if the product allows modifying the configuration attribute
      - **orientation**: *(required, one of horizontal, vertical)*
    - **order**: *(object)*
      Order in which the content is represented on the pixels
      - **status**: *(required, one of set, changing)*
      - **configurable**: *(required, boolean)*
        Indicates if the product allows modifying the configuration attribute
      - **order**: *(required, one of forward, reversed)*
    - **association**: *(object)*
      Indicates if the service is associated with something, e.g. a screen
      - **association**: *(required, one of not_associated, screen)*
        Defines what object the service is associated with
        - not_associated: Not associated – screen: Associated with a screen by placing it behind or around the screen following an arc
  - **geometry**: *(object)*
    Feature describing the geometry a light service.
    - **pixel_positions**: *(array of PixelPosition – maxItems: 5)*
      **Items**: PixelPosition
      - **index**: *(required, integer – minimum: 0)*
        Index of the pixel to which the position belongs, use 0 for non-gradient lights
      - **position**: *(required, object)*
        Position of the pixel in 3D space. Range of coordinates is -100 to 100 meters.
        - **x**: *(required, number)*
        - **y**: *(required, number)*
        - **z**: *(required, number)*

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
