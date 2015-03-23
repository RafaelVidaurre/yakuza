/**
* @author Rafael Vidaurre
* @requires Utils
* @requires TaskDefinition
* @module Agent
*/

'use strict';

var _, utils, TaskDefinition;

_ = require('lodash');
utils = require('./utils');
TaskDefinition = require('./task-definition');

/**
* @class
* @param {string} id Arbitrary value which identifies an agent instance
*/
function Agent (id) {
  /**
  * Determines wether the agent's config has been applied or not
  */
  this.__applied = false;

  /**
  * List of functions which modify the Agent's configuration (provided by setup())
  * @private
  */
  this.__configCallbacks = [];

  /**
  * Set of task instances for this agent
  * @private
  */
  this.__taskDefinitions = {};

  /**
  * Agent's configuration object (set by running all configCallback functions)
  * @private
  */
  this.__config = {
    plan: []
  };

  /**
  * Routines defined at agent-level, these override scraper-level routines
  */
  this._routines = {};

  /**
  * Formatted execution plan created based on the agent's config object
  */
  this._plan = null;

  /**
  * Id by which an agent is identified
  */
  this.id = id;
}

/**
* Run functions passed via config(), thus applying their config logic
* @private
*/
Agent.prototype.__applyConfigCallbacks = function () {
  var _this = this;
  _.each(_this.__configCallbacks, function (configCallback) {
    configCallback(_this.__config);
  });
};

/**
* Turns every element in the execution plan into an array for type consistency
* @private
*/
Agent.prototype.__formatPlan = function () {
  var _this, formattedPlan, currentGroup, formattedGroup, formattedTaskObj;

  _this = this;
  formattedPlan = [];

  if (_this.__config.plan.length <= 0) {
    throw new Error('Agent ' + _this.id + ' has no execution plan, use the config object provided' +
      ' by the setup method to define an execution plan');
  }

  // Turn each tier into an array
  _.each(this.__config.plan, function (taskGroup) {
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

  this._plan = formattedPlan;
};

/**
* Applies all task definitions
* @private
*/
Agent.prototype.__applyTaskDefinitions = function () {
  _.each(this.__taskDefinitions, function (taskDefinition) {
    taskDefinition._applySetup();
  });
};

/**
* Applies all necessary processes regarding the setup stage of the agent
*/
Agent.prototype._applySetup = function () {
  if (this.__applied) {
    return;
  }
  this.__applyConfigCallbacks();
  this.__applyTaskDefinitions();
  this.__formatPlan();
  this.__applied = true;
};

/**
* Saves a configuration function into the config callbacks array
* @param {function} cbConfig method which modifies the agent's config object (passed as argument)
*/
Agent.prototype.setup = function (cbConfig) {
  if (!_.isFunction(cbConfig)) {
    throw new Error('Setup argument must be a function');
  }

  this.__configCallbacks.push(cbConfig);

  return this;
};

/**
* Creates or retrieves a task for a given task id
* @param {string} taskId id which identifies the task
* @private
* @return {TaskDefinition}
*/
Agent.prototype.task = function (taskId) {
  if (!utils.hasKey(this.__taskDefinitions, taskId)) {
    this.__taskDefinitions[taskId] = new TaskDefinition(taskId);
  }

  return this.__taskDefinitions[taskId];
};

/**
* Creates an agent-wide routine which will be available for all agents
* @param {string} routineName name of the routine
* @param {array} array of taskIds which the routine will include
*/
Agent.prototype.routine = function (routineName, taskIds) {
  if (!_.isArray(taskIds)) {
    throw new Error('An array of task Ids must be passed to the routine method');
  }

  if (!_.isString(routineName)) {
    throw new Error('Routine name must be a string');
  }

  this._routines[routineName] = taskIds;

  return this;
};


module.exports = Agent;
