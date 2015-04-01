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
  describe('#setup', function () {
    var error;

    error = 'Setup argument must be a function';

    it('should throw if argument is not a function', function () {
      (function () {
        yakuza.agent('Scraper', 'Agent').setup('foo');
      }).should.throw(error);
      (function () {
        yakuza.agent('Scraper', 'Agent').setup(['foo']);
      }).should.throw(error);
      (function () {
        yakuza.agent('Scraper', 'Agent').setup(123);
      }).should.throw(error);
    });

    it('it should add a config callback', function (done) {
      yakuza.agent('Scraper', 'Agent').setup(function (config) {
        config.plan = [
          'Task1'
        ];
        done();
      });

      yakuza.task('Scraper', 'Agent', 'Task1').main(function (task) {
        task.success();
      });

      yakuza.ready();
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
      agent.setup(function (config) {
        config.plan = [
          'Task1',
          'Task2'
        ];
      });
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
      var newJob;

      newJob = yakuza.job('Scraper', 'Agent');

      (function () {
        newJob.enqueue('Task1');
      }).should.throw();
    });
  });

});
