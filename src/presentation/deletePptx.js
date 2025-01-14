const { google } = require("googleapis");

const deletePptx = {

    google: async function(auth, presentationId) {

        try {
            const drive = google.drive({ version: 'v3', auth });
            
            await drive.files.delete({
              fileId: presentationId,
            });
            
            console.log(`Presentation with ID '${presentationId}' deleted successfully.`);
            return { success: true, message: `Deleted file with ID: ${presentationId}` };
            
          } catch (error) {
            console.error('Error deleting file:', error);
            // Re-throw so higher-level code can catch it if needed
            throw error;
          }
    } 
}

module.exports = deletePptx;