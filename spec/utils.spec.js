'use strict';

var utils;

utils = require('../utils');

describe('utils', function () {
  describe('#hasKey', function () {
    it('should return true if an object has the key', function () {
      utils.hasKey({foo: true}, 'foo').should.eql(true);
    });
    it('should return false if an object does not have the key', function () {
      utils.hasKey({foo: true}, 'bar').should.eql(false);
    });
  });

  describe('#arrayify', function () {
    it('should return an array with the object if it is not an array', function () {
      utils.arrayify({foo: 'bar'}).should.eql([{foo: 'bar'}]);
      utils.arrayify(123).should.eql([123]);
      utils.arrayify('foo').should.eql(['foo']);
    });

    it('should return the object itself if it is an array', function () {
      utils.arrayify([1, 2, 3]).should.eql([1, 2, 3]);
    });
  });
});
