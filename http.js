/**
* A wrapper for mikeal's request module for Yakuza
* @module Http
* @author Rafael Vidaurre
*/

'use strict';

var OptionsTemplate, Q, _, needle, defaults;

OptionsTemplate = require('./options-template');
Q = require('q');
needle = require('needle');
_ = require('lodash');

defaults = {
  follow_max: 0,
  user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_2) AppleWebKit/537.36 (KHTML, like '
  + 'Gecko) Chrome/41.0.2272.76 Safari/537.36'
};

needle.defaults(defaults);

/**
* @class
* @param {object} defaultCookies cookie jar for the class instance to be initialized with, defaults
* to a brand new cookie jar
*/
function Http (defaultCookies) {
  /**
  * Cookie jar for the Http instance
  * @private
  */
  this._cookieJar = defaultCookies || {};

  /**
  * Array of requests logged
  * @private
  */
  this._log = [];
}

/**
* Pushes a response object to the request log and responds to passed callback
* @param {object} err Error object, is null if no error is present
* @param {object} res Needle's response
* @param {string} body Needle's response body only, is null if an error is present
* @param {function} callback Callback to be executed
* @private
*/
Http.prototype._interceptResponse = function (err, res, body, url, callback) {
  var entry, resCookieString, _this, cb, noop;

  _this = this;
  noop = function () {};
  cb = callback || noop;

  if (err) {
    callback(err, null, null);
    return;
  }

  resCookieString = '';
  _.each(res.cookies, function (value, key) {
    // Update our cookie jar
    _this._cookieJar[key] = value;

    // Build cookie string for logging
    if (resCookieString) {
      resCookieString += ' ';
    }
    resCookieString += key + '=' + value + ';';
  });

  entry = {
    request: {
      headers: res.req._headers,
      cookies: res.req._headers.cookie || '',
      url: url
    },
    response: {
      cookies: resCookieString,
      headers: res.headers,
      statusCode: res.statusCode,
      body: body
    }
  };
  this._pushToLog(entry);
  cb(err, res, body);
};

/**
* Pushes an entry to the class log
* @param {object} logEntry entry that represents a unit of the log
*/
Http.prototype._pushToLog = function (logEntry) {
  this._log.push(logEntry);
};

Http.prototype._buildParams = function (param1, param2) {
  var params;

  params = {
    opts: {},
    callback: undefined
  };
  params.callback = param2;

  if (_.isString(param1)) {
    params.opts.url = param1;
  } else {
    params.opts = param1;
  }

  return params;
};

Http.prototype.request = function (method, opts, callback) {
  var _this, data, url, finalOpts;

  _this = this;

  if (!opts.url) {
    throw new Error('Url is not set');
  }

  url = opts.url;
  data = opts.data || null;

  finalOpts = _.omit(opts, ['data', 'url']);
  finalOpts.cookies = _.extend(this._cookieJar, finalOpts.cookies);

  needle.request(method, url, data, finalOpts, function (err, res, body) {
    _this._interceptResponse(err, res, body, opts.url, callback);
  });
};

/**
* Delegate to request's `del` method
*/
Http.prototype.del = function (param1, param2) {
  var opts, params, callback;

  params = this._buildParams(param1, param2);
  opts = params.opts;
  callback = params.callback;

  this.request('delete', opts, callback);
};

/**
* Delegate to request's `get` method
*/
Http.prototype.get = function (param1, param2) {
  var opts, params, callback;

  params = this._buildParams(param1, param2);
  opts = params.opts;
  callback = params.callback;

  this.request('get', opts, callback);
};

/**
* Delegate to request's `head` method
*/
Http.prototype.head = function (param1, param2) {
  var opts, params, callback;

  params = this._buildParams(param1, param2);
  opts = params.opts;
  callback = params.callback;

  this.request('head', opts, callback);
};

/**
* Delegate to request's `patch` method
*/
Http.prototype.patch = function (param1, param2) {
  var opts, params, callback;

  params = this._buildParams(param1, param2);
  opts = params.opts;
  callback = params.callback;

  this.request('patch', opts, callback);
};

/**
* Delegate to request's `post` method
*/
Http.prototype.post = function (param1, param2) {
  var opts, params, callback;

  params = this._buildParams(param1, param2);
  opts = params.opts;
  callback = params.callback;

  this.request('post', opts, callback);
};

/**
* Delegate to request's `put` method
*/
Http.prototype.put = function (param1, param2) {
  var opts, params, callback;

  params = this._buildParams(param1, param2);
  opts = params.opts;
  callback = params.callback;

  this.request('put', opts, callback);
};

/**
* Returns the current request log as an array
* @return {array} current request log
*/
Http.prototype.getLog = function () {
  return this._log;
};

/**
* Returns a clone of the current cookie jar
* @return current cookie jar clone
*/
Http.prototype.getCookieJar = function () {
  return _.cloneDeep(this._cookieJar);
};

/**
* Return a new options template instace
* @param {object} POJO with base options
*/
Http.prototype.optionsTemplate = function (baseOptions) {
  return new OptionsTemplate(baseOptions);
};

module.exports = Http;
