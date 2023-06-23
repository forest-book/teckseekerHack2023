'use strict';
const line = require('@line/bot-sdk');
const { configDotenv } = require('dotenv');
const express = require('express');

configDotenv();
const config = {
  channelAccessToken:process.env.LINE_CHANNELL_ACCES_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);
const app = express();

app.use(express.json());
app.post('/webhook', async (req, res) => {
  Promise.all(req.body.events.map(await handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(200).end();
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

// event handler
async function handleEvent(event, session) {
  console.log(event);

  let echo = [];

  if (event.type === 'beacon') {
    if (event.beacon.type === 'enter') {
        const profile = await client.getProfile(event.source.userId);
      await client.pushMessage(event.source.userId, [
        { type: 'text', text: profile.displayName+ 'さんが来店しました。' },
      ]);
    }
    return;
  } else if (event.type === 'follow') {
    // 友達登録ありがとうを返す
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '友達登録ありがとう！',
    });
    return;
  } else if (event.type === 'unfollow') {
    return;
  } else {
    echo = { type: 'text', text: '申し訳ありませんが、お返事できません。' };
  }

  // use reply API
  return client.replyMessage(event.replyToken, echo);
}
