const express = require("express");
require("dotenv").config();
const {OAuth2Client} = require("google-auth-library");
const {redisConnection} = require("../middlewares/redisMiddlewares")
const axios = require("axios")

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


googleRouter.get("/auth/google/callback", async(req,res)=>{
    const { code } = req.query;

    try {
        const { tokens } = await oAuthClient.getToken(code);
        const accessToken = tokens.access_token;
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


module.exports = {
    googleRouter
}