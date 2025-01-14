const { google } = require("googleapis");


const generateLink = {
  /**
   * Generates a shareable link for the presentation.
   *
   * @param {object} auth - The authenticated Google OAuth client.
   * @param {string} fileId - The ID of the Google Drive file.
   * @returns {string} - The shareable link.
   * @throws {Error} - If the link generation fails.
   */
  googleSlides: async function(auth, fileId) {
    const drive = google.drive({ version: 'v3', auth });

    try {
      // Update the file's permissions to make it viewable by anyone with the link
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
  
      // Generate the shareable link
      const result = await drive.files.get({
        fileId: fileId,
        fields: 'webViewLink, webContentLink',
      });
  
      console.log('Generated shareable link:', result.data.webViewLink);
      return result.data.webViewLink; // or webContentLink for direct download
    } catch (error) {
      console.error('Error generating shareable link:', error.message);
      throw new Error('Failed to generate shareable link.');
    }  
  }
}

module.exports = generateLink;