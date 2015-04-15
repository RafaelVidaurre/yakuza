'use strict';

var YakuzaBase, sinonChai, yakuza, chai, nock;

require('sinon');
YakuzaBase = require('../yakuza-base');
nock = require('nock');
chai = require('chai');
sinonChai = require('sinon-chai');
chai.should();
chai.use(sinonChai);
nock.disableNetConnect();

beforeEach(function () {
  nock('http://www.fake.com').get('/').reply(200, '', {
    'Set-Cookie': 'foo=bar'
  });
  nock('http://www.nocookies.com').get('/').reply(200);

  yakuza = new YakuzaBase();
  yakuza.scraper('Scraper');
  yakuza.agent('Scraper', 'Agent').plan([
    'Task1',
    {taskId: 'Task2'}
  ]);
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

    it('should throw if retrieving shared values is not done correctly', function (done) {
      var newJob, keyError;

      keyError = 'The shared method key passed is invalid';

      yakuza.task('Scraper', 'Agent', 'Task1').main(function (task) {
        task.share('foo', 'bar');
        task.success();
      });

      yakuza.task('Scraper', 'Agent', 'Task2').builder(function (job) {
        (function () {
          job.shared(123);
        }).should.throw(keyError);
        (function () {
          job.shared([1, 2]);
        }).should.throw(keyError);
        (function () {
          job.shared('taskId');
        }).should.throw(keyError);

        (function () {
          job.shared('NonExistentTask.foo');
        }).should.throw('\'foo\' was never shared by task \'NonExistentTask\'');

      }).main(function (task) {
        task.success();
        done();
      });

      newJob = yakuza.job('Scraper', 'Agent');
      newJob.enqueueTaskArray(['Task1', 'Task2']);

      newJob.run();
    });
  });

  describe('saving cookies', function () {
    it('should save cookies for next execution queue', function (done) {
      var newJob;

      yakuza.task('Scraper', 'Agent', 'Task1').main(function (task, http) {
        http.get('http://www.fake.com/').then(function () {
          task.saveCookies();
          task.success();
        }).done();
      });

      yakuza.task('Scraper', 'Agent', 'Task2').main(function (task, http) {
        http.get('http://www.nocookies.com/').then(function () {
          http.getLog()[0].request.cookies.should.eql('foo=bar');
          task.success();
          done();
        }).done();
      });

      newJob = yakuza.job('Scraper', 'Agent');
      newJob.enqueue('Task1').enqueue('Task2');

      newJob.run();
    });
  });
});
