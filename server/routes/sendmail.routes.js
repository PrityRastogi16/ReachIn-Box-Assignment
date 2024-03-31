const {redisConnection} = require("../middlewares/redisMiddlewares");
const {Queue} = require("bullmq");
require("dotenv").config();
const express = require("express");
const mailRouter = express.Router();

const sendMailQueue = new Queue("email-queue", {connection:redisConnection});

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

mailRouter.post("/send/:id", async (req, res) => {
    try {
      const {id} = req.params;
      const { from, to } = req.body;
      init({ from, to, id });
    } catch (error) {
      console.log("Error in sending mail", error.message);
    }
    res.send("Mail processing has been queued.");
  });
  
//   const sendEmailToQueue = async ({ from, to, id }) => {
//     try {
//       await sendMailQueue.add("send-email", {from, to,id});
//       console.log(`Email to ${to} has been queued.`);
//     } catch (error) {
//       console.error("Error enqueuing email job:", error.message);
//       throw error;
//     }
//   };

  module.exports = {
    mailRouter
  };