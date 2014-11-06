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
  * Next execution plan group idx from which we will build the next execution queue
  * @private
  */
  this._planIdx = 0;

  /**
  * Next execution queue group idx to run
  * @private
  */
  this._executionQueueIdx = 0;

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
  this._plan = null;

  /**
  * Queue of tasks built in runtime defined by taskDefinition builders and execution plan
  * @private
  */
  this._executionQueue = [];

  /** Reference to the Agent instance being used by the Job */
  this._agent = agent;

  /** Reference to the Scraper instance being used by the Job */
  this._scraper = scraper;

  /** Unique Job identifier */
  this.uid = null;

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
Job.prototype._buildPlan = function () {
  var _this = this;
  var executionPlan, nextGroupIdx, newExecutionPlan, newTaskGroup, matchIdx, groupTaskIds;

  executionPlan = this._agent._plan;
  newExecutionPlan = [];
  newTaskGroup = [];

  _.each(executionPlan, function (executionGroup) {
    groupTaskIds = _.map(executionGroup, function (taskObj) {
      return taskObj.taskId;
    });

    _.each(_this._enqueuedTasks, function (enqueuedTask) {
      matchIdx = groupTaskIds.indexOf(enqueuedTask);
      if (matchIdx >= 0) {
        newTaskGroup.push(executionGroup[matchIdx]);
      }
    });

    if (newTaskGroup.length > 0) {
      newExecutionPlan.push(newTaskGroup);
      newTaskGroup = [];
    }
  });

  this._plan = newExecutionPlan;
};

/**
* Returns an undefined number of Task instances based on a taskDefinition's builder output
* @param {object} taskRecipe contains specifications to build a certain taskDefinition
* @private
* @return {array} an array of Tasks
*/
Job.prototype._buildTask = function (taskRecipe) {
  var errMsg, taskDefinition;

  taskDefinition = this._agent._taskDefinitions[taskRecipe.taskId];
  errMsg = 'Task with id ' + taskRecipe.taskId + ' does not exist in agent ' + this._agent.id;

  if (taskDefinition === undefined) throw new Error(errMsg);

  return taskDefinition._build();
};

/**
* Takes a plan group and creates one or more execution groups to be inserted into the execution
* queue
* @param {array} array of objects which represent tasks methods in a plan
* @private
* @return {array} array of arrays of Task instances with their respective
* configuration, each element in the outermost array represents
* an execution group to be inserted into the execution queue
*/
Job.prototype._processPlanGroup = function (planGroup) {

};

Job.prototype._prepareRun = function () {
  this.agent._applySetup();
  this._buildPlan();
};

/**
* Sets parameters which the job will provide to its tasks
* @param {object} paramsObj Object containing key-value pair
*/
Job.prototype.params = function (paramsObj) {
  if (_.isArray(paramsObj) || !_.isObject(paramsObj)) throw Error('Params must be an object');

  _.extend(this._params, paramsObj);

  return this;
};

/**
* Adds a taskDefinition to be run by Job.prototype job
* @param {string} taskId Id of the taskDefinition to be run
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
  this._prepareRun();
  this._processPlanGroup(this._plan[this._planIdx]);
};


module.exports = Job;
