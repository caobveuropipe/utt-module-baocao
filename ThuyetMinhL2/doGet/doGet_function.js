/**
 * Hàm chính: truyền vào kỳ T dạng "Tmm.yyyy" (ví dụ "T01.2025")
 * Trả về mảng 2D:
 * [ [ID, Kỳ lương, Mã CB, Họ và tên, Lương và truy lĩnh, Lương và truy lĩnh kỳ trước, Tăng, Giảm, Ghi chú], ... ]
 */
function doGet_getDataToCompare(kyTStr) {
  // ====== CONFIG ======
  const FILE1_ID = '13JOTPXzwsgFttd6gmKk0mCTgXqKO9R4MJICMWHLvozs';      // TODO: thay ID file 1
  const FILE2_ID = '1rdy605GSv7R_QazPbPA7qXBEkzzqoDB0Kx-lhrAB6ew';      // TODO: thay ID file 2
  const SHEET1_NAME = 'DataLuong2';
  const SHEET2_NAME = 'DataTruyThuLinh';

  // ====== UTIL ======
  function parseKy(kyStr) {
    const body = kyStr.substring(1);
    const parts = body.split('.');
    const month = parseInt(parts[0], 10);
    const year = parseInt(parts[1], 10);
    return { month, year, monthKey: year * 12 + month };
  }
  function formatKy(month, year) {
    const mm = ('0' + month).slice(-2);
    return 'T' + mm + '.' + year;
  }

  const T = parseKy(kyTStr);
  let prevMonth, prevYear;
  if (T.month > 1) { prevMonth = T.month - 1; prevYear = T.year; }
  else { prevMonth = 12; prevYear = T.year - 1; }
  const kyT1Str = formatKy(prevMonth, prevYear);

  Logger.log('Kỳ T: %s, kỳ T-1: %s', kyTStr, kyT1Str);

  // ==== FILE 1 ====
  const ss1 = SpreadsheetApp.openById(FILE1_ID);
  const sh1 = ss1.getSheetByName(SHEET1_NAME);
  const values1 = sh1.getDataRange().getValues();
  Logger.log('File1 - tổng dòng (kể cả header): %s', values1.length);

  if (values1.length < 2) {
    Logger.log('File1 không có dữ liệu (chỉ header hoặc trống)');
    return [];
  }

  const header1 = values1[0];
  const data1 = values1.slice(1);

  const idx1 = {
    ID: header1.indexOf('ID'),
    KyLuong: header1.indexOf('Kỳ lương'),
    MaNS: header1.indexOf('Mã nhân sự'),
    HoTen: header1.indexOf('Họ và tên'),
    Luong2: header1.indexOf('Lương 2'),
    OnDinh: header1.indexOf('Ổn định thu nhập'),
    QuanLy: header1.indexOf('Quản lý'),
    HanhChinh: header1.indexOf('Hỗ trợ hành chính phục vụ'),
    ThuHut: header1.indexOf('Thu hút lao động'),
    HoTroKhac: header1.indexOf('Hỗ trợ khác'),
    NCS: header1.indexOf('Tạm ứng nghiên cứu sinh'),
    TamTruThue: header1.indexOf('Tạm trừ thuế'),
    QTT: header1.indexOf('Quyết toán thuế')
  };
  Logger.log('Index cột file1: %s', JSON.stringify(idx1));

  const mapLuong2 = {};
  let cntF1All = 0, cntF1Filtered = 0;

  data1.forEach(r => {
    cntF1All++;
    const ky = String(r[idx1.KyLuong]).trim();
    if (ky !== kyTStr && ky !== kyT1Str) return;
    cntF1Filtered++;
    const ma = String(r[idx1.MaNS]).trim();
    if (!ma) return;
    const key = ky + '||' + ma;

    const luong2 = Number(r[idx1.Luong2]) || 0;
    if (!mapLuong2[key]) {
      mapLuong2[key] = {
        totalLuong2: 0,
        byComponent: {
          'Ổn định thu nhập': 0,
          'Quản lý': 0,
          'Hỗ trợ hành chính phục vụ': 0,
          'Thu hút lao động': 0,
          'Hỗ trợ khác': 0,
          'Tạm ứng nghiên cứu sinh': 0,
          'Tạm trừ thuế': 0,
          'Quyết toán thuế': 0
        },
        hoTen: r[idx1.HoTen],
        maCB: ma,
        kyStr: ky,
        ID: r[idx1.ID]
      };
    }
    const obj = mapLuong2[key];
    obj.totalLuong2 += luong2;
    obj.byComponent['Ổn định thu nhập'] += Number(r[idx1.OnDinh]) || 0;
    obj.byComponent['Quản lý'] += Number(r[idx1.QuanLy]) || 0;
    obj.byComponent['Hỗ trợ hành chính phục vụ'] += Number(r[idx1.HanhChinh]) || 0;
    obj.byComponent['Thu hút lao động'] += Number(r[idx1.ThuHut]) || 0;
    obj.byComponent['Hỗ trợ khác'] += Number(r[idx1.HoTroKhac]) || 0;
    obj.byComponent['Tạm ứng nghiên cứu sinh'] += Number(r[idx1.NCS]) || 0;
    obj.byComponent['Tạm trừ thuế'] += Number(r[idx1.TamTruThue]) || 0;
    obj.byComponent['Quyết toán thuế'] += Number(r[idx1.QTT]) || 0;
  });

  Logger.log('File1: tổng dòng duyệt: %s, sau lọc 2 kỳ: %s, số key trong mapLuong2: %s',
    cntF1All, cntF1Filtered, Object.keys(mapLuong2).length);

  // ==== FILE 2 ====
  const ss2 = SpreadsheetApp.openById(FILE2_ID);
  const sh2 = ss2.getSheetByName(SHEET2_NAME);
  const values2 = sh2.getDataRange().getValues();
  Logger.log('File2 - tổng dòng (kể cả header): %s', values2.length);

  if (values2.length < 2) {
    Logger.log('File2 không có dữ liệu');
  }

  const header2 = values2[0];
  const data2 = values2.slice(1);

  const idx2 = {
    KyTraLuong: header2.indexOf('Kỳ trả lương'),
    MaNS: header2.indexOf('Mã nhân sự'),
    HoTen: header2.indexOf('Họ và tên'),
    ConNhan: header2.indexOf('Còn nhận'),
    OnDinhTT: header2.indexOf('Ổn định thu nhập thành tiền'),
    QuanLyTT: header2.indexOf('Quản lý thành tiền'),
    HanhChinhTT: header2.indexOf('Hỗ trợ hành chính thành tiền'),
    ThuHutTT: header2.indexOf('Thu hút lao động thành tiền'),
    HoTroKhacTT: header2.indexOf('Hỗ trợ khác thành tiền'),
    NCSTT: header2.indexOf('nghiên cứu sinh - Thành tiền')
  };
  Logger.log('Index cột file2: %s', JSON.stringify(idx2));

  const mapTruyThu = {};
  let cntF2All = 0, cntF2Filtered = 0;

  data2.forEach(r => {
    cntF2All++;
    const ky = String(r[idx2.KyTraLuong]).trim();
    if (ky !== kyTStr && ky !== kyT1Str) return;
    cntF2Filtered++;
    const ma = String(r[idx2.MaNS]).trim();
    if (!ma) return;
    const key = ky + '||' + ma;

    const conNhan = Number(r[idx2.ConNhan]) || 0;
    if (!mapTruyThu[key]) {
      mapTruyThu[key] = {
        totalConNhan: 0,
        byComponent: {
          'Ổn định thu nhập thành tiền': 0,
          'Quản lý thành tiền': 0,
          'Hỗ trợ hành chính thành tiền': 0,
          'Thu hút lao động thành tiền': 0,
          'Hỗ trợ khác thành tiền': 0,
          'nghiên cứu sinh - Thành tiền': 0
        },
        hoTen: r[idx2.HoTen],
        maCB: ma,
        kyStr: ky
      };
    }
    const obj = mapTruyThu[key];
    obj.totalConNhan += conNhan;
    obj.byComponent['Ổn định thu nhập thành tiền'] += Number(r[idx2.OnDinhTT]) || 0;
    obj.byComponent['Quản lý thành tiền'] += Number(r[idx2.QuanLyTT]) || 0;
    obj.byComponent['Hỗ trợ hành chính thành tiền'] += Number(r[idx2.HanhChinhTT]) || 0;
    obj.byComponent['Thu hút lao động thành tiền'] += Number(r[idx2.ThuHutTT]) || 0;
    obj.byComponent['Hỗ trợ khác thành tiền'] += Number(r[idx2.HoTroKhacTT]) || 0;
    obj.byComponent['nghiên cứu sinh - Thành tiền'] += Number(r[idx2.NCSTT]) || 0;
  });

  Logger.log('File2: tổng dòng duyệt: %s, sau lọc 2 kỳ: %s, số key trong mapTruyThu: %s',
    cntF2All, cntF2Filtered, Object.keys(mapTruyThu).length);

  // ==== TỔNG THEO KỲ ====
  const mapTongTheoKy = {};
  function ensureRecord(kyStr, maCB) {
    const key = kyStr + '||' + maCB;
    if (!mapTongTheoKy[key]) {
      mapTongTheoKy[key] = {
        kyStr: kyStr,
        maCB: maCB,
        hoTen: '',
        ID: '',
        luongTruLinh: 0,
        byComponentLuong2: {},
        byComponentTruyThu: {}
      };
    }
    return mapTongTheoKy[key];
  }

  Object.keys(mapLuong2).forEach(key => {
    const item = mapLuong2[key];
    const rec = ensureRecord(item.kyStr, item.maCB);
    rec.hoTen = item.hoTen || rec.hoTen;
    rec.ID = item.ID || rec.ID;
    rec.luongTruLinh += item.totalLuong2;
    rec.byComponentLuong2 = item.byComponent;
  });

  Object.keys(mapTruyThu).forEach(key => {
    const item = mapTruyThu[key];
    const rec = ensureRecord(item.kyStr, item.maCB);
    if (!rec.hoTen) rec.hoTen = item.hoTen;
    rec.luongTruLinh += item.totalConNhan;
    rec.byComponentTruyThu = item.byComponent;
  });

  Logger.log('Số key trong mapTongTheoKy: %s', Object.keys(mapTongTheoKy).length);

  // ==== GHÉP THEO MÃ NHÂN SỰ ====
  const employeesSet = new Set();
  Object.keys(mapTongTheoKy).forEach(key => {
    const parts = key.split('||');
    if (parts.length === 2) employeesSet.add(parts[1]);
  });
  const employees = Array.from(employeesSet);
  Logger.log('Số mã nhân sự có dữ liệu T hoặc T-1: %s', employees.length);

  const output = [];

  // Chuẩn bị chuỗi thời gian chung để sinh ID
  const now = new Date();
  const yyyy = now.getFullYear();
  const MM = ('0' + (now.getMonth() + 1)).slice(-2);
  const dd = ('0' + now.getDate()).slice(-2);
  const hh = ('0' + now.getHours()).slice(-2);
  const mi = ('0' + now.getMinutes()).slice(-2);
  const ss = ('0' + now.getSeconds()).slice(-2);
  const timeStr = '' + yyyy + MM + dd + hh + mi + ss; // yyyyMMddhhmmss

  employees.forEach((maCB, idx) => {
    const keyT = kyTStr + '||' + maCB;
    const keyT1 = kyT1Str + '||' + maCB;
    const recT_raw = mapTongTheoKy[keyT];
    const recT1_raw = mapTongTheoKy[keyT1];

    // Nếu không có thì coi như 0 (chỉ xuất hiện ở 1 kỳ)
    const recT = recT_raw || {
      kyStr: kyTStr,
      maCB: maCB,
      hoTen: '',
      ID: '',
      luongTruLinh: 0,
      byComponentLuong2: {},
      byComponentTruyThu: {}
    };
    const recT1 = recT1_raw || {
      kyStr: kyT1Str,
      maCB: maCB,
      hoTen: '',
      ID: '',
      luongTruLinh: 0,
      byComponentLuong2: {},
      byComponentTruyThu: {}
    };

    const luongT = Number(recT.luongTruLinh) || 0;
    const luongT1 = Number(recT1.luongTruLinh) || 0;
    const diff = luongT - luongT1;

    // Bỏ qua trường hợp cả hai đều 0 thực sự
    if (luongT === 0 && luongT1 === 0) return;

    let tang = '';
    let giam = '';
    if (diff > 0) tang = diff;
    else if (diff < 0) giam = Math.abs(diff);

    // ====== GHI CHÚ ======
    let ghiChu = '';
    if (diff !== 0) {
      const noteParts = [];

      const f1Headers = [
        'Ổn định thu nhập',
        'Quản lý',
        'Hỗ trợ hành chính phục vụ',
        'Thu hút lao động',
        'Hỗ trợ khác',
        'Tạm ứng nghiên cứu sinh',
        'Tạm trừ thuế',
        'Quyết toán thuế'
      ];
      f1Headers.forEach(h => {
        const valT = (recT.byComponentLuong2 && Number(recT.byComponentLuong2[h])) || 0;
        const valT1_ = (recT1.byComponentLuong2 && Number(recT1.byComponentLuong2[h])) || 0;
        if (valT - valT1_ !== 0) noteParts.push(h);
      });

      const f2Headers = [
        'Ổn định thu nhập thành tiền',
        'Quản lý thành tiền',
        'Hỗ trợ hành chính thành tiền',
        'Thu hút lao động thành tiền',
        'Hỗ trợ khác thành tiền',
        'nghiên cứu sinh - Thành tiền'
      ];
      f2Headers.forEach(h => {
        const valT = (recT.byComponentTruyThu && Number(recT.byComponentTruyThu[h])) || 0;
        const valT1_ = (recT1.byComponentTruyThu && Number(recT1.byComponentTruyThu[h])) || 0;
        if (valT - valT1_ !== 0) noteParts.push(h);
      });

      if (noteParts.length > 0) ghiChu = noteParts.join('; ');
    }

    // ====== PHÂN LOẠI ======
    const phanLoai = (diff !== 0) ? 'Có thay đổi' : 'Không thay đổi';

    // ====== TỰ SINH ID ======
    // index dòng bắt đầu từ 1, format 4 số
    //const lineIndexStr = ('0000' + (output.length + 1)).slice(-4);
    //const newID = lineIndexStr + 'ID' + timeStr; // ví dụ: "0001ID20250101123045"

    const row = [
      "",                        // ID tự sinh
      //kyTStr,                       // Kỳ lương (T)
      maCB,                         // Mã CB
      recT.hoTen || recT1.hoTen || '', // Họ và tên
      luongT,                       // Lương và truy lĩnh
      luongT1,                      // Lương và truy lĩnh kỳ trước
      tang,                         // Tăng
      giam,                         // Giảm
      ghiChu,                       // Ghi chú
      phanLoai                      // Phân loại
    ];
    output.push(row);
  });

  Logger.log('Số dòng kết quả cuối cùng: %s', output.length);
  return output;
}
function doGet_getDataFromSheet(monthStr) {
  /**
 * Lấy dữ liệu trong sheet "Database" theo kỳ lương monthStr (Tmm.yyyy)
 * Trả về mảng 2D với đúng cấu trúc cột:
 * ID, Kỳ lương, Mã CB, Họ và tên, Lương và truy lĩnh,
 * Lương và truy lĩnh kỳ trước, Tăng, Giảm, Ghi chú, Phân loại
 */
  const DB_FILE_ID = '1-pKqPF-GpmoTXno1no5NN-JRIMLsHwBqGx1xdLHPgr4';  // TODO: thay ID file chứa sheet Database
  const DB_SHEET_NAME = 'Database';

  const ss = SpreadsheetApp.openById(DB_FILE_ID);
  const sh = ss.getSheetByName(DB_SHEET_NAME);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];

  const header = values[0];
  const data = values.slice(1);

  const idx = {
    ID: header.indexOf('ID'),
    KyLuong: header.indexOf('Kỳ lương'),
    MaCB: header.indexOf('Mã CB'),
    HoTen: header.indexOf('Họ và tên'),
    LuongTL: header.indexOf('Lương và truy lĩnh'),
    LuongTLPrev: header.indexOf('Lương và truy lĩnh kỳ trước'),
    Tang: header.indexOf('Tăng'),
    Giam: header.indexOf('Giảm'),
    GhiChu: header.indexOf('Ghi chú'),
    PhanLoai: header.indexOf('Phân loại')
  };

  const out = [];
  data.forEach(r => {
    const ky = String(r[idx.KyLuong]).trim();
    if (ky !== monthStr) return;

    out.push([
      r[idx.ID],
      //r[idx.KyLuong],
      r[idx.MaCB],
      r[idx.HoTen],
      r[idx.LuongTL],
      r[idx.LuongTLPrev],
      r[idx.Tang],
      r[idx.Giam],
      r[idx.GhiChu],
      r[idx.PhanLoai]
    ]);
  });

  return out;

}
function doGet_getDataCoThayDoi_FromSheet(monthStr) {
  /**
  * Lấy dữ liệu trong sheet "Database" theo kỳ lương monthStr (Tmm.yyyy)
  * Chỉ trả về các dòng có Phân loại = "Có thay đổi"
  * Trả về mảng 2D với đúng cấu trúc cột:
  * ID, Mã CB, Họ và tên, Lương và truy lĩnh,
  * Lương và truy lĩnh kỳ trước, Tăng, Giảm, Ghi chú, Phân loại
  */
  const DB_FILE_ID = '1-pKqPF-GpmoTXno1no5NN-JRIMLsHwBqGx1xdLHPgr4';  // TODO: thay ID file chứa sheet Database
  const DB_SHEET_NAME = 'Database';

  const ss = SpreadsheetApp.openById(DB_FILE_ID);
  const sh = ss.getSheetByName(DB_SHEET_NAME);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];

  const header = values[0];
  const data = values.slice(1);

  const idx = {
    ID: header.indexOf('ID'),
    KyLuong: header.indexOf('Kỳ lương'),
    MaCB: header.indexOf('Mã CB'),
    HoTen: header.indexOf('Họ và tên'),
    LuongTL: header.indexOf('Lương và truy lĩnh'),
    LuongTLPrev: header.indexOf('Lương và truy lĩnh kỳ trước'),
    Tang: header.indexOf('Tăng'),
    Giam: header.indexOf('Giảm'),
    GhiChu: header.indexOf('Ghi chú'),
    PhanLoai: header.indexOf('Phân loại')
  };

  const out = [];
  data.forEach(r => {
    const ky = String(r[idx.KyLuong]).trim();
    const phanLoai = String(r[idx.PhanLoai]).trim();

    // Chỉ lấy dòng đúng kỳ lương VÀ Phân loại = "Có thay đổi"
    if (ky !== monthStr || phanLoai !== 'Có thay đổi') return;

    out.push([
      r[idx.ID],
      r[idx.MaCB],
      r[idx.HoTen],
      r[idx.LuongTL],
      r[idx.LuongTLPrev],
      r[idx.Tang],
      r[idx.Giam],
      r[idx.GhiChu],
      r[idx.PhanLoai]
    ]);
  });

  Logger.log('doGet_getDataCoThayDoi_FromSheet(%s): Tìm thấy %s dòng "Có thay đổi"', monthStr, out.length);
  return out;
}
function doGet_getDataKhongThayDoi_FromSheet(monthStr) {
  /**
  * Lấy dữ liệu trong sheet "Database" theo kỳ lương monthStr (Tmm.yyyy)
  * Chỉ trả về các dòng có Phân loại = "Có thay đổi"
  * Trả về mảng 2D với đúng cấu trúc cột:
  * ID, Mã CB, Họ và tên, Lương và truy lĩnh,
  * Lương và truy lĩnh kỳ trước, Tăng, Giảm, Ghi chú, Phân loại
  */
  const DB_FILE_ID = '1-pKqPF-GpmoTXno1no5NN-JRIMLsHwBqGx1xdLHPgr4';  // TODO: thay ID file chứa sheet Database
  const DB_SHEET_NAME = 'Database';

  const ss = SpreadsheetApp.openById(DB_FILE_ID);
  const sh = ss.getSheetByName(DB_SHEET_NAME);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];

  const header = values[0];
  const data = values.slice(1);

  const idx = {
    ID: header.indexOf('ID'),
    KyLuong: header.indexOf('Kỳ lương'),
    MaCB: header.indexOf('Mã CB'),
    HoTen: header.indexOf('Họ và tên'),
    LuongTL: header.indexOf('Lương và truy lĩnh'),
    LuongTLPrev: header.indexOf('Lương và truy lĩnh kỳ trước'),
    Tang: header.indexOf('Tăng'),
    Giam: header.indexOf('Giảm'),
    GhiChu: header.indexOf('Ghi chú'),
    PhanLoai: header.indexOf('Phân loại')
  };

  const out = [];
  data.forEach(r => {
    const ky = String(r[idx.KyLuong]).trim();
    const phanLoai = String(r[idx.PhanLoai]).trim();

    // Chỉ lấy dòng đúng kỳ lương VÀ Phân loại = "Có thay đổi"
    if (ky !== monthStr || phanLoai === 'Có thay đổi') return;

    out.push([
      r[idx.ID],
      r[idx.MaCB],
      r[idx.HoTen],
      r[idx.LuongTL],
      r[idx.LuongTLPrev],
      r[idx.Tang],
      r[idx.Giam],
      r[idx.GhiChu],
      r[idx.PhanLoai]
    ]);
  });

  Logger.log('doGet_getDataCoThayDoi_FromSheet(%s): Tìm thấy %s dòng "Có thay đổi"', monthStr, out.length);
  return out;
}


/**
 * Lấy dữ liệu từ sheet DataChotNSThang
 * Trả về Map với key là "Kỳ lương||Mã nhân sự", value là object chứa thông tin cần thiết
 */
function doGet_getDataChotNSThang() {
  const idFileChotNhanSuThang = LibraryDigiCore.idFileChotNhanSuThang;
  let values;
  try {
    const response = Sheets.Spreadsheets.Values.get(idFileChotNhanSuThang, 'DataChotNSThang', {
      valueRenderOption: 'FORMATTED_VALUE'
    });
    values = response.values;
  } catch (e) {
    Logger.log('Lỗi khi dùng Sheets API cho DataChotNSThang: %s. Fallback dùng SpreadsheetApp.', e.message);
    values = getSheetNSThang().getDataRange().getValues();
  }

  if (!values || values.length < 2) return {};

  const header = values[0];
  const data = values.slice(1);

  const idx = {
    KyLuong: header.indexOf('Kỳ lương'),
    MaNS: header.indexOf('Mã nhân sự'),
    MaDonVi: header.indexOf('Mã đơn vị'),
    LoaiHopDong: header.indexOf('Loại hợp đồng'),  // ✅ THÊM
    HoTen: header.indexOf('Họ tên'),
    KhuVuc: header.indexOf('Khu vực') !== -1 ? header.indexOf('Khu vực') : 38 // ✅ Cột AM (index 38)
  };

  // Kiểm tra các cột cần thiết
  if (idx.KyLuong === -1 || idx.MaNS === -1 || idx.MaDonVi === -1 || idx.LoaiHopDong === -1) {
    Logger.log('Cảnh báo: Thiếu cột cần thiết trong DataChotNSThang. Tìm thấy: %s',
      Object.keys(idx).filter(k => idx[k] !== -1).join(', '));
    return {};
  }

  const map = {};
  data.forEach(r => {
    const kyLuong = String(r[idx.KyLuong] || '').trim();
    const maNS = String(r[idx.MaNS] || '').trim();
    const maDonVi = String(r[idx.MaDonVi] || '').trim();
    const loaiHopDong = String(r[idx.LoaiHopDong] || '').trim();  // ✅ THÊM

    if (!kyLuong || !maNS) return;

    const key = kyLuong + '||' + maNS;
    map[key] = {
      kyLuong: kyLuong,
      maNS: maNS,
      maDonVi: maDonVi,
      loaiHopDong: loaiHopDong,  // ✅ THÊM
      hoTen: r[idx.HoTen] || '',
      khuVuc: String(r[idx.KhuVuc] || '').trim() // ✅ THÊM
    };
  });

  Logger.log('doGet_getDataChotNSThang: Đã load %s records với Loại HĐ', Object.keys(map).length);
  return map;
}

function doGet_getDataChotNSThang_WithBankInfo(bankMap) {
  // 1. Load thông tin ngân hàng từ Master Data trước (giống L1) nếu caller không truyền vào
  if (!bankMap) {
    bankMap = doGet_getDataNhanSu_SoTaiKhoan();
  }

  // 2. Load DataChotNSThang (Snapshot tháng)
  const idFileChotNhanSuThang = LibraryDigiCore.idFileChotNhanSuThang;
  let values1;
  try {
    const response = Sheets.Spreadsheets.Values.get(idFileChotNhanSuThang, 'DataChotNSThang', {
      valueRenderOption: 'FORMATTED_VALUE'
    });
    values1 = response.values;
  } catch (e) {
    Logger.log('Lỗi khi dùng Sheets API cho DataChotNSThang: %s. Fallback dùng SpreadsheetApp.', e.message);
    const sh1 = getSheetNSThang();
    values1 = sh1.getDataRange().getValues();
  }

  if (!values1 || values1.length < 2) return {};

  const header1 = values1[0];
  const data1 = values1.slice(1);

  const idx1 = {
    KyLuong: header1.indexOf('Kỳ lương'),
    MaNS: header1.indexOf('Mã nhân sự'),
    MaDonVi: header1.indexOf('Mã đơn vị'),
    LoaiHopDong: header1.indexOf('Loại hợp đồng'),
    HoTen: header1.indexOf('Họ tên'),
    SoTaiKhoan: header1.indexOf('Số tài khoản'),
    ConLinh: header1.indexOf('Còn lĩnh'),
    KhuVuc: header1.indexOf('Khu vực') !== -1 ? header1.indexOf('Khu vực') : 38
  };

  if (idx1.MaNS === -1 || idx1.KyLuong === -1) {
    Logger.log('Cảnh báo: Thiếu cột "Mã nhân sự" hoặc "Kỳ lương" trong DataChotNSThang');
    return {};
  }

  const map = {};
  data1.forEach(r => {
    const kyLuong = String(r[idx1.KyLuong] || '').trim();
    const maNS = String(r[idx1.MaNS] || '').trim();
    if (!kyLuong || !maNS) return;

    const baseData = {
      kyLuong: kyLuong,
      maNS: maNS,
      maDonVi: String(r[idx1.MaDonVi] || '').trim(),
      loaiHopDong: String(r[idx1.LoaiHopDong] || '').trim(),
      hoTen: r[idx1.HoTen] || '',
      khuVuc: String(r[idx1.KhuVuc] || '').trim(),
      soTaiKhoan: '',
      tenNganHang: '',
      tongLinh: 0
    };

    // ƯU TIÊN 1: Lấy từ Master Data (bankMap đã load từ DataNhanSu)
    if (bankMap[maNS]) {
      baseData.soTaiKhoan = bankMap[maNS].soTaiKhoan;
      baseData.tenNganHang = bankMap[maNS].tenNganHang;
    } 
    // ƯU TIÊN 2: Nếu Master không có, lấy từ cột Số tài khoản trong bản chốt (fallback)
    else if (idx1.SoTaiKhoan !== -1) {
      const soTaiKhoanFull = String(r[idx1.SoTaiKhoan] || '').trim();
      if (soTaiKhoanFull) {
        let soTK = soTaiKhoanFull;
        let tenNH = '';
        const parts = soTaiKhoanFull.split('-');
        if (parts.length >= 2) {
          soTK = parts[0].trim();
          tenNH = parts.slice(1).join('-').trim();
        }
        baseData.soTaiKhoan = soTK;
        baseData.tenNganHang = tenNH;
      }
    }

    if (idx1.ConLinh !== -1) {
      baseData.tongLinh = parseFloat(r[idx1.ConLinh]) || 0;
    }

    const key = kyLuong + '||' + maNS;
    map[key] = baseData;
  });

  Logger.log('doGet_getDataChotNSThang_WithBankInfo: Đã load %s records, trong đó %s records có thông tin TK ngân hàng',
    Object.keys(map).length, Object.values(map).filter(item => item.soTaiKhoan).length);

  return map;
}

// Xóa hàm trung gian không cần thiết
function doGet_getDataMasterNhanSu_BankInfo() { return {}; }

/**LẤY SỐ TÀI KHOẢN - đọc từ Master DataNhanSu (giống L1) */
function doGet_getDataNhanSu_SoTaiKhoan() {
  const idFileData = LibraryDigiCore.idFileData;
  let values;
  try {
    const response = Sheets.Spreadsheets.Values.get(idFileData, 'DataNhanSu', {
      valueRenderOption: 'FORMATTED_VALUE'
    });
    values = response.values;
  } catch (e) {
    Logger.log('Lỗi khi dùng Sheets API cho DataNhanSu: %s. Fallback dùng SpreadsheetApp.', e.message);
    const ss = SpreadsheetApp.openById(idFileData);
    const sh = ss.getSheetByName("DataNhanSu");
    if (!sh) return {};
    values = sh.getDataRange().getValues();
  }

  if (!values || values.length < 2) return {};

  const header = values[0];
  const data = values.slice(1);

  const idx = {
    MaNS: header.indexOf('Mã nhân sự') !== -1 ? header.indexOf('Mã nhân sự') : 0,
    SoTaiKhoan: header.indexOf('Số tài khoản'),
    KhuVuc: header.indexOf('Khu vực') !== -1 ? header.indexOf('Khu vực') : 38
  };

  if (idx.SoTaiKhoan === -1) {
    Logger.log('Cảnh báo: Không tìm thấy cột "Số tài khoản" trong DataNhanSu');
    return {};
  }

  const map = {};
  data.forEach(row => {
    const maCB = String(row[idx.MaNS] || '').trim();
    const soTaiKhoan = String(row[idx.SoTaiKhoan] || '').trim();
    const khuVuc = String(row[idx.KhuVuc] || '').trim();

    if (!maCB) return;

    // Tách "Số tk - Tên ngân hàng"
    let soTK = soTaiKhoan;
    let tenNganHang = '';
    const parts = soTaiKhoan.split('-');
    if (parts.length >= 2) {
      soTK = parts[0].trim();
      tenNganHang = parts.slice(1).join('-').trim();
    }

    const key = maCB;
    map[key] = {
      maCB: maCB,
      soTaiKhoan: soTK,
      tenNganHang: tenNganHang,
      khuVuc: khuVuc
    };
  });

  Logger.log('doGet_getDataNhanSu_SoTaiKhoan: Đã load %s records từ Master Data', Object.keys(map).length);
  return map;
}


/**
 * Thêm cột "Mã đơn vị" vào output của doGet_getDataFromSheet và sắp xếp theo Mã đơn vị
 * @param {string} monthStr - Kỳ lương (Tmm.yyyy)
 * @returns {Array} - Mảng 2D đã thêm cột Mã đơn vị và sắp xếp
 */

function doGet_getDataPrint_CoThayDoi(monthStr, regionFilter) {
  // Lấy dữ liệu gốc từ Database
  const originalData = doGet_getDataCoThayDoi_FromSheet(monthStr);

  if (!originalData || originalData.length === 0) {
    Logger.log('Không có dữ liệu từ doGet_getDataFromSheet cho kỳ: %s', monthStr);
    return [];
  }

  // Lấy dữ liệu DataChotNSThang (map: key -> { maDonVi, ... })
  const dataChotNSMap = doGet_getDataChotNSThang();

  // --- Tính tháng T-1 ---
  function parseKy(kyStr) {
    const body = kyStr.substring(1);     // bỏ chữ "T"
    const parts = body.split('.');
    const month = parseInt(parts[0], 10);
    const year = parseInt(parts[1], 10);
    return { month, year };
  }

  function formatKy(month, year) {
    const mm = ('0' + month).slice(-2);
    return 'T' + mm + '.' + year;
  }

  const T = parseKy(monthStr);
  let prevMonth, prevYear;
  if (T.month > 1) {
    prevMonth = T.month - 1;
    prevYear = T.year;
  } else {
    prevMonth = 12;
    prevYear = T.year - 1;
  }
  const monthStrT1 = formatKy(prevMonth, prevYear);

  Logger.log('Tháng T: %s, Tháng T-1: %s', monthStr, monthStrT1);

  // --- Thêm 2 cột phụ: [ ...row, maDonVi, maNSNumber ] ---
  const enrichedData = originalData.map(row => {
    // row: [ID, Mã CB, Họ và tên, ...]
    const maCBRaw = String(row[1] || '').trim(); // Mã nhân sự gốc, ví dụ: "CB00123"

    // Lấy Mã đơn vị từ map
    const keyT = monthStr + '||' + maCBRaw;
    const keyT1 = monthStrT1 + '||' + maCBRaw;

    let maDonVi = '';
    let khuVuc = '';
    if (dataChotNSMap[keyT]) {
      maDonVi = dataChotNSMap[keyT].maDonVi || '';
      khuVuc = dataChotNSMap[keyT].khuVuc || '';
    } else if (dataChotNSMap[keyT1]) {
      maDonVi = dataChotNSMap[keyT1].maDonVi || '';
      khuVuc = dataChotNSMap[keyT1].khuVuc || '';
    }

    // Tạo Mã nhân sự dạng number: bỏ tiền tố "CB" (không phân biệt hoa thường), parseInt
    let maNSNumber = null;
    let cleaned = maCBRaw;
    if (/^CB/i.test(cleaned)) {
      cleaned = cleaned.replace(/^CB/i, '');
    }
    cleaned = cleaned.trim();
    if (cleaned !== '') {
      const n = parseInt(cleaned, 10);
      maNSNumber = isNaN(n) ? null : n;
    }

    return [...row, maDonVi, maNSNumber, khuVuc];
  });

  // --- Lọc theo Khu vực nếu có yêu cầu ---
  let filteredEnrichedData = enrichedData;
  if (regionFilter && regionFilter !== 'Tất cả') {
    filteredEnrichedData = enrichedData.filter(row => {
      const rowKhuVuc = String(row[row.length - 1] || '').trim();
      return rowKhuVuc === regionFilter;
    });
  }

  if (filteredEnrichedData.length === 0) {
    Logger.log('Sau khi lọc theo Khu vực "%s", không có dữ liệu cho kỳ: %s', regionFilter, monthStr);
    return [];
  }

  // Vị trí 3 cột phụ
  const COL_MA_DON_VI = filteredEnrichedData[0].length - 3;
  const COL_MA_NS_NUM = filteredEnrichedData[0].length - 2;

  // --- Sort: theo Mã đơn vị (tăng dần), trong từng đơn vị sort theo Mã NS number (tăng dần) ---
  filteredEnrichedData.sort((a, b) => {
    // 1) Sort theo Mã đơn vị (string tăng dần)
    const maDonViA = String(a[COL_MA_DON_VI] || '').trim();
    const maDonViB = String(b[COL_MA_DON_VI] || '').trim();

    if (maDonViA < maDonViB) return -1;
    if (maDonViA > maDonViB) return 1;

    // 2) Nếu cùng Mã đơn vị -> sort theo Mã nhân sự dạng number tăng dần
    const aNum = a[COL_MA_NS_NUM];
    const bNum = b[COL_MA_NS_NUM];

    const aIsValid = (typeof aNum === 'number' && !isNaN(aNum));
    const bIsValid = (typeof bNum === 'number' && !isNaN(bNum));

    if (aIsValid && bIsValid) {
      if (aNum < bNum) return -1;
      if (aNum > bNum) return 1;
      return 0;
    } else if (aIsValid && !bIsValid) {
      // Có số sẽ đứng trước không có số
      return -1;
    } else if (!aIsValid && bIsValid) {
      return 1;
    }

    return 0;
  });


  // --- Xóa 3 cột phụ ---
  const finalData = filteredEnrichedData.map(row => row.slice(0, -3));

  Logger.log('doGet_getDataPrint_CoThayDoi: Đã xử lý %s dòng, lọc theo Khu vực "%s"', finalData.length, regionFilter);
  return finalData;
}

function doGet_getDataPrint_KhongThayDoi(monthStr, regionFilter) {
  // 1. Lấy dữ liệu gốc
  const originalData = doGet_getDataKhongThayDoi_FromSheet(monthStr);
  return doGet_buildDataPrint_DiNganHang(originalData, monthStr, regionFilter, 'KhongThayDoi');
}

function doGet_getDataPrint_DiNganHang(monthStr, regionFilter) {
  // Bảng đi ngân hàng phải lấy toàn bộ thực lĩnh L2 của kỳ, gồm cả Có thay đổi và Không thay đổi.
  const originalData = doGet_getDataFromSheet(monthStr);
  return doGet_buildDataPrint_DiNganHang(originalData, monthStr, regionFilter, 'DiNganHang');
}

function doGet_buildDataPrint_DiNganHang(originalData, monthStr, regionFilter, logLabel) {
  if (!originalData || originalData.length === 0) {
    Logger.log('Không có dữ liệu từ doGet_getDataFromSheet cho kỳ: %s', monthStr);
    return [];
  }

  // 2. Lấy map DataChotNSThang, đã kèm Số TK, Tên NH (giống L1)
  const personnelBankMap = doGet_getDataNhanSu_SoTaiKhoan();
  const dataChotNSMap = doGet_getDataChotNSThang_WithBankInfo(personnelBankMap);

  // 3. Tính tháng T-1
  function parseKy(kyStr) {
    const body = kyStr.substring(1);
    const parts = body.split('.');
    const month = parseInt(parts[0], 10);
    const year = parseInt(parts[1], 10);
    return { month, year };
  }

  function formatKy(month, year) {
    const mm = ('0' + month).slice(-2);
    return 'T' + mm + '.' + year;
  }

  const T = parseKy(monthStr);
  const prevMonth = T.month > 1 ? T.month - 1 : 12;
  const prevYear = T.month > 1 ? T.year : T.year - 1;
  const monthStrT1 = formatKy(prevMonth, prevYear);

  Logger.log('Tháng T: %s, Tháng T-1: %s', monthStr, monthStrT1);

  // 4. Định nghĩa index cột trong originalData
  const COL_ID = 0;  // ID
  const COL_MA_CB = 1;  // Mã CB
  const COL_HO_TEN = 2;  // Họ và tên
  const COL_SO_TIEN = 3;  // Số tiền

  // 5. Tạo enrichedData: 8 cột output + 3 cột phụ
  // Output cuối: [ID, Họ và tên, Số TK, Tên NH, Số tiền, '', '', Số tiền 2]
  const enrichedData = originalData.map(row => {
    const maCBRaw = String(row[COL_MA_CB] || '').trim();

    // Khóa tra map: ưu tiên bản chốt tháng hiện tại, fallback khu vực từ DataNhanSu như Bảng tổng hợp lương.
    const keyT = monthStr + '||' + maCBRaw;

    const fallback = personnelBankMap[maCBRaw] || {};
    const src = dataChotNSMap[keyT] || {};
    
    let soTaiKhoan = src.soTaiKhoan || fallback.soTaiKhoan || '';
    let tenNganHang = src.tenNganHang || fallback.tenNganHang || '';
    let maDonVi = src.maDonVi || '';
    let loaiHopDong = src.loaiHopDong || '';
    let khuVuc = src.khuVuc || fallback.khuVuc || '';

    // Ép chắc chắn số TK là text (thêm ' để tránh Sheets tự đổi format)
    const safeSoTK = soTaiKhoan ? "'" + String(soTaiKhoan) : '';
    const safeTenNH = tenNganHang ? String(tenNganHang) : '';

    const soTien = parseFloat(row[COL_SO_TIEN]) || 0;
    const soTien2 = soTien;

    // Nếu cần numeric sort theo Mã CB, tạo maNSNumber:
    let maNSNumber = null;
    let cleaned = maCBRaw;
    if (/^CB/i.test(cleaned)) cleaned = cleaned.replace(/^CB/i, '');
    cleaned = cleaned.trim();
    if (cleaned !== '') {
      const n = parseInt(cleaned, 10);
      maNSNumber = isNaN(n) ? null : n;
    }

    return [
      row[COL_ID],     // 0: ID
      row[COL_HO_TEN], // 1: Họ và tên
      safeSoTK,        // 2: Số tài khoản (text)
      safeTenNH,       // 3: Tên ngân hàng (text)
      soTien,          // 4: Số tiền
      '',              // 5: trống
      '',              // 6: trống
      soTien2,         // 7: Số tiền 2
      maDonVi,         // 8: phụ sort
      loaiHopDong,     // 9: phụ sort
      maNSNumber,      // 10: phụ sort
      khuVuc           // 11: phụ để lọc
    ];
  });

  // --- Lọc theo Khu vực nếu có yêu cầu ---
  let filteredEnrichedData = enrichedData;
  if (regionFilter && regionFilter !== 'Tất cả') {
    filteredEnrichedData = enrichedData.filter(row => {
      const rowKhuVuc = String(row[11] || '').trim();
      return rowKhuVuc.toLowerCase() === String(regionFilter || '').trim().toLowerCase();
    });
  }

  if (filteredEnrichedData.length === 0) {
    Logger.log('KhongThayDoi: Sau khi lọc theo Khu vực "%s", không có dữ liệu.', regionFilter);
    return [];
  }

  // 6. Cột phụ
  const COL_MA_DON_VI = 8;
  const COL_LOAI_HOP_DONG = 9;
  const COL_MA_NS_NUM = 10;

  function getLoaiHopDongOrder(loaiHD) {
    const normalized = String(loaiHD || '').replace(/^'/, '').trim().toLowerCase();
    if (normalized.includes('biên chế')) return 1;
    if (normalized.includes('dài hạn') || normalized.includes('hợp đồng dài hạn')) return 2;
    if (normalized.includes('68') || normalized.includes('hợp đồng 68')) return 3;
    if (normalized.includes('vụ việc') || normalized.includes('hợp đồng vụ việc')) return 4;
    return 999;
  }

  // 7. Sort theo: Loại HĐ -> Mã đơn vị -> Mã NS number
  filteredEnrichedData.sort((a, b) => {
    const orderA = getLoaiHopDongOrder(a[COL_LOAI_HOP_DONG]);
    const orderB = getLoaiHopDongOrder(b[COL_LOAI_HOP_DONG]);
    if (orderA !== orderB) return orderA - orderB;

    const maDonViA = String(a[COL_MA_DON_VI] || '').trim();
    const maDonViB = String(b[COL_MA_DON_VI] || '').trim();
    if (maDonViA < maDonViB) return -1;
    if (maDonViA > maDonViB) return 1;

    const aNum = a[COL_MA_NS_NUM];
    const bNum = b[COL_MA_NS_NUM];
    const aValid = typeof aNum === 'number' && !isNaN(aNum);
    const bValid = typeof bNum === 'number' && !isNaN(bNum);

    if (aValid && bValid) return aNum - bNum;
    if (aValid && !bValid) return -1;
    if (!aValid && bValid) return 1;
    return 0;
  });

  /*  // 8. Tính tổng theo nhóm Loại HĐ (chỉ cộng cột 4 và 7)
    if (enrichedData.length > 0) {
      let currentLoaiHD = '';
      let startIdx = 0;
      let tongAll4 = 0; // Tổng Số tiền
      let tongAll7 = 0; // Tổng Số tiền 2
  
      for (let i = 0; i <= enrichedData.length; i++) {
        const row = enrichedData[i];
        const nextLoaiHD = row ? String(row[COL_LOAI_HOP_DONG] || '').replace(/^'/, '').trim() : null;
  
        if (i === enrichedData.length || nextLoaiHD !== currentLoaiHD) {
          if (i > startIdx) {
            const tongRow = [
              '',                 // ID
              'TỔNG ' + currentLoaiHD, // Họ và tên (hiển thị TỔNG...)
              '',                 // Số TK
              '',                 // Tên NH
              0,                  // Số tiền
              '',                 // trống
              '',                 // trống
              0,                  // Số tiền 2
              '',                 // maDonVi (không cần)
              currentLoaiHD,      // Loại HĐ
              0                   // maNSNumber
            ];
  
            for (let j = startIdx; j < i; j++) {
              tongRow[4] += parseFloat(enrichedData[j][4]) || 0;
              tongRow[7] += parseFloat(enrichedData[j][7]) || 0;
            }
            tongAll4 += tongRow[4];
            tongAll7 += tongRow[7];
  
            enrichedData.splice(i, 0, tongRow);
            i++;
          }
          startIdx = i;
          currentLoaiHD = nextLoaiHD;
        }
      }
  
      // Dòng TOTAL cuối
      const totalAllRow = [
        '',             // ID
        'TỔNG CỘNG',   // Họ và tên
        '',             // Số TK
        '',             // Tên NH
        tongAll4,       // Số tiền
        '',             // trống
        '',             // trống
        tongAll7,       // Số tiền 2
        '',             // maDonVi
        '',             // Loại HĐ
        0               // maNSNumber
      ];
      enrichedData.push(totalAllRow);
    }
  
    // 9. Cắt bỏ 3 cột phụ, trả đúng 8 cột
    const finalData = enrichedData.map(row => row.slice(0, 8));
  
    Logger.log('doGet_getDataPrint_KhongThayDoi: %s dòng, output 8 cột [ID,Họ tên,SốTK,TênNH,Số tiền,, ,Số tiền2]', finalData.length);
    return finalData;*/
  // 8. Gom nhóm theo Loại Hợp Đồng (sau khi đã sort)
  const groups = new Map(); // key: loaiHD chuẩn hóa, value: { rows: [...], displayLabel: string }

  for (const row of filteredEnrichedData) {
    const loaiHD = String(row[COL_LOAI_HOP_DONG] || '').replace(/^'/, '').trim();
    const normalizedKey = loaiHD.toLowerCase() || '[Không rõ]';

    if (!groups.has(normalizedKey)) {
      groups.set(normalizedKey, {
        displayLabel: loaiHD || '[Không rõ]',
        rows: []
      });
    }
    groups.get(normalizedKey).rows.push(row);
  }

  // 9. Tạo mảng kết quả mới — bắt đầu bằng TỔNG CỘNG
  const finalEnriched = [];

  // Tính tổng toàn bộ trước để làm TỔNG CỘNG
  let tongAll4 = 0;
  let tongAll7 = 0;
  for (const group of groups.values()) {
    for (const row of group.rows) {
      tongAll4 += parseFloat(row[4]) || 0;
      tongAll7 += parseFloat(row[7]) || 0;
    }
  }

  // Thêm dòng TỔNG CỘNG ở đầu
  const totalAllRow = [
    '',             // ID
    'TỔNG CỘNG',   // Họ và tên
    '',             // Số TK
    '',             // Tên NH
    tongAll4,       // Số tiền
    '',             // trống
    '',             // trống
    tongAll7,       // Số tiền 2
    '',             // maDonVi
    '',             // Loại HĐ
    0               // maNSNumber
  ];
  finalEnriched.push(totalAllRow);

  // Duyệt từng nhóm theo thứ tự (Map giữ insertion order — vì enrichedData đã sort)
  for (const [normalizedKey, group] of groups) {
    const { displayLabel, rows } = group;

    // Tính tổng nhóm
    let tongGroup4 = 0;
    let tongGroup7 = 0;
    for (const row of rows) {
      tongGroup4 += parseFloat(row[4]) || 0;
      tongGroup7 += parseFloat(row[7]) || 0;
    }

    // Tạo dòng TỔNG <label>
    const tongRow = [
      '',                          // ID
      'TỔNG ' + (displayLabel || '...'), // Họ và tên
      '',                          // Số TK
      '',                          // Tên NH
      tongGroup4,                  // Số tiền
      '',                          // trống
      '',                          // trống
      tongGroup7,                  // Số tiền 2
      '',                          // maDonVi
      displayLabel,                // Loại HĐ (giữ nguyên để sort ổn định nếu cần)
      0                            // maNSNumber
    ];

    // Thêm dòng tổng nhóm → rồi đến các chi tiết
    finalEnriched.push(tongRow);
    finalEnriched.push(...rows);
  }

  // 10. Cắt bỏ 3 cột phụ, trả đúng 8 cột
  const finalData = finalEnriched.map(row => row.slice(0, 8));

  Logger.log('doGet_getDataPrint_%s: %s dòng, output 8 cột [ID,Họ tên,SốTK,TênNH,Số tiền,, ,Số tiền2]', logLabel || '', finalData.length);
  return finalData;
}

function doGet_xuatDebugDiNganHangL2(monthStr, regionFilter) {
  const DB_FILE_ID = '1-pKqPF-GpmoTXno1no5NN-JRIMLsHwBqGx1xdLHPgr4';
  const DEBUG_SHEET_NAME = 'DEBUG_DiNganHangL2';
  const originalData = doGet_getDataFromSheet(monthStr);

  const ss = SpreadsheetApp.openById(DB_FILE_ID);
  let sheet = ss.getSheetByName(DEBUG_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(DEBUG_SHEET_NAME);
  else {
    sheet.clear();
    if (sheet.getFilter()) sheet.getFilter().remove();
  }

  const personnelBankMap = doGet_getDataNhanSu_SoTaiKhoan();
  const dataChotNSMap = doGet_getDataChotNSThang_WithBankInfo(personnelBankMap);

  const rows = [];
  (originalData || []).forEach(row => {
    const maCB = String(row[1] || '').trim();
    if (!maCB) return;

    const keyT = monthStr + '||' + maCB;
    const fallback = personnelBankMap[maCB] || {};
    const src = dataChotNSMap[keyT] || {};
    const khuVuc = String(src.khuVuc || fallback.khuVuc || '').trim();

    if (regionFilter && regionFilter !== 'Tất cả' && khuVuc.toLowerCase() !== String(regionFilter).trim().toLowerCase()) {
      return;
    }

    const soTien = parseFloat(row[3]) || 0;
    rows.push([
      monthStr,
      khuVuc,
      maCB,
      row[2] || '',
      src.loaiHopDong || '',
      src.maDonVi || '',
      src.soTaiKhoan || fallback.soTaiKhoan || '',
      src.tenNganHang || fallback.tenNganHang || '',
      soTien,
      row[4] || 0,
      row[5] || '',
      row[6] || '',
      row[7] || '',
      row[8] || ''
    ]);
  });

  rows.sort((a, b) => String(a[1]).localeCompare(String(b[1])) || String(a[2]).localeCompare(String(b[2])));

  const headers = [
    'Kỳ lương',
    'Khu vực',
    'Mã CB',
    'Họ và tên',
    'Loại HĐ',
    'Mã đơn vị',
    'Số tài khoản',
    'Tên ngân hàng',
    'Tổng số đi ngân hàng',
    'Lương/TNTT kỳ trước',
    'Tăng',
    'Giảm',
    'Ghi chú',
    'Phân loại'
  ];

  const locationLabel = regionFilter && regionFilter !== 'Tất cả' ? regionFilter : 'Tất cả';
  sheet.getRange(1, 1).setValue('DEBUG ĐI NGÂN HÀNG L2').setFontWeight('bold');
  sheet.getRange(2, 1).setValue('Kỳ lương');
  sheet.getRange(2, 2).setValue(monthStr);
  sheet.getRange(3, 1).setValue('Khu vực lọc');
  sheet.getRange(3, 2).setValue(locationLabel);
  sheet.getRange(4, 1).setValue('Ghi chú');
  sheet.getRange(4, 2).setValue('Dữ liệu tạm phục vụ đối chiếu Bảng đi ngân hàng L2, có thêm Mã CB.');

  sheet.getRange(6, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setHorizontalAlignment('center');
  if (rows.length > 0) {
    sheet.getRange(7, 1, rows.length, headers.length).setValues(rows);
    sheet.getRange(7, 9, rows.length, 4).setNumberFormat('#,##0');
  }

  const totalRow = rows.length + 7;
  sheet.getRange(totalRow, 1).setValue('TỔNG').setFontWeight('bold');
  if (rows.length > 0) {
    sheet.getRange(totalRow, 9).setFormula(`=SUM(I7:I${totalRow - 1})`);
    sheet.getRange(totalRow, 10).setFormula(`=SUM(J7:J${totalRow - 1})`);
    sheet.getRange(totalRow, 11).setFormula(`=SUM(K7:K${totalRow - 1})`);
    sheet.getRange(totalRow, 12).setFormula(`=SUM(L7:L${totalRow - 1})`);
  } else {
    sheet.getRange(totalRow, 9, 1, 4).setValues([[0, 0, 0, 0]]);
  }
  sheet.getRange(totalRow, 1, 1, headers.length).setFontWeight('bold').setBorder(true, false, false, false, false, false);
  sheet.setFrozenRows(6);
  sheet.autoResizeColumns(1, headers.length);

  return `https://docs.google.com/spreadsheets/d/${DB_FILE_ID}/export?format=xlsx&gid=${sheet.getSheetId()}`;
}

function test_getDataFromSheet() {
  var monthStr = "T01.2025";
  var data = doGet_getDataPrint_KhongThayDoi(monthStr)
  Logger.log(data)
  if (!data || data.length === 0) return;            // không có dữ liệu thì thoát
  var rows = data.length;
  var cols = data[0].length;
  SpreadsheetApp
    .openById('1-pKqPF-GpmoTXno1no5NN-JRIMLsHwBqGx1xdLHPgr4')
    .getSheetByName('Test')
    .getRange(1, 1, rows, cols)
    .setValues(data);
}
/**
 * Ghép dữ liệu trong Database (function 1)
 * với kết quả mới tính (buildSalaryDiff) thành 1 mảng.
 * Tham số: monthStr = kỳ lương Tmm.yyyy.
 */
function doGet_taoBoSungThuyetMinh(monthStr) {
  const fromDatabase = doGet_getDataFromSheet(monthStr);      // dữ liệu cũ
  const newResult = doGet_getDataToCompare(monthStr);            // dữ liệu mới tính

  // Ghép đơn giản: dữ liệu cũ trước, dữ liệu mới sau
  const merged = [];
  if (fromDatabase && fromDatabase.length > 0) {
    merged.push.apply(merged, fromDatabase);
  }
  if (newResult && newResult.length > 0) {
    merged.push.apply(merged, newResult);
  }

  return merged;
}

function test_getDataToCompare() {
  var month = "T01.2025";
  var data = doGet_taoBoSungThuyetMinh(month);  // phải trả về [[...],[...],...]
  //var data = doGet_getDataToCompare(month)

  if (!data || data.length === 0) return;            // không có dữ liệu thì thoát
  var rows = data.length;
  var cols = data[0].length;

  SpreadsheetApp
    .openById('1-pKqPF-GpmoTXno1no5NN-JRIMLsHwBqGx1xdLHPgr4')
    .getSheetByName('Test')
    .getRange(1, 1, rows, cols)
    .setValues(data);
}

/**
 * Lấy tổng thực tế mục II. THU NHẬP TĂNG THÊM trong Tổng hợp lương
 * cho kỳ T và T-1, theo khu vực Hà Nội/Phú Thọ nếu có chọn.
 * Công thức mục II = Lương 2 + truy lĩnh/truy thu lương 2 (Còn nhận).
 */
function doGet_getTotalTNTTSums(monthStr, regionFilter) {
  const FILES = {
    DATA_LUONG_2: '13JOTPXzwsgFttd6gmKk0mCTgXqKO9R4MJICMWHLvozs',
    TRUY_THU_LUONG_2: '1rdy605GSv7R_QazPbPA7qXBEkzzqoDB0Kx-lhrAB6ew',
    MASTER_DATA: '1OH2HsnDShrkFfM-R8EJo3hwGDOsQh-e43Dmb2xaiudw'
  };

  function parseKy(kyStr) {
    const parts = String(kyStr || '').substring(1).split('.');
    return { month: parseInt(parts[0], 10), year: parseInt(parts[1], 10) };
  }

  function formatKy(month, year) {
    return 'T' + ('0' + month).slice(-2) + '.' + year;
  }

  function prevKy(kyStr) {
    const ky = parseKy(kyStr);
    let m = ky.month - 1;
    let y = ky.year;
    if (m === 0) {
      m = 12;
      y--;
    }
    return formatKy(m, y);
  }

  function normalizeKey(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .trim();
  }

  function normalizeLocation(value) {
    const key = normalizeKey(value);
    if (!key) return '';
    if (key.indexOf('ha noi') !== -1 || key === 'hn') return 'Hà Nội';
    if (key.indexOf('phu tho') !== -1 || key.indexOf('vinh phuc') !== -1 || key === 'pt' || key === 'vp') return 'Phú Thọ';
    return String(value || '').trim();
  }

  function isAllRegion(value) {
    const key = normalizeKey(value);
    return !key || key === 'all' || key === 'tat ca';
  }

  function isWantedLocation(kv, wanted) {
    return !wanted || normalizeKey(kv) === normalizeKey(wanted);
  }

  function getIdx(header, names) {
    const list = Array.isArray(names) ? names : [names];
    const normalizedHeader = (header || []).map(normalizeKey);
    for (let i = 0; i < list.length; i++) {
      const idx = normalizedHeader.indexOf(normalizeKey(list[i]));
      if (idx !== -1) return idx;
    }
    return -1;
  }

  function getCell(row, idx) {
    return idx >= 0 ? row[idx] : '';
  }

  function getData(fileId, sheetName) {
    try {
      const sh = SpreadsheetApp.openById(fileId).getSheetByName(sheetName);
      return sh ? sh.getDataRange().getValues() : [];
    } catch (e) {
      Logger.log('Lỗi đọc sheet %s: %s', sheetName, e.message);
      return [];
    }
  }

  function buildLocationMap(ky) {
    const wantedLocation = isAllRegion(regionFilter) ? '' : normalizeLocation(regionFilter);
    const map = {};

    const valuesNS = getData(FILES.MASTER_DATA, 'DataNhanSu');
    const hNS = valuesNS[0] || [];
    const idxNS = {
      MaCB: getIdx(hNS, ['Mã CB', 'Mã nhân sự']),
      KhuVuc: getIdx(hNS, 'Khu vực')
    };

    valuesNS.slice(1).forEach(row => {
      const maCB = String(getCell(row, idxNS.MaCB) || '').trim();
      if (!maCB) return;
      const kv = normalizeLocation(getCell(row, idxNS.KhuVuc));
      if (!isWantedLocation(kv, wantedLocation)) return;
      map[maCB] = kv;
    });

    const valuesChot = getSheetNSThang().getDataRange().getValues();
    const hChot = valuesChot[0] || [];
    const idxChot = {
      KyLuong: getIdx(hChot, 'Kỳ lương'),
      MaNS: getIdx(hChot, 'Mã nhân sự'),
      KhuVuc: getIdx(hChot, 'Khu vực') !== -1 ? getIdx(hChot, 'Khu vực') : 38
    };

    valuesChot.slice(1).forEach(row => {
      if (String(getCell(row, idxChot.KyLuong) || '').trim() !== ky) return;
      const maCB = String(getCell(row, idxChot.MaNS) || '').trim();
      if (!maCB) return;
      const kv = normalizeLocation(getCell(row, idxChot.KhuVuc));
      if (!isWantedLocation(kv, wantedLocation)) {
        if (map[maCB]) delete map[maCB];
        return;
      }
      map[maCB] = kv;
    });

    return { map, wantedLocation };
  }

  function getTotalTNTTForKy(ky) {
    const loc = buildLocationMap(ky);
    const valuesL2 = getData(FILES.DATA_LUONG_2, 'DataLuong2');
    const valuesTT2 = getData(FILES.TRUY_THU_LUONG_2, 'DataTruyThuLinh');
    const hL2 = valuesL2[0] || [];
    const hTT2 = valuesTT2[0] || [];
    const idxL2 = {
      KyLuong: getIdx(hL2, 'Kỳ lương'),
      MaNS: getIdx(hL2, ['Mã nhân sự', 'Mã CB', 'MaNS']),
      Luong2: getIdx(hL2, ['Lương 2', 'Tổng lương'])
    };
    const idxTT2 = {
      KyTraLuong: getIdx(hTT2, 'Kỳ trả lương'),
      MaNS: getIdx(hTT2, 'Mã nhân sự'),
      ConNhan: getIdx(hTT2, 'Còn nhận')
    };

    function allowEmployee(maCB) {
      if (!maCB) return false;
      if (!loc.wantedLocation) return true;
      return isWantedLocation(loc.map[maCB] || '', loc.wantedLocation);
    }

    let total = 0;
    let rowsL2 = 0;
    let rowsTT2 = 0;

    valuesL2.slice(1).forEach(row => {
      if (String(getCell(row, idxL2.KyLuong) || '').trim() !== ky) return;
      const maCB = String(getCell(row, idxL2.MaNS) || '').trim();
      if (!allowEmployee(maCB)) return;
      total += Number(getCell(row, idxL2.Luong2)) || 0;
      rowsL2++;
    });

    valuesTT2.slice(1).forEach(row => {
      if (String(getCell(row, idxTT2.KyTraLuong) || '').trim() !== ky) return;
      const maCB = String(getCell(row, idxTT2.MaNS) || '').trim();
      if (!allowEmployee(maCB)) return;
      total += Number(getCell(row, idxTT2.ConNhan)) || 0;
      rowsTT2++;
    });

    Logger.log(
      'Tổng TNTT mục II kỳ %s, khu vực %s: total=%s, rowsL2=%s, rowsTT2=%s',
      ky,
      loc.wantedLocation || 'Tất cả',
      total,
      rowsL2,
      rowsTT2
    );
    return total;
  }

  return {
    totalLuongT: getTotalTNTTForKy(monthStr),
    totalLuongT1: getTotalTNTTForKy(prevKy(monthStr))
  };
}

// ========== CONFIG THUYẾT MINH L2 — ĐỌC/GHI 4 DÒNG NHẬP TAY ==========

/**
 * Đọc 4 dòng config từ sheet ConfigThuyetMinhL2 theo kỳ lương.
 * Sheet cấu trúc: [Kỳ lương, Label1, Value1, Label2, Value2, Label3, Value3, Label4, Value4]
 * @param {string} monthStr Kỳ lương (VD: "T02.2026")
 * @returns {Array} Mảng 4 phần tử: [{label, value}, {label, value}, ...]
 */
function doGet_loadConfigThuyetMinhL2(monthStr) {
  const FILE_ID = '1-pKqPF-GpmoTXno1no5NN-JRIMLsHwBqGx1xdLHPgr4';
  const SHEET_NAME = 'ConfigThuyetMinhL2';

  const emptyResult = [
    { label: '', value: '' },
    { label: '', value: '' },
    { label: '', value: '' },
    { label: '', value: '' }
  ];

  try {
    const ss = SpreadsheetApp.openById(FILE_ID);
    const sh = ss.getSheetByName(SHEET_NAME);

    if (!sh) {
      Logger.log('Sheet ConfigThuyetMinhL2 không tồn tại');
      return emptyResult;
    }

    const lastRow = sh.getLastRow();
    if (lastRow < 2) return emptyResult;

    const data = sh.getRange(2, 1, lastRow - 1, 9).getValues();

    for (const row of data) {
      const ky = String(row[0]).trim();
      if (ky === monthStr) {
        return [
          { label: String(row[1] || ''), value: String(row[2] || '') },
          { label: String(row[3] || ''), value: String(row[4] || '') },
          { label: String(row[5] || ''), value: String(row[6] || '') },
          { label: String(row[7] || ''), value: String(row[8] || '') }
        ];
      }
    }

    return emptyResult;
  } catch (e) {
    Logger.log('Lỗi đọc ConfigThuyetMinhL2: %s', e.message);
    return emptyResult;
  }
}

/**
 * Ghi 4 dòng config vào sheet ConfigThuyetMinhL2 theo kỳ lương.
 * Nếu kỳ lương đã tồn tại → ghi đè. Nếu chưa → thêm mới.
 * @param {string} monthStr Kỳ lương
 * @param {Array} configLines Mảng 4 phần tử [{label, value}, ...]
 * @returns {string} 'Success' hoặc lỗi
 */
function doGet_saveConfigThuyetMinhL2(monthStr, configLines) {
  const FILE_ID = '1-pKqPF-GpmoTXno1no5NN-JRIMLsHwBqGx1xdLHPgr4';
  const SHEET_NAME = 'ConfigThuyetMinhL2';

  try {
    const ss = SpreadsheetApp.openById(FILE_ID);
    let sh = ss.getSheetByName(SHEET_NAME);

    if (!sh) {
      sh = ss.insertSheet(SHEET_NAME);
      sh.getRange(1, 1, 1, 9).setValues([
        ['Kỳ lương', 'Label1', 'Value1', 'Label2', 'Value2', 'Label3', 'Value3', 'Label4', 'Value4']
      ]);
    }

    const newRow = [
      monthStr,
      configLines[0]?.label || '', configLines[0]?.value || '',
      configLines[1]?.label || '', configLines[1]?.value || '',
      configLines[2]?.label || '', configLines[2]?.value || '',
      configLines[3]?.label || '', configLines[3]?.value || ''
    ];

    const lastRow = sh.getLastRow();
    if (lastRow >= 2) {
      const kyCol = sh.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < kyCol.length; i++) {
        if (String(kyCol[i][0]).trim() === monthStr) {
          sh.getRange(i + 2, 1, 1, 9).setValues([newRow]);
          Logger.log('ConfigThuyetMinhL2: Ghi đè kỳ %s tại dòng %s', monthStr, i + 2);
          return 'Success';
        }
      }
    }

    sh.appendRow(newRow);
    Logger.log('ConfigThuyetMinhL2: Thêm mới kỳ %s', monthStr);
    return 'Success';

  } catch (e) {
    Logger.log('Lỗi ghi ConfigThuyetMinhL2: %s', e.message);
    return 'Error: ' + e.message;
  }
}
