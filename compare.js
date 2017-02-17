var _ = require('underscore');
var rp = require('request-promise');
var Promise = require('bluebird');
var diff = require('recursive-diff');

const express = require('express');

// Constants
const PORT = 8080;

// App
const app = express();
app.get('/', function (req, res) {
  runComparsion().then(function(results) {
    res.send(JSON.stringify(results));
  });
});

app.listen(PORT);
console.log('Running on http://localhost:' + PORT);

function runComparsion() {
  return Promise.props({
    stack1: rp('https://connection-sync-test.devel.keboola.com/v2/storage'),
    stack2: rp('https://connection.keboola.com/v2/storage')
  }).then(function(response) {
    return {
      stack1: _.indexBy(JSON.parse(response.stack1).components, 'id'),
      stack2: _.indexBy(JSON.parse(response.stack2).components, 'id')
    }
  }).then(function(stacks) {
    var diffs =  _.chain(_.intersection(_.keys(stacks.stack1), _.keys(stacks.stack2)))
      .map(function(key) {
        return compare(stacks.stack1[key], stacks.stack2[key]);
      })
      .filter(function(component) {
        return !_.isEmpty(component.diff);
      })
      .value();

    return {
      moreover: _.difference(_.keys(stacks.stack1), _.keys(stacks.stack2)),
      missing: _.difference(_.keys(stacks.stack2), _.keys(stacks.stack1)),
      diffs: diffs
    };
  });
}


function compare(component1, component2) {
  return {
    component: component1.id,
    diff: diff.getDiff(cleanComponent(component1), cleanComponent(component2))
  };
}

function cleanComponent(component) {
  return _.chain(component)
    .extend(component, {
      flags: component.flags.sort(),
      data: _.omit(component.data, ['vendor'])
    })
    .omit(['ico32', 'ico64'])
    .value();
}

