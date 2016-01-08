
var consolidate = require('consolidate');
var debug = require('debug')('metalsmith-templates');
var each = require('async').each;
var extend = require('extend');
var match = require('multimatch');
var omit = require('lodash.omit');
var utf8 = require('is-utf8');
var path = require('path');

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
  
  if (!consolidate[engine]) {
    throw new Error('Unknown template engine: "' + engine + '"');
  }

  return function(files, metalsmith, done){
    var metadata = metalsmith.metadata();
    var matches = {};

    function check(file){
      var data = files[file];
      var tmpl = data.template || def;
      if (!utf8(data.contents)) return false;
      if (pattern && !match(file, pattern)[0]) return false;
      if (!inPlace && !tmpl) return false;
      return true;
    }

    Object.keys(files).forEach(function(file){
      if (!check(file)) return;
      debug('stringifying file: %s', file);
      var data = files[file];
      data.contents = data.contents.toString();
      matches[file] = data;
    });

    each(Object.keys(matches), convert, done);

    function convert(file, done){
      debug('converting file: %s', file);
      var data = files[file];
      var clonedParams = extend(true, {}, params);
      var clone = extend({}, clonedParams, metadata, data);
      var str;
      var render;

      if (inPlace) {
        str = clone.contents;
        render = consolidate[engine].render;
      } else {
        if (typeof metalsmith.path === "function") {
            str = metalsmith.path(dir, data.template || def);
        } else {
            str = path.join(metalsmith.dir, dir, data.template || def);
        }
        render = consolidate[engine];
      }

      render(str, clone, function(err, str){
        if (err) return done(err);
        data.contents = new Buffer(str);
        debug('converted file: %s', file);
        done();
      });
    }
  };
}
