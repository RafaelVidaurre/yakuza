/**
* @author Rafael Vidaurre
* @module Scraper
* @requires Agent
*/

'use strict';

var _ = require('lodash');
var utils = require('./utils');
var Agent = require('./agent');

/**
* @class
*/
function Scraper () {
  /**
    Array of callbacks provided via config() which set the Scraper's configuration variables
    @private
  */
  this._configCallbacks = [];

  /**
  * Contains all agents associated with this Scraper
  * @private
  */
  this._agents = {};
}

/**
* Creates a new agent
* @param {string} agentId unique agent identifier
* @private
*/
Scraper.prototype._createAgent = function (agentId) {
  this._agents[agentId] = new Agent(agentId);
  return this._agents[agentId];
};

/**
* Used to configure the scraper, it enqueues each configuration function meaning it
* allows a scraper to be configured in multiple different places
* @param {function} cbConfig function which will modify config parameters
*/
Scraper.prototype.config = function (cbConfig) {
  if (!_.isFunction(cbConfig)) throw new Error('Config argument must be a function');

  this._configCallbacks.push(cbConfig);

  return Scraper;
};

/**
* Creates or gets an agent based on the id passed
* @param {string} agentId Id of the agent to retrieve/create
* @returns {Agent} agent to be retrieved/created
*/
Scraper.prototype.agent = function (agentId) {
  var thisAgent, agentExists;

  if (!agentId || !_.isString(agentId)) {
    throw new Error('Agent id must be a non-empty string');
  }

  agentExists = utils.hasKey(this._agents, agentId);
  thisAgent = agentExists ? this._agents[agentId] : this._createAgent(agentId);
  return thisAgent;
};

module.exports = Scraper;
