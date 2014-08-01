
var consolidate = require('consolidate');
var debug = require('debug')('metalsmith-templates');
var each = require('async').each;
var extend = require('extend');
var join = require('path').join;
var match = require('multimatch');
var omit = require('lodash.omit');

/**
 * Expose `plugin`.
 */

module.exports = plugin;

/**
 * Settings.
 */

var settings = ['engine', 'directory', 'pattern', 'inPlace', 'default'];

/**
 * Metalsmith plugin to run files through any template in a template `dir`.
 *
 * @param {String or Object} options
 *   @property {String} default (optional)
 *   @property {String} directory (optional)
 *   @property {String} engine
 *   @property {String} inPlace (optional)
 *   @property {String} pattern (optional)
 * @return {Function}
 */

function plugin(opts){
  opts = opts || {};
  if ('string' == typeof opts) opts = { engine: opts };
  if (!opts.engine) throw new Error('"engine" option required');

  var engine = opts.engine;
  var dir = opts.directory || 'templates';
  var pattern = opts.pattern;
  var inPlace = opts.inPlace;
  var def = opts.default;
  var params = omit(opts, settings);

  return function(files, metalsmith, done){
    var metadata = metalsmith.metadata();

    function check(file){
      var data = files[file];
      var tmpl = data.template || def;
      if (pattern && !match(file, pattern)[0]) return false;
      if (!inPlace && !tmpl) return false;
      return true;
    }

    each(Object.keys(files), convert, done);

    function convert(file, done){
      if (!check(file)) return done();

      var data = files[file];
      debug('stringifying file: %s', file);
      data.contents = data.contents.toString();

      debug('converting file: %s', file);
      var tmpl = data.template || def;
      var clone = extend({}, params, metadata, data);

      function render(renderFn, info, str, options, done){
        renderFn(str, options, function(err, str){
          if (err) return done(err);
          data.contents = new Buffer(str);
          debug('converted file (%s): %s', info, file);
          done();
        });
      }

      function renderInPlace(options, done){
        render(consolidate[engine].render, 'in place', options.contents,
               options, done);
      }

      function renderTemplate(options, done){
        render(consolidate[engine], 'using template ' + tmpl,
               metalsmith.join(dir, tmpl), options, done);
      }

      if (inPlace) {
        renderInPlace(clone, function(err){
          if (err) return done(err);
          data.contents = data.contents.toString();  // stringify again
          clone = extend({}, params, metadata, data);
          if (tmpl) {
            return renderTemplate(clone, done);
          } else {
            return done();
          }
        });
      } else {
        return renderTemplate(clone, done);
      }
    }
  };
}
