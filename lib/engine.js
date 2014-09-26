var debug = require('debug')('mdns:lib:engine');
var dgram = require('dgram');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var xtend = require('xtend');

var Registry = require('./registry');
var dns = require('mdns-js-packet');
var Packet = dns.DNSPacket;
var Record = dns.DNSRecord;

var decoder = require('./decoder');

var internal = {};



function Service() {
  this.addresses = [];
}
Service.prototype.addHost = function (address) {
  if (this.addresses.indexOf(address) === -1) {
    this.addresses.push(address);
  }
};

function HostTemplate() {
  this.services = {};
}

HostTemplate.prototype.addService = function (key, data) {
  if (!this.services.hasOwnProperty(key)) {
    this.services[key] = {};
  }
  this.services[key] = xtend(this.services[key], data);
};


/**
 * Handles incoming UDP traffic.
 * @private
 */
internal.onMessage = function (message, remote) {
  debug('got packet from remote', remote);
  var host;
  var packet;
  try {
    packet = Packet.parse(message);
  }
  catch (err) {
    debug(message.toString('hex'));
    throw err;
  }

  var ret = {
    type: [],
    addresses: [remote.address],
    txt: []
  };
  host = this.services.getByKey(remote.address);
  if (decoder.decodeSection(packet, 'question', ret)) {
    host.addService(ret.type[0].toString(), ret);

    this.emit('question', ret, packet);
  }



  ['answer', 'additional', 'authority'].forEach(function (sectionName) {
    var ret = {
      type: [],
      txt: []
    };
    if (decoder.decodeSection(packet, sectionName, ret)) {
      ret.type.forEach(function (type) {
        host.addService(type.toString(), type);
      });
      if (ret.type.length === 0) {
        host.host = ret.host;
      }
    }
  });

  //debug('x', x);
  //this.emit('something', ret);
};


var Engine = module.exports = function (iface) {
  this.iface = iface || '0.0.0.0';
  this.idCounter = 100; //start somewhere
  this.discoverQueue = {};
  var server = this.server =  dgram.createSocket('udp4');
  this.services = new Registry(HostTemplate);
  var onMessage = internal.onMessage.bind(this);
  server.on('message', function (message, remote) {
    onMessage(message, remote);
  });

  server.on('error', function (err) {
    debug('socket error', err);
  });
  server.on('close', function () {
    debug('socket closed');
  });
};

util.inherits(Engine, EventEmitter);

Engine.prototype.nextId = function () {
  var id = this.idCounter++;
  if (this.idCounter > 0xFFFF) {
    this.idCounter = 100;
  }
  return id;
};

Engine.prototype.start = function () {
  this.server.bind(5353, this.iface, function onBound() {
    debug('engine bound');
    this.server.setMulticastTTL(128);
    this.server.addMembership('224.0.0.251');
    debug('membership added');
    this.emit('ready', this);
  }.bind(this));
};

Engine.prototype.discover = function (serviceType) {
  var sock = this.server;
  debug('serviceType: %s, %j', typeof serviceType, serviceType);
  if (typeof serviceType === 'object') {
    serviceType = serviceType.toString();
  }

  if (typeof serviceType === 'string') {
    //pad with .local if it's missing
    if (serviceType.indexOf('.local', serviceType.length - 7) === -1) {
      serviceType = serviceType + '.local';
    }
  }
  debug('requesting services: %s', serviceType);
  var packet = new Packet();
  packet.header.rd = 0;
  packet.header.id = this.nextId();
  packet.question.push(new Record(
      serviceType,
      Record.Type.PTR,
      1
    ));
  var buf = Packet.toBuffer(packet);
  debug('created buffer with length', buf.length);
  sock.send(buf, 0, buf.length, 5353, '224.0.0.251', function (err, bytes) {
    debug('%s sent %d bytes with err:%s', sock.address().address, bytes, err);
  });
};

Engine.prototype.dump = function () {

  return {storage: this.services.storage};
};
