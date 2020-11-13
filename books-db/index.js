
const {config}  = require("./config")
const MongoDb = require("./lib/mongo")
const mongo = new MongoDb 

module.exports = { mongo, config }

