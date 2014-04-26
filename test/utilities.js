'use strict';

var assert = require('assert');
var utilities = require('../lib/utilities');

describe('metalsmith-templates utilities', function(){
    it('should be able to clone an object and exclude properties', function(done){
      var source = {
        one: '1',
        two: '2'
      };

      var clone = utilities.exclude(source, ['two']);

      assert.equal(clone.two, undefined);

      done();
    });
});