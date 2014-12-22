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
  * List of function which modify the Task definition's configuration (provided by config())
  */
  this._configCallbacks = [];

  /**
  * Task definition's configuration object (set by running all configCallback functions)
  * @private
  */
  this._config = {};

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
* Note: This is called by the job
* @private
* @return {array} An array of Task instances
*/
TaskDefinition.prototype._build = function (builderParams) {
  var _this = this;
  var paramSets, tasks, task;

  if (!_.isFunction(this._main)) {throw new Error('Cannot build task with no main method set');}

  tasks = [];
  paramSets = utils.arrayify(this._builder(builderParams));

  _.each(paramSets, function (paramSet) {
    task = new Task(_this._main, paramSet);
    tasks.push(task);
  });

  return tasks;
};

TaskDefinition.prototype._applySetup = function () {
  if (this._applied) {return;}
  this._applyConfigCallbacks();
  this._applied = true;
};

/**
* Run functions passed via config(), thus applying their config logic
* @private
*/
TaskDefinition.prototype._applyConfigCallbacks = function () {
  var _this = this;
  _.each(_this._configCallbacks, function (configCallback) {
    configCallback(_this._config);
  });
};


/**
* Sets main task's method
* @param {function} mainMethod main task method, this contains the scraping logic that makes a task
* unique
*/
TaskDefinition.prototype.main = function (mainMethod) {
  if (!_.isFunction(mainMethod)) {throw new Error('Main method must be a function');}
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
  if (!_.isFunction(builderMethod)) {throw new Error('Builder must be a function');}

  this._builder = builderMethod;

  return this;
};

/**
* Saves a configuration function into the config callbacks array
* @param {function} cbConfig method which modifies the Task definition's config object (passed as
* argument)
*/
TaskDefinition.prototype.setup = function (cbConfig) {
  if (!_.isFunction(cbConfig)) {throw new Error('Setup argument must be a function');}

  this._configCallbacks.push(cbConfig);

  return this;
};

module.exports = TaskDefinition;
