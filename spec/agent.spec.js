var Agent = require('../agent');
var _ = require('underscore');

describe('Agent', function () {
  var agent, agentPlanned;
  beforeEach(function () {
    agent = new Agent('agentNormal');
    agentPlanned = new Agent('agentPlanned');

    agentPlanned.setup(function (config) {
      config.plan = ['task1', [{taskId: 'task2', syncronous: true}, 'task3']];
    });
  });

  describe('#Agent', function () {
    it('should start with _configCallbacks empty', function () {
      expect(agent._configCallbacks.length).toEqual(0);
    });

    it('should start with _tasks empty', function () {
      expect(_.keys(agent._tasks).length).toEqual(0);
    });

    it('should set its Id', function () {
      var newAgent = new Agent('foo');
      expect(newAgent.id).toEqual('foo');
    });
  });

  describe('#setup', function () {
    it('should enqueue setup callbacks', function () {
      var functionOne = function () {return 1;};
      var functionTwo = function () {return 2;};
      agent.setup(functionOne);
      expect(agent._configCallbacks[0]).toBe(functionOne);
      agent.setup(functionTwo);
      expect(agent._configCallbacks[0]).toBe(functionOne);
      expect(agent._configCallbacks[1]).toBe(functionTwo);
    });
  });

  describe('#_applySetup', function () {
    it('should apply config callbacks in FIFO order', function () {
      agentPlanned.setup(function (config) {config.a = 1;});
      agentPlanned.setup(function (config) {config.a = 3;});
      agentPlanned.setup(function (config) {config.a = 2;});
      agentPlanned.setup(function (config) {config.b = 'hello';});
      agentPlanned._applySetup();
      expect(agentPlanned._config.a).toEqual(2);
      expect(agentPlanned._config.b).toEqual('hello');
    });

    it('should throw an exception if no plan has been defined', function () {
      var newAgent = new Agent('agentOne');
      var errMsg = 'Agent agentOne has no execution plan, use the config object provided' +
        ' by the setup method to define an execution plan';

      expect(function () {newAgent._applySetup();}).toThrow(new Error(errMsg));
    });

    it('should format execution plan as an array of arrays of objects', function () {
      var expectedPlan = [
        [{taskId: 'task1'}],
        [
          {taskId: 'task2', syncronous: true},
          {taskId: 'task3'}
        ]
      ];
      agentPlanned._applySetup();
      expect(agentPlanned._plan).toEqual(expectedPlan);
    });
  });

});
