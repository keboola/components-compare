var _ = require('lodash');
var rp = require('request-promise');
var Promise = require('bluebird');
var diff = require('recursive-diff');

const express = require('express');

// Constants
const PORT = 8080;

// App
const app = express();
app.get('/', compareAction);
app.get('/components-compare', compareAction);

function compareAction(req, res) {
  runComparsion(
    req.query.current ? req.query.current : 'https://connection-sync-test.devel.keboola.com/v2/storage',
    req.query.reference ? req.query.reference : 'https://connection.keboola.com/v2/storage'
  )
  .then(function(results) {
    res.send(JSON.stringify(results));
  });
}

app.listen(PORT);
console.log('Running on http://localhost:' + PORT);

function runComparsion(stack1host, stack2host) {
  return Promise.props({
    stack1: rp(stack1host),
    stack2: rp(stack2host)
  }).then(function(response) {
    return {
      stack1: {
        components: _.keyBy(JSON.parse(response.stack1).components, 'id'),
        host: stack1host
      },
      stack2: {
        components: _.keyBy(JSON.parse(response.stack2).components, 'id'),
        host: stack2host
      }
    }
  }).then(function(stacks) {
    return {
      currentStack: stacks.stack1.host,
      referenceStack: stacks.stack2.host,
      moreover: _.difference(_.keys(stacks.stack1.components), _.keys(stacks.stack2.components)),
      missing: _.difference(_.keys(stacks.stack2.components), _.keys(stacks.stack1.components)),
      diffs: createDiffs(stacks)
    };
  });
}

function createDiffs(stacks) {
  return _.chain(_.intersection(_.keys(stacks.stack1.components), _.keys(stacks.stack2.components)))
    .map(function(key) {
      return compare(stacks.stack1.components[key], stacks.stack2.components[key]);
    })
    .filter(function(component) {
      return !_.isEmpty(component.diff);
    })
    .value();
}

function compare(component1, component2) {
  return {
    component: component1.id,
    diff: diff.getDiff(cleanComponent(setComponentDefaults(component1)), cleanComponent(setComponentDefaults(component2)))
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

var componentsDefaults = {
  data: {
    forward_token: false,
    network: "bridge",
    forward_token_details: false,
    default_bucket: false,
    configuration_format: "json",
    staging_storage: {
        "input": "local"
    }
  }
};

function setComponentDefaults(component) {
  return _.defaultsDeep(component, componentsDefaults);
}

