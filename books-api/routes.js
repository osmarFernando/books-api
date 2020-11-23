const express = require("express")
const { mongo } = require("books-db")
const route = express.Router()
const joi = require("joi")
const fs = require("fs")
const multer = require("multer")
const path = require("path")
const csv = require("fast-csv")

//joi validations
const createSchema = joi.object({
    title: joi.string().required()
})
const updateSchema = joi.object({
    title: joi.string().required(),
    book_id: joi.string().required()
})

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, './filesCSV'),
    filename: (req, file, cb) => cb(null, path.extname(file.originalname))
})
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(csv)$/)) {
            return cb(new Error('Invalid Fiel Type'))
        }
        cb(null, true)
    }
})

//routes
route.get("/", async (req, res, next) => {
    try {
        const books = await mongo.getAll()
        return res.status(200).json({ books: books, mesagge: "books listed" })
    }
    catch (error) {
        next(error)
    }
})

route.get("/:bookId", async (req, res, next) => {
    try {
        const { params } = req
        const book = await mongo.get(params)
        return res.status(200).json({ books: book, mesagge: "book retrived" })
    } catch (error) {
        next(error)
    }
})

route.post("/", async (req, res, next) => {
    try {
        const { body } = req
        let validate = await createSchema.validate(body)
        if (validate.error) return res.status(400).send({ error: true, message: validate.error.details[0].message })
        const book = await mongo.get(body)
        if (book.length === 0) {
            const createdBook = await mongo.create(body.title)
            return res.status(201).json({ data: createdBook, mesagge: "book created" })
        } return res.status(400).json({ mesagge: "the book is already exist" })
    }
    catch (error) {
        next(error)
    }
})

route.put("/", async (req, res, next) => {
    try {
        const { body } = req
        let validate = await updateSchema.validate(body)
        if (validate.error) return res.status(400).send({ error: true, message: validate.error.details[0].message })
        const book = await mongo.get({ bookId: body.book_id })
        if (book.length === 0) return res.status(404).json({ mesagge: "Book not found" })
        const bookUpdated = await mongo.update(body.book_id, body.title)
        return res.status(200).json({ book: bookUpdated, mesagge: "Book updated" })
    } catch (error) {
        next(error)
    }
})

route.delete("/:bookId", async (req, res, next) => {
    try {
        const { params } = req
        const book = await mongo.get(params)
        if (book.length === 0) return res.status(400).json({ mesagge: "book not found" })
        const bookDeleted = await mongo.delete({ book_id: params.bookId })
        return res.status(200).json({ book: bookDeleted, mesagge: "book deleted" })
    } catch (error) {
        next(error)
    }
})

route.post("/upload_csv", upload.single("file"), async (req, res, next) => {
    try {
        let fileRows = []
        csv.parseFile(req.file.path, { headers: true })
            .on("data", (data) => {
                fileRows.push(data)
            })
            .on("end", async () => {
                for (let item of fileRows) {
                    const exist = await mongo.getPerson(item.curp)
                    if (exist.length === 0) {
                        console.log("Processing...")
                        const person = await mongo.createPerson(item)
                        console.log("Created")
                    }
                }
                fs.unlinkSync(req.file.path)
            })
        return res.status(200).json({ mesagge: "created" })
    } catch (error) {
        console.log(error)
        next(error)
    }
})

module.exports = route