const express = require("express")
const { mongo } = require("books-db")
const { json } = require("express")
const route = express.Router()

route.get("/", async(req, res, next)=>{
        try {
            const books = await mongo.getAll() 
            return res.status(200).json({data: books, mesagge: "books listed"})
        } 
        catch (error) {
           next(error) 
        }
})

route.get("/:bookId", async(req, res, next)=>{
        try {
            const {params} = req
            const book = await mongo.get(params)
            return res.status(200).json({data: book, mesagge:"book retrived"})
        } catch (error) {
            next(error)
        }
    })

    route.post("/", async(req, res, next)=>{
        try {
            const {body} = req
            const book = await mongo.get(body)
            if(book.length === 0){
                const createdBook = await mongo.create(body.title)
                return res.status(201).json({data: createdBook , mesagge:"book created"})
            }else return res.status(400).json({mesagge: "the book is already exist"})} 
        catch (error) {
            console.log(error)
            next(error)
        }
    })

    route.put("/", async(req, res, next)=>{
       try {
            const {body} = req
            const book = await mongo.get({bookId: body.bookId})
            if(book.length === 0){
                return res.status(404).json({mesagge: "Book not found"})
            }else{
                const bookUpdated = await mongo.update(body.bookId, body.title)
                return res.status(200).json({book: bookUpdated, mesagge: "Book updated"})
            }
  
             
        } catch (error) {
            next(error)
            console.log(error)  
        }
    })

    route.delete("/:bookId", async(req, res, next)=>{
        try {
            const {params}= req
            const book = await mongo.get(params)
            if(book.length === 0){
                return res.status(400).json({mesagge: "book not found"})
            }
            else{
                const bookDeleted = await mongo.delete({book_id: params.bookId})
                return res.status(200).json({book: bookDeleted, mesagge: "book deleted"})
            }
        } catch (error) {
            next(error)
        }
    })
module.exports = route