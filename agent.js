/**
* @author Rafael Vidaurre
* @requires Utils
* @module Agent
*/

'use strict';

var _ = require('lodash');
var utils = require('./utils');

/**
* @class
* @param {string} id Arbitrary value which identifies an agent instance
*/
function Agent (id) {
  /**
  * List of functions which modify the Agent's configuration (provided by config())
  * @private
  */
  this._configCallbacks = [];

  /**
  * Set of task instances for this agent
  * @private
  */
  this._tasks = {};

  /**
  * Agent's configuration object (set via config() function)
  * @private
  */
  this._config = {};

  /**
  * Id by which an agent is identified
  */
  this.id = id;
}

/**
* Run functions passed via config(), thus applying their config logic
* @private
*/
Agent.prototype._applyConfigCallbacks = function () {
  var _this = this;
  _.each(_this._configCallbacks, function (configCallback) {
    configCallback(_this._config);
  });
};

/**
* Turns every element in the execution plan into an array for type consistency
* @private
*/
Agent.prototype._formatExecutionPlan = function () {
  var _this = this;
  var newExecutionPlan, currentTier;
  newExecutionPlan = [];

  if (_this._config.executionPlan === undefined) {
    throw new Error('Agent '+_this.id+' has no execution plan, use the config object provided' +
      ' by the setup method to define an execution plan');
  }

  // Turn each tier into an array if they are not
  _.each(_this._config.executionPlan, function (executionTier) {
    currentTier = _.isArray(executionTier) ? executionTier : [executionTier];
    newExecutionPlan.push(currentTier);
  });

  _this._config.executionPlan = newExecutionPlan;
};

/**
* Applies all necessary processes regarding the setup stage of the agent
* @private
*/
Agent.prototype._applySetup = function () {
  this._applyConfigCallbacks();
  this._formatExecutionPlan();
};

/**
* Saves a configuration function in into the config callbacks array
* @param {function} cbConfig method which modifies the agent's config object (passed as argument)
*/
Agent.prototype.setup = function (cbConfig) {
  if (!_.isFunction(cbConfig)) { throw Error('Config argument must be a function'); }

  this._configCallbacks.push(cbConfig);

  return Agent;
};


module.exports = Agent;
