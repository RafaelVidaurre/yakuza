/**
* @author Rafael Vidaurre
* @module Job
*/

'use strict';

var CookieJar, Events, Http, Q, _, request, tough, utils;

_ = require('lodash');
Events = require('eventemitter2').EventEmitter2;
Q = require('q');
Http = require('./http');
utils = require('./utils');
tough = require('tough-cookie');
request = require('request');
CookieJar = tough.CookieJar;

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
  * @private
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
    wildcard: true,
    delimiter: ':'
  };

  /**
  * Configuration for _publicEvents property
  * @private
  */
  this._publicEventsConfig = {
    wildcard: true,
    delimiter: ':'
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

  /**
  * Reference to the Agent instance being used by the Job
  * @private
  */
  this._agent = agent;

  /**
  * Reference to the Scraper instance being used by the Job
  * @private
  */
  this._scraper = scraper;

  /**
  * Object containing shared storages of all tasks
  * @private
  */
  this._taskStorages = {};

  /**
  * Object with finished task references
  * @private
  */
  this._finishedTasks = {};

  /**
  * Cookie jar to be used in the next execution block
  * @private
  */
  this._cookieJar = {};

  /**
  * Determines wether the job's components have been applied or not
  * @private
  */

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
  var _this, executionPlan, groupTaskIds, matchIdx, newExecutionPlan, newTaskGroup;

  _this = this;

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
* Returns a cloned version of a cookie jar
* @param cookieJar a cookie jar
* @return a clone of the current cookie jar
*/
Job.prototype._cloneCookieJar = function (cookieJar) {
  return _.cloneDeep(cookieJar);
};

/**
* Returns an undefined number of Task instances based on a taskDefinition's builder output
* @param {object} taskSpecs contains specifications to build a certain Task via it's TaskDefinition
* @private
* @return {array} an array of Tasks
*/
Job.prototype._buildTask = function (taskSpecs) {
  var _this, buildResponse, builderParams, clonedCookieJar, errMsg, taskDefinition;

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

  clonedCookieJar = this._cloneCookieJar(this._cookieJar);
  buildResponse = taskDefinition._build(builderParams, clonedCookieJar, this);

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
  var _this, executionBlock, executionObject, previousObject, tasks;

  _this = this;

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
* // Input example
* [{task: <taskInstance>, next: {...}}, {task: <taskInstance>, next: null}]
*/
Job.prototype._retrieveExecutionBlockPromises = function (executionBlock) {
  var finalPromises;

  function retrieveTaskSpecPromises (taskSpec) {
    var currentTask, promises;

    currentTask = taskSpec.task;
    promises = [];

    promises.push(currentTask._runningPromise);

    if (taskSpec.next) {
      promises = promises.concat(retrieveTaskSpecPromises(taskSpec.next));
    }

    return promises;
  }

  finalPromises = [];

  _.each(executionBlock, function (taskSpec) {
    finalPromises = finalPromises.concat(retrieveTaskSpecPromises(taskSpec));
  });

  return finalPromises;
};

/**
* Saves the given cookie jar, to be used by the job in the execution blocks that follow
* @private
*/
Job.prototype._saveCookieJar = function (cookieJar) {
  this._cookieJar = cookieJar;
};

/**
* Runs a task and enqueues its `next` task if there is any (recursive)
* @param {object} taskSpec object with task specifications and the task itself
* @private
*/
Job.prototype._runTask = function (taskSpec) {
  var _this, nextTaskSpec, taskRunning, thisTask;

  _this = this;

  thisTask = taskSpec.task;
  taskRunning = thisTask._runningPromise;
  nextTaskSpec = taskSpec.next;

  if (nextTaskSpec) {
    taskRunning.then(function () {
      _this._runTask(nextTaskSpec);
    }).done();
  }

  thisTask._run();
};

/**
* Called when a task fails, handles plumbing for a fail scenario
* @fires job:fail
* @fires fail
*/
Job.prototype._failJob = function (response) {
  this._events.emit('job:fail', response);
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
  var _this, runningTasks;

  _this = this;
  runningTasks = this._retrieveExecutionBlockPromises(executionBlock);

  Q.all(runningTasks).then(function (results) {
    // Set cookies of results
    _.each(results, function (result) {
      if (result.savedCookieJar) {
        _this._saveCookieJar(result.savedCookieJar);
      }
    });

    _this._events.emit('eq:blockContinue');

  }, function (response) {
    // FIXME: After this runs an exception is thrown by Q for some reason
    if (response.status === 'fail') {
      _this._failJob(response);
    }

    _this._events.emit('eq:blockStop');
  }).done();

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
* @private
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
* Hooks to the newly created tasks' promises to trigger events and save useful data
* @private
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

      // Emit event for successful task
      _this._events.emit('task:success', response);

    }, function (response) {
      _this._events.emit('task:fail', response);
    }).done();
  });
};

/**
* Event handler called on event task:success
*/
Job.prototype._onTaskSuccess = function (response) {
  var taskId;

  taskId = response.task.taskId;
  this._publicEvents.emit('task:' + taskId + ':success', response);
};

/**
* Event handler called on event task:fail
*/
Job.prototype._onTaskFail = function (response) {
  var taskId;

  taskId = response.task.taskId;
  this._publicEvents.emit('task:' + taskId + ':fail', response);
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
* Event handler called on event job:success
* @private
* @fires job:success
* @fires job:finish
* @fires success
* @fires finish
*/
Job.prototype._onJobSuccess = function () {
  this._publicEvents.emit('job:success');
  this._publicEvents.emit('job:finish');
  this._publicEvents.emit('success');
  this._publicEvents.emit('finish');
};

Job.prototype._onJobFail = function (response) {
  this._publicEvents.emit('job:fail', response);
  this._publicEvents.emit('fail', response);
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
* Event handler called on event eq:blockStop. Stops the job as a block has been stopped
* @private
* @fires job:finish
* @fires finish
*/
Job.prototype._onEqBlockStop = function () {
  // Finish is triggered when the job fails or succeeds, Basically when it stops running
  this._publicEvents.emit('job:finish');
  this._publicEvents.emit('finish');
};

/**
* Event handler called on event eq:blockContinue. Continues execution of next eqBlock if possible
* otherwise finishes the job
* @private
*/
Job.prototype._onEqBlockContinue = function () {
  this._applyNextExecutionBlock();
};

/**
* Sets all the job's event listeners
* @private
*/
Job.prototype._setEventListeners = function () {
  var _this = this;

  // When a task finishes without errors
  this._events.on('task:success', function (response) {
    _this._onTaskSuccess(response);
  });

  this._events.on('task:fail', function (response) {
    _this._onTaskFail(response);
  });

  // When the job is started
  this._events.once('job:start', function () {
    _this._onJobStart();
  });

  // When the job finishes without errors
  this._events.once('job:success', function () {
    _this._onJobSuccess();
  });

  // When the job finishes with errors
  this._events.once('job:fail', function (response) {
    _this._onJobFail(response);
  });

  // When the next execution block is applied
  this._events.on('eq:blockApply', function () {
    _this._onEqBlockApply();
  });

  // When a task from the current execution block fails
  this._events.on('eq:blockStop', function () {
    _this._onEqBlockStop();
  });

  this._events.on('eq:blockContinue', function () {
    _this._onEqBlockContinue();
  });
};

/**
* Applies required scraping components as they need to be ready to run by the job
* @private
*/
Job.prototype._applyComponents = function () {
  if (this._componentsApplied) {
    return;
  }

  this._scraper._applySetup();
  this._agent._applySetup();

  this._componentsApplied = true;
};

/**
* Verifies if the job's enqueued tasks are present in it's agent
* @returns {boolean} true if all enqueued tasks exist
* @private
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
* @return The value if found, otherwise undefined
* @private
*/
Job.prototype._findInShared = function (query) {
  var key, result, splitQuery, taskId;

  if (!_.isString(query)) {
    console.log('ERROR: The shared method key passed is invalid');
    throw new Error('The shared method key passed is invalid');
  }

  splitQuery = query.split('.');
  taskId = splitQuery[0];
  key = splitQuery[1];

  if (!taskId || !key) {
    console.log('ERROR: The shared method key passed is invalid');
    throw new Error('The shared method key passed is invalid');
  }

  result = this._getShared(taskId, key);

  if (result === undefined) {
    throw new Error('\'' + key + '\' was never shared by task \'' + taskId + '\'');
  }

  return this._getShared(taskId, key);
};

/**
* Gets a shared value belonging to a specific task and key
* @params {string} taskId Task id of the task containing the value shared
* @params {string} key Key to which the value is assigned
* @returns the value found, or undefined
*/
Job.prototype._getShared = function (taskId, key) {
  if (this._taskStorages[taskId] && this._taskStorages[taskId][key] !== undefined) {
    return this._taskStorages[taskId][key];
  }

  return undefined;
};

/**
* Sets a shared value for a specific task and key
* @param {string} taskId task id of the task associated with the value shared
* @param {string} key key to which the value should be assigned to
* @param value value to set
*/
Job.prototype._setShared = function (taskId, key, value) {
  this._taskStorages[taskId] = this._taskStorages[taskId] || {};
  this._taskStorages[taskId][key] = value;
};

/**
* Check wether a task is present on the job's agent's plan
* @param {string} taskId task id of the task
* @returns {boolean} true if the task is in the plan
*/
Job.prototype._taskIsInPlan = function (taskId) {
  var tasks;

  this._applyComponents();

  return _.some(this._agent._plan, function (planBlock) {
    tasks = utils.arrayify(planBlock);

    return _.some(tasks, function (taskObject) {
      var planTaskId;

      planTaskId = _.isString(taskObject) ? taskObject : taskObject.taskId;
      return planTaskId === taskId;
    });
  });
};

/**
* Enqueues all tasks present in the array
* @param {Array} taskArray array of task Ids
* @public
*/
Job.prototype.enqueueTaskArray = function (taskArray) {
  var _this = this;

  if (!_.isArray(taskArray)) {
    throw new Error('Expected an array of task Ids');
  }

  _.each(taskArray, function (taskId) {
    _this.enqueue(taskId);
  });
};

/**
* Sets parameters which the job will provide to its tasks
* @param {object} paramsObj Object containing key-value pair
*/
Job.prototype.params = function (paramsObj) {
  if (_.isArray(paramsObj) || !_.isObject(paramsObj)) {
    throw new Error('Params must be an object');
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
    throw new Error('Enqueue params isn\'t a valid string');
  }

  if (!this._taskIsInPlan(taskId)) {
    throw new Error('Enqueued task ' + taskId + ' is not in the agent ' + this._agent.id +
      '\'s plan' + ' add it to the agent\'s config array via the .setup method');
  }

  this._enqueuedTasks.push(taskId);

  return this;
};

/**
* Enqueues the tasks present in a certain routine, it will first search in the agent, and then in
* the scraper if not found.
* @param {string} routineName Name of the routine
*/
Job.prototype.routine = function (routineName) {
  if (this._agent._routines[routineName]) {
    this.enqueueTaskArray(this._agent._routines[routineName]);
  } else if (this._scraper._routines[routineName]) {
    this.enqueueTaskArray(this._scraper._routines[routineName]);
  } else {
    throw new Error('No routine with name ' + routineName + ' was found');
  }
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
    throw new Error('One or more enqueued tasks are not defined');
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
