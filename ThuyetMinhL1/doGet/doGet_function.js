/**
 * Hàm chính: truyền vào kỳ T dạng "Tmm.yyyy" (ví dụ "T01.2025")
 * Trả về mảng 2D:
 * [ [ID, Kỳ lương, Mã CB, Họ và tên, Lương và truy lĩnh, Lương và truy lĩnh kỳ trước, Tăng, Giảm, Ghi chú], ... ]
 */
function doGet_getDataToCompare(kyTStr) {
  // ====== CONFIG ======
  const FILE1_ID = '1j6q9n5TlbW9cPa-ixfn5H_YtUNP_DHLqNLbY4iI9yWQ';      // TODO: thay ID file 1
  const FILE2_ID = '1dHZ9b5SlTn9fqHq0ZR8yrlJYcA44hhbnlHc3OHm6uW0';      // TODO: thay ID file 2
  const SHEET1_NAME = 'DataLuong1';
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

  // Kỳ T và T-1
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

  // Map index cột FILE 1 theo header bạn cung cấp
  const idx1 = {
    ID: header1.indexOf('ID'),
    KyLuong: header1.indexOf('Kỳ lương'),
    MaNS: header1.indexOf('Mã CB'),
    HoTen: header1.indexOf('Họ và tên'),
    LoaiHD: header1.indexOf('Loại HĐ'),
    DonVi: header1.indexOf('Đơn vị'),
    MaNgach: header1.indexOf('Mã ngạch'),
    HSBac: header1.indexOf('HS bậc'),
    HSBacBL: header1.indexOf('HS bậc BL'),
    HSChucVu: header1.indexOf('HS chức vụ'),
    //TLVuotKhung: header1.indexOf('TL vượt khung'),
    HSVuotKhung: header1.indexOf('HS vượt khung'),
    //TLNganh: header1.indexOf('TL ngành'),
    HSNganh: header1.indexOf('HS ngành'),
    TLThamNien: header1.indexOf('TL thâm niên'),
    HSThamNien: header1.indexOf('HS thâm niên'),
    HSDocHai: header1.indexOf('HS độc hại'),
    HSTrachNhiem: header1.indexOf('HS trách nhiệm'),
    HSTuVe: header1.indexOf('HS tự vệ'),
    TongHeSo: header1.indexOf('Tổng hệ số'),
    TongLuong: header1.indexOf('Tổng lương'),
    BHXH: header1.indexOf('BHXH'),
    BHYT: header1.indexOf('BHYT'),
    BHTN: header1.indexOf('BHTN'),
    KPCD: header1.indexOf('KPCĐ'),
    NuocNgoai: header1.indexOf('Nước ngoài'),
    NghiBHXH: header1.indexOf('Nghỉ BHXH'),
    TruKhac: header1.indexOf('Trừ khác'),
    TongGiamTru: header1.indexOf('Tổng giảm trừ'),
    TongLuong1: header1.indexOf('Tổng lương 1'),
    LuongCD: header1.indexOf('Lương CĐ')
  };
  Logger.log('Index cột file1: %s', JSON.stringify(idx1));

  // Chọn "tổng lương" để so sánh (ở bản cũ là "Lương 2")
  // Bạn có thể thay bằng 'TongLuong1' hoặc cột khác nếu muốn
  const COL_TONG_LUONG_FILE1 = idx1.TongLuong1 >= 0 ? idx1.TongLuong1 : idx1.TongLuong;

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

    const luong2 = Number(r[COL_TONG_LUONG_FILE1]) || 0;
    if (!mapLuong2[key]) {
      mapLuong2[key] = {
        totalLuong2: 0,
        byComponent: {
          'HS bậc': 0,
          'HS bậc BL': 0,
          'HS chức vụ': 0,
          'TL vượt khung': 0,
          'HS vượt khung': 0,
          'TL ngành': 0,
          'HS ngành': 0,
          'TL thâm niên': 0,
          'HS thâm niên': 0,
          'HS độc hại': 0,
          'HS trách nhiệm': 0,
          'HS tự vệ': 0,
          'Tổng hệ số': 0,
          'Tổng lương': 0,
          'BHXH': 0,
          'BHYT': 0,
          'BHTN': 0,
          'KPCĐ': 0,
          'Nước ngoài': 0,
          'Nghỉ BHXH': 0,
          'Trừ khác': 0,
          'Tổng giảm trừ': 0,
          'Tổng lương 1': 0,
          'Lương CĐ': 0
        },
        hoTen: r[idx1.HoTen],
        maCB: ma,
        kyStr: ky,
        ID: r[idx1.ID]
      };
    }
    const obj = mapLuong2[key];
    obj.totalLuong2 += luong2;

    // Gán từng thành phần (nếu cột tồn tại)
    obj.byComponent['HS bậc'] += Number(r[idx1.HSBac]) || 0;
    obj.byComponent['HS bậc BL'] += Number(r[idx1.HSBacBL]) || 0;
    obj.byComponent['HS chức vụ'] += Number(r[idx1.HSChucVu]) || 0;
    obj.byComponent['TL vượt khung'] += Number(r[idx1.TLVuotKhung]) || 0;
    obj.byComponent['HS vượt khung'] += Number(r[idx1.HSVuotKhung]) || 0;
    obj.byComponent['TL ngành'] += Number(r[idx1.TLNganh]) || 0;
    obj.byComponent['HS ngành'] += Number(r[idx1.HSNganh]) || 0;
    obj.byComponent['TL thâm niên'] += Number(r[idx1.TLThamNien]) || 0;
    obj.byComponent['HS thâm niên'] += Number(r[idx1.HSThamNien]) || 0;
    obj.byComponent['HS độc hại'] += Number(r[idx1.HSDocHai]) || 0;
    obj.byComponent['HS trách nhiệm'] += Number(r[idx1.HSTrachNhiem]) || 0;
    obj.byComponent['HS tự vệ'] += Number(r[idx1.HSTuVe]) || 0;
    obj.byComponent['Tổng hệ số'] += Number(r[idx1.TongHeSo]) || 0;
    obj.byComponent['Tổng lương'] += Number(r[idx1.TongLuong]) || 0;
    obj.byComponent['BHXH'] += Number(r[idx1.BHXH]) || 0;
    obj.byComponent['BHYT'] += Number(r[idx1.BHYT]) || 0;
    obj.byComponent['BHTN'] += Number(r[idx1.BHTN]) || 0;
    obj.byComponent['KPCĐ'] += Number(r[idx1.KPCD]) || 0;
    obj.byComponent['Nước ngoài'] += Number(r[idx1.NuocNgoai]) || 0;
    obj.byComponent['Nghỉ BHXH'] += Number(r[idx1.NghiBHXH]) || 0;
    obj.byComponent['Trừ khác'] += Number(r[idx1.TruKhac]) || 0;
    obj.byComponent['Tổng giảm trừ'] += Number(r[idx1.TongGiamTru]) || 0;
    obj.byComponent['Tổng lương 1'] += Number(r[idx1.TongLuong1]) || 0;
    obj.byComponent['Lương CĐ'] += Number(r[idx1.LuongCD]) || 0;
  });

  Logger.log(
    'File1: tổng dòng duyệt: %s, sau lọc 2 kỳ: %s, số key trong mapLuong2: %s',
    cntF1All, cntF1Filtered, Object.keys(mapLuong2).length
  );

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

  // Map index cột FILE 2 theo header bạn cung cấp
  const idx2 = {
    ID: header2.indexOf('ID'),
    SoQD: header2.indexOf('Số quyết định'),
    KyTraLuong: header2.indexOf('Kỳ trả lương'),
    KyLuong: header2.indexOf('Kỳ lương'),
    MaNS: header2.indexOf('Mã nhân sự'),
    HoTen: header2.indexOf('Họ và tên'),
    MaNgachBac: header2.indexOf('Mã ngạch bậc'),
    LoaiHD: header2.indexOf('Loại hợp đồng'),
    TenDonVi: header2.indexOf('Tên đơn vị'),
    NgayCongTT: header2.indexOf('Ngày công thực tế'),
    HSBacCu: header2.indexOf('Hs bậc cũ'),
    HSBacMoi: header2.indexOf('Hs bậc mới'),
    HSBacTT: header2.indexOf('Hs bậc thành tiền'),
    HSChucVuCu: header2.indexOf('HS PC chức vụ cũ'),
    HSChucVuMoi: header2.indexOf('HS PC chức vụ mới'),
    HSChucVuTT: header2.indexOf('HS PC chức vụ thành tiền'),
    HSVuotKhungCu: header2.indexOf('HS PC vượt khung cũ'),
    HSVuotKhungMoi: header2.indexOf('HS PC vượt khung mới'),
    HSVuotKhungTT: header2.indexOf('HS PC vượt khung thành tiền'),
    HSNganhCu: header2.indexOf('HS PC ngành cũ'),
    HSNganhMoi: header2.indexOf('HS PC ngành mới'),
    HSNganhTT: header2.indexOf('HS PC ngành thành tiền'),
    HSThamNienCu: header2.indexOf('HS PC thâm niên cũ'),
    HSThamNienMoi: header2.indexOf('HS PC thâm niên mới'),
    HSThamNienTT: header2.indexOf('HS PC thâm niên thành tiền'),
    HSTrachNhiemCu: header2.indexOf('HS PC trách nhiệm cũ'),
    HSTrachNhiemMoi: header2.indexOf('HS PC trách nhiệm mới'),
    HSTrachNhiemTT: header2.indexOf('HS PC trách nhiệm thành tiền'),
    DiNNVe: header2.indexOf('Đi NN về'),
    BHXH: header2.indexOf('BHXH'),
    BHYT: header2.indexOf('BHYT'),
    BHTN: header2.indexOf('BHTN'),
    KPCD: header2.indexOf('KPCĐ'),
    ConNhan: header2.indexOf('Còn nhận'),
    GhiChu: header2.indexOf('Ghi chú')
  };
  Logger.log('Index cột file2: %s', JSON.stringify(idx2));

  const mapTruyThu = {};
  let cntF2All = 0, cntF2Filtered = 0;

  data2.forEach(r => {
    cntF2All++;
    const ky = String(r[idx2.KyTraLuong]).trim(); // vẫn dùng "Kỳ trả lương" để lọc
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
          'Hs bậc thành tiền': 0,
          'HS PC chức vụ thành tiền': 0,
          'HS PC vượt khung thành tiền': 0,
          'HS PC ngành thành tiền': 0,
          'HS PC thâm niên thành tiền': 0,
          'HS PC trách nhiệm thành tiền': 0,
          'BHXH': 0,
          'BHYT': 0,
          'BHTN': 0,
          'KPCĐ': 0
        },
        hoTen: r[idx2.HoTen],
        maCB: ma,
        kyStr: ky
      };
    }
    const obj = mapTruyThu[key];
    obj.totalConNhan += conNhan;

    obj.byComponent['Hs bậc thành tiền'] += Number(r[idx2.HSBacTT]) || 0;
    obj.byComponent['HS PC chức vụ thành tiền'] += Number(r[idx2.HSChucVuTT]) || 0;
    obj.byComponent['HS PC vượt khung thành tiền'] += Number(r[idx2.HSVuotKhungTT]) || 0;
    obj.byComponent['HS PC ngành thành tiền'] += Number(r[idx2.HSNganhTT]) || 0;
    obj.byComponent['HS PC thâm niên thành tiền'] += Number(r[idx2.HSThamNienTT]) || 0;
    obj.byComponent['HS PC trách nhiệm thành tiền'] += Number(r[idx2.HSTrachNhiemTT]) || 0;
    obj.byComponent['BHXH'] += Number(r[idx2.BHXH]) || 0;
    obj.byComponent['BHYT'] += Number(r[idx2.BHYT]) || 0;
    obj.byComponent['BHTN'] += Number(r[idx2.BHTN]) || 0;
    obj.byComponent['KPCĐ'] += Number(r[idx2.KPCD]) || 0;
  });

  Logger.log(
    'File2: tổng dòng duyệt: %s, sau lọc 2 kỳ: %s, số key trong mapTruyThu: %s',
    cntF2All, cntF2Filtered, Object.keys(mapTruyThu).length
  );

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

  // Chuẩn bị chuỗi thời gian chung để sinh ID (nếu cần dùng sau)
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

    // Nếu không có thì coi như 0
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

    // Bỏ qua trường hợp cả hai đều 0
    if (luongT === 0 && luongT1 === 0) return;

    let tang = '';
    let giam = '';
    if (diff > 0) tang = diff;
    else if (diff < 0) giam = Math.abs(diff);

    // ====== GHI CHÚ ======
    let ghiChu = '';
    if (diff !== 0) {
      const noteParts = [];

      // Các thành phần của FILE 1 dùng để soi chi tiết
      const f1Headers = [
        'HS bậc',
        'HS bậc BL',
        'HS chức vụ',
        //'TL vượt khung',
        'HS vượt khung',
        //'TL ngành',
        'HS ngành',
        //'TL thâm niên',
        'HS thâm niên',
        'HS độc hại',
        'HS trách nhiệm',
        'HS tự vệ',
        //'Tổng hệ số',
        //'Tổng lương',
        'BHXH',
        'BHYT',
        'BHTN',
        'KPCĐ',
        'Nước ngoài',
        'Nghỉ BHXH',
        'Trừ khác',
        //'Tổng giảm trừ',
        //'Tổng lương 1',
        'Lương CĐ'
      ];
      f1Headers.forEach(h => {
        const valT = (recT.byComponentLuong2 && Number(recT.byComponentLuong2[h])) || 0;
        const valT1_ = (recT1.byComponentLuong2 && Number(recT1.byComponentLuong2[h])) || 0;
        if (valT - valT1_ !== 0) noteParts.push(h);
      });

      // Các thành phần của FILE 2 dùng để soi chi tiết
      const f2Headers = [
        'Hs bậc thành tiền',
        'HS PC chức vụ thành tiền',
        'HS PC vượt khung thành tiền',
        'HS PC ngành thành tiền',
        'HS PC thâm niên thành tiền',
        'HS PC trách nhiệm thành tiền',
        'BHXH',
        'BHYT',
        'BHTN',
        'KPCĐ'
      ];
      f2Headers.forEach(h => {
        let noteText = h;
        if (h.includes('thành tiền')) {
          noteText = h.replace(/thành tiền$/i, 'truy thu, truy lĩnh');
        } else {
          noteText = `${h} truy thu, truy lĩnh`;
        }
        const valT = (recT.byComponentTruyThu && Number(recT.byComponentTruyThu[h])) || 0;
        const valT1_ = (recT1.byComponentTruyThu && Number(recT1.byComponentTruyThu[h])) || 0;
        if (valT - valT1_ !== 0) noteParts.push(noteText);
      });

      if (noteParts.length > 0) ghiChu = noteParts.join('; ');
    }

    // ====== PHÂN LOẠI ======
    const phanLoai = (diff !== 0) ? 'Có thay đổi' : 'Không thay đổi';

    const row = [
      "",                                  // ID tự sinh (đang để trống)
      maCB,                                // Mã CB
      recT.hoTen || recT1.hoTen || '',     // Họ và tên
      luongT,                              // Lương và truy lĩnh kỳ T (tổng)
      luongT1,                             // Lương và truy lĩnh kỳ trước
      tang,                                // Tăng
      giam,                                // Giảm
      ghiChu,                              // Ghi chú
      phanLoai                             // Phân loại
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
  const DB_SHEET_NAME = 'DatabaseL1';

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
  const DB_SHEET_NAME = 'DatabaseL1';

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
  const DB_SHEET_NAME = 'DatabaseL1';

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
  let values;
  try {
    const response = Sheets.Spreadsheets.Values.get(idFileChotNhanSuThang, 'DataChotNSThang', {
      valueRenderOption: 'FORMATTED_VALUE'
    });
    values = response.values;
  } catch (e) {
    Logger.log('Lỗi khi dùng Sheets API cho DataChotNSThang: %s. Fallback dùng SpreadsheetApp.', e.message);
    const sh = getSheetNSThang();
    values = sh.getDataRange().getValues();
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

function doGet_getDataChotNSThang_WithBankInfo() {
  // Load thông tin ngân hàng từ Master Data trước
  const bankMap = doGet_getDataNhanSu_SoTaiKhoan();

  // Load DataChotNSThang
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
    KhuVuc: header1.indexOf('Khu vực') !== -1 ? header1.indexOf('Khu vực') : 38
  };

  if (idx1.KyLuong === -1 || idx1.MaNS === -1 || idx1.MaDonVi === -1 || idx1.LoaiHopDong === -1) {
    Logger.log('Cảnh báo: Thiếu cột cần thiết trong DataChotNSThang');
    return {};
  }

  // Xử lý DataChotNSThang
  const map = {};
  data1.forEach(r => {
    const kyLuong = String(r[idx1.KyLuong] || '').trim();
    const maNS = String(r[idx1.MaNS] || '').trim();
    const maDonVi = String(r[idx1.MaDonVi] || '').trim();
    const loaiHopDong = String(r[idx1.LoaiHopDong] || '').trim();

    if (!kyLuong || !maNS) return;

    const key = kyLuong + '||' + maNS;
    const baseData = {
      kyLuong: kyLuong,
      maNS: maNS,
      maDonVi: maDonVi,
      loaiHopDong: loaiHopDong,
      hoTen: r[idx1.HoTen] || '',
      khuVuc: String(r[idx1.KhuVuc] || '').trim(),
      soTaiKhoan: '',
      tenNganHang: ''
    };

    // ƯU TIÊN 1: Lấy từ Master Data (bankMap đã load ở trên)
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

    map[key] = baseData;
  });

  Logger.log('doGet_getDataChotNSThang_WithBankInfo: Đã load %s records, trong đó %s records có thông tin TK ngân hàng',
    Object.keys(map).length, Object.values(map).filter(item => item.soTaiKhoan).length);

  return map;
}

/**LẤY SỐ TÀI KHOẢN - đọc từ DataChotNSThang */
function doGet_getDataNhanSu_SoTaiKhoan() {
  let values;
  try {
    const response = Sheets.Spreadsheets.Values.get(idFileData, 'DataNhanSu', {
      valueRenderOption: 'FORMATTED_VALUE'
    });
    values = response.values;
  } catch (e) {
    Logger.log('Lỗi khi dùng Sheets API cho DataNhanSu: %s. Fallback dùng SpreadsheetApp.', e.message);
    const sh = getSheetNhanSu();
    values = sh.getDataRange().getValues();
  }

  if (!values || values.length < 2) return {};

  const header = values[0];
  const data = values.slice(1);

  const idx = {
    MaNS: header.indexOf('Mã nhân sự') !== -1 ? header.indexOf('Mã nhân sự') : 0,
    SoTaiKhoan: header.indexOf('Số tài khoản')
  };

  if (idx.SoTaiKhoan === -1) {
    Logger.log('Cảnh báo: Không tìm thấy cột "Số tài khoản" trong DataNhanSu. Các cột có sẵn: %s',
      header.filter(h => h).join(', '));
    return {};
  }

  const map = {};
  data.forEach(row => {
    const maCB = String(row[idx.MaNS] || '').trim();
    const soTaiKhoan = String(row[idx.SoTaiKhoan] || '').trim();

    if (!maCB || !soTaiKhoan) return;

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
      tenNganHang: tenNganHang
    };
  });

  Logger.log('doGet_getDataNhanSu_SoTaiKhoan: Đã load %s records', Object.keys(map).length);
  return map; // trả về dạng Map với key là mã CB
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

  function getPrevKy(kyStr) {
    const ky = parseKy(kyStr);
    let m = ky.month - 1;
    let y = ky.year;
    if (m === 0) {
      m = 12;
      y--;
    }
    return formatKy(m, y);
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

  // --- Thêm 3 cột phụ: [ ...row, maDonVi, maNSNumber, khuVuc ] ---
  const enrichedData = originalData.map(row => {
    // row: [ID, Mã CB, Họ và tên, ...]
    const maCBRaw = String(row[1] || '').trim(); // Mã nhân sự gốc, ví dụ: "CB00123"

    // Lấy Mã đơn vị & Khu vực từ map
    const keyT = monthStr + '||' + maCBRaw;
    const keyT1 = monthStrT1 + '||' + maCBRaw;

    let maDonVi = '';
    let khuVuc = '';
    const src = dataChotNSMap[keyT] || dataChotNSMap[keyT1];
    if (src) {
      maDonVi = src.maDonVi || '';
      khuVuc = src.khuVuc || '';
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
      return rowKhuVuc.toLowerCase().trim() === regionFilter.toLowerCase().trim();
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


  // --- Xóa 3 cột phụ: Mã đơn vị, Mã NS number và Khu vực ---
  const finalData = filteredEnrichedData.map(row => row.slice(0, 9)); // DatabaseL1 có 9 cột chính

  Logger.log('doGet_getDataPrint_CoThayDoi: Đã xử lý %s dòng sau lọc %s.', finalData.length, regionFilter);
  return finalData;
}

function doGet_getDataPrint_KhongThayDoi(monthStr, regionFilter) {
  // 1. Lấy dữ liệu gốc
  const originalData = doGet_getDataKhongThayDoi_FromSheet(monthStr);
  return doGet_buildDataPrint_DiNganHang(originalData, monthStr, regionFilter, 'KhongThayDoi');
}

function doGet_getDataPrint_DiNganHang(monthStr, regionFilter) {
  // Bảng đi ngân hàng phải lấy toàn bộ thực lĩnh L1 của kỳ, gồm cả Có thay đổi và Không thay đổi.
  const originalData = doGet_getDataFromSheet(monthStr);
  return doGet_buildDataPrint_DiNganHang(originalData, monthStr, regionFilter, 'DiNganHang');
}

function doGet_buildDataPrint_DiNganHang(originalData, monthStr, regionFilter, logLabel) {
  if (!originalData || originalData.length === 0) {
    Logger.log('Không có dữ liệu từ doGet_getDataFromSheet cho kỳ: %s', monthStr);
    return [];
  }

  // 2. Lấy map DataChotNSThang, đã kèm Số TK, Tên NH
  const dataChotNSMap = doGet_getDataChotNSThang_WithBankInfo();

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

  // === MỚI: Đọc DataLuong1 để lấy hệ số phụ cấp ===
  const FILE1_ID_LUONG = '1j6q9n5TlbW9cPa-ixfn5H_YtUNP_DHLqNLbY4iI9yWQ';
  const SHEET1_LUONG = 'DataLuong1';
  const LUONG_CO_SO = 2340000; // Lương cơ sở (hardcode)

  const mapHeSo = {};
  try {
    let valuesLuong;
    try {
      const response = Sheets.Spreadsheets.Values.get(FILE1_ID_LUONG, SHEET1_LUONG, {
        valueRenderOption: 'UNFORMATTED_VALUE'
      });
      valuesLuong = response.values;
    } catch (apiErr) {
      Logger.log('Lỗi khi dùng Sheets API cho DataLuong1: %s. Fallback dùng SpreadsheetApp.', apiErr.message);
      const ss1 = SpreadsheetApp.openById(FILE1_ID_LUONG);
      const sh1 = ss1.getSheetByName(SHEET1_LUONG);
      valuesLuong = sh1.getDataRange().getValues();
    }

    if (valuesLuong && valuesLuong.length >= 2) {
      const headerL = valuesLuong[0];
      const dataL = valuesLuong.slice(1);
      const idxL = {
        KyLuong: headerL.indexOf('Kỳ lương'),
        MaNS: headerL.indexOf('Mã CB'),
        HSNganh: headerL.indexOf('HS ngành'),
        HSDocHai: headerL.indexOf('HS độc hại'),
        HSTrachNhiem: headerL.indexOf('HS trách nhiệm'),
        KPCD: headerL.indexOf('KPCĐ')
      };

      Logger.log('Index cột DataLuong1 cho PC: %s', JSON.stringify(idxL));

      const parseHS = (val) => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
          // Xử lý trường hợp chuỗi dùng dấu phẩy cho thập phân (VD: "1,499")
          let s = val.replace(',', '.');
          return parseFloat(s) || 0;
        }
        return 0;
      };

      dataL.forEach(r => {
        const ky = String(r[idxL.KyLuong]).trim();
        if (ky !== monthStr && ky !== monthStrT1) return;
        const ma = String(r[idxL.MaNS]).trim();
        if (!ma) return;
        const key = ky + '||' + ma;

        if (!mapHeSo[key]) {
          mapHeSo[key] = { pcNganh: 0, pcDocHai: 0, pcTrachNhiem: 0, kpcd: 0 };
        }
        mapHeSo[key].pcNganh += parseHS(r[idxL.HSNganh]) * LUONG_CO_SO;
        mapHeSo[key].pcDocHai += parseHS(r[idxL.HSDocHai]) * LUONG_CO_SO;
        mapHeSo[key].pcTrachNhiem += parseHS(r[idxL.HSTrachNhiem]) * LUONG_CO_SO;
        mapHeSo[key].kpcd += parseHS(r[idxL.KPCD]);
      });

      Logger.log('mapHeSo: Đã load %s records từ DataLuong1', Object.keys(mapHeSo).length);
    }
  } catch (e) {
    Logger.log('Lỗi khi đọc DataLuong1 cho hệ số PC: %s', e.message);
  }

  // 4. Định nghĩa index cột trong originalData
  const COL_ID = 0;  // ID
  const COL_MA_CB = 1;  // Mã CB
  const COL_HO_TEN = 2;  // Họ và tên
  const COL_SO_TIEN = 3;  // Số tiền

  // 5. Tạo enrichedData: 14 cột output + 3 cột phụ = 17 cột + 1 cột khu vực = 18 cột
  const enrichedData = originalData.map(row => {
    const maCBRaw = String(row[COL_MA_CB] || '').trim();

    // Khóa tra map: T||MaCB hoặc T-1||MaCB
    const keyT = monthStr + '||' + maCBRaw;
    const keyT1 = monthStrT1 + '||' + maCBRaw;

    let maDonVi = '';
    let loaiHopDong = '';
    let soTaiKhoan = '';
    let tenNganHang = '';
    let khuVuc = '';

    const src = dataChotNSMap[keyT] || dataChotNSMap[keyT1];
    if (src) {
      maDonVi = src.maDonVi || '';
      loaiHopDong = src.loaiHopDong || '';
      soTaiKhoan = src.soTaiKhoan || '';
      tenNganHang = src.tenNganHang || '';
      khuVuc = src.khuVuc || '';
    }

    // Ép chắc chắn số TK là text (thêm ' để tránh Sheets tự đổi format)
    const safeSoTK = soTaiKhoan ? "'" + String(soTaiKhoan) : '';
    const safeTenNH = tenNganHang ? String(tenNganHang) : '';

    const soTien = parseFloat(row[COL_SO_TIEN]) || 0;

    // === MỚI: Lấy hệ số phụ cấp từ mapHeSo ===
    const heSo = mapHeSo[keyT] || mapHeSo[keyT1] || { pcNganh: 0, pcDocHai: 0, pcTrachNhiem: 0, kpcd: 0 };
    const pcNganh = heSo.pcNganh;
    const pcDocHai = heSo.pcDocHai;
    const pcTrachNhiem = heSo.pcTrachNhiem;
    const dDoan = heSo.kpcd; // Đ.Đoàn = KPCĐ
    const tongPC = pcNganh + pcDocHai + pcTrachNhiem;

    // === MỚI: Phân loại theo loại HĐ (case-insensitive) ===
    const isBienChe = loaiHopDong.toLowerCase().includes('biên chế');
    const luongPC = isBienChe ? (soTien - tongPC) : 0;  // Cột (5): cho biên chế
    const tienCongLD = !isBienChe ? (soTien - tongPC) : 0; // Cột (6): cho HĐ khác

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
      soTien,          // 4: Tổng số
      luongPC,         // 5: Lương & PC theo lương (biên chế)
      tienCongLD,      // 6: Tiền công LĐ TX theo HĐ (HĐ khác)
      pcNganh,         // 7: PC Ngành
      pcDocHai,        // 8: PC Đ.hại
      pcTrachNhiem,    // 9: PC T.Nhiệm
      '',              // 10: Đ.Đoàn (Bỏ trống theo yêu cầu User)
      '',              // 11: Tiền khoán (trống)
      '',              // 12: Tiền học bổng (trống)
      '',              // 13: Ghi chú (trống)
      maDonVi,         // 14: phụ sort
      loaiHopDong,     // 15: phụ sort
      maNSNumber,      // 16: phụ sort
      khuVuc           // 17: lọc vùng
    ];
  });

  // --- Lọc theo Khu vực nếu có yêu cầu ---
  let filteredEnrichedData = enrichedData;
  if (regionFilter && regionFilter !== 'Tất cả') {
    filteredEnrichedData = enrichedData.filter(row => {
      const rowKhuVuc = String(row[17] || '').trim();
      return rowKhuVuc.toLowerCase().trim() === regionFilter.toLowerCase().trim();
    });
  }

  if (filteredEnrichedData.length === 0) {
    Logger.log('Sau khi lọc theo Khu vực "%s", không có dữ liệu cho kỳ: %s', regionFilter, monthStr);
    return [];
  }

  // 6. Cột phụ (index đã cập nhật)
  const COL_MA_DON_VI = 14;
  const COL_LOAI_HOP_DONG = 15;
  const COL_MA_NS_NUM = 16;

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

  // Hàm helper tính tổng các cột số (4→10) cho một danh sách dòng
  function sumColumns(rowList) {
    const sums = { col4: 0, col5: 0, col6: 0, col7: 0, col8: 0, col9: 0, col10: 0 };
    for (const row of rowList) {
      sums.col4 += parseFloat(row[4]) || 0;
      sums.col5 += parseFloat(row[5]) || 0;
      sums.col6 += parseFloat(row[6]) || 0;
      sums.col7 += parseFloat(row[7]) || 0;
      sums.col8 += parseFloat(row[8]) || 0;
      sums.col9 += parseFloat(row[9]) || 0;
      sums.col10 += parseFloat(row[10]) || 0;
    }
    return sums;
  }

  // Hàm tạo dòng tổng (17 cột)
  function createTotalRow(label, sums, displayLabel) {
    return [
      '',             // 0: ID
      label,          // 1: Họ và tên (label tổng)
      '',             // 2: Số TK
      '',             // 3: Tên NH
      sums.col4,      // 4: Tổng số
      sums.col5,      // 5: Lương & PC
      sums.col6,      // 6: Tiền công LĐ
      sums.col7,      // 7: PC Ngành
      sums.col8,      // 8: PC Đ.hại
      sums.col9,      // 9: PC T.Nhiệm
      sums.col10,     // 10: Đ.Đoàn
      '',             // 11: Tiền khoán
      '',             // 12: Tiền học bổng
      '',             // 13: Ghi chú
      '',             // 14: maDonVi (aux)
      displayLabel || '', // 15: Loại HĐ (aux)
      0               // 16: maNSNumber (aux)
    ];
  }

  // Tính tổng toàn bộ trước để làm TỔNG CỘNG
  const allRows = [];
  for (const group of groups.values()) {
    allRows.push(...group.rows);
  }
  const sumsAll = sumColumns(allRows);

  // Thêm dòng TỔNG CỘNG ở đầu
  finalEnriched.push(createTotalRow('TỔNG CỘNG', sumsAll, ''));

  // Duyệt từng nhóm theo thứ tự (Map giữ insertion order — vì enrichedData đã sort)
  for (const [normalizedKey, group] of groups) {
    const { displayLabel, rows } = group;

    // Tính tổng nhóm
    const sumsGroup = sumColumns(rows);

    // Thêm dòng tổng nhóm → rồi đến các chi tiết
    finalEnriched.push(createTotalRow('TỔNG ' + (displayLabel || '...'), sumsGroup, displayLabel));
    finalEnriched.push(...rows);
  }

  // 10. Cắt bỏ 3 cột phụ, trả đúng 14 cột
  const finalData = finalEnriched.map(row => row.slice(0, 14));

  Logger.log('doGet_getDataPrint_%s: %s dòng, output 14 cột [ID,Họ tên,SốTK,TênNH,TổngSố,LươngPC,TiềnCôngLĐ,PCNgành,PCĐHại,PCTNhiệm,ĐĐoàn,Khoán,HọcBổng,GhiChú]', logLabel || '', finalData.length);
  return finalData;
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
  var month = "T02.2025";
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


// ========== CONFIG THUYẾT MINH L1 — ĐỌC/GHI 4 DÒNG NHẬP TAY ==========

/**
 * Đọc 4 dòng config từ sheet ConfigThuyetMinhL1 theo kỳ lương.
 * Sheet cấu trúc: [Kỳ lương, Label1, Value1, Label2, Value2, Label3, Value3, Label4, Value4]
 * @param {string} monthStr Kỳ lương (VD: "T02.2026")
 * @returns {Array} Mảng 4 phần tử: [{label, value}, {label, value}, ...]
 */
function doGet_loadConfigThuyetMinhL1(monthStr) {
  const FILE_ID = '1-pKqPF-GpmoTXno1no5NN-JRIMLsHwBqGx1xdLHPgr4';
  const SHEET_NAME = 'ConfigThuyetMinhL1';

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
      Logger.log('Sheet ConfigThuyetMinhL1 không tồn tại');
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
    Logger.log('Lỗi đọc ConfigThuyetMinhL1: %s', e.message);
    return emptyResult;
  }
}


/**
 * Ghi 4 dòng config vào sheet ConfigThuyetMinhL1 theo kỳ lương.
 * Nếu kỳ lương đã tồn tại → ghi đè. Nếu chưa → thêm mới.
 * @param {string} monthStr Kỳ lương
 * @param {Array} configLines Mảng 4 phần tử [{label, value}, ...]
 * @returns {string} 'Success' hoặc lỗi
 */
function doGet_saveConfigThuyetMinhL1(monthStr, configLines) {
  const FILE_ID = '1-pKqPF-GpmoTXno1no5NN-JRIMLsHwBqGx1xdLHPgr4';
  const SHEET_NAME = 'ConfigThuyetMinhL1';

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
          Logger.log('ConfigThuyetMinhL1: Ghi đè kỳ %s tại dòng %s', monthStr, i + 2);
          return 'Success';
        }
      }
    }

    sh.appendRow(newRow);
    Logger.log('ConfigThuyetMinhL1: Thêm mới kỳ %s', monthStr);
    return 'Success';

  } catch (e) {
    Logger.log('Lỗi ghi ConfigThuyetMinhL1: %s', e.message);
    return 'Error: ' + e.message;
  }
}

/**
 * Lấy tổng tiền lương thực tế (1+2+3+4) cho kỳ T và T-1.
 * Công thức giữ cùng logic với dòng Tổng của phần "TIỀN LƯƠNG: (1+2+3+4)"
 * trong báo cáo Tổng hợp lương, tính trực tiếp từ các sheet nguồn.
 * @param {string} monthStr Kỳ lương dạng Tmm.yyyy (VD: T02.2025)
 * @param {string} regionFilter Khu vực lọc (VD: Hà Nội, Phú Thọ...)
 * @returns {Object} { totalLuongT: number, totalLuongT1: number }
 */
function doGet_getTotalSalarySums(monthStr, regionFilter) {
  const FILES = {
    DATA_LUONG_1: '1j6q9n5TlbW9cPa-ixfn5H_YtUNP_DHLqNLbY4iI9yWQ',
    DATA_LUONG_2: '13JOTPXzwsgFttd6gmKk0mCTgXqKO9R4MJICMWHLvozs',
    TRUY_THU_LUONG_1: '1dHZ9b5SlTn9fqHq0ZR8yrlJYcA44hhbnlHc3OHm6uW0',
    TRUY_THU_LUONG_2: '1rdy605GSv7R_QazPbPA7qXBEkzzqoDB0Kx-lhrAB6ew',
    DATA_AN_CA: '1Rg3x5TL-0AS5hOLcvdTI7EfrfCFG8T0wd2TrIiKWUno',
    MASTER_DATA: '1OH2HsnDShrkFfM-R8EJo3hwGDOsQh-e43Dmb2xaiudw',
    TINH_THUE: '1Xcp4cBjKcHWt_FQULd7MrC7fhiX8ZVMzL8wXJ3aoJLw'
  };
  const SHEETS = {
    DATA_LUONG_1: 'DataLuong1',
    DATA_LUONG_2: 'DataLuong2',
    DATA_TRUY_THU: 'DataTruyThuLinh',
    DATA_AN_CA: 'DataAnCa',
    DATA_NHAN_SU: 'DataNhanSu',
    TINH_THUE: 'TinhThue'
  };

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
  let prevMonth = T.month - 1;
  let prevYear = T.year;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear = T.year - 1;
  }
  const monthStrT1 = formatKy(prevMonth, prevYear);

  function getPrevKyForTotal(kyStr) {
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

  function isAllRegion(value) {
    const normalized = normalizeKey(value);
    return !normalized || normalized === 'all' || normalized === 'tat ca';
  }

  function normalizeLocation(value) {
    const key = normalizeKey(value);
    if (!key) return '';
    if (key.indexOf('ha noi') !== -1 || key === 'hn') return 'Hà Nội';
    if (key.indexOf('phu tho') !== -1 || key.indexOf('vinh phuc') !== -1 || key === 'pt' || key === 'vp') return 'Phú Thọ';
    return String(value || '').trim();
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

  function isWantedLocation(kv, wanted) {
    return !wanted || normalizeKey(kv) === normalizeKey(wanted);
  }

  function normalizeContractType(value) {
    const key = normalizeKey(value).replace(/\s+/g, ' ');
    if (key === 'bien che') return 'Biên chế';
    if (key === 'hd 68' || key.indexOf('hop dong 68') !== -1) return 'HĐ 68';
    if (key === 'hd dai han' || key.indexOf('dai han') !== -1) return 'HĐ dài hạn';
    if (key === 'hd vu viec' || key.indexOf('vu viec') !== -1) return 'HĐ vụ việc';
    return String(value || '').trim();
  }

  function getTotalTienLuongI(ky) {
    const wantedLocation = isAllRegion(regionFilter) ? '' : normalizeLocation(regionFilter);
    const valuesL1 = getData(FILES.DATA_LUONG_1, SHEETS.DATA_LUONG_1);
    const valuesL2 = getData(FILES.DATA_LUONG_2, SHEETS.DATA_LUONG_2);
    const valuesTT1 = getData(FILES.TRUY_THU_LUONG_1, SHEETS.DATA_TRUY_THU);
    const valuesTT2 = getData(FILES.TRUY_THU_LUONG_2, SHEETS.DATA_TRUY_THU);
    const valuesAnCa = getData(FILES.DATA_AN_CA, SHEETS.DATA_AN_CA);
    const valuesNS = getData(FILES.MASTER_DATA, SHEETS.DATA_NHAN_SU);
    const valuesChotNS = getSheetNSThang().getDataRange().getValues();
    const valuesThue = getData(FILES.TINH_THUE, SHEETS.TINH_THUE);

    const hL1 = valuesL1[0] || [];
    const hL2 = valuesL2[0] || [];
    const hTT1 = valuesTT1[0] || [];
    const hTT2 = valuesTT2[0] || [];
    const hAnCa = valuesAnCa[0] || [];
    const hNS = valuesNS[0] || [];
    const hChot = valuesChotNS[0] || [];

    const idxL1 = {
      KyLuong: getIdx(hL1, 'Kỳ lương'),
      MaCB: getIdx(hL1, 'Mã CB'),
      HoTen: getIdx(hL1, 'Họ và tên'),
      LoaiHD: getIdx(hL1, 'Loại HĐ'),
      TongLuong1: getIdx(hL1, 'Tổng lương 1')
    };
    const idxL2 = {
      KyLuong: getIdx(hL2, 'Kỳ lương'),
      MaNS: getIdx(hL2, ['Mã nhân sự', 'Mã CB', 'MaNS']),
      Luong2: getIdx(hL2, ['Lương 2', 'Tổng lương'])
    };
    const idxTT1 = {
      KyLuong: getIdx(hTT1, 'Kỳ trả lương'),
      MaCB: getIdx(hTT1, 'Mã nhân sự'),
      LoaiHD: getIdx(hTT1, 'Loại hợp đồng'),
      ConNhan: getIdx(hTT1, 'Còn nhận')
    };
    const idxTT2 = {
      KyLuong: getIdx(hTT2, 'Kỳ trả lương'),
      MaNS: getIdx(hTT2, 'Mã nhân sự'),
      ConNhan: getIdx(hTT2, 'Còn nhận')
    };
    const idxAnCa = {
      KyLuong: getIdx(hAnCa, 'Kỳ lương'),
      MaCB: getIdx(hAnCa, 'Mã CB'),
      AnCa: getIdx(hAnCa, 'Ăn ca'),
      TruyLinh: getIdx(hAnCa, 'Truy lĩnh')
    };
    const idxNS = {
      MaCB: getIdx(hNS, ['Mã CB', 'Mã nhân sự']),
      KhuVuc: getIdx(hNS, 'Khu vực')
    };
    const idxChot = {
      KyLuong: getIdx(hChot, 'Kỳ lương'),
      MaNS: getIdx(hChot, 'Mã nhân sự'),
      KhuVuc: getIdx(hChot, 'Khu vực') !== -1 ? getIdx(hChot, 'Khu vực') : 38,
      TrangThai: getIdx(hChot, ['Trạng thái', 'Status', 'TrangThai'])
    };

    const empMap = {};
    valuesNS.slice(1).forEach(row => {
      const maCB = String(getCell(row, idxNS.MaCB) || '').trim();
      if (!maCB) return;
      const kv = normalizeLocation(getCell(row, idxNS.KhuVuc));
      if (!isWantedLocation(kv, wantedLocation)) return;
      empMap[maCB] = { khuVuc: kv, trangThai: '', amounts: {} };
    });

    valuesChotNS.slice(1).forEach(row => {
      if (String(getCell(row, idxChot.KyLuong) || '').trim() !== ky) return;
      const maCB = String(getCell(row, idxChot.MaNS) || '').trim();
      if (!maCB) return;
      const kv = normalizeLocation(getCell(row, idxChot.KhuVuc));
      if (!isWantedLocation(kv, wantedLocation)) {
        if (empMap[maCB]) delete empMap[maCB];
        return;
      }
      if (!empMap[maCB]) empMap[maCB] = { khuVuc: kv, trangThai: '', amounts: {} };
      empMap[maCB].khuVuc = kv;
      empMap[maCB].trangThai = idxChot.TrangThai !== -1 ? String(getCell(row, idxChot.TrangThai) || '').trim() : '';
    });

    function ensureEmp(maCB) {
      if (!maCB) return null;
      if (!empMap[maCB]) {
        if (wantedLocation) return null;
        empMap[maCB] = { khuVuc: '', trangThai: '', amounts: {} };
      }
      return empMap[maCB];
    }

    valuesL1.slice(1).forEach(row => {
      if (String(getCell(row, idxL1.KyLuong) || '').trim() !== ky) return;
      const maCB = String(getCell(row, idxL1.MaCB) || '').trim();
      const emp = ensureEmp(maCB);
      if (!emp) return;
      emp.hoTen = emp.hoTen || String(getCell(row, idxL1.HoTen) || '').trim();
      emp.loaiHD = normalizeContractType(getCell(row, idxL1.LoaiHD));
      emp.amounts.tongLuong1 = (emp.amounts.tongLuong1 || 0) + (Number(getCell(row, idxL1.TongLuong1)) || 0);
    });

    valuesTT1.slice(1).forEach(row => {
      if (String(getCell(row, idxTT1.KyLuong) || '').trim() !== ky) return;
      const maCB = String(getCell(row, idxTT1.MaCB) || '').trim();
      const emp = ensureEmp(maCB);
      if (!emp) return;
      if (!emp.loaiHD) emp.loaiHD = normalizeContractType(getCell(row, idxTT1.LoaiHD));
      emp.amounts.truyThuL1 = (emp.amounts.truyThuL1 || 0) + (Number(getCell(row, idxTT1.ConNhan)) || 0);
    });

    valuesL2.slice(1).forEach(row => {
      if (String(getCell(row, idxL2.KyLuong) || '').trim() !== ky) return;
      const emp = ensureEmp(String(getCell(row, idxL2.MaNS) || '').trim());
      if (!emp) return;
      emp.amounts.luong2 = (emp.amounts.luong2 || 0) + (Number(getCell(row, idxL2.Luong2)) || 0);
    });

    valuesTT2.slice(1).forEach(row => {
      if (String(getCell(row, idxTT2.KyLuong) || '').trim() !== ky) return;
      const emp = ensureEmp(String(getCell(row, idxTT2.MaNS) || '').trim());
      if (!emp) return;
      emp.amounts.truyThuL2 = (emp.amounts.truyThuL2 || 0) + (Number(getCell(row, idxTT2.ConNhan)) || 0);
    });

    valuesAnCa.slice(1).forEach(row => {
      if (String(getCell(row, idxAnCa.KyLuong) || '').trim() !== ky) return;
      const emp = ensureEmp(String(getCell(row, idxAnCa.MaCB) || '').trim());
      if (!emp) return;
      emp.amounts.anCa = (emp.amounts.anCa || 0) + (Number(getCell(row, idxAnCa.AnCa)) || 0);
      emp.amounts.anCaTruyLinh = (emp.amounts.anCaTruyLinh || 0) + (Number(getCell(row, idxAnCa.TruyLinh)) || 0);
    });

    const prevKy = getPrevKyForTotal(ky);
    const thueMap = {};
    valuesThue.slice(1).forEach(row => {
      if (String(row[1] || '').trim() !== prevKy) return;
      const maCB = String(row[4] || '').trim();
      if (!maCB) return;
      thueMap[maCB] = (thueMap[maCB] || 0) + (Number(row[32]) || 0);
    });

    const contractTotals = {
      'Biên chế': 0,
      'HĐ 68': 0,
      'HĐ dài hạn': 0,
      'HĐ vụ việc': 0
    };
    const suspendedTotals = {};
    let fallbackTotalAllContracts = 0;
    let fallbackRows = 0;
    let matchedContractRows = 0;

    Object.keys(empMap).forEach(maCB => {
      const emp = empMap[maCB];
      const kv = normalizeLocation(emp.khuVuc || '');
      if (!isWantedLocation(kv, wantedLocation)) return;

      const amt = emp.amounts || {};
      const tongL1 = (amt.tongLuong1 || 0) + (amt.truyThuL1 || 0);
      if (tongL1 !== 0) {
        fallbackTotalAllContracts += tongL1;
        fallbackRows++;
      }

      const loaiHD = normalizeContractType(emp.loaiHD);
      if (!Object.prototype.hasOwnProperty.call(contractTotals, loaiHD)) return;

      matchedContractRows++;
      contractTotals[loaiHD] += tongL1;

      const trangThai = String(emp.trangThai || '').trim();
      const isTreoLuong = (kv === 'Phú Thọ' && (trangThai === 'Đi NN' || trangThai === 'Đi công tác NN'));
      if (isTreoLuong) {
        const luong2Net = (amt.luong2 || 0) + (amt.truyThuL2 || 0);
        const anCaNet = (amt.anCa || 0) + (amt.anCaTruyLinh || 0);
        const thueTNCN = thueMap[maCB] || 0;
        suspendedTotals[loaiHD] = (suspendedTotals[loaiHD] || 0) - (tongL1 + luong2Net + anCaNet - thueTNCN);
      }
    });

    Object.keys(suspendedTotals).forEach(type => {
      contractTotals[type] += suspendedTotals[type];
    });

    const strictTotal = Object.keys(contractTotals).reduce((sum, type) => sum + contractTotals[type], 0);
    if (strictTotal === 0 && fallbackTotalAllContracts !== 0) {
      Logger.log(
        'Fallback tổng TIỀN LƯƠNG I cho kỳ %s, khu vực %s: strictTotal=0, fallback=%s, fallbackRows=%s, matchedContractRows=%s',
        ky,
        wantedLocation || 'Tất cả',
        fallbackTotalAllContracts,
        fallbackRows,
        matchedContractRows
      );
      return fallbackTotalAllContracts;
    }

    Logger.log(
      'Tổng TIỀN LƯƠNG I kỳ %s, khu vực %s: strictTotal=%s, fallback=%s, fallbackRows=%s, matchedContractRows=%s',
      ky,
      wantedLocation || 'Tất cả',
      strictTotal,
      fallbackTotalAllContracts,
      fallbackRows,
      matchedContractRows
    );
    return strictTotal;
  }

  const totalLuongT = getTotalTienLuongI(monthStr);
  const totalLuongT1 = getTotalTienLuongI(monthStrT1);

  Logger.log('Tổng thực tế cho khu vực %s: T=%s (%s), T-1=%s (%s)', regionFilter, totalLuongT, monthStr, totalLuongT1, monthStrT1);

  return {
    totalLuongT: totalLuongT,
    totalLuongT1: totalLuongT1
  };
}

function doGet_getTotalSalarySums_debug(monthStr, regionFilter) {
  const MAIN_APP_URL = 'https://script.google.com/macros/s/AKfycbydpKq7DJJ5aiuQuHNgVRfrZSY13m2dLjkfDaWc5v_h_UiHll-MnZQseXzhQe5up_a8Mw/exec';
  const url = `${MAIN_APP_URL}?type=getPrintDataTongHopLuong&month=${encodeURIComponent(monthStr)}`;
  try {
    const response = UrlFetchApp.fetch(url, { method: 'get', muteHttpExceptions: true });
    const code = response.getResponseCode();
    const text = response.getContentText();
    return {
      code: code,
      snippet: text.substring(0, 500)
    };
  } catch (e) {
    return { error: e.message };
  }
}
