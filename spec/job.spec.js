var _ = require('lodash');
var Job = require('../job');
var Agent = require('../agent');
var Task = require('../task');

describe('Job', function () {
  var job;
  beforeEach(function () {
    job = new Job();
  });

  describe('#Job', function () {
    it('should initalize with null uid', function () {
      var testJob = new Job();
      expect(testJob.uid).toBe(null);
    });

    it('should throw error if uid param isn\'t a string', function () {
      var errMsg = 'Job uid must be a valid string';
      expect(function () {new Job(123);}).toThrow(new Error(errMsg));
      expect(function () {new Job({});}).toThrow(new Error(errMsg));
      expect(function () {new Job(null);}).toThrow(new Error(errMsg));
    });

    it('should assign uid', function () {
      var testJob = new Job('asd');
      expect(testJob.uid).toEqual('asd');
    });

    it('should start with an empty _enqueuedTasks array', function () {
      var testJob = new Job();
      expect(testJob._enqueuedTasks).toEqual([]);
    });
  });

  describe('#params', function () {
    it('should throw error if params is\'t an object', function () {
      var errMsg = 'Params must be an object';
      expect(function () {job.params('');}).toThrow(new Error(errMsg));
      expect(function () {job.params(123);}).toThrow(new Error(errMsg));
      expect(function () {job.params([]);}).toThrow(new Error(errMsg));
      expect(function () {job.params(null);}).toThrow(new Error(errMsg));
    });

    it('should extend the params object with new properties in object', function () {
      var newJob = new Job();
      var newJob2 = new Job();
      newJob.params({a: 1});
      expect(newJob._params.a).toBe(1);
      newJob2._params = {z: 0};
      newJob2.params({z: 1, b: 10});
      expect(newJob2._params.z).toBe(1);
      expect(newJob2._params.b).toBe(10);
    });
  });

  describe('#enqueue', function () {
    it('should throw error if argument isn\'t a valid string', function () {
      var errMsg = 'enqueue params isn\'t a valid string';
      expect(function () {job.enqueue([]);}).toThrow(errMsg);
      expect(function () {job.enqueue('');}).toThrow(errMsg);
      expect(function () {job.enqueue(123);}).toThrow(errMsg);
      expect(function () {job.enqueue(null);}).toThrow(errMsg);
    });

    it('should append string given to _enqueuedTasks', function () {
      job.enqueue('task1');
      expect(job._enqueuedTasks).toEqual(['task1']);
      job.enqueue('task2');
      expect(job._enqueuedTasks).toEqual(['task1', 'task2']);
    });
  });

  describe('#_buildTask', function () {
    var agent, newJob;
    beforeEach(function () {
      agent = new Agent('agentOne');
      newJob = new Job('jobOne', undefined, agent);
    });

    it('should throw an error if task trying to be built is not defined', function () {
      var errMsg = 'Task with id task1 does not exist in agent agentOne';
      expect(function () {newJob._buildTask({taskId: 'task1'});}).toThrow(new Error(errMsg));
    });

    it('should return an array of Task instances', function () {
      agent.task('task1').main(function () {});
      expect(newJob._buildTask({taskId: 'task1'})[0] instanceof Task).toBe(true);
    });
  });

  describe('#_buildPlan', function () {
    var agent, newJob;
    beforeEach(function () {
      agent = new Agent('agentOne');
      newJob = new Job('jobOne', undefined, agent);
    });

    it('should build _plan following it\'s agent\'s execution plan', function () {
      agent.setup(function (config) {
        config.plan = [{taskId: 'task1', syncronous: true}, 'task2', ['task3', 'task4'],
          'task5', ['task6']];
      });
      agent._applySetup();
      newJob.enqueue('task1'); newJob.enqueue('task3'); newJob.enqueue('task4'); newJob.enqueue('task5');
      newJob.enqueue('task6');
      newJob._buildPlan();
      expect(newJob._plan).toEqual([
        [{taskId:'task1', syncronous: true}], [{taskId: 'task3'}, {taskId: 'task4'}],
        [{taskId:'task5'}],
        [{taskId: 'task6'}]
      ]);
    });
  });

  describe('#_processPlanGroup', function () {
    var agent, newJob;
    beforeEach(function () {
      agent = new Agent('agentOne');
      newJob = new Job('jobOne', undefined, agent);
    });

    it('should create next executionGroup based on its plan', function () {
      var fakePlan = [
        [{taskId: 't1'}, {taskId: 't2'}],
        [{taskId: 't3'}],
        [{taskId: 't4'}]
      ];
      newJob._processPlanGroup(fakePlan);
    });
  });
});
