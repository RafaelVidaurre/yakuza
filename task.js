/**
* @author Rafael Vidaurre
* @module Task
*/

'use strict';

var Q = require('q');

/**
* Is the product of a Task being built, contains status data, the main method of the task and other,
* stuff required for it to be run
* @class
*/
function Task (main, params) {
  /**
  * Number of retries performed by the built task
  * @private
  */
  this._retries = 0;

  /**
  * Deferred which controls task's _runningPromise resolution
  * @private
  */
  this._runningDeferred = Q.defer();

  /**
  * Promise which exposes Task's running state
  * @private
  */
  this._runningPromise = this._runningDeferred.promise;

  /**
  * Parameters which will be used by its main method
  * @private
  */
  this._params = params;

  /**
  * Main method to be run
  * @private
  */
  this._main = main;

  /**
  * Storage for the task instance, this saves data which is exposed explicitly via emitter.share()
  * method and is later on provided in the _onSuccess method as an argument of the task's promise's
  * resolve method
  */
  this._sharedStorage = {};
}

/**
* Called by the task's emitter object, it exposes a key with its value to be used in another task
* later on
* @param {string} key Key by which the value will be shared
* @param value A value which will be shared
*/
Task.prototype._onShare = function (key, value) {
  this._sharedStorage[key] = value;
};

/**
* Called by the task's emitter object, called when task ended successfuly
* @param response Data retrieved by the task
* @private
*/
Task.prototype._onSuccess = function (response) {
  this._runningDeferred.resolve(response, this._sharedStorage);
};

/**
* Called by the task's emitter object, called when an error ocurred in the task
* @param {Error} error Error object with stracktrace and everything
* @param {string} message Message explaining what failed
*/
Task.prototype._onError = function (error, message) {
  this._runningDeferred.reject(error, message);
};

/**
* Run this task's main method by providing it needed parameters. This is where the scraping spends
* most of its time
* @private
*/
Task.prototype._run = function () {
  var emitter = {
    success: this._onSuccess,
    error: this._onError,
    share: this._onShare
  };

  this._main(emitter, this._params);
};


module.exports = Task;
