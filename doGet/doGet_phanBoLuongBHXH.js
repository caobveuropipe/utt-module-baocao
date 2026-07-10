/**
 * MODULE: PHÂN BỔ TIỀN LƯƠNG VÀ BHXH (doGet_phanBoLuongBHXH) - V2 (Match UI Structure)
 * 
 * MÔ TẢ:
 * File này tạo "Bảng phân bổ tiền lương và BHXH" với cấu trúc phân cấp:
 * 1. Nhóm chính (Biên chế / HĐ dài hạn / Vụ việc)
 * 2. Loại đơn vị (Quản lý / Trực tiếp)
 * 3. Chi tiết phòng ban (Nhóm đơn vị hạch toán) dưới mục "Trong đó"
 */
function test_doGet_taoBangPhanBoLuongBHXH() {
    var monthStr = 'T01.2025';
    Logger.log(doGet_taoBangPhanBoLuongBHXH(monthStr));
}

function doGet_taoBangPhanBoLuongBHXH(monthStr, location) {
    Logger.log(`Running doGet_phanBoLuongBHXH for: ${monthStr}`);
    const EXPORT_FILE_ID = GLOBAL_CONFIG.FILES.EXPORT_HT_PHAN_BO_LUONG_BHXH;
    const SHEET_NAME = GLOBAL_CONFIG.SHEETS.SHEET_TH_LUONG;

    const ssLuong1 = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.DATA_LUONG_1);
    const ssMaster = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.MASTER_DATA);

    // 1. DATA LUONG 1
    const sheetL1 = ssLuong1.getSheetByName(GLOBAL_CONFIG.SHEETS.DATA_LUONG_1);
    if (!sheetL1) {
        throw new Error(`Không tìm thấy sheet '${GLOBAL_CONFIG.SHEETS.DATA_LUONG_1}' trong file Lương 1`);
    }
    const dataLuong1Raw = sheetL1.getDataRange().getValues();
    if (dataLuong1Raw.length < 2) {
        Logger.log("DataLuong1 is empty");
        return null;
    }

    const hL1 = dataLuong1Raw[0] || [];
    const idxL1 = {
        KyLuong: getIdx(hL1, ['Kỳ lương', 'Ky']),
        LoaiHD: getIdx(hL1, ['Loại HĐ', 'Loại hợp đồng', 'LoaiHD']),
        DonVi: 5, // Cột F: Mã đơn vị
        HSBac: getIdx(hL1, ['HS bậc', 'HS Bậc', 'HSBac']),
        HSChucVu: getIdx(hL1, ['HS chức vụ', 'HS CV', 'HSCV']),
        HSVượtKhung: getIdx(hL1, ['HS vượt khung', 'HSVK']),
        HSNganh: getIdx(hL1, ['HS ngành', 'HS Nghề', 'HSGD']),
        HSThamNien: getIdx(hL1, ['HS thâm niên', 'HSTN']),
        HSDocHai: getIdx(hL1, ['HS độc hại', 'HSDH']),
        HSTrachNhiem: getIdx(hL1, ['HS trách nhiệm', 'HSTNhiem']),
        HSTuVe: getIdx(hL1, ['HS tự vệ', 'HSTV']),
        TongLuong: getIdx(hL1, ['Tổng lương', 'TongLuong']),
        BHXH: getIdx(hL1, ['BHXH']),
        BHYT: getIdx(hL1, ['BHYT']),
        BHTN: getIdx(hL1, ['BHTN']),
        KPCD: getIdx(hL1, ['KPCĐ', 'KPCD']),
        NuocNgoai: getIdx(hL1, ['Nước ngoài', 'NN']),
        NghiBHXH: getIdx(hL1, ['Nghỉ BHXH', 'NghiBHXH']),
        TruKhac: getIdx(hL1, ['Trừ khác', 'TruKhac'])
    };

    // 2. MASTER DATA (Setup!K:O)
    const sheetSetup = ssMaster.getSheetByName('Setup');
    if (!sheetSetup) {
        throw new Error("Không tìm thấy sheet 'Setup' trong file Master Data");
    }
    const dataMasterRaw = sheetSetup.getRange("K2:O" + Math.max(2, sheetSetup.getLastRow())).getValues();

    const mapMaster = {};
    dataMasterRaw.forEach(row => {
        const ma = String(row[0]).trim();
        if (ma) {
            mapMaster[ma] = {
                TenDV: row[1],
                NhomDV: String(row[3] || 'Khác').trim(), // Phòng ban
                LoaiDV: String(row[4] || 'Bộ phận trực tiếp').trim() // Bộ phận quản lý / Bộ phận trực tiếp
            };
        }
    });

    const locationNormalized = location && location !== 'All' ? normalizeLocation(location) : null;

    // 3. STORAGE STRUCTURE
    const createMetrics = () => ({
        HSBac: 0, HSChucVu: 0, HSVượtKhung: 0, HSNganh: 0, HSThamNien: 0, HSDocHaiTN: 0,
        TongLuong: 0, BHXH: 0, BHYT: 0, BHTN: 0, KPCD: 0, NuocNgoai: 0, NghiBHXH: 0,
        GiamTru: 0, BHTra: 0, SoTienLinh: 0
    });

    const groups = {
        'BIEN_CHE': { label: 'BẢNG PHÂN BỔ TIỀN LƯƠNG VÀ BẢO HIỂM XÃ HỘI ( BIÊN CHẾ )', data: {} },
        'HD_DAI_HAN': { label: 'LƯƠNG HỢP ĐỒNG DÀI HẠN', data: {} },
        'HD_VU_VIEC': { label: 'LƯƠNG HỢP ĐỒNG VỤ VIỆC', data: {} }
    };

    let matchedRows = 0;
    let masterMatched = 0;
    let groupMatched = 0;

    dataLuong1Raw.slice(1).forEach((row, index) => {
        if (String(row[idxL1.KyLuong]).trim() !== monthStr) return;

        if (locationNormalized) {
            const rowLocation = normalizeLocation(row[31]); // Cột AF: Khu vực
            if (rowLocation !== locationNormalized) return;
        }

        matchedRows++;

        const loaiHD = String(row[idxL1.LoaiHD] || '').trim();
        const donViRaw = String(row[idxL1.DonVi] || '').trim();
        const maDV = 'DV' + donViRaw.split('-')[0].trim();
        const master = mapMaster[maDV];

        if (!master) {
            if (matchedRows <= 5) Logger.log(`Dòng ${index + 2}: Không khớp Master. maDV: "${maDV}"`);
            return;
        }
        masterMatched++;

        let mainKey = '';
        if (loaiHD === 'Biên chế') mainKey = 'BIEN_CHE';
        else if (loaiHD === 'HĐ dài hạn' || loaiHD === 'HĐ 68') mainKey = 'HD_DAI_HAN';
        else if (loaiHD === 'HĐ vụ việc') mainKey = 'HD_VU_VIEC';

        if (!mainKey) {
            if (matchedRows <= 5) Logger.log(`Dòng ${index + 2}: Không khớp Loại HD. Giá trị nhận được: "${loaiHD}"`);
            return;
        }
        groupMatched++;

        let subKey = master.LoaiDV;
        if (mainKey === 'HD_DAI_HAN' && loaiHD === 'HĐ 68') {
            subKey = 'Hợp đồng 68';
        }

        if (!groups[mainKey].data[subKey]) groups[mainKey].data[subKey] = {};

        const deptKey = master.NhomDV;
        if (!groups[mainKey].data[subKey][deptKey]) groups[mainKey].data[subKey][deptKey] = createMetrics();

        const m = groups[mainKey].data[subKey][deptKey];
        m.HSBac += parseNumber(row[idxL1.HSBac]);
        m.HSChucVu += parseNumber(row[idxL1.HSChucVu]);
        m.HSVượtKhung += parseNumber(row[idxL1.HSVượtKhung]);
        m.HSNganh += parseNumber(row[idxL1.HSNganh]);
        m.HSThamNien += parseNumber(row[idxL1.HSThamNien]);
        m.HSDocHaiTN += (parseNumber(row[idxL1.HSDocHai]) + parseNumber(row[idxL1.HSTrachNhiem]) + parseNumber(row[idxL1.HSTuVe]));
        m.TongLuong += parseNumber(row[idxL1.TongLuong]);
        m.BHXH += parseNumber(row[idxL1.BHXH]);
        m.BHYT += parseNumber(row[idxL1.BHYT]);
        m.BHTN += parseNumber(row[idxL1.BHTN]);
        m.KPCD += parseNumber(row[idxL1.KPCD]);
        m.NuocNgoai += parseNumber(row[idxL1.NuocNgoai]);
        m.NghiBHXH += parseNumber(row[idxL1.NghiBHXH]);
    });
    Logger.log(`Kết quả lọc: Tìm thấy ${matchedRows} dòng tháng ${monthStr}. Khớp Master: ${masterMatched}. Khớp Nhóm: ${groupMatched}`);

    // 4. BUILD OUTPUT ARRAY
    const result = [];

    function finalizeMetrics(m) {
        m.GiamTru = m.BHXH + m.BHYT + m.BHTN + m.KPCD + m.NuocNgoai + m.NghiBHXH;
        m.BHTra = m.NghiBHXH;
        m.SoTienLinh = m.TongLuong - m.GiamTru;
    }

    function addRowToTable(stt, content, m) {
        if (!m) {
            result.push([stt, content, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
            return;
        }
        finalizeMetrics(m);
        result.push([
            stt, content,
            m.HSBac, m.HSChucVu, m.HSVượtKhung, m.HSNganh, m.HSThamNien, m.HSDocHaiTN,
            m.TongLuong, m.BHXH, m.BHYT, m.BHTN, m.KPCD, m.NuocNgoai, m.NghiBHXH,
            '', '',
            m.GiamTru, m.BHTra, m.SoTienLinh
        ]);
    }

    const MAIN_ORDER = ['BIEN_CHE', 'HD_DAI_HAN', 'HD_VU_VIEC'];
    const grandTotal = createMetrics();

    MAIN_ORDER.forEach(mainKey => {
        const groupData = groups[mainKey].data;
        if (Object.keys(groupData).length === 0) return;

        if (mainKey !== 'BIEN_CHE') {
            addRowToTable('', groups[mainKey].label, null);
        }

        const subTotal = createMetrics();
        let subOrder = ['Bộ phận quản lý', 'Bộ phận trực tiếp'];
        if (mainKey === 'HD_DAI_HAN') subOrder.push('Hợp đồng 68');

        subOrder.forEach((subKey, idx) => {
            const depts = groupData[subKey];
            if (!depts) return;

            const subMetrics = createMetrics();
            Object.values(depts).forEach(dm => {
                Object.keys(subMetrics).forEach(k => subMetrics[k] += dm[k]);
            });

            if (subKey === 'Bộ phận quản lý') {
                addRowToTable(idx + 1, subKey, null);
                addRowToTable('', 'Trong đó:', null);

                Object.keys(depts).forEach(deptName => {
                    addRowToTable('', deptName, depts[deptName]);
                });
                addRowToTable('', 'Cộng bộ phận quản lý', subMetrics);
            } else {
                addRowToTable(idx + 1, subKey, subMetrics);
            }

            Object.keys(subTotal).forEach(k => subTotal[k] += subMetrics[k]);
        });

        const footerLabel = mainKey === 'BIEN_CHE' ? 'Cộng biên chế' :
            mainKey === 'HD_DAI_HAN' ? 'Cộng HĐ dài hạn' : 'Cộng HĐ vụ việc';
        addRowToTable('', footerLabel, subTotal);
        Object.keys(grandTotal).forEach(k => grandTotal[k] += subTotal[k]);
    });

    if (result.length > 0) {
        addRowToTable('', 'T\u1ed5ng c\u1ed9ng', grandTotal);
    }

    // 5. WRITE TO SHEET
    const ssExport = SpreadsheetApp.openById(EXPORT_FILE_ID);
    let sheet = ssExport.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = ssExport.insertSheet(SHEET_NAME);
    else {
        // Xóa toàn bộ dữ liệu và định dạng (borders, styles, merge) từ dòng 10 trở đi
        const lastR = sheet.getLastRow();
        if (lastR >= 10) {
            sheet.getRange(10, 1, lastR - 9, sheet.getMaxColumns()).clear();
        }
    }

    if (result.length > 0) {
        const dataRange = sheet.getRange(10, 1, result.length, 20);
        dataRange.setValues(result);

        // 1. Font & Body Size
        dataRange.setFontFamily('Arial').setFontSize(10.5);

        // 2. Number Format
        // Columns 3-8: Hệ số (4 decimal)
        sheet.getRange(10, 3, result.length, 6).setNumberFormat('0.0000');
        // Columns 9-20: Tiền (Thousands separator)
        sheet.getRange(10, 9, result.length, 12).setNumberFormat('#,##0');

        // 3. Bold rows based on logic
        for (let i = 0; i < result.length; i++) {
            const rowIdx = 10 + i;
            const stt = String(result[i][0]).trim();
            const content = String(result[i][1]).trim();

            // Bold if STT is present OR contains "Cộng", "Tổng cộng"
            const isBold = stt !== '' ||
                content.includes('Cộng') ||
                content.includes('Tổng cộng');

            sheet.getRange(rowIdx, 1, 1, 20).setFontWeight(isBold ? 'bold' : 'normal');
        }

        // 4. Alignment
        sheet.getRange(10, 1, result.length, 1).setHorizontalAlignment('center'); // STT center
    }

    // Header Title
    const monthParts = monthStr.substring(1).split('.');
    const month = parseInt(monthParts[0]);
    const year = monthParts[1];
    sheet.getRange("A1:T3").setFontSize(12); // Đảm bảo các tiêu đề trên (nếu có) là size 12
    sheet.getRange("A4:T4").merge().setValue(`THÁNG ${month < 10 ? '0' + month : month} NĂM ${year}`)
        .setFontWeight('bold').setFontSize(12).setHorizontalAlignment('center');

    // ====== BƯỚC CUỐI: TẠO ĐƯỜNG KẺ BẢNG ======
    const totalTableRows = result.length + 2; // Header 8-9 + Data
    const finalTableRange = sheet.getRange(8, 1, totalTableRows, 20);
    // 1. Viền ngoài và kẻ dọc: Nét liền (SOLID)
    finalTableRange.setBorder(true, true, true, true, true, null, 'black', SpreadsheetApp.BorderStyle.SOLID);
    // 2. Kẻ ngang nội dung: Nét đứt (DOTTED)
    finalTableRange.setBorder(null, null, null, null, null, true, 'black', SpreadsheetApp.BorderStyle.DOTTED);
    // 3. Header (Dòng 8-9): Nét liền toàn bộ
    sheet.getRange(8, 1, 2, 20).setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.SOLID)
        .setFontWeight('bold').setFontSize(11).setHorizontalAlignment('center').setVerticalAlignment('middle');
    sheet.getRange(9, 1, 1, 20).setFontSize(10);
    // 4. Các dòng đặc biệt (Bold): Nét liền cho chân dòng
    for (let i = 0; i < result.length; i++) {
        const rowIdx = 10 + i;
        const stt = String(result[i][0]).trim();
        const content = String(result[i][1]).trim();
        if (stt !== '' || content.includes('Cộng') || content.includes('Tổng cộng')) {
            sheet.getRange(rowIdx, 1, 1, 20).setBorder(null, null, true, null, null, null, 'black', SpreadsheetApp.BorderStyle.SOLID);
        }
    }

    Logger.log(`Finished writing ${result.length} rows to sheet`);
    return `https://docs.google.com/spreadsheets/d/${EXPORT_FILE_ID}/export?format=pdf&size=A4&portrait=false&fitw=true&gridlines=false&horizontal_alignment=CENTER&left_margin=0.5&right_margin=0.25&top_margin=0.5&bottom_margin=0.25`;
}
