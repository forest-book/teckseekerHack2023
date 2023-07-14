'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const axios = require('axios');
const TeachableMachine = require('@sashido/teachablemachine-node');
const fs = require('fs');
const { configDotenv } = require('dotenv');
configDotenv();

const model = new TeachableMachine({
  modelUrl: 'https://teachablemachine.withgoogle.com/models/pq6VoCsDk/',
});

const app = express();

app.use(express.json());

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);

app.post('/webhook', async (req, res) => {
  console.log(req.body);
  console.log(req.body.payload[1].value);
  const fileName = req.body.payload[1].value;

  console.log(process.env.SAKURA_USERNAME);
  console.log(process.env.SAKURA_PASSWORD);

  const download = await axios({
    method: 'get',
    url: `https://secure.sakura.ad.jp/cloud/zone/is1a/api/cloud/1.1/commonserviceitem/113500895164/iotplatform/vmgw/files/${fileName}/download`,
    auth: {
      username: process.env.SAKURA_USERNAME,
      password: process.env.SAKURA_PASSWORD,
    },
  });

  async function getAndConvertImage(url) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });

    // Convert Buffer to base64 string
    let imageBase64String = Buffer.from(response.data, 'binary').toString('base64');

    // Prepend a header (include mime type and base64 encoding)
    return `data:image/jpeg;base64,${imageBase64String}`;
  }

  console.log(download.data);
  const imageUrl = download.data.IoTPlatform.url;
  console.log({ imageUrl });
  console.log(imageUrl);

  const imageURL = await getAndConvertImage(imageUrl);
  const predictions = await model.classify({
    imageUrl: imageURL,
  });

  // Find the class with the highest score
  const maxScoreIndex = predictions.reduce((maxIndex, prediction, currentIndex) => {
    if (prediction.score > predictions[maxIndex].score) {
      return currentIndex;
    }
    return maxIndex;
  }, 0);

  let messageText = '';

  if (predictions[maxScoreIndex].class === 'Class 1') {
    messageText = 'お客様が来ました';
  } else if (predictions[maxScoreIndex].class === 'Class 2') {
    messageText = 'おかえりなさい';
  } else if (predictions[maxScoreIndex].class === 'Class 3') {
    messageText = '郵便物が届きました';
  }

  // Send LINE message
  await client.pushMessage(event.source.userId, { type: 'text', text: messageText });

  res.status(200).end();
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
