var Scraper = require('../scraper');
var Agent = require('../agent');
var _ = require('underscore');

describe('Scraper', function () {
  var scr;
  beforeEach(function () {
    scr = new Scraper();
  });

  describe('#Scraper', function () {

    it('should start with _configCallbacks empty', function () {
      expect(scr._configCallbacks.length).toEqual(0);
    });

    it('should start with _agents as empty object', function () {
      expect(_.keys(scr._agents).length).toEqual(0);
    });

    it('should start with _applied false', function () {
      expect(scr._applied).toBe(false);
    });
  });

  describe('#config', function () {
    it('should throw exception if argument ins\'t a function', function () {
      var errorMsg = "Config argument must be a function";
      expect(function () {scr.config();}).toThrow(new Error(errorMsg));
      expect(function () {scr.config({});}).toThrow(new Error(errorMsg));
    });

    it('shouldn\'t throw exception if argument is a function', function () {
      scr.config(function () {});
    });

    it('should push config functions to _configCallbacks', function () {
      var func1 = function () {return 1;};
      var func2 = function () {return 2;};
      scr.config(func1);
      expect(scr._configCallbacks[0]()).toEqual(1);
      scr.config(func2);
      expect(scr._configCallbacks[0]()).toEqual(1);
      expect(scr._configCallbacks[1]()).toEqual(2);
      expect(scr._configCallbacks.length).toEqual(2);
    });
  });

  describe('#agent', function () {
    it('should throw exception if non-string is received', function () {
      var errMsg = 'Agent id must be a non-empty string';
      expect(function () {scr.agent(123);}).toThrow(new Error(errMsg));
      expect(function () {scr.agent({});}).toThrow(new Error(errMsg));
      expect(function () {scr.agent("");}).toThrow(new Error(errMsg));
      expect(function () {scr.agent();}).toThrow(new Error(errMsg));
    });

    it('should create a new agent if none exist with a specific id', function () {
      scr.agent("foo");
      keys = _.keys(scr._agents);
      expect(_.contains(keys, "foo")).toBe(true);
      scr.agent("bar");
      keys = _.keys(scr._agents);

      expect(_.contains(keys, "foo")).toBe(true);
      expect(_.contains(keys, "bar")).toBe(true);
    });

    it('should not create a new agent if with a specific id exists', function () {
      scr.agent("123");
      var keys = _.keys(scr._agents);
      expect(keys.length).toBe(1);
      scr.agent("123");
      keys = _.keys(scr._agents);
      expect(keys.length).toBe(1);
    });
  });

  describe('#_createAgent', function () {
    it('should return the newly created agent', function () {
      var result = scr.agent('asd');
      expect(result instanceof Agent).toBe(true);
    });
  });

  describe('#_applySetup', function () {
    it('should set _applied property to true', function () {
      spyOn(scr, '_applyConfigCallbacks');
      scr._applySetup();
      expect(scr._applied).toBe(true);
    });
  });
});
