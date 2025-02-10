const { google } = require("googleapis");

/**
 * An object containing authentication methods for various providers.
 */
async function auth(SERVICE_ACCOUNT_KEY) {
  console.log("Authenticating Google service account...");

  const key = JSON.parse(SERVICE_ACCOUNT_KEY);
  const scopes = [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/presentations",
    "https://www.googleapis.com/auth/documents"
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
};

module.exports = auth;