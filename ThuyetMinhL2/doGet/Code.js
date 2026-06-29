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

const rngDataThang = 'DanhMucThang!A2:N';
const rngDataAnCa = 'DataAnCa!A1:J';
const rngSetup = 'Setup!B2:B';
const rngDataChotCong = 'DataChotCong!A1:L';
const rngDataChotNsThang = 'DataChotNSThang!A1:AM';

const idFileDataAnCa = LibraryDigiCore.idFileDataAnCa;
const sheetDataAnCa = SpreadsheetApp.openById(idFileDataAnCa).getSheetByName('DataAnCa');

/**
 * Hàm format đơn vị: Ghép mã và tên, sau đó bỏ 2 ký tự đầu
 * @param {string} maDonVi - Mã đơn vị (VD: "DV001", "DV0094", "DV00A")
 * @param {string} tenDonVi - Tên đơn vị (VD: "Ban Giám hiệu")
 * @returns {string} - Kết quả format: "001 - Ban Giám hiệu"
 */
function formatDonVi(maDonVi, tenDonVi) {
  // Xử lý trường hợp null/undefined
  if (!maDonVi && !tenDonVi) return '';
  if (!maDonVi) return tenDonVi;
  if (!tenDonVi) return maDonVi;

  // Chuyển sang string và trim
  const ma = maDonVi.toString().trim();
  const ten = tenDonVi.toString().trim();

  // Bỏ 2 ký tự đầu tiên của mã đơn vị
  const maSauKhiCat = ma.length > 2 ? ma.substring(2) : ma;

  // Ghép: "mã - tên"
  return `${maSauKhiCat} - ${ten}`;
}

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
      const totalSums = doGet_getTotalTNTTSums(month, region);
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
    } else if (type === 'debugDiNganHangL2_Xlsx') {
      const downloadUrl = doGet_xuatDebugDiNganHangL2(month, region);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        downloadUrl
      })).setMimeType(ContentService.MimeType.JSON);
    } else if (type === 'loadConfigThuyetMinhL2') {
      const configData = doGet_loadConfigThuyetMinhL2(month);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        configData
      })).setMimeType(ContentService.MimeType.JSON);
    } else if (type === 'saveConfigThuyetMinhL2') {
      const configLines = JSON.parse(e.parameter.data || '[]');
      const saveResult = doGet_saveConfigThuyetMinhL2(month, configLines);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: saveResult
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
    let trangThai = row[13] || "Chưa tạo thuyết minh";

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


function getDataLuongAnCa(month) {
  const response = Sheets.Spreadsheets.Values.batchGet(idFileDataAnCa, {
    ranges: [rngDataAnCa]
  });

  const dataFromSheetAnCa = response.valueRanges[0]?.values || [];

  // Tách header (dòng đầu tiên) và các dòng dữ liệu
  const headers = dataFromSheetAnCa[0];
  const rows = dataFromSheetAnCa.slice(1); // Bỏ qua dòng đầu tiên

  // Lọc các dòng dữ liệu theo điều kiện
  const filteredRows = rows.filter(row => {
    const thang = row[1]; // Cột B (index 1)
    return thang === month;
  });

  // Thêm cột STT vào header
  const newHeaders = ['Trạng thái'].concat(headers);

  // Thêm "Đã lưu" vào từng dòng dữ liệu đã lọc
  const newRows = filteredRows.map(row => {
    return ['Đã lưu'].concat(row);
  });

  // Kết hợp header và các dòng đã lọc, đảm bảo header luôn ở đầu mảng
  const dataAnCa = [newHeaders].concat(newRows);

  return {
    dataLuongAnCa: dataAnCa

  };
}


function tinhLuongAnCa(month) {
  const fromSheetDataChotCong = getSheetChotCong().getDataRange().getValues();
  const fromSheetDataChotNsThang = getSheetNSThang().getDataRange().getValues();

  const resAnCa = Sheets.Spreadsheets.Values.get(idFileDataAnCa, rngDataAnCa);
  const fromSheetDataAnCa = resAnCa.values || [];

  const headers = ['Trạng thái', 'ID', 'Kỳ lương', 'Mã CB', 'Họ tên', 'Loại hợp đồng', 'Đơn vị', 'Mã ngạch', 'Ăn ca', 'Truy lĩnh', 'Còn lĩnh'];
  const maxLookahead = 1000;

  // Bước 1: Lọc ngày công lớn nhất từ DataChotCong
  const columnMonth = 2; // cột C (index 2)
  const columnMaCB = 3;   // cột D (index 3)
  const columnNgayCong = 8; // cột I (index 8)

  const maCbNgayCongMap = new Map(); // key: mã CB, value: ngày công lớn nhất
  let flag = false;
  let lookaheadCount = 0;

  for (let i = fromSheetDataChotCong.length - 1; i >= 0; i--) {
    const row = fromSheetDataChotCong[i];
    const rowMonth = row[columnMonth];

    if (rowMonth === month) {
      flag = true;
      lookaheadCount = 0;

      const maCB = row[columnMaCB];
      const ngayCong = parseFloat(row[columnNgayCong]) || 0;

      if (!maCbNgayCongMap.has(maCB) || maCbNgayCongMap.get(maCB) < ngayCong) {
        maCbNgayCongMap.set(maCB, ngayCong);
      }
    } else if (flag) {
      lookaheadCount++;
      if (lookaheadCount > maxLookahead) break;
    }
  }

  // Kết quả đầu ra là mảng: [maCB, ngayCongMax]
  const resultArray = Array.from(maCbNgayCongMap.entries()).map(([maCB, ngayCong]) => [maCB, ngayCong]);

  // Bước 2: Lọc thông tin nhân sự từ DataChotNsThang
  const columnID = 0;       // cột A
  const columnMonthNs = 1;  // cột B
  const columnMaCBNs = 2;   // cột C
  const columnHoTen = 3;    // cột D
  const columnLoaiHD = 4;   // cột E
  const columnMaDonVi = 5;  // cột F - Mã đơn vị
  const columnDonVi = 6;    // cột G - Tên đơn vị
  const columnMaNgach = 7;  // cột H
  const columnTrangThai = 8;// cột I
  const columnAnCa = 26;    // cột AA

  const nsMap = new Map(); // Map để lưu thông tin nhân sự theo mã CB
  let flagNs = false;
  let lookaheadNs = 0;

  for (let i = fromSheetDataChotNsThang.length - 1; i >= 0; i--) {
    const row = fromSheetDataChotNsThang[i];
    const thang = row[columnMonthNs];

    if (thang === month) {
      flagNs = true;
      lookaheadNs = 0;

      const maCB = row[columnMaCBNs];
      const trangThai = (row[columnTrangThai] || '').toString().trim();
      let tienAnCa = parseFloat(row[columnAnCa]) || 0;

      // ❗ Nếu trạng thái khác "Đang làm" thì không được tính ăn ca
      if (trangThai !== "Đang làm") {
        tienAnCa = 0;
      }

      if (!nsMap.has(maCB)) {
        // 🔴 Sử dụng hàm formatDonVi để format đơn vị
        const maDonVi = row[columnMaDonVi] || '';
        const tenDonVi = row[columnDonVi] || '';
        const donViFormatted = formatDonVi(maDonVi, tenDonVi);

        nsMap.set(maCB, {
          id: row[columnID] || '',
          hoTen: row[columnHoTen] || '',
          loaiHopDong: row[columnLoaiHD] || '',
          donVi: donViFormatted,  // 🔴 Sử dụng giá trị đã format
          maNgach: row[columnMaNgach] || '',
          mucAnCa: tienAnCa
        });
      }

    } else if (flagNs) {
      lookaheadNs++;
      if (lookaheadNs > maxLookahead) break;
    }
  }

  // --- MỚI: Tạo Set các hàng đã lưu trong DataAnCa để đánh dấu "Đã lưu" ---
  const keySavedSet = new Set();
  if (Array.isArray(fromSheetDataAnCa) && fromSheetDataAnCa.length > 0) {
    for (let i = 0; i < fromSheetDataAnCa.length; i++) {
      const r = fromSheetDataAnCa[i];
      // bỏ hàng tiêu đề (nếu có) bằng cách kiểm tra r[0] có phải exact 'Kỳ lương' hay r[0] rỗng
      const kyLuongInAnCa = (r[1] || '').toString().trim();
      const maCBInAnCa = (r[2] || '').toString().trim();
      if (kyLuongInAnCa && maCBInAnCa) {
        keySavedSet.add(`${kyLuongInAnCa}|${maCBInAnCa}`);
      }
    }
  }

  // Bước 3: Gộp dữ liệu và sort theo đơn vị
  const mergedArray = [];

  for (const [maCB, ngayCongMax] of resultArray) {
    const info = nsMap.get(maCB);
    if (!info) continue;

    mergedArray.push({
      maCB,
      ngayCong: ngayCongMax,
      ...info
    });
  }

  // 🟡 Sắp xếp theo tên đơn vị (alphabet)
  mergedArray.sort((a, b) => {
    return a.donVi.localeCompare(b.donVi, 'vi', { sensitivity: 'base' });
  });

  // Bước 4: Tạo output có trạng thái
  const output = [headers];

  for (const item of mergedArray) {
    const anCa = +(item.mucAnCa / 22 * item.ngayCong).toFixed(0);
    const truyLinh = 0;
    const conLinh = +(anCa + truyLinh).toFixed(0);

    // key để kiểm tra: kỳ lương + '|' + mãCB
    const key = `${month}|${item.maCB}`;
    const statusText = keySavedSet.has(key) ? 'Đã lưu' : 'Chưa lưu';

    output.push([
      statusText, //stt++,
      item.id,
      month,
      item.maCB,
      item.hoTen,
      item.loaiHopDong,
      item.donVi,
      item.maNgach,
      anCa,
      truyLinh,
      conLinh
    ]);
  }

  return output;
}

/**LẤY BẢNG IN ĂN CA */
function getDataPrint(targetMonthStr) {
  // ✅A. Lấy dữ liệu từ sheet DataAnCa
  const rows = sheetDataAnCa.getRange("B2:J" + sheetDataAnCa.getLastRow()).getValues();
  // ✅ Thêm dòng này ngay sau khi mở sheetDataAnCa (hoặc trong getDataPrint, đầu hàm)
  const unitCodeMap = getMaDonVi_Map();

  const allData = [];

  let flag = false;
  let lookahead = 0;
  const maxLookahead = 1000;

  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    const thang = row[0]; // Cột Kỳ lương

    if (thang === targetMonthStr) {
      allData.unshift(row); // thêm vào đầu mảng (vì duyệt ngược)
      flag = true;
      lookahead = 0;
    } else if (flag) {
      lookahead++;
      if (lookahead >= maxLookahead) break;
    }
  }

  if (allData.length === 0) {
    throw new Error(`Không tìm thấy dữ liệu tháng ${targetMonthStr} trong DataAnCa`);
  }

  // ✅B. Gom nhóm và chèn dòng tổng
  const groupIndex = 4; // Cột đơn vị dùng để gom nhóm
  const sumStartIndex = 6; // Bắt đầu tính tổng từ cột Cột Ăn ca index 6
  const sumEndIndex = 8; // Cột cuối cần tính tổng index 8

  // Gom nhóm theo giá trị cột groupIndex
  const groups = {};
  for (const row of allData) {
    const groupKey = row[groupIndex];
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(row);
  }

  // Chuẩn bị mảng ghi ra sheet
  const resultData = [];
  const grandTotalRow = Array(allData[0].length - 3).fill(""); // -2 vì sẽ xoá 2 cột
  grandTotalRow[0] = "Tổng cộng";

  let stt = 1;

  for (const groupName in groups) {
    const rows = groups[groupName];

    // 2. Dữ liệu nhóm → loại bỏ cột 4 (Loại HĐ) và 5 (Đơn vị)
    //resultData.push(...rows);
    for (const row of rows) {
      const newRow = row.filter((_, idx) => idx !== 0 && idx !== 3 && idx !== 4);
      newRow.unshift(stt++);
      resultData.push(newRow);
    }

    // 🔁 Sửa phần này: tạo label tổng nhóm
    const maDonVi = unitCodeMap[groupName] || ""; // Nếu không tìm thấy, để trống
    const totalLabel = maDonVi ? `Tổng ${maDonVi}-${groupName}` : `Tổng ${groupName}`;

    // 3. Dòng tổng nhóm
    const totalRow = [
      //"Tổng " + groupName, // cột STT (text tổng)
      totalLabel,
      "",                     // Mã CB
      "",                     // Họ tên
      "",                     // Mã ngạch
      "",                     // Ăn ca
      "",                     // Truy lĩnh
      ""                      // Còn lĩnh
    ];

    for (let i = sumStartIndex; i <= sumEndIndex; i++) {
      let sum = 0;
      for (const row of rows) {
        const val = (row[i] || "").toString().replace(/,/g, "");
        const num = parseFloat(val);
        if (!isNaN(num)) sum += num;
      }

      const colIndex = i - sumStartIndex + 4; // 4,5,6 tương ứng với Ăn ca, Truy lĩnh, Còn lĩnh
      totalRow[colIndex] = sum.toLocaleString("en-US");

      // Cộng vào grand total
      const currentVal = parseFloat((grandTotalRow[i] || "0").replace(/,/g, "")) || 0;
      grandTotalRow[i] = (currentVal + sum).toLocaleString("en-US");
    }

    resultData.push(totalRow);
  }

  // 4. Thêm dòng tổng chung vào cuối
  resultData.push(grandTotalRow);

  return resultData;
}
/**LẤY BẢNG IN TỔNG HỢP ĂN CA */
function getTotalDataPrint(targetMonthStr) {
  // ✅ A. Lấy dữ liệu từ sheet DataAnCa
  const rows = sheetDataAnCa.getRange("B2:J" + sheetDataAnCa.getLastRow()).getValues();

  // ✅ B. Lọc theo tháng (Kỳ lương = cột B = index 0 trong range B2:J…)
  const allData = rows.filter(row => (row[0] || "").toString().trim() === targetMonthStr);

  if (allData.length === 0) {
    throw new Error(`Không tìm thấy dữ liệu tháng ${targetMonthStr} trong DataAnCa`);
  }

  // ✅ C. Gom nhóm theo cột Đơn vị (index 4)
  const groups = {};
  for (const row of allData) {
    const groupKey = (row[4] || "").toString(); // Giữ nguyên text, kể cả khoảng trắng
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(row);
  }

  // ✅ D. Chuẩn bị kết quả — chỉ dòng tổng
  const resultData = [];

  const SUM_COL_AN_CA = 6;      // Ăn ca
  const SUM_COL_TRUY_LINH = 7; // Truy lĩnh
  const SUM_COL_CON_LINH = 8;  // Còn lĩnh

  let grandSoNguoi = 0;
  let grandAnCa = 0;
  let grandTruyLinh = 0;
  let grandConLinh = 0;

  let stt = 1;

  for (const groupName in groups) {
    const rowsInGroup = groups[groupName];
    const soNguoi = rowsInGroup.length;

    // 🔧 TÁCH MÃ ĐƠN VỊ & GIỮ NGUYÊN TÊN ĐƠN VỊ
    let maDonVi = "";
    let tenDonViFull = groupName; // Giữ nguyên 100% text gốc

    // Chỉ tách nếu có " - " (có space trước và sau dấu gạch ngang)
    const dashIndex = groupName.indexOf(" - ");
    if (dashIndex !== -1) {
      maDonVi = groupName.substring(0, dashIndex); // Giữ nguyên text (kể cả space cuối nếu có)
      // tenDonViFull vẫn là groupName → không thay đổi
    } else {
      maDonVi = ""; // Không có mã → rỗng
    }

    // Tính tổng tiền (xử lý số an toàn)
    const parseToNum = (val) => {
      if (val == null || val === "") return 0;
      const cleaned = (val + "").replace(/[^0-9.-]/g, ""); // chỉ giữ số, dấu chấm, dấu trừ
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    };

    let sumAnCa = 0, sumTruyLinh = 0, sumConLinh = 0;
    for (const row of rowsInGroup) {
      sumAnCa += parseToNum(row[SUM_COL_AN_CA]);
      sumTruyLinh += parseToNum(row[SUM_COL_TRUY_LINH]);
      sumConLinh += parseToNum(row[SUM_COL_CON_LINH]);
    }

    // Cập nhật tổng chung
    grandSoNguoi += soNguoi;
    grandAnCa += sumAnCa;
    grandTruyLinh += sumTruyLinh;
    grandConLinh += sumConLinh;

    // ✅ Dòng tổng đơn vị: STT | Mã đơn vị | Tên đơn vị (nguyên bản) | Số người | Ăn ca | Truy lĩnh | Còn nhận
    const totalRow = [
      stt++,
      maDonVi,                // text nguyên bản — không trim, không sửa
      tenDonViFull,           // giữ nguyên "MA - Tên" như trong dữ liệu
      soNguoi,
      sumAnCa.toLocaleString("en-US", { maximumFractionDigits: 0 }),
      sumTruyLinh.toLocaleString("en-US", { maximumFractionDigits: 0 }),
      sumConLinh.toLocaleString("en-US", { maximumFractionDigits: 0 })
    ];

    resultData.push(totalRow);
  }

  // ✅ Dòng tổng cộng
  const grandTotalRow = [
    "", // STT để trống
    "",
    "Tổng cộng",
    grandSoNguoi,
    grandAnCa.toLocaleString("en-US", { maximumFractionDigits: 0 }),
    grandTruyLinh.toLocaleString("en-US", { maximumFractionDigits: 0 }),
    grandConLinh.toLocaleString("en-US", { maximumFractionDigits: 0 })
  ];

  resultData.push(grandTotalRow);

  return resultData;
}


function getMaDonVi_Map() {
  const idFileData = LibraryDigiCore.idFileData;
  const sheetSetup = SpreadsheetApp.openById(idFileData).getSheetByName('Setup');
  if (!sheetSetup) {
    throw new Error("Không tìm thấy sheet 'Setup'");
  }

  const lastRow = sheetSetup.getLastRow();
  if (lastRow < 2) return {}; // Không có dữ liệu

  const data = sheetSetup.getRange("K2:L" + lastRow).getValues(); // Cột K = index 0, L = index 1
  const map = {};

  for (const [maDonVi, tenDonVi] of data) {
    if (tenDonVi && maDonVi) {
      map[tenDonVi.toString().trim()] = maDonVi.toString().trim();
    }
  }

  return map;
}

function testPrintData() {
  var thang = "T01.2025";
  var data = getTotalDataPrint(thang);
  SpreadsheetApp.openById('1Rg3x5TL-0AS5hOLcvdTI7EfrfCFG8T0wd2TrIiKWUno').getSheetByName('Test').getRange(1, 1, data.length, data[0].length).setValues(data)

}


function testDataAnCa() {
  const x = getDataLuongAnCa('T01.2025');
  Logger.log(x);
}

function testChotCongMap() {
  const x = tinhLuongAnCa('T01.2025');
  //Logger.log(x)
  const row = x.find(r => r[2] === "CB97"); // cột thứ 2 => index = 1

  if (row) {
    Logger.log(row);
  } else {
    Logger.log("Không tìm thấy CB97");
  }
}
