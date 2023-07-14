import requests
from PIL import Image
import io
import base64
from flask import Flask, request
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

model_url = 'https://teachablemachine.withgoogle.com/models/pq6VoCsDk/'

@app.route('/webhook', methods=['POST'])
def webhook():
    payload = request.json
    print(payload)
    print(payload['payload'][1]['value'])
    file_name = payload['payload'][1]['value']

    print(os.environ.get('SAKURA_USERNAME'))
    print(os.environ.get('SAKURA_PASSWORD'))

    download_url = f"https://secure.sakura.ad.jp/cloud/zone/is1a/api/cloud/1.1/commonserviceitem/113500895164/iotplatform/vmgw/files/{file_name}/download"
    download_response = requests.get(download_url, auth=(os.environ.get('SAKURA_USERNAME'), os.environ.get('SAKURA_PASSWORD')))

    image = Image.open(io.BytesIO(download_response.content))
    image_base64 = image_to_base64(image)

    predictions = classify_image(image_base64)

    print('Predictions:', predictions)

    return '', 200

def image_to_base64(image):
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format='JPEG')
    img_byte_arr = img_byte_arr.getvalue()
    img_base64 = base64.b64encode(img_byte_arr).decode('utf-8')
    return img_base64

def classify_image(image_base64):
    # ここで画像のクラス分類を行うコードを実装してください
    # Teachable Machineのモデルを使用するための処理を記述します
    # クラス分類結果を返す形式に整形してください
    pass

if __name__ == '__main__':
    app.run(port=3000)
