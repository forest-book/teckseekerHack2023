'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const axios = require('axios');
const TeachableMachine = require('@sashido/teachablemachine-node');
const fs = require('fs');

const model = new TeachableMachine({
  modelUrl: 'https://teachablemachine.withgoogle.com/models/pq6VoCsDk/',
});

const config = {
  channelAccessToken:
    process.env.channelAccessToken,
  channelSecret: process.env.channelSecret,
};

const client = new line.Client(config);
const app = express();

app.use(express.json());
app.post('/webhook', async (req, res) => {

  console.log(req.body);
  console.log(req.body.payload[1].value);
  const fileName = req.body.payload[1].value;
  // Promise.all(req.body.events.map(await handleEvent))
  //   .then((result) => res.json(result))
  //   .catch((err) => {
  //     console.error(err);
  //     res.status(200).end();
  //   });

  const download = await axios({
    method: 'get',
    url: `https://secure.sakura.ad.jp/cloud/zone/is1a/api/cloud/1.1/commonserviceitem/113500895164/iotplatform/vmgw/files/${fileName}/download`,
    auth: {
      username: process.env.USER_NAME,
      password: process.env.PASSWORD,
    },
  });

  async function getAndConvertImage(url) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });

    // Convert Buffer to base64 string
    let imageBase64String = Buffer.from(response.data, 'binary').toString('base64');

    // prepend a header (include mime type and base64 encoding)
    return `data:image/jpeg;base64,${imageBase64String}`;
  }

  console.log(download.data);

  const imageUrl = download.data.IoTPlatform.url;

  console.log({ imageUrl });

  console.log(imageUrl);

  const imageURL = await getAndConvertImage(imageUrl);
  model
    .classify({
      imageUrl: imageURL,
    })
    .then((predictions) => {
      console.log('Predictions:', predictions);
    })
    .catch((e) => {
      console.log('ERROR', e);
    });

  res.status(200).end();
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
