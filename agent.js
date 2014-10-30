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
  * Formatted execution plan created based on the agent's config object
  * @private
  */
  this._plan = null;

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
Agent.prototype._formatPlan = function () {
  var _this = this;
  var formattedPlan, currentGroup, formattedGroup, formattedTaskObj;
  formattedPlan = [];

  if (_this._config.plan === undefined) {
    throw new Error('Agent '+_this.id+' has no execution plan, use the config object provided' +
      ' by the setup method to define an execution plan');
  }

  // Turn each tier into an array
  _.each(_this._config.plan, function (taskGroup) {
    currentGroup = _.isArray(taskGroup) ? taskGroup : [taskGroup];
    formattedGroup = [];

    // Turn each element in the array into an object
    _.each(currentGroup, function (taskObj) {
      formattedTaskObj = {};

      if (_.isString(taskObj)) {
        formattedTaskObj.taskId = taskObj;
      } else {
        formattedTaskObj = taskObj;
      }

      formattedGroup.push(formattedTaskObj);
    });

    formattedPlan.push(formattedGroup);
  });

  _this._plan = formattedPlan;
};

/**
* Applies all necessary processes regarding the setup stage of the agent
* @private
*/
Agent.prototype._applySetup = function () {
  this._applyConfigCallbacks();
  this._formatPlan();
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
