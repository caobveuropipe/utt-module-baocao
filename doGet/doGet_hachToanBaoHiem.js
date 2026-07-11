/**
 * MODULE: HẠCH TOÁN BẢO HIỂM (doGet_hachToanBaoHiem)
 * 
 * MÔ TẢ:
 * File này chứa logic để tổng hợp hạch toán bảo hiểm (BHXH, BHYT, BHTN).
 * Phân chia thành Nhóm Trực tiếp và Gián tiếp. 
 * Trong mỗi nhóm chia thành 4 loại HD: Biên chế, HĐLĐ thường xuyên, HĐ 68, HĐ vụ việc.
 */
function test_doGet_taoBangTHBaoHiem() {
    var monthStr = 'T01.2025';
    Logger.log(doGet_taoBangHachToanBaoHiem(monthStr));
}

/**
 * Hàm xử lý dữ liệu hạch toán bảo hiểm (Nội bộ cho file này)
 */
function processDataHachToanBaoHiem(monthStr, resources, targetLocation) {
    const RATES = {
        BHXH: { EMP: 8, SCHOOL: 17.5 },
        BHYT: { EMP: 1.5, SCHOOL: 3 },
        BHTN: { EMP: 1, SCHOOL: 1 }
    };

    Logger.log(`Starting processDataHachToanBaoHiem for month: ${monthStr}`);

    // 1. Load Setup Data for Direct/Indirect mapping
    const ssFileData = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.MASTER_DATA);
    const shSetup = ssFileData.getSheetByName('Setup');
    if (!shSetup) throw new Error("Không tìm thấy sheet 'Setup' trong file Master Data (ID: " + GLOBAL_CONFIG.FILES.MASTER_DATA + ")");
    const lastRow = shSetup.getLastRow();
    const dataSetupRaw = shSetup.getRange("K2:M" + Math.max(2, lastRow)).getValues();

    // Tạo bản đồ: Mã đơn vị -> Nhóm (Trực tiếp/Gián tiếp)
    const mapDonViToNhom = {};
    dataSetupRaw.forEach(row => {
        const maDV = String(row[0] || '').trim(); // Cột K (index 0) là Mã đơn vị
        const nhom = String(row[2] || '').trim(); // Cột M (index 2) là "Trực tiếp" hoặc "Gián tiếp"
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
        KyLuong: getIdx(headerChot, ['Kỳ lương', 'KyLuong', 'Ky']),
        MaNS: getIdx(headerChot, ['Mã nhân sự', 'Mã NS', 'MaNS', 'Ma']),
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
        BHXH: getIdx(headerL1, ['BHXH']),
        BHYT: getIdx(headerL1, ['BHYT']),
        BHTN: getIdx(headerL1, ['BHTN'])
    };

    const dataTruyThuRaw = getData(resources.ssTruyThu1, GLOBAL_CONFIG.SHEETS.DATA_TRUY_THU);
    const headerTT = dataTruyThuRaw[0] || [];
    const idxTT = {
        KyTraLuong: getIdx(headerTT, ['Kỳ trả lương', 'Kỳ lương', 'Ky']),
        MaNS: getIdx(headerTT, ['Mã nhân sự', 'MaNS', 'Ma']),
        BHXH: getIdx(headerTT, ['BHXH']),
        BHYT: getIdx(headerTT, ['BHYT']),
        BHTN: getIdx(headerTT, ['BHTN'])
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
                Luong: { BHXH: 0, BHYT: 0, BHTN: 0 },
                TruyLinh: { BHXH: 0, BHYT: 0, BHTN: 0 },
                TruyThu: { BHXH: 0, BHYT: 0, BHTN: 0 }
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

    // Process Luong
    dataLuong1Raw.slice(1).forEach(row => {
        if (String(row[idxL1.KyLuong]).trim() !== monthStr) return;
        const store = getStorage(String(row[idxL1.MaCB]).trim());
        if (!store) return;

        store.Luong.BHXH += parseNumber(row[idxL1.BHXH]);
        store.Luong.BHYT += parseNumber(row[idxL1.BHYT]);
        store.Luong.BHTN += parseNumber(row[idxL1.BHTN]);
    });

    // Process Truy Thu / Truy Linh
    dataTruyThuRaw.slice(1).forEach(row => {
        if (String(row[idxTT.KyTraLuong]).trim() !== monthStr) return;
        const store = getStorage(String(row[idxTT.MaNS]).trim());
        if (!store) return;

        ['BHXH', 'BHYT', 'BHTN'].forEach(field => {
            const val = parseNumber(row[idxTT[field]]);
            if (val === 0) return;
            const absVal = Math.abs(val);
            if (val < 0) store.TruyLinh[field] += absVal;
            else store.TruyThu[field] += absVal;
        });
    });

    // 5. Build Result Table
    function internalCalculateRow(employeePay) {
        const BHXH = Math.round(employeePay.BHXH || 0);
        const BHYT = Math.round(employeePay.BHYT || 0);
        const BHTN = Math.round(employeePay.BHTN || 0);
        const empTotal = BHXH + BHYT + BHTN;
        const schoolBHXH = Math.round((BHXH / RATES.BHXH.EMP) * RATES.BHXH.SCHOOL);
        const schoolBHYT = Math.round((BHYT / RATES.BHYT.EMP) * RATES.BHYT.SCHOOL);
        const schoolBHTN = Math.round((BHTN / RATES.BHTN.EMP) * RATES.BHTN.SCHOOL);
        const schoolTotal = schoolBHXH + schoolBHYT + schoolBHTN;
        return {
            emp: { BHXH, BHYT, BHTN, Total: empTotal },
            school: { BHXH: schoolBHXH, BHYT: schoolBHYT, BHTN: schoolBHTN, Total: schoolTotal },
            grandTotal: empTotal + schoolTotal
        };
    }

    function createRow(stt, content, vals) {
        const c = internalCalculateRow(vals);
        return [
            stt, content,
            c.emp.BHXH, c.emp.BHYT, c.emp.BHTN, c.emp.Total,
            c.school.BHXH, c.school.BHYT, c.school.BHTN, c.school.Total,
            c.grandTotal
        ];
    }

    function sumRows(row1, row2, sign = 1) {
        const resRow = [...row1];
        for (let i = 2; i <= 10; i++) {
            resRow[i] = Math.round(row1[i] || 0) + sign * Math.round(row2[i] || 0);
        }
        return resRow;
    }

    const result = [];
    const ORDER = [AGG_KEYS.BIEN_CHE, AGG_KEYS.THUONG_XUYEN, AGG_KEYS.HD_68, AGG_KEYS.VU_VIEC];

    function buildSection(roman, groupLabel, groupAgg) {
        const groupKey = groupLabel.toLowerCase();
        const VT = { [AGG_KEYS.BIEN_CHE]: 'BC', [AGG_KEYS.THUONG_XUYEN]: 'HĐ', [AGG_KEYS.HD_68]: 'HĐ 68', [AGG_KEYS.VU_VIEC]: 'HĐ vụ việc' };
        const NAME = { [AGG_KEYS.BIEN_CHE]: 'biên chế', [AGG_KEYS.THUONG_XUYEN]: 'hợp đồng', [AGG_KEYS.HD_68]: 'hợp đồng 68', [AGG_KEYS.VU_VIEC]: 'hợp đồng vụ việc' };

        // We will store category rows first to sum them into section total
        const catCongRows = [];

        // Prepare placeholder for category rows to be pushed into result later
        // Because "Tổng gián tiếp" is at the top of the section, we will calculate sectionTotal row first,
        // then push sectionTotal row, and then push category rows.
        const sectionRowsToPush = [];

        let sectionTotalRow = [roman, `Tổng ${groupKey}: 1+2+3+4`, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        ORDER.forEach((key, i) => {
            const store = groupAgg[key];
            const vt = VT[key];
            const name = NAME[key];
            const stt = (i + 1).toString();

            const rowLuong = createRow(stt, `${groupLabel} ${name}`, store.Luong);
            const rowLinh = createRow('', `Truy lĩnh ${groupKey} ${vt}`, store.TruyLinh);
            const rowThu = createRow('', `Truy thu ${groupKey} ${vt}`, store.TruyThu);

            // Cộng = Luong - TruyLinh + TruyThu
            let rowCong = sumRows(rowLuong, rowLinh, -1);
            rowCong = sumRows(rowCong, rowThu, 1);
            rowCong[0] = '';
            rowCong[1] = `Cộng ${groupKey} ${vt}`;

            sectionRowsToPush.push(rowLuong, rowLinh, rowThu, rowCong);
            sectionTotalRow = sumRows(sectionTotalRow, rowCong);
        });

        // Restore header attributes
        sectionTotalRow[0] = roman;
        sectionTotalRow[1] = `Tổng ${groupKey}: 1+2+3+4`;

        // Push section total row first
        result.push(sectionTotalRow);
        // Then push category detail rows
        sectionRowsToPush.forEach(r => result.push(r));

        return sectionTotalRow;
    }

    const totalGianTiepRow = buildSection('I', 'Gián tiếp', aggGianTiep);
    const totalTrucTiepRow = buildSection('II', 'Trực tiếp', aggTrucTiep);

    let grandTotalRow = sumRows(totalGianTiepRow, totalTrucTiepRow, 1);
    grandTotalRow[0] = '';
    grandTotalRow[1] = 'Tổng cộng: I+II';
    result.push(grandTotalRow);

    return result;
}

/**
 * Hàm xuất bảng hạch toán bảo hiểm
 */
function doGet_taoBangHachToanBaoHiem(monthStr, location) {
    const EXPORT_FILE_ID = GLOBAL_CONFIG.FILES.EXPORT_HT_TH_BH;
    const SHEET_NAME = GLOBAL_CONFIG.SHEETS.SHEET_TH_BH;

    // 0. OPEN RESOURCES
    const ssLuong1 = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.DATA_LUONG_1);
    const ssTruyThu1 = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.TRUY_THU_LUONG_1);
    const resources = { ssLuong1, ssTruyThu1 };

    // 1. Lấy dữ liệu (Sử dụng hàm nội bộ đã đổi tên)
    const data = processDataHachToanBaoHiem(monthStr, resources, location);

    if (!data || data.length === 0) {
        throw new Error('Không có dữ liệu hạch toán bảo hiểm cho kỳ ' + monthStr);
    }

    // 2. Chuẩn bị Header (11 cột)
    const headerRow1 = [
        'STT', 'Nội dung',
        'Người lao động trả', '', '', '',
        'Nhà trường trả', '', '', '',
        'Tổng tiền'
    ];

    const headerRow2 = [
        '', '',
        'BHXH 8%', 'BHYT 1.5%', 'BHTN 1%', 'Thành tiền',
        'BHXH 17.5%', 'BHYT 3%', 'BHTN 1%', 'Thành tiền',
        ''
    ];

    const fullData = [headerRow1, headerRow2].concat(data);
    const rows = fullData.length;
    const cols = 11;

    // 3. Mở file và sheet
    const ss = SpreadsheetApp.openById(EXPORT_FILE_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAME);
    } else {
        sheet.clear();
        sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).breakApart();
        sheet.setFrozenRows(0);
        sheet.setFrozenColumns(0);
    }

    // 4. Ghi dữ liệu
    sheet.getRange(5, 1, rows, cols).setValues(fullData);

    // 5. Định dạng Header & Tiêu đề
    const monthParts = monthStr.substring(1).split('.');
    const month = parseInt(monthParts[0], 10);
    const year = monthParts[1];

    sheet.getRange(1, 1, 1, 3).merge().setValue("TRƯỜNG ĐẠI HỌC CÔNG NGHỆ GTVT").setFontWeight('bold').setFontSize(12).setHorizontalAlignment('center');
    sheet.getRange(2, 1, 1, 3).merge().setValue("──────────").setFontWeight('normal').setFontSize(10).setHorizontalAlignment('center');
    const titleText = `BẢNG TỔNG HỢP HẠCH TOÁN BẢO HIỂM THÁNG ${month} NĂM ${year}`;
    sheet.getRange("A3:K3").merge().setHorizontalAlignment('center').setValue(titleText).setFontWeight('bold').setFontSize(12);

    sheet.getRange("A5:A6").merge();
    sheet.getRange("B5:B6").merge();
    sheet.getRange("C5:F5").merge();
    sheet.getRange("G5:J5").merge();
    sheet.getRange("K5:K6").merge();

    const headerRange = sheet.getRange("A5:K6");
    headerRange.setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle').setFontSize(11);

    // --- STYLING CHUẨN ---
    const lastR = sheet.getLastRow();
    const lastC = sheet.getLastColumn();
    const fullRange = sheet.getRange(1, 1, lastR, lastC);

    // 1. Ẩn gridlines, Reset border & Set Font
    fullRange.setBackground('#FFFFFF').setBorder(false, false, false, false, false, false).setFontFamily('Arial').setFontSize(10);

    // Cấu hình lại font size cho dòng tiêu đề và header để không bị ghi đè bởi fullRange
    sheet.getRange("A1").setFontSize(12);
    sheet.getRange("A3").setFontSize(12);
    sheet.getRange("A5:K6").setFontSize(11);

    // 2. Alignment for STT column (center)
    sheet.getRange(5, 1, rows, 1).setHorizontalAlignment('center');

    // 3. Bold rows where STT is not empty OR contains "Cộng"/"Tổng cộng"
    for (let i = 0; i < data.length; i++) {
        const rowIdx = 7 + i;
        const stt = String(data[i][0]).trim();
        const content = String(data[i][1]).trim();

        const isBoldRow = (stt !== '' || content.includes('Cộng') || content.includes('Tổng cộng'));

        if (isBoldRow) {
            sheet.getRange(rowIdx, 1, 1, cols).setFontWeight('bold').setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.SOLID);

            // Nếu là dòng cộng (STT rỗng), thực hiện căn trái cho cột nội dung (không gộp ô)
            if (stt === '' && (content.includes('Cộng') || content.includes('Tổng cộng'))) {
                sheet.getRange(rowIdx, 1, 1, 2).setHorizontalAlignment('left');
            }
        }
    }

    // Signature Area
    const targetRow = sheet.getLastRow() + 2;
    const masterSheet = ss.getSheetByName('Master');
    if (masterSheet) {
        const srcRange = masterSheet.getRange("A1:K2");
        const targetRange = sheet.getRange(targetRow, 1, 2, 11);
        try {
            srcRange.copyTo(targetRange);
        } catch (e) {
            targetRange.setValues(srcRange.getValues());
            targetRange.setFontFamilies(srcRange.getFontFamilies());
            targetRange.setFontSizes(srcRange.getFontSizes());
            targetRange.setFontWeights(srcRange.getFontWeights());
            targetRange.setFontStyles(srcRange.getFontStyles());
            targetRange.setHorizontalAlignments(srcRange.getHorizontalAlignments());
            targetRange.setVerticalAlignments(srcRange.getVerticalAlignments());
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

    // sheet.autoResizeColumns(1, cols); // Bỏ auto resize theo yêu cầu

    // ====== BƯỚC CUỐI: TẠO ĐƯỜNG KẺ BẢNG ======
    const finalTableRange = sheet.getRange(5, 1, rows, cols);
    // 1. Viền ngoài và kẻ dọc: Nét liền (SOLID)
    finalTableRange.setBorder(true, true, true, true, true, null, 'black', SpreadsheetApp.BorderStyle.SOLID);
    // 2. Kẻ ngang nội dung: Nét đứt (DOTTED)
    finalTableRange.setBorder(null, null, null, null, null, true, 'black', SpreadsheetApp.BorderStyle.DOTTED);
    // 3. Header: Nét liền toàn bộ
    sheet.getRange(5, 1, 2, cols).setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.SOLID);

    // FR-02: set row height for school name & underline at the very end
    sheet.setRowHeight(1, 22);
    sheet.setRowHeight(2, 18);
    sheet.getRange(1, 1, 1, 3).setFontSize(10).setFontWeight('bold').setHorizontalAlignment('center');
    sheet.getRange(2, 1, 1, 3).setFontSize(10).setFontWeight('normal').setHorizontalAlignment('center');
    sheet.getRange("A3:K3").setFontSize(12).setFontWeight('bold').setHorizontalAlignment('center');

    // Đóng băng 6 dòng đầu để lặp lại header ở các trang in tiếp theo
    sheet.setFrozenRows(6);

    return `https://docs.google.com/spreadsheets/d/${ss.getId()}/export?format=pdf&size=A4&portrait=false&fitw=true&gridlines=false&horizontal_alignment=CENTER&left_margin=0.5&right_margin=0.25&top_margin=0.5&bottom_margin=0.25&fzr=true`;
}

/**
 * Cung cấp dữ liệu JSON cho việc in ấn Bảng hạch toán bảo hiểm trên Client
 */
function getPrintDataHachToanBaoHiem(monthStr, location) {
    try {
        // 1. Tạo bảng và tính toán các công thức trên Google Sheets
        doGet_taoBangHachToanBaoHiem(monthStr, location);

        // 2. Đọc giá trị đã tính toán từ sheet
        const ss = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.EXPORT_HT_TH_BH);
        const sheet = ss.getSheetByName(GLOBAL_CONFIG.SHEETS.SHEET_TH_BH);
        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();

        // Tiêu đề/Header bắt đầu từ dòng 5
        const data = sheet.getRange(5, 1, lastRow - 4, lastCol).getValues();

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
