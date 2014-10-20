/**
* @author Rafael Vidaurre
*/
var _ = require('lodash');
var utils = require('./utils');
var Agent = require('./agent');

(function () {
  'use strict';

  function Agent () {
    var _configCallbacks = [];
    var _agents = {};

    // Saves a configuration callback in `configCallbacks` array
    this.config = function (cbConfig) {
      if (!_.isFunction(cbConfig)) { throw Error('Config argument must be a function'); }

      _configCallbacks.push(cbConfig);

      return Agent;
    };
  }

  module.exports = Agent;

}());
