/**
* A wrapper for mikeal's request module for Yakuza
* @module Http
* @author Rafael Vidaurre
*/

'use strict';

var request = require('request');
var _ = require('lodash');

function Http (defaultCookies) {
  /**
  * Cookie jar for the Http instance
  * @private
  */
  this._cookieJar = defaultCookies || request.jar();

  /**
  * Instance of mikeal's request API with a default cookie jar set
  * @private
  */
  this._request = request.defaults({jar: this._cookieJar});

  /**
  * Array of requests logged
  * @private
  */
  this._log = [];
}

/**
* Pushes a response object to the request log and responds to passed callback
* @param {object} err Error object, is null if no error is present
* @param {object} res Request's response
* @param {string} body Request's response body only, is null if an error is present
* @param {function} callback Callback to be executed
* @private
*/
Http.prototype._interceptResponse = function (err, res, body, callback) {
  this._pushToLog({response: res, body: body});
  callback(err, res, body);
};

/**
* Pushes an entry to the class log
* @param {object} logEntry entry that represents a unit of the log
*/
Http.prototype._pushToLog = function (logEntry) {
  this._log.push(logEntry);
};

/**
* Pattern-matches parameters for request calls
* @param param1 First parameter (required)
* @param param2 Second parameter (required)
* @param param3 Third parameter
* @return {object} parameters assigned to proper keys
* @private
*/
Http.prototype._initRequestParams = function (param1, param2, param3) {
  var callback, options, uri;

  if (_.isFunction(param2) && !param3) {
    callback = param2;
  }

  if (_.isObject(param2) && !_.isFunction(param2)) {
    options = param2;
    options.uri = param1;
    uri = param1;
    callback = param3;
  } else if (_.isString(param1)) {
    uri = param1;
    options = {uri: uri};
  } else {
    options = param1;
    uri = options.uri;
  }

  return {uri: uri, options: options, callback: callback};
};

Http.prototype.del = function (uri, options, callback) {
  var params = this._initRequestParams(uri, options, callback);
  this._request.del(params.uri, params.options, params.callback);
};

module.exports = Http;
