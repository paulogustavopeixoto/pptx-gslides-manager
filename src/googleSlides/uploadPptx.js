const { google } = require("googleapis");
const path = require('path');
const fs = require('fs');


const upload = {
    /**
     * Uploads a remote PPTX file to Google Drive (converted into a Google Slides format).
     *
     * @param {object} auth - Authenticated JWT client from google.auth.JWT.
     * @param {string} filepath - The remote URL of the PPTX file.
     * @param {string} fileName - The desired file name to store temporarily and on Google Drive.
     * @returns {Promise<string>} - The newly created Google Slides file ID.
     * @throws {Error} - If the upload fails or the file path isn't a remote URL.
     */
    googleSlides: async function (auth, filepath, fileName) {
        try {
            const drive = google.drive({ version: 'v3', auth });
            const downloadPath = path.join('/tmp', fileName);
        
            if (filepath.startsWith('http://') || filepath.startsWith('https://')) {
              console.log(`Downloading file ${filepath} to ${downloadPath}...`);
              await downloadFile(filepath, downloadPath);
            } else {
              throw new Error('Local file paths are not supported in Cloud Functions.');
            }
        
            const fileStream = fs.createReadStream(downloadPath);
            const response = await drive.files.create({
              requestBody: {
                name: fileName.replace(/\.pptx?$/i, ''),
                mimeType: 'application/vnd.google-apps.presentation',
              },
              media: {
                mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                body: fileStream,
              },
              fields: 'id',
            });
        
            fs.unlinkSync(downloadPath);
            return response.data.id;
        
          } catch (error) {
            console.error('Error uploading PPTX file:', error);
            throw error;
          }
    }
}


module.exports = upload;