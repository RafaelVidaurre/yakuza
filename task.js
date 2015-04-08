/**
* @author Rafael Vidaurre
* @module Task
*/

'use strict';

var Http, Q, _;

Q = require('q');
Http = require('./http');
_ = require('lodash');

/**
* Is the product of a Task being built, contains status data, the main method of the task and other,
* stuff required for it to be run
* @class
*/

function Task (taskId, main, params, defaultCookies, config, job) {
  /**
  * Configuration object
  * @private
  */
  this.__config = config;

  /**
  * Number of retries performed by the built task
  * @private
  */
  this.__runs = 0;

  /**
  * Reference to the job that instanced this task
  * @private
  */
  this.__job = job;

  /**
  * Deferred which controls task's _runningPromise resolution
  * @private
  */
  this.__runningDeferred = Q.defer();

  /**
  * Main method to be run
  * @private
  */
  this.__main = main;

  /**
  * Request object for this task instance
  */
  this.__http = null;

  /**
  * Jar to be saved by the task, if defined it will be used in the next execution block if this task
  * finishes successfully
  * @private
  */
  this.__savedJar = null;

  /**
  * Default cookies to be used in the task
  */
  this.__defaultCookies = defaultCookies;

  /**
  * Parameters with which the task's main method will be provided.
  * @private
  */
  this.__currentParams = null;

  /**
  * Promise which exposes Task's running state
  */
  this._runningPromise = this.__runningDeferred.promise;

  /**
  * Parameters with which the task was instanced
  */
  this._params = params;

  /**
  * Storage for the task instance, this saves data which is exposed explicitly via emitter.share()
  * method and is later on provided in the __onSuccess method as an argument of the task's promise's
  * resolve method
  */
  this._sharedStorage = {};

  /** Id of the task's task definition */
  this.taskId = taskId;

  /** Time at which the task started running */
  this.startTime = null;

  /** Time at which the task finished running */
  this.endTime = null;

  /** Time the task spent running */
  this.elapsedTime = null;


  // Instance a new Http object
  this.__http = new Http(this.__defaultCookies);
  // Set current instance params
  this.__currentParams = this._params;
}

/**
* Method run when the task finishes running even if errors ocurred
* @private
*/
Task.prototype.__onFinish = function () {
  this.endTime = Date.now();
  this.elapsedTime = this.endTime - this.startTime;
};

/**
* Called by the task's emitter object, it exposes a key with its value to be used in another task
* later on
* @param {string} key Key by which the value will be shared
* @param value A value which will be shared
* @param {object} options Object of options for sharing
* @private
*/
Task.prototype.__onShare = function (key, value, options) {
  var current, shareMethod, shareMethodFunction;

  if (options) {
    shareMethod = options.method;
  }

  if (value === undefined) {
    throw new Error('Missing key/value in share method call');
  }

  if (!shareMethod) {
    shareMethod = 'default';
  }

  if (_.isString(shareMethod)) {
    shareMethodFunction = this.__job._scraper._shareMethods[shareMethod];
  } else {
    shareMethodFunction = shareMethod;
  }

  if (!shareMethodFunction) {
    throw new Error('Share method doesn\'t exist.');
  }

  if (!_.isFunction(shareMethodFunction)) {
    throw new Error('Share method is not a function');
  }

  current = this.__job._getShared(this.taskId, key);
  this.__job._setShared(this.taskId, key, shareMethodFunction(current, value));
};

/**
* Called in the task's main method when the task ended successfuly
* @param response Data retrieved by the task
* @private
*/
Task.prototype.__onSuccess = function (data) {
  var hookMessage, response, stopJob;

  stopJob = false;

  // Response object to be provided to the promise
  response = {
    data: data,
    task: this,
    status: 'success',
    savedCookieJar: this.__savedJar
  };

  // Object passed to the hook for execution control and providing useful data
  hookMessage = {
    stopJob: function () {
      stopJob = true;
    },
    data: response.data
  };

  if (_.isFunction(this.__config.hooks.onSuccess)) {
    this.__config.hooks.onSuccess(hookMessage);
  }

  this.__onFinish();

  if (stopJob) {
    this.__runningDeferred.reject(response);
  } else {
    this.__runningDeferred.resolve(response);
  }
};

/**
* Called in the task's main method, it saves the current cookies that have been set by the task.
* note that the cookies ONLY get applied if the task finishes successfully
* @private
*/
Task.prototype.__onSaveCookies = function () {
  // TODO: Accept custom jar as parameter
  var jar;

  jar = this.__http.getCookieJar();

  this.__savedJar = jar;
};

/**
* Called by the task's main method when an error ocurred
* @param {Error} error Error object with stracktrace and everything
* @param {string} message Message explaining what failed
* @private
*/
Task.prototype.__onFail = function (error, message) {
  var response, hookMessage, rerunTask, rerunParams;

  response = {
    error: error,
    message: message,
    task: this,
    status: 'fail',
    requestLog: this.__http.getLog()
  };

  hookMessage = {
    error: error,
    runs: this.__runs,
    rerun: function (newParams) {
      rerunTask = true;
      rerunParams = newParams;
    },
    params: this.__currentParams
  };

  if (_.isFunction(this.__config.hooks.onFail)) {
    this.__config.hooks.onFail(hookMessage);
  }

  if (rerunTask) {
    this.__rerunTask(rerunParams);
  } else {
    this.__onFinish();
    this.__runningDeferred.reject(response);
  }
};

/**
* Resets current task instance to when it was first created, except for statistic variables
* like runs and startTime
* @private
*/
Task.prototype.__resetTask = function () {
  this.__savedJar = null;
  this.__http = new Http(this.__defaultCookies);
  this._sharedStorage = {};
};

/**
* Resets and re-runs the current task instance
* @param params Parameters to be used in this new run instead of original ones
* @private
*/
Task.prototype.__rerunTask = function (params) {
  this.__resetTask();
  this.__currentParams = params || this._params;
  this._run();
};

/**
* Run this task's main method by providing it needed parameters. This is where the scraping spends
* most of its time
*/
Task.prototype._run = function () {
  var emitter = {
    success: this.__onSuccess.bind(this),
    fail: this.__onFail.bind(this),
    share: this.__onShare.bind(this),
    saveCookies: this.__onSaveCookies.bind(this)
  };

  this.startTime = this.__runs === 0 ? Date.now() : this.startTime;
  this.__runs += 1;
  this.__main(emitter, this.__http, this.__currentParams);
};


module.exports = Task;
