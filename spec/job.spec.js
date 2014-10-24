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

    it('should throw exception if uid param isn\'t a string', function () {
      var errMsg = 'Job uid must be a valid string';
      expect(function () {new Job(123);}).toThrow(new Error(errMsg));
      expect(function () {new Job('');}).toThrow(new Error(errMsg));
      expect(function () {new Job({});}).toThrow(new Error(errMsg));
      expect(function () {new Job(null);}).toThrow(new Error(errMsg));
    });

    it('should assign uid', function () {
      var testJob = new Job('asd');
      expect(testJob.uid).toEqual('asd');
    });
  });

  describe('#params', function () {
    it('should throw exception if params is\'t an object', function () {
      var errMsg = 'Params must be an object';
      expect(function () {job.params('')}).toThrow(new Error(errMsg));
      expect(function () {job.params(123)}).toThrow(new Error(errMsg));
      expect(function () {job.params([])}).toThrow(new Error(errMsg));
      expect(function () {job.params(null)}).toThrow(new Error(errMsg));
    });

    it('should extend the _params object with new properties in object', function () {
      job.params({a: 1});
      expect(job._params['a']).toBe(1);
    });
  });
});
