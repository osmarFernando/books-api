const express = require("express")
const { mongoBook } = require("books-db")
const asyncify = require('express-asyncify')
const route = asyncify(express.Router())
const joi = require("joi")
const fs = require("fs")
const multer = require("multer")
const path = require("path")
const csv = require("fast-csv")

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

//joi validations
const createSchema = joi.object({
    name: joi.string().min(1).max(100).required().strict(),
    author: joi.string().min(1).max(100).required().strict(),
    editorial: joi.string().min(1).max(50).strict(),
    year: joi.number().integer().min(1950).max(2021),
    gender: joi.string().min(2).max(50).regex(/^[a-zA-Z]+$/).strict()
})

const updateSchema = joi.object({
    name: joi.string().min(1).max(100).strict(),
    author: joi.string().min(1).max(100).strict(),
    editorial: joi.string().min(1).max(50).strict(),
    year: joi.number().integer().min(1950).max(2021).strict(),
    gender: joi.string().min(2).max(50),
    book_id: joi.string()
})

route.post("/", async (req, res, next) => {
    try {
        const { body } = req
        const search = await mongoBook.searchBook(body)
        if (search.length === 0) return res.status(404).json({ message: "book not found" })
        return res.status(200).json({ books: search, mesagge: "book retrived" })
    } catch (error) {
        next(error)
    }
})

route.post("/upload-csv", upload.single("file"), async (req, res, next) => {
    try {
        let fileRows = []
        csv.parseFile(req.file.path, { headers: true })
            .on("data", (data) => {
                fileRows.push(data)
            })
            .on("end", async () => {
                let created = []
                let invalid = []
                let existing = []
                for (let item of fileRows) {
                    let validate = await createSchema.validate(item)
                    if (validate.error) {
                        invalid.push(item)
                    }
                    else {
                        const search = await mongoBook.searchBook({ name: item.name, author: item.author })
                        if (search.length === 0) {
                            created.push(item)
                            await mongoBook.createBook(item)
                            console.log("Processing...")
                            console.log("Created" + "\n")
                        } else {
                            existing.push(item)
                            const countBook = search[0].avaible + 1
                            const stock = search[0].totalStock + 1
                            await mongoBook.updateBook({ book_id: search[0].book_id }, { avaibleStrict: countBook, totalStock: stock })
                        }
                    }
                }
                fs.unlinkSync(req.file.path)
                return res.status(200).json({ createdBooks: created.length, invalidBooks: invalid.length, addExistingBooks: existing.length })
            })

    } catch (error) {
        console.log(error)
        next(error)
    }
})

route.put("/", async (req, res, next) => {
    try {
        const { body } = req
        const search = await mongoBook.searchBook({ book_id: body.book_id })
        if (search.length === 0) return res.status(404).json({ mesagge: "Book not found" })
        let validate = await updateSchema.validate(body)
        if (validate.error) return res.status(400).send({message: validate.error.details[0].message })
        await mongoBook.updateBook({ book_id: body.book_id }, body)
        return res.status(200).json({ mesagge: "Book updated" })
    } catch (error) {
        next(error)
    }
})

route.delete("/:bookId", async (req, res, next) => {
    try {
        const { params } = req
        const search = await mongoBook.searchBook(params)
        if (search.length === 0) return res.status(400).json({ mesagge: "book not found" })
        await mongoBook.deleteBook({ book_id: params.bookId })
        return res.status(200).json({ mesagge: "book deleted" })
    } catch (error) {
        next(error)
    }
})

module.exports = route