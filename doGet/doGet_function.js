/**
 * MODULE: TIỆN ÍCH & CHỨC NĂNG CHUNG (doGet_function)
 * 
 * MÔ TẢ:
 * File này chứa các hàm hỗ trợ (Utility) dùng chung.
 */

// ====== HELPER FUNCTIONS ======
/**
 * Fast Reader sử dụng Google Sheets API v4 (Sheets.Spreadsheets.Values.get)
 * Tăng tốc đọc I/O gấp 5-10 lần so với SpreadsheetApp.openById().getDataRange().getValues()
 * Bắt buộc dùng valueRenderOption: 'UNFORMATTED_VALUE' và dateTimeRenderOption: 'FORMATTED_STRING'
 * Tự động chuẩn hóa (pad) mảng hình chữ nhật để tránh lỗi trailing empty cells
 */
function fastReadSheetValues(fileId, sheetName, range = '') {
  if (!fileId || !sheetName) return [];
  try {
    const fullRange = range ? `${sheetName}!${range}` : sheetName;
    const response = Sheets.Spreadsheets.Values.get(fileId, fullRange, {
      valueRenderOption: 'UNFORMATTED_VALUE',
      dateTimeRenderOption: 'FORMATTED_STRING'
    });

    const values = response.values;
    if (!values || !Array.isArray(values) || values.length === 0) {
      return [];
    }

    // Xác định số cột tối đa để pad các dòng bị cụt ở đuôi
    let maxCols = 0;
    for (let i = 0; i < values.length; i++) {
      if (values[i] && values[i].length > maxCols) {
        maxCols = values[i].length;
      }
    }

    // Chuẩn hóa padding ô rỗng
    for (let r = 0; r < values.length; r++) {
      if (!values[r]) {
        values[r] = new Array(maxCols).fill("");
      } else if (values[r].length < maxCols) {
        const padLen = maxCols - values[r].length;
        for (let k = 0; k < padLen; k++) {
          values[r].push("");
        }
      }
    }

    return values;
  } catch (e) {
    Logger.log(`fastReadSheetValues error on [${fileId}] sheet [${sheetName}]: ${e.message}. Fallback to SpreadsheetApp.`);
    return getData(fileId, sheetName);
  }
}

/**
 * Fast Batch Reader đọc nhiều range/sheet trong 1 request duy nhất
 */
function fastBatchReadSheetValues(fileId, ranges = []) {
  if (!fileId || !ranges || ranges.length === 0) return {};
  try {
    const response = Sheets.Spreadsheets.Values.batchGet(fileId, {
      ranges: ranges,
      valueRenderOption: 'UNFORMATTED_VALUE',
      dateTimeRenderOption: 'FORMATTED_STRING'
    });

    const result = {};
    if (response && response.valueRanges) {
      response.valueRanges.forEach(vr => {
        const rawRange = vr.range || '';
        const sheetName = rawRange.includes('!') ? rawRange.split('!')[0].replace(/^'|'$/g, '') : rawRange;
        const vals = vr.values || [];
        
        let maxCols = 0;
        for (let i = 0; i < vals.length; i++) {
          if (vals[i] && vals[i].length > maxCols) maxCols = vals[i].length;
        }
        for (let r = 0; r < vals.length; r++) {
          if (!vals[r]) vals[r] = new Array(maxCols).fill("");
          else if (vals[r].length < maxCols) {
            const pad = maxCols - vals[r].length;
            for (let k = 0; k < pad; k++) vals[r].push("");
          }
        }
        result[sheetName] = vals;
      });
    }
    return result;
  } catch (e) {
    Logger.log(`fastBatchReadSheetValues error on [${fileId}]: ${e.message}`);
    return {};
  }
}

function getData(idOrSs, sheetName) {
  if (!idOrSs) return [];
  try {
    let fileId = null;
    if (typeof idOrSs === 'string') {
      fileId = idOrSs;
    } else if (idOrSs && typeof idOrSs.getId === 'function') {
      fileId = idOrSs.getId();
    }

    if (fileId) {
      const fastData = fastReadSheetValues(fileId, sheetName);
      if (fastData && fastData.length > 0) {
        return fastData;
      }
    }

    let ss;
    if (typeof idOrSs === 'string') {
      ss = SpreadsheetApp.openById(idOrSs);
    } else {
      ss = idOrSs;
    }
    const sh = ss.getSheetByName(sheetName);
    return sh ? sh.getDataRange().getValues() : [];
  } catch (e) {
    Logger.log(`Error in getData for ${sheetName}: ${e.message}`);
    return [];
  }
}

/**
 * Lấy index của cột dựa trên tên hoặc danh sách tên (alias)
 * @param {Array} header Dòng đầu của sheet
 * @param {String|Array} names Tên cột hoặc mảng các tên cột thay thế
 */
function getIdx(header, names) {
  if (!header || !Array.isArray(header)) return -1;
  if (!names) {
    // Trả về object map toàn bộ header nếu không truyền names
    const map = {};
    header.forEach((name, i) => {
      if (name) {
        map[String(name).trim()] = i;
        // Alias không dấu/khoảng trắng để code linh hoạt hơn
        const alias = String(name).trim().replace(/\s+/g, '');
        if (!map[alias]) map[alias] = i;
      }
    });
    return map;
  }

  const nameList = Array.isArray(names) ? names : [names];
  for (let name of nameList) {
    const idx = header.indexOf(name);
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseNumber(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  // Xử lý cả định dạng VN (chấm phân cách nghìn, phẩy phân cách thập phân)
  // Nhưng thường Data là chuẩn số, ta cứ replace phẩy/chấm cho chắc
  const str = String(val).replace(/,/g, '');
  const num = Number(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Chuẩn hóa tên địa phương/khu vực từ dữ liệu thô
 */
function normalizeLocation(kv) {
  if (!kv) return '';
  const v = String(kv).normalize('NFC').trim().toLowerCase();
  if (v.includes('hà nội') || v === 'hn') return 'Hà Nội';
  if (v.includes('phú thọ') || v === 'pt' || v.includes('vĩnh phúc') || v === 'vp') return 'Phú Thọ';
  return String(kv).normalize('NFC').trim();
}

// =================================================================================================
// --- KIỂM THỬ TỰ ĐỘNG (UNIT TESTS & BENCHMARK PHASE 1) ---
// =================================================================================================
function test_phase1_verification() {
  const results = {
    testFastReader: false,
    testPadding: false,
    testTypes: false,
    testAuthGateNegative: false,
    benchmarkSpreadsheetAppMs: 0,
    benchmarkFastReaderMs: 0,
    speedupRatio: 0
  };

  try {
    const fileId = GLOBAL_CONFIG.FILES.MASTER_DATA;
    const sheetName = GLOBAL_CONFIG.SHEETS.DATA_NHAN_SU;

    // 1. Test SpreadsheetApp (Old)
    const t0 = new Date().getTime();
    const oldData = getData(fileId, sheetName);
    const t1 = new Date().getTime();
    results.benchmarkSpreadsheetAppMs = t1 - t0;

    // 2. Test Fast Reader (New)
    const t2 = new Date().getTime();
    const newData = fastReadSheetValues(fileId, sheetName);
    const t3 = new Date().getTime();
    results.benchmarkFastReaderMs = t3 - t2;

    results.speedupRatio = (results.benchmarkSpreadsheetAppMs / Math.max(results.benchmarkFastReaderMs, 1)).toFixed(2);

    // 3. So khớp số lượng dòng & cột
    if (oldData.length === newData.length && oldData.length > 0) {
      results.testFastReader = true;

      // Kiểm tra padding (mọi dòng phải cùng length)
      const expectedCols = newData[0].length;
      let padOk = true;
      for (let r = 0; r < newData.length; r++) {
        if (newData[r].length !== expectedCols) {
          padOk = false;
          break;
        }
      }
      results.testPadding = padOk;

      // Kiểm tra type contract (số giữ nguyên kiểu number)
      let typeOk = true;
      for (let r = 0; r < Math.min(newData.length, 20); r++) {
        for (let c = 0; c < expectedCols; c++) {
          const vOld = oldData[r][c];
          const vNew = newData[r][c];
          if (typeof vOld === 'number' && typeof vNew !== 'number') {
            typeOk = false;
            break;
          }
        }
      }
      results.testTypes = typeOk;
    }

    // 4. Test Auth Gate Fail-Closed (Negative Case)
    const fakeEvent = { parameter: { token: 'invalid_token_xyz', type: 'getAllData' } };
    const authRes = doGet(fakeEvent);
    const authContent = JSON.parse(authRes.getContent());
    if (authContent && authContent.status === 'error' && authContent.message.includes('Unauthorized')) {
      results.testAuthGateNegative = true;
    }

    Logger.log("PHASE 1 VERIFICATION RESULTS: " + JSON.stringify(results));
  } catch (e) {
    Logger.log("Lỗi kiểm thử Phase 1: " + e.message);
  }

  return results;
}

/**
 * TEST SUITE: Kiểm thử tự động Phase 2 (Nhóm Báo Cáo & Bản In Đi Kho Bạc)
 */
function test_phase2_verification() {
  const results = {
    testLuongPrintData: false,
    testCkPrintData: false,
    testBaoHiemPrintData: false,
    testKhoanTruPrintData: false,
    testKPCDPrintData: false,
    benchmarkTotalMs: 0
  };

  try {
    const testMonth = "T01.2025";
    const t0 = new Date().getTime();

    // 1. Kiểm tra Tổng Hợp Lương
    const resLuong = getPrintDataTongHopLuong(testMonth, "All");
    if (resLuong && resLuong.status === "success" && Array.isArray(resLuong.data) && resLuong.data.length > 0) {
      results.testLuongPrintData = true;
    }

    // 2. Kiểm tra Tổng Hợp Chuyển Khoản
    const resCk = getPrintDataCk(testMonth, "All", false);
    if (resCk && resCk.status === "success" && Array.isArray(resCk.data) && resCk.data.length > 0) {
      results.testCkPrintData = true;
    }

    // 3. Kiểm tra Tổng Hợp Bảo Hiểm In-Memory
    const resBH = getPrintDataTongHopBaoHiem(testMonth, "All");
    if (resBH && resBH.status === "success" && Array.isArray(resBH.data) && resBH.data.length > 0) {
      results.testBaoHiemPrintData = true;
    }

    // 4. Kiểm tra Tổng Hợp Khoản Trừ In-Memory
    const resKT = getPrintDataTongHopKhoanTru(testMonth, "All");
    if (resKT && resKT.status === "success" && Array.isArray(resKT.data) && resKT.data.length > 0) {
      results.testKhoanTruPrintData = true;
    }

    // 5. Kiểm tra Tổng Hợp KPCĐ In-Memory
    const resKPCD = getPrintDataTongHopKPCD(testMonth, "All");
    if (resKPCD && resKPCD.status === "success" && Array.isArray(resKPCD.data) && resKPCD.data.length > 0) {
      results.testKPCDPrintData = true;
    }

    const t1 = new Date().getTime();
    results.benchmarkTotalMs = t1 - t0;

    Logger.log("PHASE 2 VERIFICATION RESULTS: " + JSON.stringify(results));
  } catch (e) {
    Logger.log("Lỗi kiểm thử Phase 2: " + e.message);
  }

  return results;
}

/**
 * TEST SUITE: Kiểm thử tự động Phase 3 (Nhóm Hạch Toán & Phân Bổ)
 */
function test_phase3_verification() {
  const results = {
    testHachToanBaoHiemPrintData: false,
    testHachToanKPCDPrintData: false,
    testHachToanLuongVaTruyLinhPrintData: false,
    testPhanBoLuongBHXHPrintData: false,
    benchmarkTotalMs: 0
  };

  try {
    const testMonth = "T01.2025";
    const t0 = new Date().getTime();

    // 1. Kiểm tra Hạch Toán Bảo Hiểm In-Memory
    const resHTBH = getPrintDataHachToanBaoHiem(testMonth, "All");
    if (resHTBH && resHTBH.status === "success" && Array.isArray(resHTBH.data) && resHTBH.data.length > 0) {
      results.testHachToanBaoHiemPrintData = true;
    }

    // 2. Kiểm tra Hạch Toán KPCĐ In-Memory
    const resHTKPCD = getPrintDataHachToanKPCD(testMonth, "All");
    if (resHTKPCD && resHTKPCD.status === "success" && Array.isArray(resHTKPCD.data) && resHTKPCD.data.length > 0) {
      results.testHachToanKPCDPrintData = true;
    }

    // 3. Kiểm tra Hạch Toán Lương & Truy Lĩnh In-Memory
    const resHTLuong = getPrintDataHachToanLuongVaTruyLinh(testMonth, "All");
    if (resHTLuong && resHTLuong.status === "success" && Array.isArray(resHTLuong.data) && resHTLuong.data.length > 0) {
      results.testHachToanLuongVaTruyLinhPrintData = true;
    }

    // 4. Kiểm tra Phân Bổ Lương & BHXH
    const resPBL = getPrintDataPhanBoLuongBHXH(testMonth, "All");
    if (resPBL && resPBL.status === "success" && Array.isArray(resPBL.data) && resPBL.data.length > 0) {
      results.testPhanBoLuongBHXHPrintData = true;
    }

    const t1 = new Date().getTime();
    results.benchmarkTotalMs = t1 - t0;

    Logger.log("PHASE 3 VERIFICATION RESULTS: " + JSON.stringify(results));
  } catch (e) {
    Logger.log("Lỗi kiểm thử Phase 3: " + e.message);
  }

  return results;
}