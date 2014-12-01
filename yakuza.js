/**
* @module Yakuza
* @author Rafael Vidaurre
* @requires Utils
* @requires Scraper
* @requires Job
*/

'use strict';

var shortId = require('shortid');
var utils = require('./utils');
var Scraper = require('./scraper');
var Job = require('./job');

/**
* Main singleton class used to define scrapers and their properties
* @class
*/
function Yakuza () {
  /**
  * Set of scraper instances
  * @private
  */
  this._scrapers = {};

  /**
  * Set of job instances
  * @private
  */
  this._jobs = {};
}

/**
* Creates a new scraper instance
* @param {string} scraperId name to be asigned to the created scraper
* @return {Scraper} scraper created
* @private
*/
Yakuza.prototype._createScraper = function (scraperId) {
  this._scrapers[scraperId] = new Scraper();
  return this._scrapers[scraperId];
};

/**
* Returns a scraper instance, if it doesn't exist, it creates it
* @param {string} scraperId name for the new scraper or by which to look for if it exists
* @return {Scraper} scraper instance
*/
Yakuza.prototype.scraper = function (scraperId) {
  var thisScraper, scraperExists;

  scraperExists = utils.hasKey(this._scrapers, scraperId);
  thisScraper = scraperExists ? this._scrapers[scraperId] : this._createScraper(scraperId);

  return thisScraper;
};

/**
* Instances a new job
* @param {string} scraperId name of the scraper that will be used by the Job
* @param {string} agentId name of the agent that will be used by the Job
* @return {Job} Job instance that has been created
*/
Yakuza.prototype.job = function (scraperId, agentId) {
  var newId, scraper, agent, newJob;

  scraper = this._scrapers[scraperId];
  agent = scraper._agents[agentId];
  newId = shortId.generate();
  newJob = new Job(newId, scraper, agent);
  this._jobs[newId] = newJob;

  return newJob;
};

module.exports = new Yakuza();
