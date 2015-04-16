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
  yakuza.agent('Scraper', 'Parallel').plan([
    'Task1',
    ['Task2', 'Task3'],
    'Task4'
  ]);

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

  yakuza.task('Scraper', 'Delayed', 'Task1').main(function (task) {
    setTimeout(function () {
      task.success();
    }, 30);
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

    it('should use scraper routine if it doesn\'t exist for agent', function () {
      yakuza.scraper('Scraper').routine('Foo', ['Task1', 'Task2']);
      sinon.stub(job, 'enqueueTaskArray');
      job.routine('Foo');
      job.enqueueTaskArray.getCall(0).args[0].should.eql(['Task1', 'Task2']);
    });

    it('should use agent routine if defined', function () {
      yakuza.scraper('Scraper').routine('Foo', ['Task1', 'Task2']);
      yakuza.agent('Scraper', 'Parallel').routine('Foo', ['Task3']);
      sinon.stub(job, 'enqueueTaskArray');
      job.routine('Foo');
      job.enqueueTaskArray.getCall(0).args[0].should.eql(['Task3']);
    });
  });

  describe('#on', function () {
    var newYakuza;

    beforeEach(function () {
      newYakuza = new YakuzaBase();
      newYakuza.agent('FooScraper', 'FooAgent').plan([
        'FailTask',
        'SuccessTask',
        'StopTask'
      ]);
      newYakuza.task('FooScraper', 'FooAgent', 'FailTask').main(function (task) {
        task.fail(new Error('Error!'));
      });
      newYakuza.task('FooScraper', 'FooAgent', 'SuccessTask')
        .builder(function () {
          return {some: 'param'};
        })
        .main(function (task) {
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

    describe('job:start', function () {
      it('should be called when the job starts', function (done) {
        var successJob;

        successJob = newYakuza.job('FooScraper', 'FooAgent');
        successJob.enqueue('SuccessTask');
        successJob.on('job:start', function () {
          done();
        });
        successJob.run();
      });
    });

    describe('task:*:start', function () {
      it('should be called when a task starts with correct response', function (done) {
        var startJob, startCalled;

        startCalled = false;
        startJob = newYakuza.job('FooScraper', 'FooAgent');
        startJob.enqueue('SuccessTask');
        startJob.on('task:SuccessTask:start', function (response) {
          response.task.taskId.should.eql('SuccessTask');
          response.params.should.eql({some: 'param'});
          startCalled = true;
        });
        startJob.on('task:SuccessTask:success', function () {
          startCalled.should.eql(true);
          done();
        });
        startJob.run();
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

      it('should be called if a task succeeds and rejects', function (done) {
        var successJob;

        newYakuza.task('FooScraper', 'FooAgent', 'StopTask').hooks({
          onSuccess: function (task) {
            task.stopJob();
          }
        }).main(function (task) {
          task.success();
        });

        successJob = newYakuza.job('FooScraper', 'FooAgent');
        successJob.enqueue('StopTask');
        successJob.on('task:StopTask:success', function () {
          done();
        });
        successJob.run();
      });
    });

    describe('task:*:finish', function () {
      it('should be called if a task succeeds', function (done) {
        var successJob;

        successJob = newYakuza.job('FooScraper', 'FooAgent');
        successJob.enqueue('SuccessTask');
        successJob.on('task:SuccessTask:finish', function () {
          done();
        });
        successJob.run();
      });

      it('should be called if a task fails', function (done) {
        var failJob;

        failJob = newYakuza.job('FooScraper', 'FooAgent');
        failJob.enqueue('FailTask');
        failJob.on('task:FailTask:finish', function () {
          done();
        });
        failJob.run();
      });
    });
  });

  describe('#run', function () {
    describe('starting', function () {
      var someJob;

      beforeEach(function () {
        someJob = yakuza.job('Scraper', 'Parallel');
      });

      it('should throw if run twice', function () {
        (function () {
          someJob.run();
          someJob.run();
        }).should.throw('A job cannot be run more than once');
      });

      it('should throw if enqueued tasks are not defined', function () {
        var invalidJob;

        yakuza.agent('Scraper', 'InvalidAgent').plan(['FakeTask']);

        invalidJob = yakuza.job('Scraper', 'InvalidAgent');
        invalidJob.enqueue('FakeTask');

        (function () {
          invalidJob.run();
        }).should.throw('One or more enqueued tasks are not defined');
      });
    });

    describe('execution queue', function () {
      beforeEach(function () {
        yakuza.scraper('QueueTest').agent('SyncTest').plan([
          {taskId: 'SyncTask', selfSync: true},
          'AsyncTask'
        ]);
        yakuza.task('QueueTest', 'SyncTest', 'SyncTask').builder(function () {
          return [1, 2];
        })
        .main(function (task, params) {
          task.success(params);
        });

        yakuza.task('QueueTest', 'SyncTest', 'AsyncTask').builder(function () {
          return [1, 2];
        })
        .main(function (task, params) {
          task.success(params);
        });
      });

      it('should run instances of the same task sequentially if selfSync is set', function (done) {
        var syncJob, runningTasks, successCount;

        successCount = 0;
        runningTasks = 0;
        syncJob = yakuza.job('QueueTest', 'SyncTest');
        syncJob.enqueue('SyncTask');
        syncJob.on('task:SyncTask:start', function () {
          runningTasks += 1;
          runningTasks.should.not.be.above(1);
        });
        syncJob.on('task:SyncTask:success', function () {
          runningTasks -= 1;
          successCount += 1;
          if (successCount === 2) {
            done();
          }
        });
        syncJob.run();
      });

      it('should run non-selfsync tasks asyncronously', function (done) {
        var asyncJob, runningTasks, ranInParallel, successCount;

        successCount = 0;
        runningTasks = 0;
        ranInParallel = false;
        asyncJob = yakuza.job('QueueTest', 'SyncTest');
        asyncJob.enqueue('AsyncTask');
        asyncJob.on('task:AsyncTask:start', function () {
          runningTasks += 1;
          if (runningTasks === 2) {
            ranInParallel = true;
          }
        });
        asyncJob.on('task:AsyncTask:success', function () {
          runningTasks -= 1;
          successCount += 1;
          if (successCount === 2) {
            ranInParallel.should.eql(true);
            done();
          }
        });
        asyncJob.run();
      });

      it('should run task in different execution blocks sequentially and tasks in the same block' +
        'in parallel', function (done) {
        var parallelJob, taskStatuses, parallelCount, ranInParallel;

        ranInParallel = false;
        parallelCount = 0;
        taskStatuses = {
          Task1: 'idle',
          Task2: 'idle',
          Task3: 'idle',
          Task4: 'idle'
        };

        parallelJob = yakuza.job('Scraper', 'Parallel');
        parallelJob.enqueueTaskArray(['Task1', 'Task2', 'Task3', 'Task4']);

        parallelJob.on('task:*:start', function (response) {
          taskStatuses[response.task.taskId] = 'started';
        });
        parallelJob.on('task:*:finish', function (response) {
          taskStatuses[response.task.taskId] = 'finished';
        });

        parallelJob.on('task:Task1:start', function () {
          taskStatuses.Task2.should.eql('idle');
          taskStatuses.Task3.should.eql('idle');
          taskStatuses.Task4.should.eql('idle');
        });
        parallelJob.on('task:Task2:start', function () {
          parallelCount += 1;
          taskStatuses.Task1.should.eql('finished');
          taskStatuses.Task4.should.eql('idle');
          if (parallelCount === 2) {
            ranInParallel = true;
          }
        });
        parallelJob.on('task:Task2:finish', function () {
          parallelCount -= 1;
        });
        parallelJob.on('task:Task3:finish', function () {
          parallelCount -= 1;
        });
        parallelJob.on('task:Task3:start', function () {
          taskStatuses.Task1.should.eql('finished');
          taskStatuses.Task4.should.eql('idle');
          parallelCount += 1;
          if (parallelCount === 2) {
            ranInParallel = true;
          }
        });
        parallelJob.on('task:Task4:start', function () {
          taskStatuses.Task1.should.eql('finished');
          taskStatuses.Task2.should.eql('finished');
          taskStatuses.Task3.should.eql('finished');
        });

        parallelJob.on('job:finish', function () {
          ranInParallel.should.eql(true);
          done();
        });

        parallelJob.run();
      });
    });
  });
});
