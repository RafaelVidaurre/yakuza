/**
* @author Rafael Vidaurre
* @module TaskDefinition
* @requires Utils
*/

'use strict';

var _, utils, Task;

_ = require('lodash');
utils = require('./utils');
Task = require('./task');

/**
* @class
*/
function TaskDefinition (id) {
  /**
  * String which identifies the task definition
  * @private
  */
  this.__id = id;

  /**
  * List of function which modify the Task definition's configuration (provided by config())
  * @private
  */
  this.__configCallbacks = [];

  /**
  * Task definition's configuration object (set by running all configCallback functions)
  * Property names are pre-defined just for maintainability
  * @private
  */
  this.__config = {
    hooks: {
      onFail: null,
      onSuccess: null
    }
  };

  /**
  * The main method of the TaskDefinition
  * @private
  */
  this.__main = null;

  /**
  * TaskDefinition's builder method, by default will instantiate the task once with empty parameters
  * @private
  */
  this.__builder = function () {
    return {};
  };
}

/**
* Run functions passed via config(), thus applying their config logic
* @private
*/
TaskDefinition.prototype.__applyConfigCallbacks = function () {
  var _this = this;

  _.each(_this.__configCallbacks, function (configCallback) {
    configCallback(_this.__config);
  });
};

/**
* Executes the builder function and builds the Task instances
* Note: This is called by the job
* @return {array} An array of Task instances
*/
TaskDefinition.prototype._build = function (builderParams, cookieJar, job) {
  var _this, paramSets, tasks, task;

  _this = this;

  if (!_.isFunction(this.__main)) {
    throw new Error('Cannot build task with no main method set');
  }

  tasks = [];
  paramSets = utils.arrayify(this.__builder(builderParams));

  _.each(paramSets, function (paramSet) {
    task = new Task(_this.__id, _this.__main, paramSet, cookieJar, _this.__config, job);
    tasks.push(task);
  });

  return tasks;
};

/**
* Applies the current task setup
*/
TaskDefinition.prototype._applySetup = function () {
  if (this._applied) {
    return;
  }

  this.__applyConfigCallbacks();
  this._applied = true;
};

/**
* Sets main task's method
* @param {function} mainMethod main task method, this contains the scraping logic that makes a task
* unique
*/
TaskDefinition.prototype.main = function (mainMethod) {
  if (!_.isFunction(mainMethod)) {
    throw new Error('Main method must be a function');
  }

  this.__main = mainMethod;

  return this;
};

/**
* Sets the task's builder method overriding its default building behaviour
* @param {function} builderMethod method which defines task's building logic, if the builder returns
* an array, the task will be instanced once for every element in the array, passing each element in
* it as a parameter to its corresponding task
*/
TaskDefinition.prototype.builder = function (builderMethod) {
  if (!_.isFunction(builderMethod)) {
    throw new Error('Builder must be a function');
  }

  this.__builder = builderMethod;

  return this;
};

/**
* Saves a configuration function into the config callbacks array
* @param {function} cbConfig method which modifies the Task definition's config object (passed as
* argument)
*/
TaskDefinition.prototype.setup = function (cbConfig) {
  if (!_.isFunction(cbConfig)) {
    throw new Error('Setup argument must be a function');
  }

  this.__configCallbacks.push(cbConfig);

  return this;
};

module.exports = TaskDefinition;
