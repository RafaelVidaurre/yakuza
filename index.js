/**
* @author Rafael Vidaurre
*/
var _ = require('lodash');
var utils = require('./utils');
var Scraper = require('./scraper');

function Yakuza () {
  var _scrapers = {};

  // Creates a new scraper instance
  var _createScraper = function (scraperName) {
    _scrapers[scraperName] = new Scraper();
    return _scrapers[scraperName];
  };

  // Returns a scraper instance, if it doesn't exist, it creates it
  this.scarper = function (scraperName) {
    var thisScraper, scraperExists;

    scraperExists = utils.hasKey(_scrapers, scraperName);
    thisScraper = scraperExists ? _scrapers[scraperName] : _createScraper(scraperName);

    return thisScraper;
  };
}
