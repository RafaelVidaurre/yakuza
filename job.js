/**
* @author Rafael Vidaurre
* @module Job
*/

'use strict';

var _ = require('lodash');

/**
* @class
* @param {string} uid Unique identifier for the job instance
* @param {Scraper} scraper Reference to the scraper being used by the job
* @param {Agent} agent Reference to the agent being used by the job
*/
function Job (uid, scraper, agent) {
  /**
  * Parameters that will be provided to the Task instances
  * @private
  */
  this._params = {};

  /**
  * Tasks enqueued via Job's API
  * @private
  */
  this._enqueuedTasks = [];

  /**
  * Represents enqueued tasks' sincrony and execution order
  * @private
  */
  this._executionPlan = null;

  /** Unique Job identifier */
  this.uid = null;
  /** Reference to the Agent instance being used by the Job */
  this.agent = agent;
  /** Reference to the Scraper instance being used by the Job */
  this.scraper = scraper;

  // Set job's uid
  if (uid !== undefined) this._setUid(uid);
}

/**
* Sets the Jobs Uid value
* @param {string} argUid Uid which uniquely identifies the job
* @private
*/
Job.prototype._setUid = function (argUid) {
  if (!argUid || !_.isString(argUid) || argUid.length <= 0) {
    throw new Error('Job uid must be a valid string');
  }
  this.uid = argUid;
};

/**
* Build execution groups to run based on plan and enqueued tasks
* @private
*/
Job.prototype._buildExecutionPlan = function () {
  var _this = this;
  var executionPlan, nextGroupIdx, newExecutionPlan, newTaskGroup;
  executionPlan = this.agent._config.executionPlan;
  newExecutionPlan = [];
  newTaskGroup = [];

  _.each(executionPlan, function (executionGroup) {
    _.each(_this._enqueuedTasks, function (enqueuedTask) {
      if (_.contains(executionGroup, enqueuedTask)) {
        newTaskGroup.push(enqueuedTask);
      }
    });
    // Group was created
    if (newTaskGroup.length > 0) {
      newExecutionPlan.push(newTaskGroup);
      newTaskGroup = [];
    }
  });

  this._executionPlan = newExecutionPlan;
};

/**
* Sets the Job's uid
* @param {object} paramsObj Object containing key-value which are provided to the job's tasks
*/
Job.prototype.params = function (paramsObj) {
  if (_.isArray(paramsObj) || !_.isObject(paramsObj)) throw Error('Params must be an object');

  _.extend(this._params, paramsObj);

  return this;
};

/**
* Defines a task to be run by Job.prototype job
* @param {string} taskId Id of the task to be run
*/
Job.prototype.enqueue = function (taskId) {
  if (!_.isString(taskId) || taskId.length <= 0) {
    throw Error('enqueue params isn\'t a valid string');
  }

  this._enqueuedTasks.push(taskId);

  return this;
};

/** Begin the scraping job */
Job.prototype.run = function () {
  this.agent._applySetup();
  this._buildTaskQueue();
};


module.exports = Job;
