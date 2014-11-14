'use strict';

var Job = require('../job');
var Agent = require('../agent');
var Task = require('../task');
var Q = require('q');

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

    it('should start with _executionQueueIdx as -1', function () {
      expect(job._executionQueueIdx).toBe(-1);
    });

    it('should start with _planIdx as -1', function () {
      expect(job._planIdx).toBe(-1);
    });

    it('should have events wildcards enabled', function () {
      expect(job._eventsConfig.wildcard).toBe(true);
    });

    it('should set event listeners', function () {
      spyOn(Job.prototype, '_setEventListeners').andCallThrough();
      new Job();
      expect(Job.prototype._setEventListeners).toHaveBeenCalled();
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
      var errMsg = 'Enqueue params isn\'t a valid string';
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

  describe('#_applyPlan', function () {
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
      newJob._applyPlan();
      expect(newJob._plan).toEqual([
        [{taskId: 'task1', syncronous: true}], [{taskId: 'task3'}, {taskId: 'task4'}],
        [{taskId: 'task5'}],
        [{taskId: 'task6'}]
      ]);
    });
  });

  describe('#_buildExecutionBlock', function () {
    var agent, newJob;
    beforeEach(function () {
      agent = new Agent('agentOne');
      newJob = new Job('jobOne', undefined, agent);
    });

    it('should create next executionBlock based on its plan', function () {
      agent.task('t1').main(function () {return true;});
      agent.task('t2').main(function () {return true;});
      agent.task('t3').main(function () {return true;});
      agent.task('t4').main(function () {return true;});
      agent.task('t1').builder(function () {return [1,2,3];});
      agent.task('t2').builder(function () {return [2,3];});
      agent.task('t3').builder(function () {return 3;});
      agent.task('t4').builder(function () {return [4];});

      var fakePlanGroup = [{taskId: 't1', selfSync: true}, {taskId: 't2'},
        {taskId: 't3'}, {taskId: 't4', selfSync: true}];
      var executionBlock = newJob._buildExecutionBlock(fakePlanGroup);
      var tasks1 = agent.task('t1')._build();
      var tasks2 = agent.task('t2')._build();
      var tasks3 = agent.task('t3')._build();
      var tasks4 = agent.task('t4')._build();
      var expectedExecutionBlock = [
        {task: tasks1[0], next: {task: tasks1[1], next: {task: tasks1[2], next: null}}},
        {task: tasks2[0], next: null},
        {task: tasks2[1], next: null},
        {task: tasks3[0], next: null},
        {task: tasks4[0], next: null}
      ];

      expect(JSON.stringify(executionBlock)).toEqual(JSON.stringify(expectedExecutionBlock));
    });
  });

  describe('#_applyAgentSetup', function () {
    it('should call agent\'s _applySetup() method', function () {
      var agent = new Agent('agentOne');
      var newJob = new Job('jobOne', undefined, agent);
      agent.setup(function (config) {
        config.plan = [{taskId: 'task1', syncronous: true},
          'task2', ['task3', 'task4'], 'task5', ['task6']];
      });

      spyOn(newJob._agent, '_applySetup');
      newJob._applyAgentSetup();
      expect(newJob._agent._applySetup).toHaveBeenCalled();
    });
  });

  describe('#_applyNextExecutionBlock', function () {
    var agent, newJob;
    beforeEach(function () {
      agent = new Agent('agentOne');
      newJob = new Job('jobOne', undefined, agent);
      agent.setup(function (config) {
        config.plan = [{taskId: 'task1', syncronous: true},
          'task2', ['task3', 'task4'], 'task5', ['task6']];});
    });

    it('should increment _planIdx in every call', function () {
      newJob._prepareRun();
      expect(newJob._planIdx).toBe(-1);
      newJob._applyNextExecutionBlock();
      expect(newJob._planIdx).toBe(0);
    });

    it('should push a new execution block', function () {
      newJob._prepareRun();
      newJob._applyNextExecutionBlock();
      expect(newJob._executionQueue.length).toEqual(1);
    });
  });

  describe('#run', function () {
    var newJob, agent;

    beforeEach(function () {
      agent = new Agent();
      agent.setup(function (config) {
        config.plan = [{taskId: 'task1', syncronous: true},
          'task2', ['task3', 'task4'], 'task5', ['task6']];
      });
      newJob = new Job('jobOne', undefined, agent);
    });

    it('should fire job:start event only once', function () {
      spyOn(newJob._events, 'emit');
      newJob.run();
      expect(newJob._events.emit).toHaveBeenCalled();
      newJob.run();
      expect(newJob._events.emit.calls.length).toEqual(1);
    });
  });

  describe('#_setEventListeners', function () {
    it('should set job:start listener to listen once', function () {
      spyOn(job._events, 'once');
      job._setEventListeners();
      expect(job._events.once).toHaveBeenCalledWith('job:start', jasmine.any(Function));
    });

    it('should set eq:applyBlock listener to listen', function () {
      spyOn(job._events, 'on');
      job._setEventListeners();
      expect(job._events.on).toHaveBeenCalledWith('eq:applyBlock', jasmine.any(Function));
    });
  });

  describe('#_onJobStart', function () {
    var agent, newJob;

    beforeEach(function () {
      agent = new Agent();
      newJob = new Job('jobTest', undefined, agent);
      agent.setup(function (config) {
        config.plan = [{taskId: 'task1', syncronous: true},
          'task2', ['task3', 'task4'], 'task5', ['task6']]
      ;});
    });

    it('should prepare the job to run', function () {
      spyOn(newJob, '_prepareRun').andCallThrough();
      newJob._onJobStart();
      expect(newJob._prepareRun).toHaveBeenCalled();
    });

    it('should apply first execution block', function () {
      spyOn(newJob, '_applyNextExecutionBlock');
      newJob._onJobStart();
      expect(newJob._applyNextExecutionBlock).toHaveBeenCalled();
    });
  });

  describe('#_onEqApplyBlock', function () {
    it('should call _runCurrentExecutionBlock', function () {
      spyOn(job, '_runCurrentExecutionBlock');
      job._onEqApplyBlock();
      expect(job._runCurrentExecutionBlock).toHaveBeenCalled();
    });
  });

  describe('#_retrieveExecutionBlockPromises', function () {
    it('should return an array of promises', function () {
      var executionBlock = [
        {task: new Task(), next: {task: new Task(), next: null}},
        {task: new Task(), next: null}
      ];

      var expectedResult = JSON.stringify([Q.defer().promise, Q.defer().promise,
        Q.defer().promise]);

      var promises = job._retrieveExecutionBlockPromises(executionBlock);
      promises = JSON.stringify(promises);

      expect(promises).toEqual(expectedResult);
    });
  });

});
