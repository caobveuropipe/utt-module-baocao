/**
 * TIỆN ÍCH ĐỐI CHIẾU DỮ LIỆU GIỮA BẢNG PHÂN BỔ VÀ BẢNG TỔNG HỢP LƯƠNG
 * 
 * Cách dùng:
 * 1. Chạy hàm `chayDoiChieu()` trong Apps Script.
 * 2. Kết quả đối chiếu chi tiết từng cán bộ và chênh lệch phòng ban sẽ được xuất ra sheet "DoiChieu_Report"
 *    ở file export Phân bổ lương BHXH.
 */
function chayDoiChieu() {
  const monthStr = 'T06.2026'; // Thay đổi kỳ lương cần đối chiếu tại đây
  const location = 'Hà Nội';   // Thay đổi khu vực cần đối chiếu tại đây

  doiChieuLuongBHXH(monthStr, location);
}

function doiChieuLuongBHXH(monthStr, location) {
  Logger.log(`=== BẮT ĐẦU ĐỐI CHIẾU THÁNG ${monthStr} - KHU VỰC ${location} ===`);

  const ssLuong1 = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.DATA_LUONG_1);
  const ssMaster = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.MASTER_DATA);
  const ssExport = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.EXPORT_HT_PHAN_BO_LUONG_BHXH);

  const sheetL1 = ssLuong1.getSheetByName(GLOBAL_CONFIG.SHEETS.DATA_LUONG_1);
  const sheetSetup = ssMaster.getSheetByName('Setup');

  if (!sheetL1 || !sheetSetup) {
    throw new Error("Không tìm thấy sheet dữ liệu cần thiết");
  }

  // 1. Đọc Master Setup
  const dataMasterRaw = sheetSetup.getRange("K2:O" + Math.max(2, sheetSetup.getLastRow())).getValues();
  const mapMaster = {};
  dataMasterRaw.forEach(row => {
    const ma = String(row[0]).trim();
    if (ma) {
      mapMaster[ma] = {
        TenDV: row[1],
        NhomDV: String(row[3] || 'Khác').trim(),
        LoaiDV: String(row[4] || 'Bộ phận trực tiếp').trim()
      };
    }
  });

  // 2. Đọc dữ liệu lương gốc
  const dataLuong1Raw = sheetL1.getDataRange().getValues();
  const hL1 = dataLuong1Raw[0] || [];
  const idxL1 = {
    KyLuong: getIdx(hL1, ['Kỳ lương', 'Ky']),
    MaCB: getIdx(hL1, ['Mã CB', 'MaNS', 'Ma']),
    HoTen: getIdx(hL1, ['Họ và tên', 'HoTen', 'Họ tên']),
    LoaiHD: getIdx(hL1, ['Loại HĐ', 'Loại hợp đồng', 'LoaiHD']),
    DonVi: getIdx(hL1, ['Đơn vị', 'DonVi', 'Mã đơn vị', 'Mã ĐV']),
    TongLuong1: getIdx(hL1, ['Tổng lương 1', 'TongLuong1']),
    HSBac: getIdx(hL1, ['HS bậc', 'HS Bậc', 'HSBac']),
    HSChucVu: getIdx(hL1, ['HS chức vụ', 'HS CV', 'HSCV']),
    HSVượtKhung: getIdx(hL1, ['HS vượt khung', 'HSVK']),
    HSNganh: getIdx(hL1, ['HS ngành', 'HS Nghề', 'HSGD']),
    HSThamNien: getIdx(hL1, ['HS thâm niên', 'HSTN']),
    HSDocHai: getIdx(hL1, ['HS độc hại', 'HSDH']),
    HSTrachNhiem: getIdx(hL1, ['HS trách nhiệm', 'HSTNhiem']),
    HSTuVe: getIdx(hL1, ['HS tự vệ', 'HSTV'])
  };

  const locationNormalized = location && location !== 'All' ? normalizeLocation(location) : null;
  
  // Dữ liệu so sánh
  const reportRows = [];

  dataLuong1Raw.slice(1).forEach((row, index) => {
    // Lọc theo kỳ lương
    if (String(row[idxL1.KyLuong]).trim() !== monthStr) return;

    // Lọc theo khu vực
    const rowLocation = normalizeLocation(row[31]); // Cột AF: Khu vực
    if (locationNormalized && rowLocation !== locationNormalized) return;

    const maCB = String(row[idxL1.MaCB] || '').trim();
    const hoTen = String(row[idxL1.HoTen] || '').trim();
    const loaiHD = String(row[idxL1.LoaiHD] || '').trim();
    const donViRaw = String(row[idxL1.DonVi] || '').trim();
    const tucLinh = parseNumber(row[idxL1.TongLuong1]);

    // Chuẩn hóa mã đơn vị
    const rawCode = donViRaw.split('-')[0].trim();
    let maDV = 'DV' + rawCode;
    if (rawCode.length < 3) {
      const codeMatch = rawCode.match(/^(\d+)(.*)$/);
      if (codeMatch) {
        maDV = 'DV' + codeMatch[1].padStart(3, '0') + (codeMatch[2] || '');
      }
    }

    const master = mapMaster[maDV];

    // Kiểm tra lý do loại trừ ở bảng Tổng hợp lương 1
    let lyDoLoaiTH1 = '';
    if (tucLinh < 0) {
      lyDoLoaiTH1 = 'Thực lĩnh < 0 (Tổng lương 1 âm)';
    }

    // Kiểm tra lỗi khớp Master Data (bảng Phân bổ)
    let loiKhopMaster = '';
    if (!master) {
      loiKhopMaster = `Không khớp Master (maDV phân tích: ${maDV})`;
    }

    const hsBac = parseNumber(row[idxL1.HSBac]);
    const hsChucVu = parseNumber(row[idxL1.HSChucVu]);
    const hsVK = parseNumber(row[idxL1.HSVượtKhung]);
    const hsNganh = parseNumber(row[idxL1.HSNganh]);
    const hsTN = parseNumber(row[idxL1.HSThamNien]);
    const hsDH_TN_TV = parseNumber(row[idxL1.HSDocHai]) + parseNumber(row[idxL1.HSTrachNhiem]) + parseNumber(row[idxL1.HSTuVe]);

    reportRows.push([
      maCB, hoTen, loaiHD, donViRaw,
      loiKhopMaster ? "Bị loại ở PHÂN BỔ" : "Hợp lệ ở PHÂN BỔ",
      loiKhopMaster,
      lyDoLoaiTH1 ? "Bị loại ở TỔNG HỢP 1" : "Hợp lệ ở TỔNG HỢP 1",
      lyDoLoaiTH1,
      hsBac, hsChucVu, hsVK, hsNganh, hsTN, hsDH_TN_TV,
      master ? master.NhomDV : 'Chưa định nghĩa',
      master ? master.LoaiDV : 'Chưa định nghĩa'
    ]);
  });

  // 3. Xuất kết quả ra sheet đối chiếu
  const REPORT_SHEET_NAME = "DoiChieu_Report";
  let reportSheet = ssExport.getSheetByName(REPORT_SHEET_NAME);
  if (!reportSheet) {
    reportSheet = ssExport.insertSheet(REPORT_SHEET_NAME);
  } else {
    reportSheet.clear();
  }

  // Tạo tiêu đề report
  const headers = [
    "Mã CB", "Họ và tên", "Loại HĐ", "Đơn vị gốc",
    "Trạng thái ở Phân bổ", "Lỗi khớp Phân bổ",
    "Trạng thái ở Tổng hợp 1", "Lý do loại ở TH1",
    "Hệ số bậc", "Hệ số chức vụ", "Hệ số vượt khung", "Hệ số ngành", "Hệ số thâm niên", "Độc hại + TN + Tự vệ",
    "Nhóm DV (Phòng ban)", "Loại DV (QL/TT)"
  ];

  reportSheet.getRange(1, 1).setValue(`BÁO CÁO ĐỐI CHIẾU DỮ LIỆU LƯƠNG - KỲ: ${monthStr} - KHU VỰC: ${location}`).setFontWeight("bold").setFontSize(14);
  reportSheet.getRange(2, 1).setValue(`Thời gian lập đối chiếu: ${new Date().toLocaleString()}`).setFontStyle("italic");

  reportSheet.getRange(4, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setBackground("#d9ead3").setHorizontalAlignment("center");

  if (reportRows.length > 0) {
    reportSheet.getRange(5, 1, reportRows.length, headers.length).setValues(reportRows);
  }

  // Tạo bảng tổng hợp tóm tắt chênh lệch lý do
  const summaryStartRow = reportRows.length + 8;
  reportSheet.getRange(summaryStartRow, 1).setValue("DANH SÁCH NHÂN SỰ BỊ LỆCH GIỮA 2 BẢNG (DO ĐIỀU KIỆN LỌC KHÁC NHAU HOẶC LỖI MASTER)").setFontWeight("bold").setFontSize(12);

  const diffHeaders = ["Mã CB", "Họ và tên", "Đơn vị", "Lý do lệch"];
  reportSheet.getRange(summaryStartRow + 2, 1, 1, diffHeaders.length).setValues([diffHeaders]).setFontWeight("bold").setBackground("#f4cccc");

  const diffRows = [];
  reportRows.forEach(r => {
    const biLoaiPB = r[4].includes("Bị loại");
    const biLoaiTH1 = r[6].includes("Bị loại");
    if (biLoaiPB || biLoaiTH1) {
      let lyDo = '';
      if (biLoaiPB && biLoaiTH1) {
        lyDo = `Bị loại ở cả 2 bảng (PB: ${r[5]}, TH1: ${r[7]})`;
      } else if (biLoaiPB) {
        lyDo = `Chỉ có ở bảng Tổng hợp 1 (PB loại do: ${r[5]})`;
      } else {
        lyDo = `Chỉ có ở bảng Phân bổ (TH1 loại do: ${r[7]})`;
      }
      diffRows.push([r[0], r[1], r[3], lyDo]);
    }
  });

  if (diffRows.length > 0) {
    reportSheet.getRange(summaryStartRow + 3, 1, diffRows.length, diffHeaders.length).setValues(diffRows);
  } else {
    reportSheet.getRange(summaryStartRow + 3, 1).setValue("Chúc mừng! Không phát hiện nhân sự lệch giữa 2 bảng.");
  }

  Logger.log(`=== ĐỐI CHIẾU HOÀN TẤT. Đã ghi kết quả vào sheet "${REPORT_SHEET_NAME}" ===`);
}
