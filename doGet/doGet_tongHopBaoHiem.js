/**
 * CONTRACT - doGet_tongHopBaoHiem.js
 * 
 * 1. TRÁCH NHIỆM:
 *    - Tổng hợp dữ liệu bảo hiểm (BHXH, BHYT, BHTN) từ nguồn DataLuong1 và DataTruyThu.
 *    - Ghi dữ liệu vào sheet THBH kèm theo các công thức Excel tương thích với thiết lập dấu thập phân phẩy (,) và dấu đối số chấm phẩy (;).
 * 
 * 2. KHÔNG CHỊU TRÁCH NHIỆM:
 *    - Chỉnh sửa cấu trúc dữ liệu nguồn của DataLuong1 hay DataTruyThu.
 * 
 * 3. RÀNG BUỘC VÀ GUARDRAILS KỸ THUẬT:
 *    - BẮT BUỘC làm tròn tất cả giá trị chi tiết về hàng đơn vị (Math.round) trước khi tính tổng.
 *    - BẮT BUỘC giữ START_ROW = 7 (dòng dữ liệu đầu tiên bắt đầu từ dòng 7 trên Sheet do 2 dòng tiêu đề chiếm dòng 5 & 6).
 *    - Dòng tổng nhóm (I, II, III, IV) bắt buộc sử dụng SUBTOTAL(9; ...).
 *    - Dòng Mã HW sử dụng phép trừ trực tiếp dạng `=E23-E26` (không dùng hàm).
 *    - Dòng Cộng cuối cùng sử dụng phép cộng trực tiếp dạng `=E26+E29` (không dùng hàm).
 *    - Cột H và L sử dụng hàm =SUM(E[row]:G[row]) và =SUM(I[row]:K[row]) cho mọi dòng.
 *    - Cột M sử dụng phép cộng trực tiếp =H[row]+L[row] cho mọi dòng.
 */

function test_doGet_taoBangTongHopbaoHiem() {
    var monthStr = "T05.2026";
    var targetLocation = "Hà Nội"
    var url = doGet_taoBangTongHopBaoHiem(monthStr, targetLocation)
    Logger.log(url)
}
function doGet_tongHopBaoHiem(monthStr, resources, targetLocation) {
    // 1. RATES Config
    const RATES = {
        BHXH: { EMP: 8, SCHOOL: 17.5 },
        BHYT: { EMP: 1.5, SCHOOL: 3 },
        BHTN: { EMP: 1, SCHOOL: 1 }
    };

    // 2. Helper Functions

    Logger.log(`Starting doGet_tongHopBaoHiem for month: ${monthStr}, Location: ${targetLocation}`);

    // 2. Helper Functions
    function getData(ss, sheetName) {
        if (!ss) return [];
        const sh = ss.getSheetByName(sheetName);
        return sh ? sh.getDataRange().getValues() : [];
    }

    function getIdx(header, names) {
        const nameList = Array.isArray(names) ? names : [names];
        for (let name of nameList) {
            const idx = header.indexOf(name);
            if (idx !== -1) return idx;
        }
        return -1;
    }

    function parseNumber(val) {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        // Remove commas if present and parse
        const num = Number(String(val).replace(/,/g, ''));
        return isNaN(num) ? 0 : num;
    }

    // 3. Load Data
    // A. Master Data (Category & Status)
    const dataChotRaw = getSheetNSThang().getDataRange().getValues();
    if (dataChotRaw.length < 2) return [];
    const headerChot = dataChotRaw[0];
    const idxChot = {
        KyLuong: getIdx(headerChot, ['Kỳ lương', 'Ky']),
        MaNS: getIdx(headerChot, ['Mã nhân sự', 'MaNS', 'Ma']),
        LoaiHD: getIdx(headerChot, ['Loại hợp đồng', 'LoaiHD']),
        TrangThai: getIdx(headerChot, ['Trạng thái', 'Status', 'TrangThai']),
        KhuVuc: getIdx(headerChot, ['Khu vực', 'KV', 'Địa phương', 'DiaPhuong'])
    };

    const mapNhanSu = {}; // Key: MaNS, Value: { LoaiHD, TrangThai }
    dataChotRaw.slice(1).forEach(row => {
        const ky = String(row[idxChot.KyLuong]).trim();
        if (ky !== monthStr) return;
        const ma = String(row[idxChot.MaNS]).trim();
        if (!ma) return;

        let kv = normalizeLocation(row[idxChot.KhuVuc]);

        // Lọc theo địa phương nếu được yêu cầu
        if (targetLocation && targetLocation !== 'All' && kv !== targetLocation) return;

        mapNhanSu[ma] = {
            LoaiHD: String(row[idxChot.LoaiHD] || '').trim(),
            TrangThai: String(row[idxChot.TrangThai] || '').trim(),
            KhuVuc: kv
        };
    });

    // B. Data Luong 1 (Salary)
    const dataLuong1Raw = getData(resources.ssLuong1, GLOBAL_CONFIG.SHEETS.DATA_LUONG_1);
    const headerL1 = dataLuong1Raw[0] || [];
    const idxL1 = {
        KyLuong: getIdx(headerL1, 'Kỳ lương'),
        MaCB: getIdx(headerL1, ['Mã CB', 'Mã nhân sự', 'MaNS']),
        BHXH: getIdx(headerL1, 'BHXH'),
        BHYT: getIdx(headerL1, 'BHYT'),
        BHTN: getIdx(headerL1, 'BHTN')
    };

    // C. Data Truy Thu / Truy Linh
    const dataTruyThuRaw = getData(resources.ssTruyThu1, GLOBAL_CONFIG.SHEETS.DATA_TRUY_THU);
    const headerTT = dataTruyThuRaw[0] || [];
    const idxTT = {
        KyTraLuong: getIdx(headerTT, 'Kỳ trả lương'),
        MaNS: getIdx(headerTT, ['Mã nhân sự', 'MaNS', 'Ma']),
        BHXH: getIdx(headerTT, 'BHXH'),
        BHYT: getIdx(headerTT, 'BHYT'),
        BHTN: getIdx(headerTT, 'BHTN')
    };

    // 4. Aggregation Logic

    // Fallback: Load Master Local Data
    const valuesNS = getData(resources.ssMaster, GLOBAL_CONFIG.SHEETS.DATA_NHAN_SU);
    const headerNS = valuesNS[0] || [];
    const idxNS = {
        MaCB: getIdx(headerNS, ['Mã nhân sự', 'Mã CB', 'MaNS', 'Ma']),
        KhuVuc: getIdx(headerNS, ['Khu vực', 'KV', 'Địa phương', 'DiaPhuong'])
    };
    const masterKVMap = {};
    if (valuesNS.length > 1) {
        valuesNS.slice(1).forEach(row => {
            const ma = String(row[idxNS.MaCB] || '').trim();
            if (ma) masterKVMap[ma] = normalizeLocation(row[idxNS.KhuVuc]);
        });
    }

    // Structure: 
    // Map<Category, { 
    //    Luong: { BHXH, BHYT, BHTN }, 
    //    TruyLinh: { BHXH, BHYT, BHTN }, 
    //    TruyThu: { BHXH, BHYT, BHTN } 
    // }>

    // Also need "Di Nuoc Ngoai" aggregate separate
    const AGG_KEYS = {
        BIEN_CHE: 'Diện biên chế',
        THUONG_XUYEN: 'Diện HĐLĐ thường xuyên',
        HD_68: 'Diện hợp đồng 68',
        VU_VIEC: 'Diện hợp đồng vụ việc'
    };

    // Helper to init storage
    const createStorage = () => ({
        Luong: { BHXH: 0, BHYT: 0, BHTN: 0 },
        TruyLinh: { BHXH: 0, BHYT: 0, BHTN: 0 },
        TruyThu: { BHXH: 0, BHYT: 0, BHTN: 0 }
    });

    const mainAgg = {}; // Key: AGG_KEY
    const diNuocNgoaiAgg = {}; // Key: AGG_KEY (Only BIEN_CHE and THUONG_XUYEN likely)

    Object.values(AGG_KEYS).forEach(k => {
        mainAgg[k] = createStorage();
        diNuocNgoaiAgg[k] = createStorage();
    });

    function getStorage(maNS) {
        let info = mapNhanSu[maNS];

        // Fallback if missing in ChotNS
        if (!info) {
            const fallbackKV = masterKVMap[maNS] || 'Hà Nội'; // Default HN

            // Check Filter Logic here for fallback employees
            if (targetLocation && targetLocation !== 'All' && fallbackKV !== targetLocation) return null;

            // Nếu qua được bộ lọc, tạo info giả định
            // Loại HĐ: Nếu không có, có thể để trống hoặc mặc định 'Khác'. 
            // Tuy nhiên logic dưới cần map vào AGG_KEYS. 
            // Tạm thời nếu không có thông tin thì return null (không tổng hợp) hoặc gán vào nhóm 'Biên chế' (rủi ro).
            // An toàn nhất: Nếu có tên trong Master nhưng không có trong chốt -> Có thể là nhân sự mới hoặc nghỉ việc?
            // Hướng xử lý: Sẽ không tính toán khoản này nếu không xác định được Loại HĐ.
            // TUY NHIÊN: Để đảm bảo không mất tiền, ta nên thử mapping từ một nguồn khác nếu có.
            // Trong scope này, nếu không có Loại HĐ thì KHÔNG THỂ phân loại vào bảng báo cáo. -> RETURN NULL.
            return null;
        }

        const loaiHD = info.LoaiHD;
        const trangThai = info.TrangThai;

        // Normalize LoaiHD
        // Assumption: The text in LoaiHD matches AGG_KEYS values precisely or contains them.
        // Let's try exact match first, falling back to simple mapping.
        let catKey = null;
        if (loaiHD === 'Biên chế') catKey = AGG_KEYS.BIEN_CHE;
        else if (loaiHD === 'HĐ dài hạn') catKey = AGG_KEYS.THUONG_XUYEN;
        else if (loaiHD === 'HĐ 68') catKey = AGG_KEYS.HD_68;
        else if (loaiHD === 'HĐ vụ việc') catKey = AGG_KEYS.VU_VIEC;

        if (!catKey) return null; // Skip if unknown contract type

        const isDiNN = (trangThai === 'Đi NN' || trangThai === 'Đi công tác NN');

        // If "Di NN", we accumulate into both "Main" (if Main implies TOTAL) or just "DiNuocNgoai"?
        // The requirement says:
        // "Mã HW03889 = (Tổng cột I + II + III + IV) - MÃ LA"
        // This implies Main Aggregation collects EVERYONE.
        // And DiNuocNgoai collects only "Đi NN".

        return {
            main: mainAgg[catKey],
            sub: isDiNN ? diNuocNgoaiAgg[catKey] : null
        };
    }

    // Process Salary (Luong)
    dataLuong1Raw.slice(1).forEach(row => {
        const ky = String(row[idxL1.KyLuong]).trim();
        if (ky !== monthStr) return;

        const maNS = String(row[idxL1.MaCB]).trim();
        if (!maNS) return;

        const store = getStorage(maNS);
        if (!store) return;

        const vals = {
            BHXH: Math.round(parseNumber(row[idxL1.BHXH])),
            BHYT: Math.round(parseNumber(row[idxL1.BHYT])),
            BHTN: Math.round(parseNumber(row[idxL1.BHTN]))
        };

        // Add to Main
        store.main.Luong.BHXH += vals.BHXH;
        store.main.Luong.BHYT += vals.BHYT;
        store.main.Luong.BHTN += vals.BHTN;

        // Add to Sub (Di NN) if applicable
        if (store.sub) {
            store.sub.Luong.BHXH += vals.BHXH;
            store.sub.Luong.BHYT += vals.BHYT;
            store.sub.Luong.BHTN += vals.BHTN;
        }
    });

    // Process Arrears (Truy Thu / Truy Linh)
    dataTruyThuRaw.slice(1).forEach(row => {
        const ky = String(row[idxTT.KyTraLuong]).trim();
        if (ky !== monthStr) return;

        const maNS = String(row[idxTT.MaNS]).trim();
        if (!maNS) return;

        const store = getStorage(maNS);
        if (!store) return;

        const rawVals = {
            BHXH: Math.round(parseNumber(row[idxTT.BHXH])),
            BHYT: Math.round(parseNumber(row[idxTT.BHYT])),
            BHTN: Math.round(parseNumber(row[idxTT.BHTN]))
        };

        ['BHXH', 'BHYT', 'BHTN'].forEach(field => {
            const val = rawVals[field];
            if (val === 0) return;

            const absVal = Math.abs(val);
            const targetBucket = val < 0 ? 'TruyLinh' : 'TruyThu'; // < 0 is TruyLinh, > 0 is TruyThu

            store.main[targetBucket][field] += absVal;
            if (store.sub) {
                store.sub[targetBucket][field] += absVal;
            }
        });
    });

    // 5. Build Output Table
    const result = [];

    // Headers (For reference, though function is likely returning raw data for another tool to format, 
    // or formatting it directly. I'll include headers as row 1 if it's a standalone generation).
    // Column Mapping:
    // 1: STT
    // 2: Nội dung
    // 3: HSL (empty)
    // 4: Mức LTT (empty)
    // 5-8: NLĐ trả (BHXH 8, BHYT 1.5, BHTN 1, Total)
    // 9-12: Nhà trường trả (BHXH 17.5, BHYT 3, BHTN 1, Total)
    // 13: Tổng tiền (Sum of Total NLĐ + Total NT)

    // Wait, "Tổng tiền = Các cột thành tiền cộng lại với nhau". 
    // Total NLĐ + Total NT usually equals Total Insurance Cost.

    function calculateRow(employeePay) {
        const { BHXH, BHYT, BHTN } = employeePay;

        // Employee Pay Money (Thành tiền NLĐ trả)
        const roundedBHXH = Math.round(BHXH);
        const roundedBHYT = Math.round(BHYT);
        const roundedBHTN = Math.round(BHTN);
        const empTotal = roundedBHXH + roundedBHYT + roundedBHTN;

        // School Pay Money
        // Formula: (EmpAmount / EmpRate) * SchoolRate
        const schoolBHXH = Math.round((roundedBHXH / RATES.BHXH.EMP) * RATES.BHXH.SCHOOL);
        const schoolBHYT = Math.round((roundedBHYT / RATES.BHYT.EMP) * RATES.BHYT.SCHOOL);
        const schoolBHTN = Math.round((roundedBHTN / RATES.BHTN.EMP) * RATES.BHTN.SCHOOL);
        const schoolTotal = schoolBHXH + schoolBHYT + schoolBHTN;

        const grandTotal = empTotal + schoolTotal;

        return {
            emp: { BHXH: roundedBHXH, BHYT: roundedBHYT, BHTN: roundedBHTN, Total: empTotal },
            school: { BHXH: schoolBHXH, BHYT: schoolBHYT, BHTN: schoolBHTN, Total: schoolTotal },
            grandTotal: grandTotal
        };
    }

    const ROMAN = { [AGG_KEYS.BIEN_CHE]: 'I', [AGG_KEYS.THUONG_XUYEN]: 'II', [AGG_KEYS.HD_68]: 'III', [AGG_KEYS.VU_VIEC]: 'IV' };
    const ORDER = [AGG_KEYS.BIEN_CHE, AGG_KEYS.THUONG_XUYEN, AGG_KEYS.HD_68, AGG_KEYS.VU_VIEC];

    // Helper to sum objects
    const sumObj = (o1, o2) => ({ BHXH: o1.BHXH + o2.BHXH, BHYT: o1.BHYT + o2.BHYT, BHTN: o1.BHTN + o2.BHTN });
    const subtractObj = (o1, o2) => ({ BHXH: o1.BHXH - o2.BHXH, BHYT: o1.BHYT - o2.BHYT, BHTN: o1.BHTN - o2.BHTN });

    // --- FORMULA GENERATOR HELPERS ---
    // Starting row in Google Sheets is 7 (since header occupies rows 5 and 6)
    const START_ROW = 7;

    function getNextRowNum() {
        return START_ROW + result.length;
    }

    function createDetailedRowFormula(stt, content, vals) {
        const r = getNextRowNum();
        return [
            stt,
            content,
            '', // HSL
            '', // Mức LTT
            // NLĐ
            vals.BHXH,
            vals.BHYT,
            vals.BHTN,
            `=SUM(E${r}:G${r})`, // H = SUM E:G
            // Nhà trường
            `=ROUND(E${r}*17,5/8; 0)`, // I
            `=ROUND(F${r}*3/1,5; 0)`, // J
            `=ROUND(G${r}*1/1; 0)`, // K
            `=SUM(I${r}:K${r})`, // L = SUM I:K
            // Tổng
            `=H${r}+L${r}` // M = H + L
        ];
    }

    function createGroupFormulaRow(stt, content) {
        const r = getNextRowNum();
        const r1 = r + 1; // Luong
        const r3 = r + 3; // Truy Thu (r1 to r3 covers Luong, TruyLinh, TruyThu)
        return [
            stt,
            content,
            '',
            '',
            `=SUBTOTAL(9; E${r1}:E${r3})`, // E
            `=SUBTOTAL(9; F${r1}:F${r3})`, // F
            `=SUBTOTAL(9; G${r1}:G${r3})`, // G
            `=SUM(E${r}:G${r})`, // H
            `=SUBTOTAL(9; I${r1}:I${r3})`, // I
            `=SUBTOTAL(9; J${r1}:J${r3})`, // J
            `=SUBTOTAL(9; K${r1}:K${r3})`, // K
            `=SUM(I${r}:K${r})`, // L
            `=H${r}+L${r}` // M
        ];
    }

    function createGrandTotalFormulaRow(stt, content, startR, endR) {
        const r = getNextRowNum();
        return [
            stt,
            content,
            '',
            '',
            `=SUBTOTAL(9; E${startR}:E${endR})`, // E
            `=SUBTOTAL(9; F${startR}:F${endR})`, // F
            `=SUBTOTAL(9; G${startR}:G${endR})`, // G
            `=SUM(E${r}:G${r})`, // H
            `=SUBTOTAL(9; I${startR}:I${endR})`, // I
            `=SUBTOTAL(9; J${startR}:J${endR})`, // J
            `=SUBTOTAL(9; K${startR}:K${endR})`, // K
            `=SUM(I${r}:K${r})`, // L
            `=H${r}+L${r}` // M
        ];
    }

    function createSubtotalRangeFormulaRow(stt, content, startR, endR) {
        const r = getNextRowNum();
        return [
            stt,
            content,
            '',
            '',
            `=SUBTOTAL(9; E${startR}:E${endR})`, // E
            `=SUBTOTAL(9; F${startR}:F${endR})`, // F
            `=SUBTOTAL(9; G${startR}:G${endR})`, // G
            `=SUM(E${r}:G${r})`, // H
            `=SUBTOTAL(9; I${startR}:I${endR})`, // I
            `=SUBTOTAL(9; J${startR}:J${endR})`, // J
            `=SUBTOTAL(9; K${startR}:K${endR})`, // K
            `=SUM(I${r}:K${r})`, // L
            `=H${r}+L${r}` // M
        ];
    }

    function createHWFormulaRow(stt, content, r1, r2) {
        const r = getNextRowNum();
        return [
            stt,
            content,
            '',
            '',
            `=E${r1}-E${r2}`, // E = E23 - E26 (No SUM function, just subtraction)
            `=F${r1}-F${r2}`, // F
            `=G${r1}-G${r2}`, // G
            `=SUM(E${r}:G${r})`, // H
            `=I${r1}-I${r2}`, // I
            `=J${r1}-J${r2}`, // J
            `=K${r1}-K${r2}`, // K
            `=SUM(I${r}:K${r})`, // L
            `=H${r}+L${r}` // M
        ];
    }

    function createCongCuoiFormulaRow(stt, content, r1, r2) {
        const r = getNextRowNum();
        return [
            stt,
            content,
            '',
            '',
            `=E${r1}+E${r2}`, // E = E26 + E29 (No SUM function, just addition)
            `=F${r1}+F${r2}`, // F
            `=G${r1}+G${r2}`, // G
            `=SUM(E${r}:G${r})`, // H
            `=I${r1}+I${r2}`, // I
            `=J${r1}+J${r2}`, // J
            `=K${r1}+K${r2}`, // K
            `=SUM(I${r}:K${r})`, // L
            `=H${r}+L${r}` // M
        ];
    }

    // A. GENERIC SECTIONS
    const groupRows = [];

    ORDER.forEach(key => {
        const roman = ROMAN[key];
        const store = mainAgg[key];

        // 1. Group Header Row (e.g. Row 7, 11, 15, 19)
        groupRows.push(getNextRowNum());
        result.push(createGroupFormulaRow(roman, key));

        // 2. Sub Rows
        result.push(createDetailedRowFormula('1', 'Tổng hợp lương', store.Luong));
        result.push(createDetailedRowFormula('2', 'Tổng hợp truy lĩnh', store.TruyLinh));
        result.push(createDetailedRowFormula('3', 'Tổng hợp truy thu', store.TruyThu));
    });

    // 3. Grand Total Row (Row 23)
    const firstGrandTotalRow = getNextRowNum();
    result.push(createGrandTotalFormulaRow('', 'Cộng', 7, 22)); // E7:E22 covers all groups

    // B. SPECIFIC BREAKDOWNS (Trong đó tách 2 mã...)
    // I. Mã LA... (Đi NN) / Mã LA0001A / Mã LA0001N
    const locNormalized = targetLocation ? normalizeLocation(targetLocation) : '';
    const isPhuTho = (locNormalized === 'Phú Thọ');
    const isHanoi = (locNormalized === 'Hà Nội');

    let maLA = 'Mã LA... (đi nước ngoài)';
    let maHW = 'Mã HW03889';
    if (isPhuTho) {
        maLA = 'Mã LA0001A (đi nước ngoài)';
        maHW = 'Mã HW0004A';
    } else if (isHanoi) {
        maLA = 'Mã LA0001N (đi nước ngoài)';
        maHW = 'Mã HW0013N';
    }

    result.push(['', '', '', '', '', '', '', '', '', '', '', '', '']); // Spacer (Row 24)
    result.push(['', 'Trong đó tách 2 mã như sau:', '', '', '', '', '', '', '', '', '', '', '']); // (Row 25)

    const laBienChe = diNuocNgoaiAgg[AGG_KEYS.BIEN_CHE];
    const laThuongXuyen = diNuocNgoaiAgg[AGG_KEYS.THUONG_XUYEN];

    // LA Group Row (Row 26)
    const laGroupRow = getNextRowNum();
    const childLaStartRow = laGroupRow + 1;
    const childLaEndRow = laGroupRow + 2;
    result.push(createSubtotalRangeFormulaRow('I', maLA, childLaStartRow, childLaEndRow));

    // LA Detailed Rows (Row 27 & 28)
    const netLaBC = {
        BHXH: laBienChe.Luong.BHXH + laBienChe.TruyThu.BHXH - laBienChe.TruyLinh.BHXH,
        BHYT: laBienChe.Luong.BHYT + laBienChe.TruyThu.BHYT - laBienChe.TruyLinh.BHYT,
        BHTN: laBienChe.Luong.BHTN + laBienChe.TruyThu.BHTN - laBienChe.TruyLinh.BHTN
    };
    const netLaTX = {
        BHXH: laThuongXuyen.Luong.BHXH + laThuongXuyen.TruyThu.BHXH - laThuongXuyen.TruyLinh.BHXH,
        BHYT: laThuongXuyen.Luong.BHYT + laThuongXuyen.TruyThu.BHYT - laThuongXuyen.TruyLinh.BHTN,
        BHTN: laThuongXuyen.Luong.BHTN + laThuongXuyen.TruyThu.BHTN - laThuongXuyen.TruyLinh.BHTN
    };

    result.push(createDetailedRowFormula('1', 'Diện biên chế', netLaBC));
    result.push(createDetailedRowFormula('2', 'Diện HĐLĐ thường xuyên', netLaTX));

    // II. Mã HW... (Row 29)
    // Formula: `= E23 - E26`
    const hwRow = getNextRowNum();
    result.push(createHWFormulaRow('II', maHW, firstGrandTotalRow, laGroupRow));

    // III. Cộng (Row 30)
    // Formula: `= E26 + E29`
    result.push(createCongCuoiFormulaRow('', 'Cộng', laGroupRow, hwRow));

    return result;
}

/**
 * Hàm test để ghi kết quả vào sheet TestBH
 * @param {string} monthStr - Kỳ lương (Tmm.yyyy)
 */
function doGet_taoBangTongHopBaoHiem(monthStr, targetLocation) {
    const TEST_FILE_ID = GLOBAL_CONFIG.FILES.EXPORT_DKB_TH_BH;
    const TEST_SHEET_NAME = GLOBAL_CONFIG.SHEETS.SHEET_TH_BH;

    Logger.log('Bắt đầu tạo bảng tổng hợp bảo hiểm cho kỳ: %s, Địa phương: %s', monthStr, targetLocation);

    // 0. OPEN RESOURCES
    const ssMaster = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.MASTER_DATA);
    const ssLuong1 = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.DATA_LUONG_1);
    const ssTruyThu1 = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.TRUY_THU_LUONG_1);

    const resources = {
        ssMaster,
        ssLuong1,
        ssTruyThu1
    };

    // 1. Lấy dữ liệu
    const data = doGet_tongHopBaoHiem(monthStr, resources, targetLocation);

    if (!data || data.length === 0) {
        Logger.log('CẢNH BÁO: Không có dữ liệu trả về');
        throw new Error('Không có dữ liệu bảo hiểm cho kỳ ' + monthStr);
    }

    // 2. Chuẩn bị Header
    // Row 5 headers (Merged groups)
    // Cols: 1:STT, 2:Nội dung, 3:HSL, 4:Mức LTT, 5-8:NLĐ, 9-12:Nhà trường, 13:Tổng
    const headerRow1 = [
        'STT', 'Nội dung', 'HSL', 'Mức LTT',
        'Người lao động trả', '', '', '',
        'Nhà trường trả', '', '', '',
        'Tổng tiền'
    ];

    // Row 6 headers (Detailed columns)
    const headerRow2 = [
        '', '', '', '',
        'BHXH 8%', 'BHYT 1.5%', 'BHTN 1%', 'Thành tiền',
        'BHXH 17.5%', 'BHYT 3%', 'BHTN 1%', 'Thành tiền',
        ''
    ];

    const fullData = [headerRow1, headerRow2].concat(data);
    const rows = fullData.length;
    const cols = 13;

    // 3. Mở file và sheet
    const ss = SpreadsheetApp.openById(TEST_FILE_ID);
    let sheet = ss.getSheetByName(TEST_SHEET_NAME);
    if (!sheet) {
        sheet = ss.insertSheet(TEST_SHEET_NAME);
    } else {
        // Clear existing content
        sheet.clear();
    }

    // Ẩn gridline mặc định
    sheet.setHiddenGridlines(true);

    // 4. Ghi dữ liệu (bắt đầu từ dòng 5)
    sheet.getRange(5, 1, rows, cols).setValues(fullData);

    // 5. Định dạng Header & Tiêu đề
    const monthParts = monthStr.substring(1).split('.');
    const month = parseInt(monthParts[0], 10);
    const year = monthParts[1];

    // Tiêu đề
    sheet.getRange(1, 1, 1, 3).merge().setValue("TRƯỜNG ĐẠI HỌC CÔNG NGHỆ GTVT").setFontWeight('bold').setFontSize(12).setHorizontalAlignment('center');
    sheet.getRange(2, 1, 1, 3).merge().setValue("──────────").setFontWeight('normal').setFontSize(10).setHorizontalAlignment('center');
    let titleText = `BẢNG TỔNG HỢP BẢO HIỂM THÁNG ${month} NĂM ${year}`;
    if (targetLocation && targetLocation !== 'All') {
        titleText += ` - CƠ SỞ ${targetLocation.toUpperCase()}`;
    }
    sheet.getRange("A3:M3").merge().setHorizontalAlignment('center').setVerticalAlignment('middle').setValue(titleText).setFontWeight('bold').setFontSize(18);

    // Header bảng (Dòng 5-6)
    // Merge các ô header chính
    sheet.getRange("A5:A6").merge(); // STT
    sheet.getRange("B5:B6").merge(); // Nội dung
    sheet.getRange("C5:C6").merge(); // HSL
    sheet.getRange("D5:D6").merge(); // Mức LTT

    sheet.getRange("E5:H5").merge(); // Người lao động trả
    sheet.getRange("I5:L5").merge(); // Nhà trường trả

    sheet.getRange("M5:M6").merge(); // Tổng tiền

    // Header Style (Bold, Center, Middle)
    sheet.getRange(5, 1, 2, cols).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');

    // Style Header
    const headerRange = sheet.getRange("A5:M6");
    headerRange.setFontWeight('bold')
        .setHorizontalAlignment('center')
        .setVerticalAlignment('middle')
        .setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.SOLID);

    // 6. Định dạng dữ liệu (Dòng 7 trở đi)
    const dataRange = sheet.getRange(7, 1, rows - 2, cols);
    const moneyRange = sheet.getRange(7, 5, rows - 2, 9); // Từ cột E đến M

    // Format số
    moneyRange.setNumberFormat('#,##0');

    // --- STYLING CHUẨN ---
    const lastR = sheet.getLastRow();
    const lastC = sheet.getLastColumn();
    const fullRange = sheet.getRange(1, 1, lastR, lastC);

    // 1. Reset (Chỉ thiết lập Font)
    fullRange.setFontFamily('Times New Roman');


    // Bold các dòng nhóm (I, II, III, IV, Cộng)
    const boldSTTs = ['I', 'II', 'III', 'IV', ''];

    // Duyệt qua cột STT để format row
    // Lưu ý: data bắt đầu từ dòng 7 (row index 7 trong Excel)
    // data array index bắt đầu từ 2 (sau 2 dòng header)
    for (let i = 2; i < rows; i++) {
        const rowIdx = 5 + i;
        const rowData = fullData[i];
        const stt = String(rowData[0]).trim();

        // Điều kiện Bold
        if (boldSTTs.includes(stt) || rowData[1].toString().startsWith('Cộng') || rowData[1].toString().startsWith('Trong đó')) {
            sheet.getRange(rowIdx, 1, 1, cols).setFontWeight('bold');
        }
    }

    // Căn giữa cột Số TT
    sheet.getRange(5, 1, rows, 1).setHorizontalAlignment('center');

    // Bỏ auto resize cột theo yêu cầu

    // Copy A1:F2 from Master sheet to below the table with 1 row gap
    // Copy A1:F2 from Master sheet (Try Output file first, then Resource Master)
    const MASTER_SHEET_NAME = GLOBAL_CONFIG.SHEETS.MASTER;
    const lastDataRow = 5 + rows - 1;
    let masterSheet = ss.getSheetByName(MASTER_SHEET_NAME);

    // Helper to copy
    const copySig = (srcSheet) => {
        const targetRow = lastDataRow + 2;
        const srcRange = srcSheet.getRange("A1:M2");
        const targetRange = sheet.getRange(targetRow, 1, 2, 13);

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
        Logger.log('✅ Đã copy chữ ký nguyên bản định dạng từ Master và làm sạch nhãn ký');
    };

    if (masterSheet) {
        copySig(masterSheet);
    } else {
        // Fallback to Resource Master
        Logger.log('⚠️ Không tìm thấy sheet Master trong file báo cáo, thử lấy từ MasterData...');
        if (ssMaster) {
            const srcMaster = ssMaster.getSheetByName(MASTER_SHEET_NAME);
            if (srcMaster) copySig(srcMaster);
            else Logger.log('❌ Không tìm thấy Master sheet trong cả MasterData.');
        }
    }

    Logger.log('Đã hoàn thành tạo bảng bảo hiểm.');

    // ====== BƯỚC CUỐI: TẠO ĐƯỜNG KẺ BẢNG ======
    const finalTableRange = sheet.getRange(5, 1, rows, cols);
    // 1. Viền ngoài và kẻ dọc: Nét liền (SOLID)
    finalTableRange.setBorder(true, true, true, true, true, null, 'black', SpreadsheetApp.BorderStyle.SOLID);
    // 2. Kẻ ngang nội dung: Nét đứt (DOTTED)
    finalTableRange.setBorder(null, null, null, null, null, true, 'black', SpreadsheetApp.BorderStyle.DOTTED);
    // 3. Header: Nét liền toàn bộ
    sheet.getRange(5, 1, 2, cols).setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.SOLID);
    // 4. Các dòng đặc biệt (Bold): Nét liền
    for (let i = 2; i < rows; i++) {
        const rowIdx = 5 + i;
        const rowData = fullData[i];
        if (boldSTTs.includes(String(rowData[0]).trim()) ||
            String(rowData[1] || '').startsWith('Cộng') ||
            String(rowData[1] || '').startsWith('Trong đó')) {
            sheet.getRange(rowIdx, 1, 1, cols).setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.SOLID);
        }
    }

    // FR-02: set row height for school name & underline at the very end
    sheet.setRowHeight(1, 22);
    sheet.setRowHeight(2, 18);
    sheet.getRange(1, 1, 1, 3).setFontSize(10).setFontWeight('bold').setHorizontalAlignment('center');
    sheet.getRange(2, 1, 1, 3).setFontSize(10).setFontWeight('normal').setHorizontalAlignment('center');
    sheet.getRange("A3:M3").setFontSize(18).setFontWeight('bold').setHorizontalAlignment('center');

    // Đồng bộ thay đổi gridline và format
    SpreadsheetApp.flush();

    const exportUrl = `https://docs.google.com/spreadsheets/d/${ss.getId()}/export?format=pdf&size=A4&portrait=false&fitw=true&gridlines=false&horizontal_alignment=CENTER`;
    return exportUrl;
}

/**
 * Cung cấp dữ liệu JSON cho việc in ấn Bảng tổng hợp bảo hiểm trên Client
 */
function getPrintDataTongHopBaoHiem(monthStr, location) {
    try {
        // 1. Tạo bảng và tính toán các công thức trên Google Sheets
        doGet_taoBangTongHopBaoHiem(monthStr, location);

        // 2. Đọc giá trị đã tính toán từ sheet
        const ss = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.EXPORT_DKB_TH_BH);
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

