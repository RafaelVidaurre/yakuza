'use strict';

var Http, chai, nock, request, sinon, sinonChai;

nock = require('nock');
Http = require('../http');
request = require('request');
sinonChai = require('sinon-chai');
sinon = require('sinon');
chai = require('chai');
chai.should();
chai.use(sinonChai);
nock.disableNetConnect();

describe('Http', function () {
  var body1, body2, headers1, headers2, http;

  beforeEach(function () {
    http = new Http();
  });

  beforeEach(function () {
    body1 = 'Body1';
    headers1 = {
      'Set-Cookie': 'a=1'
    };
    body2 = 'Body2';
    headers2 = {
      'Set-Cookie': 'b=2'
    };

    nock('http://www.1.com')
      .delete('/').reply(200, body1, headers1)
      .get('/').reply(200, body1, headers1)
      .head('/').reply(200)
      .patch('/').reply(200, body1, headers1)
      .post('/').reply(200, body1, headers1)
      .put('/').reply(200, body1, headers1);

    nock('http://www.2.com')
      .get('/').reply(200, body2, headers2);
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
      uri = 'http://www.1.com/';
      opts = {a: 1};
      cb = function () {};
    });

    describe('#del', function () {
      it('should call with correct parameters', function () {
        sinon.spy(http._request, 'del');
        http.del(uri, opts, cb);
        http._request.del.getCall(0).args[0].should.equal(uri);
        http._request.del.getCall(0).args[1].should.equal(opts);
        http._request.del.getCall(0).args[2].should.be.a('function');
      });
    });

    describe('#get', function () {
      it('should call with correct parameters', function () {
        sinon.spy(http._request, 'get');
        http.get(uri, opts, cb);
        http._request.get.getCall(0).args[0].should.equal(uri);
        http._request.get.getCall(0).args[1].should.equal(opts);
        http._request.get.getCall(0).args[2].should.be.a('function');
      });
    });

    describe('#head', function () {
      it('should call with correct parameters', function () {
        sinon.spy(http._request, 'head');
        http.head(uri, opts, cb);
        http._request.head.getCall(0).args[0].should.equal(uri);
        http._request.head.getCall(0).args[1].should.equal(opts);
        http._request.head.getCall(0).args[2].should.be.a('function');
      });
    });

    describe('#patch', function () {
      it('should call with correct parameters', function () {
        sinon.spy(http._request, 'patch');
        http.patch(uri, opts, cb);
        http._request.patch.getCall(0).args[0].should.equal(uri);
        http._request.patch.getCall(0).args[1].should.equal(opts);
        http._request.patch.getCall(0).args[2].should.be.a('function');
      });
    });

    describe('#post', function () {
      it('should call with correct parameters', function () {
        sinon.spy(http._request, 'post');
        http.post(uri, opts, cb);
        http._request.post.getCall(0).args[0].should.equal(uri);
        http._request.post.getCall(0).args[1].should.equal(opts);
        http._request.post.getCall(0).args[2].should.be.a('function');
      });
    });

    describe('#put', function () {
      it('should call with correct parameters', function () {
        sinon.spy(http._request, 'put');
        http.put(uri, opts, cb);
        http._request.put.getCall(0).args[0].should.equal(uri);
        http._request.put.getCall(0).args[1].should.equal(opts);
        http._request.put.getCall(0).args[2].should.be.a('function');
      });
    });

    describe('request interception', function () {
      it('should save request data in the log', function (done) {
        var jar, newHttp;

        jar = request.jar();
        newHttp = new Http(jar);

        newHttp.get('http://www.1.com/', function () {
          newHttp.getLog()[0].cookies.should.eql('a=1');

          newHttp.get('http://www.2.com/', function () {
            newHttp.getLog()[0].cookies.should.eql('a=1');
            newHttp.getLog()[1].cookies.should.eql('b=2');

            done();
          });
        });
      });
    });
  });
});
