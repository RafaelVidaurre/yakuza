'use strict';

var YakuzaBase, Agent, sinonChai, yakuza, chai;

require('sinon');
YakuzaBase = require('../yakuza-base');
Agent = require('../agent');
chai = require('chai');
sinonChai = require('sinon-chai');
chai.should();
chai.use(sinonChai);

beforeEach(function () {
  yakuza = new YakuzaBase();
  yakuza.scraper('Scraper');
  yakuza.agent('Scraper', 'Agent').plan([
    'Task1'
  ]);
  yakuza.task('Scraper', 'Agent', 'Task1').main(function (task) {
    task.success();
  });
});

describe('Scraper', function () {
  describe('#agent', function () {
    it('should throw if argument is not a non-empty string', function () {
      var error;

      error = 'Agent id must be a non-empty string';

      (function () {
        yakuza.scraper('Scraper').agent('');
      }).should.throw(error);
      (function () {
        yakuza.scraper('Scraper').agent(['foo', 'bar']);
      }).should.throw(error);
      (function () {
        yakuza.scraper('Scraper').agent(1234);
      }).should.throw(error);
    });

    it('should return an agent', function () {
      yakuza.scraper('Scraper').agent('Agent').should.be.instanceOf(Agent);
    });
  });

  describe('#routine', function () {
    it('should throw if routineName is not a string', function () {
      var error;

      error = 'Routine name must be a string';

      (function () {
        yakuza.scraper('Scraper').routine(123, ['SomeTask']);
      }).should.throw(error);
      (function () {
        yakuza.scraper('Scraper').routine(['Foo'], ['SomeTask']);
      }).should.throw(error);
    });

    it('should throw if taskIds is not an array', function () {
      var error;

      error = 'An array of task Ids must be passed to the routine method';

      (function () {
        yakuza.scraper('Scraper').routine('SomeRoutine', 123);
      }).should.throw(error);
      (function () {
        yakuza.scraper('Scraper').routine('SomeRoutine', 'SomeTask');
      }).should.throw(error);
    });
  });

  describe('#addShareMethod', function () {
    it('should throw if methodName is not a string', function () {
      var error;

      error = 'Share method name must be a string';

      (function () {
        yakuza.scraper('Scraper').addShareMethod(123);
      }).should.throw(error);
      (function () {
        yakuza.scraper('Scraper').addShareMethod([1, 2, 3]);
      }).should.throw(error);
    });

    it('should throw if shareFunction is not a function', function () {
      var error;

      error = 'Share method must be a function';

      (function () {
        yakuza.scraper('Scraper').addShareMethod('SomeShareMethod', [123]);
      }).should.throw(error);
      (function () {
        yakuza.scraper('Scraper').addShareMethod('SomeShareMethod', {foo: 'bar'});
      }).should.throw(error);
    });

    it('should define a new share method', function (done) {
      var newJob;

      yakuza.scraper('Scraper').addShareMethod('concat', function (current, thisValue) {
        var newValue;

        newValue = current || '';
        newValue += thisValue;

        return newValue;
      });

      yakuza.agent('Scraper', 'OtherAgent').plan([
        'ConcatTask',
        'FinalTask'
      ]);

      yakuza.task('Scraper', 'OtherAgent', 'ConcatTask').builder(function () {
        return ['this', ' is', ' con', 'catenated'];
      }).main(function (task, http, params) {
        task.share('toConcat', params, {method: 'concat'});

        task.success();
      });

      yakuza.task('Scraper', 'OtherAgent', 'FinalTask').builder(function (job) {
        return job.shared('ConcatTask.toConcat');
      }).main(function (task, http, params) {
        params.should.contain('this');
        params.should.contain('is');
        params.should.contain('con');
        params.should.contain('catenated');
        task.success();
        done();
      });

      newJob = yakuza.job('Scraper', 'OtherAgent');
      newJob.enqueue('ConcatTask').enqueue('FinalTask');

      newJob.run();
    });
  });
});
