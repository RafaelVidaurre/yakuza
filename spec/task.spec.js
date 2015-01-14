'use strict';

var Task = require('../task');
var Q = require('q');
var Http = require('../http');
var request = require('request');

describe('Task', function () {
  var task;

  beforeEach(function () {
    task = new Task(function () {
      return 0;
    }, {a: 1, b: 2});
    task._config = {
      hooks: {}
    };
  });

  describe('#Task', function () {
    it('should initialize with 0 retries', function () {
      expect(task._retries).toBe(0);
    });

    it('should initialize with a deferred object', function () {
      expect(JSON.stringify(task._runningDeferred)).toEqual(JSON.stringify(Q.defer()));
    });

    it('should set main method if passed', function () {
      var mainMethod = function () {return 1;};
      var newTask = new Task('task1', mainMethod);
      expect(newTask._main).toBe(mainMethod);
    });

    it('should initialize with an http instance and no new cookies', function () {
      expect(task._http instanceof Http).toBe(true);
    });

    it('should initialize its http instance with cookies if provided', function () {
      var jar = request.jar();
      jar.setCookie('foo=bar', 'http://www.fake.com');
      var newTask = new Task('task1', function () {}, {a: 1}, jar);
      expect(newTask._http._cookieJar).toEqual(jar);
    });
  });

  describe('#_run', function () {
    it('should pass task params as second argument to main method', function () {
      var dummyFunction = function () {};
      spyOn(task, '_main');
      task._run(dummyFunction, dummyFunction, dummyFunction);
      expect(task._main).toHaveBeenCalledWith(jasmine.any(Object), jasmine.any(Object),
        task._params);
    });
  });

  describe('#_onShare', function () {
    it('should set value to the key passed in _sharedStorage', function () {
      task._onShare('foo', 1);
      task._onShare('bar', 'value');
      task._onShare('hello', {a: 1, b: 'test'});
      task._onShare('overwritten', 1);
      task._onShare('overwritten', 2);
      expect(task._sharedStorage.foo).toEqual(1);
      expect(task._sharedStorage.bar).toEqual('value');
      expect(task._sharedStorage.hello).toEqual({a: 1, b: 'test'});
      expect(task._sharedStorage.overwritten).toEqual(2);
    });
  });

  describe('#_onSuccess', function () {
    it('should resolve its running promise', function () {
      spyOn(task._runningDeferred, 'resolve');
      spyOn(task._runningDeferred, 'reject');
      task._onSuccess({});
      expect(task._runningDeferred.resolve).toHaveBeenCalled();
      expect(task._runningDeferred.reject).not.toHaveBeenCalled();
    });
  });

  describe('#_onFail', function () {
    it('it should reject its running promise', function () {
      spyOn(task._runningDeferred, 'resolve');
      spyOn(task._runningDeferred, 'reject');
      task._onFail();
      expect(task._runningDeferred.resolve).not.toHaveBeenCalled();
      expect(task._runningDeferred.reject).toHaveBeenCalled();
    });

    it('it should pass the error and message in the reject response', function () {
      var error = new Error('test error');
      var message = 'test message';
      var response = {error: error, message: message, status: 'fail'};
      spyOn(task._runningDeferred, 'reject');
      task._onFail(error, message);
      expect(task._runningDeferred.reject).toHaveBeenCalledWith(response);
    });
  });
});
