/**
* @author Rafael Vidaurre
* @module TaskDefinition
* @requires Utils
*/

'use strict';

var _ = require('lodash');
var utils = require('./utils');
var Task = require('./task');

/**
* @class
*/
function TaskDefinition () {
  /**
  * The main method of the TaskDefinition
  * @private
  */
  this._main = null;

  /**
  * Set of hooks for the task, defined at setup time
  * @private
  */
  this._hooks = {};

  /**
  * TaskDefinition's builder method, by default will instantiate the task once with empty parameters
  * @private
  */
  this._builder = function () {return {};};
}

/**
* Executes the builder function and builds the Task instances
* @private
* @return {array} An array of Task instances
*/
TaskDefinition.prototype._build = function () {
  var _this = this;
  var builderOutput, paramSets, tasks, task;

  if (!_.isFunction(this._main)) throw new Error('Cannot build task with no main method set');

  tasks = [];
  // TODO: Here we will expose certain variables via arguments for builders to use
  paramSets = utils.arrayify(this._builder());

  _.each(paramSets, function (paramSet) {
    task = new Task(_this._main, paramSet);
    tasks.push(task);
  });

  return tasks;
};

/**
* Sets main task's method
* @param {function} mainMethod main task method, this contains the scraping logic that makes a task
* unique
*/
TaskDefinition.prototype.main = function (mainMethod) {
  if (!_.isFunction(mainMethod)) throw new Error('Main method must be a function');
  this._main = mainMethod;

  return this;
};

/**
* Sets the task hooks, which will be called at specific points of the task's execution
* @param {object} hooksObj key-value pairs which define the task hooks
*/
TaskDefinition.prototype.hooks = function (hooksObj) {
  var _this = this;
  var hookKeys, slotIsArray, hookSlot;

  if (!_.isObject(hooksObj) || _.isArray(hooksObj)) {
    throw new Error('Hooks parameter must be an object');
  }

  // Add new hooks to _hooks object and initialize new keys
  hookKeys = _.keys(hooksObj);
  _.each(hookKeys, function (hookKey) {
    hookSlot = _this._hooks[hookKey];
    slotIsArray = _.isArray(hookSlot);

    if (!slotIsArray) {
      _this._hooks[hookKey] = [];
      hookSlot = _this._hooks[hookKey]; // Reassign variable (because it was pointing to undef)
    }

    hookSlot.push(hooksObj[hookKey]);
  });

  return this;
};

/**
* Sets the task's builder method overriding its default building behaviour
* @param {function} builderMethod method which defines task's building logic, if the builder returns
* an array, the task will be instanced once for every element in the array, passing each element in
* it as a parameter to its corresponding task
*/
TaskDefinition.prototype.builder = function (builderMethod) {
  if (!_.isFunction(builderMethod)) throw new Error('Builder must be a function');

  this._builder = builderMethod;
  return this;
};

module.exports = TaskDefinition;
