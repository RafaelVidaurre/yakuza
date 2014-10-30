/**
* Set of miscellaneous utilities
* @module Utils
* @author Rafael Vidaurre
*/
'use strict';

var _ = require('lodash');

module.exports = {
  /**
  * Tells wether a key is present in a given object
  * @inner
  */
  hasKey: function (obj, key) {
    return _.contains(_.keys(obj), key);
  }
};
