import type { BusUnit, InsertBusUnit } from "@shared/schema";

const STORAGE_KEY = "busUnits";
const CURRENT_ID_KEY = "busUnitsCurrentId";

export class LocalStorageAPI {
  private getCurrentId(): number {
    const id = window.localStorage.getItem(CURRENT_ID_KEY);
    return id ? parseInt(id) : 1;
  }

  private setCurrentId(id: number): void {
    window.localStorage.setItem(CURRENT_ID_KEY, id.toString());
  }

  private getBusUnits(): BusUnit[] {
    const data = window.localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveBusUnits(units: BusUnit[]): void {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(units));
  }

  async getAllBusUnits(): Promise<BusUnit[]> {
    return this.getBusUnits().sort((a, b) => a.unitNumber - b.unitNumber);
  }

  async getBusUnit(id: number): Promise<BusUnit | undefined> {
    const units = this.getBusUnits();
    return units.find(unit => unit.id === id);
  }

  async getBusUnitByNumber(unitNumber: number): Promise<BusUnit | undefined> {
    const units = this.getBusUnits();
    return units.find(unit => unit.unitNumber === unitNumber);
  }

  async createBusUnit(insertUnit: InsertBusUnit): Promise<BusUnit> {
    const units = this.getBusUnits();
    const id = this.getCurrentId();
    
    const unit: BusUnit = {
      id,
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

    units.push(unit);
    this.saveBusUnits(units);
    this.setCurrentId(id + 1);
    
    return unit;
  }

  async updateBusUnit(id: number, updates: Partial<InsertBusUnit>): Promise<BusUnit | undefined> {
    const units = this.getBusUnits();
    const index = units.findIndex(unit => unit.id === id);
    
    if (index === -1) return undefined;

    const updatedUnit: BusUnit = { ...units[index], ...updates };
    units[index] = updatedUnit;
    this.saveBusUnits(units);
    
    return updatedUnit;
  }

  async deleteBusUnit(id: number): Promise<boolean> {
    const units = this.getBusUnits();
    const filteredUnits = units.filter(unit => unit.id !== id);
    
    if (filteredUnits.length === units.length) return false;
    
    this.saveBusUnits(filteredUnits);
    return true;
  }

  async deleteAllBusUnits(): Promise<void> {
    this.saveBusUnits([]);
    this.setCurrentId(1);
  }
}

export const localStorageAPI = new LocalStorageAPI();