
module.exports = require('./lib');

var config = require('./package.json');

/** @member {string} */
module.exports.version = config.version;
module.exports.name = config.name;


