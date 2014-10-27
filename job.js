/**
* @author Rafael Vidaurre
*/
var _ = require('lodash');

(function () {
  'use strict';

  function Job (uid, scraperId, agentId) {
    var _this = this;

    _this._params = {};
    _this._enqueuedTasks = [];
    _this.uid = null;
    _this.scraperId = null;
    _this.agentId = null;

    _this._setUid = function (argUid) {
      if (!argUid || !_.isString(argUid) || argUid.length <= 0) {
        throw new Error('Job uid must be a valid string');
      }
      _this.uid = argUid;
    };
    _this._setScraperId = function (argScrId) {
      if (!argScrId || !_.isString(argScrId) || argScrId.length <= 0) {
        throw new Error('Scraper id must be a valid string');
      }
      _this.scraperId = argScrId;
    };
    _this._setAgentId = function (argAgId) {
      if (!argAgId || !_.isString(argAgId) || argAgId.length <= 0) {
        throw new Error('Agent id must be a valid string');
      }
      _this.agentId = argAgId;
    };

    // Set job data
    if (uid !== undefined) _this._setUid(uid);
    if (scraperId !== undefined) _this._setScraperId(scraperId);
    if (agentId !== undefined) _this._setAgentId(agentId);

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
    _this.run

  }

  module.exports = Job;

}());
