/**
* Utility for building Http module options with ease
* @module Options
* @author Rafael Vidaurre
*/

'use strict';

var _ = require('lodash');

/**
* @class
* @param {object} defaultOptions POJO with default options
*/
function Options (defaultOptions) {
  this._defaults = defaultOptions;
  this._currentOptions = this.defaults;
}

/**
* Set default options to be used
* @param {object} defaultOptions default options to be used
* @public
*/
Options.prototype.defaults = function (defaultOptions) {
  this._defaults = defaultOptions;
};

/**
* Extends the current options object with the options provided
* @param {object} options Options object to be used for extension
* @return {object} currentOptions current set options
*/
Options.prototype.extend = function (options) {
  if (!_.isObject(options)) {
    throw new Error('Options must be an object');
  }

  this._currentOptions = _.extend(this.currentOptions, options);

  return this.getOptions();
};

/**
* Returns a clone of the current options set, or extends current set options if object is provided
* @return {object} clone of current options
*/
Options.prototype.options = function (options) {
  if (_.isObject(options)) {
    this.extend(options);
  }
  return _.cloneDeep(this._currentOptions);
};

/**
* Sets a new value for a given key
* @param {string} key Key to which the value is assigned
* @param value Value asigned to the key
*/
Options.prototype.set = function (key, value) {
  this._currentOptions[key] = value;

  return this.getOptions();
};

// TODO: Add a reset to defaults method

/** @alias defaults */
Options.prototype.default = Options.prototype.defaults;

module.exports = Options;
