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
      yakuza.task('Scraper', 'Agent', 'Task').setup(function (config) {
        config.plan = [
          'Task'
        ];
      });
    });

    describe('onFail', function () {
      it('should be called right before a task fails', function () {

      });
    });
  });
});
