const {Worker} = require("bullmq");
const {redisConnection} = require("./middlewares/redisMiddlewares");
const nodemailer = require("nodemailer");
require("dotenv").config();
const axios = require("axios");
const {OAuth2Client} = require("google-auth-library");
const {google} = require("googleapis");
const {OpenAI} = require("openai");
const {createConfig} = require("./controllers/config")

const oAuthClient = new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI
})

const openai = new OpenAI({apiKey: process.env.OPENAI_APIKEY});

let reply = true;
const sendMail = async (data) => {
    try {
        const token = await redisConnection.get(data.to);
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
            subject: "Hello , Greeting of the day!",
            text: "Hello , Greeting of the day!",
            html: "<h1>Hello , Greeting of the day!</h1>",
        };
        let response;
        console.log(response)
        if(!reply){
        response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-0301",
            temperature: 0.7,
            messages: [
                {
                    role: 'user',
                    content: `If the email mentions they are interested, your reply should ask them if they are willing to attend a demo call by suggesting a time.
                    write a small text on above request in around 200 words and thanks them`,
                },
            ],
        });
    }

    if (data.label == 'Interested') {
        mailOptions.html = `
        <div style="background-color: #f0f0f0; padding: 20px; border-radius: 10px; text-align: center;">
          <p>${reply? `Thank you for expressing interest in our compamy. We will looking forward to connect with you. Have a great day!` : `${response.choices[0].message.content}`}</p>
          
        </div>`;
        mailOptions.subject = `${data.label}`;
    } else if (data.label == 'Not interested') {
        mailOptions.html = `
        <div style="background-color: #f0f0f0; padding: 25px; border-radius: 20px; text-align: center;">
          <p>${reply? `Thank you for your time. Could you please provide us some feedback.` : `${response.choices[0].message.content}`}</p>   
        </div>`;
        mailOptions.subject = `${data.label}`;
    } else if (data.label == 'More Information') {
        mailOptions.html = `
        <div style="background-color: #f0f0f0; padding: 20px; border-radius: 10px; text-align: center;">
          <p>${reply? `Thank you for expressing interest in our compamy. We will looking forward to connect with you and provide you more information. Have a great day!` : `${response.choices[0].message.content}`}</p>
          
        </div>`;
        mailOptions.subject = ` ${data.label}`;
    }
        const output = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
        return output; 
    } catch (err) {
        throw new Error("Sending Mail Failed" + err);
    }
};


const parseMail = async(newData)=>{
    try{
       const {from, to} = newData;
       const token =await redisConnection.get(newData.from);
       console.log(newData.to)
       console.log(token)
       const msg =await axios.get(`https://gmail.googleapis.com/gmail/v1/users/${from}/messages/${newData.id}`,{
        headers:{
            "Content-Type":"application/json",
            "Authorization":`Bearer ${token}`
          }
       })

       const payload = msg.data.payload
       const headers = payload.headers;
       const subject = headers.find((header) => header.name === "Subject")?.value;
       let textContent = "";
       if(payload.parts){
        const text = payload.parts.find((el)=> el.mimeType === "text/plain");
       if(text){
        textContent = Buffer.from(text.body.data, "base64").toString("utf-8");
       }
       }else{
        textContent = Buffer.from(payload.body.data, "base64").toString("utf-8");
       }
       let snippet = msg.data.snippet;
       let emailContext = `${subject} ${snippet} ${textContent}`;
       let emailupdatedText = emailContext.slice(0,5000);
       const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-0301",
        temperature: 0.7,
        messages: [
            {
                role: 'user',
                content: `Based on the text give one word answer, and  categorize the text based on the content and assign a label from the given options - Interested, Not interested, More information. Text is : ${emailupdatedText}`,
            },
        ],
    });

    const aiAns = response.choices[0]?.message.content;
    console.log(aiAns);
    let label;
    if(aiAns.includes("Interested")){
        label = "Interested"
    }else if(aiAns.includes("Not interested")){
        label = "Not interested"
    }else{
        label = "More Information"
    }

    const data = {
        subject, textContent,snippet:msg.data.snippet, label,from,to,
    };
    console.log(data);
    const mailData = await sendMail(data);
    return mailData;

    }
    catch(err){
      console.log("Failed ", err)
      return -1;
    }
}


const sendEmailInQueue = (data, jobID)=>
new Promise(async (req,res)=>{
    let msg = await parseMail(data);
    if(msg){
        console.log(`Job ${jobID} completed and sent to ${data.to}`);
    }
    return msg;

}).then((res) => console.log(res))
.catch((err) => console.log(err));

const worker = new Worker("email-queue", async(job) =>{
  
    let {from, to, id, jobId} = job.data;
    jobId = job.id
    console.log(job.data)
    console.log(`Job ${jobId } is started`);
    const result = setTimeout(async()=>{
        console.log(job.id)
    await sendEmailInQueue(job.data, job.id);
    
    },3000);
    console.log("Job in Progress");
},
{connection: redisConnection}
)


const sendOutlookEmailInQueue = (data, jobID)=>
new Promise(async (req,res)=>{
    let msg = await parseMail(data);
    if(msg){
        console.log(`Job ${jobID} completed and sent to ${data.to}`);
    }
    return msg;

}).then((res) => console.log(res))
.catch((err) => console.log(err));

const outlookWorker = new Worker("outlook-email-queue", async (job) => {
    let {from, to, id, jobId} = job.data;
    jobId = job.id;
    console.log(job.data);
    console.log(`Job ${jobId} is started`);
    const result = setTimeout(async () => {
        console.log(job.id);
        await sendOutlookEmailInQueue(job.data, job.id);
    }, 3000);
    console.log("Job in Progress");
}, {connection: redisConnection});