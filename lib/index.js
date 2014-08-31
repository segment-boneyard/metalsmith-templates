
var consolidate = require('consolidate');
var debug = require('debug')('metalsmith-templates');
var each = require('async').each;
var extend = require('extend');
var join = require('path').join;
var match = require('multimatch');
var omit = require('lodash.omit');

var util = require('util');

/**
 * Expose `plugin`.
 */

module.exports = plugin;

/**
 * Settings.
 */

var settings = ['engine', 'directory', 'pattern', 'inPlace', 'default', 'useExtends', 'defaultExtends', 'defaultBlock'];

/**
 * Metalsmith plugin to run files through any template in a template `dir`.
 *
 * @param {String or Object} options
 *   @property {String} default (optional)
 *   @property {String} directory (optional)
 *   @property {String} engine
 *   @property {String} inPlace (optional)
 *   @property {String} pattern (optional)
 *   @property {Boolean} useExtends (optional)
 *   @property {String} defaultExtends (optional)
 *   @property {String} defaultBlock (optional)
 *   @property {String} extendsPattern (optional)
 *   @property {String} blockPattern (optional)
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

  var useExtends = opts.useExtends;
  var defaultExtends = opts.defaultExtends;
  var defaultBlock = opts.defaultBlock;
  var extendsPattern = opts.extendsPattern;
  var blockPattern = opts.blockPattern;

  if ((defaultExtends) && !useExtends) {
    throw new Error('"useExtends" option required to use defaultExtends or defaultBlock');
  }

  if (useExtends && !extendsPattern) {
    throw new Error('"extendsPattern" required with "useExtends"');
  }

  if (defaultBlock && !blockPattern) {
    throw new Error('"blockPattern" required with "useExtends" and "defaultBlock"');
  }

  if (blockPattern && !(Array.isArray(blockPattern) && blockPattern.length >= 1)) {
    throw new Error('"blockPattern" must be an array with at least one element (block opening pattern).');
  }

  var params = omit(opts, settings);

  return function(files, metalsmith, done){
    var metadata = metalsmith.metadata();

    function check(file){
      var data = files[file];
      var tmpl = data.template || def;
      var ext = useExtends || data.extends ? data.extends || defaultExtends : false;

      if (pattern && !match(file, pattern)[0]) return false;
      if (!inPlace && !tmpl && !ext) return false;
      return true;
    }

    Object.keys(files).forEach(function(file){
      if (!check(file)) return;
      debug('stringifying file: %s', file);
      var data = files[file];
      data.contents = data.contents.toString();
    });

    each(Object.keys(files), convert, done);

    function convert(file, done){
      if (!check(file)) return done();
      debug('converting file: %s', file);
      var data = files[file];
      var clone = extend({}, params, metadata, data);
      var str;
      var render;

      if (useExtends || clone.extends) {
        if (!extendsPattern) throw new Error('"extendsPattern" option required with extends');

        clone.extends = data.extends || defaultExtends;
        //fake a filename, make it in templates directory, so rest of templates
        //in inheritance chain can be resolves
        clone.filename = metalsmith.join(dir, file + "-" + clone.extends);

        str = util.format(extendsPattern, clone.extends);

        if (defaultBlock) {
          str += util.format(blockPattern[0], defaultBlock);
        }

        str += clone.contents;

        if (defaultBlock && blockPattern.length > 1) {
          str += util.format(blockPattern[1], defaultBlock);
        }

        render = consolidate[engine].render;

      } else if (inPlace) {
        str = clone.contents;
        render = consolidate[engine].render;

      } else {
        str = metalsmith.join(dir, data.template || def);
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
