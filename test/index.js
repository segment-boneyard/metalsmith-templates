
var assert = require('assert');
var equal = require('assert-dir-equal');
var Metalsmith = require('metalsmith');
var fileCompare = require('file-compare');
var templates = require('..');

describe('metalsmith-templates', function(){
  it('should render a basic template', function(done){
    Metalsmith('test/fixtures/basic')
      .use(templates({ engine: 'swig' }))
      .build(function(err){
        if (err) return done(err);
        equal('test/fixtures/basic/expected', 'test/fixtures/basic/build');
        done();
      });
  });

  it('should accept an engine string', function(done){
    Metalsmith('test/fixtures/basic')
      .use(templates('swig'))
      .build(function(err){
        if (err) return done(err);
        equal('test/fixtures/enginestring/expected', 'test/fixtures/enginestring/build');
        done();
      });
  });

  it('should accept an inPlace option', function(done){
    Metalsmith('test/fixtures/in-place')
      .use(templates({ engine: 'swig', inPlace: true }))
      .build(function(err){
        if (err) return done(err);
        equal('test/fixtures/in-place/expected', 'test/fixtures/in-place/build');
        done();
      });
  });

  it('should accept a pattern to match', function(done){
    Metalsmith('test/fixtures/pattern')
      .use(templates({ engine: 'swig', pattern: '*.md' }))
      .build(function(err){
        if (err) return done(err);
        equal('test/fixtures/pattern/expected', 'test/fixtures/pattern/build');
        done();
      });
  });

  it('should accept a default template', function(done){
    Metalsmith('test/fixtures/default')
      .use(templates({ engine: 'swig', pattern: '*.md', default: 'default.html' }))
      .build(function(err){
        if (err) return done(err);
        equal('test/fixtures/pattern/expected', 'test/fixtures/pattern/build');
        done();
      });
  });

  it('should accept a different templates directory', function(done){
    Metalsmith('test/fixtures/directory')
      .use(templates({ engine: 'swig', directory: 'layouts' }))
      .build(function(err){
        if (err) return done(err);
        equal('test/fixtures/directory/expected', 'test/fixtures/directory/build');
        done();
      });
  });

  it('should mix in global metadata', function(done){
    Metalsmith('test/fixtures/metadata')
      .metadata({ title: 'Global Title' })
      .use(templates({ engine: 'swig' }))
      .build(function(err){
        if (err) return done(err);
        equal('test/fixtures/metadata/expected', 'test/fixtures/metadata/build');
        done();
      });
  });

  it('should work with files in nested directories', function(done){
    Metalsmith('test/fixtures/nested-dir')
      .metadata({ title: 'Global Title' })
      .use(templates({ engine: 'swig' }))
      .build(function(err){
        if (err) return done(err);
        equal('test/fixtures/nested-dir/expected', 'test/fixtures/nested-dir/build');
        done();
      });
  });

  it('should not change binary files', function(done){
    Metalsmith('test/fixtures/with-binary-files')
      .use(templates({ engine: 'mustache' }))
      .build(function(err){
        if (err) return done(err);
        equal('test/fixtures/with-binary-files/expected', 'test/fixtures/with-binary-files/build');
        // compare binaries to sense changes
        var fileExpected = 'test/fixtures/with-binary-files/expected/TestImage.jpg';
        var fileBuilt = 'test/fixtures/with-binary-files/build/TestImage.jpg';
        fileCompare.compare(fileExpected, fileBuilt, function(result, err) {
          if (err) return done(err);
          assert.equal(result, true, 'Binary changed.')
          done();
        });
      });
  });
});