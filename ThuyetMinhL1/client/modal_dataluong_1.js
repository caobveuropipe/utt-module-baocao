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

  const urlGetType = url_api_doGet + `?month=${month}&type=${type}&region=${region || ''}`;

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
function modal_dataluong_1_getTotalDataPrint(month, type, region) {
  const strUserRole = userRole();
  const quyenXem = 'Tính lương-Xem;';

  if (!strUserRole.includes(quyenXem)) {
    return {
      status: 'no permission'
    };
  }

  const urlGetType = url_api_doGet + `?month=${month}&type=${type}&region=${region || ''}`;

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
