'use strict';

var Http, chai, request, sinon, sinonChai;

Http = require('../http');
request = require('request');
sinonChai = require('sinon-chai');
sinon = require('sinon');
chai = require('chai');
chai.should();
chai.use(sinonChai);

describe('Http', function () {
  var http;

  beforeEach(function () {
    http = new Http();
  });

  describe('#Http', function () {
    it('should set default cookies if provided', function () {
      var jar, newHttp;

      jar = request.jar();
      newHttp = new Http(jar);

      newHttp._cookieJar.should.be.eql(jar);
    });

    it('should set a new cookie jar if no cookies are provided', function () {
      var jar;

      jar = request.jar();
      http._cookieJar.should.be.eql(jar);
    });

    it('should start with an empty log', function () {
      http._log.should.be.eql([]);
    });
  });

  describe('Request delegators', function () {
    var cb, opts, uri;

    beforeEach(function () {
      uri = 'http://www.fake.com/';
      opts = {a: 1};
      cb = function () {};
    });

    describe('#get', function () {
      it('should call with correct parameters', function () {
        // Fix this usage of sinon
        sinon.spy(http._request, 'get');
        http.get(uri, opts, cb);
        http._request.get.should.have.been.calledWith(uri, opts, cb);
      });
    });
  });
});
