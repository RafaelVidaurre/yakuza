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

  describe('#_build', function () {
    it('should throw if no main method is set', function () {
      var job;

      yakuza.agent('Scraper', 'Agent').setup(function (config) {
        config.plan = ['SomeTask'];
      });
      yakuza.task('Scraper', 'Agent', 'SomeTask');
      job = yakuza.job('Scraper', 'Agent');
      job.enqueue('SomeTask');

      (function () {
        job.run();
      }).should.throw('Cannot build task with no main method set');
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

    it('should throw if argument is not a function', function () {
      (function () {
        yakuza.task('Scraper', 'Agent', 'SomeTask').setup('foo');
      }).should.throw();
      (function () {
        yakuza.task('Scraper', 'Agent', 'SomeTask').setup(['foo']);
      }).should.throw();
      (function () {
        yakuza.task('Scraper', 'Agent', 'SomeTask').setup(123);
      }).should.throw();
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

      it('should be able to rerun a task', function (done) {
        var job;

        yakuza.task('Scraper', 'Agent', 'Task').setup(function (config) {
          config.hooks = {
            onFail: function (task) {
              // Rerun task with its param increased by 1
              task.rerun(task.params + 1);
            }
          };
        })
        .builder(function () {
          return 0;
        })
        .main(function (task, http, params) {
          if (params !== 3) {
            task.fail();
          } else {
            task.success();
          }
        });

        job = yakuza.job('Scraper', 'Agent');
        job.on('task:Task:success', function () {
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

  describe('#main', function () {
    it('should throw if main method is not a function', function () {
      (function () {
        yakuza.task('Scraper', 'Agent', 'SomeTask').main('foo');
      }).should.throw();
      (function () {
        yakuza.task('Scraper', 'Agent', 'SomeTask').main(['foo']);
      }).should.throw();
      (function () {
        yakuza.task('Scraper', 'Agent', 'SomeTask').main(123);
      }).should.throw();
    });
  });

  describe('#builder', function () {
    it('should throw if builder is not a function', function () {
      (function () {
        yakuza.task('Scraper', 'Agent', 'SomeTask').builder('foo');
      }).should.throw();
      (function () {
        yakuza.task('Scraper', 'Agent', 'SomeTask').builder(['foo']);
      }).should.throw();
      (function () {
        yakuza.task('Scraper', 'Agent', 'SomeTask').builder(123);
      }).should.throw();
    });
  });
});
