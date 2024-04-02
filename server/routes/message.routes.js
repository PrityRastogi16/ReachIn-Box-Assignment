const express = require("express");
const axios = require("axios");
const {redisConnection} = require("../middlewares/redisMiddlewares")
const {google} = require("googleapis")
require("dotenv").config();
const {createConfig} = require("../controllers/config");
const OpenAI = require("openai");
const {sendMail} = require("./googleAuth.routes");

const { OAuth2Client } = require("google-auth-library");

const oAuth2Client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
});



const messageRouter = express.Router();
messageRouter.use(express.json());

messageRouter.post("/send-mail", async(req,res)=>{
    try{
    const data = await sendMail(req.body);
    res.status(200).json({msg:"Email Sent Succesfully", data});
    }
    catch(err){
        console.log(err);
        res.status(400).json({error:err});
    }
})


messageRouter.get("/all-draft/:email", async(req,res)=>{
    try{
       const URL = `https://gmail.googleapis.com/gmail/v1/users/${req.params.email}/drafts`;
       const token = await redisConnection.get(req.params.email);
       console.log(token);
       if(!token){
        return res.send("Token Not Found")
       }
      const config = createConfig(URL, token);
      const response = await axios(config);
      res.json(response.data);
    }
    catch(err){
        res.send(err.message);
        console.log("Can't get drafts ", err);
    }
});


messageRouter.get("/read-mail/:email/message/:message", async(req,res)=>{
    try{
      
       const URL = `https://gmail.googleapis.com/gmail/v1/users/${req.params.email}/messages/${req.params.message}`;
       const token = await redisConnection.get(req.params.email);
       console.log(token);
       if(!token){
        return res.send("Token Not Found")
       }
      const config = createConfig(URL, token);
      const response = await axios(config);
      res.json(response.data);
    }
    catch(err){
        res.send(err.message);
        console.log("Can't get drafts ", err);
    }
});

messageRouter.get("/getMail/:email", async (req, res) => {
    try {
      const url = `https://gmail.googleapis.com/gmail/v1/users/${req.params.email}/messages?maxResults=50`;
      const token = await redisConnection.get(req.params.email);
      if (!token) {
        return res.send("Token not found");
      }
      const config = createConfig(url, token);
      const response = await axios(config);
      res.json(response.data);
    } catch (error) {
      res.send(error.message);
      console.log("Can't get emails ", error.message);
    }
  });


// GET USER INFORMATION
messageRouter.get("/userData/:email", async(req,res)=>{
  try{
     let {email} = req.params
     let accessToken = await redisConnection.get(email)
     let response = await axios.get(`https://gmail.googleapis.com/gmail/v1/users/${email}/profile`, {
        headers:{
          "Content-Type":"application/json",
          "Authorization":`Bearer ${accessToken}`
        }
     })
     res.status(200).json(response.data);
  }
  catch(err){
    console.log(err);
    res.status(400).json({err})
  }
})

// Creating Labels for mails
messageRouter.post("/createLabel/:email", async(req,res)=>{
  try{
     const {email} = req.params;
     const accessToken = await redisConnection.get(email);
     let label = req.body;
     console.log(label);
     let response = await axios.post(`https://gmail.googleapis.com/gmail/v1/users/${email}/labels`,label,{
      headers: {
        "Content-Type":"application/json",
        "Authorization":`Bearer ${accessToken}`
      }
     })
     res.status(200).json(response.data);
  }
  catch(err){
    console.log(err);
    res.status(400).json({err})
  }
})

module.exports = {
    messageRouter
}
