(/** @lends <global> */

function () {
  'use strict';

  /**
  * @author Rafael Vidaurre
  * Set of miscellaneous utilities
  * @exports Utils
  */

  var _ = require('lodash');

  module.exports = {
    /**
    * Tells wether a key exists in an object
    * @func Utils/hasKey
    * @param {object} obj
    * @param {string} key
    * @returns {boolean}
    */
    hasKey: function (obj, key) {
      return _.contains(_.keys(obj), key);
    }
  };

}());
