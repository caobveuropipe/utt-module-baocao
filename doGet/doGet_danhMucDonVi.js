/**
 * MODULE: DANH MỤC ĐƠN VỊ (doGet_danhMucDonVi)
 * 
 * MÔ TẢ:
 * File này chứa các hàm xử lý dữ liệu và xuất báo cáo Danh mục đơn vị.
 */

/**
 * Lấy dữ liệu danh mục đơn vị từ sheet Setup của MASTER_DATA
 * @returns {Array<Object>} Danh sách đơn vị đã được định dạng
 */
function doGet_getDanhMucDonViData() {
  const ssMaster = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.MASTER_DATA);
  const sheetSetup = ssMaster.getSheetByName('Setup');
  if (!sheetSetup) {
    throw new Error("Không tìm thấy sheet 'Setup' trong file Master Data");
  }
  const lastRow = sheetSetup.getLastRow();
  if (lastRow < 2) {
    return [];
  }
  
  // Lấy dữ liệu cột K (Mã đơn vị) và L (Tên đơn vị)
  const dataRaw = sheetSetup.getRange("K2:L" + lastRow).getValues();
  const result = [];
  
  dataRaw.forEach(row => {
    const rawCode = String(row[0] || '').trim();
    const rawName = String(row[1] || '').trim();
    if (rawCode) {
      // 1. Bỏ tiền tố "DV" ở Mã đơn vị
      let cleanCode = rawCode;
      if (rawCode.startsWith('DV')) {
        cleanCode = rawCode.substring(2);
      }
      
      // 2. Ghép chuỗi Tên đơn vị định dạng: [cleanCode] - [rawName]
      const formattedName = `${cleanCode} - ${rawName}`;
      
      result.push({
        maDonViRaw: rawCode,
        maDonVi: cleanCode,
        tenDonViGoc: rawName,
        tenDonVi: formattedName
      });
    }
  });
  
  return result;
}

/**
 * Trả về dữ liệu cho Client hiển thị bản in Danh mục đơn vị
 * @returns {Object} JSON phản hồi
 */
function doGet_getPrintDanhMucDonVi() {
  try {
    const data = doGet_getDanhMucDonViData();
    return {
      status: "success",
      data: data,
      dateExport: `Ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`
    };
  } catch (e) {
    return {
      status: "error",
      message: e.message
    };
  }
}

/**
 * Xuất Excel Danh mục đơn vị
 * @returns {Object} JSON phản hồi với link tải Excel
 */
function doGet_exportDanhMucDonVi() {
  try {
    return doGet_taoBangDanhMucDonViExcel();
  } catch (e) {
    return {
      status: "error",
      message: e.message
    };
  }
}

/**
 * Tạo file Excel từ template và trả về đường dẫn tải về
 * @returns {Object} JSON phản hồi chứa downloadUrl
 */
function doGet_taoBangDanhMucDonViExcel() {
  const data = doGet_getDanhMucDonViData();
  if (!data || data.length === 0) {
    throw new Error("Không có dữ liệu danh mục đơn vị");
  }
  
  let targetFileId = GLOBAL_CONFIG.FILES.EXPORT_DANH_MUC_DON_VI;
  let isTemp = false;
  let ss;
  
  if (!targetFileId) {
    // Nếu chưa cấu hình ID, tự động tạo một file Spreadsheet mới trong Drive
    ss = SpreadsheetApp.create("Danh mục đơn vị - Xuất bản");
    targetFileId = ss.getId();
    isTemp = true;
  } else {
    ss = SpreadsheetApp.openById(targetFileId);
  }
  
  let sheet = ss.getSheetByName("DanhMucDonVi");
  if (!sheet) {
    if (isTemp) {
      sheet = ss.getActiveSheet();
      sheet.setName("DanhMucDonVi");
    } else {
      sheet = ss.insertSheet("DanhMucDonVi");
    }
  } else {
    sheet.clear();
    if (sheet.getFilter()) sheet.getFilter().remove();
    const maxRows = sheet.getMaxRows();
    const maxCols = sheet.getMaxColumns();
    if (maxRows > 1 && maxCols > 1) {
      sheet.getRange(1, 1, maxRows, maxCols).breakApart();
    }
  }
  
  // Viết dữ liệu
  const headers = ["STT", "Mã đơn vị", "TÊN ĐƠN VỊ", "Ghi chú"];
  const rows = data.map((r, idx) => [
    idx + 1,
    "'" + r.maDonVi,
    r.tenDonVi,
    ""
  ]);
  
  // Ghi Headers
  sheet.getRange(1, 1, 1, headers.length)
       .setValues([headers])
       .setFontWeight("bold")
       .setHorizontalAlignment("center")
       .setBackground("#E0E0E0")
       .setFontFamily("Times New Roman")
       .setFontSize(11);
       
  // Ghi Rows
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length)
         .setValues(rows)
         .setFontFamily("Times New Roman")
         .setFontSize(11);
    
    // Format cột Mã đơn vị (Cột 2) dạng TEXT và căn giữa để tránh mất số 0 hàng đầu (Ví dụ '01')
    sheet.getRange(2, 2, rows.length, 1)
         .setNumberFormat('@')
         .setHorizontalAlignment("center");
         
    // Format cột STT (Cột 1) căn giữa
    sheet.getRange(2, 1, rows.length, 1)
         .setHorizontalAlignment("center");
         
    // Vẽ đường kẻ bảng (Borders)
    const tableRange = sheet.getRange(1, 1, rows.length + 1, headers.length);
    tableRange.setBorder(true, true, true, true, true, true, "black", SpreadsheetApp.BorderStyle.SOLID);
  }
  
  // Set độ rộng cột tự động
  sheet.setColumnWidth(1, 50);   // STT
  sheet.setColumnWidth(2, 120);  // Mã đơn vị
  sheet.setColumnWidth(3, 300);  // Tên đơn vị
  sheet.setColumnWidth(4, 150);  // Ghi chú
  
  SpreadsheetApp.flush();
  
  return {
    status: "success",
    downloadUrl: `https://docs.google.com/spreadsheets/d/${targetFileId}/export?format=xlsx`
  };
}

/**
 * Hàm test cho Phase 1
 */
function test_doGet_getDanhMucDonViData() {
  try {
    const data = doGet_getDanhMucDonViData();
    Logger.log("--- TEST RESULTS FOR doGet_getDanhMucDonViData ---");
    Logger.log("Total departments found: " + data.length);
    if (data.length > 0) {
      Logger.log("First item: " + JSON.stringify(data[0]));
      Logger.log("Last item: " + JSON.stringify(data[data.length - 1]));
      
      // Verify prefix removal
      const hasPrefix = data.some(item => item.maDonVi.startsWith('DV'));
      Logger.log("Has any 'DV' prefix remaining: " + hasPrefix + " (Expected: false)");
      
      // Verify name formatting
      Logger.log("Formatted name check: " + data[0].tenDonVi + " (Expected format: [Code] - [Name])");
    } else {
      Logger.log("WARNING: No data retrieved!");
    }
  } catch (e) {
    Logger.log("Error in test_doGet_getDanhMucDonViData: " + e.message);
  }
}
