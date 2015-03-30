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
  yakuza.agent('Scraper', 'Agent').setup(function (config) {
    config.plan = [
      'Task1',
      'Task2'
    ];
  });
});

describe('Task', function () {
  describe('sharing', function () {
    it('should share value to the corresponding key in its job', function (done) {
      var newJob;

      yakuza.task('Scraper', 'Agent', 'Task1').main(function (task) {
        task.share('foo', 'bar');
        task.success();
      });
      yakuza.task('Scraper', 'Agent', 'Task2').builder(function (job) {
        job.shared('Task1.foo');
        return job.shared('Task1.foo');
      }).main(function (task, http, params) {
        params.should.eql('bar');
        task.success();
        done();
      });
      newJob = yakuza.job('Scraper', 'Agent');
      newJob.enqueue('Task1').enqueue('Task2');

      newJob.run();
    });

    it('should use custom method if passed', function (done) {
      var newJob;

      yakuza.task('Scraper', 'Agent', 'Task1').builder(function () {
        // Instance task twice to test custom sharing method
        return ['random', 'params'];
      })
      .main(function (task) {
        task.share('sum', 1, {
          method: function (current, newValue) {
            var value;
            value = current || 0;
            return value + newValue;
          }
        });

        task.success();
      });

      yakuza.task('Scraper', 'Agent', 'Task2').builder(function (job) {
        return job.shared('Task1.sum');
      }).main(function (task, http, params) {
        params.should.eql(2);
        task.success();
        done();
      });

      newJob = yakuza.job('Scraper', 'Agent');
      newJob.enqueue('Task1').enqueue('Task2');

      newJob.run();
    });
  });

  it('should throw if sharing is not correctly done', function (done) {
    var newJob;

    yakuza.task('Scraper', 'Agent', 'Task1').main(function (task) {
      (function () {
        task.share('keyOnly');
      }).should.throw('Missing key/value in share method call');
      (function () {
        task.share('key', 'value', {method: 'nonExistentMethod'});
      }).should.throw('Share method doesn\'t exist.');
      (function () {
        task.share('key', 'value', {method: 1234});
      }).should.throw('Share method is not a function');
      done();
      task.success();
    });

    newJob = yakuza.job('Scraper', 'Agent');
    newJob.enqueue('Task1');

    newJob.run();
  });
});
