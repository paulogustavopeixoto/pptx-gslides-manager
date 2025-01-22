const { google } = require("googleapis");
const path = require('path');
const fs = require('fs');
const { download } = require("../../utils");

async function uploadPresentation(auth, drive_id, filepath, fileName) {
  try {
      const drive = google.drive({ version: 'v3', auth });
      const downloadPath = path.join('/tmp', fileName);

      // 1) Download the file to /tmp
      if (filepath.startsWith('http://') || filepath.startsWith('https://')) {
        //console.log(`Downloading file ${filepath} to ${downloadPath}...`);
        await download(filepath, downloadPath);
      } else {
        throw new Error('Local file paths are not supported in Cloud Functions.');
      }
      
      // 2) Create a readable stream
      const fileStream = fs.createReadStream(downloadPath);

      // 3) Create the file in the Shared Drive
      const response = await drive.files.create({
        requestBody: {
          name: fileName.replace(/\.pptx?$/i, ''),
          mimeType: 'application/vnd.google-apps.presentation',
          parents: [drive_id],
        },
        media: {
          mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          body: fileStream,
        },
        fields: 'id',
        supportsAllDrives: true,
      });
      
      // 4) Cleanup: remove the downloaded file
      fs.unlinkSync(downloadPath);

      // Return the new Slides file ID
      return response.data.id;
  
    } catch (error) {
      console.error('Error uploading PPTX file:', error);
      throw error;
    }
}


module.exports = uploadPresentation;