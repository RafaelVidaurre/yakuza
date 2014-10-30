/**
* Set of miscellaneous utilities
* @module Utils
* @author Rafael Vidaurre
*/
'use strict';

var _ = require('lodash');

/**
* Tells wether a key is present in a given object
* @function
*/
function hasKey (obj, key) {
  return _.contains(_.keys(obj), key);
}

console.log();

module.exports = {
  hasKey: hasKey
};
