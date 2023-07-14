'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const axios = require('axios');
const TeachableMachine = require('@sashido/teachablemachine-node');
const fs = require('fs');
const { configDotenv } = require('dotenv');
configDotenv();




//MQTT process
const mqtt = require('mqtt');

const ssid = "THEDECK24";
const password = "Cyberdyne";
const mqttServer = "mqtt://mqtt.eclipseprojects.io";
const mqttPort = 1883;

function publishIsFamily() {
  const client = mqtt.connect(mqttServer, {
    username: ssid,
    password: password
  });

  client.on('connect', () => {
    console.log('Connected to MQTT broker');
    const message = 'isFamily message'; // パブリッシュするメッセージ
    client.publish('isFamily', message, (error) => {
      if (error) {
        console.error('Error publishing message:', error);
      } else {
        console.log('Message published successfully');
      }
      client.end(); // 接続を閉じる
    });
  });

  client.on('error', (error) => {
    console.error('MQTT error:', error);
  });
}

// 関数の呼び出し
publishIsFamily();






// LINE Botの設定
const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const lineClient = new line.Client(lineConfig);


const model = new TeachableMachine({
  modelUrl: 'https://teachablemachine.withgoogle.com/models/pq6VoCsDk/',
});


const app = express();

app.use(express.json());

app.post('/webhook', async (req, res) => {

  console.log(req.body);
  console.log(req.body.payload[1].value);
  const fileName = req.body.payload[1].value;


  console.log(process.env.SAKURA_USERNAME)
  console.log(process.env.SAKURA_PASSWORD)

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

    // prepend a header (include mime type and base64 encoding)
    return `data:image/jpeg;base64,${imageBase64String}`;
  }

  console.log(download.data);

  const imageUrl = download.data.IoTPlatform.url;

  console.log({ imageUrl });

  console.log(imageUrl);

  const imageURL = await getAndConvertImage(imageUrl);

  const predictions = await model.classify({
    imageUrl: imageURL,
  })

  // Find the class with the highest score
  const maxScoreIndex = predictions.reduce((maxIndex, prediction, currentIndex) => {
    if (prediction.score > predictions[maxIndex].score) {
      return currentIndex;
    }
    return maxIndex;
  }, 0);

  if (predictions[maxScoreIndex].class === 'Class 1') {
    console.log('AAAAAA');
  } else {
    console.log('success');
  }
  // // Send LINE message
  // if (predictions[maxScoreIndex].class === 'Class 1') {
  //   const message = {
  //     type: 'text',
  //     text: 'お客様が来ました'
  //   };
  //   await lineClient.pushMessage('U66aad7613d1bb6cd7256da7ae1fde543', message); // ユーザーIDにはメッセージを送信したいユーザーのIDを指定してください
  // } else if (predictions[maxScoreIndex].class === 'Class 2') {
  //   const message = {
  //     type: 'text',
  //     text: 'おかえりなさい'
  //   };
  //   await lineClient.pushMessage('U66aad7613d1bb6cd7256da7ae1fde543', message);
  // } else if (predictions[maxScoreIndex].class === 'Class 3') {
  //   const message = {
  //     type: 'text',
  //     text: '郵便物が届きました'
  //   };
  //   await lineClient.pushMessage('U66aad7613d1bb6cd7256da7ae1fde543', message);
  // }
  
  if (predictions[maxScoreIndex].class === 'Class 1') {
    const message = {
      type: 'text',
      text: 'お客様が来ました'
    };
    const imageMessage = {
      type: 'image',
      originalContentUrl: imageUrl,
      previewImageUrl: imageUrl
    };

    await lineClient.pushMessage('U66aad7613d1bb6cd7256da7ae1fde543', [message, imageMessage]); // ユーザーIDにはメッセージを送信したいユーザーのIDを指定してください
  } else if (predictions[maxScoreIndex].class === 'Class 2') {
    const message = {
      type: 'text',
      text: 'おかえりなさい'
    };
    const imageMessage = {
      type: 'image',
      originalContentUrl: imageUrl,
      previewImageUrl: imageUrl
    };

    await lineClient.pushMessage('U66aad7613d1bb6cd7256da7ae1fde543', [message, imageMessage]);
  } else if (predictions[maxScoreIndex].class === 'Class 3') {
    const message = {
      type: 'text',
      text: '郵便物が届きました'
    };
    const imageMessage = {
      type: 'image',
      originalContentUrl: imageUrl,
      previewImageUrl: imageUrl
    };

    await lineClient.pushMessage('U66aad7613d1bb6cd7256da7ae1fde543', [message, imageMessage]);
  }
  
  console.log(predictions);


  res.status(200).end();
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

