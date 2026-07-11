function test_doGet_taoBangHachToanLuongVaTruyLinh() {
    const monthStr = 'T01.2025';
    const result = doGet_taoBangHachToanLuongVaTruyLinh(monthStr);
    console.log(result);
}

function doGet_taoBangHachToanLuongVaTruyLinh(monthStr, location) {
    const EXPORT_FILE_ID = GLOBAL_CONFIG.FILES.EXPORT_HT_TH_LUONG_VA_TTTL;
    const SHEET_NAME = 'THHachToanLuong';

    try {
        const setupData = getData(GLOBAL_CONFIG.FILES.MASTER_DATA, 'Setup');
        const dataLuong1 = getData(GLOBAL_CONFIG.FILES.DATA_LUONG_1, GLOBAL_CONFIG.SHEETS.DATA_LUONG_1);
        const dataLuong2 = getData(GLOBAL_CONFIG.FILES.DATA_LUONG_2, GLOBAL_CONFIG.SHEETS.DATA_LUONG_2);
        const truyThu1 = getData(GLOBAL_CONFIG.FILES.TRUY_THU_LUONG_1, GLOBAL_CONFIG.SHEETS.DATA_TRUY_THU);
        const truyThu2 = getData(GLOBAL_CONFIG.FILES.TRUY_THU_LUONG_2, 'DataTruyThuLinh');
        const dataAnCa = getData(GLOBAL_CONFIG.FILES.DATA_AN_CA, GLOBAL_CONFIG.SHEETS.DATA_AN_CA);
        const dataNS = getData(GLOBAL_CONFIG.FILES.DB_DATA_CHOT_NS, GLOBAL_CONFIG.SHEETS.DATA_CHOT_NS);

        const result = doGet_processHachToanLuongVaTruyLinh(monthStr, setupData, dataLuong1, dataLuong2, truyThu1, truyThu2, dataAnCa, dataNS, location);

        const ss = SpreadsheetApp.openById(EXPORT_FILE_ID);
        let sheet = ss.getSheetByName(SHEET_NAME);
        if (!sheet) {
            sheet = ss.insertSheet(SHEET_NAME);
        }
        sheet.clear();
        sheet.getRange("A:T").clearFormat();

        // 1. Title
        sheet.getRange("A1:C1").merge().setValue("TRƯỜNG ĐẠI HỌC CÔNG NGHỆ GTVT").setFontWeight("bold").setFontSize(12).setHorizontalAlignment("center");
        sheet.getRange("A2:C2").merge().setValue("──────────").setFontWeight("normal").setFontSize(10).setHorizontalAlignment("center");
        sheet.getRange("A3").setValue("BẢNG KÊ HẠCH TOÁN LƯƠNG VÀ TRUY LĨNH LƯƠNG THÁNG " + monthStr)
            .setFontSize(12).setFontWeight("bold").setHorizontalAlignment("center");
        sheet.getRange("A3:T3").merge();

        // 2. Header Structure
        const header1 = [
            "Nội dung", "Tổng lương, PC theo lương và truy lĩnh", "Lương chính tháng " + monthStr, "", "",
            "Phụ cấp chức vụ", "Các khoản phụ cấp theo lương", "", "", "",
            "Các khoản khấu trừ", "", "", "", "", "", "", "", "", "Thực lĩnh"
        ];
        const header2 = [
            "", "", "LC 100%", "Treo 60% NN+Th.sản", "LC hạch toán",
            "PCCV", "PCVK", "PCGV", "PCTNGV", "PCTN",
            "BHXH", "BHYT", "BHTN", "KPCĐ", "Quỹ TN", "hưởng 40% đi NN", "Tạm ứng", "treo lương", "Thuế TNCN", ""
        ];

        sheet.getRange(5, 1, 1, header1.length).setValues([header1]);
        sheet.getRange(6, 1, 1, header2.length).setValues([header2]);

        const merges = ["A5:A6", "B5:B6", "C5:E5", "F5:F6", "G5:J5", "K5:S5", "T5:T6"];
        merges.forEach(m => sheet.getRange(m).merge().setVerticalAlignment("middle").setHorizontalAlignment("center"));

        const headRange = sheet.getRange(5, 1, 2, header1.length);
        headRange.setFontWeight("bold").setBackground("#F3F4F6").setBorder(true, true, true, true, true, true).setHorizontalAlignment("center").setVerticalAlignment("middle").setFontSize(11);
        headRange.setWrap(true);

        // 3. Write Data
        if (result && result.length > 0) {
            sheet.getRange(7, 1, result.length, result[0].length).setValues(result);
            sheet.getRange(7, 2, result.length, result[0].length - 1).setNumberFormat("#,##0");

            result.forEach((row, idx) => {
                const rowIndex = idx + 7;
                const content = String(row[0]);
                if (content.match(/^[I-V]\./) || content.match(/^[A-D]\./) || (content.match(/^[0-9]\./) && content.length < 30) || content.includes("Tổng cộng") || content.includes("TỔNG CỘNG") || content.startsWith("A.") || content.startsWith("B.") || content.startsWith("C.") || content.startsWith("D.")) {
                    sheet.getRange(rowIndex, 1, 1, result[0].length).setFontWeight("bold");
                    // Left align and merge for summary/group rows
                    if (content.includes("Tổng") || content.includes("TỔNG CỘNG") || content.match(/^[A-C]\./)) {
                        sheet.getRange(rowIndex, 1).setHorizontalAlignment("left"); // Column 1 starts with content here usually
                    }
                }
                if (content.startsWith("I. ") || content.startsWith("II. ")) {
                    sheet.getRange(rowIndex, 1, 1, result[0].length).setBackground("#B2DFDB");
                } else if (content.match(/^[0-9]\./) && content.length < 30) {
                    sheet.getRange(rowIndex, 1, 1, result[0].length).setBackground("#E0F2F1");
                } else if (content.startsWith("A.") || content.startsWith("B.") || content.startsWith("C.") || content.startsWith("D.") || content.includes("Tổng cộng") || content.includes("TỔNG CỘNG")) {
                    sheet.getRange(rowIndex, 1, 1, result[0].length).setBackground("#FFEBEE");
                }
            });
        }

        sheet.setColumnWidth(1, 400);
        sheet.setColumnWidth(2, 130);
        for (let i = 3; i <= 20; i++) sheet.setColumnWidth(i, 95);

        // Signature Area
        const targetRow = sheet.getLastRow() + 2;
        const masterSheet = ss.getSheetByName('Master');
        if (masterSheet) {
            const srcRange = masterSheet.getRange("A1:T2");
            const targetRange = sheet.getRange(targetRow, 1, 2, 20);
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

        // --- STYLING CHUẨN ---
        const lastR = sheet.getLastRow();
        const lastC = sheet.getLastColumn();
        const fullRange = sheet.getRange(1, 1, lastR, lastC);

        // 1. Ẩn gridlines, Reset border & Set Font
        fullRange.setBackground('#FFFFFF').setBorder(false, false, false, false, false, false).setFontFamily('Arial').setFontSize(10.5);

        // Cấu hình lại font size cho dòng tiêu đề và header để không bị ghi đè bởi fullRange
        sheet.getRange("A1").setFontSize(12);
        sheet.getRange("A2").setFontSize(10).setFontWeight("normal");
        sheet.getRange("A3").setFontSize(12).setFontWeight("bold");
        sheet.getRange(5, 1, 2, 20).setFontSize(11);

        // ====== BƯỚC CUỐI: TẠO ĐƯỜNG KẺ BẢNG ======
        const finalTableRange = sheet.getRange(5, 1, result.length + 2, 20); // Header dòng 5-6 + Data
        // 1. Viền ngoài và kẻ dọc: Nét liền (SOLID)
        finalTableRange.setBorder(true, true, true, true, true, null, 'black', SpreadsheetApp.BorderStyle.SOLID);
        // 2. Kẻ ngang nội dung: Nét đứt (DOTTED)
        finalTableRange.setBorder(null, null, null, null, null, true, 'black', SpreadsheetApp.BorderStyle.DOTTED);
        // 3. Header: Nét liền toàn bộ
        sheet.getRange(5, 1, 2, 20).setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.SOLID);
        // 4. Các dòng đặc biệt (Bold): Nét liền
        result.forEach((row, idx) => {
            const rowIndex = idx + 7;
            const content = String(row[0]);
            if (content.match(/^[I-V]\./) || content.match(/^[A-D]\./) || (content.match(/^[0-9]\./) && content.length < 30) || content.includes("Tổng cộng") || content.includes("TỔNG CỘNG") || content.startsWith("A.") || content.startsWith("B.") || content.startsWith("C.") || content.startsWith("D.")) {
                sheet.getRange(rowIndex, 1, 1, 20).setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.SOLID);
            }
        });

        // FR-02: set row height for school name & underline at the very end
        sheet.setRowHeight(1, 22);
        sheet.setRowHeight(2, 18);
        sheet.setRowHeight(3, 28); // Title row height
        sheet.getRange("A1:C1").setFontSize(10).setFontWeight('bold').setHorizontalAlignment('center');
        sheet.getRange("A2:C2").setFontSize(10).setFontWeight('normal').setHorizontalAlignment('center');
        sheet.getRange("A3:T3").setFontSize(12).setFontWeight('bold').setHorizontalAlignment('center');

        // Giảm 15% độ rộng cột Nội dung (Cột A - 1) để nhường diện tích cho các cột khác
        const colAWidth = sheet.getColumnWidth(1);
        if (colAWidth > 0) {
            sheet.setColumnWidth(1, Math.round(colAWidth * 0.80));
        }

        return {
            status: 'success',
            downloadUrl: `https://docs.google.com/spreadsheets/d/${EXPORT_FILE_ID}/export?format=pdf&size=A4&portrait=false&fitw=true&gridlines=false&horizontal_alignment=CENTER&left_margin=0.5&right_margin=0.25&top_margin=0.5&bottom_margin=0.25`
        };

    } catch (e) {
        return { status: 'error', message: e.toString() };
    }
}

/**
 * Cung cấp dữ liệu JSON cho việc in ấn Bảng hạch toán lương và truy lĩnh trên Client
 */
function getPrintDataHachToanLuongVaTruyLinh(monthStr, location) {
    try {
        // 1. Tạo bảng và tính toán các công thức trên Google Sheets
        doGet_taoBangHachToanLuongVaTruyLinh(monthStr, location);

        // 2. Đọc giá trị đã tính toán từ sheet
        const ss = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.EXPORT_HT_TH_LUONG_VA_TTTL);
        const sheet = ss.getSheetByName('THHachToanLuong');
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

function doGet_processHachToanLuongVaTruyLinh(monthStr, setupData, dataLuong1, dataLuong2, truyThu1, truyThu2, dataAnCa, dataNS, targetLocation) {
    const locationNormalized = targetLocation && targetLocation !== 'All' ? normalizeLocation(targetLocation) : null;
    const LCB = 2340000;
    const targetMonth = String(monthStr).trim().replace(/^T/, '');

    // 1. Setup Data: Unit -> Group (Direct/Indirect)
    const unitToType = {};
    const setupHeader = setupData[0] || [];
    const setupIdx = {
        MaBP: getIdx(setupHeader, ['Mã đơn vị', 'Mã bộ phận', 'MaBP']),
        Nhom: getIdx(setupHeader, ['Loại chi phí', 'LoaiChiPhi', 'Nhóm', 'Phân nhóm', 'Nhom'])
    };
    Logger.log(`Setup data loaded: ${setupData.length - 1} rows (excluding header).`);
    let unitMapCount = 0;
    setupData.forEach((row, i) => {
        if (i === 0) return;
        const code = String(row[setupIdx.MaBP] || '').trim();
        const type = String(row[setupIdx.Nhom] || '').trim();
        if (code) {
            unitToType[code] = type;
            unitMapCount++;
        }
    });
    Logger.log(`Unit-to-type map built: ${unitMapCount} entries.`);

    // 2. Personnel Data: MaNS -> Contract Type, Unit
    const personnel = {};
    const allPersonnelRecords = {};
    const nsHeader = dataNS[0] || [];
    const nsIdx = {
        Ky: getIdx(nsHeader, ['Kỳ lương', 'Kỳ', 'Ky']),
        Ma: getIdx(nsHeader, ['Mã nhân sự', 'Mã NS', 'MaNS', 'Ma']),
        LoaiHD: getIdx(nsHeader, ['Loại hợp đồng', 'LoaiHD']),
        MaBP: getIdx(nsHeader, ['Mã đơn vị', 'Mã bộ phận', 'MaBP']),
        DonVi: getIdx(nsHeader, ['Đơn vị', 'DonVi'])
    };
    let personnelCount = 0;
    let allCount = 0;
    dataNS.forEach((row, i) => {
        if (i === 0) return;
        const ma = String(row[nsIdx.Ma] || '').trim();
        if (!ma) return;
        allCount++;
        const kyRow = String(row[nsIdx.Ky] || '').trim().replace(/^T/, '');
        const record = {
            LoaiHD: String(row[nsIdx.LoaiHD] || '').trim(),
            MaBP: String(row[nsIdx.MaBP] || row[nsIdx.DonVi] || '').trim()
        };

        if (kyRow === targetMonth) {
            // Lọc theo khu vực nếu có yêu cầu
            const kv = normalizeLocation(row[38]); // Cột AM
            if (locationNormalized && kv !== locationNormalized) return;

            personnel[ma] = record;
            personnelCount++;
        }
        allPersonnelRecords[ma] = record; // Lưu kỷ lục cuối cùng thấy được của nhân sự này
    });
    Logger.log(`Personnel data for month ${monthStr}: ${personnelCount} records matched month, ${allCount} total records processed.`);

    const getContractType = (ma) => {
        const p = personnel[ma] || allPersonnelRecords[ma];
        if (!p) {
            Logger.log(`⚠️ getContractType: Mã nhân sự ${ma} không có thông tin hợp đồng, sẽ dùng 'HĐ ngắn hạn' làm mặc định.`);
            return 'HĐ ngắn hạn';
        }

        const lhd = String(p.LoaiHD).toUpperCase().trim();
        if (lhd.includes('BIÊN CHẾ') || lhd === 'BC') return 'Biên chế';
        if (lhd.includes('68') || lhd.includes('LƯƠNG CỐ ĐỊNH')) return 'HĐ 68';
        if (lhd.includes('DÀI HẠN') || lhd.includes('THƯỜNG XUYÊN')) return 'HĐ dài hạn';
        if (lhd.includes('VỤ VIỆC') || lhd.includes('NGẮN HẠN')) {
            if (lhd.includes('CỐ ĐỊNH')) return 'HĐ ngắn hạn (cố định)';
            return 'HĐ ngắn hạn';
        }
        Logger.log(`⚠️ getContractType: Mã ${ma} có Loại hợp đồng không nhận dạng được "${p.LoaiHD}" → dùng 'HĐ ngắn hạn'.`);
        return 'HĐ ngắn hạn';
    };

    const getUnitType = (ma) => {
        const p = personnel[ma] || allPersonnelRecords[ma];
        if (!p) {
            Logger.log(`⚠️ getUnitType: Mã nhân sự ${ma} không có thông tin đơn vị, sẽ dùng 'Gián tiếp' làm mặc định.`);
            return 'Gián tiếp';
        }
        const code = p.MaBP;
        const cleanCode = code.split('-')[0].trim();
        const result = unitToType[code] || unitToType[cleanCode];
        if (!result) {
            Logger.log(`⚠️ getUnitType: Mã đơn vị ${code} (sạch ${cleanCode}) không tìm thấy trong map, sẽ dùng 'Gián tiếp'.`);
            return 'Gián tiếp';
        }
        return result;
    };

    const emptyMetric = () => ({
        SumLPC: 0, LC100: 0, Treo60: 0, LCHachToan: 0,
        PCCV: 0, PCVK: 0, PCGV: 0, PCTNGV: 0, PCTN: 0,
        BHXH: 0, BHYT: 0, BHTN: 0, KPCD: 0, QuyTN: 0,
        Huong40: 0, TamUng: 0, TreoLuong: 0, ThueTNCN: 0,
        ThucLinh: 0
    });

    const storage = {};
    const getStore = (ma, gIdx, tIdx, sub, specificCT = null) => {
        const ut = getUnitType(ma);
        const ct = specificCT || getContractType(ma);
        const key = `${gIdx}|${tIdx}|${ut}|${sub}|${ct}`;
        if (!storage[key]) storage[key] = emptyMetric();
        return storage[key];
    };

    const sumMetricRow = (m) => {
        m.LCHachToan = m.LC100 - m.Treo60;
        m.SumLPC = m.LC100 + m.PCCV + m.PCVK + m.PCGV + m.PCTNGV + m.PCTN;
        m.ThucLinh = m.LCHachToan + (m.PCCV + m.PCVK + m.PCGV + m.PCTNGV + m.PCTN)
            - (m.BHXH + m.BHYT + m.BHTN + m.KPCD + m.QuyTN + m.Huong40 + m.TamUng + m.TreoLuong);
        // m.ThueTNCN sẽ được trừ ở mục D (A+B+C-D), không trừ trực tiếp ở đây để đúng công thức yêu cầu
    };

    const addMetrics = (target, source) => {
        for (let key in source) { target[key] += source[key]; }
    };

    // 3. DATA_LUONG_1 (Part A-I)
    const l1Header = dataLuong1[0] || [];
    const l1Idx = {
        Ky: getIdx(l1Header, ['Kỳ lương', 'Ky']),
        Ma: getIdx(l1Header, ['Mã nhân sự', 'Mã CB', 'MaNS', 'Ma', 'Mã NS']),
        HSBac: getIdx(l1Header, ['HS bậc', 'HSBac']),
        HSBacBL: getIdx(l1Header, ['Bù lương HSBac', 'HSBacBL']),
        HSCV: getIdx(l1Header, ['HS chức vụ', 'HSCV']),
        HSVK: getIdx(l1Header, ['HS vượt khung', 'HSVK']),
        HSGD: getIdx(l1Header, ['HS giảng dạy', 'HS giảng viên', 'HSGD', 'HS ngành']),
        HSTNGV: getIdx(l1Header, ['HS thâm niên GV', 'HSTNGV', 'HS thâm niên']),
        HSTrachNhiem: getIdx(l1Header, ['HS trách nhiệm', 'HSTNhiem']),
        HSDocHai: getIdx(l1Header, ['HS độc hại', 'HSDH']),
        HSTuVe: getIdx(l1Header, ['HS tự vệ', 'HSTV']),
        NN: getIdx(l1Header, ['Nước ngoài', 'NN']),
        NghiBHXH: getIdx(l1Header, ['Nghỉ BHXH', 'NghiBHXH']),
        BHXH: getIdx(l1Header, ['BHXH']),
        BHYT: getIdx(l1Header, ['BHYT']),
        BHTN: getIdx(l1Header, ['BHTN']),
        KPCD: getIdx(l1Header, ['KPCĐ', 'KPCD']),
        TruKhac: getIdx(l1Header, ['Trừ khác', 'TruKhac']),
        ThueTNCN: getIdx(l1Header, ['Thuế TNCN', 'TNCN', 'Thue TNCN', 'Thuế']),
        TongLuong: getIdx(l1Header, ['Tổng lương', 'TongLuong', 'Tổng'])
    };

    let matchedL1 = 0;
    let notInPersonnelL1 = 0;
    dataLuong1.forEach((row, i) => {
        if (i === 0) return;
        const rKy = String(row[l1Idx.Ky] || '').trim().replace(/^T/, '');
        if (rKy !== targetMonth) return;
        matchedL1++;
        const maRaw = row[l1Idx.Ma];
        const ma = (maRaw && String(maRaw).trim()) || null;
        if (!ma) {
            Logger.log(`⚠️ Row ${i + 1} trong DATA_LUONG_1 không có Mã nhân sự → bỏ qua`);
            return;
        }
        if (!personnel[ma] && !allPersonnelRecords[ma]) notInPersonnelL1++;

        // Tính toán các giá trị cho nhân viên này
        const lc100 = (parseNumber(row[l1Idx.HSBac]) + parseNumber(row[l1Idx.HSBacBL])) * LCB;
        const pccv = parseNumber(row[l1Idx.HSCV]) * LCB;
        const pcvk = parseNumber(row[l1Idx.HSVK]) * LCB;
        const pcgv = parseNumber(row[l1Idx.HSGD]) * LCB;
        const pctngv = parseNumber(row[l1Idx.HSTNGV]) * LCB;
        const pctn = (parseNumber(row[l1Idx.HSTrachNhiem]) + parseNumber(row[l1Idx.HSDocHai]) + parseNumber(row[l1Idx.HSTuVe])) * LCB;

        // Áp dụng quy tắc: Nếu HĐ vụ việc → LC100 = Tổng lương (từ cột)
        let finalLC100 = lc100;
        if (getContractType(ma) === 'HĐ ngắn hạn') {
            // Lấy từ cột "Tổng lương" nếu có, nếu không thì tính
            const tongLuongFromCol = parseNumber(row[l1Idx.TongLuong]);
            if (tongLuongFromCol > 0) {
                finalLC100 = tongLuongFromCol;
            } else {
                const tongLuong = lc100 + pccv + pcvk + pcgv + pctngv + pctn;
                finalLC100 = tongLuong;
            }
        }

        const s = getStore(ma, 'A', 'I', 'Regular');
        s.LC100 += finalLC100;
        s.Treo60 += parseNumber(row[l1Idx.NN]) + parseNumber(row[l1Idx.NghiBHXH]);
        s.PCCV += pccv;
        s.PCVK += pcvk;
        s.PCGV += pcgv;
        s.PCTNGV += pctngv;
        s.PCTN += pctn;
        s.BHXH += parseNumber(row[l1Idx.BHXH]);
        s.BHYT += parseNumber(row[l1Idx.BHYT]);
        s.BHTN += parseNumber(row[l1Idx.BHTN]);
        s.KPCD += parseNumber(row[l1Idx.KPCD]);
        s.QuyTN += parseNumber(row[l1Idx.TruKhac]);
        s.ThueTNCN += parseNumber(row[l1Idx.ThueTNCN]);
    });
    Logger.log(`- DATA_LUONG_1: Đọc ${matchedL1} dòng cho tháng ${monthStr}, ${notInPersonnelL1} mã nhân sự không có trong dữ liệu chốt.`);

    // 4. TRUY_THU_LUONG_1 (Part A-II)
    const tt1Header = truyThu1[0] || [];
    const tt1Idx = {
        Ky: getIdx(tt1Header, ['Kỳ trả lương', 'Kỳ lương', 'Ky']),
        Ma: getIdx(tt1Header, ['Mã nhân sự', 'Mã CB', 'MaNS', 'Ma', 'Mã NS']),
        HSBac: getIdx(tt1Header, ['HS bậc thành tiền', 'TruyLinhHSBac']),
        HSCV: getIdx(tt1Header, ['HS PC chức vụ thành tiền', 'TruyLinhHSCV']),
        HSVK: getIdx(tt1Header, ['HS PC vượt khung thành tiền', 'TruyLinhHSVK']),
        HSGD: getIdx(tt1Header, ['HS PC ngành thành tiền', 'TruyLinhHSGD']),
        HSTN: getIdx(tt1Header, ['HS PC thâm niên thành tiền', 'TruyLinhHSTN']),
        HSTrachNhiem: getIdx(tt1Header, ['HS PC trách nhiệm thành tiền', 'TruyLinhHSTrachNhiem']),
        BHXH: getIdx(tt1Header, ['BHXH']),
        BHYT: getIdx(tt1Header, ['BHYT']),
        BHTN: getIdx(tt1Header, ['BHTN']),
        KPCD: getIdx(tt1Header, ['KPCĐ', 'KPCD']),
        ThueTNCN: getIdx(tt1Header, ['Thuế TNCN', 'TNCN', 'Thue TNCN', 'Thuế'])
    };

    let matchedTT1 = 0;
    let zeroValTT1 = 0;
    truyThu1.forEach((row, i) => {
        if (i === 0) return;
        const rKy = String(row[tt1Idx.Ky] || '').trim().replace(/^T/, '');
        if (rKy !== targetMonth) return;
        matchedTT1++;
        const maRaw = row[tt1Idx.Ma];
        const ma = (maRaw && String(maRaw).trim()) || null;
        if (!ma) {
            Logger.log(`⚠️ Row ${i + 1} trong TRUY_THU_LUONG_1 không có Mã nhân sự → bỏ qua`);
            return;
        }
        // Đọc tất cả các giá trị
        const hsBac = parseNumber(row[tt1Idx.HSBac]);
        const hsCv = parseNumber(row[tt1Idx.HSCV]);
        const hsVk = parseNumber(row[tt1Idx.HSVK]);
        const hsGd = parseNumber(row[tt1Idx.HSGD]);
        const hsTn = parseNumber(row[tt1Idx.HSTN]);
        const hsTrachNhiem = parseNumber(row[tt1Idx.HSTrachNhiem]);
        const bhxh = parseNumber(row[tt1Idx.BHXH]);
        const bhyt = parseNumber(row[tt1Idx.BHYT]);
        const bhtn = parseNumber(row[tt1Idx.BHTN]);
        const kpcd = parseNumber(row[tt1Idx.KPCD]);

        // Tính tổng tất cả các giá trị (bao gồm cả phụ cấp và khấu trừ)
        const tongGiaTri = hsBac + hsCv + hsVk + hsGd + hsTn + hsTrachNhiem + bhxh + bhyt + bhtn + kpcd;

        // Chỉ bỏ qua nếu TẤT CẢ đều = 0
        if (tongGiaTri === 0) { zeroValTT1++; return; }

        // Phân tách giá trị dương (Truy lĩnh) và âm (Truy thu)
        // Mỗi giá trị được xử lý riêng theo dấu của nó
        const addValue = (val, field) => {
            if (val > 0) {
                const sTL = getStore(ma, 'A', 'II', 'TL');
                sTL[field] += val;
            } else if (val < 0) {
                const sTT = getStore(ma, 'A', 'II', 'TT');
                sTT[field] += val;
            }
        };

        addValue(hsBac, 'LC100');
        addValue(hsCv, 'PCCV');
        addValue(hsVk, 'PCVK');
        addValue(hsGd, 'PCGV');
        addValue(hsTn, 'PCTNGV');
        addValue(hsTrachNhiem, 'PCTN');
        addValue(bhxh, 'BHXH');
        addValue(bhyt, 'BHYT');
        addValue(bhtn, 'BHTN');
        addValue(kpcd, 'KPCD');
        addValue(parseNumber(row[tt1Idx.ThueTNCN]), 'ThueTNCN');
    });
    Logger.log(`- TRUY_THU_LUONG_1: Đọc ${matchedTT1} dòng cho tháng ${monthStr}, ${zeroValTT1} dòng có giá trị 0 (bỏ qua).`);

    // 5. DATA_LUONG_2 & TRUY_THU_LUONG_2
    const l2Header = dataLuong2[0] || [];
    const l2IdxKy = getIdx(l2Header, ['Kỳ lương', 'Ky']);
    const l2IdxMa = getIdx(l2Header, ['Mã nhân sự', 'Mã CB', 'MaNS', 'Ma', 'Mã NS']);
    const l2IdxV = getIdx(l2Header, ['Lương 2', 'Luong2', 'TNTT']);

    let matchedL2 = 0;
    dataLuong2.forEach((row, i) => {
        if (i === 0) return;
        const rKy = String(row[l2IdxKy] || '').trim().replace(/^T/, '');
        if (rKy !== targetMonth) return;
        matchedL2++;
        const maRaw = row[l2IdxMa];
        const ma = (maRaw && String(maRaw).trim()) || null;
        if (!ma) {
            Logger.log(`⚠️ Row ${i + 1} trong DATA_LUONG_2 không có Mã nhân sự → bỏ qua`);
            return;
        }
        const v = parseNumber(row[l2IdxV]);
        const s = getStore(ma, 'B', 'I', 'Regular', 'Main');
        s.LC100 += v;
    });
    Logger.log(`- DATA_LUONG_2: Đọc ${matchedL2} dòng cho tháng ${monthStr}.`);

    const tt2Header = truyThu2[0] || [];
    const tt2IdxKy = getIdx(tt2Header, ['Kỳ trả lương', 'Kỳ lương', 'Ky']);
    const tt2IdxMa = getIdx(tt2Header, ['Mã nhân sự', 'Mã CB', 'MaNS', 'Ma', 'Mã NS']);
    const tt2IdxV = getIdx(tt2Header, ['Còn nhận', 'ConNhan']);

    let matchedTT2 = 0;
    let zeroValTT2 = 0;
    truyThu2.forEach((row, i) => {
        if (i === 0) return;
        const rKy = String(row[tt2IdxKy] || '').trim().replace(/^T/, '');
        if (rKy !== targetMonth) return;
        matchedTT2++;
        const maRaw = row[tt2IdxMa];
        const ma = (maRaw && String(maRaw).trim()) || null;
        if (!ma) {
            Logger.log(`⚠️ Row ${i + 1} trong TRUY_THU_LUONG_2 không có Mã nhân sự → bỏ qua`);
            return;
        }
        const v = parseNumber(row[tt2IdxV]);
        if (v === 0) { zeroValTT2++; return; }
        const s = getStore(ma, 'B', 'II', (v > 0 ? 'TL' : 'TT'), 'Main');
        s.LC100 += v;
    });
    Logger.log(`- TRUY_THU_LUONG_2: Đọc ${matchedTT2} dòng cho tháng ${monthStr}, ${zeroValTT2} dòng có giá trị 0 (bỏ qua).`);

    // 6. DATA_AN_CA
    const acHeader = dataAnCa[0] || [];
    const acIdxKy = getIdx(acHeader, ['Kỳ lương', 'Ky']);
    const acIdxMa = getIdx(acHeader, ['Mã nhân sự', 'Mã CB', 'MaNS', 'Ma', 'Mã NS']);
    const acIdxV1 = getIdx(acHeader, ['Ăn ca', 'AnCa']);
    const acIdxV2 = getIdx(acHeader, ['Truy lĩnh', 'TruyLinh']);

    let matchedAc = 0;
    let zeroValAc2 = 0;
    dataAnCa.forEach((row, i) => {
        if (i === 0) return;
        const rKy = String(row[acIdxKy] || '').trim().replace(/^T/, '');
        if (rKy !== targetMonth) return;
        matchedAc++;
        const maRaw = row[acIdxMa];
        const ma = (maRaw && String(maRaw).trim()) || null;
        if (!ma) {
            Logger.log(`⚠️ Row ${i + 1} trong DATA_AN_CA không có Mã nhân sự → bỏ qua`);
            return;
        }
        const v1 = parseNumber(row[acIdxV1]);
        const s1 = getStore(ma, 'C', 'I', 'Regular', 'Main');
        s1.LC100 += v1;
        const v2 = parseNumber(row[acIdxV2]);
        if (v2 === 0) { zeroValAc2++; } else {
            const s2 = getStore(ma, 'C', 'II', (v2 > 0 ? 'TL' : 'TT'), 'Main');
            s2.LC100 += v2;
        }
    });
    Logger.log(`- DATA_AN_CA: Đọc ${matchedAc} dòng cho tháng ${monthStr}, ${zeroValAc2} dòng có Truy lĩnh = 0 (bỏ qua).`);

    // 7. BUILD TABLE DATA
    const table = [];
    const getRow = (l, m) => {
        sumMetricRow(m);
        return [
            l, m.SumLPC, m.LC100, m.Treo60, m.LCHachToan,
            m.PCCV, m.PCVK, m.PCGV, m.PCTNGV, m.PCTN,
            m.BHXH, m.BHYT, m.BHTN, m.KPCD, m.QuyTN,
            m.Huong40, m.TamUng, m.TreoLuong, m.ThueTNCN,
            m.ThucLinh
        ];
    };

    const getVal = (g, t, ut, sub, ct) => storage[`${g}|${t}|${ut}|${sub}|${ct}`] || emptyMetric();

    // Section I. Lương ngạch bậc
    const AI_GT = emptyMetric();
    ['Biên chế', 'HĐ dài hạn', 'HĐ 68', 'HĐ ngắn hạn'].forEach(ct => addMetrics(AI_GT, getVal('A', 'I', 'Gián tiếp', 'Regular', ct)));
    const AI_TT = emptyMetric();
    ['Biên chế', 'HĐ dài hạn', 'HĐ 68', 'HĐ ngắn hạn', 'HĐ ngắn hạn (cố định)'].forEach(ct => addMetrics(AI_TT, getVal('A', 'I', 'Trực tiếp', 'Regular', ct)));

    // Section II. Truy thu, truy lĩnh
    const AII_GT = emptyMetric();
    ['Biên chế', 'HĐ 68', 'HĐ dài hạn', 'HĐ ngắn hạn'].forEach(ct => {
        addMetrics(AII_GT, getVal('A', 'II', 'Gián tiếp', 'TT', ct));
        addMetrics(AII_GT, getVal('A', 'II', 'Gián tiếp', 'TL', ct));
    });
    const AII_TT = emptyMetric();
    ['Biên chế', 'HĐ dài hạn', 'HĐ 68', 'HĐ ngắn hạn', 'HĐ ngắn hạn (cố định)'].forEach(ct => {
        addMetrics(AII_TT, getVal('A', 'II', 'Trực tiếp', 'TL', ct));
        addMetrics(AII_TT, getVal('A', 'II', 'Trực tiếp', 'TT', ct));
    });

    const combinedI = emptyMetric(); addMetrics(combinedI, AI_GT); addMetrics(combinedI, AI_TT);
    table.push(getRow("I. Lương ngạch bậc", combinedI));

    const I1 = emptyMetric(); addMetrics(I1, AI_GT);
    table.push(getRow("1. Gián tiếp", I1));
    table.push(getRow("Biên chế", getVal('A', 'I', 'Gián tiếp', 'Regular', 'Biên chế')));
    table.push(getRow("HĐ dài hạn", getVal('A', 'I', 'Gián tiếp', 'Regular', 'HĐ dài hạn')));
    table.push(getRow("HĐ 68", getVal('A', 'I', 'Gián tiếp', 'Regular', 'HĐ 68')));
    table.push(getRow("HĐ ngắn hạn", getVal('A', 'I', 'Gián tiếp', 'Regular', 'HĐ ngắn hạn')));

    const I2 = emptyMetric(); addMetrics(I2, AI_TT);
    table.push(getRow("2. Trực tiếp", I2));
    table.push(getRow("Biên chế", getVal('A', 'I', 'Trực tiếp', 'Regular', 'Biên chế')));
    table.push(getRow("HĐ dài hạn", getVal('A', 'I', 'Trực tiếp', 'Regular', 'HĐ dài hạn')));
    table.push(getRow("HĐ 68", getVal('A', 'I', 'Trực tiếp', 'Regular', 'HĐ 68')));
    table.push(getRow("HĐ ngắn hạn (cố định)", getVal('A', 'I', 'Trực tiếp', 'Regular', 'HĐ ngắn hạn (cố định)')));
    table.push(getRow("HĐ ngắn hạn", getVal('A', 'I', 'Trực tiếp', 'Regular', 'HĐ ngắn hạn')));

    const combinedII = emptyMetric(); addMetrics(combinedII, AII_GT); addMetrics(combinedII, AII_TT);
    table.push(getRow("II. Truy thu, truy lĩnh", combinedII));

    table.push(getRow("1. Gián tiếp", AII_GT));
    table.push(getRow("Truy thu (BC)", getVal('A', 'II', 'Gián tiếp', 'TT', 'Biên chế')));
    table.push(getRow("Truy lĩnh (BC)", getVal('A', 'II', 'Gián tiếp', 'TL', 'Biên chế')));
    table.push(getRow("Truy thu (HĐ dài hạn)", getVal('A', 'II', 'Gián tiếp', 'TT', 'HĐ dài hạn')));
    table.push(getRow("Truy lĩnh (HĐ dài hạn)", getVal('A', 'II', 'Gián tiếp', 'TL', 'HĐ dài hạn')));
    table.push(getRow("Truy thu (HĐ 68)", getVal('A', 'II', 'Gián tiếp', 'TT', 'HĐ 68')));
    table.push(getRow("Truy lĩnh (HĐ 68)", getVal('A', 'II', 'Gián tiếp', 'TL', 'HĐ 68')));
    table.push(getRow("Truy thu (HĐ ngắn hạn)", getVal('A', 'II', 'Gián tiếp', 'TT', 'HĐ ngắn hạn')));
    table.push(getRow("Truy lĩnh (HĐ ngắn hạn)", getVal('A', 'II', 'Gián tiếp', 'TL', 'HĐ ngắn hạn')));

    table.push(getRow("2. Trực tiếp", AII_TT));
    table.push(getRow("Truy lĩnh (BC)", getVal('A', 'II', 'Trực tiếp', 'TL', 'Biên chế')));
    table.push(getRow("Truy thu (BC)", getVal('A', 'II', 'Trực tiếp', 'TT', 'Biên chế')));
    table.push(getRow("Truy lĩnh (HĐ dài hạn)", getVal('A', 'II', 'Trực tiếp', 'TL', 'HĐ dài hạn')));
    table.push(getRow("Truy thu (HĐ dài hạn)", getVal('A', 'II', 'Trực tiếp', 'TT', 'HĐ dài hạn')));
    table.push(getRow("Truy lĩnh (HĐ 68)", getVal('A', 'II', 'Trực tiếp', 'TL', 'HĐ 68')));
    table.push(getRow("Truy thu (HĐ 68)", getVal('A', 'II', 'Trực tiếp', 'TT', 'HĐ 68')));
    table.push(getRow("Truy lĩnh (HĐ ngắn hạn)", getVal('A', 'II', 'Trực tiếp', 'TL', 'HĐ ngắn hạn')));
    table.push(getRow("Truy thu (HĐ ngắn hạn)", getVal('A', 'II', 'Trực tiếp', 'TT', 'HĐ ngắn hạn')));
    table.push(getRow("Truy lĩnh (HĐ ngắn hạn cố định)", getVal('A', 'II', 'Trực tiếp', 'TL', 'HĐ ngắn hạn (cố định)')));
    table.push(getRow("Truy thu (HĐ ngắn hạn cố định)", getVal('A', 'II', 'Trực tiếp', 'TT', 'HĐ ngắn hạn (cố định)')));

    const sumTotalGT = emptyMetric(); addMetrics(sumTotalGT, I1); addMetrics(sumTotalGT, AII_GT);
    const sumTotalTT = emptyMetric(); addMetrics(sumTotalTT, I2); addMetrics(sumTotalTT, AII_TT);

    table.push(getRow("Tổng lương ngạch bậc và truy lĩnh-GT", sumTotalGT));

    const nhGt = emptyMetric();
    addMetrics(nhGt, getVal('A', 'I', 'Gián tiếp', 'Regular', 'HĐ ngắn hạn'));
    addMetrics(nhGt, getVal('A', 'II', 'Gián tiếp', 'TL', 'HĐ ngắn hạn'));
    addMetrics(nhGt, getVal('A', 'II', 'Gián tiếp', 'TT', 'HĐ ngắn hạn'));
    table.push(getRow("Tổng truy lĩnh HĐ N.hạn-GT", nhGt));

    table.push(getRow("Tổng lương ngạch bậc và truy lĩnh-TT", sumTotalTT));

    const totalA = emptyMetric(); addMetrics(totalA, sumTotalGT); addMetrics(totalA, sumTotalTT); addMetrics(totalA, nhGt);
    table.push(getRow("A. Tổng lương ngạch bậc và truy lĩnh GT+TT", totalA));

    // Section B
    const bTot = emptyMetric();
    const bReg = emptyMetric();['Trực tiếp', 'Gián tiếp'].forEach(ut => addMetrics(bReg, getVal('B', 'I', ut, 'Regular', 'Main')));
    const bTL = emptyMetric();['Trực tiếp', 'Gián tiếp'].forEach(ut => addMetrics(bTL, getVal('B', 'II', ut, 'TL', 'Main')));
    const bTT = emptyMetric();['Trực tiếp', 'Gián tiếp'].forEach(ut => addMetrics(bTT, getVal('B', 'II', ut, 'TT', 'Main')));
    addMetrics(bTot, bReg); addMetrics(bTot, bTL); addMetrics(bTot, bTT);

    table.push(getRow("B. Thu nhập tăng thêm", bTot));
    table.push(getRow("Thu nhập tăng thêm", bReg));
    table.push(getRow("Truy lĩnh", bTL));
    table.push(getRow("Truy thu", bTT));

    // Section C
    const cTot = emptyMetric();
    const cReg = emptyMetric();['Trực tiếp', 'Gián tiếp'].forEach(ut => addMetrics(cReg, getVal('C', 'I', ut, 'Regular', 'Main')));
    const cTL = emptyMetric();['Trực tiếp', 'Gián tiếp'].forEach(ut => addMetrics(cTL, getVal('C', 'II', ut, 'TL', 'Main')));
    const cTT = emptyMetric();['Trực tiếp', 'Gián tiếp'].forEach(ut => addMetrics(cTT, getVal('C', 'II', ut, 'TT', 'Main')));
    addMetrics(cTot, cReg); addMetrics(cTot, cTL); addMetrics(cTot, cTT);

    table.push(getRow("C. Ăn ca", cTot));
    table.push(getRow("Ăn ca", cReg));
    table.push(getRow("Truy lĩnh", cTL));
    table.push(getRow("Truy thu", cTT));

    // Section D
    const dTot = emptyMetric();
    ['Trực tiếp', 'Gián tiếp'].forEach(ut => {
        ['A', 'B', 'C'].forEach(g => {
            ['Regular', 'TL', 'TT'].forEach(sub => {
                // Chúng ta gom tất cả Thuế TNCN đã thu thập được vào dTot
                // Lưu ý: storage key được xây dựng từ g, t, ut, sub, ct
                // Để đơn giản, ta duyệt qua storage và lọc theo g=A,B,C
                Object.keys(storage).forEach(key => {
                    if (key.startsWith(`${g}|`)) {
                        dTot.ThueTNCN += storage[key].ThueTNCN || 0;
                    }
                });
            });
        });
    });
    // Tránh cộng dồn lặp do duyệt key, ta nên tính dTot một cách sạch sẽ
    // Thực tế, totalA, bTot, cTot đã gom đủ ThueTNCN rồi.
    const finalDTot = emptyMetric();
    finalDTot.ThueTNCN = totalA.ThueTNCN + bTot.ThueTNCN + cTot.ThueTNCN;

    const rowD = getRow("D. Thuế TNCN", finalDTot);
    // Để dòng D hiển thị giá trị thuế ở cột Thực lĩnh (để phục vụ trừ ở dòng tổng)
    rowD[rowD.length - 1] = finalDTot.ThueTNCN;
    table.push(rowD);

    const grand = emptyMetric();
    addMetrics(grand, totalA);
    addMetrics(grand, bTot);
    addMetrics(grand, cTot);
    // grand đang chứa tổng thu nhập (A+B+C) chưa trừ thuế

    const finalRowData = getRow("Tổng cộng: A+B+C-D", grand);
    // Thực hiện trừ Thuế TNCN ở bước cuối cùng cho dòng tổng cộng
    finalRowData[finalRowData.length - 1] -= finalDTot.ThueTNCN;
    table.push(finalRowData);

    return table;
}
