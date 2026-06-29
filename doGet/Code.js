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
  if (!_sheetNSThang) _sheetNSThang = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.DB_DATA_CHOT_NS).getSheetByName("DataChotNSThang");
  return _sheetNSThang;
}

const rngDataThang = 'DanhMucThang!A2:N';
const rngSetup = 'Setup!B2:B';
const rngDataChotCong = 'DataChotCong!A1:L';
const rngDataChotNsThang = 'DataChotNSThang!A1:AJ';

// ====== GLOBAL CONFIGURATION ======
const GLOBAL_CONFIG = {
  FILES: {
    DATA_LUONG_1: '1j6q9n5TlbW9cPa-ixfn5H_YtUNP_DHLqNLbY4iI9yWQ',
    DATA_LUONG_2: '13JOTPXzwsgFttd6gmKk0mCTgXqKO9R4MJICMWHLvozs',
    TRUY_THU_LUONG_1: '1dHZ9b5SlTn9fqHq0ZR8yrlJYcA44hhbnlHc3OHm6uW0',
    TRUY_THU_LUONG_2: '1rdy605GSv7R_QazPbPA7qXBEkzzqoDB0Kx-lhrAB6ew',
    DATA_AN_CA: '1Rg3x5TL-0AS5hOLcvdTI7EfrfCFG8T0wd2TrIiKWUno',
    MASTER_DATA: '1OH2HsnDShrkFfM-R8EJo3hwGDOsQh-e43Dmb2xaiudw',
    DB_DATABASE: '1-pKqPF-GpmoTXno1no5NN-JRIMLsHwBqGx1xdLHPgr4',
    DB_DATA_CHOT_NS: '1F1mCFuDunYXO8wGFm-CQnujY_6mg9PUf5PGf-njgBkU',

    // ID BÁO CÁO - ĐI KHO BẠC
    EXPORT_DKB_TH_LUONG: '1DmkNhugNuzzlH0SQG41MYvC2VjG-pxfAHUEDs45jJ7E',
    EXPORT_DKB_TH_BH: '1EZB6W8QUQ8XIJ6MwHpcukkIXdewoPCt4FsjxCjw3U84',
    EXPORT_DKB_TH_KPCD: '1j2ZcC1QJHlDCHm7y_hpP3gG59ULSrnER7MN9oSocHNE',
    EXPORT_DKB_TH_KHOAN_TRU: '1r-rS_42v-nVfxlSj1XAbopgnesWteRfiUMSgvxr-cr8',
    EXPORT_DKB_TH_CK: '17-QjaNCIPDFg0CL_9eVYStL87I3L-xtaj1jSWRmDk0A',

    // ID BÁO CÁO - HẠCH TOÁN
    EXPORT_HT_TH_BH: '1D0cxHbc3sS5YxMcpaWYE5T6eOmsLozmpgihupyR0CP0',
    EXPORT_HT_TH_KPCD: '1hrSMQHS-Mk7vTkKNpRiKAnB6CXzYQfO75wbGvancd_A',
    EXPORT_HT_PHAN_BO_LUONG_BHXH: '1FZ1t_RszFsr8urWnD7hNc0KlKv_oXLWQn_2eoavU5LY',
    EXPORT_HT_TH_LUONG_VA_TTTL: '1v872ZkdnogcPSOdYvAmzi9EBPEMiMB2ZA_rZiNpBQJI',
    
    // ID BÁO CÁO - KHÁC
    EXPORT_OTHER_TRU_KPCD_QUY: '1ab05SaEsAzVsbiuQqFJ5UNrlaj3IWYyI-nL5JwkzHj4',
    EXPORT_DANH_MUC_DON_VI: ''
  },
  SHEETS: {
    DATA_LUONG_1: 'DataLuong1',
    DATA_LUONG_2: 'DataLuong2',
    DATA_TRUY_THU: 'DataTruyThuLinh',
    DATA_AN_CA: 'DataAnCa',
    DATA_CHOT_NS: 'DataChotNSThang',
    DATA_NHAN_SU: 'DataNhanSu',
    DATABASE_L1: 'DatabaseL1',
    SHEET_TH_LUONG: 'THLuong',
    SHEET_TH_BH: 'THBH',
    SHEET_TH_KPCD: 'THKPCD',
    SHEET_TRU_KPCD_QUY: 'KPCD',
    MASTER: 'Master'
  },
  VALUES: {
    LUONG_CO_BAN: 2340000
  }
};

function doGet(e) {
  try {
    const type = e.parameter.type || '';    // lấy tham số loại get từ url
    const month = e.parameter.month || '';  // lấy tham số tháng get dữ liệu từ url
    const location = e.parameter.location || ''; // lấy tham số địa phương
    const exportFormat = e.parameter.exportFormat || 'pdf'; // định dạng xuất (pdf, xlsx, sheet)

    // ====== ROUTING GUIDE / BẢNG CHỈ DẪN ======
    const ROUTE_MAP = {
      // --- Kho Bạc ---
      'taoBangTongHopLuong': { fn: doGet_taoBangTongHopLuong, desc: 'Tạo bảng tổng hợp lương' },
      'taoBangTongHopBaoHiem': { fn: doGet_taoBangTongHopBaoHiem, desc: 'Tạo bảng tổng hợp bảo hiểm' },
      'taoBangTongHopKhoanTru': { fn: doGet_taoBangTongHopKhoanTru, desc: 'Tạo bảng tổng hợp các khoản trừ' },
      'taoBangTongHopKPCD': { fn: doGet_taoBangTongHopKPCD, desc: 'Tạo bảng tổng hợp KPCĐ' },
      'tongHopCk': { fn: doGet_taoBangTongHopCk, desc: 'Tạo bảng tổng hợp CK' },
      'getPrintDataCk': { fn: getPrintDataCk, desc: 'Lấy dữ liệu in bảng CK' },
      'getPrintDataTongHopLuong': { fn: getPrintDataTongHopLuong, desc: 'Lấy dữ liệu in tổng hợp lương' },

      // --- Hạch Toán ---
      'taoBangHachToanBaoHiem': { fn: doGet_taoBangHachToanBaoHiem, desc: 'Tạo bảng hạch toán bảo hiểm' },
      'taoBangHachToanKPCD': { fn: doGet_taoBangHachToanKPCD, desc: 'Tạo bảng hạch toán KPCĐ' },
      'taoBangPhanBoLuongBHXH': { fn: doGet_taoBangPhanBoLuongBHXH, desc: 'Tạo bảng phân bổ lương BHXH' },
      'taoBangHachToanLuongVaTruyLinh': { fn: doGet_taoBangHachToanLuongVaTruyLinh, desc: 'Tạo bảng kê hạch toán lương và truy lĩnh lương' },

      // --- Chức năng khác ---
      'taoBangTruKPCDVaCacQuy': { fn: doGet_taoBangTruKPCDVaCacQuy, desc: 'Tạo bảng trừ KPCĐ và các quỹ' },
      'getPrintDataTruKPCDVaCacQuy': { fn: getPrintDataTruKPCDVaCacQuy, desc: 'Lấy dữ liệu in trừ KPCĐ và các quỹ' },
      'exportTongHopExcel': { fn: exportTongHopExcelBase64, desc: 'Xuất file Excel Tổng Hợp Lương (Base64)' },
      'getPrintDanhMucDonVi': { fn: doGet_getPrintDanhMucDonVi, desc: 'Lấy dữ liệu in danh mục đơn vị' },
      'exportDanhMucDonVi': { fn: doGet_exportDanhMucDonVi, desc: 'Xuất file Excel danh mục đơn vị' },
    };

    // Kiểm tra và thực thi Route
    if (ROUTE_MAP[type]) {
      const handlerInfo = ROUTE_MAP[type];
      try {
        Logger.log(`Executing route: ${type} (${handlerInfo.desc}) - Location: ${location} - Format: ${exportFormat}`);

        // ----- SECURITY CHECK -----
        if (type === 'exportTongHopExcel') {
          const reqToken = e.parameter.token || '';
          const validToken = PropertiesService.getScriptProperties().getProperty('API_SECRET_TOKEN');
          if (!validToken || reqToken !== validToken) {
            return ContentService.createTextOutput(JSON.stringify({
              status: "error",
              message: "Unauthorized: Invalid or missing API token."
            })).setMimeType(ContentService.MimeType.JSON);
          }
        }
        // --------------------------

        let result;
        // Cập nhật: Tất cả các báo cáo cần lọc khu vực được đưa vào đây
        const locationEnabledReports = [
          'taoBangTongHopBaoHiem', 'tongHopCk', 'getPrintDataCk', 
          'taoBangTongHopKhoanTru', 'taoBangTongHopKPCD',
          'taoBangTongHopLuong', 'getPrintDataTongHopLuong',
          'taoBangHachToanBaoHiem', 'taoBangHachToanKPCD',
          'taoBangPhanBoLuongBHXH', 'taoBangHachToanLuongVaTruyLinh',
          'taoBangTruKPCDVaCacQuy', 'getPrintDataTruKPCDVaCacQuy',
          'exportTongHopExcel'
        ];

        const noMonthReports = ['getPrintDanhMucDonVi', 'exportDanhMucDonVi'];

        if (noMonthReports.includes(type)) {
          result = handlerInfo.fn();
        } else if (locationEnabledReports.includes(type)) {
          result = handlerInfo.fn(month, location);
        } else {
          result = handlerInfo.fn(month);
        }

        // --- XỬ LÝ ĐỊNH DẠNG XUẤT ---
        let downloadUrl = (typeof result === 'object' && result !== null) ? result.downloadUrl : result;
        
        if (downloadUrl && typeof downloadUrl === 'string' && exportFormat !== 'pdf' && downloadUrl.includes('/export')) {
          const fileIdMatch = downloadUrl.match(/\/d\/([^\/?]+)/);
          if (fileIdMatch && fileIdMatch[1]) {
            const fileId = fileIdMatch[1];
            if (exportFormat === 'xlsx') {
              downloadUrl = `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx`;
            } else if (exportFormat === 'sheet') {
              downloadUrl = `https://docs.google.com/spreadsheets/d/${fileId}/edit`;
            }
          }
        }

        // Chuẩn hóa phản hồi
        let responseObj;
        if (typeof result === 'object' && result !== null) {
          responseObj = {
            ...result,
            status: result.status || "success",
            downloadUrl: downloadUrl
          };
        } else {
          responseObj = {
            status: "success",
            downloadUrl: downloadUrl
          };
        }

        return ContentService.createTextOutput(JSON.stringify(responseObj)).setMimeType(ContentService.MimeType.JSON);

      } catch (error) {
        Logger.log(`Lỗi khi ${handlerInfo.desc}: %s`, error.message);
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: error.message
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // ====== DEFAULT HANDLER (Mặc định: Lấy dữ liệu Select Box) ======
    const { listThang, listDiaPhuong, dataAnCa, NgayCongChuan, LuongCoBan, TienAnCa, dataStatusTinhLuong } = getAllData();

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      listThang,
      listDiaPhuong,
      dataAnCa,
      NgayCongChuan,
      LuongCoBan,
      TienAnCa,
      dataStatusTinhLuong
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: `Có lỗi xảy ra (Global): ${error.message}`
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

  const Setup = response.valueRanges[1]?.values || [];
  const NgayCongChuan_Setup = Setup[0] ? Setup[0][0] : 0;
  const LuongCoBan_Setup = Setup[1] ? Setup[1][0] : 0;
  const TienAnCa_Setup = Setup[3] ? Setup[3][0] : 0;

  // --- LẤY DANH SÁCH ĐỊA PHƯƠNG TỰ ĐỘNG ---
  const cache = CacheService.getScriptCache();
  const cachedLocs = cache.get("listDiaPhuong");
  
  let listDiaPhuong;
  if (cachedLocs) {
    listDiaPhuong = JSON.parse(cachedLocs);
  } else {
    listDiaPhuong = ["Hà Nội", "Phú Thọ"]; // Mặc định
    try {
      // Sử dụng Sheets API trực tiếp để tránh mở SpreadsheetApp (rất chậm)
      const rangeName = `'${GLOBAL_CONFIG.SHEETS.DATA_NHAN_SU}'!A1:Z1000`; // Lấy tối đa 1000 dòng đầu để tìm khu vực
      const responseMaster = Sheets.Spreadsheets.Values.get(GLOBAL_CONFIG.FILES.MASTER_DATA, rangeName);
      const dataNS = responseMaster.values;
      
      if (dataNS && dataNS.length > 0) {
        const header = dataNS[0];
        const idxKV = header.indexOf('Khu vực');
        if (idxKV !== -1) {
          const uniqueLocs = new Set();
          dataNS.slice(1).forEach(r => {
            let v = normalizeLocation(r[idxKV]);
            if (v) uniqueLocs.add(v);
          });
          if (uniqueLocs.size > 0) {
            listDiaPhuong = Array.from(uniqueLocs).sort();
            // Cache lại trong 1 giờ (3600 giây)
            cache.put("listDiaPhuong", JSON.stringify(listDiaPhuong), 3600);
          }
        }
      }
    } catch (e) {
      Logger.log("Error fetching dynamic locations via Sheets API: " + e.message);
    }
  }

  return {
    listThang: Thang,
    listDiaPhuong: listDiaPhuong,
    NgayCongChuan: NgayCongChuan_Setup,
    LuongCoBan: LuongCoBan_Setup,
    TienAnCa: TienAnCa_Setup,
    dataStatusTinhLuong: processedData
  };
}

/**
 * Alias cho getAllData() để tương thích với lời gọi từ Client
 */
function pg1_ed1_getAllData() {
  try {
    return {
      status: "success",
      ...getAllData()
    };
  } catch (e) {
    return {
      status: "error",
      message: e.message
    };
  }
}

/**
 * Alias cho getPrintDataCk() để tương thích với lời gọi từ Client
 */
function pg1_ed1_getPrintDataCk(monthStr, location = 'All') {
  try {
    return getPrintDataCk(monthStr, location);
  } catch (e) {
    return {
      status: "error",
      message: e.message
    };
  }
}

/**
 * Alias cho doGet_getPrintDanhMucDonVi() để tương thích với lời gọi từ Client
 */
function pg1_ed1_getPrintDanhMucDonVi() {
  try {
    return doGet_getPrintDanhMucDonVi();
  } catch (e) {
    return {
      status: "error",
      message: e.message
    };
  }
}

// =================================================================================================
// --- CHỨC NĂNG: TỔNG HỢP TRỪ KPCĐ VÀ CÁC QUỸ ---
// =================================================================================================

function doGet_taoBangTruKPCDVaCacQuy(monthStr, location = 'All') {
  // LƯU Ý: Thay đổi ID này bằng ID thực tế của file Google Sheet báo cáo
  const TARGET_FILE_ID = GLOBAL_CONFIG.FILES.EXPORT_OTHER_TRU_KPCD_QUY === '1-placeholder-id-tru-kpcd-quy' 
    ? '1DmkNhugNuzzlH0SQG41MYvC2VjG-pxfAHUEDs45jJ7E' // Tạm dùng chung với TH Lương nếu chưa có ID riêng
    : GLOBAL_CONFIG.FILES.EXPORT_OTHER_TRU_KPCD_QUY;
    
  const TARGET_SHEET_NAME = GLOBAL_CONFIG.SHEETS.SHEET_TRU_KPCD_QUY || 'KPCD';
  const HEADER_ROW = 6;
  const START_ROW = 7;
  
  const ssLuong1 = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.DATA_LUONG_1);
  const ssMaster = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.MASTER_DATA);

  try {
    const exportData = doGet_tongHopTruKPCD(monthStr, { ssLuong1, ssMaster }, location);
    if (!exportData || !exportData.length) {
      return { status: "error", message: "KhÃ´ng cÃ³ dá»¯ liá»‡u cho ká»³ nÃ y" };
    }

    const targetSpreadsheet = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.EXPORT_OTHER_TRU_KPCD_QUY);
    const targetSheet = targetSpreadsheet.getSheetByName(TARGET_SHEET_NAME);
    if (!targetSheet) {
      throw new Error('KhÃ´ng tÃ¬m tháº¥y sheet "' + TARGET_SHEET_NAME + '" trong file xuáº¥t');
    }

    const currentMaxRows = Math.max(targetSheet.getMaxRows(), 1);
    const currentMaxCols = Math.max(targetSheet.getMaxColumns(), 7);
    targetSheet.clear();
    targetSheet.clearFormats();
    if (targetSheet.getFilter()) targetSheet.getFilter().remove();
    targetSheet.getRange(1, 1, currentMaxRows, currentMaxCols).breakApart();

    const periodParts = monthStr.substring(1).split('.');
    const periodMonth = parseInt(periodParts[0], 10);
    const periodYear = periodParts[1];
    const tableHeaders = ['SỐ\nTT', 'MÃ CB', 'HỌ VÀ TÊN', 'KPCĐ', 'Quỹ tình nghĩa', 'Các khoản thu khác', 'Ghi chú'];
    const totalKpcdValue = exportData.reduce((sum, row) => sum + (Number(row[3]) || 0), 0);
    const totalQuyValue = exportData.reduce((sum, row) => sum + (Number(row[4]) || 0), 0);
    const totalKhacValue = exportData.reduce((sum, row) => sum + (Number(row[5]) || 0), 0);
    const totalRowIndex = START_ROW + exportData.length;
    const wordsRowIndex = totalRowIndex + 2;
    const signatureRowIndex = wordsRowIndex + 2;
    const requiredRows = signatureRowIndex + 6;

    if (targetSheet.getMaxRows() < requiredRows) {
      targetSheet.insertRowsAfter(targetSheet.getMaxRows(), requiredRows - targetSheet.getMaxRows());
    }
    if (targetSheet.getMaxColumns() < 7) {
      targetSheet.insertColumnsAfter(targetSheet.getMaxColumns(), 7 - targetSheet.getMaxColumns());
    }

    targetSheet.setHiddenGridlines(true);
    targetSheet.setFrozenRows(HEADER_ROW);
    targetSheet.setFrozenColumns(0);

    targetSheet.getRange('A1:G1').merge().setValue('TRƯỜNG ĐẠI HỌC CÔNG NGHỆ GIAO THÔNG VẬN TẢI');
    targetSheet.getRange('A2:G2').merge().setValue(location && location !== 'All' ? 'Cơ sở: ' + String(location).toUpperCase() : '');
    targetSheet.getRange(3, 1, 2, 7).merge().setValue(`DANH SÁCH TRỪ KP CÔNG ĐOÀN VÀ CÁC QUỸ\nTHÁNG ${periodMonth} NĂM ${periodYear}`);

    targetSheet.getRange(HEADER_ROW, 1, 1, 7).setValues([tableHeaders]);
    targetSheet.getRange(START_ROW, 1, exportData.length, 7).setValues(exportData);
    targetSheet.getRange(totalRowIndex, 1, 1, 7).setValues([['', '', 'TỔNG CỘNG', totalKpcdValue, totalQuyValue, totalKhacValue, '']]);

    targetSheet.getRange(1, 1, signatureRowIndex + 6, 7)
      .setFontFamily('Times New Roman')
      .setFontSize(12)
      .setVerticalAlignment('middle');

    targetSheet.getRange('A1').setFontWeight('bold').setFontSize(11).setHorizontalAlignment('left');
    targetSheet.getRange('A2').setFontWeight('bold').setFontSize(11).setHorizontalAlignment('left');
    targetSheet.getRange(3, 1).setFontWeight('bold').setFontSize(16).setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);

    targetSheet.getRange(HEADER_ROW, 1, 1, 7)
      .setFontWeight('bold')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle')
      .setWrap(true);

    targetSheet.setRowHeight(3, 28);
    targetSheet.setRowHeight(4, 28);
    targetSheet.setRowHeight(HEADER_ROW, 54);
    targetSheet.setRowHeightsForced(START_ROW, exportData.length + 1, 28);

    targetSheet.getRange(START_ROW, 1, exportData.length, 1).setHorizontalAlignment('center');
    targetSheet.getRange(START_ROW, 2, exportData.length, 1).setHorizontalAlignment('center');
    targetSheet.getRange(START_ROW, 3, exportData.length, 1).setHorizontalAlignment('left');
    targetSheet.getRange(START_ROW, 4, exportData.length + 1, 3).setHorizontalAlignment('right').setNumberFormat('#,##0');
    targetSheet.getRange(START_ROW, 7, exportData.length + 1, 1).setHorizontalAlignment('left');
    targetSheet.getRange(totalRowIndex, 1, 1, 7).setFontWeight('bold');
    targetSheet.getRange(totalRowIndex, 3).setHorizontalAlignment('center');

    targetSheet.setColumnWidth(1, 55);
    targetSheet.setColumnWidth(2, 85);
    targetSheet.setColumnWidth(3, 250);
    targetSheet.setColumnWidth(4, 170);
    targetSheet.setColumnWidth(5, 185);
    targetSheet.setColumnWidth(6, 185);
    targetSheet.setColumnWidth(7, 150);

    const fullTableRange = targetSheet.getRange(HEADER_ROW, 1, exportData.length + 2, 7);
    fullTableRange.setBorder(true, true, true, true, true, null, 'black', SpreadsheetApp.BorderStyle.SOLID);
    fullTableRange.setBorder(null, null, null, null, null, true, 'black', SpreadsheetApp.BorderStyle.DOTTED);
    targetSheet.getRange(HEADER_ROW, 1, 1, 7).setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.SOLID);
    targetSheet.getRange(totalRowIndex, 1, 1, 7).setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.SOLID);

    const grandTotalValue = totalKpcdValue + totalQuyValue + totalKhacValue;
    let moneyInWords = 'Bằng chữ: ';
    if (typeof numberToVietnameseWords === 'function') {
      moneyInWords += numberToVietnameseWords(grandTotalValue);
    } else {
      moneyInWords += '................................................................................';
    }
    targetSheet.getRange(wordsRowIndex, 1, 1, 7).merge()
      .setValue(moneyInWords)
      .setFontWeight('bold')
      .setFontStyle('italic')
      .setHorizontalAlignment('left');

    const exportDateText = Utilities.formatDate(new Date(), 'GMT+7', "'Ngày 'dd' tháng 'MM' năm 'yyyy");
    targetSheet.getRange(signatureRowIndex, 5, 1, 3).merge().setValue(exportDateText).setHorizontalAlignment('center').setFontStyle('italic');
    targetSheet.getRange(signatureRowIndex + 1, 5, 1, 3).merge().setValue('Người lập').setHorizontalAlignment('center').setFontWeight('bold');

    return `https://docs.google.com/spreadsheets/d/${GLOBAL_CONFIG.FILES.EXPORT_OTHER_TRU_KPCD_QUY}/export?format=xlsx`;

    const resultData = doGet_tongHopTruKPCD(monthStr, { ssLuong1, ssMaster }, location);
    if (!resultData || !resultData.length) return { status: "error", message: "Không có dữ liệu cho kỳ này" };

    const ss = SpreadsheetApp.openById(TARGET_FILE_ID);
    let sheet = ss.getSheetByName(TARGET_SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(TARGET_SHEET_NAME);
    else {
      sheet.clear();
      if (sheet.getFilter()) sheet.getFilter().remove();
      const maxRows = sheet.getMaxRows();
      const maxCols = sheet.getMaxColumns();
      if (maxRows > 1 && maxCols > 1) {
        sheet.getRange(1, 1, maxRows, maxCols).breakApart();
      }
    }

    const monthParts = monthStr.substring(1).split('.');
    const month = parseInt(monthParts[0]);
    const year = monthParts[1];

    // --- RENDER HEADERS ---
    sheet.getRange("A1").setValue("TRƯỜNG ĐẠI HỌC CÔNG NGHỆ GTVT").setFontWeight('bold').setFontSize(11);
    const title = `DANH SÁCH TRỪ KP CÔNG ĐOÀN VÀ CÁC QUỸ \nTHÁNG ${month} NĂM ${year}`;
    sheet.getRange(3, 1, 2, 7).merge().setValue(title)
      .setHorizontalAlignment("center").setVerticalAlignment("middle")
      .setFontWeight('bold').setFontSize(14).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);

    const headers = ['STT', 'Mã CB', 'Họ và tên', 'KPCĐ', 'Quỹ tình nghĩa', 'Các khoản thu khác', 'Ghi chú'];
    sheet.getRange(6, 1, 1, 7).setValues([headers])
      .setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle')
      .setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.SOLID);

    // --- RENDER DATA ---
    sheet.getRange(7, 1, resultData.length, 7).setValues(resultData)
      .setVerticalAlignment('middle');
    
    // Format numbers
    sheet.getRange(7, 4, resultData.length, 3).setNumberFormat('#,##0');
    sheet.getRange(7, 1, resultData.length, 2).setHorizontalAlignment('center');

    // Total Row
    const lastRow = 6 + resultData.length;
    const totalKpcd = resultData.reduce((sum, row) => sum + (Number(row[3]) || 0), 0);
    const totalQuy = resultData.reduce((sum, row) => sum + (Number(row[4]) || 0), 0);
    const totalKhac = resultData.reduce((sum, row) => sum + (Number(row[5]) || 0), 0);

    const totalRow = ['', '', 'TỔNG CỘNG', totalKpcd, totalQuy, totalKhac, ''];
    sheet.getRange(lastRow + 1, 1, 1, 7).setValues([totalRow]).setFontWeight('bold')
      .setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.SOLID);

    // --- STYLING ---
    sheet.getRange(1, 1, lastRow + 10, 7).setFontFamily('Times New Roman').setFontSize(12);
    sheet.getRange(6, 1, resultData.length + 2, 7).setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.THIN);
    
    sheet.setColumnWidth(1, 40);
    sheet.setColumnWidth(2, 80);
    sheet.setColumnWidth(3, 200);
    sheet.setColumnWidth(4, 100);
    sheet.setColumnWidth(5, 100);
    sheet.setColumnWidth(6, 120);
    sheet.setColumnWidth(7, 100);

    // --- FOOTER ---
    const footerRow = lastRow + 3;
    const totalAll = totalKpcd + totalQuy + totalKhac;
    let bangChu = "Bằng chữ: ";
    if (typeof numberToVietnameseWords === 'function') {
      bangChu += numberToVietnameseWords(totalAll);
    } else {
      bangChu += "................................................................................";
    }
    sheet.getRange(footerRow, 1, 1, 7).merge().setValue(bangChu).setFontStyle('italic').setFontWeight('bold');

    const todayStr = Utilities.formatDate(new Date(), "GMT+7", "'Ngày 'dd' tháng 'MM' năm 'yyyy");
    sheet.getRange(footerRow + 2, 5, 1, 3).merge().setValue(todayStr).setHorizontalAlignment('center').setFontStyle('italic');
    sheet.getRange(footerRow + 3, 5, 1, 3).merge().setValue('Người lập').setFontWeight('bold').setHorizontalAlignment('center');

    return `https://docs.google.com/spreadsheets/d/${TARGET_FILE_ID}/export?format=pdf&size=A4&portrait=true&fitw=true&gridlines=false&horizontal_alignment=CENTER`;
  } catch (e) {
    Logger.log('Error doGet_taoBangTruKPCDVaCacQuy: ' + e.message);
    throw e;
  }
}

function doGet_tongHopTruKPCD(monthStr, resources, location = 'All') {
  const locationNormalized = (location && location !== 'All') ? normalizeLocation(location) : null;
  const shNSThang = getSheetNSThang();
  const valuesNS = shNSThang.getDataRange().getValues();
  const headerNS = valuesNS[0];
  const idxKyNS = headerNS.indexOf('Kỳ lương');
  const idxMaNS = headerNS.indexOf('Mã nhân sự');
  const idxDonViNS = headerNS.indexOf('Mã đơn vị');
  let idxKVNS = headerNS.indexOf('Khu vực');
  if (idxKVNS < 0) idxKVNS = 38;

  const maDonViMap = {};
  const khuVucMap = {};
  valuesNS.slice(1).forEach(row => {
    if (String(row[idxKyNS]).trim() === monthStr) {
      const ma = String(row[idxMaNS]).trim();
      if (ma) {
        maDonViMap[ma] = String(row[idxDonViNS] || '').trim();
        khuVucMap[ma] = normalizeLocation(row[idxKVNS]);
      }
    }
  });

  const shLuong1 = resources.ssLuong1.getSheetByName(GLOBAL_CONFIG.SHEETS.DATA_LUONG_1);
  const valuesL1 = shLuong1.getDataRange().getValues();
  const headerL1 = valuesL1[0];
  const idxKyL1 = headerL1.indexOf('Kỳ lương');
  const idxMaL1 = headerL1.indexOf('Mã CB');
  const idxHoTenL1 = headerL1.indexOf('Họ và tên');
  const idxKPCDL1 = getIdx(headerL1, 'KPCĐ');
  const idxTruKhacL1 = getIdx(headerL1, 'Trừ khác');

  const employeeMap = {};
  valuesL1.slice(1).forEach(row => {
    if (String(row[idxKyL1]).trim() === monthStr) {
      const ma = String(row[idxMaL1]).trim();
      if (ma) {
        employeeMap[ma] = {
          maCB: ma,
          hoTen: String(row[idxHoTenL1] || '').trim(),
          kpcd: Number(row[idxKPCDL1]) || 0,
          truKhac: Number(row[idxTruKhacL1]) || 0
        };
      }
    }
  });

  const output = [];
  Object.keys(maDonViMap).forEach(maCB => {
    if (locationNormalized && khuVucMap[maCB] !== locationNormalized) return;
    const emp = employeeMap[maCB];
    if (!emp) return;
    
    // Bỏ chữ CB ở đầu nếu có
    const displayMaCB = emp.maCB.replace(/^CB/i, '');
    
    output.push([0, displayMaCB, emp.hoTen, emp.kpcd, emp.truKhac, 0, '', maDonViMap[maCB]]);
  });

  output.sort((a, b) => {
    const dvA = String(a[7] || '').trim();
    const dvB = String(b[7] || '').trim();
    if (dvA < dvB) return -1;
    if (dvA > dvB) return 1;

    // Lớp trong cùng: Mã CB tăng dần (sau khi đã bỏ CB)
    // displayMaCB ở index 1 đã được bỏ chữ CB ở trước.
    const maCBA = String(a[1] || '').trim();
    const maCBB = String(b[1] || '').trim();

    const getNumericMaCB = (val) => {
      const num = parseInt(val, 10);
      return isNaN(num) ? val : num;
    };

    const numA = getNumericMaCB(maCBA);
    const numB = getNumericMaCB(maCBB);

    if (typeof numA === 'number' && typeof numB === 'number') {
      return numA - numB;
    }
    return String(numA).localeCompare(String(numB));
  });
  return output.map((row, idx) => {
    row[0] = idx + 1;
    return row.slice(0, 7);
  });
}

function getPrintDataTruKPCDVaCacQuy(monthStr, location = 'All') {
  try {
    const ssLuong1 = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.DATA_LUONG_1);
    const ssMaster = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.MASTER_DATA);
    const result = doGet_tongHopTruKPCD(monthStr, { ssLuong1, ssMaster }, location);
    if (!result || !result.length) throw new Error("Không có dữ liệu cho kỳ này");
    const totalAll = result.reduce((sum, row) => sum + (Number(row[3]) || 0) + (Number(row[4]) || 0) + (Number(row[5]) || 0), 0);
    const moneyInWords = (typeof numberToVietnameseWords === 'function') ? numberToVietnameseWords(totalAll) : "................................................";
    const monthParts = monthStr.substring(1).split('.');
    return {
      status: "success",
      month: monthParts[0],
      year: monthParts[1],
      data: result,
      moneyInWords: moneyInWords,
      dateExport: Utilities.formatDate(new Date(), "GMT+7", "'Ngày 'dd' tháng 'MM' năm 'yyyy")
    };
  } catch (e) {
    return { status: "error", message: e.message };
  }
}
