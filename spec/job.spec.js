'use strict';

var Job, YakuzaBase, sinon, sinonChai, yakuza, chai;

YakuzaBase = require('../yakuza-base');
Job = require('../job');
sinon = require('sinon');
chai = require('chai');
sinonChai = require('sinon-chai');
chai.should();
chai.use(sinonChai);

beforeEach(function () {
  yakuza = new YakuzaBase();

  yakuza.scraper('Scraper');
  yakuza.agent('Scraper', 'Parallel').setup(function (config) {
    config.plan = [
      'Task1',
      ['Task2', 'Task3'],
      'Task4'
    ];
  });

  yakuza.task('Scraper', 'Parallel', 'Task1').main(function (task) {
    task.success(1);
  });
  yakuza.task('Scraper', 'Parallel', 'Task2').main(function (task) {
    task.success(2);
  });
  yakuza.task('Scraper', 'Parallel', 'Task3').main(function (task) {
    task.success(3);
  });
  yakuza.task('Scraper', 'Parallel', 'Task4').main(function (task) {
    task.success(4);
  });
});

describe('Job', function () {
  var job;

  beforeEach(function () {
    job = yakuza.job('Scraper', 'Parallel');
    job.enqueue('Task1');
  });

  describe('#Job', function () {
    it('should set the given uid', function () {
      var newJob;

      newJob = new Job('foo');
      newJob.uid.should.eql('foo');
    });

    it('should throw if params are invalid', function () {
      var newJob;

      (function () {
        newJob = new Job(123);
      }).should.throw();
    });
  });

  describe('#_setShared', function () {
    it('should set a value belonging to a specific task', function () {
      job._setShared('Task1', 'foo', 'bar');
      job._getShared('Task1', 'foo').should.eql('bar');
    });
  });

  describe('#_getShared', function () {
    it('should return a value belonging to a specific task', function () {
      job._setShared('Task2', 'some', 'value');
      job._getShared('Task2', 'some').should.eql('value');
    });

    it('should return undefined if value does not exist', function () {
      var isUndef;

      isUndef = job._getShared('Task2', 'notSaved') === undefined;
      isUndef.should.eql(true);
    });
  });

  describe('#_getParams', function () {
    it('should return job params', function () {
      job.params({a: 'b'});
      job._getParams().should.eql({a: 'b'});
    });
  });

  describe('#enqueueTaskArray', function () {
    it('should call enqueue for all task ids in array', function () {
      sinon.stub(job, 'enqueue');
      job.enqueueTaskArray(['Task1', 'Task3']);
      job.enqueue.getCall(0).args[0].should.eql('Task1');
      job.enqueue.getCall(1).args[0].should.eql('Task3');
    });

    it('should throw if array is not passed', function () {
      (function () {
        job.enqueueTaskArray(123);
      }).should.throw();
      (function () {
        job.enqueueTaskArray('foo');
      }).should.throw();
    });
  });

  describe('#params', function () {
    it('should throw if no object is passed', function () {
      (function () {
        job.params([1, 2]);
      }).should.throw();
      (function () {
        job.params(123);
      }).should.throw();
      (function () {
        job.params('foo');
      }).should.throw();
    });

    it('should set job parameters', function () {
      job.params({foo: 'bar'});
      job._getParams().should.eql({foo: 'bar'});
    });
  });

  describe('#enqueue', function () {
    it('should throw if param is not a string', function () {
      (function () {
        job.enqueue(123);
      }).should.throw();
      (function () {
        job.enqueue(['foo', 'bar']);
      }).should.throw();
    });

    it('should throw if task enqueued is not in plan', function () {
      (function () {
        job.enqueue('UnknownTask');
      }).should.throw();
    });
  });

  describe('#routine', function () {
    it('should throw if routine does not exist', function () {
      (function () {
        job.routine('FakeRoutine');
      }).should.throw();
    });
    it('should not throw if routine exists', function () {
      yakuza.agent('Scraper', 'Parallel').routine('RealRoutine', ['Task1', 'Task3']);
      job.routine('RealRoutine');
    });
  });

  describe('#on', function () {
    var newYakuza;

    beforeEach(function () {
      newYakuza = new YakuzaBase();
      newYakuza.agent('FooScraper', 'FooAgent').setup(function (config) {
        config.plan = [
          'FailTask',
          'SuccessTask'
        ];
      });
      newYakuza.task('FooScraper', 'FooAgent', 'FailTask').main(function (task) {
        task.fail(new Error('Error!'));
      });
      newYakuza.task('FooScraper', 'FooAgent', 'SuccessTask').main(function (task) {
        task.success();
      });
    });

    describe('job:finish', function () {
      it('should be called if job fails', function (done) {
        var failJob;

        failJob = newYakuza.job('FooScraper', 'FooAgent');
        failJob.enqueue('FailTask');
        failJob.on('job:finish', function () {
          done();
        });
        failJob.run();
      });

      it('should be called if job is successful', function (done) {
        var successJob;

        successJob = newYakuza.job('FooScraper', 'FooAgent');
        successJob.enqueue('SuccessTask');
        successJob.on('job:finish', function () {
          done();
        });
        successJob.run();
      });
    });

    describe('job:fail', function () {
      it('should be called if job fails', function (done) {
        var failJob;

        failJob = newYakuza.job('FooScraper', 'FooAgent');
        failJob.enqueue('FailTask');
        failJob.on('job:finish', function () {
          done();
        });
        failJob.run();
      });
    });

    describe('job:success', function () {
      it('should be called if job is successful', function (done) {
        var successJob;

        successJob = newYakuza.job('FooScraper', 'FooAgent');
        successJob.enqueue('SuccessTask');
        successJob.on('job:finish', function () {
          done();
        });
        successJob.run();
      });
    });

    describe('task:*:fail', function () {
      it('should be called if a task fails', function (done) {
        var failJob;

        failJob = newYakuza.job('FooScraper', 'FooAgent');
        failJob.enqueue('FailTask');
        failJob.on('task:FailTask:fail', function () {
          done();
        });
        failJob.run();
      });
    });

    describe('task:*:success', function () {
      it('should be called if a task succeeds', function (done) {
        var successJob;

        successJob = newYakuza.job('FooScraper', 'FooAgent');
        successJob.enqueue('SuccessTask');
        successJob.on('task:SuccessTask:success', function () {
          done();
        });
        successJob.run();
      });
    });
  });
});
