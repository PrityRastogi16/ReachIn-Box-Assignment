const express = require("express");
const session = require("express-session");
const { Client } = require("@microsoft/microsoft-graph-client");
const { outlookRouter } = require("./outlook.auth"); 
const {createConfig} = require("../controllers/config")
const {redisConnection} = require("../middlewares/redisMiddlewares");
const { default: axios } = require("axios");
const nodemailer =require("nodemailer")
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

const transporter = nodemailer.createTransport({
    service: 'gmail',
    port: 465,
    secure: true,
    auth: {
        user: process.env.SMTP_mail,
        pass: process.env.SMTP_pass,
    },
});
  
  outlookMailRouter.post("/send-email/:email", async (req, res) => {
    try {
      const accessToken = await redisConnection.get(req.params.email);
      if (!accessToken) {
        return res.status(401).send("Access token not found in session.");
      }
  
      // Construct the email message
      const emailData = req.body; // Assuming you are sending email data in the request body
      const emailContent = await generateEmailContent(emailData.label);
      console.log(emailContent);
      const mailOptions = {
        from: 'prityss7991@gmail.com',
        to: emailData.to,
        subject: `User is ${emailData.label}`,
        text: emailContent,
      };
  
      // Send the email using Nodemailer
      transporter.sendMail(mailOptions, async (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
          return res.status(500).send("Error sending email.");
        }
        console.log("Email sent successfully");
        res.status(200).send("Email sent successfully");
  
        // Generate reply using OpenAI
        const replyContent = await generateReplyContent(emailData.label);
        // Now you can send this reply content as a response to the original email
      });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).send("Error sending email.");
    }
  });
  
  // Function to generate email content based on label
  async function generateEmailContent(label) {
    let prompt;
    switch (label) {
      case 'Interested':
        prompt = 'User is interested. Please draft an email thanking them for their interest and suggesting a suitable time for a briefing call.Give output around 100 words';
        break;
      case 'Not Interested':
        prompt = 'User is not interested. Please draft an email thanking them for their time and asking for feedback and suggestions.Give output around 100 words';
        break;
      case 'More Information':
        prompt = 'User needs more information. Please draft an email expressing gratitude for their interest and asking for specific information they are looking for.Give output around 100 words';
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

  async function generateReplyContent(label) {
    let prompt;
    switch (label) {
      case 'Interested':
        prompt = 'Thank you for expressing interest! We appreciate your enthusiasm. Could you please provide us with your availability for a brief call to discuss further?';
        break;
      case 'Not Interested':
        prompt = 'Thank you for considering our offer. We respect your decision. If you have any feedback or suggestions for improvement, wed love to hear from you.';
        break;
      case 'More Information':
        prompt = 'We understand you need more information. Thank you for reaching out. Could you please specify the details youre looking for so we can assist you better?';
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

