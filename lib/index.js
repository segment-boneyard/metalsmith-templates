
var consolidate = require('consolidate');
var debug = require('debug')('metalsmith-templates');
var async = require('async');
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
  var master = opts.master;
  var params = omit(opts, settings);

  return function(files, metalsmith, done){
    var metadata = metalsmith.metadata();

    function check(file){
      var data = files[file];
      if (pattern && !match(file, pattern)[0]) return false;
      if (!inPlace && !data.template && !def && !master) return false;
      return true;
    }

    async.each(Object.keys(files), convert, done);

    function convert(file, done){
      if (!check(file)) return done();
      debug('converting file: %s', file);
      var data = files[file];
      data.contents = data.contents.toString();
      var clone = extend({}, params, metadata, data);
      var str;
      var render;
      var templates = [];

      if (inPlace) {
        templates.push(clone.contents);
        render = consolidate[engine].render;
      } else {
        if (data.template || def) templates.push(metalsmith.join(dir, data.template || def));
        if (opts.master) templates.push(metalsmith.join(dir, opts.master));
        render = consolidate[engine];
      }

      async.eachSeries(templates,function(tmplname,done){
        render(tmplname, clone, function(err, tmplname){
          if (err) return done(err);
          data.contents = clone.contents = (new Buffer(tmplname)).toString();
          debug('converted file %s using template %s', file, tmplname);
          done();
        });
      },done);

    }
  };
}