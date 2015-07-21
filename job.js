/**
* @author Rafael Vidaurre
* @module Job
*/

'use strict';

var Events, Q, _, utils;

_ = require('lodash');
Events = require('eventemitter2').EventEmitter2;
Q = require('q');
utils = require('./utils');

/**
* @class
* @param {string} uid Unique identifier for the job instance
* @param {Scraper} scraper Reference to the scraper being used by the job
* @param {Agent} agent Reference to the agent being used by the job
*/
function Job (uid, scraper, agent, params) {
  /**
  * Whether the job has started or not
  * @private
  */
  this.__started = false;

  /**
  * Configuration for __events property
  * @private
  */
  this.__eventsConfig = {
    wildcard: true,
    delimiter: ':'
  };

  /**
  * Configuration for __publicEvents property
  * @private
  */
  this.__publicEventsConfig = {
    wildcard: true,
    delimiter: ':'
  };

  /**
  * Event handler object for private events
  * @private
  */
  this.__events = new Events(this.__eventsConfig);

  /**
  * Event handler object for public events
  * @private
  */
  this.__publicEvents = new Events(this.__publicEventsConfig);

  /**
  * Current execution plan group idx from which we will build the next execution queue
  * @private
  */
  this.__planIdx = -1;

  /**
  * Current execution queue group idx to run
  * @private
  */
  this.__executionQueueIdx = -1;

  /**
  * Parameters that will be provided to the Task instances
  * @private
  */
  this.__params = params || {};

  /**
  * Tasks enqueued via Job's API
  * @private
  */
  this.__enqueuedTasks = [];

  /**
  * Represents enqueued tasks' sincrony and execution order
  * @private
  */
  this.__plan = null;

  /**
  * Queue of tasks built in runtime defined by taskDefinition builders and execution plan
  * @private
  */
  this.__executionQueue = [];

  /**
  * Reference to the Agent instance being used by the Job
  * @private
  */
  this.__agent = agent;

  /**
  * Object containing shared storages of all tasks
  * @private
  */
  this.__taskStorages = {};

  /**
  * Object with finished task references
  * @private
  */
  this.__finishedTasks = {};

  /**
  * Cookie jar to be used in the next execution block
  * @private
  */
  this.__cookieJar = {};

  /**
  * Determines wether the job's components have been applied or not
  * @private
  */
  this.__componentsApplied = false;

  /**
  * Reference to the Scraper instance being used by the Job
  */
  this._scraper = scraper;

  /** Unique Job identifier */
  this.uid = null;

  // Set job's uid
  if (uid !== undefined) {
    this.__setUid(uid);
  }

  // Set event listeners
  this.__setEventListeners();
}

/**
* Sets the Jobs Uid value
* @param {string} argUid Uid which uniquely identifies the job
* @private
*/
Job.prototype.__setUid = function (argUid) {
  if (!argUid || !_.isString(argUid) || argUid.length <= 0) {
    throw new Error('Job uid must be a valid string');
  }
  this.uid = argUid;
};

/**
* Prepares execution groups to run based on plan and enqueued tasks
* @private
*/
Job.prototype.__applyPlan = function () {
  var _this, executionPlan, groupTaskIds, matchIdx, newExecutionPlan, newTaskGroup;

  _this = this;

  executionPlan = this.__agent._plan;

  newExecutionPlan = [];
  newTaskGroup = [];

  _.each(executionPlan, function (executionGroup) {
    groupTaskIds = _.map(executionGroup, function (taskObj) {
      return taskObj.taskId;
    });

    _.each(_this.__enqueuedTasks, function (enqueuedTask) {
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

  this.__plan = newExecutionPlan;
};

/**
* Returns a cloned version of a cookie jar
* @param cookieJar a cookie jar
* @return a clone of the current cookie jar
*/
Job.prototype.__cloneCookieJar = function (cookieJar) {
  return _.cloneDeep(cookieJar);
};

/**
* Returns an undefined number of Task instances based on a taskDefinition's builder output
* @param {object} taskSpecs contains specifications to build a certain Task via it's TaskDefinition
* @private
* @return {array} an array of Tasks
*/
Job.prototype.__buildTask = function (taskSpecs) {
  var _this, builderResponse, builderParams, clonedCookieJar, taskDefinition;

  _this = this;

  taskDefinition = this.__agent._taskDefinitions[taskSpecs.taskId];

  builderParams = {
    params: this.__params,
    shared: this.__findInShared.bind(_this)
  };

  clonedCookieJar = this.__cloneCookieJar(this.__cookieJar);
  builderResponse = taskDefinition._build(builderParams, clonedCookieJar, this);

  return builderResponse;
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
Job.prototype.__buildExecutionBlock = function (planGroup) {
  var _this, executionBlock, executionObject, previousObject, tasks;

  _this = this;

  executionBlock = [];

  _.each(planGroup, function (taskSpecs) {
    tasks = _this.__buildTask(taskSpecs);
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
Job.prototype.__retrieveExecutionQueueBlockPromises = function (executionBlock) {
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
Job.prototype.__saveCookieJar = function (cookieJar) {
  this.__cookieJar = cookieJar;
};

/**
* Runs a task and enqueues its `next` task if there is any (recursive)
* @param {object} taskSpec object with task specifications and the task itself
* @private
*/
Job.prototype.__runTask = function (taskSpec) {
  var _this, nextTaskSpec, taskRunning, thisTask;

  _this = this;

  thisTask = taskSpec.task;
  taskRunning = thisTask._runningPromise;
  nextTaskSpec = taskSpec.next;

  if (nextTaskSpec) {
    taskRunning.then(function () {
      _this.__runTask(nextTaskSpec);
    })
    .fail(function () {
      // Do nothing, this rejection is being handled in `__runExecutionBlock`'s Q.all call
    })
    .done();
  }

  _this.__events.emit('task:start', thisTask);
  thisTask._run();
};

/**
* Called when a task fails, handles plumbing for a fail scenario
* @fires job:fail
* @fires fail
*/
Job.prototype.__failJob = function (response) {
  this.__events.emit('job:fail', response);
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
Job.prototype.__runExecutionBlock = function (executionBlock) {
  var _this, runningTasks;

  _this = this;
  runningTasks = this.__retrieveExecutionQueueBlockPromises(executionBlock);

  Q.all(runningTasks).then(function (results) {
    // Set cookies of results
    _.each(results, function (result) {
      if (result.savedCookieJar) {
        _this.__saveCookieJar(result.savedCookieJar);
      }
    });

    _this.__events.emit('eq:blockContinue');

  }, function (response) {
    if (response.status === 'fail') {
      _this.__failJob(response);
    }

    _this.__events.emit('eq:blockStop');
  }).done();

  _.each(executionBlock, function (taskSpec) {
    _this.__runTask(taskSpec);
  });
};

/**
* Runs execution block placed in current executionQueueIdx
* @private
*/
Job.prototype.__runCurrentExecutionBlock = function () {
  this.__runExecutionBlock(this.__executionQueue[this.__executionQueueIdx]);
};

/**
* increments execution plan index, builds an execution queue block from it and pushes it to the
* execution queue
* @fires eq:blockApply
* @private
*/
Job.prototype.__applyNextExecutionQueueBlock = function () {
  var executionBlock;

  this.__planIdx += 1;
  this.__executionQueueIdx += 1;

  if (!this.__plan[this.__planIdx]) {
    this.__events.emit('job:success');
    return;
  }

  executionBlock = this.__buildExecutionBlock(this.__plan[this.__planIdx]);
  this.__executionQueue.push(executionBlock);
  this.__events.emit('eq:blockApply');
};

/**
* Does necessary stuff needed before running can occur
* @private
*/
Job.prototype.__prepareRun = function () {
  this.__applyComponents();
  this.__applyPlan();
};

/**
* Hooks to the newly created tasks' promises to trigger events and save useful data
* @fires task:success
* @fires task:fail
* @fires task:finish
* @private
*/
Job.prototype.__prepareCurrentExecutionQueueBlock = function () {
  var _this, promises, currentEQBlock;

  _this = this;
  currentEQBlock = this.__executionQueue[this.__executionQueueIdx];
  promises = this.__retrieveExecutionQueueBlockPromises(currentEQBlock);

  _.each(promises, function (promise) {
    promise.then(function (response) {
      var task = response.task;

      // Save task in its corresponding finished task array
      _this.__finishedTasks[task.taskId] = _this.__finishedTasks[task.taskId] || [];
      _this.__finishedTasks[task.taskId].push(task);

      // Emit event for successful task
      _this.__events.emit('task:success', response);
      _this.__events.emit('task:finish', response);

    }, function (response) {
      if (response.status === 'success') {
        _this.__events.emit('task:success', response);
      } else {
        _this.__events.emit('task:fail', response);
      }

      _this.__events.emit('task:finish', response);
    }).done();
  });
};

/**
* Event handler called on event task:start
* @private
*/
Job.prototype.__onTaskStart = function (task) {
  var response, params;

  params = task._params;
  response = {
    task: task,
    params: params
  };

  this.__publicEvents.emit('task:' + task.taskId + ':start', response);
};

/**
* Event handler called on event task:success
* @private
*/
Job.prototype.__onTaskSuccess = function (response) {
  var taskId;

  taskId = response.task.taskId;
  this.__publicEvents.emit('task:' + taskId + ':success', response);
};

/**
* Event handler called on event task:fail
* @private
*/
Job.prototype.__onTaskFail = function (response) {
  var taskId;

  taskId = response.task.taskId;
  this.__publicEvents.emit('task:' + taskId + ':fail', response);
};

/**
* Event handler called on event task:fail
* @private
*/
Job.prototype.__onTaskFinish = function (response) {
  var taskId;

  taskId = response.task.taskId;
  this.__publicEvents.emit('task:' + taskId + ':finish', response);
};

/**
* Event handler called on event job:start
* @private
*/
Job.prototype.__onJobStart = function () {
  this.__publicEvents.emit('job:start');
  this.__prepareRun();
  this.__applyNextExecutionQueueBlock();
};

/**
* Event handler called on event job:success
* @private
* @fires job:success
* @fires job:finish
* @fires success
* @fires finish
*/
Job.prototype.__onJobSuccess = function () {
  this.__publicEvents.emit('job:success');
  this.__publicEvents.emit('job:finish');
  this.__publicEvents.emit('success');
  this.__publicEvents.emit('finish');
};

/**
* Event handler called on event job:fail
* @private
* @fires job:fail
* @fires job:finish
* @fires fail
* @fires finish
*/
Job.prototype.__onJobFail = function (response) {
  this.__publicEvents.emit('job:fail', response);
  this.__publicEvents.emit('fail', response);
};

/**
* Event handler called on event eq:blockApply
* @private
*/
Job.prototype.__onEqBlockApply = function () {
  // Set the new built tasks' events and listens to their promises
  this.__prepareCurrentExecutionQueueBlock();
  // Run the new execution block
  this.__runCurrentExecutionBlock();
};

/**
* Event handler called on event eq:blockStop. Stops the job as a block has been stopped
* @private
* @fires job:finish
* @fires finish
*/
Job.prototype.__onEqBlockStop = function () {
  // Finish is triggered when the job fails or succeeds, Basically when it stops running
  this.__publicEvents.emit('job:finish');
  this.__publicEvents.emit('finish');
};

/**
* Event handler called on event eq:blockContinue. Continues execution of next eqBlock if possible
* otherwise finishes the job
* @private
*/
Job.prototype.__onEqBlockContinue = function () {
  this.__applyNextExecutionQueueBlock();
};

/**
* Sets all the job's event listeners
* @private
*/
Job.prototype.__setEventListeners = function () {
  var _this = this;

  this.__events.on('task:start', function (response) {
    _this.__onTaskStart(response);
  });

  this.__events.on('task:success', function (response) {
    _this.__onTaskSuccess(response);
  });

  this.__events.on('task:fail', function (response) {
    _this.__onTaskFail(response);
  });

  this.__events.on('task:finish', function (response) {
    _this.__onTaskFinish(response);
  });

  // When the job is started
  this.__events.once('job:start', function () {
    _this.__onJobStart();
  });

  // When the job finishes without errors
  this.__events.once('job:success', function () {
    _this.__onJobSuccess();
  });

  // When the job finishes with errors
  this.__events.once('job:fail', function (response) {
    _this.__onJobFail(response);
  });

  // When the next execution block is applied
  this.__events.on('eq:blockApply', function () {
    _this.__onEqBlockApply();
  });

  // When a task from the current execution block fails
  this.__events.on('eq:blockStop', function () {
    _this.__onEqBlockStop();
  });

  this.__events.on('eq:blockContinue', function () {
    _this.__onEqBlockContinue();
  });
};

/**
* Applies required scraping components as they need to be ready to run by the job
* @private
*/
Job.prototype.__applyComponents = function () {
  if (this.__componentsApplied) {
    return;
  }

  this.__agent._applySetup();

  this.__componentsApplied = true;
};

/**
* Verifies if the job's enqueued tasks are present in it's agent
* @returns {boolean} true if all enqueued tasks exist
* @private
*/
Job.prototype.__enqueuedTasksExist = function () {
  var _this = this;
  return _.every(this.__enqueuedTasks, function (enqueuedTask) {
    return !!_this.__agent._taskDefinitions[enqueuedTask];
  });
};

/**
* Looks for a value shared by a task
* @param {string} query key Namespaced by taskId using dot notation
* @return The value if found, otherwise undefined
* @private
*/
Job.prototype.__findInShared = function (query) {
  var key, result, splitQuery, taskId;

  if (!_.isString(query)) {
    throw new Error('The shared method key passed is invalid');
  }

  splitQuery = query.split('.');
  taskId = splitQuery[0];
  key = splitQuery[1];

  if (!taskId || !key) {
    throw new Error('The shared method key passed is invalid');
  }

  result = this._getShared(taskId, key);

  if (result === undefined) {
    throw new Error('\'' + key + '\' was never shared by task \'' + taskId + '\'');
  }

  return this._getShared(taskId, key);
};

/**
* Check wether a task is present on the job's agent's plan
* @param {string} taskId task id of the task
* @returns {boolean} true if the task is in the plan
*/
Job.prototype.__taskIsInPlan = function (taskId) {
  var tasks;

  this.__applyComponents();

  return _.some(this.__agent._plan, function (planBlock) {
    tasks = utils.arrayify(planBlock);

    return _.some(tasks, function (taskObject) {
      var planTaskId;

      planTaskId = _.isString(taskObject) ? taskObject : taskObject.taskId;
      return planTaskId === taskId;
    });
  });
};


/**
* Gets a shared value belonging to a specific task and key
* @params {string} taskId Task id of the task containing the value shared
* @params {string} key Key to which the value is assigned
* @returns the value found, or undefined
*/
Job.prototype._getShared = function (taskId, key) {
  if (this.__taskStorages[taskId] && this.__taskStorages[taskId][key] !== undefined) {
    return _.cloneDeep(this.__taskStorages[taskId][key]);
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
  this.__taskStorages[taskId] = this.__taskStorages[taskId] || {};
  this.__taskStorages[taskId][key] = value;
};

/**
* Gets job's params
* @return {object} job's params
*/
Job.prototype._getParams = function () {
  return this.__params;
};

/**
* Enqueues all tasks present in the array
* @param {Array} taskArray array of task Ids
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

  _.extend(this.__params, paramsObj);

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

  if (!this.__taskIsInPlan(taskId)) {
    throw new Error('Enqueued task ' + taskId + ' is not in the agent ' + this.__agent.id +
      '\'s plan' + ' add it to the agent\'s config array via the .setup method');
  }

  this.__enqueuedTasks.push(taskId);

  return this;
};

/**
* Enqueues the tasks present in a certain routine, it will first search in the agent, and then in
* the scraper if not found.
* @param {string} routineName Name of the routine
*/
Job.prototype.routine = function (routineName) {
  // TODO: Agent routines could inherit their scraper's routine if they don't have one of their
  // own thus avoiding checking the scraper routines here
  if (this.__agent._routines[routineName]) {
    this.enqueueTaskArray(this.__agent._routines[routineName]);
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
  if (this.__started) {
    throw new Error('A job cannot be run more than once');
  }

  if (!this.__enqueuedTasksExist()) {
    throw new Error('One or more enqueued tasks are not defined');
  }

  this.__started = true;
  this.__events.emit('job:start');
};

/**
* Suscribes a callback function to a public event
* @param {string} eventName Name of the event to listent to
* @param {function} callback Callback function to be run when the event fires
*/
Job.prototype.on = function (eventName, callback) {
  this.__publicEvents.on(eventName, callback);
};


module.exports = Job;
