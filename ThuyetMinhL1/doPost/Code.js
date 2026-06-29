const idFileData = LibraryDigiCore.idFileData;
const idFileChotCong = LibraryDigiCore.idFileChotCong;
const idFileChotNhanSuThang = LibraryDigiCore.idFileChotNhanSuThang;

const sheet = SpreadsheetApp.openById(idFileData);
const sheetDanhMucThang = sheet.getSheetByName("DanhMucThang");

// --- Lazy Loading Sheets ---
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


const idFileDataAnCa = '1-pKqPF-GpmoTXno1no5NN-JRIMLsHwBqGx1xdLHPgr4';//LibraryDigiCore.idFileDataAnCa;
const sheetDataAnCa = SpreadsheetApp.openById(idFileDataAnCa).getSheetByName('DatabaseL1');

function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const userRole = requestData.userRole;
    const userEmail = requestData.strEmail;

    const action = requestData.action;
    let logData = []; // tạo biến lưu dữ liệu mới để ghi log

    if (action === 'delete') {
      const month = requestData.currentMonth;
      const strReturn = delAllData(month);
      if (strReturn === 'Success') {
        LibraryDigiCore.logDiary('DatabaseL1', '', 1, 'xóa-all-data', userEmail, '');

        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          message: "Dữ liệu đã xóa thành công."
        })).setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: "Lỗi: " + strReturn
        })).setMimeType(ContentService.MimeType.JSON);
      }

    } else if (action === 'print') {
      const month = requestData.currentMonth;
      //const data = requestData.data;

      let strReturn = '';

      try {
        strReturn = printAnCa(month);
      } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: "Lỗi hệ thống trong hàm printAnCa: " + err.message
        })).setMimeType(ContentService.MimeType.JSON);
      }

      if (Array.isArray(strReturn)) {
        try {
          LibraryDigiCore.logDiary('DatabaseL1', '', 1, 'print-data', userEmail, '');
        } catch (err) {
          return ContentService.createTextOutput(JSON.stringify({
            status: "error",
            message: "Lỗi hệ thống trong hàm logDiary: " + err.message
          })).setMimeType(ContentService.MimeType.JSON);
        }

        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          message: "In dữ liệu thành công."
        })).setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: "Lỗi: " + strReturn
        })).setMimeType(ContentService.MimeType.JSON);
      }

    } else if (action === 'saveConfigThuyetMinh') {
      // ===== LƯU 4 DÒNG CONFIG THUYẾT MINH =====
      const month = requestData.currentMonth;
      const configLines = requestData.configLines || [];
      const SHEET_NAME = 'ConfigThuyetMinhL1';

      try {
        const ssAnCa = SpreadsheetApp.openById(idFileDataAnCa);
        if (!ssAnCa) throw new Error("Không thể mở file Data An Ca bằng ID: " + idFileDataAnCa);
        
        let sh = ssAnCa.getSheetByName(SHEET_NAME);
        if (!sh) {
          sh = ssAnCa.insertSheet(SHEET_NAME);
          sh.getRange(1, 1, 1, 9).setValues([
            ['Kỳ lương', 'Label1', 'Value1', 'Label2', 'Value2', 'Label3', 'Value3', 'Label4', 'Value4']
          ]);
        }

        const newRow = [
          month,
          configLines[0]?.label || '', configLines[0]?.value || '',
          configLines[1]?.label || '', configLines[1]?.value || '',
          configLines[2]?.label || '', configLines[2]?.value || '',
          configLines[3]?.label || '', configLines[3]?.value || ''
        ];

        const lastRow = sh.getLastRow();
        let updated = false;

        if (lastRow >= 2) {
          const kyCol = sh.getRange(2, 1, lastRow - 1, 1).getValues();
          for (let i = 0; i < kyCol.length; i++) {
            if (String(kyCol[i][0]).trim() === month) {
              sh.getRange(i + 2, 1, 1, 9).setValues([newRow]);
              updated = true;
              break;
            }
          }
        }

        if (!updated) {
          sh.appendRow(newRow);
        }

        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          message: "Đã lưu thành công dữ liệu thuyết minh kỳ " + month
        })).setMimeType(ContentService.MimeType.JSON);

      } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: "Lỗi tại doPost (saveConfigThuyetMinh): " + err.message
        })).setMimeType(ContentService.MimeType.JSON);
      }

    } else if (action === 'write') {
      //1. Ghi dữ liệu xuống sheets
      const formData = requestData.data;
      const month = requestData.currentMonth;

      // Thêm id vào đầu các dòng trong data
      const newData = formData.map(row => {
        const maCB = row[0];    // cột 2
        const id = `${month}_${maCB}`;
        return [id, month, ...row];    // chèn id vào đầu dòng
      });

      sheetDataAnCa.getRange(sheetDataAnCa.getLastRow() + 1, 1, newData.length, newData[0].length).setValues(newData);

      try {
        LibraryDigiCore.logDiary('DatabaseL1', '', undefined, 'thêm', userEmail, '...');
      } catch (e) {
        Logger.log("Lỗi ghi log: " + e.toString());
      }

      //2. Cập nhật trạng thái Đã tạo thuyết minh cột H của DanhMucThang
      updateStatusTinhLuong(month, 'Đã tạo thuyết minh');

      // Trả về phản hồi thành công
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Dữ liệu đã được lưu thành công."
      })).setMimeType(ContentService.MimeType.JSON);

    } else if (action === 'edit') {

      // Check quyền: không có quyền "Sửa" thì không trả về dữ liệu
      if (!userRole.includes(quyenSua)) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "no permission",
          message: 'Không có quyền thao tác'
        })).setMimeType(ContentService.MimeType.JSON);
      }

      const formData = requestData.formData;
      const MNS = formData['foMaNhanSu'];
      const ngayBatDau = getValue(formData['foNgayBatDau']);
      const soQD = getValue(formData['foSoQuyetDinh']);
      const tenNS = getValue(formData['foTenNhanSu']);
      const maNgach = getValue(formData['foMaNgach']);
      const loaiHD = getValue(formData['foLoaiHopDong']);
      const tenDV = getValue(formData['foTenDonVi']);
      const loaiCapNhat = getValue(formData['foLoaiCapNhat']);
      const ngayKetThuc = getValue(formData['foNgayKetThuc']);

      // Khai báo mảng giá trị để đưa vào data
      const values = [
        MNS,
        tenNS,
        loaiHD,
        getValue(formData['foMaDonVi']),
        tenDV,
        maNgach,
        getValue(formData['foSoTaiKhoan']),
        getValue(formData['foNgayGiangDay']),
        getValue(formData['foTrangThai']),
        ngayBatDau,
        ngayKetThuc,
        getValue(formData['hsMoi_bac']),
        getValue(formData['hsMoi_chucVu']),
        getValue(formData['ptMoi_vuotKhung']),
        getValue(formData['hsMoi_vuotKhung']),
        getValue(formData['ptMoi_pcNganh']),
        getValue(formData['hsMoi_pcNganh']),
        getValue(formData['ptMoi_thamNien']),
        getValue(formData['hsMoi_thamNien']),
        getValue(formData['hsMoi_docHai']),
        getValue(formData['hsMoi_tuVe']),
        getNumber(formData['money_TamUngNcs']),
        getValue(formData['hsMoi_trachNhiem']),
        getNumber(formData['money_onDinhTn']),
        getNumber(formData['money_TnQuanLy']),
        getNumber(formData['money_HoTroHCPV']),
        getNumber(formData['money_thuHutLd']),
        getNumber(formData['money_HoTroKhac']),
        getNumber(formData['money_anCa']),
        getNumber(formData['money_BHXH']),
        getNumber(formData['money_BHYT']),
        getNumber(formData['money_BHTN']),
        getNumber(formData['money_KPCD']),
        getNumber(formData['money_truKhac']),
        getNumber(formData['money_thamNien']),
        getValue(formData['hsMoi_diNuocNgoai']),
        getNumber(formData['money_diNuocNgoai']),
        getNumber(formData['money_dangPhi'])
      ];

      // Xóa dữ liệu cũ
      var strReturn = LibraryDigiCore.delData('DataNhanSu', MNS, 1, 'sửa', userEmail, values.join('|'));
      if (strReturn !== 'Success') {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: "Lỗi: " + strReturn
        })).setMimeType(ContentService.MimeType.JSON);
      }

      sheetDataAnCa.appendRow(values);

      // xử lý và ghi dữ liệu vào data quyết định trung gian
      var startMonth = formatStartMonth(ngayBatDau);
      var endMonth = getEndMonth();
      var listMonths = getListMonths(startMonth, endMonth);

      // Lấy ds hs cập nhật từ client side
      const hesos = requestData.dataChangedTable;

      const dataQdTrungGian = [];

      const totalRows = listMonths.length * hesos.length;
      const idList = genNewIds(sheetQdTrungGian.getRange('A1'), 'IdQd', totalRows);
      let idIndex = 0;

      for (const kyLuong of listMonths) {
        for (const hs of hesos) {
          const row = [
            idList[idIndex++],           // 1. ID
            soQD,           // 2. Số quyết định
            kyLuong,        // 3. Kỳ lương
            MNS,            // 4. Mã nhân sự
            tenNS,          // 5. Tên nhân sự
            maNgach,        // 6. Mã ngạch
            loaiHD,         // 7. Loại hợp đồng
            tenDV,          // 8. Tên đơn vị
            '',             // 9. Ngày công (trống)
            '',             // 10. Ghi chú (trống)
            '',             // 11. Loại bảng lương (trống)
            'Chưa xử lý',   // 12. Trạng thái
            loaiCapNhat,    // 13. Loại cập nhật
            hs.name,        // 14. Tên hệ số
            hs.old,         // 15. Hệ số cũ
            hs.value,       // 16. Hệ số mới
            ngayBatDau,     // 17. Ngày bắt đầu
            ngayKetThuc,    // 18. Ngày kết thúc
            ''              // 19. Kỳ chốt lương
          ];

          dataQdTrungGian.push(row);
          logData.push(row.join("|"));   // thêm vào logData
        }
      }

      // Ghi dữ liệu vào sheet QĐ trung gian nếu có hệ số được cập nhật
      if (hesos.length > 0 && dataQdTrungGian.length > 0) {
        sheetQdTrungGian.getRange(
          sheetQdTrungGian.getLastRow() + 1,
          1,
          dataQdTrungGian.length,
          dataQdTrungGian[0].length
        ).setValues(dataQdTrungGian);

        // Ghi log nếu có thay đổi
        LibraryDigiCore.logDiary('QdTrungGian', '', undefined, 'edit-hs', userEmail, logData.join('||'));
      } else {
        // --- GHI LOG DIARY CHO TRƯỜNG HỢP KHÔNG ĐỔI HỆ SỐ ---
        // Tạo log đơn giản với các thông tin cơ bản của quyết định
        const logSimple = [
          '',                // 1. ID (để rỗng)
          soQD || '',        // 2. Số quyết định
          '',                // 3. Kỳ lương (rỗng)
          MNS || '',         // 4. Mã nhân sự
          tenNS || '',       // 5. Tên nhân sự
          maNgach || '',     // 6. Mã ngạch
          loaiHD || '',      // 7. Loại hợp đồng
          tenDV || '',       // 8. Tên đơn vị
          '',                // 9. Ngày công
          '',                // 10. Ghi chú
          '',                // 11. Loại bảng lương
          '',                // 12. Trạng thái (rỗng)
          loaiCapNhat || '', // 13. Loại cập nhật
          '',                // 14. Tên hệ số
          '',                // 15. Hệ số cũ
          '',                // 16. Hệ số mới
          ngayBatDau || '',  // 17. Ngày bắt đầu
          ngayKetThuc || '', // 18. Ngày kết thúc
          ''                 // 19. Kỳ chốt lương
        ].join('|');

        LibraryDigiCore.logDiary('QdTrungGian', '', undefined, 'edit-no-hs', userEmail, logSimple);
      }

      // Trả về phản hồi thành công
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Dữ liệu đã được sửa thành công." //+ 'hệ số len: ' + hesos.length
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    const errMsg = (error && error.message) ? error.message : JSON.stringify(error);
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Có lỗi xảy ra ở post: " + errMsg
    })).setMimeType(ContentService.MimeType.JSON);
  }
}


function delAllData(month) {
  let doneDeleteData = false;
  let doneUpdateStatus = false;
  let doneDeleteStatusChotCong = false;

  const lastRow = sheetDataAnCa.getLastRow();
  if (lastRow < 2) return "Data rỗng";

  //✅ 1. XÓA DỮ LIỆU TRONG SHEET DataAnCa
  // Lấy dữ liệu từ A đến J, bắt đầu từ dòng 2
  const data = sheetDataAnCa.getRange(2, 1, lastRow - 1, 10).getValues();

  let flag = false;      // Đánh dấu khi bắt đầu gặp tháng trùng
  let extraCount = 0;    // Đếm số dòng thêm sau khi gặp tháng không trùng
  let rowsToDelete = [];

  // Duyệt ngược và lưu các dòng cần xóa
  for (let i = data.length - 1; i >= 0; i--) {
    const rowMonth = data[i][1]; // Cột B = index 1

    if (rowMonth == month) {
      rowsToDelete.push(i + 2); // +2 vì data bắt đầu từ dòng 2
      flag = true;
    } else {
      if (flag) {
        extraCount++;
        if (extraCount >= 100) break;
      }
    }
  }

  if (rowsToDelete.length > 0) {
    // Sắp xếp tăng dần để dùng deleteRows
    rowsToDelete.sort((a, b) => a - b);

    // Xóa một lần từ dưới lên để không bị sai index
    sheetDataAnCa.deleteRows(rowsToDelete[0], rowsToDelete.length);

    doneDeleteData = true;
  } else {
    return "Không có dữ liệu trùng tháng " + month;
  }

  //✅ 2. CẬP NHẬT TRẠNG THÁI Ở "DanhMucThang" thành "Chưa tính lương"
  try {
    const result2 = updateStatusTinhLuong(month, 'Chưa tạo thuyết minh');
    if (result2 === 'success') doneUpdateStatus = true;
  } catch (err) {
    doneUpdateStatus = false;
  }

  //✅ 3. XÓA TRẠNG THÁI "Đã tạo thuyết minh" ở cột L sheet DataChotCong
  const shChotCong = getSheetChotCong();
  const lastChotCongRow = shChotCong.getLastRow();

  if (lastChotCongRow >= 2) {
    const ccData = shChotCong.getRange(2, 1, lastChotCongRow - 1, 13).getValues(); // A → M
    let ccFlag = false;
    let ccExtraCount = 0;
    let hasChanged = false;
    let minRowChanged = ccData.length; // Đánh dấu dòng nhỏ nhất đã chỉnh sửa

    for (let i = ccData.length - 1; i >= 0; i--) {
      const rowMonth = ccData[i][12]; // Cột M = index 12
      const colL = ccData[i][11];     // Cột L = index 11

      if (rowMonth == month) {
        if (typeof colL === "string" && colL.includes("Đã tạo thuyết minh")) {
          ccData[i][11] = colL.replace(/Đã tạo thuyết minh;?\s*/g, "").trim();
          hasChanged = true;
          minRowChanged = Math.min(minRowChanged, i);
        }
        ccFlag = true;
      } else if (ccFlag) {
        ccExtraCount++;
        if (ccExtraCount >= 1000) break;
      }
    }

    // Nếu có thay đổi, chỉ ghi từ minRowChanged -> cuối sheet
    if (hasChanged) {
      const rowsToWrite = ccData.slice(minRowChanged); // Cắt phần cần ghi
      shChotCong
        .getRange(minRowChanged + 2, 1, rowsToWrite.length, 13)
        .setValues(rowsToWrite);
      doneDeleteStatusChotCong = true;
    } else {
      doneDeleteStatusChotCong = true;  // ✅ Không cần sửa cũng được coi là hoàn tất
    }
  } else {
    xoaTrangThaiAnCaThanhCong = true;   // Không có dữ liệu chốt công nhưng coi như không lỗi
  }

  // --- KIỂM TRA TỔNG THỂ ---
  if (doneDeleteData && doneUpdateStatus && doneDeleteStatusChotCong) {
    return "Success";
  } else {
    let errorMsg = "Xảy ra lỗi ở các bước: ";
    if (!doneDeleteData) errorMsg += "[xóa Database] ";
    if (!doneUpdateStatus) errorMsg += "[cập nhật DanhMucThang] ";
    if (!doneDeleteStatusChotCong) errorMsg += "[xóa trạng thái tạo thuyết minh] ";
    return errorMsg.trim();
  }
}
function testDelAllData() {
  var month = "T12.2025";
  delAllData(month)
}
function printAnCa(targetMonthStr) {
  // ✅A. Lấy dữ liệu từ sheet DataAnCa
  const rows = sheetDataAnCa.getRange("B2:J" + sheetDataAnCa.getLastRow()).getValues();
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
    throw new Error(`Không tìm thấy dữ liệu tháng ${targetMonthStr} trong Database`);
  }

  // ✅B. Gom nhóm và chèn dòng tổng
  const groupIndex = 4; // Cột đơn vị dùng để gom nhóm
  const sumStartIndex = 6 - 2; // Bắt đầu tính tổng từ cột này (trừ 2 vì ẩn đi 2 cột)
  const sumEndIndex = 8 - 2; // Cột cuối cần tính tổng 

  // Gom nhóm theo giá trị cột groupIndex
  const groups = {};
  for (const row of allData) {
    const groupKey = row[groupIndex];
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(row);
  }

  // Chuẩn bị mảng ghi ra sheet
  const resultData = [];
  const grandTotalRow = Array(allData[0].length - 2).fill(""); // -2 vì sẽ xoá 2 cột
  grandTotalRow[0] = "⇒ Tổng cộng";

  for (const groupName in groups) {
    const rows = groups[groupName];

    // 2. Dữ liệu nhóm → loại bỏ cột 4 (Loại HĐ) và 5 (Đơn vị)
    //resultData.push(...rows);
    for (const row of rows) {
      const newRow = row.filter((_, idx) => idx !== 3 && idx !== 4);
      resultData.push(newRow);
    }

    // 3. Dòng tổng nhóm
    const totalRow = Array(allData[0].length - 2).fill("");
    totalRow[0] = "→ Tổng " + groupName;

    for (let i = sumStartIndex; i <= sumEndIndex; i++) {
      let sum = 0;
      for (const row of rows) {
        const val = (row[i] || "").toString().replace(/,/g, "");
        const num = parseFloat(val);
        if (!isNaN(num)) sum += num;
      }
      totalRow[i] = sum.toLocaleString("en-US");

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

function testPrintData() {
  const allDataTest = [
    [
      "T01.2025",
      "CB205",
      "Lê Thu Sao",
      "Biên chế",
      "Ban Giám hiệu",
      "V.07.01.01",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB252",
      "Trần Hà Thanh",
      "Biên chế",
      "Ban Giám hiệu",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB13",
      "Nguyễn Văn Lâm",
      "Biên chế",
      "Ban Giám hiệu",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB158",
      "Nguyễn Mạnh Hùng",
      "Biên chế",
      "Ban Giám hiệu",
      "V.07.01.01",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB308",
      "Nguyễn Hoàng Long",
      "Biên chế",
      "Ban Giám hiệu",
      "V.07.01.01",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB4",
      "Vũ Ngọc Khiêm",
      "Biên chế",
      "Ban Giám hiệu",
      "V.07.01.01",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB363",
      "Nguyễn Văn Vi",
      "HĐ dài hạn",
      "BM Cảng - Công trình biển",
      "V.07.01.02",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB517",
      "Nguyễn Phương Nhung",
      "Biên chế",
      "BM Cảng - Công trình biển",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB364",
      "Nguyễn Văn Biên",
      "Biên chế",
      "BM Cảng - Công trình biển",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB321",
      "Nguyễn Anh Tuấn",
      "Biên chế",
      "BM Cầu - Hầm",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB509",
      "Đỗ Như Tráng",
      "HĐ dài hạn",
      "BM Cầu - Hầm",
      "V.07.01.02",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB708",
      "Nguyễn Thị Ngọc Bích",
      "Biên chế",
      "BM Cầu - Hầm",
      "V.07.01.03",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB555",
      "Nguyễn Văn Quang",
      "Biên chế",
      "BM Cầu - Hầm",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB535",
      "Nguyễn Quang Huy",
      "Biên chế",
      "BM Cầu - Hầm",
      "V.07.01.03",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB403",
      "Đào Quang Huy",
      "Biên chế",
      "BM Cầu - Hầm",
      "V.07.01.03",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB398",
      "Nguyễn Hữu May",
      "HĐ dài hạn",
      "BM Cầu - Hầm",
      "V15.111",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB327",
      "Nguyễn Hữu Giang",
      "Biên chế",
      "BM Cầu - Hầm",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB326",
      "Trần Anh Tuấn",
      "Biên chế",
      "BM Cầu - Hầm",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB323",
      "Nguyễn Tiến Hưng",
      "Biên chế",
      "BM Cầu - Hầm",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB324",
      "Lê Văn Mạnh",
      "Biên chế",
      "BM Cầu - Hầm",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB681",
      "Phạm Bích Hằng",
      "Biên chế",
      "BM chủ nghĩa Mác LêNin Khoa Luật",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB640",
      "Nguyễn Thị Như Ngọc",
      "Biên chế",
      "BM chủ nghĩa Mác LêNin Khoa Luật",
      "V.07.01.03",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB668",
      "Hà Hoàng Giang",
      "Biên chế",
      "BM chủ nghĩa Mác LêNin Khoa Luật",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB129",
      "Trần Thị Tâm",
      "Biên chế",
      "BM chủ nghĩa Mác LêNin Khoa Luật",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB128",
      "Nguyễn Thị Thu Trà",
      "Biên chế",
      "BM chủ nghĩa Mác LêNin Khoa Luật",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB127",
      "Nguyễn Thị Thơ",
      "Biên chế",
      "BM chủ nghĩa Mác LêNin Khoa Luật",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB682",
      "Nguyễn Văn Tuân",
      "Biên chế",
      "BM chủ nghĩa Mác LêNin Khoa Luật",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB519",
      "Nguyễn Công Nam",
      "Biên chế",
      "BM Cơ điện tử Khoa CNTT",
      "V.07.01.03",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB735",
      "Đặng Đình Thống",
      "HĐ dài hạn",
      "BM Cơ điện tử Khoa CNTT",
      "V.07.01.01",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB704",
      "Hồ Thị Thanh Mai",
      "Biên chế",
      "BM Cơ điện tử Khoa CNTT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB643",
      "Lương Việt Trung",
      "Biên chế",
      "BM Cơ điện tử Khoa CNTT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB747",
      "Nguyễn Thị Minh Phương",
      "Biên chế",
      "BM Cơ điện tử Khoa CNTT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB259",
      "Vương Thị Hương",
      "Biên chế",
      "BM Cơ điện tử Khoa CNTT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB626",
      "Võ Thanh Được",
      "Biên chế",
      "BM Cơ điện tử Khoa CNTT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB790",
      "Nguyễn Văn Chúc",
      "HĐ dài hạn",
      "BM Cơ lý thuyết - Sức bền vật liệu",
      "V.07.01.02",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB578",
      "Nguyễn Tiến Thế",
      "Biên chế",
      "BM Cơ lý thuyết - Sức bền vật liệu",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB482",
      "Bùi Tiến Tú",
      "Biên chế",
      "BM Cơ lý thuyết - Sức bền vật liệu",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB408",
      "Lê Văn Kiên",
      "Biên chế",
      "BM Cơ lý thuyết - Sức bền vật liệu",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB153",
      "Bùi Gia Phi",
      "Biên chế",
      "BM Cơ lý thuyết - Sức bền vật liệu",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB150",
      "Nguyễn Thị Huệ",
      "Biên chế",
      "BM Cơ lý thuyết - Sức bền vật liệu",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB145",
      "Đoàn Lan Phương",
      "Biên chế",
      "BM Cơ lý thuyết - Sức bền vật liệu",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB144",
      "Nguyễn Thị Giang",
      "Biên chế",
      "BM Cơ lý thuyết - Sức bền vật liệu",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB315",
      "Lê Ngọc Lý",
      "Biên chế",
      "BM Cơ lý thuyết - Sức bền vật liệu",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB520",
      "Đỗ Minh Ngọc",
      "Biên chế",
      "BM Địa kỹ thuật XD và Metro",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB349",
      "Hồ Sĩ Lành",
      "Biên chế",
      "BM Địa kỹ thuật XD và Metro",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB351",
      "Bùi Văn Lợi",
      "Biên chế",
      "BM Địa kỹ thuật XD và Metro",
      "V.07.01.03",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB352",
      "Lê Văn Hiệp",
      "Biên chế",
      "BM Địa kỹ thuật XD và Metro",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB347",
      "Nguyễn Thị Bích Hạnh",
      "Biên chế",
      "BM Địa kỹ thuật XD và Metro",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB371",
      "Nguyễn Thị Thanh Xuân",
      "Biên chế",
      "BM Địa kỹ thuật XD và Metro",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB369",
      "Nguyễn Văn Đăng",
      "Biên chế",
      "BM Địa kỹ thuật XD và Metro",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB728",
      "Ngô Bá Trình",
      "Biên chế",
      "BM Điện tử viễn thông Khoa CNTT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB770",
      "Nguyễn Cảnh Lam",
      "HĐ dài hạn",
      "BM Điện tử viễn thông Khoa CNTT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB713",
      "Bùi Thị Thùy",
      "Biên chế",
      "BM Điện tử viễn thông Khoa CNTT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB379",
      "Bùi Hải Đăng",
      "Biên chế",
      "BM Điện tử viễn thông Khoa CNTT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB387",
      "Vũ Văn Linh",
      "Biên chế",
      "BM Điện tử viễn thông Khoa CNTT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB267",
      "Đỗ Văn Lâm",
      "HĐ dài hạn",
      "BM Điện tử viễn thông Khoa CNTT",
      "V15.111",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB260",
      "Hoàng Thị Thúy",
      "Biên chế",
      "BM Điện tử viễn thông Khoa CNTT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB257",
      "Phạm Trường Giang",
      "Biên chế",
      "BM Điện tử viễn thông Khoa CNTT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB388",
      "Ngô Thị Thu Tình",
      "Biên chế",
      "BM Điện tử viễn thông Khoa CNTT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB266",
      "Nguyễn Thị Thu Hiền",
      "Biên chế",
      "BM Điện tử viễn thông Khoa CNTT",
      "V.07.01.03",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB752",
      "Nguyễn Trọng Dũng",
      "Biên chế",
      "BM Đường bộ",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB766",
      "Nguyễn Thị Thúy Hiên",
      "Biên chế",
      "BM Đường bộ",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB710",
      "Phạm Thị Phương Loan",
      "Biên chế",
      "BM Đường bộ",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB500",
      "Dương Tất Sinh",
      "HĐ dài hạn",
      "BM Đường bộ",
      "V.07.01.02",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB393",
      "Lê Quang Huy",
      "Biên chế",
      "BM Đường bộ",
      "V.07.01.03",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB332",
      "Bạch Thị Diệp Phương",
      "Biên chế",
      "BM Đường bộ",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB338",
      "Lê Minh Tú",
      "Biên chế",
      "BM Đường bộ",
      "V.07.01.03",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB334",
      "Hoàng Thị Hương Giang",
      "Biên chế",
      "BM Đường bộ",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB335",
      "Phạm Thanh Hiếu",
      "Biên chế",
      "BM Đường bộ",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB328",
      "Phạm Văn Huỳnh",
      "Biên chế",
      "BM Đường bộ",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB331",
      "Mai Thị Hải Vân",
      "Biên chế",
      "BM Đường bộ",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB329",
      "Nguyễn Minh Khoa",
      "Biên chế",
      "BM Đường bộ",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB157",
      "Nguyễn Văn Thanh",
      "Biên chế",
      "BM Giáo dục QP&AN - TTQPAN GDTC",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB156",
      "Nguyễn Văn Tuấn",
      "Biên chế",
      "BM Giáo dục QP&AN - TTQPAN GDTC",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB684",
      "Đặng Quý Quyền",
      "Biên chế",
      "BM Giáo dục thể chất TT QPAN GDTC",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB498",
      "Trần Huyền Trang",
      "Biên chế",
      "BM Giáo dục thể chất TT QPAN GDTC",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB52",
      "Ngô Thu Ngọc",
      "Biên chế",
      "BM Giáo dục thể chất TT QPAN GDTC",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB126",
      "Nguyễn Thùy Liên",
      "Biên chế",
      "BM Giáo dục thể chất TT QPAN GDTC",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB123",
      "Nguyễn Chí Mai",
      "Biên chế",
      "BM Giáo dục thể chất TT QPAN GDTC",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB125",
      "Nguyễn Ngọc Tuyên",
      "Biên chế",
      "BM Giáo dục thể chất TT QPAN GDTC",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB816",
      "Trần Đức Thắng",
      "HĐ dài hạn",
      "BM Hệ thống thông tin Khoa CNTT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB269",
      "Nguyễn Thị Lâm",
      "Biên chế",
      "BM Hệ thống thông tin Khoa CNTT",
      "V15.113",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB764",
      "Nguyễn Đức Anh",
      "HĐ dài hạn",
      "BM Hệ thống thông tin Khoa CNTT",
      "V.07.01.01",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB737",
      "Nguyễn Thị Quỳnh",
      "HĐ dài hạn",
      "BM Hệ thống thông tin Khoa CNTT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB598",
      "Khuất Thị Ngọc ánh",
      "Biên chế",
      "BM Hệ thống thông tin Khoa CNTT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB686",
      "Hoàng Thị Kim Ngân",
      "Biên chế",
      "BM Hệ thống thông tin Khoa CNTT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB688",
      "Nguyễn Thị Lan Anh",
      "Biên chế",
      "BM Hệ thống thông tin Khoa CNTT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB617",
      "Đặng Thị Kim Anh",
      "Biên chế",
      "BM Hệ thống thông tin Khoa CNTT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB521",
      "Nguyễn Thái Sơn",
      "Biên chế",
      "BM Hệ thống thông tin Khoa CNTT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB272",
      "Lê Thị Chi",
      "Biên chế",
      "BM Hệ thống thông tin Khoa CNTT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB510",
      "Đỗ Bảo Sơn",
      "Biên chế",
      "BM Hệ thống thông tin Khoa CNTT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB152",
      "Bùi Thị Phương Hoa",
      "Biên chế",
      "BM Hình họa vẽ kỹ thuật",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB512",
      "Kiều Lan Hương",
      "Biên chế",
      "BM Hình họa vẽ kỹ thuật",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB149",
      "Đào Thị Hương Giang",
      "Biên chế",
      "BM Hình họa vẽ kỹ thuật",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB148",
      "Trương Văn Toàn",
      "Biên chế",
      "BM Hình họa vẽ kỹ thuật",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB87",
      "Phan Thanh Nhàn",
      "Biên chế",
      "BM Hình họa vẽ kỹ thuật",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB146",
      "Vũ Anh Tuấn",
      "Biên chế",
      "BM Hình họa vẽ kỹ thuật",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB738",
      "Phạm Thương Giang",
      "Biên chế",
      "BM Hóa học - Môi trường Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB776",
      "Lê Phú Tuấn",
      "HĐ dài hạn",
      "BM Hóa học - Môi trường Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB740",
      "Hoàng Thị Phương",
      "Biên chế",
      "BM Hóa học - Môi trường Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB296",
      "Phạm Hồng Chuyên",
      "Biên chế",
      "BM Hóa học - Môi trường Khoa KHƯD",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB295",
      "Lê Minh Đức",
      "Biên chế",
      "BM Hóa học - Môi trường Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB357",
      "Nguyễn Thị Phương Dung",
      "Biên chế",
      "BM Hóa học - Môi trường Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB587",
      "Nguyễn Thị Thu Cúc",
      "Biên chế",
      "BM Hóa học - Môi trường Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB554",
      "Phạm Thị Ngọc Thùy",
      "Biên chế",
      "BM Hóa học - Môi trường Khoa KHƯD",
      "V.07.01.03",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB358",
      "Phạm Thị Huế",
      "Biên chế",
      "BM Hóa học - Môi trường Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB293",
      "Lưu Thị Thu Hà",
      "Biên chế",
      "BM Hóa học - Môi trường Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB497",
      "Lư Thị Yến",
      "Biên chế",
      "BM Hóa học - Môi trường Khoa KHƯD",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB657",
      "Vũ Thị Mai Quyên",
      "Biên chế",
      "BM Kế toán - Kiểm toán Khoa Kinh Tế",
      "V.07.01.03",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB624",
      "Hoàng Mai Chi",
      "HĐ dài hạn",
      "BM Kế toán - Kiểm toán Khoa Kinh Tế",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB622",
      "Trần Thùy Dung",
      "Biên chế",
      "BM Kế toán - Kiểm toán Khoa Kinh Tế",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB400",
      "Trần Thị Lan Hương",
      "Biên chế",
      "BM Kế toán - Kiểm toán Khoa Kinh Tế",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB694",
      "Hoàng Minh Thị Thuận",
      "Biên chế",
      "BM Kế toán - Kiểm toán Khoa Kinh Tế",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB698",
      "Bùi Thị Phương",
      "Biên chế",
      "BM Kế toán - Kiểm toán Khoa Kinh Tế",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB229",
      "Ngô Thị Hường",
      "Biên chế",
      "BM Kế toán - Kiểm toán Khoa Kinh Tế",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB696",
      "Đỗ Thị Hương Thanh",
      "Biên chế",
      "BM Kế toán - Kiểm toán Khoa Kinh Tế",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB226",
      "Đặng Thị Huế",
      "Biên chế",
      "BM Kế toán - Kiểm toán Khoa Kinh Tế",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB224",
      "Nguyễn Thị Thái An",
      "Biên chế",
      "BM Kế toán - Kiểm toán Khoa Kinh Tế",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB230",
      "Vương Thị Bạch Tuyết",
      "Biên chế",
      "BM Kế toán - Kiểm toán Khoa Kinh Tế",
      "V.07.01.02",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB346",
      "Nguyễn Thị Hương Giang",
      "Biên chế",
      "BM Kết cấu - Vật liệu",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB472",
      "Nguyễn Thị Bích Thủy",
      "HĐ dài hạn",
      "BM Kết cấu - Vật liệu",
      "V.07.01.02",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB675",
      "Lê Trung Hiếu",
      "Biên chế",
      "BM Kết cấu - Vật liệu",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB780",
      "Lại Bảo Tân",
      "Biên chế",
      "BM Kết cấu - Vật liệu",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB702",
      "Lê Thị Như Trang",
      "Biên chế",
      "BM Kết cấu - Vật liệu",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB524",
      "Lê Nguyên Khương",
      "Biên chế",
      "BM Kết cấu - Vật liệu",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB544",
      "Trịnh Hoàng Sơn",
      "Biên chế",
      "BM Kết cấu - Vật liệu",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB409",
      "Nguyễn Văn Minh",
      "HĐ dài hạn",
      "BM Kết cấu - Vật liệu",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB340",
      "Vũ Hoài Nam",
      "Biên chế",
      "BM Kết cấu - Vật liệu",
      "V.07.01.01",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB319",
      "Nguyễn Thùy Anh",
      "Biên chế",
      "BM Kết cấu - Vật liệu",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB320",
      "Ngô Thị Hồng Quế",
      "Biên chế",
      "BM Kết cấu - Vật liệu",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB317",
      "Trần Thị Lý",
      "Biên chế",
      "BM Kết cấu - Vật liệu",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB339",
      "Vũ Thọ Hưng",
      "Biên chế",
      "BM Kết cấu - Vật liệu",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB822",
      "Lê Văn Dũng",
      "HĐ dài hạn",
      "BM Logistics",
      "",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB821",
      "Nguyễn Quang Hồng",
      "HĐ dài hạn",
      "BM Logistics",
      "",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB786",
      "Trần Thị Lan Hương",
      "HĐ dài hạn",
      "BM Logistics",
      "V.07.01.02",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB663",
      "Bùi Nguyễn Dũng Nhân",
      "Biên chế",
      "BM Logistics",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB782",
      "Vũ Thị Minh Ngọc",
      "Biên chế",
      "BM Logistics",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB779",
      "Nguyễn Thanh Vân",
      "Biên chế",
      "BM Logistics",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB214",
      "Dương Thị Thu Hương",
      "Biên chế",
      "BM Logistics",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB538",
      "Nguyễn Thị Thu Hương",
      "Biên chế",
      "BM Logistics",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB215",
      "Nguyễn Thị Dung",
      "Biên chế",
      "BM Logistics",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB703",
      "Nguyễn Thị Thu Hường",
      "Biên chế",
      "BM Logistics",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB772",
      "Dương Thị Hoa Lư",
      "Biên chế",
      "BM Ngoại ngữ Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB773",
      "Nguyễn Thị Thu Hoài",
      "Biên chế",
      "BM Ngoại ngữ Khoa KHƯD",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB693",
      "Tạ Thị Hòa",
      "Biên chế",
      "BM Ngoại ngữ Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB692",
      "Đinh Đức Long",
      "Biên chế",
      "BM Ngoại ngữ Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB401",
      "Ngô Thị Lan Hương",
      "Biên chế",
      "BM Ngoại ngữ Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB412",
      "Trần Thị Ngọc Hà",
      "Biên chế",
      "BM Ngoại ngữ Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB389",
      "Lê Thị Bình",
      "Biên chế",
      "BM Ngoại ngữ Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB390",
      "Phạm Thị Bích Ngọc",
      "Biên chế",
      "BM Ngoại ngữ Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB287",
      "Bùi Thị Phương Thảo",
      "Biên chế",
      "BM Ngoại ngữ Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB289",
      "Mai Lê Thủy",
      "Biên chế",
      "BM Ngoại ngữ Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB288",
      "Dương Thị Hồng Anh",
      "Biên chế",
      "BM Ngoại ngữ Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB286",
      "Nguyễn Thị Mỹ Trang",
      "Biên chế",
      "BM Ngoại ngữ Khoa KHƯD",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB290",
      "Nguyễn Việt Hà",
      "Biên chế",
      "BM Ngoại ngữ Khoa KHƯD",
      "V.07.01.03",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB23",
      "Nguyễn Thị Thu Hiền",
      "Biên chế",
      "BM Ngoại ngữ Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB282",
      "Cao Thị Thu Nga",
      "Biên chế",
      "BM Ngoại ngữ Khoa KHƯD",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB777",
      "Nguyễn Văn Tiến",
      "HĐ dài hạn",
      "BM Quy hoạch và GT đô thị",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB147",
      "Nguyễn Thị Thu Ngà",
      "Biên chế",
      "BM Quy hoạch và GT đô thị",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB746",
      "Ngô Thị Thanh Vân",
      "HĐ dài hạn",
      "BM Quy hoạch và GT đô thị",
      "V.07.01.02",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB432",
      "Nguyễn Quốc Tới",
      "Biên chế",
      "BM Quy hoạch và GT đô thị",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB359",
      "Nguyễn Thanh Hòa",
      "Biên chế",
      "BM Quy hoạch và GT đô thị",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB360",
      "Kiều Văn Cẩn",
      "Biên chế",
      "BM Quy hoạch và GT đô thị",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB356",
      "Hoàng Văn Chung",
      "HĐ dài hạn",
      "BM Quy hoạch và GT đô thị",
      "V15.113",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB355",
      "Nguyễn Trọng Tuấn",
      "Biên chế",
      "BM Quy hoạch và GT đô thị",
      "V15.113",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB333",
      "Trần Trung Hiếu",
      "Biên chế",
      "BM Quy hoạch và GT đô thị",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB592",
      "Trương Thị Mỹ Thanh",
      "Biên chế",
      "BM Quy hoạch và GT đô thị",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB814",
      "Nguyễn Huy Hùng",
      "Biên chế",
      "BM Quy hoạch và GT đô thị",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB621",
      "Lê Thị Trang",
      "Biên chế",
      "BM Tài chính - Ngân hàng Khoa Kinh tế vận tải",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB250",
      "Trần Kim Thoa",
      "Biên chế",
      "BM Tài chính - Ngân hàng Khoa Kinh tế vận tải",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB784",
      "Vũ Thị ánh Huyền",
      "Biên chế",
      "BM Tài chính - Ngân hàng Khoa Kinh tế vận tải",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB248",
      "Nguyễn Thị Thanh Hiền",
      "Biên chế",
      "BM Tài chính - Ngân hàng Khoa Kinh tế vận tải",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB247",
      "Nguyễn Bích Ngọc",
      "Biên chế",
      "BM Tài chính - Ngân hàng Khoa Kinh tế vận tải",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB249",
      "Ngô Thị Thanh Nga",
      "Biên chế",
      "BM Tài chính - Ngân hàng Khoa Kinh tế vận tải",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB447",
      "Nguyễn Thị Quỳnh Trang",
      "Biên chế",
      "BM Tài chính - Ngân hàng Khoa Kinh tế vận tải",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB251",
      "Phan Thùy Dương",
      "Biên chế",
      "BM Tài chính - Ngân hàng Khoa Kinh tế vận tải",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB246",
      "Nguyễn Minh Nguyệt",
      "Biên chế",
      "BM Tài chính - Ngân hàng Khoa Kinh tế vận tải",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB662",
      "Nguyễn Anh Tuấn",
      "Biên chế",
      "BM Tài chính - Ngân hàng Khoa Kinh tế vận tải",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB691",
      "Nguyễn Thị Thu Hà",
      "Biên chế",
      "BM Toán ứng dụng Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB689",
      "Dương Ngọc Đạt",
      "Biên chế",
      "BM Toán ứng dụng Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB537",
      "Thái Thị Kim Chung",
      "Biên chế",
      "BM Toán ứng dụng Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB523",
      "Tô Văn Ban",
      "HĐ dài hạn",
      "BM Toán ứng dụng Khoa KHƯD",
      "V.07.01.02",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB480",
      "Hoàng Văn Cần",
      "Biên chế",
      "BM Toán ứng dụng Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB436",
      "Vũ Xuân Nhâm",
      "Biên chế",
      "BM Toán ứng dụng Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB402",
      "Nguyễn Đức Hùng",
      "Biên chế",
      "BM Toán ứng dụng Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB306",
      "Vũ Dũng",
      "Biên chế",
      "BM Toán ứng dụng Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB304",
      "Lưu Thị Vân Anh",
      "Biên chế",
      "BM Toán ứng dụng Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB303",
      "Phạm Thị Ninh Nhâm",
      "Biên chế",
      "BM Toán ứng dụng Khoa KHƯD",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB533",
      "Hà Thị Thanh Tâm",
      "Biên chế",
      "BM Toán ứng dụng Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB302",
      "Hoàng Thị Cẩm Thạch",
      "Biên chế",
      "BM Toán ứng dụng Khoa KHƯD",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB614",
      "Nguyễn Đình Nga",
      "Biên chế",
      "BM Truyền thông và mạng máy tính Khoa CNTT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB600",
      "Mạc Văn Quang",
      "Biên chế",
      "BM Truyền thông và mạng máy tính Khoa CNTT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB279",
      "Bùi Thị Như",
      "Biên chế",
      "BM Truyền thông và mạng máy tính Khoa CNTT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB273",
      "Lê Thanh Tấn",
      "Biên chế",
      "BM Truyền thông và mạng máy tính Khoa CNTT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB275",
      "Lương Hoàng Anh",
      "Biên chế",
      "BM Truyền thông và mạng máy tính Khoa CNTT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB142",
      "Vũ Đình Năm",
      "Biên chế",
      "BM Tư tưởng Hồ Chí Minh - Khoa Luật",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB135",
      "Đỗ Như Hồng",
      "Biên chế",
      "BM Tư tưởng Hồ Chí Minh - Khoa Luật",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB137",
      "Nguyễn Thị Thu Hằng",
      "Biên chế",
      "BM Tư tưởng Hồ Chí Minh - Khoa Luật",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB139",
      "Vũ Thị Kiều Ly",
      "Biên chế",
      "BM Tư tưởng Hồ Chí Minh - Khoa Luật",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB785",
      "Nguyễn Thị Thu Hà",
      "Biên chế",
      "BM Tư tưởng Hồ Chí Minh - Khoa Luật",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB806",
      "Nguyễn Thị Hương Giang",
      "Biên chế",
      "BM Tư tưởng Hồ Chí Minh - Khoa Luật",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB297",
      "Nguyễn Văn Cường",
      "Biên chế",
      "BM Vật lý công nghệ Khoa KHƯD",
      "V.07.01.03",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB833",
      "Nguyễn Xuân Quang",
      "Biên chế",
      "BM Vật lý công nghệ Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB831",
      "Nguyễn Tiến Thịnh",
      "HĐ vụ việc",
      "BM Vật lý công nghệ Khoa KHƯD",
      "",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB827",
      "Nguyễn Trọng Du",
      "HĐ dài hạn",
      "BM Vật lý công nghệ Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB690",
      "Nguyễn Viết Hiếu",
      "Biên chế",
      "BM Vật lý công nghệ Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB481",
      "Ông Văn Hoàng",
      "Biên chế",
      "BM Vật lý công nghệ Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB532",
      "Đặng Thị Bích Hợp",
      "Biên chế",
      "BM Vật lý công nghệ Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB478",
      "Ngô Thị Minh Hảo",
      "Biên chế",
      "BM Vật lý công nghệ Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB435",
      "Vũ Thị Hà",
      "Biên chế",
      "BM Vật lý công nghệ Khoa KHƯD",
      "V.07.01.03",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB299",
      "Trần Quốc Tuấn",
      "Biên chế",
      "BM Vật lý công nghệ Khoa KHƯD",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB823",
      "Nguyễn Trọng Dũng",
      "HĐ dài hạn",
      "BM Vật lý công nghệ Khoa KHƯD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB795",
      "Nguyễn Thị Hải",
      "HĐ dài hạn",
      "BM xây dựng dân dụng và Công nghiệp",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB757",
      "Lê Ngọc Lan",
      "Biên chế",
      "BM xây dựng dân dụng và Công nghiệp",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB707",
      "Nguyễn Minh Đức",
      "Biên chế",
      "BM xây dựng dân dụng và Công nghiệp",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB522",
      "Trịnh Thị Hoa",
      "Biên chế",
      "BM xây dựng dân dụng và Công nghiệp",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB442",
      "Nguyễn Duy Hưng",
      "Biên chế",
      "BM xây dựng dân dụng và Công nghiệp",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB425",
      "Vũ Thị Hương Lan",
      "Biên chế",
      "BM xây dựng dân dụng và Công nghiệp",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB86",
      "Bùi Gia Linh",
      "Biên chế",
      "BM xây dựng dân dụng và Công nghiệp",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB376",
      "Vũ Đình Phiên",
      "Biên chế",
      "BM xây dựng dân dụng và Công nghiệp",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB375",
      "Mai Văn Chiến",
      "Biên chế",
      "BM xây dựng dân dụng và Công nghiệp",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB377",
      "Vũ Đình Thơ",
      "Biên chế",
      "BM xây dựng dân dụng và Công nghiệp",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB373",
      "Phạm Tuấn Anh",
      "Biên chế",
      "BM xây dựng dân dụng và Công nghiệp",
      "V.07.01.01",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB794",
      "Phạm Thị Hiền",
      "HĐ dài hạn",
      "BM xây dựng dân dụng và Công nghiệp",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB685",
      "Nguyễn Thị Loan",
      "Biên chế",
      "Bộ môn Công nghệ phần mềm",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB687",
      "Trần Thị Xuân Hương",
      "Biên chế",
      "Bộ môn Công nghệ phần mềm",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB590",
      "Phạm Thị Thuận",
      "Biên chế",
      "Bộ môn Công nghệ phần mềm",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB579",
      "Lê Trung Kiên",
      "Biên chế",
      "Bộ môn Công nghệ phần mềm",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB558",
      "Nguyễn Hữu Mùi",
      "HĐ dài hạn",
      "Bộ môn Công nghệ phần mềm",
      "V.07.01.02",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB274",
      "Nguyễn Thị Kim Huệ",
      "Biên chế",
      "Bộ môn Công nghệ phần mềm",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB276",
      "Vũ Thị Thu Hà",
      "Biên chế",
      "Bộ môn Công nghệ phần mềm",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB270",
      "Đoàn Thị Thanh Hằng",
      "Biên chế",
      "Bộ môn Công nghệ phần mềm",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB542",
      "Phạm Đức Anh",
      "Biên chế",
      "Bộ môn Công nghệ phần mềm",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB638",
      "Nguyễn Văn Cường",
      "Biên chế",
      "Bộ môn Công nghệ phần mềm",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB384",
      "Nguyễn Anh Tuấn",
      "Biên chế",
      "Bộ môn Cơ khí chế tạo - Viện Cơ khí",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB171",
      "Nguyễn Văn Tuân",
      "Biên chế",
      "Bộ môn Cơ khí chế tạo - Viện Cơ khí",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB832",
      "Bùi Minh Hiển",
      "HĐ dài hạn",
      "Bộ môn Cơ khí chế tạo - Viện Cơ khí",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB589",
      "Nguyễn Văn Tiến",
      "HĐ dài hạn",
      "Bộ môn Cơ khí chế tạo - Viện Cơ khí",
      "V.07.01.02",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB166",
      "Nguyễn Tuấn Hải",
      "HĐ dài hạn",
      "Bộ môn Cơ khí chế tạo - Viện Cơ khí",
      "V.07.01.02",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB202",
      "Lưu Văn Anh",
      "Biên chế",
      "Bộ môn Cơ khí chế tạo - Viện Cơ khí",
      "V.07.01.03",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB656",
      "Nguyễn Quang Hưởng",
      "Biên chế",
      "Bộ môn Đầu máy - Toa xe và tàu điện",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB178",
      "Trần Văn Hiếu",
      "Biên chế",
      "Bộ môn Đầu máy - Toa xe và tàu điện",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB179",
      "Yên Văn Thực",
      "Biên chế",
      "Bộ môn Đầu máy - Toa xe và tàu điện",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB180",
      "Vũ Văn Hiệp",
      "Biên chế",
      "Bộ môn Đầu máy - Toa xe và tàu điện",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB709",
      "Nguyễn Thị Thơm",
      "Biên chế",
      "Bộ môn Kinh doanh quốc tế",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB826",
      "Bùi Văn Viễn",
      "HĐ dài hạn",
      "Bộ môn Kinh doanh quốc tế",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB219",
      "Dương Văn Nhung",
      "HĐ dài hạn",
      "Bộ môn Kinh doanh quốc tế",
      "V.07.01.02",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB762",
      "Nguyễn Thị Thu Huyền",
      "Biên chế",
      "Bộ môn Kinh doanh quốc tế",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB630",
      "Đặng Thị Thanh Huyền",
      "HĐ dài hạn",
      "Bộ môn Kinh doanh quốc tế",
      "V.07.01.02",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB641",
      "Trần Thị Thúy",
      "Biên chế",
      "Bộ môn Kinh doanh quốc tế",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB607",
      "Bùi Thị Hằng",
      "Biên chế",
      "Bộ môn Kinh doanh quốc tế",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB618",
      "Nguyễn Thị Hạnh",
      "Biên chế",
      "Bộ môn Kinh doanh quốc tế",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB586",
      "Trần Thế Tuân",
      "Biên chế",
      "Bộ môn Kinh doanh quốc tế",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB421",
      "Nguyễn Thị Thu Hiền",
      "Biên chế",
      "Bộ môn Kinh tế xây dựng",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB820",
      "Phan Mạnh Cường",
      "HĐ dài hạn",
      "Bộ môn Kinh tế xây dựng",
      "V.07.01.02",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB736",
      "Trịnh Xuân Trường",
      "HĐ dài hạn",
      "Bộ môn Kinh tế xây dựng",
      "V.07.01.03",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB237",
      "Phạm Thị Thanh Nhàn",
      "Biên chế",
      "Bộ môn Kinh tế xây dựng",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB236",
      "Phạm Thị Liên",
      "Biên chế",
      "Bộ môn Kinh tế xây dựng",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB330",
      "Nguyễn Thị Nga",
      "Biên chế",
      "Bộ môn Kinh tế xây dựng",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB235",
      "Nguyễn Thị Nga",
      "Biên chế",
      "Bộ môn Kinh tế xây dựng",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB441",
      "Đỗ Thị Huyền",
      "Biên chế",
      "Bộ môn Kinh tế xây dựng",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB233",
      "Phạm Đức Tấn",
      "Biên chế",
      "Bộ môn Kinh tế xây dựng",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB234",
      "Trần Trung Kiên",
      "Biên chế",
      "Bộ môn Kinh tế xây dựng",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB825",
      "Phạm Thị Thanh Mai",
      "HĐ dài hạn",
      "Bộ môn Luật khoa Luật - Chính trị",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB824",
      "Phạm Hải Bình",
      "HĐ dài hạn",
      "Bộ môn Luật khoa Luật - Chính trị",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB683",
      "Lê Thị Huyền",
      "Biên chế",
      "Bộ môn Luật khoa Luật - Chính trị",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB36",
      "Nguyễn Thanh Minh",
      "Biên chế",
      "Bộ môn Luật khoa Luật - Chính trị",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB763",
      "Mai Hồng Quang",
      "HĐ dài hạn",
      "Bộ môn Luật khoa Luật - Chính trị",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB748",
      "Lê Đăng Khoa",
      "Biên chế",
      "Bộ môn Luật khoa Luật - Chính trị",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB744",
      "Trần Văn Tuân",
      "Biên chế",
      "Bộ môn Luật khoa Luật - Chính trị",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB783",
      "Phùng Văn Ngọc",
      "Biên chế",
      "Bộ môn Máy xây dựng - Viện Cơ khí động lực",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB670",
      "Thái Hà Phi",
      "HĐ dài hạn",
      "Bộ môn Máy xây dựng - Viện Cơ khí động lực",
      "V.07.01.02",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB591",
      "Phùng Công Dũng",
      "Biên chế",
      "Bộ môn Máy xây dựng - Viện Cơ khí động lực",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB596",
      "Nguyễn Đăng Điệm",
      "HĐ dài hạn",
      "Bộ môn Máy xây dựng - Viện Cơ khí động lực",
      "V.07.01.02",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB595",
      "Nguyễn Thành Thu",
      "HĐ dài hạn",
      "Bộ môn Máy xây dựng - Viện Cơ khí động lực",
      "V.07.01.02",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB507",
      "Nguyễn Xuân Hòa",
      "Biên chế",
      "Bộ môn Máy xây dựng - Viện Cơ khí động lực",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB423",
      "Đặng Đức Thuận",
      "Biên chế",
      "Bộ môn Máy xây dựng - Viện Cơ khí động lực",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB176",
      "Phạm Như Nam",
      "Biên chế",
      "Bộ môn Máy xây dựng - Viện Cơ khí động lực",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB175",
      "Đỗ Hữu Tuấn",
      "Biên chế",
      "Bộ môn Máy xây dựng - Viện Cơ khí động lực",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB173",
      "Vũ Phi Long",
      "Biên chế",
      "Bộ môn Máy xây dựng - Viện Cơ khí động lực",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB174",
      "Bùi Văn Trầm",
      "Biên chế",
      "Bộ môn Máy xây dựng - Viện Cơ khí động lực",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB716",
      "Nguyễn Thị Hoa",
      "Biên chế",
      "Bộ môn ô tô - Viện Cơ khí động lực",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB840",
      "Nguyễn Đình Dũng",
      "HĐ dài hạn",
      "Bộ môn ô tô - Viện Cơ khí động lực",
      "V.07.01.03",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB679",
      "Vũ Thế Truyền",
      "Biên chế",
      "Bộ môn ô tô - Viện Cơ khí động lực",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB680",
      "Ma Thế Cường",
      "Biên chế",
      "Bộ môn ô tô - Viện Cơ khí động lực",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB676",
      "Hà Văn Hiếu",
      "HĐ dài hạn",
      "Bộ môn ô tô - Viện Cơ khí động lực",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB559",
      "Bùi Hải Triều",
      "HĐ dài hạn",
      "Bộ môn ô tô - Viện Cơ khí động lực",
      "V.07.01.02",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB545",
      "Nguyễn Văn Lịch",
      "HĐ dài hạn",
      "Bộ môn ô tô - Viện Cơ khí động lực",
      "V.07.01.02",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB534",
      "Lê Quỳnh Mai",
      "Biên chế",
      "Bộ môn ô tô - Viện Cơ khí động lực",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB450",
      "Lương Quý Hiệp",
      "Biên chế",
      "Bộ môn ô tô - Viện Cơ khí động lực",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB154",
      "Hoàng Quyết Chiến",
      "Biên chế",
      "Bộ môn ô tô - Viện Cơ khí động lực",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB170",
      "Chu Văn Huỳnh",
      "Biên chế",
      "Bộ môn ô tô - Viện Cơ khí động lực",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB168",
      "Lê Quang Thắng",
      "Biên chế",
      "Bộ môn ô tô - Viện Cơ khí động lực",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB195",
      "Vũ Quảng Đại",
      "Biên chế",
      "Bộ môn ô tô - Viện Cơ khí động lực",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB169",
      "Tạ Tuấn Hưng",
      "Biên chế",
      "Bộ môn ô tô - Viện Cơ khí động lực",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB167",
      "Nguyễn Thành Nam",
      "Biên chế",
      "Bộ môn ô tô - Viện Cơ khí động lực",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB839",
      "Trịnh Văn Cường",
      "HĐ dài hạn",
      "Bộ môn Quản trị kinh doanh",
      "V.07.01.02",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB836",
      "Nguyễn Tuấn Anh",
      "HĐ dài hạn",
      "Bộ môn Quản trị kinh doanh",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB838",
      "Hoàng Viết Khang",
      "HĐ dài hạn",
      "Bộ môn Quản trị kinh doanh",
      "V.07.01.02",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB837",
      "Lê Ngọc Tòng",
      "HĐ dài hạn",
      "Bộ môn Quản trị kinh doanh",
      "V.07.01.03",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB483",
      "Ngô Thị Bích Thảo",
      "Biên chế",
      "Bộ môn Quản trị kinh doanh",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB499",
      "Phạm Cao Cường",
      "Biên chế",
      "Bộ môn Quản trị kinh doanh",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB634",
      "Nguyễn Hồng Vân",
      "Biên chế",
      "Bộ môn Quản trị kinh doanh",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB572",
      "Trần Văn Thắng",
      "HĐ dài hạn",
      "Bộ môn Quản trị kinh doanh",
      "V.07.01.02",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB606",
      "Bùi Tường Minh",
      "HĐ dài hạn",
      "Bộ môn Quản trị kinh doanh",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB631",
      "Nguyễn Xuân Dũng",
      "HĐ dài hạn",
      "Bộ môn Quản trị kinh doanh",
      "V.07.01.02",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB445",
      "Nhữ Thùy Liên",
      "Biên chế",
      "Bộ môn Quản trị kinh doanh",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB678",
      "Bùi Thị Xuân Hương",
      "Biên chế",
      "Bộ môn Quản trị kinh doanh",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB636",
      "Đặng Việt Phương",
      "Biên chế",
      "Bộ môn Quản trị kinh doanh",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB433",
      "Đỗ Thị Thu Phương",
      "Biên chế",
      "Bộ môn Quản trị kinh doanh",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB632",
      "Nguyễn Hữu Dũng",
      "Biên chế",
      "Bộ môn Quản trị kinh doanh",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB695",
      "Trần Thị Thanh Xuân",
      "Biên chế",
      "Bộ môn Quản trị kinh doanh",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB220",
      "Lâm Phạm Thị Hải Hà",
      "Biên chế",
      "Bộ môn Quản trị kinh doanh",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB386",
      "Nguyễn Hùng Cường",
      "Biên chế",
      "Bộ môn Quản trị kinh doanh",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB489",
      "Nguyễn Thị Hương",
      "HĐ dài hạn",
      "Bộ môn Quản trị kinh doanh",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB181",
      "Hoàng Tú",
      "Biên chế",
      "Bộ môn Tàu thủy và thiết bị nổi",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB739",
      "Nguyễn Duy Linh",
      "Biên chế",
      "Bộ môn Tàu thủy và thiết bị nổi",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB185",
      "Trần Trọng Tuấn",
      "Biên chế",
      "Bộ môn Tàu thủy và thiết bị nổi",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB184",
      "Trương Tất Anh",
      "Biên chế",
      "Bộ môn Tàu thủy và thiết bị nổi",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB183",
      "Nguyễn Xuân Hành",
      "Biên chế",
      "Bộ môn Tàu thủy và thiết bị nổi",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB182",
      "Nguyễn Quốc Tuấn",
      "Biên chế",
      "Bộ môn Tàu thủy và thiết bị nổi",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB424",
      "Nguyễn Công Đoàn",
      "Biên chế",
      "Bộ môn Tàu thủy và thiết bị nổi",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB628",
      "Lưu Ngọc Trịnh",
      "HĐ dài hạn",
      "Bộ môn Thương mại điện tử",
      "V.07.01.02",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB697",
      "Lê Trọng Bình",
      "Biên chế",
      "Bộ môn Thương mại điện tử",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB241",
      "Đỗ Thị Vân Anh",
      "Biên chế",
      "Bộ môn Thương mại điện tử",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB639",
      "Nguyễn Thị Khánh Ngọc",
      "Biên chế",
      "Bộ môn Thương mại điện tử",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB774",
      "Trần Bá Tuân",
      "Biên chế",
      "Bộ môn Thương mại điện tử",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB613",
      "Phạm Hà Châu Quế",
      "Biên chế",
      "Bộ môn Thương mại điện tử",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB659",
      "Công Vũ Hà Mi",
      "Biên chế",
      "Bộ môn Thương mại điện tử",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB238",
      "Đỗ Thị Hồng Vân",
      "Biên chế",
      "Bộ môn Thương mại điện tử",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB834",
      "Nguyễn Văn Hải",
      "HĐ dài hạn",
      "Bộ môn Vận tải - Du lịch",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB645",
      "Lý Huy Tuấn",
      "HĐ dài hạn",
      "Bộ môn Vận tải - Du lịch",
      "V.07.01.02",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB789",
      "Phạm Công Trịnh",
      "HĐ dài hạn",
      "Bộ môn Vận tải - Du lịch",
      "V.07.01.02",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB627",
      "Trần Đình Tuấn",
      "HĐ dài hạn",
      "Bộ môn Vận tải - Du lịch",
      "V.07.01.02",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB771",
      "Nguyễn Ngọc Thuyên",
      "HĐ dài hạn",
      "Bộ môn Vận tải - Du lịch",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB217",
      "Phạm Công Giang",
      "Biên chế",
      "Bộ môn Vận tải - Du lịch",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB216",
      "Lê Thị Liễu",
      "Biên chế",
      "Bộ môn Vận tải - Du lịch",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB211",
      "Hà Nguyên Khánh",
      "Biên chế",
      "Bộ môn Vận tải - Du lịch",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB213",
      "Nguyễn Thị Trang",
      "Biên chế",
      "Bộ môn Vận tải - Du lịch",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB243",
      "Hoàng Thị Thanh",
      "Biên chế",
      "Bộ môn Vận tải - Du lịch",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB210",
      "Nguyễn Thị Bích Thủy",
      "Biên chế",
      "Bộ môn Vận tải - Du lịch",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB547",
      "Khuất Duy Dũng",
      "Biên chế",
      "Đi nước ngoài",
      "V.05.02.08",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB431",
      "Bùi Mạnh Lực",
      "Biên chế",
      "Đi nước ngoài",
      "V.07.01.03",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB34",
      "Phạm Văn Tân",
      "Biên chế",
      "Lãnh đạo khoa - Khoa Luật Chính trị",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB134",
      "Nguyễn Thị Thơm",
      "Biên chế",
      "Lãnh đạo khoa - Khoa Luật Chính trị",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB722",
      "Nguyễn Thanh Đức",
      "Biên chế",
      "Lãnh đạo T.tâm - T.tâm đào tạo TN",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB721",
      "Vũ Thành Hưng",
      "Biên chế",
      "Lãnh đạo T.tâm - T.tâm đào tạo TN",
      "V07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB122",
      "Nguyễn Thành Long",
      "Biên chế",
      "Lãnh đạo T.Tâm - T.tâm QPAN GDTC",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB539",
      "Đinh Quang Toàn",
      "Biên chế",
      "Lãnh đạo viện - Viện đổi mới sáng tạo",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB647",
      "Trần Thị Kiều Oanh",
      "Biên chế",
      "P. Đào tạo",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB633",
      "Hà Trọng Anh",
      "Biên chế",
      "P. Đào tạo",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB665",
      "Phùng Thị Thùy Dung",
      "Biên chế",
      "P. Đào tạo",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB495",
      "Lương Thúy Nhung",
      "Biên chế",
      "P. Đào tạo",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB664",
      "Nguyễn Thị Hải Vân",
      "Biên chế",
      "P. Đào tạo",
      "V.07.01.03",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB470",
      "Bùi Bá Vương",
      "Biên chế",
      "P. Đào tạo",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB300",
      "Trần Thị Duyên",
      "Biên chế",
      "P. Đào tạo",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB504",
      "Vũ Đức Tuấn",
      "Biên chế",
      "P. Đào tạo",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB256",
      "Nguyễn Đức Sơn",
      "Biên chế",
      "P. Đào tạo",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB271",
      "Nguyễn Thị Vân Anh",
      "Biên chế",
      "P. Đào tạo",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB311",
      "Trần Quang Minh",
      "Biên chế",
      "P. Đào tạo",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB21",
      "Phạm Quang Dũng",
      "Biên chế",
      "P. Đào tạo",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB20",
      "Nguyễn Thị Sen",
      "Biên chế",
      "P. Đào tạo",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB280",
      "Tô Vân Hoà",
      "Biên chế",
      "P. Đào tạo",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB15",
      "Nguyễn Thị Thơm",
      "Biên chế",
      "P. Đào tạo",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB16",
      "Vũ Thị Kiều Trang",
      "Biên chế",
      "P. Đào tạo",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB18",
      "Nguyễn Thị Đức Hạnh",
      "Biên chế",
      "P. Đào tạo",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB22",
      "Ngô Quốc Trinh",
      "Biên chế",
      "P. Đào tạo",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB802",
      "Phạm Thu Trang",
      "Biên chế",
      "P. Khảo thí và Đảm bảo CL đào tạo",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB701",
      "Phạm Thị Quế",
      "Biên chế",
      "P. Khảo thí và Đảm bảo CL đào tạo",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB49",
      "Nguyễn Văn Đoàn",
      "Biên chế",
      "P. Khảo thí và Đảm bảo CL đào tạo",
      "V.07.01.03",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB29",
      "Dương Quỳnh Anh",
      "Biên chế",
      "P. Khảo thí và Đảm bảo CL đào tạo",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB41",
      "Cao Thị Lan Anh",
      "Biên chế",
      "P. Khảo thí và Đảm bảo CL đào tạo",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB43",
      "Trần Thị Cẩm Loan",
      "Biên chế",
      "P. Khảo thí và Đảm bảo CL đào tạo",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB354",
      "Nguyễn Thị Loan",
      "Biên chế",
      "P. Khảo thí và Đảm bảo CL đào tạo",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB396",
      "Nguyễn Kiên Quyết",
      "Biên chế",
      "P. Khảo thí và Đảm bảo CL đào tạo",
      "V.07.01.01",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB14",
      "Tạ Thế Anh",
      "Biên chế",
      "P. Khảo thí và Đảm bảo CL đào tạo",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB828",
      "Nguyễn Thái Phúc",
      "HĐ dài hạn",
      "P. Khoa học CN & HTQT",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB642",
      "Đào Khánh Hưng",
      "Biên chế",
      "P. Khoa học CN & HTQT",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB672",
      "Trần Thị Huyền",
      "Biên chế",
      "P. Khoa học CN & HTQT",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB291",
      "Phí Lương Vân",
      "Biên chế",
      "P. Khoa học CN & HTQT",
      "V.07.01.03",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB28",
      "Vũ Trung Hiếu",
      "Biên chế",
      "P. Khoa học CN & HTQT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB350",
      "Phạm Thái Bình",
      "Biên chế",
      "P. Khoa học CN & HTQT",
      "V.07.01.02",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB343",
      "Ngô Thị Thanh Hương",
      "Biên chế",
      "P. Khoa học CN & HTQT",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB791",
      "Vũ Thị Trà My",
      "HĐ dài hạn",
      "P. Tài chính Kế toán",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB798",
      "Lê Thị Thùy Dương",
      "Biên chế",
      "P. Tài chính Kế toán",
      "V06.031",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB714",
      "Trần Ngọc Chi",
      "Biên chế",
      "P. Tài chính Kế toán",
      "V06.031",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB516",
      "Nguyễn Thị Phương Thảo",
      "Biên chế",
      "P. Tài chính Kế toán",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB12",
      "Giang Thị Tuyết Nhung",
      "Biên chế",
      "P. Tài chính Kế toán",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB11",
      "Đỗ Thị Thu Hà",
      "Biên chế",
      "P. Tài chính Kế toán",
      "V01.004",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB9",
      "Vũ Mai Hương",
      "Biên chế",
      "P. Tài chính Kế toán",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB10",
      "Bùi Thị Hương Thơm",
      "Biên chế",
      "P. Tài chính Kế toán",
      "V06.031",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB228",
      "Nguyễn Thị Diệu Thu",
      "Biên chế",
      "P. Tài chính Kế toán",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB8",
      "Nguyễn Thị Ngọc Ánh",
      "Biên chế",
      "P. Tài chính Kế toán",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB804",
      "Hà Ngọc Mai",
      "Biên chế",
      "P. Tổ chức cán bộ",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB742",
      "Trịnh Thị Quỳnh Mai",
      "HĐ dài hạn",
      "P. Tổ chức cán bộ",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB741",
      "Nguyễn Thị Anh Đào",
      "Biên chế",
      "P. Tổ chức cán bộ",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB711",
      "Bế Lê Hợp",
      "Biên chế",
      "P. Tổ chức cán bộ",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB699",
      "Đồng Minh Khánh",
      "Biên chế",
      "P. Tổ chức cán bộ",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB610",
      "Nguyễn Thanh Tâm",
      "Biên chế",
      "P. Tổ chức cán bộ",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB573",
      "Nguyễn Bích Huệ",
      "HĐ dài hạn",
      "P. Tổ chức cán bộ",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB132",
      "Nguyễn Thị Thu",
      "Biên chế",
      "P. Tổ chức cán bộ",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB530",
      "Trần Thị Thu Nga",
      "Biên chế",
      "P. Tổ chức cán bộ",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB475",
      "Nguyễn Xuân Nghĩa",
      "Biên chế",
      "P. Tổ chức cán bộ",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB37",
      "Nguyễn Duy Nam",
      "Biên chế",
      "P. Tổ chức cán bộ",
      "V01.002",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB27",
      "Lê Thanh Hải",
      "Biên chế",
      "P. Tổ chức cán bộ",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB143",
      "Dương Thị Ngọc Thu",
      "Biên chế",
      "P. Tổ chức cán bộ",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB819",
      "Nguyễn Thị Thùy Dung",
      "Biên chế",
      "Phòng Đào tạo sau đại học",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB800",
      "Nguyễn Huyền Linh",
      "Biên chế",
      "Phòng Đào tạo sau đại học",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB652",
      "Nguyễn Đức Đảm",
      "Biên chế",
      "Phòng Đào tạo sau đại học",
      "V01.004",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB439",
      "Lại Vân Anh",
      "Biên chế",
      "Phòng Đào tạo sau đại học",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB429",
      "Giáp Văn Lợi",
      "Biên chế",
      "Phòng Đào tạo sau đại học",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB312",
      "Phan Huy Thục",
      "Biên chế",
      "Phòng Đào tạo sau đại học",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB161",
      "Đỗ Thanh Long",
      "Biên chế",
      "Phòng Đào tạo sau đại học",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB172",
      "Trần Thanh An",
      "Biên chế",
      "Phòng Đào tạo sau đại học",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB815",
      "Đoàn Anh Tuấn",
      "HĐ dài hạn",
      "Phòng đổi mới sáng tạo - Viện đổi mới sáng tạo",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB797",
      "Nguyễn Ngọc Song",
      "HĐ dài hạn",
      "Phòng đổi mới sáng tạo - Viện đổi mới sáng tạo",
      "V.07.01.02",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB750",
      "Bùi Đăng Trình",
      "Biên chế",
      "Phòng đổi mới sáng tạo - Viện đổi mới sáng tạo",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB718",
      "Trần Ngọc Lý",
      "HĐ dài hạn",
      "Phòng đổi mới sáng tạo - Viện đổi mới sáng tạo",
      "V.07.01.03",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB667",
      "Đỗ Ngọc Chung",
      "HĐ dài hạn",
      "Phòng đổi mới sáng tạo - Viện đổi mới sáng tạo",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB486",
      "Đào Phúc Lâm",
      "Biên chế",
      "Phòng đổi mới sáng tạo - Viện đổi mới sáng tạo",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB796",
      "Đào Đắc Hoàng",
      "HĐ dài hạn",
      "Phòng hợp tác Q.tế - Viện đào tạo & HT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB674",
      "Đoàn Hà Minh",
      "Biên chế",
      "Phòng hợp tác Q.tế - Viện đào tạo & HT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB1",
      "Đỗ Ngọc Viện",
      "HĐ dài hạn",
      "Phòng KT số - Viện đổi mới sáng tạo",
      "V.07.01.02",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB745",
      "Vũ Tuấn Dũng",
      "HĐ dài hạn",
      "Phòng KT số - Viện đổi mới sáng tạo",
      "V.07.01.03",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB717",
      "Nguyễn Minh Hiếu",
      "HĐ dài hạn",
      "Phòng KT số - Viện đổi mới sáng tạo",
      "V.07.01.03",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB719",
      "Nguyễn Thành Nghĩa",
      "HĐ dài hạn",
      "Phòng KT số - Viện đổi mới sáng tạo",
      "V.07.01.03",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB733",
      "Nguyễn Thanh Tú",
      "Biên chế",
      "Phòng KT số - Viện đổi mới sáng tạo",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB765",
      "Nguyễn Anh Tuấn",
      "HĐ dài hạn",
      "Phòng KT số - Viện đổi mới sáng tạo",
      "V.07.01.03",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB418",
      "Vũ Thị Hồng Sen",
      "HĐ dài hạn",
      "Phòng KT số - Viện đổi mới sáng tạo",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB71",
      "Nguyễn Thị Tuyết",
      "HĐ dài hạn",
      "Phòng KT số - Viện đổi mới sáng tạo",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB799",
      "Lê Thị Gái",
      "Biên chế",
      "Phòng Q.lý H.động Đ.tạo Viện đào tạo",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB651",
      "Lê Thị Hoài Linh",
      "Biên chế",
      "Phòng Q.lý H.động Đ.tạo Viện đào tạo",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB817",
      "Nguyễn Thị Lan Hương",
      "HĐ dài hạn",
      "Phòng quản lý đào tọa - Viện đào tạo",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB801",
      "Trịnh Văn Trường",
      "Biên chế",
      "Phòng quản lý đào tọa - Viện đào tạo",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB705",
      "Đào Đắc Lý",
      "Biên chế",
      "Phòng quản lý đào tọa - Viện đào tạo",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB469",
      "Phạm Thị Thanh Huyền",
      "Biên chế",
      "Phòng quản lý đào tọa - Viện đào tạo",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB793",
      "Bùi Nguyễn Ngọc Mai",
      "Biên chế",
      "Phòng Quản lý đầu tư và XD cơ bản",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB648",
      "Đỗ Kim Chi",
      "Biên chế",
      "Phòng Quản lý đầu tư và XD cơ bản",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB588",
      "Trần Đăng Hiển",
      "Biên chế",
      "Phòng Quản lý đầu tư và XD cơ bản",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB365",
      "Nguyễn Văn Hiền",
      "Biên chế",
      "Phòng Quản lý đầu tư và XD cơ bản",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB88",
      "Nguyễn Văn Việt",
      "Biên chế",
      "Phòng Quản lý đầu tư và XD cơ bản",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB85",
      "Tống Thị Hương",
      "Biên chế",
      "Phòng Quản lý đầu tư và XD cơ bản",
      "V01.002",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB24",
      "Trần Trung Hiếu",
      "Biên chế",
      "Phòng Quản lý đầu tư và XD cơ bản",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB503",
      "Hoàng Anh Tuấn",
      "Biên chế",
      "Phòng T.hợp - Viện đào tạo liên tục",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB734",
      "Nguyễn Văn Tuấn",
      "Biên chế",
      "Phòng T.hợp - Viện đào tạo liên tục",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB159",
      "Dương Văn Đoan",
      "Biên chế",
      "Phòng T.hợp - Viện đào tạo liên tục",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB803",
      "Cấn Tất Đạt",
      "Biên chế",
      "Phòng Thanh tra - Pháp chế",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB813",
      "Nguyễn Cao Sáng",
      "Biên chế",
      "Phòng Thanh tra - Pháp chế",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB712",
      "Trần Thế Hùng",
      "Biên chế",
      "Phòng Thanh tra - Pháp chế",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB531",
      "Trịnh Thanh Bình",
      "Biên chế",
      "Phòng Thanh tra - Pháp chế",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB244",
      "Lê Xuân Ngọc",
      "Biên chế",
      "Phòng Thanh tra - Pháp chế",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB760",
      "Hoàng Minh Hiếu",
      "Biên chế",
      "Phòng thí nghiệm CTXD Viện CNGTVT",
      "GV thực hành",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB781",
      "Ngô Văn Toàn",
      "Biên chế",
      "Phòng thí nghiệm CTXD Viện CNGTVT",
      "GV thực hành",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB654",
      "Bế Ngọc Sơn",
      "Biên chế",
      "Phòng thí nghiệm CTXD Viện CNGTVT",
      "GV thực hành",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB669",
      "Đoàn Xuân Sơn",
      "Biên chế",
      "Phòng thí nghiệm CTXD Viện CNGTVT",
      "GV thực hành",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB496",
      "Phạm Thế Hưng",
      "Biên chế",
      "Phòng thí nghiệm CTXD Viện CNGTVT",
      "V.05.02.08",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB415",
      "Vũ Thế Thuần",
      "Biên chế",
      "Phòng thí nghiệm CTXD Viện CNGTVT",
      "V.05.02.08",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB348",
      "Nguyễn Trường Chinh",
      "Biên chế",
      "Phòng thí nghiệm CTXD Viện CNGTVT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB310",
      "Tạ Thị Hồng Nhung",
      "Biên chế",
      "Phòng thí nghiệm CTXD Viện CNGTVT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB778",
      "Nguyễn Khánh Hưng",
      "HĐ dài hạn",
      "Phòng Tổng hợp - Viện CNGTVT",
      "V.07.01.03",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB788",
      "Nguyễn Quốc Bảo",
      "HĐ dài hạn",
      "Phòng Tổng hợp - Viện CNGTVT",
      "V.07.01.02",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB543",
      "Nguyễn Hữu Anh",
      "Biên chế",
      "Phòng Tổng hợp - Viện CNGTVT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB342",
      "Trần Thanh Hà",
      "Biên chế",
      "Phòng Tổng hợp - Viện CNGTVT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB345",
      "Lê Nho Thiện",
      "Biên chế",
      "Phòng Tổng hợp - Viện CNGTVT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB361",
      "Nguyễn Trọng Giáp",
      "Biên chế",
      "Phòng Tổng hợp - Viện CNGTVT",
      "V.05.02.08",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB381",
      "Trần Ngọc Hưng",
      "Biên chế",
      "Phòng Tổng hợp - Viện CNGTVT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB514",
      "Bùi Thị Quỳnh Anh",
      "Biên chế",
      "Phòng Tổng hợp - Viện CNGTVT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB341",
      "Nguyễn Thu Trang",
      "Biên chế",
      "Phòng Tổng hợp - Viện CNGTVT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB673",
      "Vũ Thị Diễm Lệ",
      "Biên chế",
      "Phòng truyền thông và T.sinh - Viện đào tạo",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB671",
      "Phí Văn Tiến",
      "Biên chế",
      "Phòng tư vấn - T.sinh Viện đào tạo",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB502",
      "Lê Thị Ly",
      "Biên chế",
      "Phòng tư vấn - T.sinh Viện đào tạo",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB370",
      "Kiều Quang Thái",
      "Biên chế",
      "Phòng tư vấn - T.sinh Viện đào tạo",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB792",
      "Lê Thành Nam",
      "HĐ dài hạn",
      "Phòng tư vấn XD Viện CNGTVT",
      "V.07.01.03",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB362",
      "Phan Văn Thoại",
      "Biên chế",
      "Phòng tư vấn XD Viện CNGTVT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB443",
      "Vũ Quang Dũng",
      "Biên chế",
      "Phòng tư vấn XD Viện CNGTVT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB380",
      "Đồng Văn Phúc",
      "Biên chế",
      "Phòng tư vấn XD Viện CNGTVT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB404",
      "Phạm Hồng Quân",
      "Biên chế",
      "Phòng tư vấn XD Viện CNGTVT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB526",
      "Nguyễn Trung Kiên",
      "Biên chế",
      "Phòng tư vấn XD Viện CNGTVT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB336",
      "Vũ Thành Long",
      "Biên chế",
      "Phòng tư vấn XD Viện CNGTVT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB318",
      "Nguyễn Thanh Hưng",
      "Biên chế",
      "Phòng tư vấn XD Viện CNGTVT",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB413",
      "Đặng Thế Vinh",
      "Biên chế",
      "T.tâm Công nghệ BIM và AI - Viện CNGTVT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB395",
      "Cao Minh Quyền",
      "Biên chế",
      "T.tâm Công nghệ BIM và AI - Viện CNGTVT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB430",
      "Lê Minh Hải",
      "Biên chế",
      "T.tâm Công nghệ BIM và AI - Viện CNGTVT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB706",
      "Hoàng Thị Thu Hiền",
      "Biên chế",
      "T.tâm Công nghệ BIM và AI - Viện CNGTVT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB577",
      "Lý Hải Bằng",
      "Biên chế",
      "T.tâm Công nghệ BIM và AI - Viện CNGTVT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB677",
      "Nguyễn Thị Hà",
      "HĐ dài hạn",
      "Tạp chí Điện tử Khoa học và Công nghệ",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB416",
      "Lê Thu Hằng",
      "Biên chế",
      "Tạp chí Điện tử Khoa học và Công nghệ",
      "V01.004",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB51",
      "Vũ Duy Tùng",
      "Biên chế",
      "Tổ an ninh mạng - Cổng thông tin điện tử",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB446",
      "Lê Xuân Cường",
      "HĐ vụ việc",
      "Tổ Dịch vụ đời sống",
      "",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB571",
      "Phan Thị Minh",
      "HĐ dài hạn",
      "Tổ Dịch vụ đời sống",
      "V01.005",
      "700,000",
      "0",
      "700,000"
    ],
    [
      "T01.2025",
      "CB829",
      "Nguyễn Văn Dũng",
      "HĐ dài hạn",
      "Tổ Dịch vụ đời sống",
      "V01.005",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB108",
      "Trần Toàn",
      "HĐ 68",
      "Tổ Dịch vụ đời sống",
      "V01.005",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB471",
      "Phạm Mạnh Hùng",
      "HĐ dài hạn",
      "Tổ Dịch vụ đời sống",
      "V.05.02.08",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB477",
      "Lê Thị Hoài",
      "HĐ dài hạn",
      "Tổ Dịch vụ đời sống",
      "V01.004",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB97",
      "Nguyễn Diệu Hằng",
      "HĐ 68",
      "Tổ Dịch vụ đời sống",
      "V01.005",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB743",
      "Nguyễn Minh Quỳnh",
      "HĐ dài hạn",
      "Tổ Đào tạo - Trung tâm đào tạo TN",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB732",
      "Nguyễn Thị Thanh Thủy",
      "Biên chế",
      "Tổ Đào tạo - Trung tâm đào tạo TN",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB730",
      "Tống Duy Bình",
      "Biên chế",
      "Tổ Đào tạo - Trung tâm đào tạo TN",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB729",
      "Trịnh Minh Hoàng",
      "Biên chế",
      "Tổ Đào tạo - Trung tâm đào tạo TN",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB754",
      "Nguyễn Phương Thảo",
      "HĐ dài hạn",
      "Tổ Hành chính - Văn thư và Quản lý GD",
      "V01.005",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB580",
      "Nguyễn Thị Hạnh",
      "HĐ vụ việc",
      "Tổ Hành chính - Văn thư và Quản lý GD",
      "",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB69",
      "Nguyễn Thị Thục",
      "HĐ vụ việc",
      "Tổ Hành chính - Văn thư và Quản lý GD",
      "",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB594",
      "Nguyễn Thị Đang",
      "HĐ vụ việc",
      "Tổ Hành chính - Văn thư và Quản lý GD",
      "",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB841",
      "Đỗ Thị Phương Chi",
      "HĐ dài hạn",
      "Tổ Hành chính - Văn thư và Quản lý GD",
      "V01.005",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB753",
      "Lại Quang Đạo",
      "HĐ dài hạn",
      "Tổ Hành chính - Văn thư và Quản lý GD",
      "V01.003",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB661",
      "Nguyễn Thị Thanh Hiền",
      "HĐ dài hạn",
      "Tổ Hành chính - Văn thư và Quản lý GD",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB460",
      "Lê Thị Thu Hiền",
      "HĐ dài hạn",
      "Tổ Hành chính - Văn thư và Quản lý GD",
      "V01.005",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB767",
      "Nguyễn Trọng Trung",
      "Biên chế",
      "Tổ Hành chính - Văn thư và Quản lý GD",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB494",
      "Đinh Thị Hiền",
      "Biên chế",
      "Tổ Hành chính - Văn thư và Quản lý GD",
      "V02.007",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB189",
      "Đỗ Quốc Hùng",
      "Biên chế",
      "Tổ Hành chính - Văn thư và Quản lý GD",
      "V15.113",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB619",
      "Đào Mạnh Quyền",
      "Biên chế",
      "Tổ Hành chính - Văn thư và Quản lý GD",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB255",
      "Lã Quang Trung",
      "Biên chế",
      "Tổ phát triển và ứng dụng phần mềm",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB759",
      "Đoàn Thị Hồng Anh",
      "Biên chế",
      "Tổ phục vụ bạn đọc- Bảo quản TL",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB449",
      "Nguyễn Thị Thùy Linh",
      "Biên chế",
      "Tổ phục vụ bạn đọc- Bảo quản TL",
      "V.10.02.06",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB397",
      "Trương Ngọc Linh",
      "Biên chế",
      "Tổ phục vụ bạn đọc- Bảo quản TL",
      "V.10.02.06",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB46",
      "Ngô Thị Phương",
      "Biên chế",
      "Tổ phục vụ bạn đọc- Bảo quản TL",
      "V17.170",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB42",
      "Đỗ Thị Lan Hương",
      "Biên chế",
      "Tổ phục vụ bạn đọc- Bảo quản TL",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB44",
      "Nguyễn Thị Hồng Thương",
      "Biên chế",
      "Tổ phục vụ bạn đọc- Bảo quản TL",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB40",
      "Nguyễn Thị Vân",
      "Biên chế",
      "Tổ phục vụ bạn đọc- Bảo quản TL",
      "V17.170",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB658",
      "Nguyễn Văn Lịch",
      "HĐ dài hạn",
      "Tổ Quản lý Thiết bị Điện nước",
      "V01.005",
      "2,300,000",
      "0",
      "2,300,000"
    ],
    [
      "T01.2025",
      "CB835",
      "Tống Đình Duy",
      "HĐ dài hạn",
      "Tổ Quản lý Thiết bị Điện nước",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB650",
      "Quách Hiền Hòa",
      "HĐ dài hạn",
      "Tổ Quản lý Thiết bị Điện nước",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB625",
      "Nguyễn Thanh Tuấn",
      "Biên chế",
      "Tổ Quản lý Thiết bị Điện nước",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB83",
      "Đinh Ngọc Quang",
      "HĐ dài hạn",
      "Tổ Quản lý Thiết bị Điện nước",
      "V.05.02.08",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB164",
      "Bùi Ngọc ánh",
      "Biên chế",
      "Tổ Quản lý Thiết bị Điện nước",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB428",
      "Nguyễn Tuấn Ngọc",
      "Biên chế",
      "Tổ Quản lý Thiết bị Điện nước",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB655",
      "Nguyễn Trường Trung",
      "Biên chế",
      "Tổ Quản lý Thiết bị Điện nước",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB263",
      "Nguyễn Anh Dũng",
      "Biên chế",
      "Tổ Quản lý Thiết bị Điện nước",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB492",
      "Phùng Thị Hoàng Yến",
      "Biên chế",
      "Tổ Quản lý Thiết bị Điện nước",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB81",
      "Vũ Tiến Dũng",
      "HĐ 68",
      "Tổ Quản lý Thiết bị Điện nước",
      "V01.005",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB593",
      "Khúc Duy Quang",
      "Biên chế",
      "Tổ Quản trị mạng và thiết bị",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB468",
      "Phạm Đức Huy",
      "HĐ dài hạn",
      "Tổ Quản trị mạng và thiết bị",
      "V.05.02.08",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB529",
      "Trần Thanh Hà",
      "Biên chế",
      "Tổ Quản trị mạng và thiết bị",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB451",
      "Phùng Văn Thuần",
      "Biên chế",
      "Tổ Quản trị mạng và thiết bị",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB47",
      "Trần Việt Vương",
      "Biên chế",
      "Tổ Quản trị mạng và thiết bị",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB254",
      "Nguyễn Văn Thắng",
      "Biên chế",
      "Tổ Quản trị mạng và thiết bị",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB646",
      "Trần Văn Tâm",
      "Biên chế",
      "Tổ Quản trị mạng và thiết bị",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB830",
      "Đỗ Xuân Thêm",
      "HĐ vụ việc",
      "Tổ Văn phòng - T.tâm đào tạo TN",
      "",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB812",
      "Triệu Thị Phương",
      "HĐ vụ việc",
      "Tổ Văn phòng - T.tâm đào tạo TN",
      "",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB811",
      "Âu Đình Viên",
      "HĐ vụ việc",
      "Tổ Văn phòng - T.tâm đào tạo TN",
      "",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB809",
      "Phạm Văn Lộ",
      "HĐ vụ việc",
      "Tổ Văn phòng - T.tâm đào tạo TN",
      "",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB807",
      "Nguyễn Thị Nguyệt",
      "HĐ vụ việc",
      "Tổ Văn phòng - T.tâm đào tạo TN",
      "",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB727",
      "Nguyễn Văn Triệu",
      "HĐ dài hạn",
      "Tổ Văn phòng - T.tâm đào tạo TN",
      "V01.005",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB725",
      "Nguyễn Sỹ Nghiệp",
      "Biên chế",
      "Tổ Văn phòng - T.tâm đào tạo TN",
      "V01.011",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB723",
      "Nguyễn Thị Thu Trang",
      "HĐ dài hạn",
      "Tổ Văn phòng - T.tâm đào tạo TN",
      "V02.007",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB758",
      "Nông Thị Lan Hương",
      "Biên chế",
      "Tổ Văn phòng - T.tâm đào tạo TN",
      "V06.031",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB724",
      "Nguyễn Đăng Nam",
      "Biên chế",
      "Tổ Văn phòng - T.tâm đào tạo TN",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB726",
      "Thân Hồng Thắng",
      "Biên chế",
      "Tổ Văn phòng - T.tâm đào tạo TN",
      "V06.031",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB810",
      "Nguyễn Thị Hoa",
      "HĐ vụ việc",
      "Tổ Văn phòng - T.tâm đào tạo TN",
      "",
      "0",
      "0",
      "0"
    ],
    [
      "T01.2025",
      "CB604",
      "Cù Thị Hiền",
      "Biên chế",
      "Tổ văn phòng - Viện Cơ khí động lực",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB208",
      "Phạm Thị Thu Hằng",
      "Biên chế",
      "Tổ văn phòng - Viện Cơ khí động lực",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB177",
      "Nguyễn Thị Nam",
      "Biên chế",
      "Tổ văn phòng - Viện Cơ khí động lực",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB187",
      "Đỗ Ngọc Tiến",
      "Biên chế",
      "Tổ văn phòng - Viện Cơ khí động lực",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB163",
      "Nguyễn Quang Anh",
      "Biên chế",
      "Tổ văn phòng - Viện Cơ khí động lực",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB666",
      "Nguyễn Thị Ngọc Anh",
      "Biên chế",
      "Tổ văn phòng khoa",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB805",
      "Trần Khánh",
      "Biên chế",
      "Tổ văn phòng khoa",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB511",
      "Đặng An Phương",
      "HĐ dài hạn",
      "Tổ văn phòng khoa",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB17",
      "Chu Thị Thu Hằng",
      "Biên chế",
      "Tổ văn phòng khoa",
      "V15.113",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB218",
      "Nguyễn Việt Thắng",
      "Biên chế",
      "Tổ văn phòng khoa",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB225",
      "Chu Thị Bích Hạnh",
      "Biên chế",
      "Tổ văn phòng khoa",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB768",
      "Tiền Văn Mạnh",
      "Biên chế",
      "Tổ Văn phòng Khoa CNTT",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB603",
      "Ngô Việt Phương",
      "Biên chế",
      "Tổ Văn phòng Khoa CNTT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB487",
      "Trần Duy Dũng",
      "Biên chế",
      "Tổ Văn phòng Khoa CNTT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB440",
      "Cao Xuân Hoàng",
      "Biên chế",
      "Tổ Văn phòng Khoa CNTT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB313",
      "Triệu Đình Mạnh",
      "Biên chế",
      "Tổ Văn phòng Khoa CNTT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB444",
      "Đỗ Xuân Thu",
      "Biên chế",
      "Tổ Văn phòng Khoa CNTT",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB277",
      "Lê Chí Luận",
      "Biên chế",
      "Tổ Văn phòng Khoa CNTT",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB527",
      "Đoàn Thị Thanh Thủy",
      "Biên chế",
      "Tổ Văn phòng Khoa Công trình",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB314",
      "Phùng Bá Thắng",
      "Biên chế",
      "Tổ Văn phòng Khoa Công trình",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB818",
      "Nguyễn Thị Thu Hiền",
      "HĐ dài hạn",
      "Tổ Văn phòng Khoa Kinh tế vận tải",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB755",
      "Lê Vĩnh Kiên",
      "HĐ dài hạn",
      "Tổ Văn phòng Khoa Kinh tế vận tải",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB207",
      "Phan Trung Nghĩa",
      "Biên chế",
      "Tổ Văn phòng Khoa Kinh tế vận tải",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB206",
      "Lê Thu Hiền",
      "Biên chế",
      "Tổ Văn phòng Khoa Kinh tế vận tải",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB221",
      "Vũ Thị Hải Anh",
      "Biên chế",
      "Tổ Văn phòng Khoa Kinh tế vận tải",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB209",
      "Hoàng Văn Lâm",
      "Biên chế",
      "Tổ Văn phòng Khoa Kinh tế vận tải",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB204",
      "Hoàng Thị Hồng Lê",
      "Biên chế",
      "Tổ Văn phòng Khoa Kinh tế vận tải",
      "V.07.01.01",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB78",
      "Nguyễn Duy Khang",
      "HĐ 68",
      "Tổ Xe máy - Bảo vệ Phòng Hành chính",
      "V01.005",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB700",
      "Trần Đức Long",
      "HĐ 68",
      "Tổ Xe máy - Bảo vệ Phòng Hành chính",
      "V01.010",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB629",
      "Đào Văn Nam",
      "HĐ dài hạn",
      "Tổ Xe máy - Bảo vệ Phòng Hành chính",
      "V01.005",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB110",
      "Đỗ Công Khanh",
      "HĐ dài hạn",
      "Tổ Xe máy - Bảo vệ Phòng Hành chính",
      "V01.005",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB79",
      "Nguyễn Ngọc Giao",
      "HĐ 68",
      "Tổ Xe máy - Bảo vệ Phòng Hành chính",
      "V01.005",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB457",
      "Lê Tiến Huynh",
      "HĐ dài hạn",
      "Tổ Xe máy - Bảo vệ Phòng Hành chính",
      "V01.005",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB434",
      "Nguyễn Văn Tuân",
      "HĐ dài hạn",
      "Tổ Xe máy - Bảo vệ Phòng Hành chính",
      "V01.005",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB59",
      "Nguyễn Văn Huynh",
      "HĐ 68",
      "Tổ Xe máy - Bảo vệ Phòng Hành chính",
      "V01.005",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB55",
      "Nguyễn Văn Minh",
      "Biên chế",
      "Trạm Y tế",
      "V16.119",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB54",
      "Đàm Thị Dung",
      "Biên chế",
      "Trạm Y tế",
      "V16.135",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB53",
      "Hà Mạnh Hùng",
      "Biên chế",
      "Trạm Y tế",
      "V16.119",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB601",
      "Hoàng Vũ",
      "Biên chế",
      "Trung tâm đường sắt tốc độ cao",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB203",
      "Bùi Xuân Tùng",
      "Biên chế",
      "Trung tâm thực hành cơ khí - Viện Cơ khí",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB484",
      "Nguyễn Hữu Chất",
      "HĐ dài hạn",
      "Trung tâm thực hành cơ khí - Viện Cơ khí",
      "V.05.02.07",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB261",
      "Đỗ Duy Hà",
      "Biên chế",
      "Trung tâm thực hành cơ khí - Viện Cơ khí",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB476",
      "Trần Nho Thái",
      "Biên chế",
      "Trung tâm thực hành cơ khí - Viện Cơ khí",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB196",
      "Nguyễn Văn Nhu",
      "Biên chế",
      "Trung tâm thực hành cơ khí - Viện Cơ khí",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB194",
      "Nguyễn Xuân Thắng",
      "Biên chế",
      "Trung tâm thực hành cơ khí - Viện Cơ khí",
      "V15.112",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB191",
      "Nguyễn Diệp Thành",
      "Biên chế",
      "Trung tâm thực hành cơ khí - Viện Cơ khí",
      "V.07.01.02",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB715",
      "Đàm Cẩm Vân",
      "Biên chế",
      "V.phòng viện Viện đổi mới sáng tạo",
      "V01.003",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB751",
      "Lê Thị Minh Hoa",
      "HĐ dài hạn",
      "V.phòng viện Viện đổi mới sáng tạo",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB749",
      "Ngô Thị Thu Hương",
      "HĐ dài hạn",
      "V.phòng viện Viện đổi mới sáng tạo",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB609",
      "Trần Văn Quân",
      "Biên chế",
      "Văn phòng viện - Viện đào tạo và HTQT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ],
    [
      "T01.2025",
      "CB473",
      "Nguyễn Long Khánh",
      "Biên chế",
      "Văn phòng viện - Viện đào tạo và HTQT",
      "V.07.01.03",
      "1,000,000",
      "0",
      "1,000,000"
    ]
  ];
  var x = printAnCa('T01.2025');

  Logger.log(x)
}


/**
 * Cập nhật trạng thái tính lương trong sheet DanhMucThang
 * @param {string} month - Giá trị tháng cần tìm (vd: "T08.2025")
 * @param {string} newStatus - Giá trị mới cần cập nhật (vd: "Chưa tính lương", "Đã tạo thuyết minh")
 * @returns {string} - Trả về 'success' nếu cập nhật thành công
 */
function updateStatusTinhLuong(month, newStatus) {
  // Tìm dòng cuối cùng của cột H (cột số 1)
  const lastDMRow = findLastRowInColumn(sheetDanhMucThang, 1)
  Logger.log("Dòng cuối: " + lastDMRow)

  // Lấy dữ liệu từ A → H theo số dòng thực tế
  const dmData = sheetDanhMucThang.getRange(1, 1, lastDMRow, 14).getValues();
  Logger.log("dmData: " + dmData)
  // Duyệt từ dưới lên, tìm tháng trong cột B (index 1)
  for (let i = dmData.length - 1; i >= 0; i--) {
    const rowMonth = dmData[i][1];
    if (rowMonth == month) {
      // Cập nhật giá trị mới vào cột M (index 13)
      sheetDanhMucThang.getRange(i + 1, 13).setValue(newStatus);
      return 'success';
    }
  }

  throw new Error(`Không tìm thấy tháng "${month}" trong DanhMucThang`);
}
function findLastRowInColumn(sheet, col) {
  const values = sheet.getRange(1, col, sheet.getLastRow(), 1).getValues();
  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i][0] !== '' && values[i][0] !== null) {
      return i + 1;
    }
  }
  return 0; // không tìm thấy
}

function testUpdate() {
  var month = "T01.2025";
  var newStatus = "Đã tạo";
  Logger.log(updateStatusTinhLuong(month, newStatus))
}



function test1() {
  const x = delAllData('T01.2025');
  Logger.log(x)
}
function test2() {
  updateStatusTinhLuong('T01.2025', 'Chưa tính lương');
}


function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "Web App đang hoạt động."
  })).setMimeType(ContentService.MimeType.JSON);
}
