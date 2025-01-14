const { google } = require("googleapis");

/**
 * An object containing authentication methods for various providers.
 */
const auth = {
  /**
   * Authenticates a Google service account using a JSON key and returns a JWT client.
   *
   * @param {string} SERVICE_ACCOUNT_KEY - The JSON string of your service account credentials.
   * @returns {Promise<google.auth.JWT>} - A promise that resolves to the authenticated JWT client.
   */
  authGoogle: async function (SERVICE_ACCOUNT_KEY) {
    console.log("Authenticating Google service account...");

    const key = JSON.parse(SERVICE_ACCOUNT_KEY);
    const scopes = [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/presentations",
    ];

    const jwtClient = new google.auth.JWT(
      key.client_email,
      null,
      key.private_key,
      scopes
    );

    await jwtClient.authorize();
    console.log("Google service account authenticated successfully.");
    return jwtClient;
  },

  // Placeholder for a Microsoft auth, if you decide to add more methods:
  // authMicrosoft: async function (MICROSOFT_CREDENTIALS) {
  //   // future placeholder code
  // },
};

module.exports = {googleAuth: auth};