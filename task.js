(/** @lends <global> */

function () {
  'use strict';

  /**
  * @author Rafael Vidaurre
  */

  var _ = require('lodash');
  var utils = require('./utils');

  /**
  * @class
  */
  function Task () {
    var _this = this;
    _this._main = null;
    _this._hooks = {};
    _this._builder = function () {return {};}; // Default builder returns empty object

    // Sets main task method
    _this.main = function (mainCb) {
      if (!_.isFunction(mainCb)) throw new Error('Main method must be a function');
      _this._main = mainCb;

      return _this;
    };

    // Appends hooks to the hooks object
    _this.hooks = function (hooksObj) {
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

    _this.builder = function (builderCb) {
      if (!_.isFunction(builderCb)) throw new Error('Builder must be a function');

      _this._builder = builderCb;
      return _this;
    };
  }

  module.exports = Task;


}());
