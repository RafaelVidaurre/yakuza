/**
* @author Rafael Vidaurre
*/
var _ = require('lodash');
var utils = require('./utils');
var Agent = require('./agent');


(function () {
  'use strict';

  function Agent () {
    var _this = this;
    _this._configCallbacks = [];
    _this._tasks = {};

    // Saves a configuration callback in `configCallbacks` array
    _this.config = function (cbConfig) {
      if (!_.isFunction(cbConfig)) { throw Error('Config argument must be a function'); }

      _configCallbacks.push(cbConfig);

      return Agent;
    };
  }

  module.exports = Agent;

}());
