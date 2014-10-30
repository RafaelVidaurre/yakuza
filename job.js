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
  var _this = this;

  /**
  * Parameters that will be provided to the Task instances
  * @protected
  */
  this._params = {};

  /**
  * Tasks enqueued via Job's API
  * @protected
  */
  this._enqueuedTasks = [];

  /**
  * Represents enqueued tasks' sincrony and execution order
  * @protected
  */
  this._executionPlan = null;

  /** Unique Job identifier */
  this.uid = null;
  /** Reference to the Agent instance being used by the Job */
  this.agent = agent;
  /** Reference to the Scraper instance being used by the Job */
  this.scraper = scraper;

  /**
  * Sets the Jobs Uid value
  * @param {string} argUid Uid which uniquely identifies the job
  * @protected
  */
  this._setUid = function (argUid) {
    if (!argUid || !_.isString(argUid) || argUid.length <= 0) {
      throw new Error('Job uid must be a valid string');
    }
    _this.uid = argUid;
  };

  // TODO: Add @see reference to Job.enqueue()
  /**
  * Build execution groups to run based on plan and enqueued tasks
  * @protected
  */
  this._buildExecutionPlan = function () {
    var executionPlan, nextGroupIdx, newExecutionPlan, newTaskGroup;
    executionPlan = _this.agent._config.executionPlan;
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

    _this._executionPlan = newExecutionPlan;
  };

  if (uid !== undefined) _this._setUid(uid);

  /**
  * Sets the Job's uid
  * @param {object} paramsObj Object containing key-value which are provided to the job's tasks
  */
  this.params = function (paramsObj) {
    if (_.isArray(paramsObj) || !_.isObject(paramsObj)) throw Error('Params must be an object');

    _.extend(_this._params, paramsObj);

    return _this;
  };

  /**
  * Defines a task to be run by this job
  * @param {string} taskId Id of the task to be run
  */
  this.enqueue = function (taskId) {
    if (!_.isString(taskId) || taskId.length <= 0) {
      throw Error('enqueue params isn\'t a valid string');
    }

    _this._enqueuedTasks.push(taskId);

    return _this;
  };

  /** Begin the scraping job */
  this.run = function () {
    _this.agent._applySetup();
    _this._buildTaskQueue();
  };
}

module.exports = Job;
