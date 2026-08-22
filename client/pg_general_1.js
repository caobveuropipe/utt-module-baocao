const userEmail = Session.getActiveUser().getEmail();
const url_api_doGet = 'https://script.google.com/macros/s/AKfycbydpKq7DJJ5aiuQuHNgVRfrZSY13m2dLjkfDaWc5v_h_UiHll-MnZQseXzhQe5up_a8Mw/exec';
const url_api_doPost = 'https://script.google.com/macros/s/AKfycbyi8Z7aw3MHJeLuI_gj-7cOP_d95GjiPV3MXwTz1EMKWOttLyzs4IhmboCoz2z8e0YC/exec';

// ===== HELPER TOKEN & SERVICE-TO-SERVICE AUTH GATE =====
function getCoreApiToken() {
  try {
    return PropertiesService.getScriptProperties().getProperty('API_SECRET_TOKEN') || '';
  } catch (e) {
    Logger.log("Lỗi lấy API_SECRET_TOKEN: " + e.message);
    return '';
  }
}

/**
 * Helper gửi request tập trung sang Core API, tự động đính kèm API_SECRET_TOKEN
 */
function fetchCoreApi(params = {}) {
  const token = getCoreApiToken();
  const queryParts = [];
  if (token) {
    queryParts.push(`token=${encodeURIComponent(token)}`);
  }
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== '') {
      queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
    }
  }
  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const fullUrl = `${url_api_doGet}${queryString}`;

  try {
    const response = UrlFetchApp.fetch(fullUrl, { method: 'get', muteHttpExceptions: true });
    const text = response.getContentText();
    const result = JSON.parse(text);
    return result;
  } catch (error) {
    Logger.log(`Lỗi fetchCoreApi (${params.type || 'default'}): %s`, error.message);
    return { status: "error", message: error.message };
  }
}

// ===== PERMISSION & CACHE MANAGEMENT =====
let _dataPermission = null;
function getDataPermission() {
  if (_dataPermission) return _dataPermission;
  
  const cache = CacheService.getScriptCache();
  const CACHE_KEY = "perm_matrix_all";
  const cached = cache.get(CACHE_KEY);
  if (cached) {
    try {
      _dataPermission = JSON.parse(cached);
      return _dataPermission;
    } catch (e) {
      Logger.log("Lỗi parse cached permissions: " + e.message);
    }
  }

  try {
    const sheetPermisson = SpreadsheetApp.openById(LibraryDigiCore.idFilePermisson).getSheetByName('PermissionRole');
    const lastRow = sheetPermisson.getLastRow();
    if (lastRow <= 1) {
      _dataPermission = [];
    } else {
      _dataPermission = sheetPermisson.getRange(2, 1, lastRow - 1, 5).getValues();
      cache.put(CACHE_KEY, JSON.stringify(_dataPermission), 900); // Cache 15 phút
    }
    return _dataPermission;
  } catch (e) {
    console.error("Error loading permissions:", e);
    return [];
  }
}

function capQuyen(col) {
  if (!userEmail) return false;
  var output = false;
  const data = getDataPermission();
  if (data && Array.isArray(data)) {
    data.forEach(function (v) {
      if (v[col] == userEmail) { output = true };
    });
  }
  return output;
}

function userRole() {
  if (!userEmail) return '';
  const cache = CacheService.getScriptCache();
  const USER_ROLE_KEY = "user_role_" + Utilities.base64Encode(userEmail);
  const cachedRole = cache.get(USER_ROLE_KEY);
  if (cachedRole) return cachedRole;

  const data = getDataPermission();
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row[2] === userEmail) {
      const roleStr = row[4] || '';
      const filteredRoles = roleStr
        .split(';')
        .filter(role => role.startsWith('Tính lương-'))
        .join(';');
      const resultRole = filteredRoles + ';';
      cache.put(USER_ROLE_KEY, resultRole, 900); // Cache 15 phút
      return resultRole;
    }
  }
  return '';
}

// ===== SERVER-SIDE DATA INJECTION (SSR) =====
function getInitialMetadata(forceRefresh = false) {
  const cache = CacheService.getScriptCache();
  const CACHE_METADATA_KEY = "client_cache_metadata";

  if (!forceRefresh) {
    const cached = cache.get(CACHE_METADATA_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        Logger.log("Lỗi parse client_cache_metadata: " + e.message);
      }
    }
  }

  const result = fetchCoreApi();
  if (result && result.status === 'success') {
    const metadata = {
      status: 'success',
      listThang: result.listThang || [],
      listDiaPhuong: result.listDiaPhuong || ["Hà Nội", "Phú Thọ"],
      NgayCongChuan: result.NgayCongChuan || 0,
      LuongCoBan: result.LuongCoBan || 0,
      TienAnCa: result.TienAnCa || 0,
      dataStatusTinhLuong: result.dataStatusTinhLuong || []
    };
    try {
      cache.put(CACHE_METADATA_KEY, JSON.stringify(metadata), 3600); // Cache 1 giờ
    } catch (err) {
      Logger.log("Lỗi ghi client_cache_metadata: " + err.message);
    }
    return metadata;
  }

  return {
    status: 'error',
    message: result?.message || 'Không thể lấy dữ liệu khởi tạo',
    listThang: [],
    listDiaPhuong: ["Hà Nội", "Phú Thọ"]
  };
}

function doGet(e) {
  // 1. Kiểm tra session email & quyền truy cập
  if (!userEmail || !capQuyen(2)) {
    return HtmlService.createHtmlOutput(
      `<div style="font-family: Arial, sans-serif; text-align: center; padding: 60px 20px; background: #fafafa; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); max-width: 520px; border-top: 5px solid #e53935;">
          <h2 style="color: #c62828; margin-top: 0; font-size: 22px;">⚠️ TRUY CẬP BỊ TỪ CHỐI</h2>
          <p style="color: #444; font-size: 14.5px; line-height: 1.6; margin: 15px 0;">
            Tài khoản <strong>${userEmail || 'Chưa đăng nhập / Ẩn danh'}</strong> chưa được phân quyền truy cập hệ thống <strong>Đi Kho Bạc & Hạch Toán</strong>.
          </p>
          <p style="color: #777; font-size: 13px; margin-bottom: 0;">
            Vui lòng liên hệ quản trị viên để được cấp quyền <code>Tính lương-Xem</code>.
          </p>
        </div>
      </div>`
    ).setTitle('Không có quyền truy cập').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // 2. Lấy metadata nạp sẵn cho Client (SSR)
  const initialData = getInitialMetadata();

  // 3. Render giao diện
  return render('pg_general_2', {
    url_api_doGet: url_api_doGet,
    url_api_doPost: url_api_doPost,
    userEmail: userEmail,
    initialData: JSON.stringify(initialData)
  });
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

/**
 * RPC gọi từ Client khi cần nạp hoặc làm mới dữ liệu
 */
function pg1_ed1_getAllData(forceRefresh = false) {
  const strUserRole = userRole();
  const quyenXem = 'Tính lương-Xem;';

  if (!strUserRole.includes(quyenXem)) {
    return { status: 'no permission' };
  }

  if (forceRefresh) {
    const cache = CacheService.getScriptCache();
    cache.remove("client_cache_metadata");
    cache.remove("perm_matrix_all");
    if (userEmail) cache.remove("user_role_" + Utilities.base64Encode(userEmail));
    _dataPermission = null;
  }

  return getInitialMetadata(forceRefresh);
}

// ===== CÁC PROXY CALL SANG CORE API (TỰ ĐỘNG ĐÍNH KÈM TOKEN) =====
function pg1_ed1_getPrintDataCk(monthStr, location = 'All', isTreoLuong = false) {
  return fetchCoreApi({
    type: 'getPrintDataCk',
    month: monthStr,
    location: location,
    isTreoLuong: isTreoLuong
  });
}

function pg1_ed1_getPrintDataTongHopLuong(monthStr, location = 'All') {
  return fetchCoreApi({
    type: 'getPrintDataTongHopLuong',
    month: monthStr,
    location: location
  });
}

function pg1_ed1_getPrintDataTongHopBaoHiem(monthStr, location = 'All') {
  return fetchCoreApi({
    type: 'getPrintDataTongHopBaoHiem',
    month: monthStr,
    location: location
  });
}

function pg1_ed1_getPrintDataTongHopKhoanTru(monthStr, location = 'All') {
  return fetchCoreApi({
    type: 'getPrintDataTongHopKhoanTru',
    month: monthStr,
    location: location
  });
}

function pg1_ed1_getPrintDataTongHopKPCD(monthStr, location = 'All') {
  return fetchCoreApi({
    type: 'getPrintDataTongHopKPCD',
    month: monthStr,
    location: location
  });
}

function pg1_ed1_getPrintDataHachToanBaoHiem(monthStr, location = 'All', addContent = '', addAmount = 0) {
  const params = {
    type: 'getPrintDataHachToanBaoHiem',
    month: monthStr,
    location: location
  };
  if (addContent && addAmount > 0) {
    params.addContent = addContent;
    params.addAmount = addAmount;
  }
  return fetchCoreApi(params);
}

function pg1_ed1_getPrintDataHachToanKPCD(monthStr, location = 'All') {
  return fetchCoreApi({
    type: 'getPrintDataHachToanKPCD',
    month: monthStr,
    location: location
  });
}

function pg1_ed1_getPrintDataPhanBoLuongBHXH(monthStr, location = 'All') {
  return fetchCoreApi({
    type: 'getPrintDataPhanBoLuongBHXH',
    month: monthStr,
    location: location
  });
}

function pg1_ed1_getPrintDataHachToanLuongVaTruyLinh(monthStr, location = 'All') {
  return fetchCoreApi({
    type: 'getPrintDataHachToanLuongVaTruyLinh',
    month: monthStr,
    location: location
  });
}

function pg1_ed1_getPrintDataTruKPCDVaCacQuy(monthStr, location = 'All') {
  return fetchCoreApi({
    type: 'getPrintDataTruKPCDVaCacQuy',
    month: monthStr,
    location: location
  });
}

function pg1_ed1_getPrintDanhMucDonVi(monthStr) {
  return fetchCoreApi({
    type: 'getPrintDanhMucDonVi',
    month: monthStr
  });
}

function proxyExportExcel(monthStr, location = 'All') {
  const strUserRole = userRole();
  const quyenXem = 'Tính lương-Xem;';
  if (!strUserRole.includes(quyenXem)) {
    return { status: 'no permission', message: 'Bạn không có quyền thực hiện chức năng này.' };
  }

  return fetchCoreApi({
    type: 'exportTongHopExcel',
    month: monthStr,
    location: location
  });
}
