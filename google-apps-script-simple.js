// CÓDIGO SIMPLIFICADO PARA GOOGLE APPS SCRIPT
// Copia este código COMPLETO y reemplaza todo en tu Google Apps Script

const SPREADSHEET_ID = "1yRphtW4pFMornQfq-J02qsYX1GyuusVVcMKS_XTEDhE";

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'getAllUnits') {
    const result = getAllUnits();
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({error: "Invalid action"}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const action = e.parameter.action;
  let data = {};
  
  if (e.postData && e.postData.contents) {
    try {
      data = JSON.parse(e.postData.contents);
    } catch (error) {
      return ContentService.createTextOutput(JSON.stringify({error: "Invalid JSON"}))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  let result;
  
  switch(action) {
    case 'createUnit':
      result = createUnit(data);
      break;
    case 'updateUnit':
      result = updateUnit(data);
      break;
    case 'deleteUnit':
      result = deleteUnit(data);
      break;
    case 'deleteAll':
      result = deleteAll();
      break;
    default:
      result = {error: "Invalid action"};
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function getAllUnits() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    const values = sheet.getDataRange().getValues();
    
    if (values.length <= 1) return [];
    
    return values.slice(1).map((row, index) => ({
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
    return {error: error.toString()};
  }
}

function createUnit(unitData) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    const existingData = sheet.getDataRange().getValues();
    
    const nextId = existingData.length > 1 
      ? Math.max(...existingData.slice(1).map(row => parseInt(row[0]) || 0)) + 1 
      : 1;
    
    const newUnit = {
      id: nextId,
      unitNumber: unitData.unitNumber,
      MOT: unitData.MOT || "listo",
      TRAN: unitData.TRAN || "listo",
      ELE: unitData.ELE || "listo",
      AA: unitData.AA || "listo",
      FRE: unitData.FRE || "listo",
      SUS: unitData.SUS || "listo",
      DIR: unitData.DIR || "listo",
      HOJ: unitData.HOJ || "listo",
      TEL: unitData.TEL || "listo"
    };
    
    sheet.appendRow([
      newUnit.id, newUnit.unitNumber, newUnit.MOT, newUnit.TRAN,
      newUnit.ELE, newUnit.AA, newUnit.FRE, newUnit.SUS,
      newUnit.DIR, newUnit.HOJ, newUnit.TEL
    ]);
    
    return newUnit;
  } catch (error) {
    return {error: error.toString()};
  }
}

function updateUnit(data) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    const values = sheet.getDataRange().getValues();
    
    const rowIndex = values.findIndex((row, index) => 
      index > 0 && parseInt(row[0]) === data.id
    );
    
    if (rowIndex === -1) return {error: "Unit not found"};
    
    const updatedRow = [...values[rowIndex]];
    const columnMap = {
      'MOT': 2, 'TRAN': 3, 'ELE': 4, 'AA': 5, 'FRE': 6,
      'SUS': 7, 'DIR': 8, 'HOJ': 9, 'TEL': 10
    };
    
    Object.keys(data.updates).forEach(key => {
      if (columnMap[key] !== undefined) {
        updatedRow[columnMap[key]] = data.updates[key];
      }
    });
    
    sheet.getRange(rowIndex + 1, 1, 1, updatedRow.length).setValues([updatedRow]);
    
    return {
      id: parseInt(updatedRow[0]),
      unitNumber: parseInt(updatedRow[1]),
      MOT: updatedRow[2], TRAN: updatedRow[3], ELE: updatedRow[4],
      AA: updatedRow[5], FRE: updatedRow[6], SUS: updatedRow[7],
      DIR: updatedRow[8], HOJ: updatedRow[9], TEL: updatedRow[10]
    };
  } catch (error) {
    return {error: error.toString()};
  }
}

function deleteUnit(data) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    const values = sheet.getDataRange().getValues();
    
    const rowIndex = values.findIndex((row, index) => 
      index > 0 && parseInt(row[0]) === data.id
    );
    
    if (rowIndex === -1) return false;
    
    sheet.deleteRow(rowIndex + 1);
    return true;
  } catch (error) {
    return {error: error.toString()};
  }
}

function deleteAll() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    const lastRow = sheet.getLastRow();
    
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
    
    return true;
  } catch (error) {
    return {error: error.toString()};
  }
}