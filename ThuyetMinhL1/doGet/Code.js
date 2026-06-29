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
      const totalSums = doGet_getTotalSalarySums(month, region);
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
      const configData = doGet_loadConfigThuyetMinhL1(month);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        configData
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
