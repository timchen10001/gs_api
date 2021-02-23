
// login
// Read (query)
function doGet(e) {
  const data = e.parameter;
  const method = data.method;

  // 取得 Sheet 物件
  const SpreadSheet = SpreadsheetApp.openById(data.sheet);
  const Sheet = SpreadSheet.getSheets()[0];
  const Validator = new SheetValidator(Sheet)

  const isValidOnDefault = Validator.IsValidOnDefault();
  if (!isValidOnDefault) {
    throw new Error('empty sheet')
  }

  const User = new Entity(Sheet, data);

  switch (method) {
    case 'R':
      return User.Read();
    case 'D':
      return User.Delete();
  }
  return ContentService.createTextOutput('Bad Request');
}

// Post Method
// Create && Update 
function doPost(e) {
  const data = e.parameter;
  const method = data.method;

  // 取得 Sheet 物件
  const SpreadSheet = SpreadsheetApp.openById(data.sheet);
  const Sheet = SpreadSheet.getSheets()[0];

  const Validator = new SheetValidator(Sheet)
  const isValidOnDefault = Validator.IsValidOnDefault();
  if (!isValidOnDefault) {
    throw new Error('empty sheet')
  }

  const User = new Entity(Sheet, data);

  switch (method) {
    case 'C':
      return User.Create();
    case 'U':
      return User.Update();
  }
  return ContentService.createTextOutput('Bad Request!');
};

class Entity {
  constructor(Sheet, data) {
    this.Sheet = Sheet;
    this.data = data;
    this.Init()
  }

  Init() {
    this.ColumnSize = this.Sheet.getLastColumn();
    this.LastRow = this.Sheet.getLastRow();
    this.ColumnNames = this._GetColumnNames();
  }

  // register
  Create() {
    const TargetRow = this.LastRow + 1;
    const currentDate = this._GetCurrentDate();
    for (let i = 1; i <= this.ColumnSize; i++) {
      let value;
      const columnName = this.ColumnNames[i];
      switch (columnName) {
        case 'id':
          value = this._GetLastRowId() + 1;
          break;
        case 'createdAt':
          value = currentDate;
          break;
        case 'updatedAt':
          value = currentDate;
          break;
        default:
          value = this.data[columnName];
          break;
      }
      if (!value) {
        continue
      }
      this.Sheet.getRange(TargetRow, i).setValue(value);
    }
    return ContentService.createTextOutput('Done ! :) ');
  }

  // query
  Read() {
    const TargetIndex = this._FindColumnsIndexById();
    if (!TargetIndex) {
      throw new Error('id no found');
    }

    let toMapFind = {};
    for (let i = 2; i <= this.ColumnSize; i++) {
      const columnName = this.ColumnNames[i];
      const currentColumnValue = this.Sheet.getRange(TargetIndex, i).getValue()
      if (currentColumnValue) {
        // to mapp value
        toMapFind[columnName] = currentColumnValue;
      }
    }
    const JSONStr = JSON.stringify(toMapFind);
    return ContentService.createTextOutput(JSONStr).setMimeType(ContentService.MimeType.JSON);
  }

  // update
  Update() {
    const TargetIndex = this._FindColumnsIndexById();
    if (!TargetIndex) {
      throw new Error(`id no found`)
    }
    for (let i = 2; i <= this.ColumnSize; i++) {
      const columnName = this.ColumnNames[i];
      const currentColumnValue = this.data[columnName];
      if (currentColumnValue) {
        // update mapped-value
        this.Sheet.getRange(TargetIndex, i).setValue(currentColumnValue);
      }
    }
    return ContentService.createTextOutput('Done! :)');
  }

  // delete
  Delete() {
    const TargetIndex = this._FindColumnsIndexById();
    if (!TargetIndex) {
      throw new Error(`id no found`);
    }
    return ContentService.createTextOutput(TargetIndex);
  }

  _GetLastRowId() {
    return this.LastRow === 1 ? 0 : this.Sheet.getRange(this.LastRow, 1).getValue();
  }

  _GetColumnNames() {
    const cns = ["#"]
    for (let i = 1; i <= this.ColumnSize; i++) {
      let cn = this.Sheet.getRange(1, i).getValue();
      if (!cn) continue;
      cns.push(cn);
    }
    return cns;
  }

  _GetCurrentDate() {
    const MDY = new Date().toLocaleDateString().split('/').map(t => {
      return t.length === 1 ? `0${t}` : t;
    })
    return `${MDY[2]}/${MDY[0]}/${MDY[1]}`;
  }

  _FindColumnsIndexById() {
    // 線性搜索
    const targetId = parseInt(this.data.id);
    let targetIdIndex = 0;
    for (let i = 2; i <= this.LastRow; i++) {
      const current_id = this.Sheet.getRange(i, 1).getValue();
      if (current_id === targetId) {
        targetIdIndex = i;
        break;
      }
    }
    return targetIdIndex;
  }
}

class SheetValidator {
  constructor(Sheet) {
    this.Sheet = Sheet;
  }

  IsValidOnDefault() {
    switch (false) {
      case this._hasColumnName():
        break;
      case this._hasPrimaryKey():
        break;
      case this._hasCreateDate():
        break;
      case this._hasUpdateDate():
        break;
      default:
        return true;
    }
    return false;
  }

  _hasColumnName() {
    return this.Sheet.getLastRow();
  }

  _hasPrimaryKey() {
    return this.Sheet.getRange(1, 1).getValue() === 'id';
  }

  _hasCreateDate() {
    return this.Sheet.getRange(1, 2).getValue() === 'createdAt';
  }

  _hasUpdateDate() {
    return this.Sheet.getRange(1, 3).getValue() === 'updatedAt';
  }
}

