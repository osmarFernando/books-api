const express = require("express")
const { mongoPerson, mongoBook } = require("books-db")
const asyncify = require('express-asyncify')
const route = asyncify(express.Router())
const joi = require("joi")
const fs = require("fs")
const multer = require("multer")
const path = require("path")
const csv = require("fast-csv")
const { parse } = require("path")
const { json } = require("body-parser")


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
    name: joi.string().min(1).max(25).regex(/^[a-zA-Z]+$/).required().strict(),
    curp: joi.string().length(18).alphanum().required().strict(),
    lastname: joi.string().regex(/^[a-zA-Z]+$/).required().strict(),
    age: joi.number().integer().min(15).max(100)
})
const updateSchema = joi.object({
    curp: joi.string().min(18).max(18).alphanum().uppercase().strict(),
    name: joi.string().regex(/^[a-zA-Z]+$/).message("name contain only letters").strict(),
    lastname: joi.string().regex(/^[a-zA-Z]+$/).message("lastname contain only letters"),
    age: joi.number().integer().min(15).max(100)
})

route.post("/", async (req, res, next) => {
    try {
        const { body } = req
        const search = await mongoPerson.searchPerson(body)
        if (search.length === 0) return res.status(404).json({ message: "person not found" })
        return res.status(200).json({ person: search, mesagge: "person retrived" })
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
                let personsAcept = []
                let personsDenied = []
                for (let item of fileRows) {
                    let validate = await createSchema.validate(item)
                    if (validate.error) {
                        personsDenied.push(item)
                    } else {
                        const search = await mongoPerson.searchPerson({ curp: item.curp })
                        console.log(search)
                        if (search.length === 0) {
                            personsAcept.push(item)
                            await mongoPerson.createPerson(item)
                            console.log("Processing...")
                            console.log("Created" + "\n")
                        } else {
                            personsDenied.push(item)
                        }
                    }
                }
                fs.unlinkSync(req.file.path)
                return res.status(200).json({ inserts: personsAcept.length, notInserts: personsDenied.length })
            })
    } catch (error) {
        console.log(error)
        next(error)
    }
})
route.put("/", async (req, res, next) => {
    try {
        try {
            const { body } = req
            const search = await mongoPerson.searchPerson({ curp: body.curp })
            if (search.length === 0) return res.status(404).json({ mesagge: "Person not found" })
            let validate = await updateSchema.validate(body)
            if (validate.error) return res.status(400).send({message: validate.error.details[0].message })
            await mongoPerson.updatePerson({ curp: body.curp }, body)
            return res.status(200).json({ message: "successful update" })
        } catch (error) {
            console.log(error)
            next(error)
        }
    } catch (error) {
        next(error)
    }
})
route.put("/rent", async (req, res, next) => {
    try {
        const { body } = req
        const search = await mongoPerson.searchPerson({ curpStrict: body.curp })
        if (search.length === 0) return res.status(404).json({ mesagge: "person not found" })
        if (search[0].status === false) return res.status(400).json({ message: "Can't rent more books" })
        const book = await mongoBook.searchBook({ book_id: body.book_id })
        if (book.lengh === 0) return res.status(404).json({ mesagge: "book.not found" })
        if (book[0].avaible === 0) return res.status(400).json({ message: "book not aviable " })
        const countBook = book[0].avaible - 1
        await mongoBook.updateBook({ book_id: book[0].book_id }, { avaibleStrict: countBook })
        await mongoPerson.updatePerson({ curp: body.curp }, { statusRent: 1, rentedBook: book[0].name, book_id: book[0].book_id })
        return res.status(200).json({ message: "book rented succeful" })
    } catch (error) {
        console.log(error)
        next(error)
    }
})

route.put("/returnBook", async (req, res, next) => {
    try {
        const { body } = req
        const search = await mongoPerson.searchPerson({ curpStrict: body.curp })
        if (search.length === 0) return res.status(404).json({ mesagge: "person not found" })
        if (search[0].book_id === "") return res.status(400).json({ message: "you cant return any more books" })
        if (!(search[0].book_id === body.book_id)) return res.status(400).json({ message: "reetunr failed" })
        const book = await mongoBook.searchBook({ book_id: body.book_id })
        const countBook = book[0].avaible + 1
        await mongoBook.updateBook({ book_id: book[0].book_id }, { avaibleStrict: countBook })
        await mongoPerson.updatePerson({ curp: body.curp }, { statusReturn: 1 })
        return res.status(200).json({ message: "book returned" })
    } catch (error) {
        console.log(error)
        next(error)
    }
})

route.delete("/:curp", async (req, res, next) => {
    try {
        const { params } = req
        const search = await mongoPerson.searchPerson(params)
        if (search.length === 0) return res.status(404).json({ mesagge: "person not found" })
        await mongoPerson.deletePerson(params)
        return res.status(404).json({ mesagge: "person deleted" })
    } catch (error) {
        console.log(error)
        next(error)
    }
})

module.exports = route