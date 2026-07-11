const userEmail = Session.getActiveUser().getEmail();
const url_api_doGet = 'https://script.google.com/macros/s/AKfycbydpKq7DJJ5aiuQuHNgVRfrZSY13m2dLjkfDaWc5v_h_UiHll-MnZQseXzhQe5up_a8Mw/exec';
const url_api_doPost = 'https://script.google.com/macros/s/AKfycbyi8Z7aw3MHJeLuI_gj-7cOP_d95GjiPV3MXwTz1EMKWOttLyzs4IhmboCoz2z8e0YC/exec';

let _dataPermission = null;
function getDataPermission() {
  if (_dataPermission) return _dataPermission;
  try {
    const sheetPermisson = SpreadsheetApp.openById(LibraryDigiCore.idFilePermisson).getSheetByName('PermissionRole');
    const lastRow = sheetPermisson.getLastRow();
    if (lastRow <= 1) return [];
    _dataPermission = sheetPermisson.getRange(2, 1, lastRow - 1, 5).getValues();
    return _dataPermission;
  } catch (e) {
    console.error("Error loading permissions:", e);
    return [];
  }
}

function doGet(e) {
  var checked = capQuyen(2);
  if (checked) {
    return render('pg_general_2', {
      url_api_doGet: url_api_doGet,
      url_api_doPost: url_api_doPost
    });
  }
}

function capQuyen(col) {
  var output = false;
  const data = getDataPermission();
  if (data && Array.isArray(data)) {
    data.forEach(function (v) {
      if (v[col] == userEmail) { output = true };
    });
  }
  return output;
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

var Route = {};
Route.path = function (route, callback) {
  Route[route] = callback;
}

function render(file, argsObject) {
  var tmpHtml = HtmlService.createTemplateFromFile(file);

  if (argsObject) {
    var keys = Object.keys(argsObject);

    keys.forEach(function (key) {
      tmpHtml[key] = argsObject[key];
    });
  }

  return tmpHtml.evaluate().setTitle('TỔNG HỢP ĐỔ TÀI KHOẢN, ĐI KHO BẠC VÀ HẠCH TOÁN').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


function pg1_ed1_getAllData() {

  const strUserRole = userRole();
  const quyenXem = 'Tính lương-Xem;';

  if (!strUserRole.includes(quyenXem)) {
    return {
      status: 'no permission'
    };
  }

  try {
    const response = UrlFetchApp.fetch(url_api_doGet, { method: 'get' });
    const result = JSON.parse(response.getContentText());

    if (result.status === 'success') {
      return {
        status: 'success',
        listThang: result.listThang || [],
        NgayCongChuan: result.NgayCongChuan || 0,
        LuongCoBan: result.LuongCoBan || 0,
        TienAnCa: result.TienAnCa || 0,
        dataStatusTinhLuong: result.dataStatusTinhLuong || []
      };
    } else {
      throw new Error("Không thể tải dữ liệu: " + (result?.message || "Lỗi không xác định"));
    }
  } catch (error) {
    return {
      status: "error",
      message: error.message,
      listThang: [],
      NgayCongChuan: 0,
      LuongCoBan: 0,
      TienAnCa: 0,
      dataStatusTinhLuong: []
    };
  }
}


function userRole() {
  const data = getDataPermission();
  for (let i = 0; i < data.length; i++) {
    const row = data[i];

    if (row[2] === userEmail) {       // Kiểm tra tên ở cột 3
      const roleStr = row[4] || '';   // Trả về giá trị ở cột 5 và dừng vòng lặp

      // Lọc chỉ lấy những quyền liên quan đến "Đối tác"
      const filteredRoles = roleStr
        .split(';')
        .filter(role => role.startsWith('Tính lương-'))
        .join(';');

      return filteredRoles + ';';     // Trả về chuỗi đã lọc, thêm dấu ; cuối
    }
  }

  return '';                          // Nếu không tìm thấy, trả về chuỗi rỗng
}


function pg1_ed1_getPrintDataCk(monthStr, location = 'All') {
  try {
    const url = `${url_api_doGet}?type=getPrintDataCk&month=${encodeURIComponent(monthStr)}&location=${encodeURIComponent(location)}`;
    const response = UrlFetchApp.fetch(url, { method: 'get' });
    return JSON.parse(response.getContentText());
  } catch (error) {
    return { status: "error", message: error.message };
  }
}

function pg1_ed1_getPrintDataTongHopLuong(monthStr, location = 'All') {
  try {
    const url = `${url_api_doGet}?type=getPrintDataTongHopLuong&month=${encodeURIComponent(monthStr)}&location=${encodeURIComponent(location)}`;
    const response = UrlFetchApp.fetch(url, { method: 'get' });
    return JSON.parse(response.getContentText());
  } catch (error) {
    return { status: "error", message: error.message };
  }
}

function pg1_ed1_getPrintDataTongHopBaoHiem(monthStr, location = 'All') {
  try {
    const url = `${url_api_doGet}?type=getPrintDataTongHopBaoHiem&month=${encodeURIComponent(monthStr)}&location=${encodeURIComponent(location)}`;
    const response = UrlFetchApp.fetch(url, { method: 'get' });
    return JSON.parse(response.getContentText());
  } catch (error) {
    return { status: "error", message: error.message };
  }
}

function pg1_ed1_getPrintDataTongHopKhoanTru(monthStr, location = 'All') {
  try {
    const url = `${url_api_doGet}?type=getPrintDataTongHopKhoanTru&month=${encodeURIComponent(monthStr)}&location=${encodeURIComponent(location)}`;
    const response = UrlFetchApp.fetch(url, { method: 'get' });
    return JSON.parse(response.getContentText());
  } catch (error) {
    return { status: "error", message: error.message };
  }
}

function pg1_ed1_getPrintDataTongHopKPCD(monthStr, location = 'All') {
  try {
    const url = `${url_api_doGet}?type=getPrintDataTongHopKPCD&month=${encodeURIComponent(monthStr)}&location=${encodeURIComponent(location)}`;
    const response = UrlFetchApp.fetch(url, { method: 'get' });
    return JSON.parse(response.getContentText());
  } catch (error) {
    return { status: "error", message: error.message };
  }
}

function pg1_ed1_getPrintDataHachToanBaoHiem(monthStr, location = 'All') {
  try {
    const url = `${url_api_doGet}?type=getPrintDataHachToanBaoHiem&month=${encodeURIComponent(monthStr)}&location=${encodeURIComponent(location)}`;
    const response = UrlFetchApp.fetch(url, { method: 'get' });
    return JSON.parse(response.getContentText());
  } catch (error) {
    return { status: "error", message: error.message };
  }
}

function pg1_ed1_getPrintDataHachToanKPCD(monthStr, location = 'All') {
  try {
    const url = `${url_api_doGet}?type=getPrintDataHachToanKPCD&month=${encodeURIComponent(monthStr)}&location=${encodeURIComponent(location)}`;
    const response = UrlFetchApp.fetch(url, { method: 'get' });
    return JSON.parse(response.getContentText());
  } catch (error) {
    return { status: "error", message: error.message };
  }
}

function pg1_ed1_getPrintDataPhanBoLuongBHXH(monthStr, location = 'All') {
  try {
    const url = `${url_api_doGet}?type=getPrintDataPhanBoLuongBHXH&month=${encodeURIComponent(monthStr)}&location=${encodeURIComponent(location)}`;
    const response = UrlFetchApp.fetch(url, { method: 'get' });
    return JSON.parse(response.getContentText());
  } catch (error) {
    return { status: "error", message: error.message };
  }
}

function pg1_ed1_getPrintDataHachToanLuongVaTruyLinh(monthStr, location = 'All') {
  try {
    const url = `${url_api_doGet}?type=getPrintDataHachToanLuongVaTruyLinh&month=${encodeURIComponent(monthStr)}&location=${encodeURIComponent(location)}`;
    const response = UrlFetchApp.fetch(url, { method: 'get' });
    return JSON.parse(response.getContentText());
  } catch (error) {
    return { status: "error", message: error.message };
  }
}

function pg1_ed1_getPrintDataTruKPCDVaCacQuy(monthStr, location = 'All') {
  try {
    const url = `${url_api_doGet}?type=getPrintDataTruKPCDVaCacQuy&month=${encodeURIComponent(monthStr)}&location=${encodeURIComponent(location)}`;
    const response = UrlFetchApp.fetch(url, { method: 'get' });
    return JSON.parse(response.getContentText());
  } catch (error) {
    return { status: "error", message: error.message };
  }
}

function pg1_ed1_getPrintDanhMucDonVi() {
  try {
    const url = `${url_api_doGet}?type=getPrintDanhMucDonVi`;
    const response = UrlFetchApp.fetch(url, { method: 'get' });
    return JSON.parse(response.getContentText());
  } catch (error) {
    return { status: "error", message: error.message };
  }
}

/**
 * Proxy xuất file Excel Base64
 * Lấy token bí mật từ PropertiesService để client không thấy
 */
function proxyExportExcel(monthStr, location = 'All') {
  const strUserRole = userRole();
  const quyenXem = 'Tính lương-Xem;';
  if (!strUserRole.includes(quyenXem)) {
    return { status: 'no permission', message: 'Bạn không có quyền thực hiện chức năng này.' };
  }

  try {
    const validToken = PropertiesService.getScriptProperties().getProperty('API_SECRET_TOKEN') || '';
    const url = `${url_api_doGet}?type=exportTongHopExcel&month=${encodeURIComponent(monthStr)}&location=${encodeURIComponent(location)}&token=${encodeURIComponent(validToken)}`;
    
    // Gửi request lên server doGet của dự án
    const response = UrlFetchApp.fetch(url, { method: 'get' });
    return JSON.parse(response.getContentText());
  } catch (error) {
    return { status: "error", message: "Lỗi proxy xuất Excel: " + error.message };
  }
}
