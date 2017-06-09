var express = require('express')
var webHook = require('express-github-webhook')
var validator = require('validator')
var ping = require('ping')
var db = require('../lib/database')
var github = require('../lib/github')
var cloudflare = require('../lib/cloudflare')
var config = require('../config.json')

var handler = webHook({ path: '/', secret: 'test' })
var router = express.Router()

router.use(handler)

handler.on('pub.ssbc.io', (e, data) => {
  // console.log(e, data)
  if (e === 'issues' || e === 'issue_comment') {
    var issue = data.issue
    var matches = issue.title.match(/(.*)\.pub\.ssbc\.io/gi)

    if (matches.length) {
      var name = `${matches[0]}.pub`
      var host = issue.body

      if (data.action === 'opened') {
        var exists = db.get('pubs').find({ name }).value()
        if (exists) {
          return github.reply(issue.number, 'Looks like someone has already registered that name.')
        }

        if (validator.isIP(issue.body)) {
          github.reply(issue.number, 'Everything looks good to me')
        } else {
          github.reply(issue.number, 'Could not extract host from issue body, requiring human intervention @Reviewers \n To verify manually, simple use: `!verify <host> <name>`').then(() => {
            github.addLabel(issue.number, 'human intervention')
          })
        }
      }

      if (data.action === 'labeled' && data.label.id === config.github.accepted_label_id) {
        cloudflare.zoneDNSRecordNew(config.cloudflare.zone_id, {
          type: 'A',
          name,
          content: host
        }).then(record => {
          db.get('pubs').push({
            issue_number: issue.number,
            name,
            host,
            record_id: record.id
          }).write()

          github.reply(issue.number, 'Added DNS record').then(() => {
            github.close(issue.number)
          })
        })
      }

      if (data.action === 'unlabeled') {

      }

      if (e === 'issue_comment') {
        var comment = data.comment
        if (config.github.authorized_validators.includes(comment.user.id)) {
          if (comment.body.startsWith('!verify')) {
            var args = comment.body.slice('!verify'.length).trim().split(' ')
            if (args.length !== 2) return
            var host = args[0]
            var name = `${args[1]}.pub`
            cloudflare.zoneDNSRecordNew(config.cloudflare.zone_id, {
              type: 'A',
              name,
              content: host
            }).then(record => {
              db.get('pubs').push({
                issue_number: issue.number,
                name,
                host,
                record_id: record.id
              }).write()

              github.reply(issue.number, 'Added DNS record').then(() => {
                github.close(issue.number)
              })
            }).catch(err => {
              github.reply(issue.number, 'That record already exists')
            })
          }
        }
      }
    }
  }
})

module.exports = router
