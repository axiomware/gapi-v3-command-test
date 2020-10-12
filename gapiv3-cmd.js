/*
 * Netrunr GAPI V3 Command Test Utility using MQTT V5 features
 *
 * Copyright(C) 2020 Axiomware Systems Inc..
 */
'use strict'

var mqtt = require('mqtt')
var fs = require('fs')
var minimist = require('minimist')

var mqttClientID = 'cli_' + Math.random().toString(16).substr(2, 8) // generate randon client ID

const args = minimist(process.argv.slice(2), {
  string: ['host', // MQTT broker IP addr - string
    'port', // MQTT broker port - postive integer
    'prefix', // Topic prefix - string
    'gwid', // Netrunr Gateway ID - string
    'data', // JSON data - JSON object
    'response', // response topic - string
    'corr'], // correlation data - positive integer
  alias: { h: 'host', p: 'port', t: 'prefix', g: 'gwid', d: 'data', r: 'response', m: 'corr' },
  default: {
    host: '192.168.8.1',
    port: '1883',
    prefix: 'netrunrfe',
    response: mqttClientID,
    corr: 0
  }
})

var prefix = args.prefix // from Netrunr gateway config
prefix = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix
if (!args.gwid) {
  console.log('`gwid` must be defined')
  process.exit()
}
var GWID = args.gwid.toLowerCase() // Gateway ID from Netrunr gateway config
var iface = 1 // Bluetooth interface ID -> default 1
var mqttHost = args.host // MQTT host from Netrunr gateway config
var mqttPort = args.port // MQTT port from Netrunr gateway config
var response = args.response // Response topic postfix

if (!args.data) {
  console.log('`data` must be defined')
  process.exit()
}
try {
  var fmsg = fs.readFileSync(args.data, 'utf8')
} catch (err) {
  console.log('File read error')
  process.exit()
}
var cdata = args.corr
var lbuf = Buffer.alloc(4)
lbuf.writeUInt32LE(cdata, 0)

const clientOptions = { // MQTT options
  username: '',
  password: '',
  clientId: mqttClientID,
  protocolId: 'MQTT',
  protocolVersion: 5
}

var publishTopic = `${prefix}/${GWID}/${iface}/1/0`
var responseTopic = `${prefix}/${GWID}/${iface}/2/${response}`

var client = mqtt.connect(`mqtt://${mqttHost}:${mqttPort}`, clientOptions)

client.on('connect', function () {
  console.log(`connected to : mqtt://${mqttHost}:${mqttPort}`)

  client.subscribe(responseTopic)
  console.log(`publish to topic - ${publishTopic}`)
  console.log(JSON.parse(fmsg))
  console.log(`response to topic - ${responseTopic}`)
  client.publish(publishTopic, fmsg, { qos: 0, properties: { responseTopic: `${response}`, correlationData: lbuf } })
})

client.on('message', function (topic, message) {
  console.log(JSON.parse(message))
  process.exit()
})
