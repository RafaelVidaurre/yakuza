'use strict';

var Http = require('../http');
var request = require('request');

describe('Http', function () {
  var http;

  beforeEach(function () {
    http = new Http();
  });

  describe('#Http', function () {
    it('should set default cookies if provided', function () {
      var jar = request.jar();
      var newHttp = new Http(jar);
      expect(newHttp._cookieJar).toBe(jar);
    });

    it('should set a new cookie jar if no cookes are provided', function () {
      expect(http._cookieJar).toEqual(request.jar());
    });

    it('should start with an empty log', function () {
      expect(http._log).toEqual([]);
    });
  });

  describe('#_interceptResponse', function () {
    it('should call pushToLog', function () {
      var fakeResponse = {fake: 'response'};
      var fakeBody = {fake: 'body'};
      spyOn(http, '_pushToLog');
      http._interceptResponse(null, fakeResponse, fakeBody);
      expect(http._pushToLog).toHaveBeenCalledWith({response: fakeResponse, body: fakeBody});
    });

    it('should call the callback with response data', function () {
      var test = {callback: function () {}};
      spyOn(test, 'callback');
      http._interceptResponse(1, 2, 3, test.callback);
      expect(test.callback).toHaveBeenCalledWith(1, 2, 3);
    });
  });

  describe('#_pushToLog', function () {
    it('it should push response data to log', function () {
      var data = {response: 1, body: 2};
      http._pushToLog(data);
      expect(http._log).toEqual([data]);
    });
  });

  describe('#_initRequestParams', function () {
    it('should return an object', function () {
      expect(typeof http._initRequestParams('asd', {asd: 'asd'}) === 'object').toBe(true);
    });

    it('should return request parameters properly', function () {
      var cb = function () {return 1;};
      var uri = 'http://www.test.com';
      var opts = {uri: uri};
      var res = http._initRequestParams(uri, cb);
      var expectedRes = {uri: uri, options: {uri: uri}, callback: cb};
      expect(res).toEqual(expectedRes);
      res = http._initRequestParams(opts, cb);
      expect(res).toEqual(expectedRes);
      res = http._initRequestParams(uri, opts, cb);
      expect(res).toEqual(expectedRes);
    });
  });

  describe('Request delegators', function () {
    var uri, opts, cb, http;

    beforeEach(function () {
      uri = 'fakeUri';
      opts = {a: 1};
      cb = function () {};
    });

    describe('#del', function () {
      spyOn(http._request, 'del');
      http.del('a', opts, cb);
      expect(http._request.del).toHaveBeenCalledWith(uri, opts, cb);
    });

    describe('#get', function () {
      spyOn(http._request, 'get');
      http.del('a', opts, cb);
      expect(http._request.get).toHaveBeenCalledWith(uri, opts, cb);
    });

    describe('#head', function () {
      spyOn(http._request, 'head');
      http.del('a', opts, cb);
      expect(http._request.head).toHaveBeenCalledWith(uri, opts, cb);
    });

    describe('#patch', function () {
      spyOn(http._request, 'patch');
      http.del('a', opts, cb);
      expect(http._request.patch).toHaveBeenCalledWith(uri, opts, cb);
    });

    describe('#post', function () {
      spyOn(http._request, 'post');
      http.del('a', opts, cb);
      expect(http._request.post).toHaveBeenCalledWith(uri, opts, cb);
    });

    describe('#put', function () {
      spyOn(http._request, 'put');
      http.del('a', opts, cb);
      expect(http._request.put).toHaveBeenCalledWith(uri, opts, cb);
    });
  });

  describe('#getCookieJar', function () {
    var newCookieJar = request.jar();
    var newHttp = new Http(newCookieJar);
    expect(newHttp.getCookieJar()).toEqual(newCookieJar);
  });
});
