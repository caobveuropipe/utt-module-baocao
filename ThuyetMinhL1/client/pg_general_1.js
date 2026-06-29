const userEmail = Session.getActiveUser().getEmail();
const sheetPermisson = SpreadsheetApp.openById(LibraryDigiCore.idFilePermisson).getSheetByName('PermissionRole');
const rngPermission = sheetPermisson.getRange(2, 1, sheetPermisson.getLastRow() - 1, 5); // từ A2:E
const dataPermission = rngPermission.getValues();
const url_api_doGet = 'https://script.google.com/macros/s/AKfycbyiwCkkxCONZ483eabvuOz-ssP0OGffwAx3Hvv7tldqxj-th4ZY7fON-LNMqMGh4yEDsg/exec';
const url_api_doPost = 'https://script.google.com/macros/s/AKfycbyi8Z7aw3MHJeLuI_gj-7cOP_d95GjiPV3MXwTz1EMKWOttLyzs4IhmboCoz2z8e0YC/exec';

function doGet(e){
  var checked = capQuyen(2);
  if(checked) {
    return render('pg_general_2');
  }
}

function capQuyen(col){
  var output = false;
  dataPermission.forEach(function(v){
    if(v[col] == userEmail){output = true};
  });
  return output;
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

var Route = {};
Route.path = function(route,callback){
  Route[route] = callback;
}

function render(file,argsObject){
  var tmpHtml = HtmlService.createTemplateFromFile(file);

  if(argsObject){
    var keys = Object.keys(argsObject);

    keys.forEach(function(key){
      tmpHtml[key] = argsObject[key];
    });
  }
  
  return tmpHtml.evaluate().setTitle('THUYẾT MINH LƯƠNG 1 - utt.edu.vn/thuyetminhluong1').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
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
  for (let i = 0; i < dataPermission.length; i++) {
    const row = dataPermission[i];
    
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

