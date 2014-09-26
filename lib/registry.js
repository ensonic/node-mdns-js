

var Registry = module.exports = function (template) {
  this.storage = {};
  this.template = template;
};

Registry.prototype.getByKey = function (key) {
  if (this.storage.hasOwnProperty(key)) {
    return this.storage[key];
  }
  else {
    var t = new this.template();
    this.storage[key] = t;
    return t;
  }
};


