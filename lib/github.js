var GitHubClient = require('github')
var config = require('../config.json')

var github = new GitHubClient({
  debug: true,
  headers: {
    'user-agent': 'ssbc.io'
  }
})

github.authenticate({
  type: 'basic',
  username: config.github.username,
  password: config.github.password
})

function reply (number, body) {
  return github.issues.createComment({
    owner: 'ssbc-io',
    repo: 'pub.ssbc.io',
    number,
    body
  })
}

function close (number) {
  return github.issues.edit({
    owner: 'ssbc-io',
    repo: 'pub.ssbc.io',
    number,
    state: 'closed'
  })
}

function addLabel (number, label) {
  return github.issues.addLabels({
    owner: 'ssbc-io',
    repo: 'pub.ssbc.io',
    number,
    labels: [label]
  })
}

module.exports = { github, reply, close, addLabel }
