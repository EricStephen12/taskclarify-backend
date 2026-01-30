import { google } from "googleapis";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

export const createOAuth2Client = () => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error('Missing Google OAuth credentials in environment');
  }

  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
};

export class GoogleIntegration {
  static async createDocument(accessToken: string, title: string, content: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const docs = google.docs({ version: "v1", auth });

    const doc = await docs.documents.create({
      requestBody: { title },
    });

    const documentId = doc.data.documentId;

    if (content && documentId) {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: {
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: content,
              },
            },
          ],
        },
      });
    }

    return {
      success: true,
      url: `https://docs.google.com/document/d/${documentId}/edit`,
      id: documentId,
    };
  }

  static async createSpreadsheet(accessToken: string, title: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const sheets = google.sheets({ version: "v4", auth });

    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title },
      },
    });

    return {
      success: true,
      url: spreadsheet.data.spreadsheetUrl,
      id: spreadsheet.data.spreadsheetId,
    };
  }

  static async createPresentation(accessToken: string, title: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const slides = google.slides({ version: "v1", auth });

    const presentation = await slides.presentations.create({
      requestBody: { title },
    });

    return {
      success: true,
      url: `https://docs.google.presentation.com/presentation/d/${presentation.data.presentationId}/edit`,
      id: presentation.data.presentationId,
    };
  }
}