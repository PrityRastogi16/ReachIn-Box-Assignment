const express = require("express");
const session = require("express-session");
const {googleRouter} = require("./routes/googleAuth.routes");
const {messageRouter} = require("./routes/message.routes");
const {mailRouter} = require("./routes/sendmail.routes")
const {outlookRouter} = require("./routes/outlook.auth");
const {outlookMailRouter} = require("./routes/sendMailOutlook")
const cors = require("cors");
const app = express();
app.use(session({
    secret: "any_secret_key",
    resave: false,
    saveUninitialized: false,
  }));

app.use(cors());
app.use(express.json())
app.use("/", googleRouter);
app.use("/outlook", outlookRouter);
app.use("/mail", mailRouter);
app.use("/outlookmail",outlookMailRouter)
app.use("/api/mail", messageRouter);
app.listen("2002",()=>{
    console.log("Server is running on PORT 2002")
})