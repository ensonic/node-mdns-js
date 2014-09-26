
var debug = require('debug')('mdns:lib:browser');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var ServiceType = require('./service_type').ServiceType;




/**
 * mDNS Browser class
 * @class
 * @param {string|ServiceType} serviceType - The service type to browse for.
 * @fires Browser#update
 */
var Browser = module.exports = function (serviceType, engine) {
  if (!(this instanceof Browser)) { return new Browser(serviceType); }

  var notString = typeof serviceType !== 'string';
  var notType = !(serviceType instanceof ServiceType);
  if (notString && notType) {
    debug('serviceType type:', typeof serviceType);
    debug('serviceType is ServiceType:', serviceType instanceof ServiceType);
    debug('serviceType=', serviceType);
    throw new Error('argument must be instance of ServiceType or valid string');
  }
  this.serviceType = serviceType;
  debug('browsing', serviceType);
  var self = this;

  var started = false;

  this.start = function () {
    debug('start');
    started = true;
    engine.discover(serviceType);
  };//--start


  this.stop = function () {
    debug('stopping');
    started = false;
    debug('dump', util.inspect(engine.dump(), {depth: null}));
  };//--stop

  engine.on('something', function (x) {
    debug('something', x);
  });

  engine.on('question', function (x) {
    debug('question', x);
  });

  engine.on('serviceUp', function onServiceUp(name, service, addresses) {
    debug('serviceUp', name);
    if (started) {
      emitServiceUp(name, service, addresses);
    }
  });

  function emitServiceUp(name, service, addresses) {
    process.nextTick(function () {
      self.emit('serviceUp', name, service, addresses);
    });
  }
};//--Browser constructor

util.inherits(Browser, EventEmitter);


Browser.prototype.discover = function () {
  process.nextTick(function () {
    debug('emitting broadcast request');
    this._all.emit('broadcast');
  }.bind(this));
};
