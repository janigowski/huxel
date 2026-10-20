# Bridge discovery and application registration

Sources (Philips Hue developer documentation):

- https://developers.meethue.com/develop/get-started-2/ (registration flow, `POST /api`, link button, discovery options)
- https://developers.meethue.com/develop/application-design-guidance/hue-bridge-discovery/ (Hue Bridge Discovery Guide; requires a developer login, not verified in full)
- https://developers.meethue.com/new-hue-api/ (mDNS and `discovery.meethue.com` recommended, UPnP deprecated)

Both endpoints are outside CLIP v2 (`/clip/v2`). Registration is the legacy V1 `/api` endpoint, still the only way to obtain a `hue-application-key`.

Details marked *(observed)* come from live responses of the service or from community-documented bridge behavior (for example https://github.com/peter-murray/node-hue-api/blob/HEAD/docs/users.md) and are not stated on the publicly readable official pages above. The same applies to the `devicetype` length limits, the `clientkey` response field, error 101 and the ~30 second window.

## Bridge discovery

### GET https://discovery.meethue.com/

> Public cloud endpoint (N-UPnP). No authentication. Returns the bridges that registered with the Hue portal from the caller's public IP address.

Recommended alternatives per the official docs: mDNS (`_hue._tcp`). UPnP is deprecated.

#### Response

##### HTTP status code 200

###### Body

**Media type**: application/json

**Type**: array of DiscoveredBridge

- **id**: *(required, string)*
  Bridge identifier
- **internalipaddress**: *(required, string)*
  Local IP address of the bridge
- **port**: *(integer)*
  HTTPS port of the bridge. *(observed)* absent in older responses

**Example**:

```json
[
  {
    "id": "001788fffe100491",
    "internalipaddress": "192.168.2.23",
    "port": 443
  }
]
```

An empty array `[]` means no bridge was found for the caller's public IP address.

##### HTTP status code 429

The service is rate limited. *(observed)* Responses carry `x-ratelimit-limit`, `x-ratelimit-remaining` and `x-ratelimit-reset` headers. Do not poll; fall back to mDNS or manual entry of the bridge IP.

### Constraints

- *(observed)* CORS allows only the origin `https://discovery.meethue.com`, so browser apps on other origins cannot read the response.
- The bridge uses a certificate signed by Signify's CA issued to the bridge id, not to its IP address.

## Application registration

### POST /api

> Not secured. Served over HTTPS by the bridge: `https://{bridge}/api`. Requires a physical press of the bridge link button.

#### Request

###### Body

**Media type**: application/json

- **devicetype**: *(required, string – maxLength: 40)*
  Format `<application_name>#<devicename>`. `application_name` 0..20 characters, `devicename` 0..19 characters. A single string of 0..40 characters is also accepted by the bridge.
  **Example**:
  ```
  my_hue_app#iphone peter
  ```
- **generateclientkey**: *(boolean)*
  When `true` the response also contains a `clientkey` for the Entertainment streaming API.

**Example**:

```json
{
  "devicetype": "my_hue_app#iphone peter",
  "generateclientkey": true
}
```

#### Response

All outcomes are returned with HTTP status code 200 and a JSON array of single-key items, either `success` or `error`.

###### Body

**Media type**: application/json

**Type**: array of RegistrationItem

- **success**: *(object)*
  - **username**: *(string)*
    The application key. Use it as the `hue-application-key` header for CLIP v2 requests.
  - **clientkey**: *(string)*
    Pre-shared key for the Entertainment streaming API. Present when `generateclientkey` was `true`.
- **error**: *(object)*
  - **type**: *(integer)*
    V1 error type
  - **address**: *(string)*
    Resource address the error refers to
  - **description**: *(string)*
    Human-readable explanation

**Success example**:

```json
[
  {
    "success": {
      "username": "1028d66426293e821ecfd9ef1a0731df",
      "clientkey": "E3B550C1E6B2D53F17A96B8B2F8F4AFB"
    }
  }
]
```

**Error example** (link button not pressed):

```json
[
  {
    "error": {
      "type": 101,
      "address": "",
      "description": "link button not pressed"
    }
  }
]
```

#### Errors

| type | description |
| --- | --- |
| 101 | link button not pressed |

Other V1 error types (for example 2 `body contains invalid json`, 7 `invalid value`) are returned in the same shape.

### Constraints

- The user must press the physical link button on the bridge first, then send the request. The bridge accepts it for roughly 30 seconds *(observed)*. Pressing the button proves physical access to the bridge.
- Until the button is pressed the bridge answers error type 101. Applications may ask the user and send the request again.
- `username` and `clientkey` are effectively passwords for the bridge. Store them securely and never log them.
