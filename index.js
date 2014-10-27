/**
* @author Rafael Vidaurre
*/
var _ = require('lodash');
var utils = require('./utils');
var Scraper = require('./scraper');
var Job = require('./job');

(function () {
  'use strict';

  function Yakuza () {
    var _this = this;

    _this._lastJobId = 0;
    _this._scrapers = {};
    _this._jobs = {};

    // Creates a new scraper instance
    _this._createScraper = function (scraperName) {
      _scrapers[scraperName] = new Scraper();
      return _scrapers[scraperName];
    };

    // Returns a scraper instance, if it doesn't exist, it creates it
    _this.scraper = function (scraperName) {
      var thisScraper, scraperExists;

      scraperExists = utils.hasKey(_scrapers, scraperName);
      thisScraper = scraperExists ? _scrapers[scraperName] : _createScraper(scraperName);

      return thisScraper;
    };

    _this.job = function (scraperName, agentName) {
      var newId;

      newId = _this._lastJobId + 1;
      _this._lastJobId = newId;
      return new Job(newId, scraperName, agentName);
    };
  }

  module.exports = new Yakuza();

}());
