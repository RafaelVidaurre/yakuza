'use strict';

var _;

_ = require('lodash');

/**
* Used for templating http options
* @param {object} Base options to be used in the template
*/
function OptionsTemplate (options) {
  this._options = options || {};

  if (!_.isObject(this._options) || _.isArray(this._options)) {
    throw new Error('Options template must be initialized with an object');
  }
}

OptionsTemplate.prototype.build = function (extender) {
  var ext;

  ext = extender || {};

  if (!_.isObject(ext) || _.isArray(ext)) {
    throw new Error('Extender must be an object');
  }

  return _.merge(this._options, ext);
};

OptionsTemplate.prototype.reset = function (options) {
  this._options = options || {};

  if (!_.isObject(this._options) || _.isArray(this._options)) {
    throw new Error('Options template must be initialized with an object');
  }
};

module.exports = OptionsTemplate;
