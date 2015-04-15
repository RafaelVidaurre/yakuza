'use strict';

var Agent, YakuzaBase, Scraper, TaskDefinition, Job, _, yakuza, sinonChai, chai, sinon;

sinon = require('sinon');
YakuzaBase = require('../yakuza-base');
Scraper = require('../scraper');
Agent = require('../agent');
TaskDefinition = require('../task-definition');
Job = require('../job');
_ = require('lodash');
sinonChai = require('sinon-chai');
chai = require('chai');
chai.should();
chai.use(sinonChai);

beforeEach(function () {
  yakuza = new YakuzaBase();
});

describe('Yakuza', function () {
  describe('#scraper', function () {
    it('should create a scraper if it doesn\'t exist', function () {
      _.keys(yakuza.__scrapers).length.should.eql(0);
      yakuza.scraper('scraper');
      _.keys(yakuza.__scrapers).length.should.eql(1);
    });

    it('should not create a scraper if it exists', function () {
      yakuza.scraper('scraper');
      _.keys(yakuza.__scrapers).length.should.eql(1);
      yakuza.scraper('scraper');
      _.keys(yakuza.__scrapers).length.should.eql(1);
    });

    it('should return a scraper', function () {
      yakuza.scraper('scraper').should.be.instanceof(Scraper);
    });

    it('should throw if no valid id is passed', function () {
      (function () {
        yakuza.scraper('');
      }).should.throw();
      (function () {
        yakuza.scraper(123);
      }).should.throw();
    });
  });

  describe('#agent', function () {
    it('should call the scraper\'s agent method', function () {
      var scraper = yakuza.scraper('fooScraper');

      sinon.spy(scraper, 'agent');
      yakuza.agent('fooScraper', 'agent');
      scraper.agent.callCount.should.eql(1);
      scraper.agent.getCall(0).args[0].should.eql('agent');
    });

    it('should return an agent', function () {
      yakuza.agent('scraper', 'agent').should.be.instanceof(Agent);
    });

    it('should throw if no valid ids are passed', function () {
      (function () {
        yakuza.agent('scraper', '');
      }).should.throw();
      (function () {
        yakuza.agent('scraper', 123);
      }).should.throw();
      (function () {
        yakuza.agent('scraper');
      }).should.throw();
      (function () {
        yakuza.agent();
      }).should.throw();
    });
  });

  describe('#task', function () {
    it('should call the agent\'s task method', function () {
      var agent = yakuza.agent('fooScraper', 'fooAgent');

      sinon.spy(agent, 'task');
      yakuza.task('fooScraper', 'fooAgent', 'fooTask');
      agent.task.callCount.should.eql(1);
      agent.task.getCall(0).args[0].should.eql('fooTask');
    });

    it('should return a task definition', function () {
      yakuza.task('scraper', 'agent', 'task').should.be.instanceof(TaskDefinition);
    });

    it('should throw if no valid ids are passed', function () {
      (function () {
        yakuza.task('scraper', 'agent', '');
      }).should.throw();
      (function () {
        yakuza.task('scraper', 'agent', 123);
      }).should.throw();
      (function () {
        yakuza.task('scraper', 'agent');
      }).should.throw();
      (function () {
        yakuza.task('scraper');
      }).should.throw();
      (function () {
        yakuza.task();
      }).should.throw();
    });
  });

  describe('#job', function () {
    it('should throw with invalid arguments', function () {
      (function () {
        yakuza.job('scraper', 'agent', 123);
      }).should.throw();
      (function () {
        yakuza.job('scraper');
      }).should.throw();
      (function () {
        yakuza.job('scraper', 123, {a: 'foo'});
      }).should.throw();
      (function () {
        yakuza.job();
      }).should.throw();
    });

    it('should return a job', function () {
      yakuza.scraper('scraper').agent('agent');
      yakuza.job('scraper', 'agent').should.be.instanceof(Job);
    });

    it('should throw if scraper doesn\'t exist', function () {
      (function () {
        yakuza.job('scraper', 'agent');
      }).should.throw();
    });

    it('should throw if agent doesn\'t exist', function () {
      (function () {
        yakuza.scraper('scraper');
        yakuza.job('scraper', 'agent');
      }).should.throw();
    });

    it('should not throw if scraper and agent exist', function () {
      yakuza.scraper('scraper').agent('agent');

      (function () {
        yakuza.job('scraper', 'agent');
      }).should.not.throw();
    });
  });

  describe('#ready', function () {
    it('should apply ALL agents', function () {
      var scraper, agent;

      scraper = yakuza.scraper('scraper');
      agent = scraper.agent('agent');
      sinon.stub(agent, '_applySetup');

      yakuza.ready();

      agent._applySetup.callCount.should.eql(1);
    });
  });
});
