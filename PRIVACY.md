# Privacy policy

Last updated: 16 November 2026

huxel is an independent browser extension for controlling a Philips Hue bridge on the local network. It is not made by Signify. This policy covers the Chromium extension.

## Data stored on the device

The extension stores data in `chrome.storage.local` on the device. That storage is not synced, and it is not sent to the developer of this extension.

- The bridge address, saved when you allow access, so the popup can continue if it closes.
- After you connect, the Hue application key the bridge issues, and the bridge identifier when discovery provided one.

Forget bridge removes the linked bridge and the application key. The address saved when you allowed access can remain until you allow a different one.

## Data that leaves the device

Find sends one HTTPS request to `https://discovery.meethue.com/`, Signify's bridge discovery service. The request contains no account, no application key, and no light data. The service uses the public IP address of the connection to return the local address of Hue bridges registered from that network. You can skip Find and type the bridge address.

Linking and light commands use HTTPS to the bridge you choose, at `https://<bridge address>`. Linking sends the name `hue-remote#extension` so the bridge can issue an application key. Later commands send that key only to that bridge, as the `hue-application-key` header. Commands include power, brightness, color, and color temperature, and reading the state of lights, rooms, and zones.

## Limited use

The extension uses this data only to find, link, and control the bridge you choose. It does not sell the data, use it for advertising, or let a person read it. It is transferred only to Signify's discovery service when you click Find, and to the bridge you connect. It is not used to determine creditworthiness or for lending.

## What this extension does not do

It has no account. It does not collect a name, an email address, or payment data. It does not read web pages, browsing history, or tabs. It does not download or run code from a server. The installed package contains all of its code.

## Contact

dawidjaniga@gmail.com

https://github.com/janigowski/huxel
