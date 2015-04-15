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
* Sets task hooks
*/
TaskDefinition.prototype.hooks = function (hooks) {
  if (!_.isObject(hooks) || _.isArray(hooks)) {
    throw new Error('Hooks argument must be an object');
  }

  this.__config.hooks = hooks;

  return this;
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


module.exports = TaskDefinition;
