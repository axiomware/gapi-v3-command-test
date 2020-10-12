/*
 * Netrunr GAPI V3 Heartbeat Logging Utility
 *
 * Copyright(C) 2020 Axiomware Systems Inc..
 */
'use strict'

var mqtt = require('mqtt')
var minimist = require('minimist')

var mqttClientID = 'cli_' + Math.random().toString(16).substr(2, 8) // generate randon client ID

const args = minimist(process.argv.slice(2), {
  string: ['host', // MQTT broker IP addr - string
    'port', // MQTT broker port - postive integer
    'prefix'], // Topic prefix - string
  alias: { h: 'host', p: 'port', t: 'prefix' },
  default: {
    host: '192.168.8.1',
    port: '1883',
    prefix: 'netrunrfe'
  }
})

var mqttHost = args.host // MQTT host from Netrunr gateway config
var mqttPort = args.port // MQTT port from Netrunr gateway config
var prefix = args.prefix // from Netrunr gateway config
prefix = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix
var iface = 0 // System interface ID -> default 0
var gwHeartbeatCh = 7 // Gateway heartbeat channel

// MQTT options
const clientOptions = {
  username: '',
  password: '',
  clientId: mqttClientID
}

var heartbeatTopic = `${prefix}/+/${iface}/${gwHeartbeatCh}/0`

var client = mqtt.connect(`mqtt://${mqttHost}:${mqttPort}`, clientOptions)

client.on('connect', function () {
  console.log(`connected to : mqtt://${mqttHost}:${mqttPort}`)

  client.subscribe(heartbeatTopic)
  console.log(`subscribed to heartbeat topic - ${heartbeatTopic}`)
})

client.on('message', function (topic, message, packet) {
  if (message === '') {
    console.log(`message :: received gateway Last-Will-Testament[${topic}][${message}]`)
  } else {
    try {
      const heartbeatData = JSON.parse(message)
      heartbeatData.retain = packet.retain
      console.log(heartbeatData)
    } catch (err) {
      console.log('JSON.parse error')
      console.log(err)
    }
  }
})
