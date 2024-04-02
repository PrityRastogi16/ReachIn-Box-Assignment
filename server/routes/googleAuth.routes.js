const express = require("express");
require("dotenv").config();
const nodemailer = require("nodemailer")
const {OAuth2Client} = require("google-auth-library");
const {redisConnection} = require("../middlewares/redisMiddlewares")
const axios = require("axios")
const OpenAi = require("openai")
const openai = new OpenAi({apiKey:process.env.OPENAI_APIKEY})

const googleRouter = express.Router();

const oAuthClient = new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI
})


googleRouter.get("/auth/google", (req, res) => {
    const authUrl = oAuthClient.generateAuthUrl({
        access_type: "offline",
        scope: [
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/gmail.modify",
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/gmail.compose"
        ]
    });
    res.redirect(authUrl);
});

let accessTokenForMail;
googleRouter.get("/auth/google/callback", async(req,res)=>{
    const { code } = req.query;

    try {
        const { tokens } = await oAuthClient.getToken(code);
        const accessToken = tokens.access_token;
        accessTokenForMail = accessToken;
        oAuthClient.setCredentials(tokens);

        // Get user information
        const userInfoResponse = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const user = userInfoResponse.data;
        console.log(user);
        const userEmail = userInfoResponse.data.email;
        redisConnection.set(userEmail,accessToken)
        // const acToken = await redisConnection.get(userEmail)
        // console.log(acToken);

        res.send("User Authenticated successfully");
    } catch (error) {
        console.error("Error retrieving access token:", error.message);
        res.status(500).send("Failed to retrieve access token");
    }
});


const sendMail = async (data) => {
    try {
        const token = accessTokenForMail
        console.log(token)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 465,
            secure: true,
            auth: {
                user: process.env.SMTP_mail,
                pass: process.env.SMTP_pass,
            },
        });
        let mailOptions = {
            from: data.from,
            to: data.to,
            subject: "",
            text: "",
            html: "",
        };
        let emailContent = "";
        if (data.label == 'Interested') {
            emailContent = 'If email mentions Interested, first thank them for showing interest and then ask them for a briefing call and suggest a suitable time. Write a small text around 200 words. Dont mention Dear name just say dear user and give beautiful reply';
            mailOptions.subject = `User is ${data.label}`;
        } else if (data.label == 'Not Interested') {
            emailContent = 'If email mentions Not Interested, first thank them for their time and then ask for feedback and suggestions. Write small text around 150 words.Dont mention Dear name just say dear user and give beautiful reply ';
            mailOptions.subject = `User is ${data.label}`;
        } else if (data.label == 'More Information') {
            emailContent = 'If email mentions More Information, first express gratitude for showing interest and then ask them for specific information they are looking for, and assure them of assistance. Write small text around 150 words.Dont mention Dear name just say dear user and give beautiful reply ';
            mailOptions.subject = `User is ${data.label}`;
        }
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-0301",
            temperature: 0.7,
            messages: [
                {
                    role: 'user',
                    content: emailContent,
                },
            ],
        });
        mailOptions.text = response.choices[0].message.content;
        mailOptions.html=`<div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px; text-align: center;">
        <p>${response.choices[0].message.content}</p>
      </div>`;
        const output = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
        return output;
        
    } catch (err) {
        throw new Error("Sending Mail Failed" + err);
    }
};


googleRouter.get("/all-mails",  async (req, res) => {
    try {
      const url = `https://gmail.googleapis.com/gmail/v1/users/${req.params.email}/messages?maxResults=50`;
      const token = await redisConnection.get(req.params.email);
      if (!token) {
        return res.send("Token not found , Please login again to get token");
      }
      const config = createConfig(url, token);
      const response = await axios(config);
      res.json(response.data);
    } catch (error) {
      res.send(error.message);
      console.log("Can't get emails ", error.message);
    }
  });


module.exports = {
    googleRouter,sendMail
}