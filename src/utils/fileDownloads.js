const fs = require("fs");
const axios = require('axios');


async function download(url, downloadPath) {
    const response = await axios({ url, method: 'GET', responseType: 'stream' });
    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(downloadPath);
      response.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
}

module.exports = download;