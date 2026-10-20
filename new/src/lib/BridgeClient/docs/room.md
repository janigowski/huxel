# /resource/room

API to manage rooms. Rooms group devices and each device can only be part of one room.

## /resource/room

### POST /resource/room

create a new resource of this type

> Secured by hue-application-key API authorization using a hue-application-key header

#### Request

###### Body

**Media type**: application/json

**Type**: object

**Properties**

- **children**: *(required, array of [ResourceIdentifier](./common.md#resourceidentifier))*
  Child devices/services to group by the derived group
- **type**: *(room)*
  Type of the supported resources
- **metadata**: *(required, object)*
  configuration object for a room
  - **name**: *(required, string – minLength: 1 – maxLength: 32)*
    Human readable name of a resource
  - **archetype**: *(required, one of living_room, kitchen, dining, bedroom, kids_bedroom, bathroom, nursery, recreation, office, gym, hallway, toilet, front_door, garage, terrace, garden, driveway, carport, home, downstairs, upstairs, top_floor, attic, guest_room, staircase, lounge, man_cave, computer, studio, music, tv, reading, closet, storage, laundry_room, balcony, porch, barbecue, pool, other)*
    possible archetypes of a room
- **geometry**: *(object)*
  Data describing geometry information of the room. Only positioning of device services is supported.
  - **objects**: *(required, array of GeometryObject)*
    **Items**: GeometryObject
    - **reference**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
    - **transform**: *(required, object)*
      - **position**: *(required, object)*
        A 3D coordinate in space in meters.
        - **x**: *(required, number)*
        - **y**: *(required, number)*
        - **z**: *(required, number)*
      - **rotation**: *(required, object)*
        A quaternion representing rotation in 3D space.
        - **x**: *(required, number – minimum: -1 – maximum: 1)*
        - **y**: *(required, number – minimum: -1 – maximum: 1)*
        - **z**: *(required, number – minimum: -1 – maximum: 1)*
        - **w**: *(required, number – minimum: -1 – maximum: 1)*

**Example**:

```json
{
  "type": "room",
  "id": "6adb232c-e80c-49be-a4c8-fd32b2488bf5",
  "metadata": {
    "archetype": "living_room",
    "name": "Living room"
  },
  "services": [
    {
      "rtype": "grouped_light",
      "rid": "c8e1f2e6-f54f-4d20-bcdc-a568ebf61dcc"
    }
  ],
  "children": [
    {
      "rtype": "device",
      "rid": "d7c305a8-73b6-4de4-9eb8-4dc20007c2c6"
    },
    {
      "rtype": "device",
      "rid": "5f742a9f-5c07-4c56-a996-888d620ccf8d"
    },
    {
      "rtype": "device",
      "rid": "5a251edd-45ab-4b97-b4c6-cde3a5abea33"
    }
  ],
  "geometry": {
    "objects": [
      {
        "reference": {
          "rtype": "device",
          "rid": "d7c305a8-73b6-4de4-9eb8-4dc20007c2c6"
        },
        "transform": {
          "position": {
            "x": 1.5,
            "y": 0,
            "z": 2
          },
          "rotation": {
            "x": 0,
            "y": 0,
            "z": 0,
            "w": 1
          }
        }
      },
      {
        "reference": {
          "rtype": "device",
          "rid": "5f742a9f-5c07-4c56-a996-888d620ccf8d"
        },
        "transform": {
          "position": {
            "x": 3,
            "y": 0,
            "z": 2
          },
          "rotation": {
            "x": 0,
            "y": 0,
            "z": 0,
            "w": 1
          }
        }
      }
    ]
  }
}
```

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

### GET /resource/room

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
- **data**: *(required, array of RoomGet)*
  **Items**: RoomGet
  - **id**: *(required, string – pattern: ^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$)*
    Unique identifier representing a specific resource instance
  - **id_v1**: *(string – pattern: ^(\/[a-z]{4,32}\/[0-9a-zA-Z-]{1,32})?$)*
    Clip v1 resource identifier
  - **children**: *(required, array of [ResourceIdentifier](./common.md#resourceidentifier))*
    Child devices/services to group by the derived group
  - **services**: *(required, array of [ResourceIdentifier](./common.md#resourceidentifier))*
    References all services aggregating control and state of children in the group. This includes all services grouped in the group hierarchy given by child relation This includes all services of a device grouped in the group hierarchy given by child relation Aggregation is per service type, ie every service type which can be grouped has a corresponding definition of grouped type Supported types: – grouped_light – grouped_motion – grouped_light_level
  - **type**: *(required, room)*
    Type of the supported resources
  - **metadata**: *(required, object)*
    configuration object for a room
    - **name**: *(required, string – minLength: 1 – maxLength: 32)*
      Human readable name of a resource
    - **archetype**: *(required, one of living_room, kitchen, dining, bedroom, kids_bedroom, bathroom, nursery, recreation, office, gym, hallway, toilet, front_door, garage, terrace, garden, driveway, carport, home, downstairs, upstairs, top_floor, attic, guest_room, staircase, lounge, man_cave, computer, studio, music, tv, reading, closet, storage, laundry_room, balcony, porch, barbecue, pool, other)*
      possible archetypes of a room
  - **geometry**: *(object)*
    Data describing geometry information of the room. Only positioning of device services is supported.
    - **objects**: *(array of GeometryObject)*
      **Items**: GeometryObject
      - **reference**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
      - **transform**: *(required, object)*
        - **position**: *(required, object)*
          A 3D coordinate in space in meters.
          - **x**: *(required, number)*
          - **y**: *(required, number)*
          - **z**: *(required, number)*
        - **rotation**: *(required, object)*
          A quaternion representing rotation in 3D space.
          - **x**: *(required, number – minimum: -1 – maximum: 1)*
          - **y**: *(required, number – minimum: -1 – maximum: 1)*
          - **z**: *(required, number – minimum: -1 – maximum: 1)*
          - **w**: *(required, number – minimum: -1 – maximum: 1)*
  **Example**:
  ```json
  {
    "type": "room",
    "id": "6adb232c-e80c-49be-a4c8-fd32b2488bf5",
    "metadata": {
      "archetype": "living_room",
      "name": "Living room"
    },
    "services": [
      {
        "rtype": "grouped_light",
        "rid": "c8e1f2e6-f54f-4d20-bcdc-a568ebf61dcc"
      }
    ],
    "children": [
      {
        "rtype": "device",
        "rid": "d7c305a8-73b6-4de4-9eb8-4dc20007c2c6"
      },
      {
        "rtype": "device",
        "rid": "5f742a9f-5c07-4c56-a996-888d620ccf8d"
      },
      {
        "rtype": "device",
        "rid": "5a251edd-45ab-4b97-b4c6-cde3a5abea33"
      }
    ],
    "geometry": {
      "objects": [
        {
          "reference": {
            "rtype": "device",
            "rid": "d7c305a8-73b6-4de4-9eb8-4dc20007c2c6"
          },
          "transform": {
            "position": {
              "x": 1.5,
              "y": 0,
              "z": 2
            },
            "rotation": {
              "x": 0,
              "y": 0,
              "z": 0,
              "w": 1
            }
          }
        },
        {
          "reference": {
            "rtype": "device",
            "rid": "5f742a9f-5c07-4c56-a996-888d620ccf8d"
          },
          "transform": {
            "position": {
              "x": 3,
              "y": 0,
              "z": 2
            },
            "rotation": {
              "x": 0,
              "y": 0,
              "z": 0,
              "w": 1
            }
          }
        }
      ]
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

## /resource/room/{id}

API calls to read, update and delete a resource instance

### DELETE /resource/room/{id}

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

### PUT /resource/room/{id}

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
- **children**: *(array of [ResourceIdentifier](./common.md#resourceidentifier))*
  Child devices/services to group by the derived group
- **type**: *(room)*
  Type of the supported resources
- **metadata**: *(object)*
  configuration object for a room
  - **name**: *(string – minLength: 1 – maxLength: 32)*
    Human readable name of a resource
  - **archetype**: *(one of living_room, kitchen, dining, bedroom, kids_bedroom, bathroom, nursery, recreation, office, gym, hallway, toilet, front_door, garage, terrace, garden, driveway, carport, home, downstairs, upstairs, top_floor, attic, guest_room, staircase, lounge, man_cave, computer, studio, music, tv, reading, closet, storage, laundry_room, balcony, porch, barbecue, pool, other)*
    possible archetypes of a room
- **geometry**: *(object)*
  Data describing geometry information of the room. Only positioning of device services is supported.
  - **objects**: *(array of GeometryObject)*
    **Items**: GeometryObject
    - **reference**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
    - **transform**: *(required, object)*
      - **position**: *(required, object)*
        A 3D coordinate in space in meters.
        - **x**: *(required, number)*
        - **y**: *(required, number)*
        - **z**: *(required, number)*
      - **rotation**: *(required, object)*
        A quaternion representing rotation in 3D space.
        - **x**: *(required, number – minimum: -1 – maximum: 1)*
        - **y**: *(required, number – minimum: -1 – maximum: 1)*
        - **z**: *(required, number – minimum: -1 – maximum: 1)*
        - **w**: *(required, number – minimum: -1 – maximum: 1)*

**Example**:

```json
{
  "type": "room",
  "id": "6adb232c-e80c-49be-a4c8-fd32b2488bf5",
  "metadata": {
    "archetype": "living_room",
    "name": "Living room"
  },
  "services": [
    {
      "rtype": "grouped_light",
      "rid": "c8e1f2e6-f54f-4d20-bcdc-a568ebf61dcc"
    }
  ],
  "children": [
    {
      "rtype": "device",
      "rid": "d7c305a8-73b6-4de4-9eb8-4dc20007c2c6"
    },
    {
      "rtype": "device",
      "rid": "5f742a9f-5c07-4c56-a996-888d620ccf8d"
    },
    {
      "rtype": "device",
      "rid": "5a251edd-45ab-4b97-b4c6-cde3a5abea33"
    }
  ],
  "geometry": {
    "objects": [
      {
        "reference": {
          "rtype": "device",
          "rid": "d7c305a8-73b6-4de4-9eb8-4dc20007c2c6"
        },
        "transform": {
          "position": {
            "x": 1.5,
            "y": 0,
            "z": 2
          },
          "rotation": {
            "x": 0,
            "y": 0,
            "z": 0,
            "w": 1
          }
        }
      },
      {
        "reference": {
          "rtype": "device",
          "rid": "5f742a9f-5c07-4c56-a996-888d620ccf8d"
        },
        "transform": {
          "position": {
            "x": 3,
            "y": 0,
            "z": 2
          },
          "rotation": {
            "x": 0,
            "y": 0,
            "z": 0,
            "w": 1
          }
        }
      }
    ]
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

### GET /resource/room/{id}

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
- **data**: *(required, array of RoomGet)*
  **Items**: RoomGet
  - **id**: *(required, string – pattern: ^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$)*
    Unique identifier representing a specific resource instance
  - **id_v1**: *(string – pattern: ^(\/[a-z]{4,32}\/[0-9a-zA-Z-]{1,32})?$)*
    Clip v1 resource identifier
  - **children**: *(required, array of [ResourceIdentifier](./common.md#resourceidentifier))*
    Child devices/services to group by the derived group
  - **services**: *(required, array of [ResourceIdentifier](./common.md#resourceidentifier))*
    References all services aggregating control and state of children in the group. This includes all services grouped in the group hierarchy given by child relation This includes all services of a device grouped in the group hierarchy given by child relation Aggregation is per service type, ie every service type which can be grouped has a corresponding definition of grouped type Supported types: – grouped_light – grouped_motion – grouped_light_level
  - **type**: *(required, room)*
    Type of the supported resources
  - **metadata**: *(required, object)*
    configuration object for a room
    - **name**: *(required, string – minLength: 1 – maxLength: 32)*
      Human readable name of a resource
    - **archetype**: *(required, one of living_room, kitchen, dining, bedroom, kids_bedroom, bathroom, nursery, recreation, office, gym, hallway, toilet, front_door, garage, terrace, garden, driveway, carport, home, downstairs, upstairs, top_floor, attic, guest_room, staircase, lounge, man_cave, computer, studio, music, tv, reading, closet, storage, laundry_room, balcony, porch, barbecue, pool, other)*
      possible archetypes of a room
  - **geometry**: *(object)*
    Data describing geometry information of the room. Only positioning of device services is supported.
    - **objects**: *(array of GeometryObject)*
      **Items**: GeometryObject
      - **reference**: *(required, [ResourceIdentifier](./common.md#resourceidentifier))*
      - **transform**: *(required, object)*
        - **position**: *(required, object)*
          A 3D coordinate in space in meters.
          - **x**: *(required, number)*
          - **y**: *(required, number)*
          - **z**: *(required, number)*
        - **rotation**: *(required, object)*
          A quaternion representing rotation in 3D space.
          - **x**: *(required, number – minimum: -1 – maximum: 1)*
          - **y**: *(required, number – minimum: -1 – maximum: 1)*
          - **z**: *(required, number – minimum: -1 – maximum: 1)*
          - **w**: *(required, number – minimum: -1 – maximum: 1)*
  **Example**:
  ```json
  {
    "type": "room",
    "id": "6adb232c-e80c-49be-a4c8-fd32b2488bf5",
    "metadata": {
      "archetype": "living_room",
      "name": "Living room"
    },
    "services": [
      {
        "rtype": "grouped_light",
        "rid": "c8e1f2e6-f54f-4d20-bcdc-a568ebf61dcc"
      }
    ],
    "children": [
      {
        "rtype": "device",
        "rid": "d7c305a8-73b6-4de4-9eb8-4dc20007c2c6"
      },
      {
        "rtype": "device",
        "rid": "5f742a9f-5c07-4c56-a996-888d620ccf8d"
      },
      {
        "rtype": "device",
        "rid": "5a251edd-45ab-4b97-b4c6-cde3a5abea33"
      }
    ],
    "geometry": {
      "objects": [
        {
          "reference": {
            "rtype": "device",
            "rid": "d7c305a8-73b6-4de4-9eb8-4dc20007c2c6"
          },
          "transform": {
            "position": {
              "x": 1.5,
              "y": 0,
              "z": 2
            },
            "rotation": {
              "x": 0,
              "y": 0,
              "z": 0,
              "w": 1
            }
          }
        },
        {
          "reference": {
            "rtype": "device",
            "rid": "5f742a9f-5c07-4c56-a996-888d620ccf8d"
          },
          "transform": {
            "position": {
              "x": 3,
              "y": 0,
              "z": 2
            },
            "rotation": {
              "x": 0,
              "y": 0,
              "z": 0,
              "w": 1
            }
          }
        }
      ]
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
