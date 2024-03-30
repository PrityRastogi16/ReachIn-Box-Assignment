const express = require("express");
const session = require("express-session");
const {googleRouter} = require("./routes/googleAuth.routes");

const app = express();
app.use(express.json())
app.use("/", googleRouter);

app.listen("2002",()=>{
    console.log("Server is running on PORT 2002")
})