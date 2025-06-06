import type { BusUnit, InsertBusUnit } from "@shared/schema";

const SPREADSHEET_ID = "1yRphtW4pFMornQfq-J02qsYX1GyuusVVcMKS_XTEDhE";
const RANGE = "A:K";

// Google OAuth2 configuration
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let gapi: any;
let tokenClient: any;
let isInitialized = false;

export class GoogleSheetsOAuthAPI {
  private accessToken: string | null = null;

  async initialize(): Promise<void> {
    if (isInitialized) return;

    if (!CLIENT_ID) {
      throw new Error('Google Client ID not configured');
    }

    return new Promise((resolve, reject) => {
      try {
        // Load Google API script
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
          gapi.load('api:client', async () => {
            try {
              await gapi.client.init({
                apiKey: '', // We'll use OAuth2 for authentication
                discoveryDocs: [DISCOVERY_DOC],
              });

              // Load Google Identity Services
              const identityScript = document.createElement('script');
              identityScript.src = 'https://accounts.google.com/gsi/client';
              identityScript.onload = () => {
                try {
                  tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    callback: (response: any) => {
                      if (response.error) {
                        console.error('OAuth callback error:', response.error);
                        return;
                      }
                      this.accessToken = response.access_token;
                      gapi.client.setToken({ access_token: response.access_token });
                    },
                  });
                  
                  isInitialized = true;
                  resolve();
                } catch (error) {
                  console.error('Failed to initialize token client:', error);
                  reject(error);
                }
              };
              identityScript.onerror = (error) => {
                console.error('Failed to load Google Identity Services:', error);
                reject(error);
              };
              document.head.appendChild(identityScript);
            } catch (error) {
              console.error('Failed to initialize gapi client:', error);
              reject(error);
            }
          });
        };
        script.onerror = (error) => {
          console.error('Failed to load Google API script:', error);
          reject(error);
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error('Failed to initialize Google API:', error);
        reject(error);
      }
    });
  }

  async authenticate(): Promise<boolean> {
    if (!isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve) => {
      if (this.accessToken) {
        resolve(true);
        return;
      }

      tokenClient.callback = (response: any) => {
        if (response.error) {
          console.error('OAuth error:', response.error);
          resolve(false);
          return;
        }
        
        this.accessToken = response.access_token;
        gapi.client.setToken({ access_token: response.access_token });
        resolve(true);
      };

      tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }

  async getAllBusUnits(): Promise<BusUnit[]> {
    if (!this.accessToken) {
      const authenticated = await this.authenticate();
      if (!authenticated) throw new Error('Authentication failed');
    }

    try {
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: RANGE,
      });

      const values = response.result.values;
      if (!values || values.length <= 1) {
        return [];
      }

      // Skip header row and convert to BusUnit objects
      return values.slice(1).map((row: string[], index: number) => ({
        id: parseInt(row[0]) || index + 1,
        unitNumber: parseInt(row[1]) || 0,
        MOT: row[2] || "listo",
        TRAN: row[3] || "listo",
        ELE: row[4] || "listo",
        AA: row[5] || "listo",
        FRE: row[6] || "listo",
        SUS: row[7] || "listo",
        DIR: row[8] || "listo",
        HOJ: row[9] || "listo",
        TEL: row[10] || "listo"
      })).filter(unit => unit.unitNumber > 0);
    } catch (error) {
      console.error("Error fetching from Google Sheets:", error);
      throw error;
    }
  }

  async createBusUnit(insertUnit: InsertBusUnit): Promise<BusUnit> {
    if (!this.accessToken) {
      const authenticated = await this.authenticate();
      if (!authenticated) throw new Error('Authentication failed');
    }

    // Get existing units to determine next ID
    const existingUnits = await this.getAllBusUnits();
    const nextId = existingUnits.length > 0 ? Math.max(...existingUnits.map(u => u.id)) + 1 : 1;

    const newUnit: BusUnit = {
      id: nextId,
      unitNumber: insertUnit.unitNumber,
      MOT: insertUnit.MOT || "listo",
      TRAN: insertUnit.TRAN || "listo",
      ELE: insertUnit.ELE || "listo",
      AA: insertUnit.AA || "listo",
      FRE: insertUnit.FRE || "listo",
      SUS: insertUnit.SUS || "listo",
      DIR: insertUnit.DIR || "listo",
      HOJ: insertUnit.HOJ || "listo",
      TEL: insertUnit.TEL || "listo"
    };

    const values = [[
      newUnit.id,
      newUnit.unitNumber,
      newUnit.MOT,
      newUnit.TRAN,
      newUnit.ELE,
      newUnit.AA,
      newUnit.FRE,
      newUnit.SUS,
      newUnit.DIR,
      newUnit.HOJ,
      newUnit.TEL
    ]];

    await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
      valueInputOption: 'RAW',
      resource: { values }
    });

    return newUnit;
  }

  async updateBusUnit(id: number, updates: Partial<InsertBusUnit>): Promise<BusUnit | undefined> {
    if (!this.accessToken) {
      const authenticated = await this.authenticate();
      if (!authenticated) throw new Error('Authentication failed');
    }

    // Get all units to find the row
    const allUnits = await this.getAllBusUnits();
    const unitIndex = allUnits.findIndex(unit => unit.id === id);
    
    if (unitIndex === -1) return undefined;

    const unit = allUnits[unitIndex];
    const updatedUnit: BusUnit = { ...unit, ...updates };

    // Update the specific row (add 2 because: 1 for header row + 1 for 1-based indexing)
    const rowNumber = unitIndex + 2;
    const range = `A${rowNumber}:K${rowNumber}`;

    const values = [[
      updatedUnit.id,
      updatedUnit.unitNumber,
      updatedUnit.MOT,
      updatedUnit.TRAN,
      updatedUnit.ELE,
      updatedUnit.AA,
      updatedUnit.FRE,
      updatedUnit.SUS,
      updatedUnit.DIR,
      updatedUnit.HOJ,
      updatedUnit.TEL
    ]];

    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
      valueInputOption: 'RAW',
      resource: { values }
    });

    return updatedUnit;
  }

  async deleteBusUnit(id: number): Promise<boolean> {
    if (!this.accessToken) {
      const authenticated = await this.authenticate();
      if (!authenticated) throw new Error('Authentication failed');
    }

    // Get all units to find the row
    const allUnits = await this.getAllBusUnits();
    const unitIndex = allUnits.findIndex(unit => unit.id === id);
    
    if (unitIndex === -1) return false;

    // Delete the specific row (add 1 because of header row)
    const rowIndex = unitIndex + 1;

    await gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: 0, // First sheet
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1
            }
          }
        }]
      }
    });

    return true;
  }

  async deleteAllBusUnits(): Promise<void> {
    if (!this.accessToken) {
      const authenticated = await this.authenticate();
      if (!authenticated) throw new Error('Authentication failed');
    }

    // Clear all data except header
    await gapi.client.sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A2:K'
    });
  }

  async getBusUnitByNumber(unitNumber: number): Promise<BusUnit | undefined> {
    const units = await this.getAllBusUnits();
    return units.find(unit => unit.unitNumber === unitNumber);
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  async signOut(): Promise<void> {
    this.accessToken = null;
    if (gapi?.client?.getToken()) {
      gapi.client.setToken(null);
    }
  }
}

export const googleSheetsOAuthAPI = new GoogleSheetsOAuthAPI();