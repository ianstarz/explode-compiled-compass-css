'use strict';

var fs = require('fs');
var path = require('path');
var readline = require('readline');

var RSVP = require('rsvp');
var existsSync = require('exists-sync');
var mkdirp = require('mkdirp');

var FILE_PATTERN = /^\s*\/\* line (\d+), (.+\.scss) \*\//;

var writeFiles = {};
var prevFileKey;

module.exports = function(file) {
  var dir = path.dirname(file);

  return new RSVP.Promise(function(resolve, reject) {
    var read = readline.createInterface({
      input: fs.createReadStream(file)
    });

    read.on('error', reject);

    read.on('line', function(line) {
      var lineFile = fileFor(dir, line);

      if (!existsSync(lineFile)) {
        var lineDir = path.dirname(lineFile);
        mkdirp.sync(lineDir);
        fs.writeFileSync(lineFile, '', 'utf8');
      }

      var content = fs.readFileSync(lineFile, 'utf8');
      fs.writeFileSync(lineFile, content + line + '\n', 'utf8');
    });

    read.on('close', function() {
      fs.unlink(file);
      resolve();
    });
  });
};

function fileFor(dir, line) {
  var fileKey;

  if (FILE_PATTERN.test(line)) {
    fileKey = line.match(FILE_PATTERN)[2];

    if (!writeFiles[fileKey]) {
      writeFiles[fileKey] = targetFor(dir, fileKey);
    }
  } else {
    fileKey = prevFileKey;
  }

  prevFileKey = fileKey;
  return writeFiles[fileKey];
}

var RELPATH_PREFIX = /^\.\.\/\.\.\/\.\.\//;
var LEGACY_PREFIX = 'legacy-stylesheets/';
var COMPASS_PREFIX = '../../../../../.rvm/gems/ruby-2.0.0-p648/gems/compass-core-1.0.3/stylesheets/';
var SCSS_EXTENSION = '.scss';
var CSS_EXTENSION = '.css';

var order = 1;

function targetFor(dir, fileKey) {
  var filePath = fileKey;

  filePath = filePath.replace(RELPATH_PREFIX, '');
  filePath = filePath.replace(LEGACY_PREFIX, '');
  filePath = filePath.replace(COMPASS_PREFIX, '');
  filePath = filePath.replace(SCSS_EXTENSION, CSS_EXTENSION);

  // "un-privatitize" files
  filePath = filePath.replace(/^_/, '');
  filePath = filePath.replace(/\/_/, '/');

  // dasherize
  filePath = filePath.replace('_', '-');

  var orderPrefix;
  if (order < 10) {
    orderPrefix = '00' + order;
  } else if (order < 100) {
    orderPrefix = '0' + order;
  } else {
    orderPrefix = '' + order;
  }

  filePath = orderPrefix + '-' + filePath.split('/').join('-');
  order++;

  return path.join(dir, filePath);
}
