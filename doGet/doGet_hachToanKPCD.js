/**
 * MODULE: HẠCH TOÁN KINH PHÍ CÔNG ĐOÀN (doGet_hachToanKPCD)
 * 
 * MÔ TẢ:
 * File này tạo "BẢNG TỔNG HỢP TIỀN KPCĐ" (Hạch toán).
 * Phân chia thành Nhóm Trực tiếp và Gián tiếp. 
 * Trong mỗi nhóm chia thành 4 loại HD: Biên chế, HĐLĐ thường xuyên, HĐ 68, HĐ vụ việc.
 * 
 * LOGIC TÍNH TOÁN:
 * 1. DataLuong1: Lấy cột KPCĐ / 0.5 * 2.
 * 2. DataTruyThuLinh: Lấy cột KPCĐ (giữ nguyên).
 */
function test_doGet_taoBangKPCD() {
    var monthStr = 'T06.2026';
    Logger.log(doGet_taoBangHachToanKPCD(monthStr, 'Hà Nội'));
}

function doGet_tongHopHachToanKPCD(monthStr, resources, targetLocation) {
    Logger.log(`Starting doGet_tongHopHachToanKPCD for month: ${monthStr}`);

    // 1. Load Setup Data for Direct/Indirect mapping
    const ssFileData = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.MASTER_DATA);
    const shSetup = ssFileData.getSheetByName('Setup');
    if (!shSetup) throw new Error("Không tìm thấy sheet 'Setup' trong file Master Data");
    const dataSetupRaw = shSetup.getRange("K2:M" + Math.max(2, shSetup.getLastRow())).getValues();

    const mapDonViToNhom = {};
    dataSetupRaw.forEach(row => {
        const maDV = String(row[0] || '').trim();
        const nhom = String(row[2] || '').trim();
        if (maDV) {
            mapDonViToNhom[maDV] = nhom;
        }
    });

    const locationNormalized = targetLocation && targetLocation !== 'All' ? normalizeLocation(targetLocation) : null;

    // 2. Load Master Data (Category, Status, MaDonVi)
    const dataChotRaw = getSheetNSThang().getDataRange().getValues();
    if (dataChotRaw.length < 2) return [];

    const headerChot = dataChotRaw[0] || [];
    const idxChot = {
        KyLuong: getIdx(headerChot, ['Kỳ lương', 'Ky']),
        MaNS: getIdx(headerChot, ['Mã nhân sự', 'MaNS', 'Ma']),
        LoaiHD: getIdx(headerChot, ['Loại hợp đồng', 'LoaiHD']),
        MaDonVi: getIdx(headerChot, ['Mã đơn vị', 'MaDonVi', 'MaBP']),
        DonVi: getIdx(headerChot, ['Đơn vị', 'DonVi'])
    };

    const mapNhanSu = {};
    dataChotRaw.slice(1).forEach(row => {
        const ky = String(row[idxChot.KyLuong]).trim();
        if (ky !== monthStr) return;

        // Lọc theo khu vực nếu có yêu cầu
        const kv = normalizeLocation(row[38]); // Cột AM
        if (locationNormalized && kv !== locationNormalized) return;

        const ma = String(row[idxChot.MaNS]).trim();
        if (!ma) return;

        const maDV = String(row[idxChot.MaDonVi] || '').trim();
        const loaiHD = String(row[idxChot.LoaiHD] || '').trim();

        const tenNhom = mapDonViToNhom[maDV] || 'Gián tiếp';
        const isTrucTiep = (tenNhom === 'Trực tiếp');

        mapNhanSu[ma] = {
            LoaiHD: loaiHD,
            IsTrucTiep: isTrucTiep
        };
    });

    // 3. Load Luong & Truy Thu Data
    const dataLuong1Raw = getData(resources.ssLuong1, GLOBAL_CONFIG.SHEETS.DATA_LUONG_1);
    const headerL1 = dataLuong1Raw[0] || [];
    const idxL1 = {
        KyLuong: getIdx(headerL1, ['Kỳ lương', 'Ky']),
        MaCB: getIdx(headerL1, ['Mã CB', 'MaNS', 'Ma']),
        BHXH: getIdx(headerL1, ['BHXH'])
    };

    const dataTruyThuRaw = getData(resources.ssTruyThu1, GLOBAL_CONFIG.SHEETS.DATA_TRUY_THU);
    const headerTT = dataTruyThuRaw[0] || [];
    const idxTT = {
        KyTraLuong: getIdx(headerTT, ['Kỳ trả lương', 'Kỳ lương', 'Ky']),
        MaNS: getIdx(headerTT, ['Mã nhân sự', 'MaNS', 'Ma']),
        BHXH: getIdx(headerTT, ['BHXH']),
        KPCD: getIdx(headerTT, ['KPCĐ', 'KPCD']),
        ConNhan: getIdx(headerTT, ['Còn nhận', 'ConNhan', 'Con nhan'])
    };

    // 4. Aggregation Structure
    const AGG_KEYS = {
        BIEN_CHE: 'Diện biên chế',
        THUONG_XUYEN: 'Diện HĐLĐ thường xuyên',
        HD_68: 'Diện hợp đồng 68',
        VU_VIEC: 'Diện hợp đồng vụ việc'
    };

    const createGroupStorage = () => {
        const store = {};
        Object.values(AGG_KEYS).forEach(k => {
            store[k] = {
                Luong: 0,
                TruyLinh: 0,
                TruyThu: 0
            };
        });
        return store;
    };

    const aggTrucTiep = createGroupStorage();
    const aggGianTiep = createGroupStorage();

    function getStorage(maNS) {
        const info = mapNhanSu[maNS];
        if (!info) return null;

        let catKey = null;
        const loaiHD = info.LoaiHD;
        if (loaiHD === 'Biên chế') catKey = AGG_KEYS.BIEN_CHE;
        else if (loaiHD === 'HĐ dài hạn') catKey = AGG_KEYS.THUONG_XUYEN;
        else if (loaiHD === 'HĐ 68') catKey = AGG_KEYS.HD_68;
        else if (loaiHD === 'HĐ vụ việc') catKey = AGG_KEYS.VU_VIEC;

        if (!catKey) return null;

        return info.IsTrucTiep ? aggTrucTiep[catKey] : aggGianTiep[catKey];
    }

    // Process Luong: (BHXH / 8) * 2, làm tròn hàng đơn vị
    dataLuong1Raw.slice(1).forEach(row => {
        if (String(row[idxL1.KyLuong]).trim() !== monthStr) return;
        const store = getStorage(String(row[idxL1.MaCB]).trim());
        if (!store) return;
        store.Luong += Math.round((parseNumber(row[idxL1.BHXH]) / 8) * 2);
    });

    // Process Truy Thu / Truy Linh: KPCD * 2, làm tròn hàng đơn vị
    dataTruyThuRaw.slice(1).forEach(row => {
        if (String(row[idxTT.KyTraLuong]).trim() !== monthStr) return;
        const store = getStorage(String(row[idxTT.MaNS]).trim());
        if (!store) return;

        const conNhanIdx = idxTT.ConNhan !== -1 ? idxTT.ConNhan : 33; // Fallback to index 33 (AH)
        const conNhanVal = parseNumber(row[conNhanIdx]);
        if (conNhanVal === 0) return;

        const bhxhVal = idxTT.BHXH !== -1 ? parseNumber(row[idxTT.BHXH]) : 0;
        const kpcdVal = idxTT.KPCD !== -1 ? parseNumber(row[idxTT.KPCD]) : 0;
        const rawVal = bhxhVal > 0 ? (bhxhVal / 8) * 2 : (kpcdVal / 0.5) * 2;
        const val = Math.round(rawVal);
        if (val === 0) return;
        const absVal = Math.abs(val);

        if (conNhanVal > 0) store.TruyLinh += absVal;
        else store.TruyThu += absVal;
    });

    // 5. Build Result Table
    function createRow(stt, content, val) {
        return [stt, content, val, ''];
    }

    function sumRows(row1, row2, sign = 1) {
        const resRow = [...row1];
        resRow[2] = Math.round(row1[2] || 0) + sign * Math.round(row2[2] || 0);
        return resRow;
    }

    const result = [];

    // --- Section I: Gián tiếp ---
    const orderGianTiep = [AGG_KEYS.BIEN_CHE, AGG_KEYS.THUONG_XUYEN, AGG_KEYS.HD_68, AGG_KEYS.VU_VIEC];
    const vtGianTiep = { [AGG_KEYS.BIEN_CHE]: 'BC', [AGG_KEYS.THUONG_XUYEN]: 'HĐ', [AGG_KEYS.HD_68]: 'HĐ 68', [AGG_KEYS.VU_VIEC]: 'HĐ vụ việc' };
    const nameGianTiep = { [AGG_KEYS.BIEN_CHE]: 'biên chế', [AGG_KEYS.THUONG_XUYEN]: 'hợp đồng', [AGG_KEYS.HD_68]: 'hợp đồng 68', [AGG_KEYS.VU_VIEC]: 'hợp đồng vụ việc' };

    let totalGianTiepRow = ['I', 'Tổng gián tiếp: 1+2+3+4', 0, ''];
    const rowsGianTiep = [];
    orderGianTiep.forEach((key, i) => {
        const store = aggGianTiep[key];
        const stt = (i + 1).toString();
        const rowLuong = createRow(stt, `Gián tiếp ${nameGianTiep[key]}`, store.Luong);
        const rowLinh = createRow('', `Truy lĩnh gián tiếp ${vtGianTiep[key]}`, store.TruyLinh);
        const rowThu = createRow('', `Truy thu gián tiếp ${vtGianTiep[key]}`, store.TruyThu);

        let rowCong = sumRows(rowLuong, rowLinh, 1);
        rowCong = sumRows(rowCong, rowThu, -1);
        rowCong[0] = '';
        rowCong[1] = `Cộng gián tiếp ${vtGianTiep[key]}`;

        rowsGianTiep.push(rowLuong, rowLinh, rowThu, rowCong);
        totalGianTiepRow = sumRows(totalGianTiepRow, rowCong);
    });
    totalGianTiepRow[0] = 'I';
    totalGianTiepRow[1] = 'Tổng gián tiếp: 1+2+3+4';
    result.push(totalGianTiepRow);
    rowsGianTiep.forEach(r => result.push(r));

    // --- Section II: Trực tiếp ---
    let totalTrucTiepRow = ['II', 'Tổng trực tiếp: 1+2', 0, ''];
    const rowsTrucTiep = [];

    // Nhóm 1: Trực tiếp biên chế
    const storeBC = aggTrucTiep[AGG_KEYS.BIEN_CHE];
    const rowBCLuong = createRow('1', 'Trực tiếp biên chế', storeBC.Luong);
    const rowBCLinh = createRow('', 'Truy lĩnh trực tiếp BC', storeBC.TruyLinh);
    const rowBCThu = createRow('', 'Truy thu trực tiếp BC', storeBC.TruyThu);
    let rowBCCong = sumRows(rowBCLuong, rowBCLinh, 1);
    rowBCCong = sumRows(rowBCCong, rowBCThu, -1);
    rowBCCong[0] = '';
    rowBCCong[1] = 'Cộng trực tiếp BC';
    rowsTrucTiep.push(rowBCLuong, rowBCLinh, rowBCThu, rowBCCong);
    totalTrucTiepRow = sumRows(totalTrucTiepRow, rowBCCong);

    // Nhóm 2: Trực tiếp hợp đồng (gộp HĐ dài hạn, HĐ 68, HĐ vụ việc)
    const storeHDTotal = { Luong: 0, TruyLinh: 0, TruyThu: 0 };
    [AGG_KEYS.THUONG_XUYEN, AGG_KEYS.HD_68, AGG_KEYS.VU_VIEC].forEach(k => {
        storeHDTotal.Luong += aggTrucTiep[k].Luong;
        storeHDTotal.TruyLinh += aggTrucTiep[k].TruyLinh;
        storeHDTotal.TruyThu += aggTrucTiep[k].TruyThu;
    });

    const rowHDLuong = createRow('2', 'Trực tiếp hợp đồng', storeHDTotal.Luong);
    const rowHDLinh = createRow('', 'Truy lĩnh trực tiếp HĐ', storeHDTotal.TruyLinh);
    const rowHDThu = createRow('', 'Truy thu trực tiếp HĐ', storeHDTotal.TruyThu);
    let rowHDCong = sumRows(rowHDLuong, rowHDLinh, 1);
    rowHDCong = sumRows(rowHDCong, rowHDThu, -1);
    rowHDCong[0] = '';
    rowHDCong[1] = 'Cộng trực tiếp HĐ';
    rowsTrucTiep.push(rowHDLuong, rowHDLinh, rowHDThu, rowHDCong);
    totalTrucTiepRow = sumRows(totalTrucTiepRow, rowHDCong);

    totalTrucTiepRow[0] = 'II';
    totalTrucTiepRow[1] = 'Tổng trực tiếp: 1+2';
    result.push(totalTrucTiepRow);
    rowsTrucTiep.forEach(r => result.push(r));

    // --- Grand Total ---
    let grandTotalRow = sumRows(totalGianTiepRow, totalTrucTiepRow, 1);
    grandTotalRow[0] = '';
    grandTotalRow[1] = 'Tổng cộng: I+II';
    result.push(grandTotalRow);

    return result;
}

function doGet_taoBangHachToanKPCD(monthStr, location) {
    const EXPORT_FILE_ID = GLOBAL_CONFIG.FILES.EXPORT_HT_TH_KPCD;
    const SHEET_NAME = GLOBAL_CONFIG.SHEETS.SHEET_TH_KPCD;

    // 0. OPEN RESOURCES
    const ssLuong1 = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.DATA_LUONG_1);
    const ssTruyThu1 = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.TRUY_THU_LUONG_1);
    const resources = { ssLuong1, ssTruyThu1 };

    // 1. Get Data
    const data = doGet_tongHopHachToanKPCD(monthStr, resources, location);

    // 2. Prepare Header
    const headerRow = ['SỐ TT', 'Nội dung', 'Đoàn phí công đoàn 2%', 'Ghi chú'];

    const fullData = [headerRow].concat(data);
    const rows = fullData.length;
    const cols = 4;

    // 3. Open Sheet
    const ss = SpreadsheetApp.openById(EXPORT_FILE_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAME);
    } else {
        sheet.clear();
        const maxRows = sheet.getMaxRows();
        const maxCols = sheet.getMaxColumns();
        sheet.getRange(3, 1, maxRows, maxCols).breakApart();
        sheet.setFrozenRows(0);
        sheet.setFrozenColumns(0);
    }

    // 4. Write Title & Month
    const monthParts = monthStr.substring(1).split('.');
    const month = parseInt(monthParts[0], 10);
    const year = monthParts[1];

    sheet.getRange(1, 1, 1, 3).merge().setValue("TRƯỜNG ĐẠI HỌC CÔNG NGHỆ GTVT").setFontWeight('bold').setFontSize(12).setHorizontalAlignment('center');
    sheet.getRange(2, 1, 1, 3).merge().setValue("──────────").setFontWeight('normal').setFontSize(10).setHorizontalAlignment('center');
    sheet.getRange("A3:D3").merge().setValue(`BẢNG TỔNG HỢP TIỀN KINH PHÍ CÔNG ĐOÀN`).setFontWeight('bold').setFontSize(12).setHorizontalAlignment('center');
    sheet.getRange("A4:D4").merge().setValue(`THÁNG ${month < 10 ? '0' + month : month} NĂM ${year}`).setFontWeight('bold').setFontSize(12).setHorizontalAlignment('center');

    // 5. Write Header & Data (Start row 6)
    sheet.getRange(6, 1, rows, cols).setValues(fullData);

    // --- STYLING CHUẨN ---
    const lastR = sheet.getLastRow();
    const lastC = sheet.getLastColumn();
    const fullRange = sheet.getRange(1, 1, lastR, lastC);

    // 1. Ẩn gridlines, Reset border & Set Font
    fullRange.setBackground('#FFFFFF').setBorder(false, false, false, false, false, false).setFontFamily('Arial').setFontSize(10.5);

    // Cấu hình lại font size cho dòng tiêu đề và header để không bị ghi đè bởi fullRange
    sheet.getRange("A1").setFontSize(12);
    sheet.getRange("A3:D4").setFontSize(12);
    sheet.getRange(6, 1, 1, 4).setFontSize(11);

    // Header Style
    sheet.getRange(6, 1, 1, 4).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle').setFontSize(11);

    // Body Style
    const dataRange = sheet.getRange(7, 1, data.length, 4);
    dataRange.setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.THIN);
    sheet.getRange(7, 3, data.length, 1).setNumberFormat('#,##0');

    // Bold lines
    for (let i = 0; i < data.length; i++) {
        const rowIdx = 7 + i;
        const stt = String(data[i][0]).trim();
        const content = String(data[i][1]).trim();
        if (stt !== '' || content.startsWith('Cộng') || content.startsWith('Tổng cộng')) {
            sheet.getRange(rowIdx, 1, 1, 4).setFontWeight('bold').setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.SOLID);
        }
    }

    // Alignment
    sheet.getRange(6, 1, rows, 1).setHorizontalAlignment('center');

    // Special alignment for bold rows (Groups/Totals)
    for (let i = 0; i < data.length; i++) {
        const rowIdx = 7 + i;
        const stt = String(data[i][0]).trim();
        const content = String(data[i][1]).trim();
        if (stt === '' && (content.startsWith('Cộng') || content.startsWith('Tổng cộng'))) {
            sheet.getRange(rowIdx, 1, 1, 2).setHorizontalAlignment('left');
        }
    }


    // Signature Area
    const lastDataRow = 6 + data.length;
    const targetRow = lastDataRow + 2;
    const masterSheet = ss.getSheetByName('Master');
    if (masterSheet) {
        const srcRange = masterSheet.getRange("A1:F2");
        const targetRange = sheet.getRange(targetRow, 1, 2, 6);
        try {
            srcRange.copyTo(targetRange);
        } catch (e) {
            targetRange.setValues(srcRange.getValues());
            const merged = srcRange.getMergedRanges();
            merged.forEach(m => {
                sheet.getRange(targetRow + (m.getRow() - 1), m.getColumn(), m.getNumRows(), m.getNumColumns()).merge();
            });
        }
        // Clean signature labels from target range
        const targetValues = targetRange.getValues();
        for (let r = 0; r < targetValues.length; r++) {
            for (let c = 0; c < targetValues[r].length; c++) {
                const val = String(targetValues[r][c] || '');
                if (val.toLowerCase().includes('ký') && (val.includes('(') || val.includes('ghi rõ họ tên') || val.includes('ký tên'))) {
                    targetRange.getCell(r + 1, c + 1).setValue('');
                }
            }
        }
    }

    // ====== BƯỚC CUỐI: TẠO ĐƯỜNG KẺ BẢNG ======
    const finalTableRange = sheet.getRange(6, 1, rows, cols);
    // 1. Viền ngoài và kẻ dọc: Nét liền (SOLID)
    finalTableRange.setBorder(true, true, true, true, true, null, 'black', SpreadsheetApp.BorderStyle.SOLID);
    // 2. Kẻ ngang nội dung: Nét đứt (DOTTED)
    finalTableRange.setBorder(null, null, null, null, null, true, 'black', SpreadsheetApp.BorderStyle.DOTTED);
    // 3. Header: Nét liền toàn bộ
    sheet.getRange(6, 1, 1, cols).setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.SOLID);

    // Thiết lập font chữ cho toàn bộ bảng (bao gồm cả chữ ký mới copy)
    sheet.getRange(1, 1, sheet.getLastRow(), sheet.getMaxColumns()).setFontFamily('Arial');

    // FR-02: set row height for school name & underline at the very end
    sheet.setRowHeight(1, 22);
    sheet.setRowHeight(2, 18);
    sheet.getRange(1, 1, 1, 3).setFontSize(10).setFontWeight('bold').setHorizontalAlignment('center');
    sheet.getRange(2, 1, 1, 3).setFontSize(10).setFontWeight('normal').setHorizontalAlignment('center');
    sheet.getRange("A3:D3").setFontSize(12).setFontWeight('bold').setHorizontalAlignment('center');

    return `https://docs.google.com/spreadsheets/d/${ss.getId()}/export?format=pdf&size=A4&portrait=true&fitw=true&gridlines=false&horizontal_alignment=CENTER&left_margin=0.5&right_margin=0.25&top_margin=0.5&bottom_margin=0.25`;
}

/**
 * Cung cấp dữ liệu JSON cho việc in ấn Bảng hạch toán KPCĐ trên Client
 */
function getPrintDataHachToanKPCD(monthStr, location) {
    try {
        // 1. Tạo bảng và tính toán các công thức trên Google Sheets
        doGet_taoBangHachToanKPCD(monthStr, location);

        // 2. Đọc giá trị đã tính toán từ sheet
        const ss = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.EXPORT_HT_TH_KPCD);
        const sheet = ss.getSheetByName(GLOBAL_CONFIG.SHEETS.SHEET_TH_KPCD);
        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();

        // Tiêu đề/Header bắt đầu từ dòng 6
        const data = sheet.getRange(6, 1, lastRow - 5, lastCol).getValues();

        const monthParts = monthStr.substring(1).split('.');
        const month = monthParts[0];
        const year = monthParts[1];

        return {
            status: "success",
            month: month,
            year: year,
            data: data,
            dateExport: `Ngày ${new Date().getDate()} tháng ${month} năm ${year}`
        };
    } catch (e) {
        return { status: "error", message: e.message };
    }
}
