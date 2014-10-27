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
    _this.uid = null;

    _this._setUid = function (argUid) {
      if (!argUid || !_.isString(argUid) || argUid.length <= 0) {
        throw new Error('Job uid must be a valid string');
      }
      _this.uid = argUid;
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
      _this.buildTaskQueue();
    };

  }

  module.exports = Job;

}());
