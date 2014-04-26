'use strict';

/**
 * Returns a new object minus the in `excludes`
 * defined properties.
 * 
 * @param  {object} obj The source object.
 * @param  {array} excludes The names of the properties that should be excluded.
 *
 * @return {object} The new object minus the properties.
 *
 */
exports.exclude = function exclude (obj, excludes) {
  var prop;
  var extract = {};

  for (prop in obj) {
    if (obj.hasOwnProperty(prop) && !~excludes.indexOf(prop)) {
      extract[prop] = obj[prop];
    }
  }

  return extract;
};