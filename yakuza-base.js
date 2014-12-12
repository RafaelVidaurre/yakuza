/**
* @module YakuzaBase
* @author Rafael Vidaurre
* @requires Utils
* @requires Scraper
* @requires Job
*/

'use strict';

var shortId = require('shortid');
var utils = require('./utils');
var _ = require('lodash');
var Scraper = require('./scraper');
var Job = require('./job');

/**
* Main singleton class used to define scrapers and their properties
* @class
*/
function YakuzaBase () {
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
YakuzaBase.prototype._createScraper = function (scraperId) {
  this._scrapers[scraperId] = new Scraper();
  return this._scrapers[scraperId];
};

/**
* Returns a scraper instance, if it doesn't exist, it creates it
* @param {string} scraperId name for the new scraper or by which to look for if it exists
* @return {Scraper} scraper instance
*/
YakuzaBase.prototype.scraper = function (scraperId) {
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
YakuzaBase.prototype.job = function (scraperId, agentId, params) {
  var newId, scraper, agent, newJob;

  scraper = this._scrapers[scraperId];
  agent = scraper._agents[agentId];
  newId = shortId.generate();
  newJob = new Job(newId, scraper, agent, params);
  this._jobs[newId] = newJob;

  return newJob;
};

/**
* Applies all configurations for all scrapers and agents, Yakuza can eager-load (via this
* method) or lazy-load (by running a job).
*/
YakuzaBase.prototype.ready = function () {
  _.each(this._scrapers, function (scraper) {
    scraper._applySetup();
    _.each(scraper._agents, function (agent) {
      agent._applySetup();
    });
  });
};

module.exports = YakuzaBase;
