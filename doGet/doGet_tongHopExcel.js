/**
 * MODULE: XUẤT EXCEL (doGet_tongHopExcel)
 * 
 * MÔ TẢ:
 * File chứa logic build dữ liệu bảng lương 49 cột từ 6 nguồn khác nhau,
 * trả về cho endpoint doGet.
 */

/**
 * Chuẩn hóa tham số month đầu vào
 * @param {String} monthStr "03/2026" hoặc "03.2026"
 * @returns {String} "T03.2026" (định dạng khớp hệ thống)
 */
function normalizeMonthKey(monthStr) {
  if (!monthStr) return '';
  const cleaned = String(monthStr).trim();
  // Nếu đã là T03.2026 thì bỏ qua
  if (/^T\d{2}\.\d{4}$/.test(cleaned)) {
    return cleaned;
  }
  // Nếu là dạng 03/2026 hoặc 03.2026
  const match = cleaned.match(/^(\d{1,2})[\/\.](\d{4})$/);
  if (match) {
    let m = match[1];
    if (m.length === 1) m = '0' + m;
    return `T${m}.${match[2]}`;
  }
  return cleaned;
}

/**
 * Bắt buộc các cột phải tồn tại trong dòng header của một sheet.
 * Quăng lỗi (fail-fast) nếu thiếu bất kỳ cột nào.
 * @param {String} sheetName Tên sheet đang validate
 * @param {Array} header Dòng đầu (header) của sheet
 * @param {Array} requiredSpecs Danh sách tên cột (hoặc mảng alias) bắt buộc
 * @returns {Object} Map index cột đã tìm thấy
 */
function requireColumns(sheetName, header, requiredSpecs) {
  const map = getIdx(header, null); // Hàm getIdx từ doGet_function.js
  const result = {};
  const missing = [];

  requiredSpecs.forEach(spec => {
    let aliases = Array.isArray(spec) ? spec : [spec];
    let found = false;
    let primaryKey = String(aliases[0]).trim().replace(/\s+/g, '');

    for (let alias of aliases) {
      let key = String(alias).trim().replace(/\s+/g, '');
      if (map[key] !== undefined) {
        result[primaryKey] = map[key];
        found = true;
        break;
      }
      if (map[String(alias).trim()] !== undefined) {
        result[primaryKey] = map[String(alias).trim()];
        found = true;
        break;
      }
    }
    if (!found) {
      missing.push(aliases[0]);
    }
  });

  if (missing.length > 0) {
    throw new Error(`Data Validation Error ở ${sheetName}: Thiếu các cột bắt buộc [${missing.join(', ')}]`);
  }
  return result;
}

/**
 * Parse chuỗi tiền tệ định dạng Việt Nam thành số an toàn.
 * Xử lý: "1.234.567", "1.234,5", "-1.234", hoặc các ký tự lạ.
 * @param {any} val Giá trị cần parse
 * @returns {Number}
 */
function parseMoneyVN(val) {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;

  let str = String(val).trim();
  if (str === '') return 0;

  // Xóa các ký tự không phải số, dấu trừ, dấu phẩy, dấu chấm
  str = str.replace(/[^\d\.,-]/g, '');
  if (str === '' || str === '-' || str === '.' || str === ',') return 0;

  const numCommas = (str.match(/,/g) || []).length;
  const numDots = (str.match(/\./g) || []).length;
  const lastComma = str.lastIndexOf(',');
  const lastDot = str.lastIndexOf('.');

  if (lastComma > lastDot && lastDot !== -1) {
    // Có cả 2 dấu, phẩy ở sau cùng => VN: 1.234,56
    str = str.replace(/\./g, '').replace(/,/g, '.');
  } else if (lastDot > lastComma && lastComma !== -1) {
    // Có cả 2 dấu, chấm ở sau cùng => US: 1,234.56
    str = str.replace(/,/g, '');
  } else if (numCommas > 0 && numDots === 0) {
    // Chỉ có dấu phẩy. 
    if (numCommas > 1 || (str.length - lastComma - 1 !== 3)) {
      if (numCommas > 1 || str.length - lastComma - 1 === 3) {
        str = str.replace(/,/g, ''); // US nghìn
      } else {
        str = str.replace(/,/g, '.'); // VN thập phân
      }
    } else {
      str = str.replace(/,/g, ''); // 1 dấu phẩy và 3 số sau -> giả định US nghìn
    }
  } else if (numDots > 0 && numCommas === 0) {
    // Chỉ có dấu chấm.
    if (numDots > 1 || (str.length - lastDot - 1 === 3)) {
      str = str.replace(/\./g, ''); // VN nghìn
    } else {
      str = str; // US decimal "1.5"
    }
  }

  const num = Number(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Lọc và nối dữ liệu từ 6 nguồn
 * @param {String} monthStr Tháng (ví dụ 03/2026)
 * @param {String} location Khu vực cần lọc (Tất cả, Hà Nội, Phú Thọ)
 * @returns {Object} {headers, rows, warnings}
 */
function buildTongHopSalaryExcelData(monthStr, location) {
  const warnings = [];
  const monthKey = normalizeMonthKey(monthStr);
  const locKey = (location && location !== 'All' && location !== 'Tất cả' && location !== 'all') ? normalizeLocation(location) : null;

  // Load Số tài khoản & Ngân hàng từ Master DataNhanSu
  const bankMap = {};
  try {
    const ssMaster = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.MASTER_DATA);
    const shNSMaster = ssMaster.getSheetByName(GLOBAL_CONFIG.SHEETS.DATA_NHAN_SU);
    if (shNSMaster) {
      const dataNSMaster = shNSMaster.getDataRange().getValues();
      const headerNSMaster = dataNSMaster[0] || [];
      const idxMaCB = headerNSMaster.indexOf('Mã CB') !== -1 ? headerNSMaster.indexOf('Mã CB') : (headerNSMaster.indexOf('Mã nhân sự') !== -1 ? headerNSMaster.indexOf('Mã nhân sự') : 0);
      const idxSoTK = 6; // Cột G

      for (let i = 1; i < dataNSMaster.length; i++) {
        const row = dataNSMaster[i];
        const maCB = String(row[idxMaCB] || '').trim();
        const bankRaw = String(row[idxSoTK] || '').trim();
        if (!maCB) continue;

        let soTK = bankRaw;
        let tenNH = '';
        const parts = bankRaw.split('-');
        if (parts.length >= 2) {
          soTK = parts[0].trim();
          tenNH = parts.slice(1).join('-').trim();
        }

        bankMap[maCB] = {
          soTaiKhoan: soTK ? "'" + soTK : '',
          nganHang: tenNH ? "'" + tenNH : ''
        };
      }
    }
  } catch (e) {
    warnings.push("Cảnh báo: Không thể load Số tài khoản từ Master DataNhanSu: " + e.message);
  }

  // 1. DATA CHỐT NS THÁNG (Danh sách gốc)
  const ssNS = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.DB_DATA_CHOT_NS);
  const shNS = ssNS.getSheetByName(GLOBAL_CONFIG.SHEETS.DATA_CHOT_NS);
  if (!shNS) throw new Error("Không tìm thấy sheet " + GLOBAL_CONFIG.SHEETS.DATA_CHOT_NS);
  const dataNS = shNS.getDataRange().getValues();
  const mapNS = requireColumns(GLOBAL_CONFIG.SHEETS.DATA_CHOT_NS, dataNS[0], [
    'Kỳ lương', 'Mã nhân sự', 'Họ tên', 'Loại hợp đồng', 'Mã đơn vị', 'Tên đơn vị', 'Mã ngạch', 'Trạng thái', 'Khu vực'
  ]);

  // Lọc NS gốc
  const baseMap = {}; // key = Mã nhân sự
  const orderedCB = [];

  for (let i = 1; i < dataNS.length; i++) {
    const r = dataNS[i];
    const ky = String(r[mapNS['Kỳlương']]).trim();
    if (ky !== monthKey) continue;

    const kv = normalizeLocation(r[mapNS['Khuvực']]);
    if (locKey && kv !== locKey) continue;

    const maCB = String(r[mapNS['Mãnhânsự']]).trim();
    if (!maCB) continue;

    if (!baseMap[maCB]) {
      const bInfo = bankMap[maCB] || { soTaiKhoan: '', nganHang: '' };
      baseMap[maCB] = {
        nsInfo: [
          ky, maCB, String(r[mapNS['Họtên']]).trim(),
          String(r[mapNS['Loạihợpđồng']]).trim(), String(r[mapNS['Mãđơnvị']]).trim(),
          String(r[mapNS['Tênđơnvị']]).trim(), String(r[mapNS['Mãngạch']]).trim(),
          String(r[mapNS['Trạngthái']]).trim(), kv,
          bInfo.soTaiKhoan, bInfo.nganHang
        ],
        l1: new Array(24).fill(0),
        l2: new Array(10).fill(0),
        ac: 0,
        tttl1: 0,
        tttl2: 0
      };
      orderedCB.push(maCB);
    }
  }

  // 2. DATA LƯƠNG 1
  const ssL1 = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.DATA_LUONG_1);
  const shL1 = ssL1.getSheetByName(GLOBAL_CONFIG.SHEETS.DATA_LUONG_1);
  if (shL1) {
    const dataL1 = shL1.getDataRange().getValues();
    const mapL1 = requireColumns(GLOBAL_CONFIG.SHEETS.DATA_LUONG_1, dataL1[0], [
      'Kỳ lương', ['Mã CB', 'Mã nhân sự'], 'HS bậc', 'HS bậc BL', 'HS chức vụ', 'TL vượt khung', 'HS vượt khung',
      'TL ngành', 'HS ngành', 'TL thâm niên', 'HS thâm niên', 'HS độc hại', 'HS trách nhiệm',
      'HS tự vệ', 'Tổng hệ số', 'Lương CĐ', 'Tổng lương', 'BHXH', 'BHYT', 'BHTN', 'KPCĐ',
      'Nước ngoài', 'Nghỉ BHXH', 'Trừ khác', 'Tổng giảm trừ', 'Tổng lương 1'
    ]);
    const colsL1 = [
      'HSbậc', 'HSbậcBL', 'HSchứcvụ', 'TLvượtkhung', 'HSvượtkhung', 'TLngành', 'HSngành',
      'TLthâmniên', 'HSthâmniên', 'HSđộchại', 'HStráchnhiệm', 'HStựvệ', 'Tổnghệsố', 'LươngCĐ',
      'Tổnglương', 'BHXH', 'BHYT', 'BHTN', 'KPCĐ', 'Nướcngoài', 'NghỉBHXH', 'Trừkhác', 'Tổnggiảmtrừ', 'Tổnglương1'
    ];
    let unmatched = 0;
    for (let i = 1; i < dataL1.length; i++) {
      const r = dataL1[i];
      if (String(r[mapL1['Kỳlương']]).trim() !== monthKey) continue;
      const maCB = String(r[mapL1['MãCB'] !== undefined ? mapL1['MãCB'] : mapL1['Mãnhânsự']]).trim();
      if (!baseMap[maCB]) { unmatched++; continue; }

      colsL1.forEach((col, idx) => {
        baseMap[maCB].l1[idx] += parseMoneyVN(r[mapL1[col]]);
      });
    }
    if (unmatched > 0) warnings.push(`${unmatched} dòng Lương 1 bị loại do Mã CB không thuộc Khu vực/Tháng này.`);
  }

  // 3. DATA LƯƠNG 2
  const ssL2 = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.DATA_LUONG_2);
  const shL2 = ssL2.getSheetByName(GLOBAL_CONFIG.SHEETS.DATA_LUONG_2);
  if (shL2) {
    const dataL2 = shL2.getDataRange().getValues();
    const mapL2 = requireColumns(GLOBAL_CONFIG.SHEETS.DATA_LUONG_2, dataL2[0], [
      'Kỳ lương', ['Mã CB', 'Mã nhân sự'], 'Ổn định thu nhập', 'Quản lý', 'Hỗ trợ hành chính phục vụ',
      'Thu hút lao động', 'Hỗ trợ khác', 'Tạm ứng nghiên cứu sinh', 'Tạm trừ thuế', 'Quyết toán thuế',
      'Lương 2', 'Tạm giữ'
    ]);
    const colsL2 = [
      'Ổnđịnhthunhập', 'Quảnlý', 'Hỗtrợhànhchínhphụcvụ', 'Thuhútlaođộng', 'Hỗtrợkhác',
      'Tạmứngnghiêncứusinh', 'Tạmtrừthuế', 'Quyếttoánthuế', 'Lương2', 'Tạmgiữ'
    ];
    let unmatched = 0;
    for (let i = 1; i < dataL2.length; i++) {
      const r = dataL2[i];
      if (String(r[mapL2['Kỳlương']]).trim() !== monthKey) continue;
      const maCB = String(r[mapL2['MãCB'] !== undefined ? mapL2['MãCB'] : mapL2['Mãnhânsự']]).trim();
      if (!baseMap[maCB]) { unmatched++; continue; }

      colsL2.forEach((col, idx) => {
        baseMap[maCB].l2[idx] += parseMoneyVN(r[mapL2[col]]);
      });
    }
    if (unmatched > 0) warnings.push(`${unmatched} dòng Lương 2 bị loại do Mã CB không thuộc Khu vực/Tháng này.`);
  }

  // 4. DATA ĂN CA
  const ssAC = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.DATA_AN_CA);
  const shAC = ssAC.getSheetByName(GLOBAL_CONFIG.SHEETS.DATA_AN_CA);
  if (shAC) {
    const dataAC = shAC.getDataRange().getValues();
    const mapAC = requireColumns(GLOBAL_CONFIG.SHEETS.DATA_AN_CA, dataAC[0], ['Kỳ lương', ['Mã CB', 'Mã nhân sự'], 'Còn lĩnh']);
    let unmatched = 0;
    for (let i = 1; i < dataAC.length; i++) {
      const r = dataAC[i];
      if (String(r[mapAC['Kỳlương']]).trim() !== monthKey) continue;
      const maCB = String(r[mapAC['MãCB'] !== undefined ? mapAC['MãCB'] : mapAC['Mãnhânsự']]).trim();
      if (!baseMap[maCB]) { unmatched++; continue; }
      baseMap[maCB].ac += parseMoneyVN(r[mapAC['Cònlĩnh']]);
    }
    if (unmatched > 0) warnings.push(`${unmatched} dòng Ăn ca bị loại do Mã CB không hợp lệ.`);
  }

  // 5. DATA TRUY THU LĨNH L1 & L2 (Chỉ có 1 file TRUY_THU_LUONG_1 chứa DataTruyThuLinh cho cả L1 và TRUY_THU_LUONG_2 chứa L2)
  const processTTL = (fileId, sheetName, fieldName) => {
    try {
      const ssTTL = SpreadsheetApp.openById(fileId);
      const shTTL = ssTTL.getSheetByName(sheetName);
      if (!shTTL) return;
      const dataTTL = shTTL.getDataRange().getValues();
      const mapTTL = requireColumns(sheetName, dataTTL[0], [
        ['Kỳ lương', 'Kỳ trả lương'],
        ['Mã CB', 'Mã nhân sự'],
        ['Tổng tiền (VNĐ)', 'Còn nhận', 'Tổng cộng', 'Thực nhận']
      ]);
      let unmatched = 0;
      for (let i = 1; i < dataTTL.length; i++) {
        const r = dataTTL[i];
        if (String(r[mapTTL['Kỳlương']]).trim() !== monthKey) continue;
        const maCB = String(r[mapTTL['MãCB']]).trim();
        if (!baseMap[maCB]) { unmatched++; continue; }
        baseMap[maCB][fieldName] += parseMoneyVN(r[mapTTL['Tổngtiền(VNĐ)']]);
      }
      if (unmatched > 0) warnings.push(`${unmatched} dòng Truy thu lĩnh ${fieldName} bị loại do Mã CB không hợp lệ.`);
    } catch (e) {
      warnings.push(`Lỗi đọc Truy Thu Lĩnh (${fieldName}): ` + e.message);
    }
  };

  processTTL(GLOBAL_CONFIG.FILES.TRUY_THU_LUONG_1, GLOBAL_CONFIG.SHEETS.DATA_TRUY_THU, 'tttl1');
  processTTL(GLOBAL_CONFIG.FILES.TRUY_THU_LUONG_2, GLOBAL_CONFIG.SHEETS.DATA_TRUY_THU, 'tttl2');

  // BUILD FINAL EXCEL DATA
  const headers = [
    'Kỳ lương', 'Mã CB', 'Họ tên', 'Loại hợp đồng', 'Mã đơn vị', 'Tên đơn vị', 'Mã ngạch', 'Trạng thái', 'Khu vực',
    'Số tài khoản', 'Ngân hàng',
    'HS bậc', 'HS bậc BL', 'HS chức vụ', 'TL vượt khung', 'HS vượt khung', 'TL ngành', 'HS ngành',
    'TL thâm niên', 'HS thâm niên', 'HS độc hại', 'HS trách nhiệm', 'HS tự vệ', 'Tổng hệ số', 'Lương CĐ', 'Tổng lương',
    'BHXH', 'BHYT', 'BHTN', 'KPCĐ', 'Nước ngoài', 'Nghỉ BHXH', 'Trừ khác', 'Tổng giảm trừ',
    'Bảo hiểm trả chính',
    'Tổng lương 1',
    'Ổn định thu nhập', 'Quản lý', 'Hỗ trợ hành chính phục vụ', 'Thu hút lao động', 'Hỗ trợ khác',
    'Tạm ứng nghiên cứu sinh', 'Tạm trừ thuế', 'Quyết toán thuế', 'Lương 2', 'Tạm giữ',
    'Ăn ca', 'TTTL L1', 'TTTL L2'
  ];

  // ====== SẮP XẾP MẢNG orderedCB ======
  const contractOrder = ["Biên chế", "HĐ dài hạn", "HĐ 68", "HĐ vụ việc"];
  const getContractWeight = (contractName) => {
    const idx = contractOrder.indexOf(contractName);
    return idx !== -1 ? idx : 999;
  };

  orderedCB.sort((maCBA, maCBB) => {
    const loaiHDA = String(baseMap[maCBA].nsInfo[3] || '').trim();
    const loaiHDB = String(baseMap[maCBB].nsInfo[3] || '').trim();
    const maDonViA = String(baseMap[maCBA].nsInfo[4] || '').trim();
    const maDonViB = String(baseMap[maCBB].nsInfo[4] || '').trim();

    // 1. Mã đơn vị
    if (maDonViA < maDonViB) return -1;
    if (maDonViA > maDonViB) return 1;

    // 2. Loại hợp đồng
    const weightA = getContractWeight(loaiHDA);
    const weightB = getContractWeight(loaiHDB);
    if (weightA !== weightB) return weightA - weightB;
    if (weightA === 999 && loaiHDA !== loaiHDB) return loaiHDA.localeCompare(loaiHDB);

    // 3. Mã CB
    const getNumericMaCB = (val) => {
      const clean = val.replace(/^CB/i, '').trim();
      const num = parseInt(clean, 10);
      return isNaN(num) ? clean : num;
    };
    const numA = getNumericMaCB(maCBA);
    const numB = getNumericMaCB(maCBB);
    if (typeof numA === 'number' && typeof numB === 'number') return numA - numB;
    return String(numA).localeCompare(String(numB));
  });

  const rows = orderedCB.map(maCB => {
    const d = baseMap[maCB];
    const l1WithBHTraChinh = [
      ...d.l1.slice(0, 23),
      d.l1[20],
      d.l1[23]
    ];

    // Bỏ tiền tố "CB" ở Mã CB (nằm ở vị trí index 1 của nsInfo)
    const nsInfoOut = [...d.nsInfo];
    nsInfoOut[1] = String(nsInfoOut[1]).replace(/^CB/i, '');

    return [
      ...nsInfoOut,
      ...l1WithBHTraChinh,
      ...d.l2,
      d.ac,
      d.tttl1,
      d.tttl2
    ];
  });

  return { headers, rows, warnings };
}

/**
 * Xử lý xuất Excel (Base64)
 * @param {String} monthStr 
 * @param {String} location 
 * @returns {Object} JSON result {status, filename, mimeType, base64, warnings}
 */
function exportTongHopExcelBase64(monthStr, location) {
  let tempSsId = null;
  try {
    const data = buildTongHopSalaryExcelData(monthStr, location);
    if (!data.rows || data.rows.length === 0) {
      return { status: 'error', message: 'Không có dữ liệu cho tháng ' + monthStr + (location ? ' - ' + location : '') };
    }

    // 1. Tạo Spreadsheet tạm
    const tempName = `[Temp] TongHopLuong_${monthStr.replace(/\//g, '')}_${new Date().getTime()}`;
    const tempSs = SpreadsheetApp.create(tempName);
    tempSsId = tempSs.getId();
    const sheet = tempSs.getActiveSheet();
    sheet.setName('Data');

    // 2. Ghi dữ liệu vào sheet
    const fullData = [data.headers, ...data.rows];
    sheet.getRange(1, 1, fullData.length, fullData[0].length).setValues(fullData);

    // Style đơn giản cho header
    sheet.getRange(1, 1, 1, fullData[0].length).setFontWeight('bold').setBackground('#E0E0E0');

    // Căn giữa cột Mã CB (Cột 2) cho toàn bộ dữ liệu
    sheet.getRange(1, 2, fullData.length, 1).setHorizontalAlignment('center');

    // Đảm bảo dữ liệu được flush xuống server trước khi fetch file
    SpreadsheetApp.flush();

    // 3. Lấy file XLSX qua export endpoint bằng OAuth token của người đang chạy script
    const url = `https://docs.google.com/spreadsheets/d/${tempSsId}/export?format=xlsx`;
    const token = ScriptApp.getOAuthToken();
    const response = UrlFetchApp.fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    const blob = response.getBlob();
    const base64Str = Utilities.base64Encode(blob.getBytes());
    const locPrefix = (location && location !== 'All' && location !== 'Tất cả') ? `_${location.replace(/\s+/g, '')}` : '';
    const filename = `TongHopLuong_${monthStr.replace(/\//g, '')}${locPrefix}.xlsx`;

    return {
      status: 'success',
      filename: filename,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      base64: base64Str,
      warnings: data.warnings
    };

  } catch (error) {
    return { status: 'error', message: 'Lỗi xuất Excel: ' + error.toString() };
  } finally {
    // 4. XÓA VĨNH VIỄN FILE TẠM bằng Drive API (Advanced Service)
    if (tempSsId) {
      try {
        Drive.Files.remove(tempSsId);
      } catch (delErr) {
        console.error("Lỗi xóa file nháp: " + tempSsId + " - " + delErr.message);
      }
    }
  }
}
