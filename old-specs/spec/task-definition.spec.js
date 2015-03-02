'use strict';

var _ = require('lodash');
var TaskDefinition = require('../task-definition');
var Task = require('../task');

describe('TaskDefinition', function () {
  var taskDefinition;
  var mainMethod = function () {

  };

  beforeEach(function () {
    taskDefinition = new TaskDefinition();
  });

  describe('#TaskDefinition', function () {
    it('should start with null _main method', function () {
      expect(taskDefinition._main).toBe(null);
    });

    it('should start with empty _hooks object', function () {
      expect(_.keys(taskDefinition._hooks).length).toEqual(0);
    });

    it('should start with default _builder method', function () {
      expect(taskDefinition._builder()).toEqual({});
    });
  });

  describe('#main', function () {
    it('should throw error if argument isn\'t a function', function () {
      var errorMsg = 'Main method must be a function';
      expect(function () {taskDefinition.main({});}).toThrow(new Error(errorMsg));
      expect(function () {taskDefinition.main(123);}).toThrow(new Error(errorMsg));
      expect(function () {taskDefinition.main('dawd');}).toThrow(new Error(errorMsg));
    });

    it('should not throw error if argument is a function', function () {
      taskDefinition.main(function () {});
    });

    it('should set the argument as main function', function () {
      var fooCallback = function () {return 1;};
      var barCallback = function () {return 2;};
      expect(taskDefinition._main).toBe(null);
      taskDefinition.main(fooCallback);
      expect(taskDefinition._main).toBe(fooCallback);
      taskDefinition.main(barCallback);
      expect(taskDefinition._main).toBe(barCallback);
    });
  });

  describe('#builder', function () {
    it('should throw error if argument is\'t a function', function () {
      var errMsg = 'Builder must be a function';
      expect(function () {taskDefinition.builder(123);}).toThrow(new Error(errMsg));
      expect(function () {taskDefinition.builder([]);}).toThrow(new Error(errMsg));
      expect(function () {taskDefinition.builder('');}).toThrow(new Error(errMsg));
    });

    it('should not throw error if argument is a function', function () {
      taskDefinition.builder(function () {return 1;});
    });

    it('should replace default builder function', function () {
      var defaultFunc = taskDefinition._builder;
      var otherFunc = function () {return 2;};
      taskDefinition.builder(otherFunc);
      expect(taskDefinition._builder).not.toBe(defaultFunc);
      expect(taskDefinition._builder).toBe(otherFunc);
    });
  });

  describe('#_build', function () {
    it('should throw an error if the taskDefinition has no main method yet', function () {
      var errMsg = 'Cannot build task with no main method set';
      expect(function () {taskDefinition._build();}).toThrow(new Error(errMsg));
    });

    it('should return an array of built tasks depending on the builder\'s output', function () {
      taskDefinition.main(mainMethod);
      taskDefinition.builder(function () {return [{},{},{}];});
      var builtTasks = taskDefinition._build();
      expect(builtTasks.length).toBe(3);
    });

    it('should add parameters to each Task instance based on builders output', function () {
      taskDefinition.main(mainMethod);
      taskDefinition.builder(function () {return [{a: 1},{b:2},{c:3}];});
      var builtTasks = taskDefinition._build();
      expect(builtTasks[0]._params.a).toBe(1);
      expect(builtTasks[1]._params.b).toBe(2);
      expect(builtTasks[2]._params.c).toBe(3);
    });

    it('should return an array of instances of Task class', function () {
      taskDefinition.main(mainMethod);
      var builtTasks = taskDefinition._build();
      expect(builtTasks.length).toBe(1);
      expect(builtTasks[0] instanceof Task).toBe(true);
    });
  });

  describe('#_applySetup', function () {
    it('should set _applied to true', function () {
      spyOn(taskDefinition, '_applyConfigCallbacks');
      taskDefinition._applySetup();
      expect(taskDefinition._applied).toBe(true);

    });
  });
});
