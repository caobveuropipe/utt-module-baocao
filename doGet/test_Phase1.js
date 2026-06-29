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
