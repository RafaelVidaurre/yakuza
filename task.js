/**
* @author Rafael Vidaurre
* @requires Utils
*/

'use strict';

var _ = require('lodash');
var utils = require('./utils');

/**
* @class
*/
function Task () {
  var _this = this;

  /**
  * The main method of the Task
  * @private
  */
  this._main = null;

  /**
  * Set of hooks for the task, defined at setup time
  * @private
  */
  this._hooks = {};
  this._builder = function () {return {};}; // Default builder returns empty object

  // Sets main task method
  this.main = function (mainCb) {
    if (!_.isFunction(mainCb)) throw new Error('Main method must be a function');
    _this._main = mainCb;

    return _this;
  };

  // Appends hooks to the hooks object
  this.hooks = function (hooksObj) {
    var hookKeys, slotIsArray, hookSlot;
    if (!_.isObject(hooksObj) || _.isArray(hooksObj)) {
      throw new Error('Hooks parameter must be an object');
    }

    // Add new hooks to _hooks object and initialize new keys
    hookKeys = _.keys(hooksObj);
    _.each(hookKeys, function (hookKey) {
      hookSlot = _this._hooks[hookKey];
      slotIsArray = _.isArray(hookSlot);

      if (!slotIsArray) {
        _this._hooks[hookKey] = [];
        hookSlot = _this._hooks[hookKey]; // Reassign variable (because it was pointing to undef)
      }

      hookSlot.push(hooksObj[hookKey]);
    });

    return _this;
  };

  this.builder = function (builderCb) {
    if (!_.isFunction(builderCb)) throw new Error('Builder must be a function');

    _this._builder = builderCb;
    return _this;
  };
}

module.exports = Task;
