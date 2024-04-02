# Project Overview
  The objective of this initiative is to establish OAuth integration with Google and Microsoft platforms to obtain authorization for accessing user email accounts. Following email retrieval, the system will employ OpenAI to analyze the content and classify emails into three distinct categories: 'Interested', 'Not Interested', and 'Requesting More Information'. Subsequently, automated email responses will be generated based on these classifications, utilizing OpenAI's capabilities

## Deployment Links:
- Frontend : https://reach-in-box-assignment.vercel.app/
- Backend : https://reachin-box-assignment.onrender.com
- API Documentation: https://documenter.getpostman.com/view/31788909/2sA35HX1Y1


## Technologies used:
- Nodejs
- Expressjs
- openai API
- Bullmq
- Javascript

  
## API Endpoints:

## Google

- ### GET /auth/google
  - To start google oauth process and authenticate users

- ### POST /api/mail/all-draft/:email
  - This endpoint retrieves all draft emails for a specific user. 
```json
{
    "drafts": [
        {
            "id": "",
            "message": {
                "id": "",
                "threadId": ""
            }
        }
    ],
    "resultSizeEstimate": 0
}

```
- ### GET /api/mail/read-mail/:email/message/:messageID
  - This HTTP GET request is used to retrieve a specific email message with the given email address and message ID.
  - Example:
```json
GET /api/mail/read-mail/prityss7991@gmail.com/message/18a609755b7af37c

Response:
{
    "id": "18a609755b7af37c",
    "threadId": "18a609755b7af37c",
    "labelIds": [
        "DRAFT"
    ],
    "snippet": "Sent from Mail for Windows",
    "payload": {
        "partId": "",
        "mimeType": "text/html",
        "filename": "",
        "headers": [
            {
                "name": "MIME-Version",
                "value": "1.0"
            },
        ],
        "body": {
            "size": 37678,
            "data": ""
        }
    },
    "sizeEstimate": 41906,
    "historyId": "192942",
    "internalDate": "1693837643000"
}
```

- ### POST /api/mail/send-mail
  - This HTTP GET request is used to retrieve a specific email message with the given email address and message ID.
  - Example:
```json
Body:
{
   "from":"prityss7991@gmail.com",
   "to":"surajyoti9839@gmail.com",
   "label":"Interested"
}

Response:
{
    "msg": "Email Sent Succesfully",
    "data": {
        "accepted": [
            "surajyoti9839@gmail.com"
        ],
        "rejected": [],
        "ehlo": [
            "SIZE 35882577",
            "8BITMIME",
            "AUTH LOGIN PLAIN XOAUTH2 PLAIN-CLIENTTOKEN OAUTHBEARER XOAUTH",
            "ENHANCEDSTATUSCODES",
            "PIPELINING",
            "CHUNKING",
            "SMTPUTF8"
        ],
        "envelopeTime": 924,
        "messageTime": 883,
        "messageSize": 2491,
        "response": "250 2.0.0 OK  1711967220 fb11-20020a056a002d8b00b006ecb639fa56sm1240474pfb.217 - gsmtp",
        "envelope": {
            "from": "prityss7991@gmail.com",
            "to": [
                "surajyoti9839@gmail.com"
            ]
        },
        "messageId": "<0366e940-b9f2-1029-21bf-ff8c53150a32@gmail.com>"
    }
}
```

## Outlook

- ### GET /outlook/list/:email
  - This will fetch all the available mails in user inbox


- ### GET /outlook/read/:email/:messageId
  - This endpoint is used to read a particular mail of a user and generate reply according to the email content

## Some View
 <img src="assets/Screenshot (362).png">

 <img src="assets/Screenshot (363).png">

