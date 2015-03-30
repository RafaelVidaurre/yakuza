'use strict';

var YakuzaBase, sinon, chai, sinonChai;

sinon = require('sinon');
chai = require('chai');
sinonChai = require('sinon-chai');
chai.should();
chai.use(sinonChai);

YakuzaBase = require('../yakuza-base');

describe('TaskDefinition', function () {
  var yakuza;

  beforeEach(function () {
    yakuza = new YakuzaBase();
    yakuza.scraper('Scraper');
    yakuza.agent('Scraper', 'Agent');
  });

  describe('#_applySetup', function () {
    it('should only apply once', function () {
      var task;

      task = yakuza.task('Scraper', 'Agent', 'Task');

      task.setup(function (config) {
        return;
      });

      sinon.stub(task, '__applyConfigCallbacks');

      task._applySetup();
      task._applySetup();
      task.__applyConfigCallbacks.callCount.should.eql(1);
    });
  });

  describe('#setup', function () {
    it('should push config callbacks', function () {
      var calls;

      calls = 0;
      yakuza.task('Scraper', 'Agent', 'Task').setup(function () {
        calls += 1;
      }).setup(function () {
        calls += 1;
      });

      yakuza.task('Scraper', 'Agent', 'Task')._applySetup();

      calls.should.eql(2);
    });
  });

  describe('hooks', function () {
    beforeEach(function () {
      yakuza.agent('Scraper', 'Agent').setup(function (config) {
        config.plan = [
          'Task',
          'OtherTask'
        ];
      });
    });

    describe('onFail', function () {
      it('should be called right before a task fails', function (done) {
        var job, hookCalled;

        hookCalled = false;

        yakuza.task('Scraper', 'Agent', 'Task').setup(function (config) {
          config.hooks = {
            onFail: function () {
              hookCalled = true;
            }
          };
        }).main(function (task) {
          task.fail();
        });

        job = yakuza.job('Scraper', 'Agent');
        job.on('task:Task:fail', function () {
          hookCalled.should.eql(true);
          done();
        });
        job.enqueue('Task');
        job.run();
      });
    });

    describe('onSuccess', function () {
      it('should be called right before a task succeeds', function (done) {
        var job, hookCalled;

        hookCalled = false;

        yakuza.task('Scraper', 'Agent', 'Task').setup(function (config) {
          config.hooks = {
            onSuccess: function () {
              hookCalled = true;
            }
          };
        }).main(function (task) {
          task.success();
        });

        job = yakuza.job('Scraper', 'Agent');
        job.on('task:Task:success', function () {
          hookCalled.should.eql(true);
          done();
        });

        job.enqueue('Task');
        job.run();
      });

      it('should finish the job if stopJob() is called', function (done) {
        var job;

        yakuza.task('Scraper', 'Agent', 'Task').setup(function (config) {
          config.hooks = {
            onSuccess: function (event) {
              event.stopJob();
            }
          };
        }).main(function (task) {
          task.success();
        });
        yakuza.task('Scraper', 'Agent', 'OtherTask').main(function (task) {
          task.success();
        });

        job = yakuza.job('Scraper', 'Agent');

        job.enqueue('Task').enqueue('OtherTask');
        job.on('task:OtherTask:start', function () {
          throw new Error('Task was called!');
        });
        job.on('job:finish', function () {
          done();
        });

        job.run();
      });
    });
  });
});
