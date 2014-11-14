'use strict';

var Task = require('../task');
var Q = require('q');

describe('Task', function () {
  var task;

  beforeEach(function () {
    task = new Task(function () {
      return 0;
    }, {a: 1, b: 2});
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
      var newTask = new Task(mainMethod);
      expect(newTask._main).toBe(mainMethod);
    });
  });

  describe('#_run', function () {
    it('should pass param callbacks as an object with keys to main method', function () {
      var emitter = {
        success: task._onSuccess,
        error: task._onError,
        share: task._onShare
      };
      spyOn(task, '_main');
      task._run();
      expect(task._main).toHaveBeenCalledWith(emitter, jasmine.any(Object));
    });

    it('should pass task params as second argument to main method', function () {
      var dummyFunction = function () {};
      spyOn(task, '_main');
      task._run(dummyFunction, dummyFunction, dummyFunction);
      expect(task._main).toHaveBeenCalledWith(jasmine.any(Object), task._params);
    });
  });
});
