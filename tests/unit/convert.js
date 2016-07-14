'use strict';

var fs = require('fs');
var path = require('path');
var readline = require('readline');

var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var RSVP = require('rsvp');
var walkSync = require('walk-sync');
var existsSync = require('exists-sync');

var convert = require('../../index');
var assert = require('chai').assert;

describe('compass css conversion', function() {
  var fileName = 'compiled.css';
  var fixtureFile = path.join(__dirname, '../fixtures', fileName);
  var tmpDir = path.join(__dirname, '../tmp');
  var testDir = path.join(tmpDir, 'test');
  var testFile;

  beforeEach(function() {
    testDir = testDir + '-' + Date.now();
    testFile = path.join(testDir, fileName);

    mkdirp.sync(testDir);
    return copyFile(fixtureFile, testFile);
  });

  afterEach(function() {
    rimraf.sync(tmpDir);
  });

  it('splits out the legacy css into the correct files', function() {
    this.timeout(100000);

    return convert(testFile).then(function() {
      assert.ok(!existsSync(testFile), 'remove the original file');

      // debugging..
      walkSync(tmpDir, { globs: ['**/*.css'] }).forEach(function(relPath) {
        var fullPath = path.join(tmpDir, relPath);

        console.log('\n\n' + relPath + '\n');
        console.log(fs.readFileSync(fullPath, 'utf8'));
      });
    });
  });
});

function copyFile(source, target) {
  return new RSVP.Promise(function(resolve, reject) {
    var read = fs.createReadStream(source);
    var write = fs.createWriteStream(target);
    read.on('error', reject);
    write.on('error', reject);
    write.on('finish', resolve);
    read.pipe(write);
  });
}
