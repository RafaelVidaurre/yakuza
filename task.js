/**
* @author Rafael Vidaurre
* @module Task
*/

'use strict';

/**
* Is the product of a Task being built, contains status data, the main method of the task and other,
* stuff required for it to be run
* @class
*/
function Task (main, params) {
  /**
  * Parameters which will be used by its main method
  */
  this.params = params;

  /**
  * Main method to be run
  */
  this.main = main;

  /**
  * Number of retries performed by the built task
  */
  this.retries = 0;
}

module.exports = Task;
