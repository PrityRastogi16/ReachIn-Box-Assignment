const express = require("express");
const session = require("express-session");
const { Client } = require("@microsoft/microsoft-graph-client");
const { outlookRouter } = require("./outlook.auth"); 
const {createConfig} = require("../controllers/config")
const {redisConnection} = require("../middlewares/redisMiddlewares");
const { default: axios } = require("axios");

const app = express();
const outlookMailRouter = express.Router();
require("dotenv").config();

app.use(express.urlencoded({ extended: true }));

outlookMailRouter.get("/list/:email", async (req, res) => {
    try {
        const { email } = req.params;
        const accessToken = await redisConnection.get(email);
        if (!accessToken) {
            return res.status(401).json({ error: "Access token not found." });
        }
        const response = await axios.get("https://graph.microsoft.com/v1.0/me/messages", {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        const mails = response.data;

        // Optionally, you can process the mail data or perform any additional operations here

        res.status(200).json(mails);
    } catch (error) {
        console.error("Error fetching emails:", error);
        res.status(500).json({ error: "Failed to fetch emails." });
    }
});

outlookMailRouter.get("/read/:email/:msgID", async(req,res)=>{
    try{
        const URL = `https://graph.microsoft.com/v1.0/me/messages/${req.params.msgID}`
      let token = await redisConnection.get(req.params.email);
      const config = createConfig(URL,token)
      const response = await axios(config)
      let mails = await response.data;
      res.send(mails); 
}
 catch(err){
     console.log(err);
     res.send(err);
    }
})

// outlookMailRouter.post("/send-email/:email", async (req, res) => {
//   try {
//     const accessToken = await redisConnection.get(req.params.email);
//     if (!accessToken) {
//       return res.status(401).send("Access token not found in session.");
//     }
    
//   } catch (error) {
//     console.error("Error sending email:", error);
//     res.status(500).send("Error sending email.");
//   }
// });

// Using Outlook router
outlookMailRouter.use("/outlook", outlookRouter);

module.exports = {
    outlookMailRouter
}

