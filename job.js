/**
* @author Rafael Vidaurre
* @module Job
*/

'use strict';

var _ = require('lodash');
var Events = require('eventemitter2').EventEmitter2;
var Q = require('q');
var Http = require('./http');

/**
* @class
* @param {string} uid Unique identifier for the job instance
* @param {Scraper} scraper Reference to the scraper being used by the job
* @param {Agent} agent Reference to the agent being used by the job
*/
function Job (uid, scraper, agent, params) {
  /**
  * Instance of Http class in charge of recording requests/responses and providing a wapper around
  * mikeal's request library
  */
  this._http = new Http();

  /**
  * Whether the job has started or not
  * @private
  */
  this._started = false;

  /**
  * Configuration for _events property
  * @private
  */
  this._eventsConfig = {
    wildcard: true
  };

  /**
  * Configuration for _publicEvents property
  * @private
  */
  this._publicEventsConfig = {
    wildcard: true
  };

  /**
  * Event handler object for private events
  * @private
  */
  this._events = new Events(this._eventsConfig);

  /**
  * Event handler object for public events
  * @private
  */
  this._publicEvents = new Events(this._publicEventsConfig);

  /**
  * Current execution plan group idx from which we will build the next execution queue
  * @private
  */
  this._planIdx = -1;

  /**
  * Current execution queue group idx to run
  * @private
  */
  this._executionQueueIdx = -1;

  /**
  * Parameters that will be provided to the Task instances
  * @private
  */
  this._params = params || {};

  /**
  * Tasks enqueued via Job's API
  * @private
  */
  this._enqueuedTasks = [];

  /**
  * Represents enqueued tasks' sincrony and execution order
  * @private
  */
  this._plan = null;

  /**
  * Queue of tasks built in runtime defined by taskDefinition builders and execution plan
  * @private
  */
  this._executionQueue = [];

  /** Reference to the Agent instance being used by the Job */
  this._agent = agent;

  /** Reference to the Scraper instance being used by the Job */
  this._scraper = scraper;

  /** Object containing shared storages of all tasks */
  this._taskStorages = {};

  /** Object with finished task references */
  this._finishedTasks = {};

  /** Unique Job identifier */
  this.uid = null;

  // Set job's uid
  if (uid !== undefined) {
    this._setUid(uid);
  }

  // Set event listeners
  this._setEventListeners();
}

/**
* Sets the Jobs Uid value
* @param {string} argUid Uid which uniquely identifies the job
* @private
*/
Job.prototype._setUid = function (argUid) {
  if (!argUid || !_.isString(argUid) || argUid.length <= 0) {
    throw new Error('Job uid must be a valid string');
  }
  this.uid = argUid;
};

/**
* Prepares execution groups to run based on plan and enqueued tasks
* @private
*/
Job.prototype._applyPlan = function () {
  var _this = this;
  var executionPlan, newExecutionPlan, newTaskGroup, matchIdx, groupTaskIds;

  executionPlan = this._agent._plan;

  newExecutionPlan = [];
  newTaskGroup = [];

  _.each(executionPlan, function (executionGroup) {
    groupTaskIds = _.map(executionGroup, function (taskObj) {
      return taskObj.taskId;
    });

    _.each(_this._enqueuedTasks, function (enqueuedTask) {
      matchIdx = groupTaskIds.indexOf(enqueuedTask);
      if (matchIdx >= 0) {
        newTaskGroup.push(executionGroup[matchIdx]);
      }
    });

    if (newTaskGroup.length > 0) {
      newExecutionPlan.push(newTaskGroup);
      newTaskGroup = [];
    }
  });

  this._plan = newExecutionPlan;
};

/**
* Returns an undefined number of Task instances based on a taskDefinition's builder output
* @param {object} taskSpecs contains specifications to build a certain Task via it's TaskDefinition
* @private
* @return {array} an array of Tasks
*/
Job.prototype._buildTask = function (taskSpecs) {
  var _this, errMsg, taskDefinition, builderParams;

  _this = this;

  taskDefinition = this._agent._taskDefinitions[taskSpecs.taskId];
  errMsg = 'Task with id ' + taskSpecs.taskId + ' does not exist in agent ' + this._agent.id;

  if (taskDefinition === undefined) {
    throw new Error(errMsg);
  }

  builderParams = {
    params: this._params,
    shared: this._findInShared.bind(_this)
  };

  var buildResponse = taskDefinition._build(builderParams);

  return buildResponse;
};

/**
* Takes a plan group and creates the next execution block to be inserted into the execution
* queue
* @param {array} array of objects which represent tasks methods in a plan
* @private
* @return {array} array of objects which contain Task instances with their execution data
* @example
* // Input example
* [{taskId: 1, sync: true}, {taskId: 2}, {taskId: 3}]
* // Output
* // [{task: <taskInstance>, next: {...}}, {task: <taskInstance>, next: null}]
*/
Job.prototype._buildExecutionBlock = function (planGroup) {
  var _this = this;
  var executionBlock, executionObject, tasks, previousObject;

  executionBlock = [];

  _.each(planGroup, function (taskSpecs) {
    tasks = _this._buildTask(taskSpecs);
    previousObject = null;

    // Build all execution objects for a specific task and
    _.each(tasks, function (task) {

      executionObject = {task: task, next: null};

      // Assign new object to previous object's `next` attribute if the task is self syncronous
      if (taskSpecs.selfSync) {
        if (previousObject) {
          previousObject.next = executionObject;
          previousObject = executionObject;
        } else {
          previousObject = executionObject;
          executionBlock.push(executionObject);
        }
      } else {
        executionBlock.push(executionObject);
      }
    });
  });

  return executionBlock;
};

/**
* Runs through the executionBlock tree and gathers all promises from tasks
* @param {object} executionBlock An array of objects which represents a set of tasks to be run in
* parallel from the executionQueue
* @private
* @example
* //Input example
* [{task: <taskInstance>, next: {...}}, {task: <taskInstance>, next: null}]
*/
Job.prototype._retrieveExecutionBlockPromises = function (executionBlock) {
  var promises = [];

  var retrieveTaskSpecPromises = function (taskSpec) {
    var promises, currentTask;

    currentTask = taskSpec.task;
    promises = [];

    promises.push(currentTask._runningPromise);

    if (taskSpec.next) {
      promises = promises.concat(retrieveTaskSpecPromises(taskSpec.next));
    }

    return promises;
  };

  _.each(executionBlock, function (taskSpec) {
    promises = promises.concat(retrieveTaskSpecPromises(taskSpec));
  });

  return promises;
};

/**
* Runs a task and enqueues its `next` task if there is any (recursive)
* @param {object} taskSpec object with task specifications and the task itself
* @private
*/
Job.prototype._runTask = function (taskSpec) {
  var _this = this;
  var taskRunning, thisTask, nextTaskSpec;

  thisTask = taskSpec.task;
  taskRunning = thisTask._runningPromise;
  nextTaskSpec = taskSpec.next;

  if (nextTaskSpec) {
    taskRunning.then(function () {
      _this._runTask(nextTaskSpec);
    });
  }

  thisTask._run();
};

/**
* Runs an execution block
* @param {array} executionBlock An array of objects which represents a set of tasks from the
* executionQueue to be run in parallel. Its responsible of preparing the emission of the
* executionQueue events such as when it was successful or it failed.
* @private
* @example
* //Input example
* [{task: <taskInstance>, next: {...}}, {task: <taskInstance>, next: null}]
*/
Job.prototype._runExecutionBlock = function (executionBlock) {
  var _this = this;
  var runningTasks = this._retrieveExecutionBlockPromises(executionBlock);

  Q.all(runningTasks).then(function () {
    _this._events.emit('eq:blockSuccess');
  }, function () {
    _this._events.emit('eq:blockFail');
  });

  _.each(executionBlock, function (taskSpec) {
    _this._runTask(taskSpec);
  });
};

/**
* Runs execution block placed in current executionQueueIdx
* @private
*/
Job.prototype._runCurrentExecutionBlock = function () {
  this._runExecutionBlock(this._executionQueue[this._executionQueueIdx]);
};

/**
* increments execution plan index, builds an execution block from it and pushes it to the execution
* queue.
* @fires eq:blockApply
*/
Job.prototype._applyNextExecutionBlock = function () {
  var executionBlock;

  this._planIdx += 1;
  this._executionQueueIdx += 1;

  if (!this._plan[this._planIdx]) {
    this._events.emit('job:success');
    return;
  }

  executionBlock = this._buildExecutionBlock(this._plan[this._planIdx]);
  this._executionQueue.push(executionBlock);
  this._events.emit('eq:blockApply');
};

/**
* Does necessary stuff needed before running can occur
* @private
*/
Job.prototype._prepareRun = function () {
  this._applyComponents();
  this._applyPlan();
};

/**
* Event handler called on event job:start
* @private
*/
Job.prototype._onJobStart = function () {
  this._prepareRun();
  this._applyNextExecutionBlock();
};

/**
* Hooks to the newly created tasks' promises to trigger events and save useful data
*/
Job.prototype._prepareCurrentExecutionBlock = function () {
  var _this, promises;

  _this = this;
  promises = this._retrieveExecutionBlockPromises(this._executionQueue[this._executionQueueIdx]);

  _.each(promises, function (promise) {
    promise.then(function (response) {
      var task = response.task;

      // Save task in its corresponding finished task array
      _this._finishedTasks[task.taskId] = _this._finishedTasks[task.taskId] || [];
      _this._finishedTasks[task.taskId].push(task);

      // Set each key/value pair for this task's sharedStorage
      _this._taskStorages[task.taskId] = _this._taskStorages[task.taskId] || {};
      _.each(task._sharedStorage, function (value, key) {
        _this._taskStorages[task.taskId][key] = value;
      });

      // Emit event for successful task
      _this._events.emit('task:success', task, response);
    });
  });
};

/**
* Event handler called on event eq:blockApply
* @private
*/
Job.prototype._onEqBlockApply = function () {
  // Set the new built tasks' events and listens to their promises
  this._prepareCurrentExecutionBlock();
  // Run the new execution block
  this._runCurrentExecutionBlock();
};

/**
* Event handler called on event eq:blockFail. Stops the job as a block has been marked as failed
* @private
*/
Job.prototype._onEqBlockFail = function () {
  // TODO: Trigger event/callback to the outside
  this._publicEvents.emit('job:fail');
};

/**
* Event handler called on event eq:blockSuccess. Continues execution of next eqBlock if possible
* otherwise finishes the job
*/
Job.prototype._onEqBlockSuccess = function () {
  this._applyNextExecutionBlock();
};

/**
* Sets all the job's event listeners
* @private
*/
Job.prototype._setEventListeners = function () {
  var _this = this;

  // When the job is started
  this._events.once('job:start', function () {
    _this._onJobStart();
  });

  // When the next execution block is applied
  this._events.on('eq:blockApply', function () {
    _this._onEqBlockApply();
  });

  // When a task from the current execution block fails
  this._events.on('eq:blockFail', function () {
    _this._onEqBlockFail();
  });

  this._events.on('eq:blockSuccess', function () {
    _this._onEqBlockSuccess();
  });
};

/**
* Applies required scraping components as they need to be ready to run by the job
*/
Job.prototype._applyComponents = function () {
  this._scraper._applySetup();
  this._agent._applySetup();
};

/**
* Verifies if the job's enqueued tasks are present in it's agent
* @returns {boolean} true if all enqueued tasks exist
*/
Job.prototype._enqueuedTasksExist = function () {
  var _this = this;
  return _.every(this._enqueuedTasks, function (enqueuedTask) {
    return !!_this._agent._taskDefinitions[enqueuedTask];
  });
};

/**
* Looks for a value shared by a task
* @param {string} query key Namespaced by taskId using dot notation
* returns value The value if found, otherwise undefined
*/
Job.prototype._findInShared = function (query) {
  var taskId, key, splittedQuery;

  if (!_.isString(query)) {
    throw new Error('The shared method key passed is invalid');
  }

  splittedQuery = query.split('.');
  taskId = splittedQuery[0];
  key = splittedQuery[1];

  if (!taskId || !key) {
    throw new Error('The shared method key passed is invalid');
  }

  if (this._taskStorages[taskId] && this._taskStorages[taskId][key] !== undefined) {
    return this._taskStorages[taskId][key];
  }

  return undefined;
};

/**
* Sets parameters which the job will provide to its tasks
* @param {object} paramsObj Object containing key-value pair
*/
Job.prototype.params = function (paramsObj) {
  if (_.isArray(paramsObj) || !_.isObject(paramsObj)) {
    throw Error('Params must be an object');
  }

  _.extend(this._params, paramsObj);

  return this;
};

/**
* Adds a taskDefinition to be run by Job.prototype job
* @param {string} taskId Id of the taskDefinition to be run
*/
Job.prototype.enqueue = function (taskId) {
  if (!_.isString(taskId) || taskId.length <= 0) {
    throw Error('Enqueue params isn\'t a valid string');
  }

  this._enqueuedTasks.push(taskId);

  return this;
};

/**
* Begin the scraping job
* @fires job:start
*/
Job.prototype.run = function () {
  if (this._started) {
    return;
  }

  if (!this._enqueuedTasksExist()) {
    throw Error('One or more enqueued tasks are not defined');
  }

  this._started = true;
  this._events.emit('job:start');
};

/**
* Suscribes a callback function to a public event
* @param {string} eventName Name of the event to listent to
* @param {function} callback Callback function to be run when the event fires
*/
Job.prototype.on = function (eventName, callback) {
  this._publicEvents.on(eventName, callback);
};


module.exports = Job;
