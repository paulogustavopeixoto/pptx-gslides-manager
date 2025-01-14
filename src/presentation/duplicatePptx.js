const { google } = require("googleapis");


const duplicate = {

    google: async function(auth, presentationId) {

      try {
        const drive = google.drive({ version: 'v3', auth });
        // Create a copy of the presentation
        const response = await drive.files.copy({
          fileId: presentationId,
          requestBody: {
            name: 'Copied Presentation', // Name of the copied file
          }
        });
        
        const copiedPresentationId = response.data.id;  // The ID of the copied file
        console.log(`Presentation copied successfully with ID: ${copiedPresentationId}`);
        return copiedPresentationId;
    
      } catch (err) {
        console.error('Error copying presentation:', err);
        throw err;
      }
    
    }
}


module.exports = duplicate;