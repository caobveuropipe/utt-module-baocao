/**
 * MODULE: TỔNG HỢP KINH PHÍ CÔNG ĐOÀN (doGet_tongHopKPCD)
 * 
 * MÔ TẢ:
 * File này chứa logic để tổng hợp tiền KPCĐ từ các nguồn dữ liệu lương và truy thu.
 * KPCĐ được tính từ DataLuong1 = (KPCĐ / 0.5) * 2.
 * 
 * LOGIC CHI TIẾT:
 * 1. Lấy dữ liệu từ DataLuong1 và DataTruyThuLinh (Chỉ lấy phần Lương 1).
 * 2. Map nhân sự với Loại HĐ và Khu vực (Địa phương).
 * 3. Phân nhóm: Diện biên chế, Diện HĐLĐ thường xuyên, Diện hợp đồng 68, Diện hợp đồng vụ việc.
 * 4. Trình bày bảng tính:
 *    - Theo các diện nêu trên.
 *    - Theo khu vực (Hà Nội / Vĩnh Phúc).
 * 
 * INPUT: Month String (e.g. "T01.2025")
 * OUTPUT: Download URL (XLSX)
 */

function doGet_tongHopKPCD(monthStr, resources, location = 'All') {
    const locationNormalized = (location && location !== 'All') ? normalizeLocation(location) : null;
    const GROUP_KEYS = {
        BIEN_CHE: 'Diện biên chế',
        HD_DAI_HAN: 'Diện HĐLĐ thường xuyên',
        HD_68: 'Diện HĐLĐ 68',
        HD_VU_VIEC: 'Diện HD vụ việc'
    };

    const ALL_LOCATIONS = new Set();
    const groups = {}; // { groupKey: { total: 0, locs: { loc: val } } }

    function getData(ss, sheetName) {
        if (!ss) return [];
        const sh = ss.getSheetByName(sheetName);
        return sh ? sh.getDataRange().getValues() : [];
    }
    function getIdx(header, name) {
        return header.indexOf(name);
    }
    function parseNumber(val) {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const num = Number(String(val).replace(/,/g, ''));
        return isNaN(num) ? 0 : num;
    }

    // 2. LOAD DATA
    const dataChotRaw = getSheetNSThang().getDataRange().getValues();
    const dataNhanSuRaw = getData(resources.ssMaster, GLOBAL_CONFIG.SHEETS.DATA_NHAN_SU);
    const dataLuong1Raw = getData(resources.ssLuong1, GLOBAL_CONFIG.SHEETS.DATA_LUONG_1);
    const dataTruyThuRaw = getData(resources.ssTruyThu1, GLOBAL_CONFIG.SHEETS.DATA_TRUY_THU);

    // 3. MAP DATA
    const mapLoaiHD = {};
    const mapKhuVuc = {}; // MaNS -> Khu vuc

    if (dataChotRaw.length > 1) {
        const h = dataChotRaw[0];
        const idxKy = getIdx(h, 'Kỳ lương');
        const idxMa = getIdx(h, 'Mã nhân sự');
        const idxHD = getIdx(h, 'Loại hợp đồng');
        let idxKV = getIdx(h, 'Khu vực');
        if (idxKV < 0) idxKV = 38; // Ưu tiên cột AM (38) theo chỉ định của anh

        dataChotRaw.slice(1).forEach(row => {
            if (String(row[idxKy]).trim() === monthStr) {
                const ma = String(row[idxMa]).trim();
                if (ma) {
                    mapLoaiHD[ma] = String(row[idxHD] || '').trim();
                    mapKhuVuc[ma] = normalizeLocation(row[idxKV]);
                }
            }
        });
    }

    if (dataNhanSuRaw.length > 1) {
        const h = dataNhanSuRaw[0];
        const idxMa = getIdx(h, 'Mã CB') >= 0 ? getIdx(h, 'Mã CB') : 0;
        const idxKV = getIdx(h, 'Khu vực');

        dataNhanSuRaw.slice(1).forEach(row => {
            const ma = String(row[idxMa]).trim();
            if (ma && !mapKhuVuc[ma] && idxKV >= 0) {
                mapKhuVuc[ma] = normalizeLocation(row[idxKV]);
            }
        });
    }

    function addValue(maNS, val) {
        if (!val || val === 0) return;
        const rawHD = mapLoaiHD[maNS];
        if (!rawHD) return;

        let groupKey = null;
        if (rawHD === 'Biên chế') groupKey = GROUP_KEYS.BIEN_CHE;
        else if (rawHD === 'HĐ dài hạn') groupKey = GROUP_KEYS.HD_DAI_HAN;
        else if (rawHD === 'HĐ 68') groupKey = GROUP_KEYS.HD_68;
        else if (rawHD === 'HĐ vụ việc') groupKey = GROUP_KEYS.HD_VU_VIEC;

        if (!groupKey) return;

        let kv = mapKhuVuc[maNS] || 'Khác';
        ALL_LOCATIONS.add(kv);

        if (!groups[groupKey]) groups[groupKey] = { total: 0, locs: {} };
        groups[groupKey].total += val;
        groups[groupKey].locs[kv] = (groups[groupKey].locs[kv] || 0) + val;
    }

    // 5. PROCESS DATA
    if (dataLuong1Raw.length > 1) {
        const h = dataLuong1Raw[0];
        const idxKy = getIdx(h, 'Kỳ lương');
        const idxMa = getIdx(h, 'Mã CB');
        const idxKPCD = getIdx(h, 'KPCĐ');
        dataLuong1Raw.slice(1).forEach(row => {
            if (String(row[idxKy]).trim() === monthStr) {
                const ma = String(row[idxMa]).trim();

                // --- KIỂM TRA LỌC THEO ĐỊA PHƯƠNG ---
                if (locationNormalized) {
                    const empKV = mapKhuVuc[ma] || "";
                    if (empKV !== locationNormalized) return;
                }

                addValue(ma, (parseNumber(row[idxKPCD]) / 0.5) * 2);
            }
        });
    }

    if (dataTruyThuRaw.length > 1) {
        const h = dataTruyThuRaw[0];
        const idxKy = getIdx(h, 'Kỳ trả lương');
        const idxMa = getIdx(h, 'Mã nhân sự');
        const idxKPCD = getIdx(h, 'KPCĐ');
        dataTruyThuRaw.slice(1).forEach(row => {
            if (String(row[idxKy]).trim() === monthStr) {
                const ma = String(row[idxMa]).trim();

                // --- KIỂM TRA LỌC THEO ĐỊA PHƯƠNG ---
                if (locationNormalized) {
                    const empKV = mapKhuVuc[ma] || "";
                    if (empKV !== locationNormalized) return;
                }

                addValue(ma, parseNumber(row[idxKPCD]));
            }
        });
    }

    // Sort locations
    const sortedLocs = Array.from(ALL_LOCATIONS).sort((a, b) => {
        if (a === 'Hà Nội') return -1; if (b === 'Hà Nội') return 1;
        if (a === 'Phú Thọ') return -1; if (b === 'Phú Thọ') return 1;
        return a.localeCompare(b);
    });

    const result = [];
    let grandTotal = { total: 0, locs: {} };
    const ORDER = [GROUP_KEYS.BIEN_CHE, GROUP_KEYS.HD_DAI_HAN, GROUP_KEYS.HD_68, GROUP_KEYS.HD_VU_VIEC];

    ORDER.forEach((k, i) => {
        const g = groups[k] || { total: 0, locs: {} };
        const row = [i + 1, k, g.total];
        sortedLocs.forEach(loc => {
            const v = g.locs[loc] || 0;
            row.push(v);
            grandTotal.locs[loc] = (grandTotal.locs[loc] || 0) + v;
        });
        row.push(''); // Ghi chú
        result.push(row);
        grandTotal.total += g.total;
    });

    const totalRow = ['', 'Tổng cộng', grandTotal.total];
    sortedLocs.forEach(loc => totalRow.push(grandTotal.locs[loc] || 0));
    totalRow.push('');
    result.push(totalRow);

    return { data: result, locations: sortedLocs };
}

function doGet_taoBangTongHopKPCD(monthStr, location = 'All') {
    const TARGET_FILE_ID = GLOBAL_CONFIG.FILES.EXPORT_DKB_TH_KPCD;
    const TARGET_SHEET_NAME = GLOBAL_CONFIG.SHEETS.SHEET_TH_KPCD;

    Logger.log('Bắt đầu tạo bảng tổng hợp KPCĐ cho kỳ: %s', monthStr);

    const ssMaster = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.MASTER_DATA);
    const ssLuong1 = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.DATA_LUONG_1);
    const ssTruyThu1 = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.TRUY_THU_LUONG_1);

    const resources = { ssMaster, ssLuong1, ssTruyThu1 };

    try {
        const result = doGet_tongHopKPCD(monthStr, resources, location);
        if (!result || !result.data.length) return null;

        const { data, locations } = result;
        const numLocs = locations.length;
        const totalCols = 3 + numLocs + 1;

        const ss = SpreadsheetApp.openById(TARGET_FILE_ID);
        let sheet = ss.getSheetByName(TARGET_SHEET_NAME);
        if (!sheet) sheet = ss.insertSheet(TARGET_SHEET_NAME);
        else {
            sheet.clear();
            if (sheet.getFilter()) sheet.getFilter().remove();
            const maxRows = sheet.getMaxRows();
            const maxCols = sheet.getMaxColumns();
            if (maxRows > 1 && maxCols > 1) {
                sheet.getRange(1, 1, maxRows, maxCols).breakApart();
            }
        }

        const monthParts = monthStr.substring(1).split('.');
        const month = parseInt(monthParts[0]);
        const year = monthParts[1];

        // 1. TITLE & HEADERS
        sheet.getRange("A1").setValue("TRƯỜNG ĐẠI HỌC CÔNG NGHỆ GTVT").setFontWeight('bold').setFontSize(11);
        const title = `BẢNG TỔNG HỢP TIỀN KINH PHÍ CÔNG ĐOÀN \nTHÁNG ${month} NĂM ${year}`;
        sheet.getRange(3, 1, 2, totalCols).merge().setValue(title)
            .setHorizontalAlignment("center").setVerticalAlignment("middle")
            .setFontWeight('bold').setFontSize(14).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);

        const h1 = ['STT', 'NỘI DUNG', 'TỔNG TIỀN', 'Trong đó', ...new Array(numLocs - 1).fill(''), 'GHI CHÚ'];
        const h2 = ['', '', '', ...locations.map(l => l.toUpperCase()), ''];
        sheet.getRange(6, 1, 2, totalCols).setValues([h1, h2]).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle').setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.SOLID);

        // Merge Header Groups
        sheet.getRange(6, 1, 2, 1).merge();
        sheet.getRange(6, 2, 2, 1).merge();
        sheet.getRange(6, 3, 2, 1).merge();
        sheet.getRange(6, 4, 1, numLocs).merge();
        sheet.getRange(6, totalCols, 2, 1).merge();

        // 2. DATA
        sheet.getRange(8, 1, data.length, totalCols).setValues(data);

        // 3. STYLING
        const lastRow = 7 + data.length;
        sheet.getRange(1, 1, lastRow + 10, totalCols).setFontFamily('Times New Roman').setFontSize(12);

        // Body Style
        const dataRange = sheet.getRange(8, 1, data.length, totalCols);
        dataRange.setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.THIN)
                 .setVerticalAlignment('middle');
        sheet.getRange(8, 3, data.length, numLocs + 1).setNumberFormat('#,##0');
        sheet.getRange(8, 1, data.length, 1).setHorizontalAlignment('center');

        // Set row height to 50 for header and data rows
        sheet.setRowHeights(6, data.length + 2, 50); 

        // Bold Total Row
        sheet.getRange(lastRow, 1, 1, totalCols).setFontWeight('bold');

        // Column Widths
        sheet.setColumnWidth(1, 40);
        sheet.setColumnWidth(2, 300);
        sheet.setColumnWidth(3, 120);
        for (let j = 0; j < numLocs; j++) sheet.setColumnWidth(4 + j, 120);
        sheet.setColumnWidth(totalCols, 100);

        // 4. SIGNATURE
        const sigRow = lastRow + 2;
        sheet.getRange(sigRow + 1, 1, 1, 2).merge().setValue('Người lập').setFontWeight('bold').setHorizontalAlignment('center');
        sheet.getRange(sigRow + 1, 3, 1, numLocs > 1 ? 2 : 1).merge().setValue('Kế toán trưởng').setFontWeight('bold').setHorizontalAlignment('center');
        const todayStr = Utilities.formatDate(new Date(), "GMT+7", "'Ngày 'dd' tháng 'MM' năm 'yyyy");
        sheet.getRange(sigRow, totalCols - 1, 1, 2).merge().setValue(todayStr).setHorizontalAlignment('center').setFontStyle('italic');
        sheet.getRange(sigRow + 1, totalCols - 1, 1, 2).merge().setValue('Ban Giám hiệu').setFontWeight('bold').setHorizontalAlignment('center');

        return `https://docs.google.com/spreadsheets/d/${TARGET_FILE_ID}/export?format=pdf&size=A4&portrait=true&fitw=true&gridlines=false&horizontal_alignment=CENTER`;
    } catch (e) {
        Logger.log('Error doGet_taoBangTongHopKPCD: ' + e.message);
        throw e;
    }
}
