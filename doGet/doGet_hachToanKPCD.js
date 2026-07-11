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
    var monthStr = 'T01.2025';
    Logger.log(doGet_taoBangHachToanKPCD(monthStr));
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
        KPCD: getIdx(headerL1, ['KPCĐ', 'KPCD'])
    };

    const dataTruyThuRaw = getData(resources.ssTruyThu1, GLOBAL_CONFIG.SHEETS.DATA_TRUY_THU);
    const headerTT = dataTruyThuRaw[0] || [];
    const idxTT = {
        KyTraLuong: getIdx(headerTT, ['Kỳ trả lương', 'Kỳ lương', 'Ky']),
        MaNS: getIdx(headerTT, ['Mã nhân sự', 'MaNS', 'Ma']),
        KPCD: getIdx(headerTT, ['KPCĐ', 'KPCD'])
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
            store[k] = { Luong: 0, TruyThuLinh: 0 };
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

    // Process Luong (KPCD / 0.5 * 2)
    dataLuong1Raw.slice(1).forEach(row => {
        if (String(row[idxL1.KyLuong]).trim() !== monthStr) return;
        const store = getStorage(String(row[idxL1.MaCB]).trim());
        if (!store) return;
        store.Luong += (parseNumber(row[idxL1.KPCD]) / 0.5) * 2;
    });

    // Process Truy Thu / Truy Linh (KPCD raw)
    dataTruyThuRaw.slice(1).forEach(row => {
        if (String(row[idxTT.KyTraLuong]).trim() !== monthStr) return;
        const store = getStorage(String(row[idxTT.MaNS]).trim());
        if (!store) return;
        store.TruyThuLinh += parseNumber(row[idxTT.KPCD]);
    });

    // 5. Build Result Table
    const result = [];
    const ORDER = [AGG_KEYS.BIEN_CHE, AGG_KEYS.THUONG_XUYEN, AGG_KEYS.HD_68, AGG_KEYS.VU_VIEC];

    function buildSection(roman, groupLabel, groupAgg) {
        const groupKey = groupLabel.toLowerCase();

        let sectionTotal = 0;
        ORDER.forEach(key => {
            const store = groupAgg[key];
            sectionTotal += (store.Luong + store.TruyThuLinh);
        });

        // Header Group (I, II)
        const headerContent = `Tổng ${groupKey}: 1+2+3+4`;
        result.push([roman, headerContent, sectionTotal, '']);

        const VT = {
            [AGG_KEYS.BIEN_CHE]: 'BC',
            [AGG_KEYS.THUONG_XUYEN]: 'HĐ dài hạn',
            [AGG_KEYS.HD_68]: 'HĐ 68',
            [AGG_KEYS.VU_VIEC]: 'HĐ vụ việc'
        };

        const NAME = {
            [AGG_KEYS.BIEN_CHE]: 'biên chế',
            [AGG_KEYS.THUONG_XUYEN]: 'hợp đồng dài hạn',
            [AGG_KEYS.HD_68]: 'hợp đồng 68',
            [AGG_KEYS.VU_VIEC]: 'hợp đồng vụ việc'
        };

        ORDER.forEach((key, i) => {
            const store = groupAgg[key];
            const vt = VT[key];
            const name = NAME[key];
            const stt = (i + 1).toString();

            // 1. Dòng Lương
            result.push([stt, `${groupLabel} ${name}`, store.Luong, '']);

            // 2. Dòng Truy lĩnh, truy thu
            result.push(['', `Truy lĩnh, truy thu ${groupKey} ${vt}`, store.TruyThuLinh, '']);

            // 3. Dòng Cộng
            result.push(['', `Cộng ${groupKey} ${vt}`, store.Luong + store.TruyThuLinh, '']);
        });

        return sectionTotal;
    }

    const totalGianTiep = buildSection('I', 'Gián tiếp', aggGianTiep);
    const totalTrucTiep = buildSection('II', 'Trực tiếp', aggTrucTiep);

    result.push(['', 'Tổng cộng: I+II', totalGianTiep + totalTrucTiep, '']);

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
    const headerRow = ['SỐ TT', 'Nội dung', 'Kinh phí công đoàn 2%', 'Ghi chú'];

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
    sheet.getRange("A3:D3").merge().setValue(`BẢNG TỔNG HỢP TIỀN KPCĐ`).setFontWeight('bold').setFontSize(12).setHorizontalAlignment('center');
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
