const express = require("express")
const {config} = require ("../books-db")
const routeBook = require("./routes/book")
const routePerson = require("./routes/person")
const app = express()
const bodyParser = require('body-parser')

app.use(express.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json({limit: '2306866'}))
app.use("/books", routeBook)
app.use("/persons",routePerson)
app.listen(config.port,() =>{
    console.log(`http://localhost:${config.port}`)
    console.log(config.enviroment)
})