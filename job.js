/**
* @author Rafael Vidaurre
*/
var _ = require('lodash');

(function () {
  'use strict';

  function Job (uid, scraper, agent) {
    var _this = this;

    _this._params = {};
    _this._enqueuedTasks = [];
    _this._executionPlan = null;
    _this.uid = null;
    _this.agent = agent;
    _this.scraper = scraper;

    _this._setUid = function (argUid) {
      if (!argUid || !_.isString(argUid) || argUid.length <= 0) {
        throw new Error('Job uid must be a valid string');
      }
      _this.uid = argUid;
    };

    // Build execution groups to run based on plan and enqueued tasks
    _this._buildExecutionPlan = function () {
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

    // Set job data
    if (uid !== undefined) _this._setUid(uid);

    _this.params = function (paramsObj) {
      if (_.isArray(paramsObj) || !_.isObject(paramsObj)) throw Error('Params must be an object');

      _.extend(_this._params, paramsObj);

      return _this;
    };

    // Enqueue tasks by their task_id
    _this.enqueue = function (taskId) {
      if (!_.isString(taskId) || taskId.length <= 0) {
        throw Error('enqueue params isn\'t a valid string');
      }

      _this._enqueuedTasks.push(taskId);

      return _this;
    };

    // Begin scraping job
    _this.run = function () {
      _this._buildTaskQueue();
    };

  }

  module.exports = Job;

}());
