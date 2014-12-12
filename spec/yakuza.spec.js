'use strict';

var YakuzaBase = require('../yakuza-base');
var Scraper = require('../scraper');
var Job = require('../job');
var _ = require('lodash');

describe('Yakuza', function () {
  var Yakuza;

  beforeEach(function () {
    Yakuza = new YakuzaBase();
  });

  describe('#Yakuza', function () {
    it('should start with cero scrapers', function () {
      expect(_.keys(Yakuza._scrapers).length).toBe(0);
    });
  });

  describe('#scraper', function () {
    it('should return a new scraper', function () {
      var scr = Yakuza.scraper('test');
      expect(scr instanceof Scraper).toBe(true);
    });

    it('should save the new scrapers with their respective id as key', function () {
      expect(Yakuza._scrapers.test).toBe(undefined);
      var scr = Yakuza.scraper('test');
      expect(Yakuza._scrapers.test).toBe(scr);
    });

    it('should return an existing scraper if the key passed matches a previously created one',
      function () {
      var scr = Yakuza.scraper('foo');
      var scr2 = Yakuza.scraper('foo');
      var scr3 = Yakuza.scraper('bar');

      expect(scr).toBe(scr2);
      expect(scr).not.toBe(scr3);
    });
  });

  describe('#job', function () {
    var job;

    beforeEach(function () {
      Yakuza.scraper('foo');
      Yakuza.scraper('foo').agent('bar');
      job = Yakuza.job('foo', 'bar');
    });

    it('should return a job instance', function () {
      expect(job instanceof Job).toBe(true);
    });

    it('should give each job a uid', function () {
      expect(job.uid).toBeTruthy();
    });

    it('should save each new job in a _jobs object with the uid as key', function () {
      expect(Yakuza._jobs[job.uid]).toBe(job);
    });
  });
});
