/**
* @author Rafael Vidaurre
*/
var _ = require('lodash');
var utils = require('./utils');
var Agent = require('./agent');


(function () {
  'use strict';

  function Scraper () {
    this._configCallbacks = [];
    this._agents = {};

    this._createAgent = function (agentName) {
      this._agents[agentName] = new Agent();
    };

    // Saves a configuration callback in `_configCallbacks` array
    this.config = function (cbConfig) {
      if (!_.isFunction(cbConfig)) { throw new Error('Config argument must be a function'); }

      this._configCallbacks.push(cbConfig);

      return Scraper;
    };

    // Returns an agent, if it doesn't exist, creates it
    this.agent = function (agentName) {
      var thisAgent, agentExists;

      if (!_.isString(agentName) || !agentName) {
        throw new Error('Agent id must be a non-empty string');
      }

      agentExists = utils.hasKey(this._agents, agentName);
      thisAgent = agentExists ? this._agents[agentName] : this._createAgent(agentName);

      return thisAgent;
    };
  }

  module.exports = Scraper;

}());
