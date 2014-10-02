
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
      // don't run on files inside the template dir.
      if (match(join(metalsmith._src, file), join(dir, "*"))[0]) return false;
      if (pattern && !match(file, pattern)[0]) return false;
      if (!inPlace && !tmpl) return false;
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

      if (opts.recursiveRender) {
        render = consolidate[engine].render;
        str = data.contents;
        recursiveRender(render, str, data, function(err, str) {
          if (err) return done(err);
          data.contents = new Buffer(str);
          debug('converted file: %s', file);
          done();
        });
      } else {
        if (inPlace) {
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
    }

    /**
     * This will render a file's content and then pass along the result to the
     * file's template as content. The process repeats until a template is not
     * specified in the front-matter. In other words, this allows templates to
     * have templates.
     *
     * @param {Function} render The render function
     * @param {String} str The string to compile
     * @param {Object} data The data object that the compiler uses.
     * @param {Function} cb The callback when the process finishes.
     * @return {undefined} undefined
     */
    function recursiveRender(render, str, data, cb){
      var template = data.template ? join(dir, data.template) : null;
      var renderData = extend({}, params, metadata, data);
      var extendedRenderData;
      var templateData;
      var templateContent;
      render(str, renderData, function(err, renderedStr){
        if (err) return cb(err);
        if (template) {
          // clone the data so we don't mess up the content.
          templateData = extend({}, getFileDataFromPath(template));
          if (!templateData) return cb('Could not find template: ' + template);
          templateContent = templateData.contents.toString();
          templateData.contents = renderedStr;
          // Pass along the metadata through the hierarchy.
          // Templates can override metadata values from files that use it.
          extendedRenderData = extend(renderData, templateData);
          if (!templateData.template) {
            // however, delete a passed along template value if
            // the next template doesn't exist (prevents infinite loop).
            delete extendedRenderData.template;
          }
          recursiveRender(render, templateContent, extendedRenderData, cb);
        } else {
          cb(null, renderedStr);
        }
      });
    };

    /**
     * This will take a file path (a template path generated from the
     * front-matter of a file) and attempt to fetch that file's
     * metadata object by looking through the metalsmith files object
     * for a matching key.
     *
     * @param {String} path The path to look for.
     * @return {Object} The file's metadata object or undefined.
     */
    function getFileDataFromPath(path){
      var possibleFiles = Object.keys(files);
      var x = possibleFiles.length;
      while (x-- > 0) {
        // path is something like: site_src/template_dir/_template.jade
        // the possible file strings are like above but they dont have the src dir
        if (path.indexOf(possibleFiles[x]) > -1) {
          return files[possibleFiles[x]];
        }
      }
    }
  };
}
