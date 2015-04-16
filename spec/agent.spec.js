'use strict';

var YakuzaBase, TaskDefinition, sinonChai, yakuza, chai, nock;

require('sinon');
YakuzaBase = require('../yakuza-base');
TaskDefinition = require('../task-definition');
nock = require('nock');
chai = require('chai');
sinonChai = require('sinon-chai');
chai.should();
chai.use(sinonChai);
nock.disableNetConnect();

beforeEach(function () {
  yakuza = new YakuzaBase();

  yakuza.scraper('Scraper');
  yakuza.agent('Scraper', 'Agent');
});

describe('Agent', function () {
  describe('#plan', function () {
    it('should set the execution plan', function () {
      var agent;

      agent = yakuza.agent('Scraper', 'Agent');

      agent.plan([
        'Task1'
      ]);

      agent.__config.plan.should.eql(['Task1']);
    });

    it('should throw if argument is not an array', function () {
      var error;

      error = 'Agent plan must be an array of task ids';

      (function () {
        yakuza.agent('Scraper', 'Agent').plan(123);
      }).should.throw(error);

      (function () {
        yakuza.agent('Scraper', 'Agent').plan({foo: 'bar'});
      }).should.throw(error);

      (function () {
        yakuza.agent('Scraper', 'Agent').plan('foo');
      }).should.throw(error);
    });

    it('should provide chaining', function () {
      var agent;

      agent = yakuza.agent('Scraper', 'Agent');

      agent.plan(['Test']).should.eql(agent);
    });
  });

  describe('#task', function () {
    it('should return a task definition', function () {
      yakuza.agent('Scraper', 'Agent').task('FooTask').should.be.instanceOf(TaskDefinition);
    });
  });

  describe('#routine', function () {
    var agent;

    beforeEach(function () {
      agent = yakuza.agent('Scraper', 'Agent');
    });

    it('should create an agent-level routine', function () {
      agent.plan(['Task1', 'Task2']);
      agent.routine('OnlyOne', ['Task1']);
      yakuza.job('Scraper', 'Agent').routine('OnlyOne');
    });

    it('should throw if taskIds is not an array', function () {
      var error;

      error = 'An array of task Ids must be passed to the routine method';

      (function () {
        agent.routine('SomeRoutine', 123);
      }).should.throw(error);
      (function () {
        agent.routine('SomeRoutine', 'foo');
      }).should.throw(error);
    });

    it('should throw if routineName is not a string', function () {
      var error;

      error = 'Routine name must be a string';

      (function () {
        agent.routine(123, ['Task1', 'Task2']);
      }).should.throw(error);
      (function () {
        agent.routine(['foo'], ['Task1', 'Task2']);
      }).should.throw(error);
    });
  });

  describe('running', function () {
    it('should throw if enqueuing without plan', function () {
      var newJob, error;

      error = 'Agent Agent has no execution plan, use the agent\'s plan method' +
        ' to define it';
      newJob = yakuza.job('Scraper', 'Agent');

      (function () {
        newJob.enqueue('Task1');
      }).should.throw(error);
    });
  });

});
