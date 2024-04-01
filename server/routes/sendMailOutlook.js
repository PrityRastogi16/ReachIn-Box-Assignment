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
const OpenAi = require("openai")
const openai = new OpenAi({apiKey:process.env.OPENAI_APIKEY})

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

outlookMailRouter.post("/send-email/:email", async (req, res) => {
    try {
      const accessToken = await redisConnection.get(req.params.email);
      if (!accessToken) {
        return res.status(401).send("Access token not found in session.");
      }
  
      // Construct the email message
      const emailData = req.body; // Assuming you are sending email data in the request body
      const emailContent = await generateEmailContent(emailData.label); 
      console.log(emailContent)
      const emailPayload = {
       message: {
          subject: `User is ${emailData.label}`,
          body: {
            contentType: 'Text',
            // content: `<div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px; text-align: center;"><p>${emailContent}</p></div>`
           content:`${emailContent}`,
          },
          toRecipients: [{ emailAddress: { address: emailData.to } }]
        },
      };
  
      // Send the email via Outlook's REST API
      const apiUrl = "https://graph.microsoft.com/v1.0/me/sendMail";
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      };
  
      const response = await axios.post(apiUrl, emailPayload, { headers });
  
      console.log("Email sent successfully");
      res.status(200).send("Email sent successfully");
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).send("Error sending email.");
    }
  });
  
  // Function to get email content based on label
  async function generateEmailContent(label) {
    let prompt;
    switch (label) {
        case 'Interested':
            prompt = 'User is interested. Please draft an email thanking them for their interest and suggesting a suitable time for a briefing call.';
            break;
        case 'Not Interested':
            prompt = 'User is not interested. Please draft an email thanking them for their time and asking for feedback and suggestions.';
            break;
        case 'More Information':
            prompt = 'User needs more information. Please draft an email expressing gratitude for their interest and asking for specific information they are looking for.';
            break;
        default:
            prompt = '';
    }

    const data = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-0301",
        temperature: 0.7,
        messages: [
            {
                role: 'user',
                content: prompt,
            },
        ],
    });
    console.log(data)

    return data.choices[0].message;
}
// Using Outlook router
outlookMailRouter.use("/outlook", outlookRouter);

module.exports = {
    outlookMailRouter
}

