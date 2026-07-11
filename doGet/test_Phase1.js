function test_Phase1() {
  try {
    const result = buildTongHopSalaryExcelData("03/2026", "Tất cả");
    Logger.log("Headers length: " + result.headers.length + " (Kỳ vọng: 49)");
    Logger.log("Rows count: " + result.rows.length);
    Logger.log("Warnings: " + JSON.stringify(result.warnings, null, 2));
    if (result.rows.length > 0) {
      Logger.log("Row 0 length: " + result.rows[0].length + " (Kỳ vọng: 49)");
      Logger.log("Row 0: " + JSON.stringify(result.rows[0]));
    }
  } catch (e) {
    Logger.log("Lỗi: " + e.stack);
  }
}

function test_HTMLPrintEndpoints() {
  const testMonth = "T01.2025";
  const testLocation = "Hà Nội";
  
  const testCases = [
    { name: "TongHopBaoHiem", fn: () => getPrintDataTongHopBaoHiem(testMonth, testLocation) },
    { name: "TongHopKhoanTru", fn: () => getPrintDataTongHopKhoanTru(testMonth, testLocation) },
    { name: "TongHopKPCD", fn: () => getPrintDataTongHopKPCD(testMonth, testLocation) },
    { name: "HachToanBaoHiem", fn: () => getPrintDataHachToanBaoHiem(testMonth, testLocation) },
    { name: "HachToanKPCD", fn: () => getPrintDataHachToanKPCD(testMonth, testLocation) },
    { name: "PhanBoLuongBHXH", fn: () => getPrintDataPhanBoLuongBHXH(testMonth, testLocation) },
    { name: "HachToanLuongVaTruyLinh", fn: () => getPrintDataHachToanLuongVaTruyLinh(testMonth, testLocation) }
  ];

  Logger.log("=== BẮT ĐẦU KIỂM THỬ 7 ENDPOINTS IN HTML ===");
  testCases.forEach(tc => {
    try {
      const res = tc.fn();
      if (res && res.status === "success") {
        Logger.log(`✅ [${tc.name}] OK. Rows: ${res.data ? res.data.length : 0}`);
      } else {
        Logger.log(`❌ [${tc.name}] LỖI: ${res ? res.message : "Rỗng"}`);
      }
    } catch (e) {
      Logger.log(`❌ [${tc.name}] EXCEPTION: ${e.toString()}`);
    }
  });
  Logger.log("=== KẾT THÚC KIỂM THỬ ===");
}
