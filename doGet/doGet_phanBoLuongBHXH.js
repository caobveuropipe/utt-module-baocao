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
        DonVi: getIdx(hL1, ['Đơn vị', 'DonVi', 'Mã đơn vị', 'Mã ĐV']),
        HSBac: getIdx(hL1, ['HS bậc', 'HS Bậc', 'HSBac']),
        HSChucVu: getIdx(hL1, ['HS chức vụ', 'HS CV', 'HSCV']),
        HSVượtKhung: getIdx(hL1, ['HS vượt khung', 'HSVK']),
        HSNganh: getIdx(hL1, ['HS ngành', 'HS Nghề', 'HSGD']),
        HSThamNien: getIdx(hL1, ['HS thâm niên', 'HSTN']),
        HSDocHai: getIdx(hL1, ['HS độc hại', 'HSDH']),
        HSTrachNhiem: getIdx(hL1, ['HS trách nhiệm', 'HSTNhiem']),
        HSTuVe: getIdx(hL1, ['HS tự vệ', 'HSTV']),
        TongLuong: getIdx(hL1, ['Tổng lương', 'TongLuong']),
        TongLuong1: getIdx(hL1, ['Tổng lương 1', 'TongLuong1', 'Thực lĩnh', 'ThucLinh']),
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
        HSBac: 0, HSChucVu: 0, HSVượtKhung: 0, HSNganh: 0, HSThamNien: 0, HSDocHai: 0, HSTrachNhiem: 0,
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

        // Lọc bỏ trường hợp nghỉ thai sản / không hưởng lương (Thực lĩnh/Tổng lương 1 rỗng)
        const thucLinhVal = row[idxL1.TongLuong1];
        let isValidThucLinh = false;
        if (thucLinhVal !== null && thucLinhVal !== undefined) {
            if (typeof thucLinhVal === 'number') {
                isValidThucLinh = thucLinhVal >= 0;
            } else if (typeof thucLinhVal === 'string') {
                const clean = thucLinhVal.trim().replace(/,/g, "");
                if (clean !== "") {
                    const parsed = parseFloat(clean);
                    isValidThucLinh = !isNaN(parsed) && parsed >= 0;
                }
            }
        }
        if (!isValidThucLinh) return;

        matchedRows++;

        const loaiHD = String(row[idxL1.LoaiHD] || '').trim();
        const donViRaw = String(row[idxL1.DonVi] || '').trim();

        // Chuẩn hóa mã đơn vị: Chỉ pad thêm số 0 khi độ dài mã gốc < 3 ký tự (ví dụ: '2' hoặc '02' -> 'DV002', '7B' -> 'DV007B')
        // Giữ nguyên các mã có độ dài từ 3 ký tự trở lên (như '0091', '00A'...)
        const rawCode = donViRaw.split('-')[0].trim();
        let maDV = 'DV' + rawCode;
        if (rawCode.length < 3) {
            const codeMatch = rawCode.match(/^(\d+)(.*)$/);
            if (codeMatch) {
                maDV = 'DV' + codeMatch[1].padStart(3, '0') + (codeMatch[2] || '');
            }
        }

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
        } else if (mainKey === 'HD_VU_VIEC') {
            subKey = 'Tất cả';
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
        m.HSDocHai += parseNumber(row[idxL1.HSDocHai]);
        m.HSTrachNhiem += (parseNumber(row[idxL1.HSTrachNhiem]) + parseNumber(row[idxL1.HSTuVe]));
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
            result.push([stt, content, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
            return;
        }
        finalizeMetrics(m);
        result.push([
            stt, content,
            m.HSBac, m.HSChucVu, m.HSVượtKhung, m.HSNganh, m.HSThamNien, m.HSDocHai, m.HSTrachNhiem,
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
        if (mainKey === 'HD_VU_VIEC') {
            const depts = groupData['Tất cả'];
            if (depts) {
                addRowToTable('', 'Trong đó:', null);
                Object.keys(depts).forEach(deptName => {
                    addRowToTable('', deptName, depts[deptName]);
                    Object.keys(subTotal).forEach(k => subTotal[k] += depts[deptName][k]);
                });
            }
        } else {
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
        }

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

    // Replace "Thiện nguyện" with "Quỹ XH" in headers (row 7-8) dynamically
    const headerRange = sheet.getRange(7, 1, 2, 20);
    const headerValues = headerRange.getValues();
    for (let r = 0; r < headerValues.length; r++) {
        for (let c = 0; c < headerValues[r].length; c++) {
            if (String(headerValues[r][c]).trim() === "Thiện nguyện") {
                sheet.getRange(7 + r, 1 + c).setValue("Quỹ XH");
            } else if (String(headerValues[r][c]).trim() === "KPCĐ") {
                sheet.getRange(7 + r, 1 + c).setValue("Đoàn phí CĐ");
            }
        }
    }

    // Tự động tìm và tách cột ĐH + TN trên Sheet
    let foundDH = false;
    for (let r = 6; r <= 8; r++) {
        for (let c = 1; c <= sheet.getLastColumn(); c++) {
            const val = String(sheet.getRange(r, c).getValue()).trim();
            if (val.includes("ĐH") && val.includes("TN")) {
                // Hủy merge cũ trước khi chèn cột để tránh lỗi "You must select all cells in a merged range"
                try {
                    const titleRange = sheet.getRange("A4:U4");
                    const merges = titleRange.getMergedRanges();
                    for (let i = 0; i < merges.length; i++) {
                        merges[i].breakApart();
                    }
                } catch (e) { }

                try {
                    // Dòng 7: Hủy merge của "Hệ số" (từ cột 3 đến cột 8)
                    const heSoRange = sheet.getRange(7, 3, 1, 6);
                    const merges = heSoRange.getMergedRanges();
                    for (let i = 0; i < merges.length; i++) {
                        merges[i].breakApart();
                    }
                } catch (e) { }

                sheet.insertColumnAfter(c);
                sheet.getRange(r, c).setValue("ĐH");
                sheet.getRange(r, c + 1).setValue("TN");

                // Merge lại "Hệ số" mới (từ cột 3 đến cột 9) ở dòng 7
                try {
                    sheet.getRange(7, 3, 1, 7).merge().setValue("Hệ số").setHorizontalAlignment("center").setFontWeight("bold");
                } catch (e) { }

                // Cập nhật lại các dòng hiển thị số thứ tự cột và công thức ở dòng r + 1 (Dòng 8) và r + 2 (Dòng 9)
                sheet.getRange(r + 1, c).setValue(c);
                sheet.getRange(r + 1, c + 1).setValue(c + 1);
                for (let col = c + 2; col <= 21; col++) {
                    sheet.getRange(r + 1, col).setValue(col);
                }

                // Ghi đè các công thức tĩnh vào các cột tương ứng ở dòng r + 2 (Dòng 9)
                sheet.getRange(r + 2, 10).setValue("10 = (3+4+5+6+7+8+9) * 2.340.000");
                sheet.getRange(r + 2, 11).setValue("11 = (3+4+5+7) * 2.340.000");
                sheet.getRange(r + 2, 12).setValue("12 = (3+4+5+7) * 2.340.000");
                sheet.getRange(r + 2, 13).setValue("13 = (3+4+5+7) * 2.340.000");
                sheet.getRange(r + 2, 14).setValue("14 = (3+4+5+7) * 2.340.000");
                sheet.getRange(r + 2, 19).setValue("19 = 11+12+13+14+15+16+17+18");
                sheet.getRange(r + 2, 21).setValue("21 = 10 - 19");

                foundDH = true;
                break;
            }
        }
        if (foundDH) break;
    }

    const headerCleanupCols = Math.min(sheet.getMaxColumns(), 22);

    // Hủy merge cũ trên vùng header để tránh merge tràn từ template
    for (let rowIdx = 6; rowIdx <= 10; rowIdx++) {
        try {
            const rowRange = sheet.getRange(rowIdx, 1, 1, headerCleanupCols);
            const merges = rowRange.getMergedRanges();
            for (let i = 0; i < merges.length; i++) {
                merges[i].breakApart();
            }
        } catch (e) { }
    }

    sheet.getRange(6, 1, 5, headerCleanupCols).clear();

    // Merge lại các tiêu đề nhóm/detail đúng chuẩn: group row 7, detail rows 8-9, index/formula row 10
    try {
        sheet.getRange("A8:A9").merge().setValue("Stt").setHorizontalAlignment("center").setVerticalAlignment("middle").setFontWeight("bold");
        sheet.getRange("B8:B9").merge().setValue("Nội dung").setHorizontalAlignment("center").setVerticalAlignment("middle").setFontWeight("bold");
        sheet.getRange("C7:I7").merge().setValue("Hệ số").setHorizontalAlignment("center").setVerticalAlignment("middle").setFontWeight("bold");
        sheet.getRange("J8:J9").merge().setValue("Tổng lương").setHorizontalAlignment("center").setVerticalAlignment("middle").setFontWeight("bold");
        sheet.getRange("K7:N7").merge().setValue("Các khoản phải nộp theo lương").setHorizontalAlignment("center").setVerticalAlignment("middle").setFontWeight("bold");
        sheet.getRange("O7:P7").merge().setValue("Các khoản giảm trừ").setHorizontalAlignment("center").setVerticalAlignment("middle").setFontWeight("bold");
        sheet.getRange("Q7:R7").merge().setValue("Trừ khác").setHorizontalAlignment("center").setVerticalAlignment("middle").setFontWeight("bold");
        sheet.getRange("S7:S9").merge().setValue("Cộng các khoản giảm trừ").setHorizontalAlignment("center").setVerticalAlignment("middle").setFontWeight("bold");
        sheet.getRange("T7:T9").merge().setValue("BH trả").setHorizontalAlignment("center").setVerticalAlignment("middle").setFontWeight("bold");
        sheet.getRange("U7:U9").merge().setValue("Số tiền được lĩnh").setHorizontalAlignment("center").setVerticalAlignment("middle").setFontWeight("bold");
    } catch (e) { }

    // Ghi lại các tiêu đề cột chi tiết ở dòng 8-9
    const detailHeaders = [
        "Lương\nngạch bậc", "Chức vụ", "Vượt\nkhung", "P/c\nngành", "Thâm niên", "ĐH", "TN",
        "BHXH", "BHYT", "BHTN", "Đoàn phí\nCĐ", "N/ngoài", "Nghỉ BHXH", "Tạm ứng tạm\ngiữ", "Quỹ XH"
    ];
    [3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18].forEach((col, idx) => {
        sheet.getRange(8, col, 2, 1).merge().setValue(detailHeaders[idx]);
    });

    // Luôn định dạng và ghi đè dòng 10: số thứ tự cột + công thức diễn giải
    sheet.getRange(10, 1, 1, 21).clearContent().setNumberFormat('@');
    const indexAndFormulaRow = [
        "1", "2", "3", "4", "5", "6", "7", "8", "9",
        "10=(3+4+5+6+7+8+9)\n*2.340.000",
        "11=(3+4+5+7)\n*2.340.000",
        "12=(3+4+5+7)\n*2.340.000",
        "13=(3+4+5+7)\n*2.340.000",
        "14=(3+4+5+7)\n*2.340.000",
        "15", "16", "17", "18",
        "19=11+12+13\n+14+15+16+17+18",
        "20",
        "21=10-19"
    ];
    sheet.getRange(10, 1, 1, 21).setValues([indexAndFormulaRow]);

    if (result.length > 0) {
        const dataRange = sheet.getRange(11, 1, result.length, 21);
        dataRange.setValues(result);

        // 1. Font & Body Size
        dataRange.setFontFamily('Arial').setFontSize(10.5);

        // 2. Number Format
        // Columns 3-9: Hệ số (3 decimal)
        sheet.getRange(11, 3, result.length, 7).setNumberFormat('0.000');
        // Columns 10-21: Tiền (Thousands separator)
        sheet.getRange(11, 10, result.length, 12).setNumberFormat('#,##0');

        // 3. Bold rows based on logic
        for (let i = 0; i < result.length; i++) {
            const rowIdx = 11 + i;
            const stt = String(result[i][0]).trim();
            const content = String(result[i][1]).trim();

            // Bold if STT is present OR contains "Cộng", "Tổng cộng"
            const isBold = stt !== '' ||
                content.includes('Cộng') ||
                content.includes('Tổng cộng');

            sheet.getRange(rowIdx, 1, 1, 21).setFontWeight(isBold ? 'bold' : 'normal');
        }

        // 4. Alignment
        sheet.getRange(11, 1, result.length, 1).setHorizontalAlignment('center'); // STT center
    }

    // Header Title
    const monthParts = monthStr.substring(1).split('.');
    const month = parseInt(monthParts[0]);
    const year = monthParts[1];
    sheet.getRange("A1:U3").setFontSize(12); // Đảm bảo các tiêu đề trên (nếu có) là size 12
    try {
        const titleRange = sheet.getRange("A4:U4");
        const merges = titleRange.getMergedRanges();
        for (let i = 0; i < merges.length; i++) {
            merges[i].breakApart();
        }
    } catch (e) { }
    sheet.getRange("A4:U4").merge().setValue(`THÁNG ${month < 10 ? '0' + month : month} NĂM ${year}`)
        .setFontWeight('bold').setFontSize(12).setHorizontalAlignment('center');

    // ====== BƯỚC CUỐI: TẠO ĐƯỜNG KẺ BẢNG ======
    const totalTableRows = result.length + 4; // Header 7-10 + Data
    const finalTableRange = sheet.getRange(7, 1, totalTableRows, 21);
    // 1. Viền ngoài và kẻ dọc: Nét liền (SOLID)
    finalTableRange.setBorder(true, true, true, true, true, null, 'black', SpreadsheetApp.BorderStyle.SOLID);
    // 2. Kẻ ngang nội dung: Nét đứt (DOTTED)
    finalTableRange.setBorder(null, null, null, null, null, true, 'black', SpreadsheetApp.BorderStyle.DOTTED);
    // 3. Header (Dòng 7-10): Nét liền toàn bộ
    sheet.getRange(7, 1, 4, 21).setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.SOLID)
        .setFontWeight('bold').setFontSize(11).setHorizontalAlignment('center').setVerticalAlignment('middle');
    sheet.getRange(8, 1, 3, 21).setWrap(true);
    sheet.getRange(10, 1, 1, 21).setFontSize(10).setFontWeight('bold');
    // 4. Các dòng đặc biệt (Bold): Nét liền cho chân dòng
    for (let i = 0; i < result.length; i++) {
        const rowIdx = 11 + i;
        const stt = String(result[i][0]).trim();
        const content = String(result[i][1]).trim();
        if (stt !== '' || content.includes('Cộng') || content.includes('Tổng cộng')) {
            sheet.getRange(rowIdx, 1, 1, 21).setBorder(null, null, true, null, null, null, 'black', SpreadsheetApp.BorderStyle.SOLID);
        }
    }

    // Chỉ giữ vùng báo cáo A:U, tránh cột V trống bị xuất ra Excel/PDF.
    const maxColumns = sheet.getMaxColumns();
    if (maxColumns > 21) {
        sheet.deleteColumns(22, maxColumns - 21);
    }

    Logger.log(`Finished writing ${result.length} rows to sheet`);
    return `https://docs.google.com/spreadsheets/d/${EXPORT_FILE_ID}/export?format=pdf&size=A4&portrait=false&fitw=true&gridlines=false&horizontal_alignment=CENTER&left_margin=0.5&right_margin=0.25&top_margin=0.5&bottom_margin=0.25`;
}

/**
 * Cung cấp dữ liệu JSON cho việc in ấn Bảng phân bổ tiền lương và BHXH trên Client
 */
function getPrintDataPhanBoLuongBHXH(monthStr, location) {
    try {
        // 1. Tạo bảng và tính toán các công thức trên Google Sheets
        doGet_taoBangPhanBoLuongBHXH(monthStr, location);

        // 2. Đọc giá trị đã tính toán từ sheet
        const ss = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.EXPORT_HT_PHAN_BO_LUONG_BHXH);
        const sheet = ss.getSheetByName(GLOBAL_CONFIG.SHEETS.SHEET_TH_LUONG);
        const lastRow = sheet.getLastRow();
        const lastCol = Math.min(sheet.getLastColumn(), 21);

        // Header báo cáo phân bổ bắt đầu từ dòng 7; dòng 6 của template phải bỏ qua.
        const data = sheet.getRange(7, 1, lastRow - 6, lastCol).getValues();

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
