var low = require('lowdb')
var db = low('db.json')

db.defaults({ pubs: [] }).write()

module.exports = db
