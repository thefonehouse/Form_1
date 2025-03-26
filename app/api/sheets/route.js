// app/api/sheets/route.js
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

const auth = new google.auth.GoogleAuth({
  credentials: {
    type: "service_account",
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

function hexToRgb(hex) {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse r, g, b values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  return { r, g, b };
}

export async function POST(request) {
  try {
    const { spreadsheetId, range, values, colorHex } = await request.json();

    if (!spreadsheetId || !range || !values) {
      return Response.json(
        { success: false, message: "Missing required parameters" },
        { status: 400 }
      );
    }

    const sheets = google.sheets({ version: 'v4', auth });

    // First append the data
    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values]
      }
    });

    // Apply formatting if color is provided
    if (colorHex) {
      // Find the row where we just added data
      const matches = appendResponse.data.updates.updatedRange.match(/!A(\d+)/);
      const rowIndex = matches ? parseInt(matches[1]) - 1 : 0;
      
      // Color is in column J (10th column, 0-based index 9)
      const colorColumnIndex = 9;
      
      const { r, g, b } = hexToRgb(colorHex);
      
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: rowIndex,
                endRowIndex: rowIndex + 1,
                startColumnIndex: colorColumnIndex,
                endColumnIndex: colorColumnIndex + 1
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: r, green: g, blue: b },
                  textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 } }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)'
            }
          }]
        }
      });
    }

    return Response.json({ 
      success: true, 
      data: appendResponse.data 
    });

  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    return Response.json({ 
      success: false, 
      error: "Failed to save data",
      internalError: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}