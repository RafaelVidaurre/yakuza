/**
* @author Rafael Vidaurre
*/
var _ = require('lodash');
var utils = require('./utils');
var Agent = require('./agent');


(function () {
  'use strict';

  function Scraper () {
    var _this = this;
    _this._configCallbacks = [];
    _this._agents = {};

    _this._createAgent = function (agentName) {
      _this._agents[agentName] = new Agent();
    };

    // Saves a configuration callback in `_configCallbacks` array
    _this.config = function (cbConfig) {
      if (!_.isFunction(cbConfig)) throw new Error('Config argument must be a function');

      _this._configCallbacks.push(cbConfig);

      return Scraper;
    };

    // Returns an agent, if it doesn't exist, creates it
    _this.agent = function (agentName) {
      var thisAgent, agentExists;

      if (!agentName || !_.isString(agentName)) {
        throw new Error('Agent id must be a non-empty string');
      }

      agentExists = utils.hasKey(_this._agents, agentName);
      thisAgent = agentExists ? _this._agents[agentName] : _this._createAgent(agentName);

      return thisAgent;
    };
  }

  module.exports = Scraper;

}());
