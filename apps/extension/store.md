# Chrome Web Store

`bun run pack` writes `release/huxel-<version>.zip`. `manifest.json` is at the root of the zip. Upload that file in the [developer dashboard](https://chrome.google.com/webstore/devconsole).

The privacy policy URL works after `PRIVACY.md` is on the default branch:

https://github.com/janigowski/huxel/blob/main/PRIVACY.md

## Store listing

Category: Tools

The short description is the manifest description: Control Philips Hue lights on your local network from the toolbar.

Detailed description:

huxel is an independent remote for a Philips Hue bridge. It is not made by Signify.

Open the toolbar popup to turn lights, rooms, and zones on or off, set brightness, and set color or color temperature. The popup talks only to the bridge on your local network.

Find looks up a bridge at discovery.meethue.com, or type the bridge address. The browser asks before the extension may reach that address. Press the link button on the bridge, then connect. The application key stays in this browser. Forget bridge removes it.

There is no account and no analytics. Nothing is sent to the developer of this extension.

## Privacy

Single purpose: Control the lights on a Philips Hue bridge the user connects, from the browser toolbar.

Remote code: No. The package contains all of its code.

Data the dashboard should list:

- Authentication information. The Hue application key is stored in `chrome.storage.local` and sent only to the bridge the user connects.
- The bridge address is stored in `chrome.storage.local`. It is not sent to the developer.

Find sends a request with no account and no application key to `https://discovery.meethue.com/`. That service sees the public IP of the connection and returns the local bridge address.

Certify that user data is not sold, is not used for a purpose other than controlling that bridge, and is not used for creditworthiness or lending. The only transfers are the Find request to discovery.meethue.com and commands to the bridge the user connects.

## Permission justifications

`storage`: Keeps the bridge address and the Hue application key in `chrome.storage.local` on the device so the popup can reconnect. Forget bridge deletes the linked bridge and the key.

`https://discovery.meethue.com/*`: Find sends one request to Signify's bridge discovery service. The request contains no account and no application key.

`https://*/*`, optional: The bridge address is a local IP or hostname the user types or accepts, so it cannot be listed in advance. The extension asks for that one https origin only after Allow access, and uses it only to link and control that bridge.

## Test instructions

The screens before a bridge is linked can be reviewed without hardware.

1. Install the extension and open the toolbar popup.
2. The popup shows an address field, Find, and Allow access. The address is saved in this browser. Find contacts discovery.meethue.com.
3. Enter an address, or use Find when a bridge is registered for this network. Allow access asks for permission to that one https origin. If the popup closes, reopen it. The address is kept.
4. The next screen asks for the link button on the bridge, then Connect bridge. Without a press in the last 30 seconds, the bridge rejects the link and the popup stays on this screen.
5. The bridge certificate is not trusted by default. Open `https://<bridge address>` in a tab, choose Advanced, then Proceed, and return to the popup.
6. After linking, the popup lists rooms, zones, and lights. Forget bridge removes the saved key.

Steps 4 to 6 need a Hue bridge on the same network. There is no test account. The extension has no login.

## Still entered in the dashboard

- A Chrome Web Store developer account, including the registration fee.
- At least one screenshot at 1280×800 or 640×400, full bleed, of the real popup.
- The 128×128 icon is already in the package. The dashboard asks for the store icon separately.
