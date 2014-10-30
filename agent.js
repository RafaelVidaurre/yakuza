/**
* @author Rafael Vidaurre
* @requires Utils
* @exports Agent
*/

'use strict';

var _ = require('lodash');
var utils = require('./utils');

/**
* @class
*/
function Agent (id) {
  var _this = this;

  _this._configCallbacks = [];
  _this._tasks = {};
  _this._config = {};
  _this.id = id;

  // Run the whole config callbacks queue
  var _applyConfigCallbacks = function () {
    _.each(_this._configCallbacks, function (configCallback) {
      configCallback(_this._config);
    });
  };
  // Apply correct format to execution plan
  var _formatExecutionPlan = function () {
    var newExecutionPlan, currentTier;
    newExecutionPlan = [];

    if (_this._config.executionPlan === undefined) {
      throw new Error('Agent '+_this.id+' has no execution plan, use the config object provided' +
        ' by the setup method to define an execution plan');
    }

    // Turn each tier into an array if they are not
    _.each(_this._config.executionPlan, function (executionTier) {
      currentTier = _.isArray(executionTier) ? executionTier : [executionTier];
      newExecutionPlan.push(currentTier);
    });

    _this._config.executionPlan = newExecutionPlan;
  };

  // Saves a configuration callback in `configCallbacks` array
  _this.setup = function (cbConfig) {
    if (!_.isFunction(cbConfig)) { throw Error('Config argument must be a function'); }

    _this._configCallbacks.push(cbConfig);

    return Agent;
  };

  // Apply setup configurations and pre-format data
  _this._applySetup = function () {
    _applyConfigCallbacks();
    _formatExecutionPlan();
  };
}

module.exports = Agent;
