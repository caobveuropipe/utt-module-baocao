function modal_dataluong_1_getDataLuongAnCa(month, type) {

  const strUserRole = userRole();
  const quyenXem = 'Tính lương-Xem;';

  if (!strUserRole.includes(quyenXem)) {
    return {
      status: 'no permission'
    };
  }

  const urlGetType = url_api_doGet + `?month=${month}&type=${type}`;

  try {
    const response = UrlFetchApp.fetch(urlGetType, { method: 'get' });
    const result = JSON.parse(response.getContentText());

    if (result.status === 'success') {
      return {
        status: 'success',
        dataLuongAnCa: result.dataLuongAnCa || []
      };
    } else {
      throw new Error("Không thể tải dữ liệu: " + (result?.message || "Lỗi không xác định"));
    }
  } catch (error) {
    return {
      status: "error",
      message: error.message,
      dataLuongAnCa: []
    };
  }
}

function modal_dataluong_1_tinhLuongAnCa(month, type) {

  const strUserRole = userRole();
  const quyenXem = 'Tính lương-Xem;';

  if (!strUserRole.includes(quyenXem)) {
    return {
      status: 'no permission'
    };
  }

  const urlGetType = url_api_doGet + `?month=${month}&type=${type}`;

  try {
    const response = UrlFetchApp.fetch(urlGetType, { method: 'get' });
    const result = JSON.parse(response.getContentText());

    if (result.status === 'success') {
      return {
        status: 'success',
        dataLuongAnCa: result.dataLuongAnCa || []
      };
    } else {
      throw new Error("Không thể tải dữ liệu: " + (result?.message || "Lỗi không xác định"));
    }
  } catch (error) {
    return {
      status: "error",
      message: error.message,
      dataLuongAnCa: []
    };
  }
}


//Xóa tính lương và chốt nhân sự
function modal_dataluong_1_xoaDuLieu(month){
  const strUserRole = userRole();
  const quyenXoa = 'Tính lương-Xóa;';

  if (!strUserRole.includes(quyenXoa)) {
    return {
      status: 'no permission'
    };
  }

  try {
    // Tạo dữ liệu cần xóa
    const requestData = {
      action: "delete",
      currentMonth: month,
      strEmail: userEmail
    };

    // Gửi yêu cầu đến API Web Apps
    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(requestData)
    };

    const response = UrlFetchApp.fetch(url_api_doPost, options);
    const result = JSON.parse(response.getContentText());
    
    return {status: result.status, message: result.message};
  } catch (error) {
    return { status: "error", message: "Lỗi từ server: " + error.message };
  }
}


function modal_dataluong_3_saveToSheet(allData,targetMonthStr) {
  const strUserRole = userRole();
  const quyenSua = 'Tính lương-Sửa;';

  if (!strUserRole.includes(quyenSua)) {
    return {
      status: 'no permission'
    };
  }

  try {
    const requestData = {
      action: "write",
      currentMonth: targetMonthStr,
      data: allData,
      strEmail: userEmail
    };

    // Gửi yêu cầu đến API Web Apps
    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(requestData)
    };

    const response = UrlFetchApp.fetch(url_api_doPost, options);
    const result = JSON.parse(response.getContentText());
    
    return {status: result.status, message: result.message};
  } catch (error) {
    return { status: "error", message: "Lỗi từ server: " + error.message };
  }
}


function modal_dataluong_1_getDataPrint(month, type, region) {
  const strUserRole = userRole();
  const quyenXem = 'Tính lương-Xem;';

  if (!strUserRole.includes(quyenXem)) {
    return {
      status: 'no permission'
    };
  }

  // Bổ sung &region=... vào URL
  const regionParam = region ? `&region=${encodeURIComponent(region)}` : '';
  const urlGetType = url_api_doGet + `?month=${month}&type=${type}${regionParam}`;

  try {
    const response = UrlFetchApp.fetch(urlGetType, { method: 'get' });
    const result = JSON.parse(response.getContentText());

    if (result.status === 'success') {
      return {
        status: 'success',
        dataPrint: result.dataPrint || [],
        totalSums: result.totalSums || null
      };
    } else {
      throw new Error("Không thể tải dữ liệu: " + (result?.message || "Lỗi không xác định"));
    }
  } catch (error) {
    return {
      status: "error",
      message: error.message,
      dataPrint: []
    };
  }
}

function modal_dataluong_1_exportDebugDiNganHangL2(month, region) {
  const strUserRole = userRole();
  const quyenXem = 'Tính lương-Xem;';

  if (!strUserRole.includes(quyenXem)) {
    return {
      status: 'no permission'
    };
  }

  const regionParam = region ? `&region=${encodeURIComponent(region)}` : '';
  const urlGetType = url_api_doGet + `?month=${month}&type=debugDiNganHangL2_Xlsx${regionParam}`;

  try {
    const response = UrlFetchApp.fetch(urlGetType, { method: 'get' });
    const result = JSON.parse(response.getContentText());

    if (result.status === 'success') {
      return {
        status: 'success',
        downloadUrl: result.downloadUrl || ''
      };
    } else {
      throw new Error("Không thể xuất file kiểm tra: " + (result?.message || "Lỗi không xác định"));
    }
  } catch (error) {
    return {
      status: "error",
      message: error.message,
      downloadUrl: ""
    };
  }
}
function modal_dataluong_1_getTotalDataPrint(month,type) {
  const strUserRole = userRole();
  const quyenXem = 'Tính lương-Xem;';

  if (!strUserRole.includes(quyenXem)) {
    return {
      status: 'no permission'
    };
  }

  const urlGetType = url_api_doGet + `?month=${month}&type=${type}`;

  try {
    const response = UrlFetchApp.fetch(urlGetType, { method: 'get' });
    const result = JSON.parse(response.getContentText());

    if (result.status === 'success') {
      return {
        status: 'success',
        dataPrint: result.dataPrint || []
      };
    } else {
      throw new Error("Không thể tải dữ liệu: " + (result?.message || "Lỗi không xác định"));
    }
  } catch (error) {
    return {
      status: "error",
      message: error.message,
      dataPrint: []
    };
  }
}

// ===== CONFIG THUYẾT MINH L2 — LOAD / SAVE =====

/**
 * Load 4 dòng bổ sung từ sheet ConfigThuyetMinhL2 theo kỳ lương.
 * @param {string} month Kỳ lương (VD: "T02.2026")
 * @returns {{status, configData}} configData là mảng [{label, value}, ...]
 */
function modal_dataluong_1_loadConfigThuyetMinh(month) {
  const urlGetType = url_api_doGet + `?month=${month}&type=loadConfigThuyetMinhL2`;
  try {
    const response = UrlFetchApp.fetch(urlGetType, { method: 'get' });
    const result = JSON.parse(response.getContentText());
    if (result.status === 'success') {
      return { status: 'success', configData: result.configData || [] };
    } else {
      throw new Error(result?.message || 'Lỗi không xác định');
    }
  } catch (error) {
    return { status: 'error', message: error.message, configData: [] };
  }
}

/**
 * Lưu 4 dòng bổ sung vào sheet ConfigThuyetMinhL2 theo kỳ lương.
 * @param {string} month Kỳ lương
 * @param {Array} configLines Mảng [{label, value}, ...]
 * @returns {{status}}
 */
function modal_dataluong_1_saveConfigThuyetMinh(month, configLines) {
  const urlGetType = url_api_doGet +
    `?month=${month}&type=saveConfigThuyetMinhL2&data=${encodeURIComponent(JSON.stringify(configLines))}`;
  try {
    const response = UrlFetchApp.fetch(urlGetType, { method: 'get' });
    const result = JSON.parse(response.getContentText());
    return { status: result.status || 'success' };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}
