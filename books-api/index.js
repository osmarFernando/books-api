const express = require("express")
const {config} = require ("../books-db")
const routes = require("./routes")
const app = express()

app.use(express.json())
app.use("/books", routes)
app.listen(config.port,() =>{

    console.log(`http://localhost:${config.port}`)
    console.log(config.enviroment)

})