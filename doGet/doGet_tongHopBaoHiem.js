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
    var targetLocation = "Hà Nội";
    var url = doGet_taoBangTongHopBaoHiem(monthStr, targetLocation);
    Logger.log(url);
}

function doGet_tongHopBaoHiem(monthStr, resources, targetLocation) {
    const RATES = {
        BHXH: { EMP: 8, SCHOOL: 17.5 },
        BHYT: { EMP: 1.5, SCHOOL: 3 },
        BHTN: { EMP: 1, SCHOOL: 1 }
    };

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
        TongLuong1: getIdx(headerL1, ['Tổng lương 1', 'TongLuong1', 'Thực lĩnh', 'ThucLinh']),
        BHXH: getIdx(headerL1, 'BHXH'),
        BHYT: getIdx(headerL1, 'BHYT'),
        BHTN: getIdx(headerL1, 'BHTN')
    };
    if (idxL1.TongLuong1 === -1) {
        idxL1.TongLuong1 = headerL1.findIndex(value => String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\u0111/g, 'd')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '') === 'tongluong1');
    }
    if (idxL1.TongLuong1 === -1) {
        throw new Error('Khong tim thay cot Tong luong 1 trong DataLuong1; khong the lap bao cao bao hiem.');
    }

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

    const AGG_KEYS = {
        BIEN_CHE: 'Diện biên chế',
        THUONG_XUYEN: 'Diện HĐLĐ thường xuyên',
        HD_68: 'Diện hợp đồng 68',
        VU_VIEC: 'Diện hợp đồng vụ việc'
    };

    const createStorage = () => ({
        Luong: { BHXH: 0, BHYT: 0, BHTN: 0 },
        TruyLinh: { BHXH: 0, BHYT: 0, BHTN: 0 },
        TruyThu: { BHXH: 0, BHYT: 0, BHTN: 0 }
    });

    const mainAgg = {};
    const diNuocNgoaiAgg = {};

    Object.values(AGG_KEYS).forEach(k => {
        mainAgg[k] = createStorage();
        diNuocNgoaiAgg[k] = createStorage();
    });

    function getStorage(maNS) {
        let info = mapNhanSu[maNS];

        if (!info) {
            const fallbackKV = masterKVMap[maNS] || 'Hà Nội';
            if (targetLocation && targetLocation !== 'All' && fallbackKV !== targetLocation) return null;
            return null;
        }

        const loaiHD = info.LoaiHD;
        const trangThai = info.TrangThai;

        let catKey = null;
        if (loaiHD === 'Biên chế') catKey = AGG_KEYS.BIEN_CHE;
        else if (loaiHD === 'HĐ dài hạn') catKey = AGG_KEYS.THUONG_XUYEN;
        else if (loaiHD === 'HĐ 68') catKey = AGG_KEYS.HD_68;
        else if (loaiHD === 'HĐ vụ việc') catKey = AGG_KEYS.VU_VIEC;

        if (!catKey) return null;

        const isDiNN = (trangThai === 'Đi NN' || trangThai === 'Đi công tác NN');

        return {
            main: mainAgg[catKey],
            sub: isDiNN ? diNuocNgoaiAgg[catKey] : null
        };
    }

    // Process Salary (Luong)
    let excludedByTongLuong1 = 0;
    let excludedBHXH = 0;
    dataLuong1Raw.slice(1).forEach(row => {
        const ky = String(row[idxL1.KyLuong]).trim();
        if (ky !== monthStr) return;
        const tongLuong1Raw = row[idxL1.TongLuong1];
        const tongLuong1 = parseNumber(tongLuong1Raw);
        if (tongLuong1Raw === '' || tongLuong1Raw === null || tongLuong1Raw === undefined || tongLuong1 <= 0 || isNaN(tongLuong1)) {
            excludedByTongLuong1++;
            excludedBHXH += parseNumber(row[idxL1.BHXH]);
            return;
        }

        const maNS = String(row[idxL1.MaCB]).trim();
        if (!maNS) return;

        const store = getStorage(maNS);
        if (!store) return;

        const vals = {
            BHXH: Math.round(parseNumber(row[idxL1.BHXH])),
            BHYT: Math.round(parseNumber(row[idxL1.BHYT])),
            BHTN: Math.round(parseNumber(row[idxL1.BHTN]))
        };

        store.main.Luong.BHXH += vals.BHXH;
        store.main.Luong.BHYT += vals.BHYT;
        store.main.Luong.BHTN += vals.BHTN;

        if (store.sub) {
            store.sub.Luong.BHXH += vals.BHXH;
            store.sub.Luong.BHYT += vals.BHYT;
            store.sub.Luong.BHTN += vals.BHTN;
        }
    });
    Logger.log(`Tong hop BHXH: da loai ${excludedByTongLuong1} dong co Tong luong 1 <= 0/rong; BHXH loai: ${excludedBHXH}`);

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

            const targetBucket = val > 0 ? 'TruyLinh' : 'TruyThu';

            store.main[targetBucket][field] += val;
            if (store.sub) {
                store.sub[targetBucket][field] += val;
            }
        });
    });

    // 5. Build Output Table
    const result = [];

    function calculateRow(employeePay) {
        const { BHXH, BHYT, BHTN } = employeePay;

        const roundedBHXH = Math.round(BHXH || 0);
        const roundedBHYT = Math.round(BHYT || 0);
        const roundedBHTN = Math.round(BHTN || 0);
        const empTotal = roundedBHXH + roundedBHYT + roundedBHTN;

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

    function createDetailedRow(stt, content, vals) {
        const c = calculateRow(vals);
        return [
            stt,
            content,
            '',
            '',
            c.emp.BHXH,
            c.emp.BHYT,
            c.emp.BHTN,
            c.emp.Total,
            c.school.BHXH,
            c.school.BHYT,
            c.school.BHTN,
            c.school.Total,
            c.grandTotal
        ];
    }

    function sumArrayRows(rows, stt, content) {
        const sumCols = [0, 0, 0, 0, 0, 0, 0, 0, 0]; // 9 cột số từ index 4 đến 12
        rows.forEach(r => {
            for (let i = 0; i < 9; i++) {
                sumCols[i] += Number(r[i + 4]) || 0;
            }
        });
        return [stt, content, '', '', ...sumCols];
    }

    const allGroupRows = [];

    ORDER.forEach(key => {
        const roman = ROMAN[key];
        const store = mainAgg[key];

        const row1 = createDetailedRow('1', 'Tổng hợp lương', store.Luong);
        const row2 = createDetailedRow('2', 'Tổng hợp truy lĩnh', store.TruyLinh);
        const row3 = createDetailedRow('3', 'Tổng hợp truy thu', store.TruyThu);

        const groupHeader = sumArrayRows([row1, row2, row3], roman, key);
        result.push(groupHeader);
        allGroupRows.push(groupHeader);

        result.push(row1);
        result.push(row2);
        result.push(row3);
    });

    const firstGrandTotalRow = sumArrayRows(allGroupRows, '', 'Cộng');
    result.push(firstGrandTotalRow);

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

    result.push(['', '', '', '', '', '', '', '', '', '', '', '', '']);
    result.push(['', 'Trong đó tách 2 mã như sau:', '', '', '', '', '', '', '', '', '', '', '']);

    const laBienChe = diNuocNgoaiAgg[AGG_KEYS.BIEN_CHE];
    const laThuongXuyen = diNuocNgoaiAgg[AGG_KEYS.THUONG_XUYEN];

    const netLaBC = {
        BHXH: laBienChe.Luong.BHXH + laBienChe.TruyThu.BHXH + laBienChe.TruyLinh.BHXH,
        BHYT: laBienChe.Luong.BHYT + laBienChe.TruyThu.BHYT + laBienChe.TruyLinh.BHYT,
        BHTN: laBienChe.Luong.BHTN + laBienChe.TruyThu.BHTN + laBienChe.TruyLinh.BHTN
    };
    const netLaTX = {
        BHXH: laThuongXuyen.Luong.BHXH + laThuongXuyen.TruyThu.BHXH + laThuongXuyen.TruyLinh.BHXH,
        BHYT: laThuongXuyen.Luong.BHYT + laThuongXuyen.TruyThu.BHYT + laThuongXuyen.TruyLinh.BHYT,
        BHTN: laThuongXuyen.Luong.BHTN + laThuongXuyen.TruyThu.BHTN + laThuongXuyen.TruyLinh.BHTN
    };

    const rowLaBC = createDetailedRow('1', 'Diện biên chế', netLaBC);
    const rowLaTX = createDetailedRow('2', 'Diện HĐLĐ thường xuyên', netLaTX);
    const laGroupHeader = sumArrayRows([rowLaBC, rowLaTX], 'I', maLA);

    result.push(laGroupHeader);
    result.push(rowLaBC);
    result.push(rowLaTX);

    // Tính hàng HW = firstGrandTotal - laGroupHeader
    const hwCols = [];
    for (let i = 4; i <= 12; i++) {
        hwCols.push((Number(firstGrandTotalRow[i]) || 0) - (Number(laGroupHeader[i]) || 0));
    }
    const hwRow = ['II', maHW, '', '', ...hwCols];
    result.push(hwRow);

    // Hàng Cộng cuối = laGroupHeader + hwRow (= firstGrandTotalRow)
    const congCuoiRow = sumArrayRows([laGroupHeader, hwRow], '', 'Cộng');
    result.push(congCuoiRow);

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

    const ssMaster = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.MASTER_DATA);
    const ssLuong1 = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.DATA_LUONG_1);
    const ssTruyThu1 = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.TRUY_THU_LUONG_1);

    const resources = {
        ssMaster,
        ssLuong1,
        ssTruyThu1
    };

    const data = doGet_tongHopBaoHiem(monthStr, resources, targetLocation);

    if (!data || data.length === 0) {
        Logger.log('CẢNH BÁO: Không có dữ liệu trả về');
        throw new Error('Không có dữ liệu bảo hiểm cho kỳ ' + monthStr);
    }

    const headerRow1 = [
        'STT', 'Nội dung', 'HSL', 'Mức LTT',
        'Người lao động trả', '', '', '',
        'Nhà trường trả', '', '', '',
        'Tổng tiền'
    ];

    const headerRow2 = [
        '', '', '', '',
        'BHXH 8%', 'BHYT 1.5%', 'BHTN 1%', 'Thành tiền',
        'BHXH 17.5%', 'BHYT 3%', 'BHTN 1%', 'Thành tiền',
        ''
    ];

    const fullData = [headerRow1, headerRow2].concat(data);
    const rows = fullData.length;
    const cols = 13;

    const ss = SpreadsheetApp.openById(TEST_FILE_ID);
    let sheet = ss.getSheetByName(TEST_SHEET_NAME);
    if (!sheet) {
        sheet = ss.insertSheet(TEST_SHEET_NAME);
    } else {
        sheet.clear();
    }

    sheet.setHiddenGridlines(true);

    sheet.getRange(5, 1, rows, cols).setValues(fullData);

    const monthParts = monthStr.substring(1).split('.');
    const month = parseInt(monthParts[0], 10);
    const year = monthParts[1];

    sheet.getRange(1, 1, 1, 3).merge().setValue("TRƯỜNG ĐẠI HỌC CÔNG NGHỆ GTVT").setFontWeight('bold').setFontSize(12).setHorizontalAlignment('center');
    sheet.getRange(2, 1, 1, 3).merge().setValue("──────────").setFontWeight('normal').setFontSize(10).setHorizontalAlignment('center');
    let titleText = `BẢNG TỔNG HỢP BẢO HIỂM THÁNG ${month} NĂM ${year}`;
    if (targetLocation && targetLocation !== 'All') {
        titleText += ` - CƠ SỞ ${targetLocation.toUpperCase()}`;
    }
    sheet.getRange("A3:M3").merge().setHorizontalAlignment('center').setVerticalAlignment('middle').setValue(titleText).setFontWeight('bold').setFontSize(18);

    sheet.getRange("A5:A6").merge();
    sheet.getRange("B5:B6").merge();
    sheet.getRange("C5:C6").merge();
    sheet.getRange("D5:D6").merge();

    sheet.getRange("E5:H5").merge();
    sheet.getRange("I5:L5").merge();

    sheet.getRange("M5:M6").merge();

    sheet.getRange(5, 1, 2, cols).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');

    const headerRange = sheet.getRange("A5:M6");
    headerRange.setFontWeight('bold')
        .setHorizontalAlignment('center')
        .setVerticalAlignment('middle')
        .setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.SOLID);

    const dataRange = sheet.getRange(7, 1, rows - 2, cols);
    const moneyRange = sheet.getRange(7, 5, rows - 2, 9);

    moneyRange.setNumberFormat('#,##0');

    const lastR = sheet.getLastRow();
    const lastC = sheet.getLastColumn();
    const fullRange = sheet.getRange(1, 1, lastR, lastC);

    fullRange.setFontFamily('Times New Roman');

    const boldSTTs = ['I', 'II', 'III', 'IV', ''];

    for (let i = 2; i < rows; i++) {
        const rowIdx = 5 + i;
        const rowData = fullData[i];
        const stt = String(rowData[0]).trim();

        if (boldSTTs.includes(stt) || rowData[1].toString().startsWith('Cộng') || rowData[1].toString().startsWith('Trong đó')) {
            sheet.getRange(rowIdx, 1, 1, cols).setFontWeight('bold');
        }
    }

    sheet.getRange(5, 1, rows, 1).setHorizontalAlignment('center');

    const MASTER_SHEET_NAME = GLOBAL_CONFIG.SHEETS.MASTER;
    const lastDataRow = 5 + rows - 1;
    let masterSheet = ss.getSheetByName(MASTER_SHEET_NAME);

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
        Logger.log('⚠️ Không tìm thấy sheet Master trong file báo cáo, thử lấy từ MasterData...');
        if (ssMaster) {
            const srcMaster = ssMaster.getSheetByName(MASTER_SHEET_NAME);
            if (srcMaster) copySig(srcMaster);
            else Logger.log('❌ Không tìm thấy Master sheet trong cả MasterData.');
        }
    }

    Logger.log('Đã hoàn thành tạo bảng bảo hiểm.');

    const finalTableRange = sheet.getRange(5, 1, rows, cols);
    finalTableRange.setBorder(true, true, true, true, true, null, 'black', SpreadsheetApp.BorderStyle.SOLID);
    finalTableRange.setBorder(null, null, null, null, null, true, 'black', SpreadsheetApp.BorderStyle.DOTTED);
    sheet.getRange(5, 1, 2, cols).setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.SOLID);
    for (let i = 2; i < rows; i++) {
        const rowIdx = 5 + i;
        const rowData = fullData[i];
        if (boldSTTs.includes(String(rowData[0]).trim()) ||
            String(rowData[1] || '').startsWith('Cộng') ||
            String(rowData[1] || '').startsWith('Trong đó')) {
            sheet.getRange(rowIdx, 1, 1, cols).setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.SOLID);
        }
    }

    sheet.setRowHeight(1, 22);
    sheet.setRowHeight(2, 18);
    sheet.getRange(1, 1, 1, 3).setFontSize(10).setFontWeight('bold').setHorizontalAlignment('center');
    sheet.getRange(2, 1, 1, 3).setFontSize(10).setFontWeight('normal').setHorizontalAlignment('center');
    sheet.getRange("A3:M3").setFontSize(18).setFontWeight('bold').setHorizontalAlignment('center');

    SpreadsheetApp.flush();

    const exportUrl = `https://docs.google.com/spreadsheets/d/${ss.getId()}/export?format=pdf&size=A4&portrait=false&fitw=true&gridlines=false&horizontal_alignment=CENTER`;
    return exportUrl;
}

/**
 * Xây dựng dữ liệu Bảng tổng hợp bảo hiểm thuần In-Memory (dùng chung cho cả In HTML và Export Sheet)
 */
function buildTongHopBaoHiemData(monthStr, targetLocation) {
    const resources = {
        ssMaster: GLOBAL_CONFIG.FILES.MASTER_DATA,
        ssLuong1: GLOBAL_CONFIG.FILES.DATA_LUONG_1,
        ssTruyThu1: GLOBAL_CONFIG.FILES.TRUY_THU_LUONG_1
    };

    const data = doGet_tongHopBaoHiem(monthStr, resources, targetLocation);
    if (!data || data.length === 0) {
        throw new Error('Không có dữ liệu bảo hiểm cho kỳ ' + monthStr);
    }

    const headerRow1 = [
        'STT', 'Nội dung', 'HSL', 'Mức LTT',
        'Người lao động trả', '', '', '',
        'Nhà trường trả', '', '', '',
        'Tổng tiền'
    ];

    const headerRow2 = [
        '', '', '', '',
        'BHXH 8%', 'BHYT 1.5%', 'BHTN 1%', 'Thành tiền',
        'BHXH 17.5%', 'BHYT 3%', 'BHTN 1%', 'Thành tiền',
        ''
    ];

    return [headerRow1, headerRow2].concat(data);
}

/**
 * Cung cấp dữ liệu JSON cho việc in ấn Bảng tổng hợp bảo hiểm trên Client (Pure In-Memory)
 */
function getPrintDataTongHopBaoHiem(monthStr, location) {
    try {
        const data = buildTongHopBaoHiemData(monthStr, location);

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
