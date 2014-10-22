var Agent = require('../scraper');
var _ = require('underscore');

describe('Agent', function () {
  var agent;
  beforeEach(function () {
    agent = new Agent();
  });

  describe('#Agent', function () {
    it('should start with _configCallbacks empty', function () {
      expect(agent._configCallbacks.length).toEqual(0);
    });

    it('should start with _tasks empty', function () {
      expect(_.keys(agent._tasks).length).toEqual(0);
    });
  });
});
