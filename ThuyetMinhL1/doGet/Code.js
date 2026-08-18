function getSalaryHistoryFromSheet() {
  const defaultHistory = [
    { year: 2026, month: 7, value: 2530000 },
    { year: 2000, month: 1, value: 2340000 }
  ];
  
  try {
    const ss = SpreadsheetApp.openById(idFileData);
    let sheet = ss.getSheetByName("SetupLuong");
    
    if (!sheet) {
      sheet = ss.insertSheet("SetupLuong");
      sheet.appendRow(["Kỳ lương áp dụng", "Lương cơ sở"]);
      sheet.appendRow(["T07.2026", 2530000]);
      sheet.appendRow(["T01.2000", 2340000]);
      SpreadsheetApp.flush();
    }
    
    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return defaultHistory;
    
    const history = [];
    for (let i = 1; i < rows.length; i++) {
      const kyLuong = String(rows[i][0]).trim();
      const value = parseFloat(rows[i][1]);
      if (kyLuong.startsWith('T') && !isNaN(value)) {
        const parts = kyLuong.substring(1).split('.');
        if (parts.length === 2) {
          history.push({
            year: parseInt(parts[1], 10),
            month: parseInt(parts[0], 10),
            value: value
          });
        }
      }
    }
    
    history.sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month);
    return history.length > 0 ? history : defaultHistory;
  } catch (e) {
    Logger.log("Lỗi đọc cấu hình lương từ Sheet: " + e.message);
    return defaultHistory;
  }
}

function getLuongCoSoByMonth(monthStr) {
  const historyList = getSalaryHistoryFromSheet();
  if (!monthStr) return historyList[historyList.length - 1].value;
  
  const parts = monthStr.replace('T', '').split('.');
  if (parts.length !== 2) return historyList[historyList.length - 1].value;
  
  const month = parseInt(parts[0], 10);
  const year = parseInt(parts[1], 10);
  
  for (const milestone of historyList) {
    if (year > milestone.year || (year === milestone.year && month >= milestone.month)) {
      return milestone.value;
    }
  }
  return historyList[historyList.length - 1].value;
}

const idFileData = LibraryDigiCore.idFileData;

const idFileChotCong = LibraryDigiCore.idFileChotCong;
const idFileChotNhanSuThang = LibraryDigiCore.idFileChotNhanSuThang;

let _sheetChotCong;
function getSheetChotCong() {
  if (!_sheetChotCong) _sheetChotCong = SpreadsheetApp.openById(idFileChotCong).getSheetByName("DataChotCong");
  return _sheetChotCong;
}

let _sheetNSThang;
function getSheetNSThang() {
  if (!_sheetNSThang) _sheetNSThang = SpreadsheetApp.openById(idFileChotNhanSuThang).getSheetByName("DataChotNSThang");
  return _sheetNSThang;
}

let _sheetNhanSu;
function getSheetNhanSu() {
  if (!_sheetNhanSu) _sheetNhanSu = SpreadsheetApp.openById(idFileData).getSheetByName("DataNhanSu");
  return _sheetNhanSu;
}

const rngDataThang = 'DanhMucThang!A2:N';
//const rngDataAnCa = 'DataAnCa!A1:J';
const rngSetup = 'Setup!B2:B';
const rngDataChotCong = 'DataChotCong!A1:L';
const rngDataChotNsThang = 'DataChotNSThang!A1:AM';

//const idFileDataAnCa = LibraryDigiCore.idFileDataAnCa;
//const sheetDataAnCa = SpreadsheetApp.openById(idFileDataAnCa).getSheetByName('DataAnCa');

function doGet(e) {
  try {
    const type = e.parameter.type || '';    // lấy tham số loại get từ url
    const month = e.parameter.month || '';  // lấy tham số tháng get dữ liệu từ url
    const region = e.parameter.region || ''; // ✅ lấy tham số khu vực từ url

    // Nếu có type cụ thể thì chỉ trả về dữ liệu đó
    if (type === 'DataLuongAnCa') {
      const dataLuongAnCa = doGet_getDataFromSheet(month);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        dataLuongAnCa
      })).setMimeType(ContentService.MimeType.JSON);
    } else if (type === 'TinhLuongAnCa') {
      const dataLuongAnCa = doGet_taoBoSungThuyetMinh(month);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        dataLuongAnCa
      })).setMimeType(ContentService.MimeType.JSON);
    } else if (type === 'coThayDoi_DataPrint') {
      const dataPrint = doGet_getDataPrint_CoThayDoi(month, region);
      const totalSums = doGet_getDatabaseL1SalarySums(month, region);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        dataPrint,
        totalSums
      })).setMimeType(ContentService.MimeType.JSON);
    } else if (type === 'khongThayDoi_DataPrint') {
      const dataPrint = doGet_getDataPrint_KhongThayDoi(month, region);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        dataPrint
      })).setMimeType(ContentService.MimeType.JSON);
    } else if (type === 'diNganHang_DataPrint') {
      const dataPrint = doGet_getDataPrint_DiNganHang(month, region);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        dataPrint
      })).setMimeType(ContentService.MimeType.JSON);
    } else if (type === 'configThuyetMinhL1_load') {
      const configData = doGet_loadConfigThuyetMinhL1(month, region);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        configData
      })).setMimeType(ContentService.MimeType.JSON);
    } else if (type === 'configThuyetMinhL1_save') {
      const configLines = JSON.parse(e.parameter.data || '[]');
      const saveResult = doGet_saveConfigThuyetMinhL1(month, region, configLines);
      return ContentService.createTextOutput(JSON.stringify({
        status: saveResult === 'Success' ? "success" : "error",
        message: saveResult
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const { listThang, dataAnCa, NgayCongChuan, LuongCoBan, TienAnCa, dataStatusTinhLuong } = getAllData();

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      listThang,
      dataAnCa,
      NgayCongChuan,
      LuongCoBan,
      TienAnCa,
      dataStatusTinhLuong
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: `Có lỗi xảy ra: ${error.message}`
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getAllData() {
  const response = Sheets.Spreadsheets.Values.batchGet(idFileData, {
    ranges: [rngDataThang, rngSetup]
  });

  const DmThang = response.valueRanges[0]?.values || [];

  const Thang = DmThang.map(row => row[1]).filter(Boolean); // lấy cột B

  const processedData = DmThang.map(row => {
    const thang = row[1];
    let trangThai = row[12] || "Chưa tạo thuyết minh";

    return [thang, trangThai];
  });

  const Setup = response.valueRanges[2]?.values || [];
  const NgayCongChuan_Setup = Setup[0];
  const LuongCoBan_Setup = Setup[1];
  const TienAnCa_Setup = Setup[3];

  return {
    listThang: Thang,
    NgayCongChuan: NgayCongChuan_Setup,
    LuongCoBan: LuongCoBan_Setup,
    TienAnCa: TienAnCa_Setup,
    dataStatusTinhLuong: processedData
  };
}
