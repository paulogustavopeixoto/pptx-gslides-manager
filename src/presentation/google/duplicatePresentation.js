const { google } = require("googleapis");


async function duplicatePresentation(auth, presentationId, driveId) {

  try {
    const drive = google.drive({ version: 'v3', auth });
    
    // Build your requestBody
    const requestBody = {
      name: 'Copied Presentation',  // Name of the copied file
      parents: [driveId]
    };
    
    // Create a copy
    const response = await drive.files.copy({
      fileId: presentationId,
      requestBody,
      // ***** This is crucial if the file or the new copy is in a Shared Drive *****
      supportsAllDrives: true,
      // Optionally specify fields if you want only certain properties in response
      fields: 'id, name'
    });
    
    const copiedPresentationId = response.data.id;  // The ID of the copied file
    console.log(`Presentation copied successfully with ID: ${copiedPresentationId}`);
    return copiedPresentationId;

  } catch (err) {
    console.error('Error copying presentation:', err);
    throw err;
  }

}


module.exports = duplicatePresentation;