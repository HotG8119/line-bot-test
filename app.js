require('dotenv').config();

const line = require('@line/bot-sdk');
const express = require('express');
const { OpenAI } = require("openai");

const port = process.env.PORT || 3000;
const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    }
);
// create LINE SDK client
const client = new line.messagingApi.MessagingApiClient({
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
});

// create Express app
// about Express itself: https://expressjs.com/
const app = express();

// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post('/callback', line.middleware(config), (req, res) => {
    Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
        console.error(err);
        res.status(500).end();
    });
});

// event handler
async function handleEvent(event) {
    if (event.type !== 'message' || event.message.type !== 'text') {
        // ignore non-text-message event
        return Promise.resolve(null);
    }

    const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: `${event.message.text}` }],
        model: "gpt-4-1106-preview",
    });

    // create a echoing text message
    const echo = { type: 'text', text: completion.choices[0].message.content.trim() || '抱歉，我沒有話可說了。' };
    // use reply API
    return client.replyMessage({
        replyToken: event.replyToken,
        messages: [echo],
    });
}

// listen on port
app.listen(port, () => {
    console.log(`listening on ${port}`);
});
