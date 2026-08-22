/**
 * MODULE: DANH MỤC ĐƠN VỊ (doGet_danhMucDonVi)
 * 
 * MÔ TẢ:
 * File này chứa các hàm xử lý dữ liệu và xuất báo cáo Danh mục đơn vị.
 */

/**
 * Lấy dữ liệu danh mục đơn vị từ sheet DataChotNSThang theo tháng đã chọn
 * @param {string} month Tháng cần lấy dữ liệu (định dạng MM/YYYY hoặc YYYY-MM tùy cấu hình, thường là MM/YYYY)
 * @returns {Array<Object>} Danh sách đơn vị đã được định dạng và lọc trùng
 */
function doGet_getDanhMucDonViData(month) {
  if (!month) {
    throw new Error("Vui lòng chọn tháng để lấy danh mục đơn vị.");
  }

  const cache = CacheService.getScriptCache();
  const CACHE_KEY = `cache_dm_donvi_${month}`;
  const cached = cache.get(CACHE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      Logger.log("Lỗi parse cache_dm_donvi: " + e.message);
    }
  }

  const values = fastReadSheetValues(GLOBAL_CONFIG.FILES.DB_DATA_CHOT_NS, 'DataChotNSThang');
  if (!values || values.length < 2) {
    return [];
  }

  const header = values[0];
  const idxKyLuong = getIdx(header, 'Kỳ lương');
  const idxMaDonVi = getIdx(header, 'Mã đơn vị');
  const idxTenDonVi = getIdx(header, 'Tên đơn vị');

  if (idxKyLuong === -1 || idxMaDonVi === -1 || idxTenDonVi === -1) {
    throw new Error("Cấu trúc sheet DataChotNSThang không đúng (thiếu cột Kỳ lương, Mã đơn vị, hoặc Tên đơn vị)");
  }

  const result = [];
  const seenUnits = new Set();

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const kyLuong = String(row[idxKyLuong] || '').trim();
    if (kyLuong !== month) {
      continue;
    }

    const rawCode = String(row[idxMaDonVi] || '').trim();
    const rawName = String(row[idxTenDonVi] || '').trim();

    if (rawCode) {
      // 1. Bỏ tiền tố "DV" ở Mã đơn vị
      let cleanCode = rawCode;
      if (rawCode.startsWith('DV')) {
        cleanCode = rawCode.substring(2);
      }

      // Loại bỏ trùng lặp dựa trên cleanCode
      if (seenUnits.has(cleanCode)) {
        continue;
      }
      seenUnits.add(cleanCode);

      // 2. Ghép chuỗi Tên đơn vị định dạng: [cleanCode] - [rawName]
      const formattedName = `${cleanCode} - ${rawName}`;

      result.push({
        maDonViRaw: rawCode,
        maDonVi: cleanCode,
        tenDonViGoc: rawName,
        tenDonVi: formattedName
      });
    }
  }

  // Sắp xếp theo mã đơn vị tăng dần
  result.sort((a, b) => a.maDonVi.localeCompare(b.maDonVi, undefined, { numeric: true, sensitivity: 'base' }));

  try {
    cache.put(CACHE_KEY, JSON.stringify(result), 21600); // Cache 6 tiếng
  } catch (err) {
    Logger.log("Lỗi ghi cache_dm_donvi: " + err.message);
  }

  return result;
}

/**
 * Trả về dữ liệu cho Client hiển thị bản in Danh mục đơn vị
 * @param {string} month Tháng cần lấy dữ liệu
 * @returns {Object} JSON phản hồi
 */
function doGet_getPrintDanhMucDonVi(month) {
  try {
    const data = doGet_getDanhMucDonViData(month);
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
 * @param {string} month Tháng cần lấy dữ liệu
 * @returns {Object} JSON phản hồi với link tải Excel
 */
function doGet_exportDanhMucDonVi(month) {
  try {
    return doGet_taoBangDanhMucDonViExcel(month);
  } catch (e) {
    return {
      status: "error",
      message: e.message
    };
  }
}

/**
 * Tạo file Excel từ template và trả về đường dẫn tải về
 * @param {string} month Tháng cần lấy dữ liệu
 * @returns {Object} JSON phản hồi chứa downloadUrl
 */
function doGet_taoBangDanhMucDonViExcel(month) {
  const data = doGet_getDanhMucDonViData(month);
  if (!data || data.length === 0) {
    throw new Error("Không có dữ liệu danh mục đơn vị cho tháng " + month);
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
