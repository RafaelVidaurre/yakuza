(function () {
  'use strict';

  var _ = require('lodash');

  module.exports = {
    hasKey: function (obj, key) {
      return _.contains(_.keys(obj), key);
    }
  };

}());
