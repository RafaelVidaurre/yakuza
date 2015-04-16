/**
* @module YakuzaBase
* @author Rafael Vidaurre
* @requires Utils
* @requires Scraper
* @requires Job
*/

'use strict';

var shortId, utils, _, Scraper, Job;

shortId = require('shortid');
utils = require('./utils');
_ = require('lodash');
Scraper = require('./scraper');
Job = require('./job');

/**
* Main singleton class used to define scrapers and their properties
* @class
*/
function YakuzaBase () {
  /**
  * Set of scraper instances
  * @private
  */
  this.__scrapers = {};
}

/**
* Creates a new scraper instance
* @param {string} scraperId name to be asigned to the created scraper
* @return {Scraper} scraper created
* @private
*/
YakuzaBase.prototype.__createScraper = function (scraperId) {
  this.__scrapers[scraperId] = new Scraper();
  return this.__scrapers[scraperId];
};

/**
* Returns a scraper instance, if it doesn't exist, it creates it
* @param {string} scraperId name for the new scraper or by which to look for if it exists
* @return {Scraper} scraper instance
*/
YakuzaBase.prototype.scraper = function (scraperId) {
  var thisScraper, scraperExists;

  if (!scraperId || !_.isString(scraperId)) {
    throw new Error('Scraper id must be passed');
  }

  scraperExists = utils.hasKey(this.__scrapers, scraperId);
  thisScraper = scraperExists ? this.__scrapers[scraperId] : this.__createScraper(scraperId);

  return thisScraper;
};

/**
* Returns an agent instance, if it doesn't exists, it creates it
* @param {string} scraperId name of the scraper to which the agent belongs to
* @param {string} agentId name of the new agent or by which to look for if it exists
* @return {Agent} agent instance
*/
YakuzaBase.prototype.agent = function (scraperId, agentId) {
  if (!agentId || !_.isString(agentId)) {
    throw new Error('Agent id must be passed');
  }

  return this.scraper(scraperId).agent(agentId);
};

YakuzaBase.prototype.task = function (scraperId, agentId, taskId) {
  if (!taskId || !_.isString(taskId)) {
    throw new Error('Task id must be passed');
  }

  return this.agent(scraperId, agentId).task(taskId);
};

/**
* Instances a new job
* @param {string} scraperId name of the scraper that will be used by the Job
* @param {string} agentId name of the agent that will be used by the Job
* @return {Job} Job instance that has been created
*/
YakuzaBase.prototype.job = function (scraperId, agentId, params) {
  var newId, scraper, agent, newJob;

  if (!scraperId || !_.isString(scraperId)) {
    throw new Error('Scraper id must be passed');
  }

  if (!agentId || !_.isString(agentId)) {
    throw new Error('Agent id must be passed');
  }

  if (params && !_.isObject(params)) {
    throw new Error('Params passed must be an object');
  }

  scraper = this.__scrapers[scraperId];

  if (!scraper) {
    throw new Error('Scraper ' + scraperId + ' doesn\'t exist');
  }

  agent = scraper._agents[agentId];

  if (!agent) {
    throw new Error('Agent ' + agentId + ' doesn\'t exist in scraper ' + scraperId);
  }

  newId = shortId.generate();
  newJob = new Job(newId, scraper, agent, params);

  return newJob;
};

/**
* Applies all configurations for all scrapers and agents, Yakuza can eager-load (via this
* method) or lazy-load (by running a job).
*/
YakuzaBase.prototype.ready = function () {
  _.each(this.__scrapers, function (scraper) {
    _.each(scraper._agents, function (agent) {
      agent._applySetup();
    });
  });
};


module.exports = YakuzaBase;
