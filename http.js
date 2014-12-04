/**
* A wrapper for mikeal's request module for Yakuza
* @module Http
* @author Rafael Vidaurre
*/

'use strict';

var request = require('request');

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
* Pushes a response object to the request log and makes proper
* @param {object} err Error object, is null if no error is present
* @param {object} res Request's response
* @param {string} body Request's response body only, is null if an error is present
* @param {function} callback Callback to be executed
* @private
*/
Http.prototype._interceptResponse = function (err, res, body, callback) {
  this.pushToLog({response: res, body: body});
  callback(err, res, body);
};

module.exports = Http;
