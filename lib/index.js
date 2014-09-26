var debug = require('debug')('mdns:lib:index');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var st = require('./service_type');
var Engine = require('./engine');
var Browser = require('./browser');


var engine = new Engine();


var Mdns = function () {
  var self = this;
  process.nextTick(function () {
    debug('starting engine');
    engine.start();
    engine.on('ready', function () {
      self.emit('ready', self);
    });
  });
};

util.inherits(Mdns, EventEmitter);

var mdns = module.exports = new Mdns();
mdns.Browser = Browser;

/** @property {module:ServiceType~ServiceType} */
mdns.ServiceType = st.ServiceType;

/** @property {module:ServiceType.makeServiceType} */
module.exports.makeServiceType = st.makeServiceType;

/** @function */
module.exports.tcp = st.protocolHelper('tcp');

/** @function */
module.exports.udp = st.protocolHelper('udp');



/**
 * Create a browser instance
 * @method
 * @param {string} [serviceType] - The Service type to browse for. Defaults to ServiceType.wildcard
 * @return {Browser}
 */
Mdns.prototype.createBrowser = function (serviceType) {
  if (typeof serviceType === 'undefined') {
    serviceType = st.ServiceType.wildcard;
  }
  return new Browser(serviceType, engine);
};


Mdns.prototype.createAdvertisement = function (/*service, port*/) {
  throw new Error('not implemented');
};


