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

    _this._setUid = function () {
      if (!uid || !_.isString(uid) || uid.length <= 0) {
        throw new Error('Job uid must be a valid string');
      }
      _this.uid = uid;
    };
    _this._setScraperId = function () {
      if (!scraperId || !_.isString(scraperId) || scraperId.length <= 0) {
        throw new Error('Scraper id must be a valid string');
      }
      _this.scraperId = scraperId;
    };
    _this._setAgentId = function () {
      if (!agentId || !_.isString(agentId) || agentId.length <= 0) {
        throw new Error('Agent id must be a valid string');
      }
      _this.agentId = agentId;
    };

    // Set uid
    if (uid !== undefined) _this._setUid();
    if (scraperId !== undefined) _this._setScraperId();
    if (agentId !== undefined) _this._setAgentId();

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

  }

  module.exports = Job;

}());
