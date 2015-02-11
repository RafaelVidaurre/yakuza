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
  * Determines if the setup processes have been applied
  */
  this._applied = false;

  /**
  * Array of callbacks provided via config() which set the Scraper's configuration variables
  * @private
  */
  this._configCallbacks = [];

  /**
  * Contains all agents associated with this Scraper
  * @private
  */
  this._agents = {};

  /**
  * Config object, contains configuration data and is exposed via the setup() method
  * @private
  */
  this._config = {};

  /**
  * Object which contains scraper-wide routine definitions, routines are set via the routine()
  * method
  */
  this._routines = {};
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
* Run functions passed via config(), thus applying their config logic
* @private
*/
Scraper.prototype._applyConfigCallbacks = function () {
  var _this = this;
  _.each(_this._configCallbacks, function (configCallback) {
    configCallback(_this._config);
  });
};

/**
* Applies all necessary processes regarding the setup stage of the scraper
* @private
*/
Scraper.prototype._applySetup = function () {
  if (this._applied) {return;}
  this._applyConfigCallbacks();
  this._applied = true;
};

/**
* Used to configure the scraper, it enqueues each configuration function meaning it
* allows a scraper to be configured in multiple different places
* @param {function} cbConfig function which will modify config parameters
*/
Scraper.prototype.setup = function (cbConfig) {
  if (!_.isFunction(cbConfig)) {throw new Error('Config argument must be a function');}

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

/**
* Creates a scraper-wide routine which will be available for all agents
* @param {string} routineName name of the routine
* @param {array} array of taskIds which the routine will include
*/
Scraper.prototype.routine = function (routineName, taskIds) {
  if (_.isArray(taskIds)) {
    throw new Error('An array of task Ids must be passed to the routine method');
  }

  if (!_.isString(routineName)) {
    throw new Error('Routine name must be a string');
  }

  this._routines[routineName] = taskIds;

  return this;
};

module.exports = Scraper;
