'use strict';

var YakuzaBase = require('../yakuza-base');
var Scraper = require('../scraper');
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
  });
});
