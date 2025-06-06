import type { BusUnit, InsertBusUnit } from "@shared/schema";

// Extract spreadsheet ID from the URL
const SPREADSHEET_ID = "1yRphtW4pFMornQfq-J02qsYX1GyuusVVcMKS_XTEDhE";
const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || "AIzaSyB5GfYH_-XcQtIyR-xxrn7tuAzRhCcvhak";
const RANGE = "A:K"; // Covers all columns from A to K

interface GoogleSheetsResponse {
  values?: string[][];
}

export class GoogleSheetsAPI {
  private async makeRequest(url: string, options?: RequestInit): Promise<any> {
    console.log("Making request to:", url);
    const response = await fetch(url, options);
    console.log("Response status:", response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Sheets API error:", errorText);
      throw new Error(`Google Sheets API error: ${response.status} - ${errorText}`);
    }
    return response.json();
  }

  async getAllBusUnits(): Promise<BusUnit[]> {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}?key=${API_KEY}`;
    
    try {
      console.log("API Key being used:", API_KEY ? "Present" : "Missing");
      console.log("Spreadsheet ID:", SPREADSHEET_ID);
      
      const data: GoogleSheetsResponse = await this.makeRequest(url);
      
      if (!data.values || data.values.length <= 1) {
        console.log("No data found or only headers");
        return []; // No data or only headers
      }

      console.log("Raw data from sheets:", data.values);

      // Skip the header row and convert to BusUnit objects
      return data.values.slice(1).map((row, index) => ({
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
      })).filter(unit => unit.unitNumber > 0); // Filter out invalid entries
    } catch (error) {
      console.error("Error fetching from Google Sheets:", error);
      return [];
    }
  }

  async createBusUnit(insertUnit: InsertBusUnit): Promise<BusUnit> {
    // First, get all existing units to determine the next ID
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

    // Append the new row
    const newRow = [
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
    ];

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}:append?valueInputOption=RAW&key=${API_KEY}`;
    
    await this.makeRequest(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [newRow]
      })
    });

    return newUnit;
  }

  async updateBusUnit(id: number, updates: Partial<InsertBusUnit>): Promise<BusUnit | undefined> {
    const units = await this.getAllBusUnits();
    const unitIndex = units.findIndex(unit => unit.id === id);
    
    if (unitIndex === -1) return undefined;

    const updatedUnit = { ...units[unitIndex], ...updates };
    
    // Update the specific row (adding 2 because: 1 for header row + 1 for 1-based indexing)
    const rowNumber = unitIndex + 2;
    const range = `Sheet1!A${rowNumber}:K${rowNumber}`;
    
    const updatedRow = [
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
    ];

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?valueInputOption=RAW&key=${API_KEY}`;
    
    await this.makeRequest(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [updatedRow]
      })
    });

    return updatedUnit;
  }

  async deleteBusUnit(id: number): Promise<boolean> {
    const units = await this.getAllBusUnits();
    const unitIndex = units.findIndex(unit => unit.id === id);
    
    if (unitIndex === -1) return false;

    // Get all data except the row to delete
    const remainingUnits = units.filter(unit => unit.id !== id);
    
    // Clear all data and rewrite with remaining units
    await this.deleteAllBusUnits();
    
    // Rewrite remaining units
    for (const unit of remainingUnits) {
      await this.createBusUnit(unit);
    }

    return true;
  }

  async deleteAllBusUnits(): Promise<void> {
    // Clear all data except headers
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Sheet1!A2:K:clear?key=${API_KEY}`;
    
    await this.makeRequest(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      }
    });
  }

  async getBusUnitByNumber(unitNumber: number): Promise<BusUnit | undefined> {
    const units = await this.getAllBusUnits();
    return units.find(unit => unit.unitNumber === unitNumber);
  }
}

export const googleSheetsAPI = new GoogleSheetsAPI();