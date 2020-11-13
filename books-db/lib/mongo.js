
const { config } = require("../config")
const { MongoClient, ObjectID, ObjectId } = require("mongodb")
const uuid = require("uuid")
const collection = "book"

const USER = encodeURIComponent(config.dbUser)
const PASSWORD = encodeURIComponent(config.dbPassword)
const DB_NAME = encodeURIComponent(config.dbName)

const MONGO_URI = `mongodb+srv://${USER}:${PASSWORD}@${config.dbHost}/${DB_NAME}?retryWrites=true&w=majority`

class MongoLib {
  constructor() {
    this.client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    this.dbName = DB_NAME;
  }

  async connect() {
    if (!MongoLib.connection) {
      MongoLib.connection = new Promise((resolve, reject) => {
        this.client.connect(err => {
          if (err) reject(err)
          console.log('Connected succesfully to mongo')
          resolve(this.client.db(this.dbName))})})}
    return MongoLib.connection }

  async getAll() {
    let db = await this.connect()
    let dbList = await db.collection(collection).find().toArray()
    for(let item of dbList) delete item._id
    return dbList
  }

  async get(data) {
    let db = await this.connect()
    let filter = {}
    if(data.bookId) filter.book_id = data.bookId
    if(data.title) filter.title = data.title
    let dbList = await db.collection(collection).find(filter).toArray()
    for(let item of dbList) delete item._id
    return dbList

  }
  async create(title) {
    let db = await this.connect()
    let dbList = await db.collection(collection).insertOne({title, book_id: (`${uuid.v4().substr(10)}`).replace(/-/g, '') })
    return dbList
  }

  async update(id,title) {
  let db = await this.connect()
  let dbllist = await db.collection(collection).updateOne({book_id: id}, {$set: {title :title}})
  return dbllist
  }

  async delete(data) {
    console.log(data)
    let db = await this.connect()
    let dbList = db.collection(collection).deleteOne(data)
    return dbList
}}

module.exports = MongoLib