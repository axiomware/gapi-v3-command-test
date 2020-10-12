/*
 * Netrunr GAPI V3 MQTT Traffic Logging Utility
 *
 * Copyright(C) 2020 Axiomware Systems Inc..
 */

'use strict'

const mqtt = require('mqtt')
const minimist = require('minimist')
const fs = require('fs')
const path = require('path')
const ndjson = require('ndjson')

const args = minimist(process.argv.slice(2), {
  string: ['host', // MQTT broker IP addr - string
    'port', // MQTT broker port - postive integer
    'prefix', // Topic prefix - string
    'gwid', // Netrunr Gateway ID - string
    'file'// optional output file name to write data
  ],
  boolean: ['adv', // front adv
    'data', // front data
    'cmd', // front cmd/res
    'events', // front events
    'heartbeat'// front hbt
  ],
  alias: { h: 'host', p: 'port', t: 'prefix', g: 'gwid', f: 'file', a: 'adv', d: 'data', c: 'cmd', e: 'events', b: 'heartbeat' },
  default: {
    host: '192.168.8.1',
    port: '1883',
    prefix: 'netrunrfe',
    gwid: '+',
    adv: false,
    data: false,
    cmd: false,
    events: false,
    heartbeat: false
  }
})

const filename = args.file // file name to write output data - optional
const mqttHost = args.host // MQTT host from Netrunr gateway config
const mqttPort = args.port // MQTT port from Netrunr gateway config
let prefix = args.prefix // from Netrunr gateway config
prefix = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix
const GWID = args.gwid.toLowerCase() // Gateway ID from Netrunr gateway config

const mqttClientID = 'cli_' + Math.random().toString(16).substr(2, 8) // generate randon client ID

const clientOptions = { // MQTT options
  username: '',
  password: '',
  clientId: mqttClientID,
  protocolId: 'MQTT',
  protocolVersion: 5
}

if (filename) {
  var outFilepath = path.isAbsolute(filename) ? filename : path.join(__dirname, filename)
  var transformStream = ndjson.stringify()
  var outputStream = transformStream.pipe(fs.createWriteStream(outFilepath))
}

const client = mqtt.connect(`mqtt://${mqttHost}:${mqttPort}`, clientOptions)

client.on('connect', function () {
  console.log(`connected to : mqtt://${mqttHost}:${mqttPort}`)

  console.log('subscribing to topics')
  if (args.adv) { // log advertisements
    console.log(`ADV : [${prefix}/${GWID}/1/3/0]`)
    client.subscribe([`${prefix}/${GWID}/1/3/0`])
  }
  if (args.data) { // log notifications and indications
    console.log(`DATA : [${prefix}/${GWID}/1/4/#`, `${prefix}/${GWID}/1/5/#]`)
    client.subscribe([`${prefix}/${GWID}/1/4/#`, `${prefix}/${GWID}/1/5/#`])
  }
  if (args.cmd) { // log command and response
    console.log(`CMD : [${prefix}/${GWID}/1/1/0`, `${prefix}/${GWID}/1/2/+]`)
    client.subscribe([`${prefix}/${GWID}/1/1/0`, `${prefix}/${GWID}/1/2/+`])
  }
  if (args.events) { // log events
    console.log(`EVENTS : [${prefix}/${GWID}/1/6/#`, `${prefix}/${GWID}/1/7/#]`)
    client.subscribe([`${prefix}/${GWID}/1/6/#`, `${prefix}/${GWID}/1/7/#`])
  }
  if (args.heartbeat) { // log gateway and client heartbeats
    console.log(`HEARTBEAT : [${prefix}/${GWID}/0/7/0`, `${prefix}/${GWID}/0/8/0]`)
    client.subscribe([`${prefix}/${GWID}/0/7/0`, `${prefix}/${GWID}/0/8/0`])
  }
})

client.on('message', (topic, message, packet) => {
  let msgData = {}
  try {
    msgData = JSON.parse(message)
  } catch (err) {
    msgData = {} // LWT from heartbeat
  }

  const log = {
    topic: topic,
    message: msgData,
    retain: packet.retain
  }
  if (packet.properties && packet.properties.responseTopic) {
    log.responseTopic = packet.properties.responseTopic
  }

  if (packet.properties && packet.properties.correlationData) {
    const buf1 = Buffer.from(packet.properties.correlationData)
    let L = buf1.length
    L = L > 4 ? 4 : L
    const cdata = buf1.readUIntLE(0, L)
    log.correlationData = cdata
  }
  console.log(log)
  if (filename) {
    transformStream.write(log)
  }
})
