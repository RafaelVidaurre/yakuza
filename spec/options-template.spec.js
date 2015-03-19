'use strict';

var OptionsTemplate, chai, sinonChai, opts;

require('sinon');
OptionsTemplate = require('../options-template');
sinonChai = require('sinon-chai');
chai = require('chai');

chai.should();
chai.use(sinonChai);

beforeEach(function () {
  opts = new OptionsTemplate();
});

describe('OptionsTemplate', function () {
  describe('#OptionsTemplate', function () {
    it('should set the base options if object is passed', function () {
      var newOpts, obj;

      obj = {a: 'foo'};
      newOpts = new OptionsTemplate({a: 'foo'});
      newOpts.build().should.eql(obj);
    });

    it('should set an empty object if options are not passed', function () {
      opts.build().should.eql({});
    });

    it('should throw exception if non-object is passed', function () {
      (function () {
        new OptionsTemplate('asd');
      }).should.throw();

      (function () {
        new OptionsTemplate(123);
      }).should.throw();

      (function () {
        new OptionsTemplate([1, 'b']);
      }).should.throw();
    });
  });

  describe('#build', function () {
    it('should return base object if no object passed', function () {
      var newOpts, obj;

      obj = {a: 123};
      newOpts = new OptionsTemplate(obj);

      newOpts.build().should.eql(obj);
    });

    it('should throw exception if non-object passed', function () {
      (function () {
        opts.build([1, 'a']);
      }).should.throw();

      (function () {
        opts.build(123);
      }).should.throw();

      (function () {
        opts.build('asd');
      }).should.throw();
    });

    it('should return extended base object if object is passed', function () {
      var newOpts;

      newOpts = new OptionsTemplate({
        value: 'notReplaced',
        another: 'shouldBeReplaced',
        deep: {
          values: 'also',
          should: 'notWork'
        }
      });

      newOpts.build({
        another: 'wasReplaced',
        newValue: 123,
        deep: {
          should: 'work'
        }
      }).should.eql({
        value: 'notReplaced',
        another: 'wasReplaced',
        newValue: 123,
        deep: {
          values: 'also',
          should: 'work'
        }
      });
    });

    it('should not pass the object by reference', function () {
      var template, objOne, objTwo;

      template = new OptionsTemplate();
      objOne = template.build({a: '1'});
      objTwo = template.build({b: '2'});

      objOne.should.not.equal(objTwo);
    });

    it('should not modify base object', function () {
      var template;

      template = new OptionsTemplate();
      template.build({a: '1'});
      template.build().should.not.eql({a: '1'});
    });
  });

  describe('#reset', function () {
    it('should change base options to object passed', function () {
      var obj;

      obj = {new: 'options'};
      opts.reset(obj);
      opts.build().should.eql(obj);
    });

    it('should throw an exception if non-object is passed', function () {
      (function () {
        opts.reset('awdawdwad');
      }).should.throw();

      (function () {
        opts.reset(123);
      }).should.throw();

      (function () {
        opts.reset([1, 'b']);
      }).should.throw();
    });
  });
});
