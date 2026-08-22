/**
 * MODULE: HẠCH TOÁN BẢO HIỂM (doGet_hachToanBaoHiem)
 * 
 * MÔ TẢ:
 * File này chứa logic để tổng hợp hạch toán bảo hiểm (BHXH, BHYT, BHTN).
 * Phân chia thành Nhóm Trực tiếp và Gián tiếp. 
 * Trong mỗi nhóm chia thành 4 loại HD: Biên chế, HĐLĐ thường xuyên, HĐ 68, HĐ vụ việc.
 */
function test_doGet_taoBangTHBaoHiem() {
    var monthStr = 'T06.2026';
    var location = 'Hà Nội';
    Logger.log(doGet_taoBangHachToanBaoHiem(monthStr, location));
}

/**
 * Hàm Test kiểm tra và audit chi tiết từng nhân sự được xếp vào diện nào trong Hạch Toán Bảo Hiểm
 * Mặc định kiểm tra khu vực Hà Nội, tháng T06.2026
 */
function test_auditChiTietHachToanBaoHiem() {
    var monthStr = 'T06.2026';
    var location = 'Hà Nội';
    var res = auditChiTietHachToanBaoHiem(monthStr, location);
    Logger.log(`Kết quả audit: ${JSON.stringify(res)}`);
}

/**
 * Hàm xử lý dữ liệu hạch toán bảo hiểm
 */
function doGet_hachToanBaoHiem(monthStr, resources, targetLocation, addContent = '', addAmount = 0) {
    const RATES = {
        BHXH: { EMP: 8, SCHOOL: 17.5 },
        BHYT: { EMP: 1.5, SCHOOL: 3 },
        BHTN: { EMP: 1, SCHOOL: 1 }
    };

    Logger.log(`Starting doGet_hachToanBaoHiem for month: ${monthStr}`);

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
        DonVi: getIdx(headerChot, ['Đơn vị', 'DonVi']),
        TrangThai: getIdx(headerChot, ['Trạng thái', 'TrangThai', 'Trạng thái công tác']),
        LuongCD: getIdx(headerChot, ['Lương CĐ', 'Lương cố định', 'LuongCD', 'LuongCoDinh'])
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
        const trangThai = idxChot.TrangThai !== -1 ? String(row[idxChot.TrangThai] || '').trim() : '';

        const luongCDIdx = idxChot.LuongCD !== -1 ? idxChot.LuongCD : 36; // Cột AK (index 36)
        const luongCD = parseNumber(row[luongCDIdx]);
        const isLuongCD = luongCD > 0;

        const tenNhom = mapDonViToNhom[maDV] || 'Gián tiếp';
        const isTrucTiep = (tenNhom === 'Trực tiếp');

        mapNhanSu[ma] = {
            LoaiHD: loaiHD,
            IsTrucTiep: isTrucTiep,
            TrangThai: trangThai,
            IsLuongCD: isLuongCD
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
        BHTN: getIdx(headerTT, ['BHTN']),
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
                Luong: { BHXH: 0, BHYT: 0, BHTN: 0 },
                LuongCoDinh: { BHXH: 0, BHYT: 0, BHTN: 0 },
                TruyLinh: { BHXH: 0, BHYT: 0, BHTN: 0 },
                TruyThu: { BHXH: 0, BHYT: 0, BHTN: 0 }
            };
        });
        return store;
    };

    const aggTrucTiep = createGroupStorage();
    const aggGianTiep = createGroupStorage();
    const aggNuocNgoaiSingle = {
        Luong: { BHXH: 0, BHYT: 0, BHTN: 0 },
        LuongCoDinh: { BHXH: 0, BHYT: 0, BHTN: 0 },
        TruyLinh: { BHXH: 0, BHYT: 0, BHTN: 0 },
        TruyThu: { BHXH: 0, BHYT: 0, BHTN: 0 }
    };

    function getStorage(maNS) {
        const info = mapNhanSu[maNS];
        if (!info) return null;

        if (info.TrangThai && info.TrangThai.toUpperCase().includes('ĐI CÔNG TÁC NN')) {
            return aggNuocNgoaiSingle;
        }

        let catKey = null;
        const loaiHD = info.LoaiHD;
        if (loaiHD === 'Biên chế') catKey = AGG_KEYS.BIEN_CHE;
        else if (loaiHD === 'HĐ dài hạn' || info.IsLuongCD) catKey = AGG_KEYS.THUONG_XUYEN;
        else if (loaiHD === 'HĐ 68') catKey = AGG_KEYS.HD_68;
        else if (loaiHD === 'HĐ vụ việc') catKey = AGG_KEYS.VU_VIEC;

        if (!catKey) return null;

        return info.IsTrucTiep ? aggTrucTiep[catKey] : aggGianTiep[catKey];
    }

    // Process Luong
    dataLuong1Raw.slice(1).forEach(row => {
        if (String(row[idxL1.KyLuong]).trim() !== monthStr) return;
        const maNS = String(row[idxL1.MaCB]).trim();
        const store = getStorage(maNS);
        if (!store) return;

        const info = mapNhanSu[maNS];
        const isNN = info.TrangThai && info.TrangThai.toUpperCase().includes('ĐI CÔNG TÁC NN');
        
        if (!isNN && info.IsLuongCD) {
            store.LuongCoDinh.BHXH += parseNumber(row[idxL1.BHXH]);
            store.LuongCoDinh.BHYT += parseNumber(row[idxL1.BHYT]);
            store.LuongCoDinh.BHTN += parseNumber(row[idxL1.BHTN]);
        } else {
            store.Luong.BHXH += parseNumber(row[idxL1.BHXH]);
            store.Luong.BHYT += parseNumber(row[idxL1.BHYT]);
            store.Luong.BHTN += parseNumber(row[idxL1.BHTN]);
        }
    });

    // Process Truy Thu / Truy Linh
    dataTruyThuRaw.slice(1).forEach(row => {
        if (String(row[idxTT.KyTraLuong]).trim() !== monthStr) return;
        const store = getStorage(String(row[idxTT.MaNS]).trim());
        if (!store) return;

        const conNhanIdx = idxTT.ConNhan !== -1 ? idxTT.ConNhan : 33; // Fallback to index 33 (AH)
        const conNhanVal = parseNumber(row[conNhanIdx]);
        if (conNhanVal === 0) return;

        ['BHXH', 'BHYT', 'BHTN'].forEach(field => {
            const val = parseNumber(row[idxTT[field]]);
            if (val === 0) return;
            const absVal = Math.abs(val);
            if (conNhanVal > 0) store.TruyLinh[field] += absVal;
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

    // --- Section I: Gián tiếp ---
    const orderGianTiep = [AGG_KEYS.BIEN_CHE, AGG_KEYS.THUONG_XUYEN, AGG_KEYS.HD_68, AGG_KEYS.VU_VIEC];
    const vtGianTiep = { [AGG_KEYS.BIEN_CHE]: 'BC', [AGG_KEYS.THUONG_XUYEN]: 'HĐ', [AGG_KEYS.HD_68]: 'HĐ 68', [AGG_KEYS.VU_VIEC]: 'HĐ vụ việc' };
    const nameGianTiep = { [AGG_KEYS.BIEN_CHE]: 'biên chế', [AGG_KEYS.THUONG_XUYEN]: 'hợp đồng', [AGG_KEYS.HD_68]: 'hợp đồng 68', [AGG_KEYS.VU_VIEC]: 'hợp đồng vụ việc' };

    let totalGianTiepRow = ['I', 'Tổng gián tiếp: 1+2+3+4', 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const rowsGianTiep = [];
    orderGianTiep.forEach((key, i) => {
        const store = aggGianTiep[key];
        const stt = (i + 1).toString();
        const rowLuong = createRow(stt, `Gián tiếp ${nameGianTiep[key]}`, store.Luong);
        const rowLinh = createRow('', `Truy lĩnh gián tiếp ${vtGianTiep[key]}`, store.TruyLinh);
        const rowThu = createRow('', `Truy thu gián tiếp ${vtGianTiep[key]}`, store.TruyThu);

        let rowCong;
        if (key === AGG_KEYS.THUONG_XUYEN) {
            const rowLuongCoDinh = createRow('', 'Hợp đồng lương cố định', store.LuongCoDinh);
            rowsGianTiep.push(rowLuong, rowLuongCoDinh, rowLinh, rowThu);
            rowCong = sumRows(rowLuong, rowLuongCoDinh, 1);
            rowCong = sumRows(rowCong, rowLinh, 1);
            rowCong = sumRows(rowCong, rowThu, -1);
        } else {
            rowsGianTiep.push(rowLuong, rowLinh, rowThu);
            rowCong = sumRows(rowLuong, rowLinh, 1);
            rowCong = sumRows(rowCong, rowThu, -1);
        }
        rowCong[0] = '';
        rowCong[1] = `Cộng gián tiếp ${vtGianTiep[key]}`;
        rowsGianTiep.push(rowCong);
        totalGianTiepRow = sumRows(totalGianTiepRow, rowCong);
    });
    totalGianTiepRow[0] = 'I';
    totalGianTiepRow[1] = 'Tổng gián tiếp: 1+2+3+4';
    result.push(totalGianTiepRow);
    rowsGianTiep.forEach(r => result.push(r));

    // --- Section II: Trực tiếp ---
    const orderTrucTiep = [AGG_KEYS.BIEN_CHE, AGG_KEYS.THUONG_XUYEN, AGG_KEYS.HD_68, AGG_KEYS.VU_VIEC];
    const vtTrucTiep = { [AGG_KEYS.BIEN_CHE]: 'BC', [AGG_KEYS.THUONG_XUYEN]: 'HĐ', [AGG_KEYS.HD_68]: 'HĐ 68', [AGG_KEYS.VU_VIEC]: 'HĐ vụ việc' };
    const nameTrucTiep = { [AGG_KEYS.BIEN_CHE]: 'biên chế', [AGG_KEYS.THUONG_XUYEN]: 'hợp đồng', [AGG_KEYS.HD_68]: 'hợp đồng 68', [AGG_KEYS.VU_VIEC]: 'hợp đồng vụ việc' };

    let totalTrucTiepRow = ['II', 'Tổng trực tiếp: 1+2+3+4', 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const rowsTrucTiep = [];
    orderTrucTiep.forEach((key, i) => {
        const store = aggTrucTiep[key];
        const stt = (i + 1).toString();
        const rowLuong = createRow(stt, `Trực tiếp ${nameTrucTiep[key]}`, store.Luong);
        const rowLinh = createRow('', `Truy lĩnh trực tiếp ${vtTrucTiep[key]}`, store.TruyLinh);
        const rowThu = createRow('', `Truy thu trực tiếp ${vtTrucTiep[key]}`, store.TruyThu);

        let rowCong;
        if (key === AGG_KEYS.THUONG_XUYEN) {
            const rowLuongCoDinh = createRow('', 'Hợp đồng lương cố định', store.LuongCoDinh);
            rowsTrucTiep.push(rowLuong, rowLuongCoDinh);
            let rowCongTemp = sumRows(rowLuong, rowLuongCoDinh, 1);
            if (addContent && addAmount > 0) {
                const addAmountRound = Math.round(addAmount);
                const rowAdd = [
                    '', addContent,
                    0, 0, 0, 0,
                    addAmountRound, 0, 0, addAmountRound,
                    addAmountRound
                ];
                rowsTrucTiep.push(rowAdd);
                rowCongTemp = sumRows(rowCongTemp, rowAdd, 1);
            }
            rowCong = sumRows(rowCongTemp, rowLinh, 1);
            rowCong = sumRows(rowCong, rowThu, -1);
            rowCong[0] = '';
            rowCong[1] = `Cộng trực tiếp ${vtTrucTiep[key]}`;
            rowsTrucTiep.push(rowLinh, rowThu, rowCong);
        } else {
            rowsTrucTiep.push(rowLuong, rowLinh, rowThu);
            rowCong = sumRows(rowLuong, rowLinh, 1);
            rowCong = sumRows(rowCong, rowThu, -1);
            rowCong[0] = '';
            rowCong[1] = `Cộng trực tiếp ${vtTrucTiep[key]}`;
            rowsTrucTiep.push(rowCong);
        }

        totalTrucTiepRow = sumRows(totalTrucTiepRow, rowCong);
    });
    totalTrucTiepRow[0] = 'II';
    totalTrucTiepRow[1] = 'Tổng trực tiếp: 1+2+3+4';
    result.push(totalTrucTiepRow);
    rowsTrucTiep.forEach(r => result.push(r));

    // --- Section III: Mã nước ngoài ---
    // Chỉ có 1 dòng duy nhất là III cho tất cả các nhân sự có trạng thái là Đi công tác NN
    // Cộng các khoản Luong, TruyLinh, TruyThu
    const storeNNLuongRow = createRow('III', 'Mã nước ngoài', aggNuocNgoaiSingle.Luong);
    const storeNNLinhRow = createRow('', 'Truy lĩnh nước ngoài', aggNuocNgoaiSingle.TruyLinh);
    const storeNNThuRow = createRow('', 'Truy thu nước ngoài', aggNuocNgoaiSingle.TruyThu);
    let totalNuocNgoaiRow = sumRows(storeNNLuongRow, storeNNLinhRow, -1);
    totalNuocNgoaiRow = sumRows(totalNuocNgoaiRow, storeNNThuRow, 1);
    totalNuocNgoaiRow[0] = 'III';
    totalNuocNgoaiRow[1] = 'Mã nước ngoài';
    result.push(totalNuocNgoaiRow);

    // --- Cộng: I + II ---
    let congI_IIRow = sumRows(totalGianTiepRow, totalTrucTiepRow, 1);
    congI_IIRow[0] = '';
    congI_IIRow[1] = 'Cộng: I + II';
    result.push(congI_IIRow);

    // --- Grand Total ---
    let grandTotalRow = sumRows(congI_IIRow, totalNuocNgoaiRow, 1);
    grandTotalRow[0] = '';
    grandTotalRow[1] = 'Tổng cộng: I+II+III';
    result.push(grandTotalRow);

    return result;
}

/**
 * Hàm xuất bảng hạch toán bảo hiểm
 */
function doGet_taoBangHachToanBaoHiem(monthStr, location, addContent = '', addAmount = 0) {
    const EXPORT_FILE_ID = GLOBAL_CONFIG.FILES.EXPORT_HT_TH_BH;
    const SHEET_NAME = GLOBAL_CONFIG.SHEETS.SHEET_TH_BH;

    // 0. OPEN RESOURCES
    const ssLuong1 = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.DATA_LUONG_1);
    const ssTruyThu1 = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.TRUY_THU_LUONG_1);
    const resources = { ssLuong1, ssTruyThu1 };

    // 1. Lấy dữ liệu
    const data = doGet_hachToanBaoHiem(monthStr, resources, location, addContent, addAmount);

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

    // 4. Ghi dữ liệu (Dịch xuống dòng 6 để chừa dòng 4 cho Month)
    sheet.getRange(6, 1, rows, cols).setValues(fullData);

    // 5. Định dạng Header & Tiêu đề
    const monthParts = monthStr.substring(1).split('.');
    const month = parseInt(monthParts[0], 10);
    const year = monthParts[1];

    sheet.getRange(1, 1, 1, 3).merge().setValue("TRƯỜNG ĐẠI HỌC CÔNG NGHỆ GTVT").setFontWeight('bold').setFontSize(10).setHorizontalAlignment('center');
    sheet.getRange(2, 1, 1, 3).merge().setValue("──────────").setFontWeight('normal').setFontSize(9).setHorizontalAlignment('center');
    
    // Tách tiêu đề và tháng thành 2 dòng giống HTML
    sheet.getRange("A3:K3").merge().setHorizontalAlignment('center').setValue("BẢNG TỔNG HỢP HẠCH TOÁN BẢO HIỂM").setFontWeight('bold').setFontSize(12);
    sheet.getRange("A4:K4").merge().setHorizontalAlignment('center').setValue(`THÁNG ${month} NĂM ${year}`).setFontWeight('bold').setFontSize(11);

    sheet.getRange("A6:A7").merge();
    sheet.getRange("B6:B7").merge();
    sheet.getRange("C6:F6").merge();
    sheet.getRange("G6:J6").merge();
    sheet.getRange("K6:K7").merge();

    const headerRange = sheet.getRange("A6:K7");
    headerRange.setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle').setFontSize(10);

    // --- STYLING CHUẨN ---
    const lastR = sheet.getLastRow();
    const lastC = sheet.getLastColumn();
    const fullRange = sheet.getRange(1, 1, lastR, lastC);

    // 1. Ẩn gridlines, Reset border & Set Font
    fullRange.setBackground('#FFFFFF').setBorder(false, false, false, false, false, false).setFontFamily('Arial').setFontSize(9.5);

    // Cấu hình lại font size cho dòng tiêu đề và header để không bị ghi đè bởi fullRange
    sheet.getRange("A1").setFontSize(10);
    sheet.getRange("A3").setFontSize(12);
    sheet.getRange("A4").setFontSize(11);
    sheet.getRange("A6:K7").setFontSize(10);

    // 2. Alignment for STT column (center)
    sheet.getRange(6, 1, rows, 1).setHorizontalAlignment('center');

    // Định dạng số phân cách hàng nghìn cho cột C -> K
    sheet.getRange(8, 3, rows - 2, cols - 2).setNumberFormat("#,##0");

    // Thiết lập khoảng cách dòng 5 trống ở mức gọn gàng để tránh tràn trang
    sheet.setRowHeight(5, 10);

    // 3. Bold rows where STT is not empty OR contains "Cộng"/"Tổng cộng"
    for (let i = 0; i < data.length; i++) {
        const rowIdx = 8 + i;
        const stt = String(data[i][0]).trim();
        const content = String(data[i][1]).trim();

        // Thu gọn size chữ (9pt) và chiều cao dòng (17px) tối đa để toàn bộ bảng + chữ ký vừa khít trong 1 trang A4 landscape
        sheet.setRowHeight(rowIdx, 17);
        sheet.getRange(rowIdx, 1, 1, cols).setFontSize(9);

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

    // ====== BƯỚC CUỐI: TẠO ĐƯỜNG KẺ BẢNG ======
    const finalTableRange = sheet.getRange(6, 1, rows, cols);
    // 1. Viền ngoài và kẻ dọc: Nét liền (SOLID)
    finalTableRange.setBorder(true, true, true, true, true, null, 'black', SpreadsheetApp.BorderStyle.SOLID);
    // 2. Kẻ ngang nội dung: Nét đứt (DOTTED)
    finalTableRange.setBorder(null, null, null, null, null, true, 'black', SpreadsheetApp.BorderStyle.DOTTED);
    // 3. Header: Nét liền toàn bộ
    sheet.getRange(6, 1, 2, cols).setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.SOLID);

    // FR-02: set row height for school name & title
    sheet.setRowHeight(1, 18);
    sheet.setRowHeight(2, 10);
    sheet.setRowHeight(3, 18);
    sheet.setRowHeight(4, 15);
    sheet.setRowHeight(5, 10); // Spacing
    sheet.setRowHeight(6, 18); // Header 1
    sheet.setRowHeight(7, 18); // Header 2
    sheet.setRowHeight(targetRow - 1, 8); // Spacing trước chữ ký
    sheet.setRowHeight(targetRow, 16); 
    sheet.setRowHeight(targetRow + 1, 16); 

    sheet.getRange(1, 1, 1, 3).setFontSize(10).setFontWeight('bold').setHorizontalAlignment('center');
    sheet.getRange(2, 1, 1, 3).setFontSize(10).setFontWeight('normal').setHorizontalAlignment('center');
    sheet.getRange("A3:K3").setFontSize(12).setFontWeight('bold').setHorizontalAlignment('center');

    // Đóng băng 7 dòng đầu để lặp lại header ở các trang in tiếp theo nếu có tràn
    sheet.setFrozenRows(7);

    return `https://docs.google.com/spreadsheets/d/${ss.getId()}/export?format=pdf&size=A4&portrait=false&fitw=true&gridlines=false&horizontal_alignment=CENTER&left_margin=0.5&right_margin=0.25&top_margin=0.5&bottom_margin=0.25&fzr=true`;
}

/**
 * Xây dựng dữ liệu Bảng hạch toán bảo hiểm thuần In-Memory (dùng chung cho In HTML và Export Sheet)
 */
function buildHachToanBaoHiemData(monthStr, location, addContent = '', addAmount = 0) {
    const resources = {
        ssMaster: GLOBAL_CONFIG.FILES.MASTER_DATA,
        ssLuong1: GLOBAL_CONFIG.FILES.DATA_LUONG_1,
        ssTruyThu1: GLOBAL_CONFIG.FILES.TRUY_THU_LUONG_1
    };

    const data = doGet_hachToanBaoHiem(monthStr, resources, location, addContent, addAmount);
    if (!data || data.length === 0) {
        throw new Error('Không có dữ liệu hạch toán bảo hiểm cho kỳ ' + monthStr);
    }

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

    return [headerRow1, headerRow2].concat(data);
}

/**
 * Cung cấp dữ liệu JSON cho việc in ấn Bảng hạch toán bảo hiểm trên Client (Pure In-Memory)
 */
function getPrintDataHachToanBaoHiem(monthStr, location, addContent = '', addAmount = 0) {
    try {
        const fullData = buildHachToanBaoHiemData(monthStr, location, addContent, addAmount);

        const monthParts = monthStr.substring(1).split('.');
        const month = monthParts[0];
        const year = monthParts[1];

        return {
            status: "success",
            month: month,
            year: year,
            data: fullData,
            dateExport: `Ngày ${new Date().getDate()} tháng ${month} năm ${year}`
        };
    } catch (e) {
        return { status: "error", message: e.message };
    }
}

/**
 * HÀM THỰC THI AUDIT: Bóc tách chi tiết từng nhân sự và phân loại vào mục hạch toán bảo hiểm
 * Xuất kết quả trực tiếp ra Sheet "Audit_HachToanBaoHiem" trong file EXPORT_HT_TH_BH
 * 
 * @param {string} monthStr Kỳ lương cần audit (VD: 'T06.2026')
 * @param {string} location Khu vực cần audit (VD: 'Hà Nội', 'Phú Thọ', 'All')
 */
function auditChiTietHachToanBaoHiem(monthStr = 'T06.2026', location = 'Hà Nội') {
    Logger.log(`=================== BẮT ĐẦU AUDIT CHI TIẾT HẠCH TOÁN BẢO HIỂM [${monthStr} - ${location}] ===================`);
    
    const EXPORT_FILE_ID = GLOBAL_CONFIG.FILES.EXPORT_HT_TH_BH;
    const AUDIT_SHEET_NAME = 'Audit_HachToanBaoHiem';
    const RATES = {
        BHXH: { EMP: 8, SCHOOL: 17.5 },
        BHYT: { EMP: 1.5, SCHOOL: 3 },
        BHTN: { EMP: 1, SCHOOL: 1 }
    };

    try {
        const locationNormalized = location && location !== 'All' ? normalizeLocation(location) : null;

        // 1. Đọc Setup: Mã đơn vị -> Nhóm Trực tiếp / Gián tiếp
        const ssFileData = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.MASTER_DATA);
        const shSetup = ssFileData.getSheetByName('Setup');
        if (!shSetup) throw new Error("Không tìm thấy sheet 'Setup' trong file Master Data");
        const lastRow = shSetup.getLastRow();
        const dataSetupRaw = shSetup.getRange("K2:M" + Math.max(2, lastRow)).getValues();

        const mapDonViToNhom = {};
        dataSetupRaw.forEach(row => {
            const maDV = String(row[0] || '').trim();
            const nhom = String(row[2] || '').trim();
            if (maDV) mapDonViToNhom[maDV] = nhom;
        });

        // 2. Đọc Master Data Chốt Nhân Sự Tháng
        const dataChotRaw = getSheetNSThang().getDataRange().getValues();
        if (dataChotRaw.length < 2) throw new Error("Dữ liệu DataChotNSThang trống!");
        const headerChot = dataChotRaw[0] || [];
        const idxChot = {
            KyLuong: getIdx(headerChot, ['Kỳ lương', 'KyLuong', 'Ky']),
            MaNS: getIdx(headerChot, ['Mã nhân sự', 'Mã NS', 'MaNS', 'Ma']),
            HoTen: getIdx(headerChot, ['Họ và tên', 'Họ tên', 'HoTen', 'Tên']),
            LoaiHD: getIdx(headerChot, ['Loại hợp đồng', 'LoaiHD']),
            MaDonVi: getIdx(headerChot, ['Mã đơn vị', 'MaDonVi', 'MaBP']),
            DonVi: getIdx(headerChot, ['Đơn vị', 'DonVi']),
            TrangThai: getIdx(headerChot, ['Trạng thái', 'TrangThai', 'Trạng thái công tác']),
            LuongCD: getIdx(headerChot, ['Lương CĐ', 'Lương cố định', 'LuongCD', 'LuongCoDinh'])
        };

        const mapNhanSu = {};
        dataChotRaw.slice(1).forEach(row => {
            const ky = String(row[idxChot.KyLuong]).trim();
            if (ky !== monthStr) return;

            const kv = normalizeLocation(row[38]); // Cột AM
            const ma = String(row[idxChot.MaNS]).trim();
            if (!ma) return;

            const hoTen = idxChot.HoTen !== -1 ? String(row[idxChot.HoTen] || '').trim() : '';
            const maDV = String(row[idxChot.MaDonVi] || '').trim();
            const donVi = idxChot.DonVi !== -1 ? String(row[idxChot.DonVi] || '').trim() : '';
            const loaiHD = String(row[idxChot.LoaiHD] || '').trim();
            const trangThai = idxChot.TrangThai !== -1 ? String(row[idxChot.TrangThai] || '').trim() : '';

            const luongCDIdx = idxChot.LuongCD !== -1 ? idxChot.LuongCD : 36;
            const luongCD = parseNumber(row[luongCDIdx]);
            const isLuongCD = luongCD > 0;

            const tenNhom = mapDonViToNhom[maDV] || 'Gián tiếp';
            const isTrucTiep = (tenNhom === 'Trực tiếp');

            mapNhanSu[ma] = {
                ma: ma,
                hoTen: hoTen,
                maDV: maDV,
                donVi: donVi,
                loaiHD: loaiHD,
                trangThai: trangThai,
                isLuongCD: isLuongCD,
                luongCDVal: luongCD,
                isTrucTiep: isTrucTiep,
                tenNhom: tenNhom,
                khuVuc: kv
            };
        });

        // 3. Hàm phân loại mục hạch toán bảo hiểm
        function classifyHachToan(maNS) {
            const info = mapNhanSu[maNS];
            if (!info) {
                return {
                    nhomCP: 'Không xác định',
                    mucHachToan: 'Chưa có thông tin nhân sự trong DataChotNS'
                };
            }

            if (info.trangThai && info.trangThai.toUpperCase().includes('ĐI CÔNG TÁC NN')) {
                return {
                    nhomCP: 'Nước ngoài',
                    mucHachToan: 'III. Cá nhân đi công tác nước ngoài tự đóng BH'
                };
            }

            const prefixNhom = info.isTrucTiep ? 'II. Trực tiếp' : 'I. Gián tiếp';
            const nhomCP = info.isTrucTiep ? 'Trực tiếp' : 'Gián tiếp';
            let dienHD = 'Khác';

            if (info.loaiHD === 'Biên chế') {
                dienHD = '1. Diện biên chế';
            } else if (info.loaiHD === 'HĐ dài hạn' || info.isLuongCD) {
                dienHD = '2. Diện HĐLĐ thường xuyên';
            } else if (info.loaiHD === 'HĐ 68') {
                dienHD = '3. Diện hợp đồng 68';
            } else if (info.loaiHD === 'HĐ vụ việc') {
                dienHD = '4. Diện hợp đồng vụ việc';
            } else {
                dienHD = `Khác (${info.loaiHD})`;
            }

            return {
                nhomCP: nhomCP,
                mucHachToan: `${prefixNhom} - ${dienHD}`
            };
        }

        // 4. Bóc tách dữ liệu từ DataLuong1
        const auditRows = [];
        const dataLuong1Raw = getData(GLOBAL_CONFIG.FILES.DATA_LUONG_1, GLOBAL_CONFIG.SHEETS.DATA_LUONG_1);
        const headerL1 = dataLuong1Raw[0] || [];
        const idxL1 = {
            KyLuong: getIdx(headerL1, ['Kỳ lương', 'Ky']),
            MaCB: getIdx(headerL1, ['Mã CB', 'MaNS', 'Ma']),
            HoTen: getIdx(headerL1, ['Họ và tên', 'Họ tên', 'HoTen']),
            BHXH: getIdx(headerL1, ['BHXH']),
            BHYT: getIdx(headerL1, ['BHYT']),
            BHTN: getIdx(headerL1, ['BHTN'])
        };

        dataLuong1Raw.slice(1).forEach(row => {
            if (String(row[idxL1.KyLuong]).trim() !== monthStr) return;
            const maNS = String(row[idxL1.MaCB]).trim();
            if (!maNS) return;

            const ns = mapNhanSu[maNS];
            if (locationNormalized && ns && ns.khuVuc && ns.khuVuc !== locationNormalized) return;

            const bhxh = Math.round(parseNumber(row[idxL1.BHXH]));
            const bhyt = Math.round(parseNumber(row[idxL1.BHYT]));
            const bhtn = Math.round(parseNumber(row[idxL1.BHTN]));
            if (bhxh === 0 && bhyt === 0 && bhtn === 0) return;

            const isNN = ns && ns.trangThai && ns.trangThai.toUpperCase().includes('ĐI CÔNG TÁC NN');
            const nguon = (!isNN && ns && ns.isLuongCD) ? 'Lương (Cố định)' : 'Lương';
            const classification = classifyHachToan(maNS);

            const empTotal = bhxh + bhyt + bhtn;
            const schoolBHXH = Math.round((bhxh / RATES.BHXH.EMP) * RATES.BHXH.SCHOOL);
            const schoolBHYT = Math.round((bhyt / RATES.BHYT.EMP) * RATES.BHYT.SCHOOL);
            const schoolBHTN = Math.round((bhtn / RATES.BHTN.EMP) * RATES.BHTN.SCHOOL);
            const schoolTotal = schoolBHXH + schoolBHYT + schoolBHTN;
            const grandTotal = empTotal + schoolTotal;

            const hoTen = (ns && ns.hoTen) ? ns.hoTen : (idxL1.HoTen !== -1 ? String(row[idxL1.HoTen] || '').trim() : '');

            auditRows.push({
                maNS: maNS,
                hoTen: hoTen,
                maDV: ns ? ns.maDV : '',
                donVi: ns ? ns.donVi : '',
                nhomCP: classification.nhomCP,
                loaiHD: ns ? ns.loaiHD : '',
                trangThai: ns ? ns.trangThai : '',
                isLuongCD: (ns && ns.isLuongCD) ? 'Có' : 'Không',
                mucHachToan: classification.mucHachToan,
                nguon: nguon,
                empBHXH: bhxh,
                empBHYT: bhyt,
                empBHTN: bhtn,
                empTotal: empTotal,
                schoolBHXH: schoolBHXH,
                schoolBHYT: schoolBHYT,
                schoolBHTN: schoolBHTN,
                schoolTotal: schoolTotal,
                grandTotal: grandTotal
            });
        });

        // 5. Bóc tách dữ liệu từ DataTruyThu
        const dataTruyThuRaw = getData(GLOBAL_CONFIG.FILES.TRUY_THU_LUONG_1, GLOBAL_CONFIG.SHEETS.DATA_TRUY_THU);
        const headerTT = dataTruyThuRaw[0] || [];
        const idxTT = {
            KyTraLuong: getIdx(headerTT, ['Kỳ trả lương', 'Kỳ lương', 'Ky']),
            MaNS: getIdx(headerTT, ['Mã nhân sự', 'MaNS', 'Ma']),
            HoTen: getIdx(headerTT, ['Họ và tên', 'Họ tên', 'HoTen']),
            BHXH: getIdx(headerTT, ['BHXH']),
            BHYT: getIdx(headerTT, ['BHYT']),
            BHTN: getIdx(headerTT, ['BHTN']),
            ConNhan: getIdx(headerTT, ['Còn nhận', 'ConNhan', 'Con nhan'])
        };

        dataTruyThuRaw.slice(1).forEach(row => {
            if (String(row[idxTT.KyTraLuong]).trim() !== monthStr) return;
            const maNS = String(row[idxTT.MaNS]).trim();
            if (!maNS) return;

            const ns = mapNhanSu[maNS];
            if (locationNormalized && ns && ns.khuVuc && ns.khuVuc !== locationNormalized) return;

            const conNhanIdx = idxTT.ConNhan !== -1 ? idxTT.ConNhan : 33;
            const conNhanVal = parseNumber(row[conNhanIdx]);
            if (conNhanVal === 0) return;

            const bhxh = Math.round(Math.abs(parseNumber(row[idxTT.BHXH])));
            const bhyt = Math.round(Math.abs(parseNumber(row[idxTT.BHYT])));
            const bhtn = Math.round(Math.abs(parseNumber(row[idxTT.BHTN])));
            if (bhxh === 0 && bhyt === 0 && bhtn === 0) return;

            const nguon = conNhanVal > 0 ? 'Truy lĩnh' : 'Truy thu';
            const classification = classifyHachToan(maNS);

            const empTotal = bhxh + bhyt + bhtn;
            const schoolBHXH = Math.round((bhxh / RATES.BHXH.EMP) * RATES.BHXH.SCHOOL);
            const schoolBHYT = Math.round((bhyt / RATES.BHYT.EMP) * RATES.BHYT.SCHOOL);
            const schoolBHTN = Math.round((bhtn / RATES.BHTN.EMP) * RATES.BHTN.SCHOOL);
            const schoolTotal = schoolBHXH + schoolBHYT + schoolBHTN;
            const grandTotal = empTotal + schoolTotal;

            const hoTen = (ns && ns.hoTen) ? ns.hoTen : (idxTT.HoTen !== -1 ? String(row[idxTT.HoTen] || '').trim() : '');

            auditRows.push({
                maNS: maNS,
                hoTen: hoTen,
                maDV: ns ? ns.maDV : '',
                donVi: ns ? ns.donVi : '',
                nhomCP: classification.nhomCP,
                loaiHD: ns ? ns.loaiHD : '',
                trangThai: ns ? ns.trangThai : '',
                isLuongCD: (ns && ns.isLuongCD) ? 'Có' : 'Không',
                mucHachToan: classification.mucHachToan,
                nguon: nguon,
                empBHXH: bhxh,
                empBHYT: bhyt,
                empBHTN: bhtn,
                empTotal: empTotal,
                schoolBHXH: schoolBHXH,
                schoolBHYT: schoolBHYT,
                schoolBHTN: schoolBHTN,
                schoolTotal: schoolTotal,
                grandTotal: grandTotal
            });
        });

        // Sắp xếp dữ liệu theo Mục hạch toán, sau đó theo Mã NS
        auditRows.sort((a, b) => {
            if (a.mucHachToan !== b.mucHachToan) return a.mucHachToan.localeCompare(b.mucHachToan);
            return a.maNS.localeCompare(b.maNS);
        });

        // 6. Ghi kết quả ra Google Sheets
        const ss = SpreadsheetApp.openById(EXPORT_FILE_ID);
        let auditSheet = ss.getSheetByName(AUDIT_SHEET_NAME);
        if (!auditSheet) {
            auditSheet = ss.insertSheet(AUDIT_SHEET_NAME);
        }
        auditSheet.clear();
        auditSheet.getRange("A:T").clearFormat();

        // Banner Tiêu đề
        auditSheet.getRange("A1:T1").merge()
            .setValue(`BẢNG AUDIT CHI TIẾT PHÂN LOẠI NHÂN SỰ HẠCH TOÁN BẢO HIỂM - THÁNG ${monthStr} - ĐỊA PHƯƠNG: ${location}`)
            .setFontSize(12).setFontWeight("bold").setBackground("#D1E7DD").setHorizontalAlignment("center");
        auditSheet.getRange("A2:T2").merge()
            .setValue(`Thời gian export audit: ${new Date().toLocaleString("vi-VN")}`)
            .setFontSize(9).setFontStyle("italic").setHorizontalAlignment("center");

        // Headers 2 tầng
        const header1 = [
            "STT", "Mã NS", "Họ và tên", "Mã ĐV", "Tên đơn vị", "Nhóm CP", "Loại hợp đồng", "Trạng thái", "Lương CĐ", "Mục hạch toán được xếp vào", "Nguồn phát sinh",
            "Người lao động trả (NLĐ)", "", "", "",
            "Nhà trường trả", "", "", "",
            "Tổng cộng BH"
        ];
        const header2 = [
            "", "", "", "", "", "", "", "", "", "", "",
            "BHXH (8%)", "BHYT (1.5%)", "BHTN (1%)", "Tổng NLĐ",
            "BHXH (17.5%)", "BHYT (3%)", "BHTN (1%)", "Tổng Trường",
            ""
        ];

        auditSheet.getRange(4, 1, 1, header1.length).setValues([header1]);
        auditSheet.getRange(5, 1, 1, header2.length).setValues([header2]);

        const merges = ["A4:A5", "B4:B5", "C4:C5", "D4:D5", "E4:E5", "F4:F5", "G4:G5", "H4:H5", "I4:I5", "J4:J5", "K4:K5", "L4:O4", "P4:S4", "T4:T5"];
        merges.forEach(m => auditSheet.getRange(m).merge().setVerticalAlignment("middle").setHorizontalAlignment("center"));

        auditSheet.getRange(4, 1, 2, header1.length)
            .setFontWeight("bold").setBackground("#E2E3E5").setBorder(true, true, true, true, true, true);

        // Chuyển đổi dữ liệu sang mảng 2 chiều
        const tableData = auditRows.map((r, i) => [
            i + 1,
            r.maNS,
            r.hoTen,
            r.maDV,
            r.donVi,
            r.nhomCP,
            r.loaiHD,
            r.trangThai,
            r.isLuongCD,
            r.mucHachToan,
            r.nguon,
            r.empBHXH,
            r.empBHYT,
            r.empBHTN,
            r.empTotal,
            r.schoolBHXH,
            r.schoolBHYT,
            r.schoolBHTN,
            r.schoolTotal,
            r.grandTotal
        ]);

        if (tableData.length > 0) {
            auditSheet.getRange(6, 1, tableData.length, header1.length).setValues(tableData);
            // Định dạng số tiền
            auditSheet.getRange(6, 12, tableData.length, 9).setNumberFormat("#,##0");
            // Kẻ viền bảng
            auditSheet.getRange(6, 1, tableData.length, header1.length)
                .setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.SOLID);

            // Căn lề
            auditSheet.getRange(6, 1, tableData.length, 1).setHorizontalAlignment("center"); // STT
            auditSheet.getRange(6, 2, tableData.length, 1).setHorizontalAlignment("center"); // Mã NS
            auditSheet.getRange(6, 4, tableData.length, 1).setHorizontalAlignment("center"); // Mã ĐV
            auditSheet.getRange(6, 6, tableData.length, 1).setHorizontalAlignment("center"); // Nhóm CP
            auditSheet.getRange(6, 7, tableData.length, 1).setHorizontalAlignment("center"); // Loại HĐ
            auditSheet.getRange(6, 9, tableData.length, 1).setHorizontalAlignment("center"); // Lương CĐ
            auditSheet.getRange(6, 11, tableData.length, 1).setHorizontalAlignment("center"); // Nguồn
        }

        // Dòng Tổng Cộng
        const totalRowIdx = 6 + tableData.length;
        const totalEmpBHXH = auditRows.reduce((s, r) => s + r.empBHXH, 0);
        const totalEmpBHYT = auditRows.reduce((s, r) => s + r.empBHYT, 0);
        const totalEmpBHTN = auditRows.reduce((s, r) => s + r.empBHTN, 0);
        const totalEmp = auditRows.reduce((s, r) => s + r.empTotal, 0);
        const totalSchoolBHXH = auditRows.reduce((s, r) => s + r.schoolBHXH, 0);
        const totalSchoolBHYT = auditRows.reduce((s, r) => s + r.schoolBHYT, 0);
        const totalSchoolBHTN = auditRows.reduce((s, r) => s + r.schoolBHTN, 0);
        const totalSchool = auditRows.reduce((s, r) => s + r.schoolTotal, 0);
        const totalGrand = auditRows.reduce((s, r) => s + r.grandTotal, 0);

        const summaryRow = [
            `TỔNG CỘNG (${tableData.length} bản ghi phát sinh)`,
            "", "", "", "", "", "", "", "", "", "",
            totalEmpBHXH, totalEmpBHYT, totalEmpBHTN, totalEmp,
            totalSchoolBHXH, totalSchoolBHYT, totalSchoolBHTN, totalSchool,
            totalGrand
        ];

        auditSheet.getRange(totalRowIdx, 1, 1, 11).merge().setValue(summaryRow[0]).setHorizontalAlignment("right");
        auditSheet.getRange(totalRowIdx, 12, 1, 9).setValues([[
            totalEmpBHXH, totalEmpBHYT, totalEmpBHTN, totalEmp,
            totalSchoolBHXH, totalSchoolBHYT, totalSchoolBHTN, totalSchool,
            totalGrand
        ]]).setNumberFormat("#,##0");

        auditSheet.getRange(totalRowIdx, 1, 1, header1.length)
            .setFontWeight("bold").setBackground("#FFF3CD").setBorder(true, true, true, true, true, true);

        // Chỉnh độ rộng các cột
        auditSheet.setColumnWidth(1, 45);   // STT
        auditSheet.setColumnWidth(2, 90);   // Mã NS
        auditSheet.setColumnWidth(3, 170);  // Họ và tên
        auditSheet.setColumnWidth(4, 75);   // Mã ĐV
        auditSheet.setColumnWidth(5, 170);  // Tên đơn vị
        auditSheet.setColumnWidth(6, 90);   // Nhóm CP
        auditSheet.setColumnWidth(7, 120);  // Loại HĐ
        auditSheet.setColumnWidth(8, 120);  // Trạng thái
        auditSheet.setColumnWidth(9, 75);   // Lương CĐ
        auditSheet.setColumnWidth(10, 230); // Mục hạch toán
        auditSheet.setColumnWidth(11, 110); // Nguồn
        for (let c = 12; c <= 20; c++) auditSheet.setColumnWidth(c, 105); // Các cột tiền

        auditSheet.setFrozenRows(5);

        const sheetUrl = `https://docs.google.com/spreadsheets/d/${EXPORT_FILE_ID}/edit#gid=${auditSheet.getSheetId()}`;
        Logger.log(`✅ AUDIT HẠCH TOÁN BẢO HIỂM HOÀN TẤT!`);
        Logger.log(`- Tổng số bản ghi: ${tableData.length}`);
        Logger.log(`- Tổng tiền BHXH NLĐ: ${totalEmpBHXH.toLocaleString('vi-VN')} VNĐ`);
        Logger.log(`- Tổng tiền BHXH Nhà trường: ${totalSchoolBHXH.toLocaleString('vi-VN')} VNĐ`);
        Logger.log(`- Tổng cộng BH: ${totalGrand.toLocaleString('vi-VN')} VNĐ`);
        Logger.log(`- Link Sheet: ${sheetUrl}`);

        return {
            status: "success",
            month: monthStr,
            location: location,
            totalRecords: tableData.length,
            totalGrand: totalGrand,
            sheetUrl: sheetUrl
        };
    } catch (e) {
        Logger.log(`❌ LỖI TRONG QUÁ TRÌNH AUDIT HẠCH TOÁN BẢO HIỂM: ${e.message} \n ${e.stack}`);
        return {
            status: "error",
            message: e.message
        };
    }
}
