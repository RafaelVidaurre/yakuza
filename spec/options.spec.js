'use strict';

var Options = require('../options');

describe('Options', function () {
  var opts;

  beforeEach(function () {
    opts = new Options();
  });

  describe('#Options', function () {
    it('should set default options', function () {
      opts = new Options({foo: 'bar'});
      expect(opts.options()).toEqual({foo: 'bar'});
    });

    it('should throw exception if not an object', function () {
      expect(function () {
        new Options({foo: 'bar'});
      }).not.toThrow();
      expect(function () {
        new Options('awd');
      }).toThrow('Default options must be an object');
      expect(function () {
        new Options(123);
      }).toThrow('Default options must be an object');
    });
  });

  describe('#options', function () {
    it('should extend current options if object is given', function () {
      opts.options({a: 1, b: 2});
      expect(opts.options()).toEqual({a: 1, b: 2});
    });

    it('should return current options if no argument is passed', function () {
      opts._currentOptions = {a: 1};
      expect(opts.options()).toEqual({a: 1});
    });
  });

  describe('#defaults', function () {
    it('should set new default options', function () {
      opts = new Options({asd: 'foo'});
      expect(opts.options()).toEqual({asd: 'foo'});
    });

    it('should throw an exception if not an object', function () {
      expect(function () {
        new Options(123);
      }).toThrow('Default options must be an object');
      expect(function () {
        new Options('asd');
      }).toThrow('Default options must be an object');
    });

    it('should return current default options if no argument is passed', function () {
      opts.default({my: 'defaults'});
      expect(opts.default()).toEqual({my: 'defaults'});
    });
  });

  describe('#default', function () {
    it('should be an alias for #defaults', function () {
      expect(opts.default).toBe(opts.defaults);
    });
  });

  describe('#extend', function () {
    it('should extend current options with given options object', function () {
      opts.options({
        thisWasReplaced: false,
        thisIsOld: true
      });
      opts.extend({
        thisWasReplaced: true,
        thisIsNew: true
      });
      expect(opts.options()).toEqual({
        thisWasReplaced: true,
        thisIsOld: true,
        thisIsNew: true
      });
    });
  });

  describe('#set', function () {
    it('should set a new value for a given key', function () {
      opts.set('foo', 'bar');
      expect(opts.options().foo).toBe('bar');
      opts.set('foo', 'nopes');
      expect(opts.options().foo).toBe('nopes');
      opts.set('two', 2);
      expect(opts.options()).toEqual({
        foo: 'nopes',
        two: 2
      });
    });
  });

  describe('#reset', function () {
    it('should reset current options to defaults', function () {
      opts.defaults({defaults: true});
      opts.options({
        foo: 'bar',
        defaults: false
      });
      opts.reset();
      expect(opts.options()).toEqual({
        defaults: true
      });
    });
  });
});
