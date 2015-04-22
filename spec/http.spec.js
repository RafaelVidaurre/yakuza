'use strict';


var Http, OptionsTemplate, Q, chai, nock, sinonChai, chaiAsPromised;

require('sinon');
Http = require('../http');
OptionsTemplate = require('../options-template');
Q = require('q');
sinonChai = require('sinon-chai');
chaiAsPromised = require('chai-as-promised');
nock = require('nock');
chai = require('chai');

chai.should();
chai.use(sinonChai);
chai.use(chaiAsPromised);
nock.disableNetConnect();

describe('Http', function () {
  var body1, body2, headers1, headers2, headers3, headersS1, http;

  beforeEach(function () {
    http = new Http();
  });

  beforeEach(function () {
    body1 = 'Body1';
    headers1 = {
      'Set-Cookie': 'a=1;',
      'content-type': 'text/html'
    };
    body2 = 'Body2';
    headers2 = {
      'Set-Cookie': 'b=2',
      'content-type': 'text/html'
    };
    headersS1 = {
      'Set-Cookie': 'c=3',
      'content-type': 'text/html'
    };
    headers3 = {
      'Set-Cookie': ['bar=2', 'foo=1;']
    };

    nock('http://www.1.com')
      .delete('/').reply(200, body1, headers1)
      .get('/').reply(200, body1, headers1)
      .get('/?foo=bar').reply(200, body1, headers1)
      .get('/?foo=one').reply(200, body1, headers1)
      .get('/?foo=two').reply(200, body1, headers1)
      .head('/').reply(200)
      .patch('/').reply(200, body1, headers1)
      .post('/').reply(200, body1, headers1)
      .put('/').reply(200, body1, headers1);

    nock('http://www.2.com')
      .get('/').reply(200, body2, headers2);

    nock('http://www.no-cookies.com')
      .get('/').reply(200, 'Body');

    nock('https://www.s1.com')
      .get('/').reply(200, 'BodyS1', headersS1);
    nock('https://www.two-cookies.com')
      .get('/').reply(200, 'body', headers3);
  });

  describe('#Http', function () {
    it('should set default cookies if provided', function () {
      var jar, newHttp;

      jar = {
        a: 1
      };

      newHttp = new Http(jar);

      newHttp._cookieJar.should.be.eql(jar);
    });

    it('should set a new cookie jar if no cookies are provided', function () {
      http._cookieJar.should.be.eql({});
    });

    it('should start with an empty log', function () {
      http._log.should.be.eql([]);
    });
  });

  describe('request interception', function () {
    it('should save request data in the log', function (done) {
      var newHttp, log;

      newHttp = new Http({});
      newHttp.get({url: 'http://www.1.com/', cookies: {test: 1}, data: {foo: 'bar'}},
        function (_err, res, body) {
        log = newHttp.getLog();
        log[0].request.cookies.should.contain('test=1');
        log[0].request.url.should.eql('http://www.1.com/');
        log[0].request.headers.should.eql(res.req._headers);
        log[0].request.data.should.eql({foo: 'bar'});
        log[0].response.cookies.should.contain('a=1');
        log[0].response.headers.should.eql(res.headers);
        log[0].response.statusCode.should.eql(res.statusCode);
        log[0].response.body.should.eql(body);

        newHttp.get('http://www.2.com/', function (_err2, res2, bodyb) {
          log = newHttp.getLog();
          log[1].request.cookies.should.contain('test=1');
          log[1].request.cookies.should.contain('a=1');
          log[1].request.url.should.eql('http://www.2.com/');
          log[1].request.headers.should.eql(res2.req._headers);
          log[1].response.cookies.should.contain('b=2');
          log[1].response.headers.should.eql(res2.headers);
          log[1].response.statusCode.should.eql(res2.statusCode);
          log[1].response.body.should.eql(bodyb);

          newHttp.get({url: 'https://www.s1.com/', cookies: {test: 2}}, function (_err3, res3, body3) {
            log = newHttp.getLog();
            log[2].request.cookies.should.contain('test=2', 'a=1', 'b=2');
            log[2].request.url.should.eql('https://www.s1.com/');
            log[2].request.headers.should.eql(res3.req._headers);
            log[2].response.cookies.should.contain('c=3');
            log[2].response.headers.should.eql(res3.headers);
            log[2].response.statusCode.should.eql(res3.statusCode);
            log[2].response.body.should.eql(body3);
            done();
          });
        });
      });
    });

    it('should not mix parallel requests', function (done) {
      var newHttp, getOne, getTwo;

      newHttp = new Http();
      getOne = newHttp.get({url: 'http://www.1.com/', data: {foo: 'one'}});
      getTwo = newHttp.get({url: 'http://www.1.com/', data: {foo: 'two'}});

      Q.all([getOne, getTwo]).then(function () {
        var log;
        log = newHttp.getLog();
        log[0].request.data.should.eql({foo: 'one'});
        log[1].request.data.should.eql({foo: 'two'});
        done();
      }).done();
    });

    it('should save cookies from requests in jar', function (done) {
      var newHttp;

      newHttp = new Http({});
      newHttp.get('http://www.1.com/', function () {
        newHttp.get('http://www.2.com', function () {
          newHttp.getLog()[1].request.cookies.should.contain('a=1');
          done();
        });
      });
    });

    it('should save cookies form response', function (done) {
      var newHttp;

      newHttp = new Http({});
      newHttp.get('https://www.two-cookies.com', function () {
        newHttp.getLog()[0].response.cookies.should.eql('bar=2; foo=1;');
        done();
      });
    });
  });

  describe('#getCookieJar', function () {
    it('should return the current cookie jar', function (done) {
      http.get('http://www.1.com', function () {
        http.getCookieJar().should.eql({a: '1'});
        done();
      });
    });

    it('should clone the object', function (done) {
      var clonedJar;

      http.get('http://www.1.com', function () {
        clonedJar = http.getCookieJar();
        clonedJar.b = '2';
        http.getCookieJar().should.not.have.property('b');
        done();
      });
    });
  });

  describe('request delegators', function () {
    var requestMock;

    describe('#get', function () {
      it('should make the call', function (done) {
        requestMock = nock('http://www.mock.com').get('/').times(1).reply(200);
        http.get('http://www.mock.com/', function () {
          requestMock.done();
          done();
        });
      });

      it('should resolve the promise with res and body if request is successful', function (done) {
        requestMock = nock('http://www.promise.com').get('/').times(1).reply(200, 'works!', {
          'content-type': 'text/html'
        });
        http.get('http://www.promise.com/').then(function (response) {
          response.should.have.property('res');
          response.should.have.property('body');
          response.body.should.eql('works!');
          done();
        }).done();
      });

      it('should reject the promise with an error if request was unsuccessful', function (done) {
        requestMock = nock('http://www.errorpromise.com').get('/').times(1).reply(500);
        http.get('http://www.promise.com/').fail(function (error) {
          error.should.be.instanceof(Error);
          done();
        }).done();
      });

      it('should throw if url is not passed', function () {
        (function () {
          http.get({}, function () {});
        }).should.throw();
      });

      it('should not set cookie header if cookies are empty', function (done) {
        var newHttp;

        newHttp = new Http();

        newHttp.get('http://www.1.com/', function (error, res) {
          res.req._headers.should.not.have.property('cookie');
          done();
        });
      });
    });

    describe('#del', function () {
      it('should make the call', function (done) {
        requestMock = nock('http://www.mock.com').delete('/').times(1).reply(200);
        http.del('http://www.mock.com/', function () {
          requestMock.done();
          done();
        });
      });
    });

    describe('#put', function () {
      it('should make the call', function (done) {
        requestMock = nock('http://www.mock.com').put('/').times(1).reply(200);
        http.put('http://www.mock.com/', function () {
          requestMock.done();
          done();
        });
      });
    });

    describe('#post', function () {
      it('should make the call', function (done) {
        requestMock = nock('http://www.mock.com').post('/').times(1).reply(200);
        http.post('http://www.mock.com/', function () {
          requestMock.done();
          done();
        });
      });
    });

    describe('#patch', function () {
      it('should make the call', function (done) {
        requestMock = nock('http://www.mock.com').patch('/').times(1).reply(200);
        http.patch('http://www.mock.com/', function () {
          requestMock.done();
          done();
        });
      });
    });

    describe('#head', function () {
      it('should make the call', function (done) {
        requestMock = nock('http://www.mock.com').head('/').times(1).reply(200);
        http.head('http://www.mock.com/', function () {
          requestMock.done();
          done();
        });
      });
    });
  });

  describe('#optionsTemplate', function () {
    it('should return an OptionsTemplate instance', function () {
      http.optionsTemplate().should.be.instanceof(OptionsTemplate);
    });

    it('should return a new OptionsTemplate instance each time it is called', function () {
      var template1, template2;

      template1 = http.optionsTemplate();
      template2 = http.optionsTemplate();

      template1.should.not.equal(template2);
    });
  });
});
