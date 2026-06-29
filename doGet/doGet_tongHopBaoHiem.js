/**
 * MODULE: TỔNG HỢP BẢO HIỂM (doGet_tongHopBaoHiem)
 * 
 * MÔ TẢ:
 * File này chứa logic để tổng hợp dữ liệu bảo hiểm (BHXH, BHYT, BHTN) từ các nguồn dữ liệu lương và truy thu.
 * Kết quả được ghi vào sheet "THBH" để báo cáo.
 * 
 * LOGIC CHÍNH:
 * 1. Load Data:
 *    - Master Data: DataChotNSThang (Lấy loại hợp đồng, trạng thái).
 *    - DataLuong1: Lấy cột BHXH, BHYT, BHTN (Phần NLĐ đóng).
 *    - DataTruyThuLinh: Lấy phần truy thu/truy lĩnh bảo hiểm.
 * 2. Tính toán:
 *    - Aggregate theo nhân sự.
 *    - Phân loại hợp đồng: Biên chế, Hợp đồng 68, Thường xuyên, Vụ việc.
 *    - Tính phần Nhà trường đóng = (NLĐ đóng / Tỷ lệ NLĐ) * Tỷ lệ Trường.
 *    - Xử lý net value: Lương + TruyLinh - TruyThu.
 * 3. Output:
 *    - Ghi vào sheet THBH.
 *    - Format bảng theo quy chuẩn (Header merged, Border, Font Time New Roman).
 * 
 * INPUT: Month String (e.g. "T01.2025")
 * OUTPUT: Download URL (XLSX)
 */

function test_doGet_taoBangTongHopbaoHiem() {
    var monthStr = "T01.2025"
    var url = doGet_taoBangTongHopBaoHiem(monthStr)
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

        const isDiNN = (trangThai === 'Đi NN');

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
            BHXH: parseNumber(row[idxL1.BHXH]),
            BHYT: parseNumber(row[idxL1.BHYT]),
            BHTN: parseNumber(row[idxL1.BHTN])
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
            BHXH: parseNumber(row[idxTT.BHXH]),
            BHYT: parseNumber(row[idxTT.BHYT]),
            BHTN: parseNumber(row[idxTT.BHTN])
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
        const empTotal = BHXH + BHYT + BHTN;

        // School Pay Money
        // Formula: (EmpAmount / EmpRate) * SchoolRate
        const schoolBHXH = (BHXH / RATES.BHXH.EMP) * RATES.BHXH.SCHOOL;
        const schoolBHYT = (BHYT / RATES.BHYT.EMP) * RATES.BHYT.SCHOOL;
        const schoolBHTN = (BHTN / RATES.BHTN.EMP) * RATES.BHTN.SCHOOL;
        const schoolTotal = schoolBHXH + schoolBHYT + schoolBHTN;

        const grandTotal = empTotal + schoolTotal;

        return {
            emp: { BHXH, BHYT, BHTN, Total: empTotal },
            school: { BHXH: schoolBHXH, BHYT: schoolBHYT, BHTN: schoolBHTN, Total: schoolTotal },
            grandTotal: grandTotal
        };
    }

    function createResultRow(stt, content, vals) {
        const calcs = calculateRow(vals);
        return [
            stt,
            content,
            '', // HSL
            '', // Mức LTT
            // NLĐ
            calcs.emp.BHXH,
            calcs.emp.BHYT,
            calcs.emp.BHTN,
            calcs.emp.Total,
            // Nhà trường
            calcs.school.BHXH,
            calcs.school.BHYT,
            calcs.school.BHTN,
            calcs.school.Total,
            // Tổng
            calcs.grandTotal
        ];
    }

    const ROMAN = { [AGG_KEYS.BIEN_CHE]: 'I', [AGG_KEYS.THUONG_XUYEN]: 'II', [AGG_KEYS.HD_68]: 'III', [AGG_KEYS.VU_VIEC]: 'IV' };
    const ORDER = [AGG_KEYS.BIEN_CHE, AGG_KEYS.THUONG_XUYEN, AGG_KEYS.HD_68, AGG_KEYS.VU_VIEC];

    // Helper to sum objects
    const sumObj = (o1, o2) => ({ BHXH: o1.BHXH + o2.BHXH, BHYT: o1.BHYT + o2.BHYT, BHTN: o1.BHTN + o2.BHTN });
    const subtractObj = (o1, o2) => ({ BHXH: o1.BHXH - o2.BHXH, BHYT: o1.BHYT - o2.BHYT, BHTN: o1.BHTN - o2.BHTN });

    // A. GENERIC SECTIONS
    let groupTotalAll = createStorage(); // To sum everything for HW03889 calculation if needed

    ORDER.forEach(key => {
        const roman = ROMAN[key];
        const store = mainAgg[key];

        // Summary Row for the Group (I, II, III, IV headers)
        // The image shows "I | Diện biên chế | = 1+2-3".
        // meaning the Group Header Row is the Net Sum? 
        // "1 + 2 - 3" -> "Tổng hợp lương" + "Tổng hợp truy lĩnh" - "Tổng hợp truy thu".
        // Wait, "Truy lĩnh" is money RECEIVED (Back pay), "Truy thu" is DEDUCTED (Clawback).
        // Usually Insurance follows Salary.
        // If Salary increases (Truy Linh), Insurance increases.
        // If Salary decreases (Truy Thu), Insurance decreases?
        // Let's look at prompt:
        // "Tổng hợp truy lĩnh... giá trị < 0 (lấy trị tuyệt đối)..." (This is Back Pay, usually adds to total liabilities)
        // "Tổng hợp truy thu... giá trị > 0 (lấy trị tuyệt đối)..." (This is Clawback, usually subtracts)

        // Formula in image: "= 1 + 2 - 3"
        // 1: Luong
        // 2: Truy Linh
        // 3: Truy Thu
        // So Net = Luong + TruyLinh - TruyThu. 
        // This makes sense: 
        // Salary = Base positive.
        // BackPay = Add positive.
        // Clawback = Subtract positive.

        const netBHXH = store.Luong.BHXH + store.TruyThu.BHXH - store.TruyLinh.BHXH;
        const netBHYT = store.Luong.BHYT + store.TruyThu.BHYT - store.TruyLinh.BHYT;
        const netBHTN = store.Luong.BHTN + store.TruyThu.BHTN - store.TruyLinh.BHTN;

        const netVals = { BHXH: netBHXH, BHYT: netBHYT, BHTN: netBHTN };

        // Add Group Header Row
        result.push(createResultRow(roman, key, netVals));

        // Add Sub Rows
        result.push(createResultRow('1', 'Tổng hợp lương', store.Luong));
        result.push(createResultRow('2', 'Tổng hợp truy lĩnh', store.TruyLinh));
        result.push(createResultRow('3', 'Tổng hợp truy thu', store.TruyThu));
    });

    // Calculate Grand Total for Main Table (Total All Groups)
    let totalAllNet = { BHXH: 0, BHYT: 0, BHTN: 0 };
    ORDER.forEach(key => {
        const store = mainAgg[key];
        totalAllNet.BHXH += (store.Luong.BHXH + store.TruyThu.BHXH - store.TruyLinh.BHXH);
        totalAllNet.BHYT += (store.Luong.BHYT + store.TruyThu.BHYT - store.TruyLinh.BHYT);
        totalAllNet.BHTN += (store.Luong.BHTN + store.TruyThu.BHTN - store.TruyLinh.BHTN);
    });

    // Add Main Table Total Row
    result.push(createResultRow('', 'Cộng', totalAllNet));

    // B. SPECIFIC BREAKDOWNS (Trong đó tách 2 mã...)
    // I. Mã LA... (Đi NN) / Mã LA0001A
    const isPhuTho = (targetLocation && normalizeLocation(targetLocation) === 'Phú Thọ');
    const maLA = isPhuTho ? 'Mã LA0001A (đi nước ngoài)' : 'Mã LA... (đi nước ngoài)';
    const maHW = isPhuTho ? 'Mã HW0004A' : 'Mã HW03889';

    result.push(['', '', '', '', '', '', '', '', '', '', '', '', '']); // Spacer
    result.push(['', 'Trong đó tách 2 mã như sau:', '', '', '', '', '', '', '', '', '', '', '']);

    const laBienChe = diNuocNgoaiAgg[AGG_KEYS.BIEN_CHE];
    const laThuongXuyen = diNuocNgoaiAgg[AGG_KEYS.THUONG_XUYEN];

    // Calculate Net for LA Bien Che
    const netLaBC = {
        BHXH: laBienChe.Luong.BHXH + laBienChe.TruyThu.BHXH - laBienChe.TruyLinh.BHXH,
        BHYT: laBienChe.Luong.BHYT + laBienChe.TruyThu.BHYT - laBienChe.TruyLinh.BHYT,
        BHTN: laBienChe.Luong.BHTN + laBienChe.TruyThu.BHTN - laBienChe.TruyLinh.BHTN
    };

    // Calculate Net for LA Thuong Xuyen
    const netLaTX = {
        BHXH: laThuongXuyen.Luong.BHXH + laThuongXuyen.TruyThu.BHXH - laThuongXuyen.TruyLinh.BHXH,
        BHYT: laThuongXuyen.Luong.BHYT + laThuongXuyen.TruyThu.BHYT - laThuongXuyen.TruyLinh.BHYT,
        BHTN: laThuongXuyen.Luong.BHTN + laThuongXuyen.TruyThu.BHTN - laThuongXuyen.TruyLinh.BHTN
    };

    const netLaTotal = sumObj(netLaBC, netLaTX);

    result.push(createResultRow('I', maLA, netLaTotal));
    result.push(createResultRow('1', 'Diện biên chế', netLaBC));
    result.push(createResultRow('2', 'Diện HĐLĐ thường xuyên', netLaTX));

    // II. Mã HW03889 / HW0004A
    const hwNet = subtractObj(totalAllNet, netLaTotal);

    result.push(createResultRow('II', maHW, hwNet));

    // New Total for this section: I + II = Total All
    // Since I = netLaTotal and II = TotalAll - netLaTotal, Sum = TotalAll
    result.push(createResultRow('', 'Cộng', totalAllNet));

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

    // 4. Ghi dữ liệu (bắt đầu từ dòng 5)
    sheet.getRange(5, 1, rows, cols).setValues(fullData);

    // 5. Định dạng Header & Tiêu đề
    const monthParts = monthStr.substring(1).split('.');
    const month = parseInt(monthParts[0], 10);
    const year = monthParts[1];

    // Tiêu đề
    sheet.getRange("A1").setValue("TRƯỜNG ĐẠI HỌC CÔNG NGHỆ GTVT").setFontWeight('bold').setFontSize(12);
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
        Logger.log('✅ Đã copy chữ ký nguyên bản định dạng từ Master');
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

    const exportUrl = `https://docs.google.com/spreadsheets/d/${ss.getId()}/export?format=pdf&size=A4&portrait=false&fitw=true&gridlines=false&horizontal_alignment=CENTER`;
    return exportUrl;
}

