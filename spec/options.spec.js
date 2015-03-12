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

describe('#OptionsTemplate', function () {

});
