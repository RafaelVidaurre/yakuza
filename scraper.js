/**
* @author Rafael Vidaurre
*/
var _ = require('lodash');
var utils = require('./utils');
var Agent = require('./agent');


(function () {
  'use strict';

  function Scraper () {
    var _configCallbacks = [];
    var _agents = {};
    var _createAgent = function (agentName) {
      _agents[agentName] = new Agent();
    };

    // Saves a configuration callback in `_configCallbacks` array
    this.config = function (cbConfig) {
      if (!_.isFunction(cbConfig)) { throw Error('Config argument must be a function'); }

      _configCallbacks.push(cbConfig);

      return Scraper;
    };

    // Returns an agent, if it doesn't exist, creates it
    this.agent = function (agentName) {
      var thisAgent, agentExists;

      agentExists = utils.hasKey(_agents, agentName);
      thisAgent = agentExists ? _agents[agentName] : _createAgent(agentName);

      return thisAgent;
    };
  }

  module.exports = Scraper;

}());
