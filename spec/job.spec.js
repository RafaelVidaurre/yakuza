var _ = require('lodash');
var Job = require('../job');

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

    it('should throw error if scraperId param isn\'t a string', function () {
      var errMsg = 'Scraper id must be a valid string';
      expect(function () {new Job('jobUid', 123);}).toThrow(new Error(errMsg));
      expect(function () {new Job('jobUid', {});}).toThrow(new Error(errMsg));
      expect(function () {new Job('jobUid', null);}).toThrow(new Error(errMsg));
    });

    it('should throw error if agentId param isn\'t a string', function () {
      var errMsg = 'Agent id must be a valid string';
      expect(function () {new Job('jobUid', 'scraperId', 123);}).toThrow(new Error(errMsg));
      expect(function () {new Job('jobUid', 'scraperId', {});}).toThrow(new Error(errMsg));
      expect(function () {new Job('jobUid', 'scraperId', null);}).toThrow(new Error(errMsg));
    });

    it('should assign uid', function () {
      var testJob = new Job('asd');
      expect(testJob.uid).toEqual('asd');
    });

    it('should assign scraperId', function () {
      var testJob = new Job('asd', 'scraperOne');
      expect(testJob.scraperId).toEqual('scraperOne');
    });

    it('should assign agentId', function () {
      var testJob = new Job('asd', 'scraperOne', 'agentOne');
      expect(testJob.agentId).toEqual('agentOne');
    });


    it('should start with an empty _enqueuedTasks array', function () {
      var testJob = new Job();
      expect(testJob._enqueuedTasks).toEqual([]);
    });
  });

  describe('#params', function () {
    it('should throw error if params is\'t an object', function () {
      var errMsg = 'Params must be an object';
      expect(function () {job.params('')}).toThrow(new Error(errMsg));
      expect(function () {job.params(123)}).toThrow(new Error(errMsg));
      expect(function () {job.params([])}).toThrow(new Error(errMsg));
      expect(function () {job.params(null)}).toThrow(new Error(errMsg));
    });

    it('should extend the _params object with new properties in object', function () {
      var newJob = new Job();
      var newJob2 = new Job();
      newJob.params({a: 1});
      expect(newJob._params['a']).toBe(1);
      newJob2._params = {z: 0};
      newJob2.params({z: 1, b: 10});
      expect(newJob2._params['z']).toBe(1);
      expect(newJob2._params['b']).toBe(10);
    });
  });

  describe('#enqueue', function () {
    it('should throw error if argument isn\'t a valid string', function () {
      var errMsg = 'enqueue params isn\'t a valid string';
      expect(function () {job.enqueue([])}).toThrow(errMsg);
      expect(function () {job.enqueue('')}).toThrow(errMsg);
      expect(function () {job.enqueue(123)}).toThrow(errMsg);
      expect(function () {job.enqueue(null)}).toThrow(errMsg);
    });

    it('should append string given to _enqueuedTasks', function () {
      job.enqueue('task1');
      expect(job._enqueuedTasks).toEqual(['task1']);
      job.enqueue('task2');
      expect(job._enqueuedTasks).toEqual(['task1', 'task2']);
    });
  });
});
