(function () {
  'use strict';

  /**
  * @author Rafael Vidaurre
  * Set of miscellaneous utilities
  * @exports Utils
  */

  var _ = require('lodash');

  module.exports = {
    hasKey: function (obj, key) {
      return _.contains(_.keys(obj), key);
    }
  };

}());
