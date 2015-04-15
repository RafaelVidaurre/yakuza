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

  describe('#_build', function () {
    it('should throw if no main method is set', function () {
      var job;

      yakuza.agent('Scraper', 'Agent').plan(['SomeTask']);
      yakuza.task('Scraper', 'Agent', 'SomeTask');
      job = yakuza.job('Scraper', 'Agent');
      job.enqueue('SomeTask');

      (function () {
        job.run();
      }).should.throw('Cannot build task with no main method set');
    });
  });

  describe('#hooks', function () {
    beforeEach(function () {
      yakuza.agent('Scraper', 'Agent').plan([
        'Task',
        'OtherTask'
      ]);
    });

    it('should provide method chaining', function () {
      var task;

      task = yakuza.task('Scraper', 'Agent', 'Foo');

      task.hooks({
        onFail: function () {
          // NOOP
        }
      }).should.eql(task);
    });

    it('should throw if argument is not an object', function () {
      var error;

      error = 'Hooks argument must be an object';

      (function () {
        yakuza.task('Scraper', 'Agent', 'Foo').hooks();
      }).should.throw(error);

      (function () {
        yakuza.task('Scraper', 'Agent', 'Foo').hooks(123);
      }).should.throw(error);

      (function () {
        yakuza.task('Scraper', 'Agent', 'Foo').hooks(['foo', 'bar']);
      }).should.throw(error);
    });

    describe('onFail', function () {
      it('should be called right before a task fails with the right parameters', function (done) {
        var job, hookCalled, error, params;

        error = new Error('Test error');
        hookCalled = false;
        params = {foo: 'bar'};

        yakuza.task('Scraper', 'Agent', 'Task').hooks({
          onFail: function (task) {
            task.error.should.equal(error);
            task.runs.should.eql(1);
            task.params.should.equal(params);

            hookCalled = true;
          }
        })
        .builder(function () {
          return params;
        })
        .main(function (task) {
          task.fail(error);
        });

        job = yakuza.job('Scraper', 'Agent');
        job.on('task:Task:fail', function () {
          hookCalled.should.eql(true);
          done();
        });
        job.enqueue('Task');
        job.run();
      });

      describe('task rerunning', function () {
        it('should be able to rerun a task', function (done) {
          var job;

          yakuza.task('Scraper', 'Agent', 'Task').hooks({
            onFail: function (task) {
              // Rerun task with its param increased by 1
              task.rerun(task.params + 1);
            }
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

        it('should provide default parameters if none are specified', function (done) {
          var job, runs;

          runs = 0;

          yakuza.task('Scraper', 'Agent', 'Task').hooks({
            onFail: function (task) {
              if (task.runs === 2) {
                return;
              }

              task.rerun();
            }
          })
          .builder(function () {
            return 10;
          })
          .main(function (task, http, params) {
            runs += 1;
            if (runs === 2) {
              params.should.eql(10);
            }

            task.fail();
          });

          job = yakuza.job('Scraper', 'Agent');
          job.on('task:Task:fail', function () {
            done();
          });
          job.enqueue('Task');
          job.run();
        });
      });
    });

    describe('onSuccess', function () {
      it('should be called right before a task succeeds', function (done) {
        var job, hookCalled;

        hookCalled = false;

        yakuza.task('Scraper', 'Agent', 'Task').hooks({
          onSuccess: function () {
            hookCalled = true;
          }
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

        yakuza.task('Scraper', 'Agent', 'Task').hooks({
          onSuccess: function (event) {
            event.stopJob();
          }
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
