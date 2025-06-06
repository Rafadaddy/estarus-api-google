import type { BusUnit, InsertBusUnit } from "@shared/schema";

// Google Apps Script Web App URL
const APPS_SCRIPT_URL = "https://script.google.com/d/11SpCJNGINR5ZOJ9ezV0EbgWyxuMCSlPcl4PnRZ9lF1RtH8hPi168jasZ/edit?usp=sharing";

export class GoogleAppsScriptAPI {
  private async makeRequest(url: string, options?: RequestInit): Promise<any> {
    try {
      const response = await fetch(url, {
        ...options,
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Apps Script API error: ${response.status} - ${errorText}`);
      }

      const text = await response.text();
      
      // Check if response is HTML (error page)
      if (text.trim().startsWith('<!DOCTYPE html>') || text.trim().startsWith('<html')) {
        throw new Error('Google Apps Script returned an error page. Please check your script deployment.');
      }

      return JSON.parse(text);
    } catch (error) {
      console.error('Google Apps Script request failed:', error);
      throw error;
    }
  }

  async getAllBusUnits(): Promise<BusUnit[]> {
    const url = `${APPS_SCRIPT_URL}?action=getAllUnits`;
    
    try {
      const data = await this.makeRequest(url);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error fetching from Google Apps Script:", error);
      throw error;
    }
  }

  async createBusUnit(insertUnit: InsertBusUnit): Promise<BusUnit> {
    const url = `${APPS_SCRIPT_URL}?action=createUnit`;
    
    const response = await this.makeRequest(url, {
      method: 'POST',
      body: JSON.stringify(insertUnit),
    });

    return response;
  }

  async updateBusUnit(id: number, updates: Partial<InsertBusUnit>): Promise<BusUnit | undefined> {
    const url = `${APPS_SCRIPT_URL}?action=updateUnit`;
    
    const response = await this.makeRequest(url, {
      method: 'POST',
      body: JSON.stringify({ id, updates }),
    });

    return response;
  }

  async deleteBusUnit(id: number): Promise<boolean> {
    const url = `${APPS_SCRIPT_URL}?action=deleteUnit`;
    
    const response = await this.makeRequest(url, {
      method: 'POST',
      body: JSON.stringify({ id }),
    });

    return response;
  }

  async deleteAllBusUnits(): Promise<void> {
    const url = `${APPS_SCRIPT_URL}?action=deleteAll`;
    
    await this.makeRequest(url, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async getBusUnitByNumber(unitNumber: number): Promise<BusUnit | undefined> {
    const units = await this.getAllBusUnits();
    return units.find(unit => unit.unitNumber === unitNumber);
  }
}

export const googleAppsScriptAPI = new GoogleAppsScriptAPI();
