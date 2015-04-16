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
  * Agent's configuration object (set by running all configCallback functions)
  * @private
  */
  this.__config = {
    plan: []
  };

  /**
  * Set of task instances for this agent
  */
  this._taskDefinitions = {};

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
* Turns every element in the execution plan into an array for type consistency
* @private
*/
Agent.prototype.__formatPlan = function () {
  var _this, formattedPlan, currentGroup, formattedGroup, formattedTaskObj;

  _this = this;
  formattedPlan = [];

  if (_this.__config.plan.length <= 0) {
    throw new Error('Agent ' + _this.id + ' has no execution plan, use the agent\'s plan method' +
      ' to define it');
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
* Applies all necessary processes regarding the setup stage of the agent
*/
Agent.prototype._applySetup = function () {
  if (this.__applied) {
    return;
  }

  this.__formatPlan();
  this.__applied = true;
};

/**
* Sets the task's execution plan
* @param {Array} executionPlan array representing the execution plan for this agent
*/
Agent.prototype.plan = function (executionPlan) {
  // TODO: Validate execution plan format right away
  if (!_.isArray(executionPlan)) {
    throw new Error('Agent plan must be an array of task ids');
  }

  this.__config.plan = executionPlan;

  return this;
};

/**
* Creates or retrieves a task for a given task id
* @param {string} taskId id which identifies the task
* @private
* @return {TaskDefinition}
*/
Agent.prototype.task = function (taskId) {
  if (!utils.hasKey(this._taskDefinitions, taskId)) {
    this._taskDefinitions[taskId] = new TaskDefinition(taskId);
  }

  return this._taskDefinitions[taskId];
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
