/*global describe: true, it: true */
var debug = require('debug')('mdns:test:decoder');
var should = require('should');
var decoder = require('../lib/decoder');
var dns = require('mdns-js-packet');
var DNSPacket = dns.DNSPacket;
var path = require('path');
var fs = require('fs');

var fixtureFolder = path.join(__dirname, 'fixtures');
var fixturesFolderDecoded = path.join(fixtureFolder, 'decoded');
var fixturesPacket = path.join('.', 'node_modules',
  'mdns-js-packet', 'test', 'fixtures');

var path = require('path');

var helper = require('./helper');

function testDecodeSection (binFolder, jsFolder) {
  var files = fs.readdirSync(binFolder).filter(function (f) {
    return /\.bin$/.test(f);
  });

  files.forEach(function (file) {
    it('decode ' + file, function (done) {
      var djsFile = path.join(jsFolder,  file.replace('.bin', '.js'));
      var binFile = path.join(binFolder, file);

      var b = helper.readBin(binFile);
      should.exist(b);
      var packet = DNSPacket.parse(b);
      var obj = {
        question: {},
        answer: {},
        authority: {},
        additional: {}
      };
      for (var key in obj) {
        if (!obj.hasOwnProperty(key)) {continue;}
        decoder.decodeSection(packet, key, obj[key]);
      }
      if (!fs.existsSync(djsFile)) {
        helper.writeJs(djsFile, obj);
      }
      else {
        var dj = helper.readJs(djsFile);
        helper.equalDeep(dj, obj);
      }
      done();
    });//--decode...
  });
}

describe('decoder', function () {
  describe('decodeSection', function () {
    testDecodeSection(fixturesPacket, fixturesFolderDecoded);
  });


  it('should', function () {
    var ret;
    var b = helper.readBin(path.join(
      __dirname,
      'fixtures',
      'mdns-readynas.bin'
    ));
    var packet = DNSPacket.parse(b);
    debug('packet', helper.createJs(packet));
    var obj = {};
    ret = decoder.decodeSection(packet, 'question', obj);
    ret.should.be.equal(false);

    ret = decoder.decodeSection(packet, 'answer', obj);
    ret.should.be.ok;
    obj.should.have.property('type');
    obj.type.should.have.length(13);
    obj.type.forEach(function (t) {
      t.should.be.type('object');
      t.should.have.property('name');
      t.should.have.property('protocol', 'tcp');
      t.should.have.property('subtypes', []);
      t.name.length.should.be.above(2);
    });
    debug('ret: %s, obj', ret, obj);
  });
});


