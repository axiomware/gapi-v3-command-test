# Netrunr gapi v3 API test utilities
These NodeJs application utilities can be used to test and monitor data packets between a Netrunr gapi V3 API and a client application.

## Requirements

- [Netrunr E24](https://www.axiomware.com/netrunr-e24-product/) gateway
- Nodejs (see [https://nodejs.org/en/](https://nodejs.org/en/) for download and installation instructions)
  - Nodejs version 8.x.x or higher is required due to the use of promises/async/await
- NPM (Node package manager - part of Nodejs)   
- Windows, MacOS or Linux computer with access to internet

## Installation

Clone the repo

`git clone https://github.com/axiomware/gapi-v3-command-test.git`

or download as zip file to a local directory and unzip.

Install all module dependencies by running the following command inside the directory

```bash
cd gapi-v3-command-test

npm install
```
## Utility: gapiv3-heartbeat.js

This utility is used to detect Netrunr gateway heartbeat on the MQTT broker. This example assumes that local MQTT broker inside the Netrunr gateway is used, the WAN IP address of Netrunr gateway is `192.168.10.137`, MQTT port is `1883` (default) and MQTT topic prefix is `netrunrfe` (default). Make appropriate changes to match your installation.

`node gapiv3-heartbeat.js -h 192.168.10.137 -p 1883 -t 'netrunrfe'`

This should produce a JSON object for every heartbeat:

```JSON
{
  "type": 20,
  "date": 1602542033247,
  "id": "bt78a35159ec10",
  "iface": [ 0, 1 ],
  "seq": 838,
  "retain": true
}
```

## Utility: gapiv3-mqtt-logger.js

This utility is used to log MQTT traffic from the Netrunr gateway. This example assumes that local MQTT broker inside the Netrunr gateway is used, the WAN IP address of Netrunr gateway is `192.168.10.137`, MQTT port is `1883` (default) and MQTT topic prefix is `netrunrfe` (default). Make appropriate changes to match your installation.

```bash
# Log commands to screen
node gapiv3-mqtt-logger.js -h 192.168.10.137 -p 1883 -t 'netrunrfe' -c

# Log data, events and heartbeat to screen
node gapiv3-mqtt-logger.js -h 192.168.10.137 -p 1883 -t 'netrunrfe' -d -e -b

# Log BLE advertisements to screen and file
node gapiv3-mqtt-logger.js -h 192.168.10.137 -p 1883 -t 'netrunrfe' -a -f 'adv_log.txt'
```
## Utility: gapiv3-cmd.js

This utility is used to send and receive command and response data from the GAPI V3 API. This example assumes that local MQTT broker inside the Netrunr gateway is used, the WAN IP address of Netrunr gateway is `192.168.10.137`, MQTT port is `1883` (default) and MQTT topic prefix is `netrunrfe` (default). Make appropriate changes to match your installation.

```bash
# This command is used to query version information from the Gateway
# Use MQTTV3.x protocol with response and correlation data inside the payload file version3.json
node gapiv3-cmd.js -h '192.168.10.137' -p 1883 \
  -t 'netrunrfe' \
  -g 'bt78a35159ec10' \
  -d data/v3/version3.json

# This command is used to query version information from the Gateway
# Use MQTTV5 protocol with version5.json  with response and correlation data embedded in the MQTT packet
node gapiv3-cmd.js -h '192.168.10.137' -p 1883 \
  -t 'netrunrfe' \
  -g 'bt78a35159ec10' \
  -r 'respTopicID' \
  -m 10 \
  -d data/v5/version5.json
```

The data directory contains various other JSON data packages for other commands. Some changes are required insdie these files based on the Bluetooth address and other device specific information. Please review the contents of the JSON file before sending it to the Netrunr gateway.

## Error conditions/Troubleshooting

- If the program fails with module not installed errors, make sure `npm Install` is run prior to connecting to Netrunr gateway.
- For security reasons, Clients connected to LAN ports of Netrunr gateway have limited access to upstream network.
- If you do not see any heartbeat activity, verify network connections and your configuration.
