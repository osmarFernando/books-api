const { config } = require("../config")
const { MongoClient } = require("mongodb")
const uuid = require("uuid")
const collection = "person"

const USER = encodeURIComponent(config.dbUser)
const PASSWORD = encodeURIComponent(config.dbPassword)
const DB_NAME = encodeURIComponent(config.dbName)

const MONGO_URI = `mongodb+srv://${USER}:${PASSWORD}@${config.dbHost}/${DB_NAME}?retryWrites=true&w=majority`

class MongoPerson {
  constructor() {
    this.client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    this.dbName = DB_NAME;
  }

  async connect() {
    if (!MongoPerson.connection) {
      MongoPerson.connection = new Promise((resolve, reject) => {
        this.client.connect(err => {
          if (err) reject(err)
          console.log('Connected succesfully to mongo')
          resolve(this.client.db(this.dbName))
        })
      })
    }
    return MongoPerson.connection
  }
  async searchPerson(data) {
    let db = await this.connect()
    let filter = {}
    if (data.name) filter.name = RegExp(data.name, "i")
    if (data.lastname) filter.lastname = RegExp(data.lastname, "i")
    if (data.curp) filter.curp = RegExp(data.curp, "i")
    if (data.curpStrict) filter.curp = data.curpStrict
    if (data.age !== undefined) filter.age = parseInt(data.age)
    let dbList = await db.collection(collection).find(filter).toArray()
    for (let item of dbList) delete item._id
    return dbList
  }
  async createPerson(data) {
    let db = await this.connect()
    if (data.age) data.age = parseInt(data.age)
    if (data.curp) data.curp = data.curp.toUpperCase()
    data.status = true
    data.rented_book = ""
    data.book_id = ""
    let dbList = await db.collection(collection).insertOne(data)
    return dbList
  }
  async updatePerson(curp, data) {
    let db = await this.connect()
    const filter = {}
    if (data.name) filter.name = data.name
    if (data.lastname) filter.lastname = data.lastname
    if (data.status !== undefined) data.status === false ? filter.status = false : filter.status = true, filter.book_id = "", filter.rented_book = ""
    if (data.book_id) filter.book_id = data.book_id
    if (data.returnBook_id) filter.book_id = ""
    if (data.age !== undefined) filter.age = parseInt(data.age)
    if (data.rented_book) filter.rented_book = data.rented_book
    let dbList = await db.collection(collection).updateOne(curp, { $set: filter })
    return dbList
  }
  async deletePerson(data) {
    let db = await this.connect()
    let dbList = db.collection(collection).deleteOne(data)
    return dbList
  }

}
module.exports = MongoPerson