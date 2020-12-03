
const {config}  = require("./config")
const MongoBook = require("./lib/book_db")
const MongoPerson = require("./lib/person_db") 
const mongoPerson = new MongoPerson
const mongoBook = new MongoBook

module.exports = { mongoPerson , mongoBook, config }

