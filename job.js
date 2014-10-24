/**
* @author Rafael Vidaurre
*/
var _ = require('lodash');

(function () {
  'use strict';

  function Job (uid) {
    var _this = this;
    var _setUid = function () {
      if (!uid || !_.isString(uid) || uid.length <= 0) {
        throw new Error('Job uid must be a valid string');
      }
      _this.uid = uid;
    };

    _this._params = {};
    _this.uid = null;

    // Set uid
    if (uid !== undefined) _setUid();

    _this.params = function (paramsObj) {
      if (_.isArray(paramsObj) || !_.isObject(paramsObj)) throw Error('Params must be an object');

      _.extend(_this._params, paramsObj);

      return _this;
    };

  }

  module.exports = Job;

}());
