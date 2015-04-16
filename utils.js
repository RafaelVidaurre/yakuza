/**
* Set of miscellaneous utilities
* @module Utils
* @author Rafael Vidaurre
*/
'use strict';

var _;

_ = require('lodash');

module.exports = {
  /**
  * Tells whether a key is present in a given object
  * @param {object} obj Object on which to look for a key
  * @param {string} key Key to look for
  * @return {boolean}
  * @inner
  */
  hasKey: function (obj, key) {
    return _.contains(_.keys(obj), key);
  },

  /**
  * Converts an object into an array, if it is one already leave it as such
  * @param elem Element to be arrayify
  * @return {array} Array version of the element
  * @inner
  */
  arrayify: function (elem) {
    return _.isArray(elem) ? elem : [elem];
  }
};
