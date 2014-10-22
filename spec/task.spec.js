var _ = require('underscore');
var Task = require('../task');

describe('Task', function () {
  var task;
  beforeEach(function () {
    task = new Task();
  });

  describe('#Task', function () {
    it('should start with null _main method', function () {
      expect(task._main).toBe(null);
    });

    it('should start with empty _hooks object', function () {
      expect(_.keys(task._hooks).length).toEqual(0);
    });

    it('should start with default _builder method', function () {
      expect(task._builder()).toEqual({});
    });
  });

  describe('#main', function () {
    it('should throw error if argument isn\'t a function', function () {
      var errorMsg = 'Main method must be a function';
      expect(function () {task.main({})}).toThrow(new Error(errorMsg));
      expect(function () {task.main(123)}).toThrow(new Error(errorMsg));
      expect(function () {task.main("dawd")}).toThrow(new Error(errorMsg));
    });

    it('should not throw error if argument is a function', function () {
      task.main(function () {});
    });

    it('should set the argument as main function', function () {
      var fooCallback = function () {return 1};
      var barCallback = function () {return 2};
      expect(task._main).toBe(null);
      task.main(fooCallback);
      expect(task._main).toBe(fooCallback);
      task.main(barCallback);
      expect(task._main).toBe(barCallback);
    });
  });

  describe('#hooks', function () {
    it('should throw error if argument isn\'t an object', function () {
      var errMsg = 'Hooks parameter must be an object';
      expect(function () {task.hooks(123)}).toThrow(new Error(errMsg));
      expect(function () {task.hooks("foo")}).toThrow(new Error(errMsg));
      expect(function () {task.hooks([])}).toThrow(new Error(errMsg));
    });

    it('shoudn\'t throw error if argument is a valid object', function () {
      task.hooks({});
    });

    it('should initialize a new hook slot as an array if there\'s none with that key', function () {
      var keys;
      task.hooks({newHook: function () {return 1;}});
      keys = _.keys(task._hooks);
      expect(_.contains(keys, 'newHook')).toBe(true);
      expect(task._hooks['newHook'].length).toBe(1);
    });

    it('should append a new function if hook slot is already initialized', function () {
      task.hooks({newHook: function () {return 1;}});
      keys = _.keys(task._hooks);
      expect(task._hooks['newHook'].length).toBe(1);
      task.hooks({newHook: function () {return 2;}});
      keys = _.keys(task._hooks);
      expect(task._hooks['newHook'].length).toBe(2);
      task.hooks({otherHook: function () {return 2;}});
      keys = _.keys(task._hooks);
      expect(task._hooks['otherHook'].length).toBe(1);
    });
  });

  describe('#builder', function () {
    it('should throw error if argument is\'t a function', function () {
      var errMsg = 'Builder must be a function';
      expect(function () {task.builder(123)}).toThrow(new Error(errMsg));
      expect(function () {task.builder([])}).toThrow(new Error(errMsg));
      expect(function () {task.builder("")}).toThrow(new Error(errMsg));
    });

    it('should not throw error if argument is a function', function () {
      task.builder(function () {return 1;});
    });

    it('should replace default builder function', function () {
      var defaultFunc = task._builder;
      var otherFunc = function () {return 2};
      task.builder(otherFunc);
      expect(task._builder).not.toBe(defaultFunc);
      expect(task._builder).toBe(otherFunc);
    });
  });
});
