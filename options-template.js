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

/**
* Returns the current base object deeply extended (merged) by the extender, this does not modify
* the base object
* @param {object} Object whose properties will be added to the base object
* @return {object} POJO created by extending base object with extender
*/
OptionsTemplate.prototype.build = function (extender) {
  var ext;

  ext = extender || {};

  if (!_.isObject(ext) || _.isArray(ext)) {
    throw new Error('Extender must be an object');
  }

  return _.merge(_.cloneDeep(this._options), ext);
};

/**
* Replaces the base object of the template for a new one
* @param {object} new base object to be used
*/
OptionsTemplate.prototype.reset = function (options) {
  this._options = options || {};

  if (!_.isObject(this._options) || _.isArray(this._options)) {
    throw new Error('Options template must be initialized with an object');
  }
};


module.exports = OptionsTemplate;
