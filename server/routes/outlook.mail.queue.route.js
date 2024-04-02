const {redisConnection} = require("../middlewares/redisMiddlewares");
const {Queue} = require("bullmq");
require("dotenv").config();
const express = require("express");
const outlookmailRouter = express.Router();

const sendMailQueue = new Queue("outlook-email-queue", {connection:redisConnection});

async function init(body){
    const res = await sendMailQueue.add(
        "Email to selected user",
        {
            from: body.from,
            to:body.to,
            id:body.id,
        },
        {removeOnComplete: true}    
    );
    console.log("Job added to queue", res.id);
}

outlookmailRouter.post("/sendMail/:id", async (req, res) => {
    try {
      const {id} = req.params;
      const { from, to } = req.body;
      init({ from, to, id });
    } catch (error) {
      console.log("Error in sending mail", error.message);
    }
    res.send("Mail processing has been queued.");
  });
  


  module.exports = {
    outlookmailRouter
  };