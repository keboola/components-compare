var _ = require('underscore');
var rp = require('request-promise');
var Promise = require('bluebird');
var diff = require('recursive-diff');


Promise.props({
  stack1: rp('https://connection-sync-test.devel.keboola.com/v2/storage'),
  stack2: rp('https://connection.keboola.com/v2/storage')
}).then(function(response) {
  return {
    stack1: _.indexBy(JSON.parse(response.stack1).components, 'id'),
    stack2: _.indexBy(JSON.parse(response.stack2).components, 'id')
  }
}).then(function(stacks) {
  var diffs = _.chain(_.intersection(_.keys(stacks.stack1), _.keys(stacks.stack2)))
    .map(function(key) {
      return compare(stacks.stack1[key], stacks.stack2[key]);
     })
    .filter(function(component) {
      return !_.isEmpty(component.diff);
    })
    .value();


  _.map(diffs, function(component) {
    console.log('Component: ' + component.component);
    console.log(component.diff);
    console.log('\n');
  });
});


function compare(component1, component2) {
  return {
    component: component1.id,
    diff: diff.getDiff(cleanComponent(component1), cleanComponent(component2))
  };
}

function cleanComponent(component) {
  return _.chain(component)
    .extend(component, {
      flags: component.flags.sort()
    })
    .omit(['ico32', 'ico64'])
    .value();
}

