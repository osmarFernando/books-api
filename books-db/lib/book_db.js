const { config } = require("../config")
const { MongoClient, ObjectID, ObjectId } = require("mongodb")
const uuid = require("uuid")
const { prototype } = require("./person_db")
const collection = "book"

const USER = encodeURIComponent(config.dbUser)
const PASSWORD = encodeURIComponent(config.dbPassword)
const DB_NAME = encodeURIComponent(config.dbName)

const MONGO_URI = `mongodb+srv://${USER}:${PASSWORD}@${config.dbHost}/${DB_NAME}?retryWrites=true&w=majority`

class MongoBook {
  constructor() {
    this.client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    this.dbName = DB_NAME;
  }

  async connect() {
    if (!MongoBook.connection) {
      MongoBook.connection = new Promise((resolve, reject) => {
        this.client.connect(err => {
          if (err) reject(err)
          console.log('Connected succesfully to mongo')
          resolve(this.client.db(this.dbName))
        })
      })
    }
    return MongoBook.connection
  }

  async searchBook(data) {
    let db = await this.connect()
    let filter = {}
    if (data.name) filter.name = RegExp(data.name, "i")
    if (data.author) filter.author = RegExp(data.author, "i")
    if (data.editorial) filter.editorial = RegExp(data.editorial, "i")
    if (data.year) filter.year = data.year
    if (data.gender) filter.gender = RegExp(data.gender, "i")
    if (data.status) filter.status = data.status
    if (data.rentedBook) filter.rentedBook = RegExp(data.rentedBook, "i")
    if (data.book_id) filter.book_id = data.book_id
    let dbList = await db.collection(collection).find(filter).toArray()
    for (let item of dbList) delete item._id
    return dbList
  }

  async createBook(data) {
    let db = await this.connect()
    if (data.year) data.year = parseInt(data.year)
    const avaible = Number("1")
    const totalStock = 1
    data.avaible = avaible
    data.totalStock = totalStock
    data.book_id = (`${uuid.v4().substr(10)}`).replace(/-/g, '')
    let dbList = await db.collection(collection).insertOne(data)
    return dbList
  }

  async updateBook(id, data) {
    let db = await this.connect()
    let filter = {}
    if (data.name) filter.name = data.name
    if (data.author) filter.author = data.author
    if (data.editorial) filter.editorial = data.editorial
    if (data.year) filter.year = parseInt(data.year)
    if (data.gender) filter.gender = data.gender
    if (data.avaible) filter.avaible = data.avaible
    if (data.totalStock) filter.totalStock = data.totalStock
    data.avaibleStrict === 0 ? filter.avaible = 0 : filter.avaible = data.avaibleStrict
    let dbllist = await db.collection(collection).updateOne(id, { $set: filter })
    return dbllist
  }

  async deleteBook(data) {
    let db = await this.connect()
    let dbList = db.collection(collection).deleteOne(data)
    return dbList
  }

}

module.exports = MongoBook