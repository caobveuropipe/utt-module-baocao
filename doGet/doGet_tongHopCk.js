/**
 * HÀM TẠO BẢNG TỔNG HỢP CHUYỂN KHOẢN
 * Phục hồi chức năng: Bảng đổ tài khoản
 */
function test_taobangck() {
  var url = doGet_taoBangTongHopCk("T01.2025");
  Logger.log(url)
}
/**
 * Tạo bảng tổng hợp chuyển khoản (ghi vào sheet CK)
 * @param {string} monthStr - Kỳ lương (Tmm.yyyy)
 * @param {string} location - Địa phương (Hà Nội, Phú Thọ, All)
 * @returns {string} - URL download file Google Sheet
 */
function doGet_taoBangTongHopCk(monthStr, location = 'All') {
  try {
    Logger.log('Bắt đầu tạo bảng tổng hợp CK cho kỳ: %s', monthStr);

    // ID file và sheet cố định
    const FILE_ID = GLOBAL_CONFIG.FILES.EXPORT_DKB_TH_CK;
    const SHEET_NAME = 'CK';
    const START_ROW = 13;

    // Prepare Resources
    const resources = {
      ssLuong1: SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.DATA_LUONG_1),
      ssLuong2: SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.DATA_LUONG_2),
      ssTruyThu1: SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.TRUY_THU_LUONG_1),
      ssTruyThu2: SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.TRUY_THU_LUONG_2),
      ssAnCa: SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.DATA_AN_CA),
      ssMaster: SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.MASTER_DATA),
    };

    // Lấy dữ liệu từ hàm chính
    var data = doGet_tongHopDiNganHang(monthStr, resources, location);

    if (!data || data.length === 0) {
      Logger.log('CẢNH BÁO: Không có dữ liệu trả về!');
      throw new Error('Không có dữ liệu cho kỳ ' + monthStr);
    }

    // Lọc bỏ những người có Tổng ATM = 0, đánh lại STT và bỏ chữ 'CB' ở Mã CB
    var filteredData = [];
    var stt = 1;
    data.forEach(function (row) {
      var tongAtm = Number(row[5]) || 0;
      if (tongAtm !== 0) {
        row[0] = stt++;
        row[1] = String(row[1]).replace(/^CB/i, '');
        filteredData.push(row);
      }
    });
    data = filteredData;

    if (data.length === 0) {
      throw new Error('Không có dữ liệu (tất cả đều có Tổng ATM = 0) cho kỳ ' + monthStr);
    }

    Logger.log('Đã nhận được %s dòng dữ liệu', data.length);

    // Thêm header vào đầu
    var header = [
      'STT',
      'Mã CB',
      'Họ và tên',
      'Số tài khoản',
      'Tên ngân hàng', // Chèn giữa D và Tổng
      'Tổng',
      'Tổng lương 1',
      'TT L1 (+)',
      'TT L1 (-)',
      'Lương 2',
      'TT L2 (+)',
      'TT L2 (-)',
      'Tổng Ăn ca',
      'Ăn ca TL (+)',
      'Ăn ca TL (-)',
      'Thuế TNCN tháng trước'
    ];

    // Tính tổng cho các cột từ F đến P (cột 6-16)
    var totals = ['', '', '', '', 'Tổng cộng']; // A, B, C, D, E

    // Tính tổng từ cột F đến P (index 5-15 trong mảng)
    for (var colIdx = 5; colIdx < 16; colIdx++) {
      var sum = 0;
      data.forEach(function (row) {
        sum += Number(row[colIdx]) || 0;
      });
      totals.push(sum);
    }

    // Tạo mảng dữ liệu KHÔNG CÓ HEADER: chỉ data + totals
    var dataWithTotal = data.concat([totals]);
    var rows = dataWithTotal.length;
    var cols = dataWithTotal[0].length;

    Logger.log('Ghi %s dòng x %s cột vào sheet CK bắt đầu từ dòng %s', rows, cols, START_ROW);

    // Mở file có sẵn
    var spreadsheet = SpreadsheetApp.openById(FILE_ID);
    var sheet = spreadsheet.getSheetByName(SHEET_NAME);

    if (!sheet) {
      throw new Error('Không tìm thấy sheet "' + SHEET_NAME + '" trong file');
    }

    // Xóa dữ liệu cũ từ dòng START_ROW trở đi
    var lastRow = sheet.getLastRow();
    if (lastRow >= START_ROW) {
      var lastCol = Math.max(sheet.getLastColumn(), cols); // Lấy số cột lớn nhất
      var clearRange = sheet.getRange(START_ROW, 1, lastRow - START_ROW + 1, lastCol);
      clearRange.clearContent();   // Xóa nội dung
      clearRange.clearFormat();    // Xóa định dạng
    }

    // ====== THIẾT LẬP HEADER CỘT E "TÊN NGÂN HÀNG" ======
    // Gộp ô E9:E11 và ghi "TÊN NGÂN HÀNG" (giống cấu trúc SỐ TÀI KHOẢN)
    try { sheet.getRange(9, 5, 3, 1).breakApart(); } catch (e) { } // Bỏ merge cũ nếu có
    sheet.getRange(9, 5, 3, 1).merge();
    sheet.getRange(9, 5).setValue('TÊN NGÂN HÀNG');
    sheet.getRange(9, 5).setFontWeight('bold')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle')
      .setFontFamily('Times New Roman')
      .setFontSize(9);
    // Ghi chữ "E" vào dòng 12 cột E (dòng ký tự cột)
    sheet.getRange(12, 5).setValue('E');
    sheet.getRange(12, 5).setFontWeight('bold')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle')
      .setFontFamily('Times New Roman')
      .setFontSize(9);

    // ====== THIẾT LẬP HEADER CỘT P "THU THUẾ TNCN" ======
    try {
      var prevMonthStr = getPrevMonthStr(monthStr);
      var headerThueStr = "THU THUẾ\nTNCN\n" + prevMonthStr.replace('.', '/');
      sheet.getRange(9, 16, 3, 1).breakApart();
      sheet.getRange(9, 16, 3, 1).merge();
      sheet.getRange(9, 16).setValue(headerThueStr);
      sheet.getRange(9, 16).setFontWeight('bold')
        .setHorizontalAlignment('center')
        .setVerticalAlignment('middle')
        .setFontFamily('Times New Roman')
        .setFontSize(9);
      // Ghi chữ "11" vào dòng 12 cột P (dòng ký tự cột)
      sheet.getRange(12, 16).setValue('11');
      sheet.getRange(12, 16).setFontWeight('bold')
        .setHorizontalAlignment('center')
        .setVerticalAlignment('middle')
        .setFontFamily('Times New Roman')
        .setFontSize(9);
    } catch (e) {
      Logger.log("Lỗi định dạng header Thuế TNCN: " + e.message);
    }

    // Ghi dữ liệu mới
    sheet.getRange(START_ROW, 1, rows, cols).setValues(dataWithTotal);

    // ====== THIẾT LẬP CHIỀU RỘNG CỘT (ĐỂ VỪA A4 LANDSCAPE) ======
    sheet.setColumnWidth(1, 35);  // STT
    sheet.setColumnWidth(2, 55);  // Mã CB
    sheet.setColumnWidth(3, 150); // Họ tên
    sheet.setColumnWidth(4, 100); // Số tài khoản
    sheet.setColumnWidth(5, 120); // Tên ngân hàng
    sheet.setColumnWidth(6, 90);  // Tổng ATM
    for (var i = 7; i <= 16; i++) {
      sheet.setColumnWidth(i, 75); // Các cột chi tiết (bao gồm cột 16)
    }

    // ====== GHI THÔNG TIN ĐỊA PHƯƠNG VÀ THÁNG ======
    // Nếu chọn cơ sở thì ghi thêm thông tin
    if (location && location !== 'All') {
      sheet.getRange('A2').setValue('Cơ sở: ' + location.toUpperCase());
    } else {
      sheet.getRange('A2').setValue('');
    }

    // Parse monthStr từ "Tmm.yyyy" thành "THÁNG m NĂM yyyy"
    var monthMatch = monthStr.match(/^T(\d+)\.(\d+)$/);
    if (monthMatch) {
      var month = parseInt(monthMatch[1], 10); // Bỏ số 0 đầu
      var year = monthMatch[2];
      var monthLabel = 'THÁNG ' + month + ' NĂM ' + year;

      // Ghi vào A4
      sheet.getRange('A4').setValue(monthLabel);

      // Merge A4:P4 nếu chưa merge (đến cột P)
      try {
        sheet.getRange('A4:P4').merge();
      } catch (e) {
        // Đã merge rồi, bỏ qua
      }

      // Format: in đậm, căn giữa
      sheet.getRange('A4').setFontWeight('bold').setHorizontalAlignment('center');
    }

    // Format cột Số tài khoản và Tên ngân hàng (căn trái) - Cột 4, 5 (D, E)
    sheet.getRange(START_ROW, 4, rows - 1, 2)
      .setHorizontalAlignment('left')
      .setNumberFormat('@'); // Dạng text

    // Format cột Mã CB (căn giữa) - Cột 2 (B)
    sheet.getRange(START_ROW, 2, rows - 1, 1).setHorizontalAlignment('center');

    // Format cột số tiền (căn phải) - từ cột 6 đến 16 (F đến P)
    var numberColumns = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    numberColumns.forEach(function (col) {
      sheet.getRange(START_ROW, col, rows - 1, 1) // Tất cả data (bỏ dòng tổng)
        .setHorizontalAlignment('right')
        .setNumberFormat('#,##0');
    });

    // Format cột STT (căn giữa) - Bao gồm cả Header d9-12
    sheet.getRange(9, 1, (START_ROW - 9) + rows, 1).setHorizontalAlignment('center');

    // Format dòng Tổng cộng (dòng cuối cùng)
    var totalRow = START_ROW + rows - 1;
    sheet.getRange(totalRow, 1, 1, cols)
      .setFontWeight('bold')
      .setBackground('#f0f0f0');

    // Format số cho dòng Tổng cộng (cột E đến N)
    numberColumns.forEach(function (col) {
      sheet.getRange(totalRow, col, 1, 1)
        .setHorizontalAlignment('right')
        .setNumberFormat('#,##0');
    });

    // ====== FORMAT BORDERS CHO BẢNG ======
    const headerRow = START_ROW - 1; // Dòng 12
    const tableRange = sheet.getRange(headerRow, 1, rows + 1, cols); // Bao gồm Header + Data + Total

    // 1. Reset (Không xóa gridlines hay background)
    tableRange.setFontFamily('Times New Roman');

    // 4. Header (Dòng 9-12)
    sheet.getRange(9, 1, (START_ROW - 9), cols).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');

    // 6. Dòng Tổng cộng
    sheet.getRange(totalRow, 1, 1, cols).setFontWeight('bold');

    // Auto resize rows
    sheet.setRowHeightsForced(START_ROW, rows, 21);
    sheet.autoResizeRows(START_ROW, rows);

    // Lấy URL của file
    var fileUrl = spreadsheet.getUrl();

    // Tạo URL download trực tiếp (export as Excel)
    var downloadUrl = 'https://docs.google.com/spreadsheets/d/' + FILE_ID + '/export?format=xlsx';

    // ====== THÊM DÒNG TRỐNG + SỐ TIỀN BẰNG CHỮ + TEMPLATE ======

    // 1. Tính vị trí dòng tiếp theo sau dòng Tổng cộng
    var nextRow = START_ROW + rows;

    // 2. Thêm dòng trống
    nextRow++;

    // 3. Thêm dòng Số tiền bằng chữ
    var tongTien = totals[5]; // Cột F (index 5 trong mảng totals)
    var soTienBangChu = numberToVietnameseWords(tongTien);

    // Unfreeze columns để có thể merge
    sheet.setFrozenColumns(0);

    sheet.getRange(nextRow, 1).setValue('Số tiền bằng chữ: ' + soTienBangChu);
    sheet.getRange(nextRow, 1, 1, cols).merge(); // Gộp ô từ A đến O
    sheet.getRange(nextRow, 1).setFontWeight('bold').setFontFamily('Times New Roman').setFontSize(11); // In đậm và đổi font

    nextRow++;

    // 4. Copy template từ sheet Master A1:O23
    var masterSheet = spreadsheet.getSheetByName('Master');
    if (masterSheet) {
      var templateRange = masterSheet.getRange('A1:O23');
      var targetRange = sheet.getRange(nextRow, 1, 23, 15);

      // Copy toàn bộ (values + formats)
      templateRange.copyTo(targetRange, SpreadsheetApp.CopyPasteType.PASTE_NORMAL, false);

      Logger.log('Đã copy template từ Master A1:O23 vào dòng %s', nextRow);
    } else {
      Logger.log('CẢNH BÁO: Không tìm thấy sheet Master');
    }

    // ====== BƯỚC CUỐI: TẠO ĐƯỜNG KẺ BẢNG ======
    const HEADER_START_ROW = 9; // Header phức hợp bắt đầu từ dòng 9 (bao gồm "Trong đó")
    const totalTableRows = (START_ROW - HEADER_START_ROW) + rows; // Số dòng từ đầu header đến hết bảng (bao gồm data + totals)
    const finalTableRange = sheet.getRange(HEADER_START_ROW, 1, totalTableRows, cols);

    // 1. Viền ngoài và kẻ dọc: Nét liền (SOLID)
    finalTableRange.setBorder(true, true, true, true, true, null, 'black', SpreadsheetApp.BorderStyle.SOLID);
    // 2. Kẻ ngang nội dung & Header: Nét đứt (DOTTED)
    finalTableRange.setBorder(null, null, null, null, null, true, 'black', SpreadsheetApp.BorderStyle.DOTTED);
    // 3. Toàn bộ Header (10-12) & Tổng cộng: Nét liền toàn bộ
    sheet.getRange(HEADER_START_ROW, 1, (START_ROW - HEADER_START_ROW), cols).setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.SOLID);
    sheet.getRange(totalRow, 1, 1, cols).setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.SOLID);

    Logger.log('Hoàn thành! File URL: %s', fileUrl);
    Logger.log('Download URL: %s', downloadUrl);

    const pdfUrl = `https://docs.google.com/spreadsheets/d/${GLOBAL_CONFIG.FILES.EXPORT_DKB_TH_CK}/export?format=pdf&size=A4&portrait=false&fitw=true&gridlines=false&horizontal_alignment=CENTER&printtitle=false&sheetnames=false&pagenumbers=true&fzr=true&attachment=false`;
    return pdfUrl;

  } catch (error) {
    Logger.log('LỖI trong doGet_taoBangTongHopCk: %s', error.message);
    throw error;
  }
}

/**
 * Tổng hợp dữ liệu lương đi ngân hàng
 * @param {string} monthStr - Kỳ lương (Tmm.yyyy)
 * @returns {Array} - Mảng 2D với 15 cột theo yêu cầu
 * 
 * Cấu trúc output:
 * 1. STT
 * 2. Mã CB
 * 3. Họ và tên
 * 4. Số tài khoản
 * 5. Tổng = 6+7-8+9+10-11+12+13-14
 * 6. Tổng lương 1
 * 7. TT L1 (+)
 * 8. TT L1 (-)
 * 9. Lương 2
 * 10. TT L2 (+)
 * 11. TT L2 (-)
 * 12. Tổng Ăn ca
 * 13. Ăn ca TL (+)
 * 14. Ăn ca TL (-)
 * 15. Mã đơn vị
 */
/**
 * Tổng hợp dữ liệu lương đi ngân hàng
 * @param {string} monthStr - Kỳ lương (Tmm.yyyy)
 * @param {Object} resources - Các đối tượng SpreadsheetApp
 * @param {string} location - Địa phương lọc (All, Hà Nội, Phú Thọ...)
 * @returns {Array} - Mảng 2D với 14 cột theo yêu cầu
 */
function doGet_tongHopDiNganHang(monthStr, resources, location = 'All') {

  Logger.log('Bắt đầu tổng hợp dữ liệu đi ngân hàng cho kỳ: %s', monthStr);

  // ====== LOAD DATA ======

  // 1. Dataluong1 (Sheet: DataLuong1)
  const values1 = getData(resources.ssLuong1, 'DataLuong1');
  const header1 = values1[0] || [];
  const data1 = values1.slice(1);

  const idx1 = {
    KyLuong: getIdx(header1, 'Kỳ lương'),
    MaCB: getIdx(header1, 'Mã CB'),
    HoTen: getIdx(header1, 'Họ và tên'),
    TongLuong1: getIdx(header1, 'Tổng lương 1'),
    ThueTNCN: getIdx(header1, ['Thuế TNCN', 'TNCN', 'Thue TNCN', 'Thuế'])
  };

  // 2. Dataluong2 (Sheet: DataLuong2)
  const values2 = getData(resources.ssLuong2, 'DataLuong2');
  const header2 = values2[0] || [];
  const data2 = values2.slice(1);

  const idx2 = {
    KyLuong: getIdx(header2, 'Kỳ lương'),
    MaNS: getIdx(header2, 'Mã nhân sự'),
    HoTen: getIdx(header2, 'Họ và tên'),
    Luong2: getIdx(header2, 'Lương 2')
  };

  // 3. Truythuluong1 (Sheet: DataTruyThuLinh)
  const values3 = getData(resources.ssTruyThu1, 'DataTruyThuLinh');
  const header3 = values3[0] || [];
  const data3 = values3.slice(1);

  const idx3 = {
    KyTraLuong: getIdx(header3, 'Kỳ trả lương'),
    MaNS: getIdx(header3, 'Mã nhân sự'),
    HoTen: getIdx(header3, 'Họ và tên'),
    ConNhan: getIdx(header3, 'Còn nhận')
  };

  // 4. Truythuluong2 (Sheet: DataTruyThuLinh)
  const values4 = getData(resources.ssTruyThu2, 'DataTruyThuLinh');
  const header4 = values4[0] || [];
  const data4 = values4.slice(1);

  const idx4 = {
    KyTraLuong: getIdx(header4, 'Kỳ trả lương'),
    MaNS: getIdx(header4, 'Mã nhân sự'),
    HoTen: getIdx(header4, 'Họ và tên'),
    ConNhan: getIdx(header4, 'Còn nhận')
  };

  // 5. DataAnCa (Sheet: DataAnCa)
  const values5 = getData(resources.ssAnCa, 'DataAnCa');
  const header5 = values5[0] || [];
  const data5 = values5.slice(1);

  const idx5 = {
    KyLuong: getIdx(header5, 'Kỳ lương'),
    MaCB: getIdx(header5, 'Mã CB'),
    HoTen: getIdx(header5, 'Họ và tên'),
    AnCa: getIdx(header5, 'Ăn ca'),
    TruyLinh: getIdx(header5, 'Truy lĩnh')
  };

  // 6. MasterData - DataNhanSu (Sheet: DataNhanSu)
  const values6 = getData(resources.ssMaster, 'DataNhanSu');
  const header6 = values6[0] || [];
  const data6 = values6.slice(1);

  const idx6 = {
    MaCB: 0,           // Bắt buộc là cột A (index 0) vì header luôn thay đổi
    SoTaiKhoan: getIdx(header6, 'Số tài khoản'),
    KhuVuc: getIdx(header6, 'Khu vực')
  };

  // 7. MasterData - DataChotNSThang (Sheet: DataChotNSThang)
  const values7 = getSheetNSThang().getDataRange().getValues();
  const header7 = values7[0] || [];
  const data7 = values7.slice(1);

  const locationNormalized = (location && location !== 'All') ? normalizeLocation(location) : null;
  const trangThaiColIdx = getIdx(header7, ['Trạng thái', 'Status', 'TrangThai']);
  if (locationNormalized === 'Phú Thọ' && trangThaiColIdx === -1) {
    throw new Error("Không tìm thấy cột 'Trạng thái' trong danh sách chốt nhân sự tháng. Vui lòng kiểm tra lại cấu trúc sheet DataChotNSThang.");
  }

  const idx7 = {
    KyLuong: getIdx(header7, 'Kỳ lương'),
    HoTen: getIdx(header7, 'Họ tên') !== -1 ? getIdx(header7, 'Họ tên') : getIdx(header7, 'Họ và tên'), // Robust check
    MaDonVi: getIdx(header7, 'Mã đơn vị'),
    MaNS: getIdx(header7, 'Mã nhân sự') !== -1 ? getIdx(header7, 'Mã nhân sự') : getIdx(header7, 'Mã CB'), // Robust check
    LoaiHD: getIdx(header7, 'Loại hợp đồng') !== -1 ? getIdx(header7, 'Loại hợp đồng') : 4, // Cột E (index 4) nếu không tìm thấy header
    TrangThai: trangThaiColIdx
  };

  Logger.log('Đã load xong tất cả dữ liệu từ các sheet. Checking idx7: ' + JSON.stringify(idx7));


  // ====== TẠO MAP DỮ LIỆU ======

  // Map lưu tổng hợp theo mã nhân sự
  const employeeMap = {};

  // Helper function để đảm bảo record tồn tại
  function ensureEmployee(maCB, hoTen) {
    if (!employeeMap[maCB]) {
      employeeMap[maCB] = {
        maCB: maCB,
        hoTen: hoTen || '',
        soTaiKhoan: '',
        tenNganHang: '',
        maDonVi: '',
        loaiHD: '',
        tongLuong1: 0,
        ttL1_Duong: 0,
        ttL1_Am: 0,
        luong2: 0,
        ttL2_Duong: 0,
        ttL2_Am: 0,
        tongAnCa: 0,
        anCaTL_Duong: 0,
        anCaTL_Am: 0,
        thueTNCN_Prev: 0
      };
    }
    // Cập nhật họ tên nếu chưa có
    if (!employeeMap[maCB].hoTen && hoTen) {
      employeeMap[maCB].hoTen = hoTen;
    }
    return employeeMap[maCB];
  }

  // ====== LẤY SỐ TÀI KHOẢN, TÊN NGÂN HÀNG & KHU VỰC TỪ DATANHANSU ======
  const nsuMap = {}; // {maCB: {soTK, tenNH}}
  const khuVucMap = {};
  data6.forEach(row => {
    const maCB = String(row[idx6.MaCB] || '').trim().toUpperCase();
    if (!maCB) return;

    // Tách số tài khoản và tên ngân hàng (phần trước và sau dấu -)
    const soTKFull = String(row[idx6.SoTaiKhoan] || '').trim();
    if (soTKFull) {
      const parts = soTKFull.split('-');
      nsuMap[maCB] = {
        soTK: parts[0].trim(),
        tenNH: parts[1] ? parts[1].trim() : ''
      };
    }

    // Lấy khu vực
    const khuVuc = normalizeLocation(String(row[idx6.KhuVuc] || ''));
    if (khuVuc) khuVucMap[maCB] = khuVuc;
  });

  // ====== XỬ LÝ DATALUONG1 ======
  data1.forEach(row => {
    const kyLuong = String(row[idx1.KyLuong] || '').trim();
    if (kyLuong !== monthStr) return;

    const maCB = String(row[idx1.MaCB] || '').trim().toUpperCase();
    if (!maCB) return;

    const hoTen = String(row[idx1.HoTen] || '').trim();
    const tongLuong1 = Number(row[idx1.TongLuong1]) || 0;

    const emp = ensureEmployee(maCB, hoTen);
    emp.tongLuong1 += tongLuong1;
  });

  Logger.log('Đã xử lý Dataluong1: %s nhân viên', Object.keys(employeeMap).length);

  // ====== XỬ LÝ DATALUONG2 ======
  data2.forEach(row => {
    const kyLuong = String(row[idx2.KyLuong] || '').trim();
    if (kyLuong !== monthStr) return;

    const maCB = String(row[idx2.MaNS] || '').trim().toUpperCase();
    if (!maCB) return;

    const hoTen = String(row[idx2.HoTen] || '').trim();
    const luong2 = Number(row[idx2.Luong2]) || 0;

    const emp = ensureEmployee(maCB, hoTen);
    emp.luong2 += luong2;
  });

  Logger.log('Đã xử lý Dataluong2: %s nhân viên', Object.keys(employeeMap).length);

  // ====== XỬ LÝ TRUYTHULUONG1 ======
  data3.forEach(row => {
    const kyTraLuong = String(row[idx3.KyTraLuong] || '').trim();
    if (kyTraLuong !== monthStr) return;

    const maCB = String(row[idx3.MaNS] || '').trim().toUpperCase();
    if (!maCB) return;

    const hoTen = String(row[idx3.HoTen] || '').trim();
    const conNhan = Number(row[idx3.ConNhan]) || 0;

    const emp = ensureEmployee(maCB, hoTen);
    if (conNhan > 0) {
      emp.ttL1_Duong += conNhan;
    } else if (conNhan < 0) {
      emp.ttL1_Am += Math.abs(conNhan);
    }
  });

  Logger.log('Đã xử lý Truythuluong1: %s nhân viên', Object.keys(employeeMap).length);

  // ====== XỬ LÝ TRUYTHULUONG2 ======
  data4.forEach(row => {
    const kyTraLuong = String(row[idx4.KyTraLuong] || '').trim();
    if (kyTraLuong !== monthStr) return;

    const maCB = String(row[idx4.MaNS] || '').trim().toUpperCase();
    if (!maCB) return;

    const hoTen = String(row[idx4.HoTen] || '').trim();
    const conNhan = Number(row[idx4.ConNhan]) || 0;

    const emp = ensureEmployee(maCB, hoTen);
    if (conNhan > 0) {
      emp.ttL2_Duong += conNhan;
    } else if (conNhan < 0) {
      emp.ttL2_Am += Math.abs(conNhan);
    }
  });

  Logger.log('Đã xử lý Truythuluong2: %s nhân viên', Object.keys(employeeMap).length);

  // ====== XỬ LÝ DATAANCA ======
  data5.forEach(row => {
    const kyLuong = String(row[idx5.KyLuong] || '').trim();
    if (kyLuong !== monthStr) return;

    const maCB = String(row[idx5.MaCB] || '').trim().toUpperCase();
    if (!maCB) return;

    const hoTen = String(row[idx5.HoTen] || '').trim();
    const anCa = Number(row[idx5.AnCa]) || 0;
    const truyLinh = Number(row[idx5.TruyLinh]) || 0;

    const emp = ensureEmployee(maCB, hoTen);
    emp.tongAnCa += anCa;

    if (truyLinh > 0) {
      emp.anCaTL_Duong += truyLinh;
    } else if (truyLinh < 0) {
      emp.anCaTL_Am += Math.abs(truyLinh);
    }
  });

  Logger.log('Đã xử lý DataAnCa: %s nhân viên', Object.keys(employeeMap).length);

  Logger.log('Đã load %s số tài khoản và %s thông tin khu vực từ DataNhanSu', Object.keys(nsuMap).length, Object.keys(khuVucMap).length);

  // ====== LẤY MÃ ĐƠN VỊ VÀ KHU VỰC TỪ DATACHOTNSTHANG ======
  const maDonViMap = {};
  let idxKV = getIdx(header7, ['Khu vực', 'Khu Vực']);
  if (idxKV === -1) idxKV = 38; // Fallback to column AM (index 38)
  
  data7.forEach(row => {
    const kyLuong = String(row[idx7.KyLuong] || '').trim();

    // Debug log for first few rows
    if (Object.keys(maDonViMap).length < 2 && idx7.KyLuong !== -1) {
      Logger.log('Checking row DataChotNSThang: %s vs %s', kyLuong, monthStr);
    }

    if (kyLuong !== monthStr) return;

    const maNS = String(row[idx7.MaNS] || '').trim().toUpperCase();
    const maDonVi = String(row[idx7.MaDonVi] || '').trim();
    const hoTen = String(row[idx7.HoTen] || '').trim();
    const loaiHD = String(row[idx7.LoaiHD] || '').trim();
    const trangThai = idx7.TrangThai !== -1 ? String(row[idx7.TrangThai] || '').trim() : '';
    const kv = normalizeLocation(row[idxKV]);

    if (maNS) {
      maDonViMap[maNS] = {
        maDonVi: maDonVi,
        hoTen: hoTen,
        loaiHD: loaiHD,
        trangThai: trangThai
      };

      if (kv) {
        khuVucMap[maNS] = kv;
      }

      // Đảm bảo nhân viên này có trong map chính (vì DataChotNSThang là danh sách chốt)
      const emp = ensureEmployee(maNS, hoTen);
      emp.maDonVi = maDonVi;
      emp.loaiHD = loaiHD;
      emp.trangThai = trangThai;
    }
  });

  Logger.log('Đã load %s mã đơn vị từ DataChotNSThang', Object.keys(maDonViMap).length);

  // ====== TÍNH TOÁN THUẾ TNCN THÁNG TRƯỚC ======
  const prevMonthStr = getPrevMonthStr(monthStr);
  const thueTNCNMap = {};
  try {
    const valuesThue = getData('1Xcp4cBjKcHWt_FQULd7MrC7fhiX8ZVMzL8wXJ3aoJLw', 'TinhThue');
    if (valuesThue && valuesThue.length > 1) {
      // Cột B: Kỳ lương (index 1)
      // Cột E: Mã CB (index 4)
      // Cột AG: Thuế TNCN (index 32)
      valuesThue.slice(1).forEach(row => {
        const kyLuong = String(row[1] || '').trim();
        if (kyLuong !== prevMonthStr) return;

        const maCB = String(row[4] || '').trim().toUpperCase();
        if (!maCB) return;

        const thueTNCN = Number(row[32]) || 0;
        thueTNCNMap[maCB] = (thueTNCNMap[maCB] || 0) + thueTNCN;
      });
      Logger.log('Đã load xong thuế TNCN từ file TinhThue cho kỳ: ' + prevMonthStr + ' - Số dòng khớp: ' + Object.keys(thueTNCNMap).length);
    } else {
      Logger.log('CẢNH BÁO: Không có dữ liệu trong sheet TinhThue hoặc file không tồn tại.');
    }
  } catch (e) {
    Logger.log('LỖI lấy dữ liệu Thuế TNCN từ file TinhThue: ' + e.message);
  }

  // ====== ENRICH DỮ LIỆU: THÊM SỐ TÀI KHOẢN VÀ MÃ ĐƠN VỊ ======
  Object.keys(employeeMap).forEach(maCB => {
    const emp = employeeMap[maCB];
    emp.thueTNCN_Prev = thueTNCNMap[maCB] || 0;

    // Số tài khoản & Tên ngân hàng
    if (nsuMap[maCB]) {
      emp.soTaiKhoan = nsuMap[maCB].soTK;
      emp.tenNganHang = nsuMap[maCB].tenNH;
    }

    // Mã đơn vị (đã được set ở trên khi xử lý DataChotNSThang)
    if (!emp.maDonVi && maDonViMap[maCB]) {
      emp.maDonVi = maDonViMap[maCB].maDonVi;
      emp.loaiHD = maDonViMap[maCB].loaiHD;
    }
  });

  // ====== TẠO OUTPUT ======
  const output = [];

  // Chỉ lấy những nhân viên có trong DataChotNSThang (danh sách chốt cho kỳ này)
  Object.keys(maDonViMap).forEach(maCB => {
    // --- KIỂM TRA LỌC THEO ĐỊA PHƯƠNG ---
    if (locationNormalized) {
      const empKhuVuc = khuVucMap[maCB] || "";
      if (empKhuVuc !== locationNormalized) return; // Bỏ qua nếu không đúng cơ sở
    }

    const emp = employeeMap[maCB];
    if (!emp) return; // Nhân viên không có dữ liệu lương

    // --- LỌC NHÂN SỰ CÓ TRẠNG THÁI "Đi công tác NN" HOẶC "Đi NN" RA KHỎI BẢNG CHUYỂN KHOẢN ---
    const statusNorm = String(emp.trangThai || '').normalize('NFC').trim().toLowerCase();
    if (statusNorm === 'đi công tác nn' || statusNorm === 'đi nn') {
      Logger.log('Lọc bỏ nhân sự đi nước ngoài: %s - %s - Trạng thái: %s', emp.maCB, emp.hoTen, emp.trangThai);
      return; // Bỏ qua nhân sự này
    }

    // Tính tổng theo công thức: 5 = 6+7-8 + 9+10-11 + 12+13-14 - 15 (Thuế TNCN)
    const tong =
      emp.tongLuong1 + emp.ttL1_Duong - emp.ttL1_Am +
      emp.luong2 + emp.ttL2_Duong - emp.ttL2_Am +
      emp.tongAnCa + emp.anCaTL_Duong - emp.anCaTL_Am - emp.thueTNCN_Prev;

    output.push([
      0,                      // 1. STT
      emp.maCB,               // 2. Mã CB
      emp.hoTen,              // 3. Họ và tên
      emp.soTaiKhoan,         // 4. Số tài khoản
      emp.tenNganHang,        // 5. Tên ngân hàng
      tong,                   // 6. Tổng
      emp.tongLuong1,         // 7. Tổng lương 1
      emp.ttL1_Duong,         // 8. TT L1 (+)
      emp.ttL1_Am,            // 9. TT L1 (-)
      emp.luong2,             // 10. Lương 2
      emp.ttL2_Duong,         // 11. TT L2 (+)
      emp.ttL2_Am,            // 12. TT L2 (-)
      emp.tongAnCa,           // 13. Tổng Ăn ca
      emp.anCaTL_Duong,       // 14. Ăn ca TL (+)
      emp.anCaTL_Am,          // 15. Ăn ca TL (-)
      emp.thueTNCN_Prev,      // 16. Thuế TNCN tháng trước
      emp.maDonVi,            // 17. Mã đơn vị (sort key, sẽ bỏ sau)
      emp.loaiHD              // 18. Loại hợp đồng (sort key, sẽ bỏ sau)
    ]);
  });

  Logger.log('Đã tạo %s dòng dữ liệu, bắt đầu sắp xếp theo Mã đơn vị', output.length);

  // ====== SẮP XẾP THEO LOẠI HỢP ĐỒNG, MÃ ĐƠN VỊ VÀ MÃ CB ======
  const contractOrder = ["Biên chế", "HĐ dài hạn", "HĐ 68", "HĐ vụ việc"];
  const getContractWeight = (contractName) => {
    const idx = contractOrder.indexOf(contractName);
    return idx !== -1 ? idx : 999;
  };

  output.sort((a, b) => {
    const maDonViA = String(a[16] || '').trim(); // index 16 = cột Mã đơn vị
    const maDonViB = String(b[16] || '').trim();

    const loaiHDA = String(a[17] || '').trim(); // index 17 = cột Loại hợp đồng
    const loaiHDB = String(b[17] || '').trim();

    // 1. So sánh Mã đơn vị
    if (maDonViA < maDonViB) return -1;
    if (maDonViA > maDonViB) return 1;

    // 2. So sánh Loại hợp đồng (theo mảng contractOrder)
    const weightA = getContractWeight(loaiHDA);
    const weightB = getContractWeight(loaiHDB);
    if (weightA !== weightB) {
      return weightA - weightB;
    }
    // Nếu loại HĐ không nằm trong contractOrder, sort theo bảng chữ cái
    if (weightA === 999 && loaiHDA !== loaiHDB) {
      return loaiHDA.localeCompare(loaiHDB);
    }

    // 3. Sắp xếp theo Mã CB tăng dần (sau khi bỏ CB)
    const maCBA = String(a[1] || '').trim(); // index 1 = cột Mã CB
    const maCBB = String(b[1] || '').trim();

    const getNumericMaCB = (val) => {
      const clean = val.replace(/^CB/i, '').trim();
      const num = parseInt(clean, 10);
      return isNaN(num) ? clean : num;
    };

    const numA = getNumericMaCB(maCBA);
    const numB = getNumericMaCB(maCBB);

    if (typeof numA === 'number' && typeof numB === 'number') {
      return numA - numB;
    }
    return String(numA).localeCompare(String(numB));
  });

  // ====== ĐÁNH LẠI STT VÀ BỎ CỘT MÃ ĐƠN VỊ, LOẠI HỢP ĐỒNG ======
  const finalOutput = output.map((row, index) => {
    row[0] = index + 1; // Đánh lại STT
    return row.slice(0, 16); // Bỏ cột 17, 18, giữ lại 16 cột
  });

  Logger.log('Hoàn thành tổng hợp: %s dòng dữ liệu (đã sắp xếp và bỏ các cột tạm)', finalOutput.length);
  return finalOutput;
}

/**
 * Chuyển số thành chữ tiếng Việt
 * @param {number} num - Số cần chuyển
 * @returns {string} - Số bằng chữ
 */
function numberToVietnameseWords(num) {
  if (num === 0) return 'Không đồng';

  var ones = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  var teens = ['mười', 'mười một', 'mười hai', 'mười ba', 'mười bốn', 'mười lăm',
    'mười sáu', 'mười bảy', 'mười tám', 'mười chín'];

  function convertLessThanOneThousand(n) {
    if (n === 0) return '';

    var result = '';

    // Hàng trăm
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' trăm ';
      n %= 100;
      if (n > 0 && n < 10) result += 'lẻ ';
    }

    // Hàng chục
    if (n >= 20) {
      result += ones[Math.floor(n / 10)] + ' mươi ';
      n %= 10;
      if (n === 5) {
        result += 'lăm';
      } else if (n === 1) {
        result += 'mốt';  // Số 1 sau "mươi" đọc là "mốt"
      } else if (n > 0) {
        result += ones[n];
      }
    } else if (n >= 10) {
      result += teens[n - 10];
    } else if (n > 0) {
      result += ones[n];
    }

    return result.trim();
  }

  var billion = Math.floor(num / 1000000000);
  var million = Math.floor((num % 1000000000) / 1000000);
  var thousand = Math.floor((num % 1000000) / 1000);
  var remainder = num % 1000;

  var parts = [];

  if (billion > 0) {
    parts.push(convertLessThanOneThousand(billion) + ' tỷ');
  }

  if (million > 0) {
    parts.push(convertLessThanOneThousand(million) + ' triệu');
  }

  if (thousand > 0) {
    parts.push(convertLessThanOneThousand(thousand) + ' nghìn');
  }

  if (remainder > 0) {
    parts.push(convertLessThanOneThousand(remainder));
  }

  var result = parts.join(', ').trim();

  // Viết hoa chữ cái đầu
  if (result) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  return result + ' đồng';
}

/**
 * Cung cấp dữ liệu JSON cho việc in ấn trên Client
 */
function getPrintDataCk(monthStr, location = 'All') {
  try {
    const ssLuong1 = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.DATA_LUONG_1);
    const ssLuong2 = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.DATA_LUONG_2);
    const ssTruyThu1 = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.TRUY_THU_LUONG_1);
    const ssTruyThu2 = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.TRUY_THU_LUONG_2);
    const ssAnCa = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.DATA_AN_CA);
    const ssMaster = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.MASTER_DATA);

    const resources = { ssLuong1, ssLuong2, ssTruyThu1, ssTruyThu2, ssAnCa, ssMaster };
    const data = doGet_tongHopDiNganHang(monthStr, resources, location);

    if (!data || data.length === 0) throw new Error("Không có dữ liệu cho kỳ này");

    const monthParts = monthStr.match(/^T(\d+)\.(\d+)$/);

    // Tính tổng cực kỳ chính xác
    let totalAll = 0;
    let totals = new Array(10).fill(0);
    data.forEach(row => {
      totalAll += Number(row[5]) || 0; // Cột Tổng (index 5, sau Tên NH)
      for (let i = 0; i < 10; i++) {
        totals[i] += Number(row[5 + (i + 1)]) || 0;
      }
    });

    const moneyInWords = typeof numberToVietnameseWords === 'function' ? numberToVietnameseWords(totalAll) : "...";

    return {
      status: "success",
      month: monthParts ? monthParts[1] : "",
      year: monthParts ? monthParts[2] : "",
      data: data,
      totalAll: totalAll,
      totals: totals,
      moneyInWords: moneyInWords,
      dateExport: `Ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`
    };
  } catch (e) {
    return { status: "error", message: e.message };
  }
}

/**
 * Lấy Kỳ lương tháng trước của một kỳ lương cho trước (Tmm.yyyy)
 */
function getPrevMonthStr(monthStr) {
  const match = monthStr.match(/^T(\d+)\.(\d+)$/);
  if (!match) return "";
  let m = parseInt(match[1], 10);
  let y = parseInt(match[2], 10);
  m--;
  if (m === 0) {
    m = 12;
    y--;
  }
  return "T" + String(m).padStart(2, '0') + "." + y;
}
