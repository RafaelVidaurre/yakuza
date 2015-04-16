/**
* @author Rafael Vidaurre
* @module Scraper
* @requires Agent
*/

'use strict';

var _, utils, Agent;

_ = require('lodash');
utils = require('./utils');
Agent = require('./agent');

/**
* @class
*/
function Scraper () {
  /**
  * Object which contains scraper-wide routine definitions, routines are set via the routine()
  * method
  */
  this._routines = {};

  /**
  * Share methods available at scraper-level
  * @private
  */
  this._shareMethods = {
    replace: function (current, next) {
      return next;
    }
  };

  /**
  * Contains all agents associated with this Scraper
  */
  this._agents = {};


  // Define the default sharing method
  this._shareMethods.default = this._shareMethods.replace;
}

/**
* Creates a new agent
* @param {string} agentId unique agent identifier
* @private
*/
Scraper.prototype.__createAgent = function (agentId) {
  this._agents[agentId] = new Agent(agentId);

  return this._agents[agentId];
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
  thisAgent = agentExists ? this._agents[agentId] : this.__createAgent(agentId);

  return thisAgent;
};

/**
* Creates a scraper-wide routine which will be available for all agents
* @param {string} routineName name of the routine
* @param {array} array of taskIds which the routine will include
*/
Scraper.prototype.routine = function (routineName, taskIds) {
  if (!_.isArray(taskIds)) {
    throw new Error('An array of task Ids must be passed to the routine method');
  }

  if (!_.isString(routineName)) {
    throw new Error('Routine name must be a string');
  }

  this._routines[routineName] = taskIds;

  return this;
};

/**
* Adds a new scraper-level share method, it will override framework-level methods
* @params {string} methodName name of the share method
* @params {string} shareFunction
*/
Scraper.prototype.addShareMethod = function (methodName, shareFunction) {
  if (!_.isString(methodName)) {
    throw new Error('Share method name must be a string');
  }

  if (!_.isFunction(shareFunction)) {
    throw new Error('Share method must be a function');
  }

  this._shareMethods[methodName] = shareFunction;
};

module.exports = Scraper;
