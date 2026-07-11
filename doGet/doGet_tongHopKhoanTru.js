/**
 * MODULE: TỔNG HỢP KHOẢN TRỪ (doGet_tongHopKhoanTru)
 * 
 * MÔ TẢ:
 * File này xử lý việc tạo "Bảng kê các khoản trừ qua lương + Truy thu".
 * 
 * LOGIC CHÍNH:
 * 1. Phân nhóm:
 *    - Theo loại hợp đồng (Biên chế, Thường xuyên, HĐ 68...).
 *    - Theo khu vực (Hà Nội, Vĩnh Phúc) dựa trên DataNhanSu.
 * 2. Nguồn dữ liệu:
 *    - KPCĐ & Trừ khác: Lấy từ DataLuong1.
 *    - Truy thu KPCĐ: Lấy từ TruyThuLuong1 (chỉ lấy giá trị > 0).
 * 3. Hiển thị:
 *    - STT La Mã cho các nhóm lớn.
 *    - Các dòng chi tiết: 1. Đoàn phí, 2. Trừ khác, 3. Truy thu đoàn phí.
 *    - Tính tổng cộng toàn trường.
 * 
 * INPUT: Month String (e.g. "T01.2025")
 * OUTPUT: Download URL (XLSX) - Sheet THKPCD (File 1r-rS...)
 */
function test_doGet_tongHopKhoanTru() {
    var monthStr = 'T01.2025';
    var url = doGet_taoBangTongHopKhoanTru(monthStr);
    Logger.log(url)
}
function doGet_tongHopKhoanTru(monthStr, resources, location = 'All') {
    const locationNormalized = (location && location !== 'All') ? normalizeLocation(location) : null;
    const GROUP_KEYS = {
        BIEN_CHE: 'Diện biên chế',
        THUONG_XUYEN: 'Diện HĐLĐ thường xuyên',
        HD_68: 'Diện hợp đồng 68',
        VU_VIEC: 'Hợp đồng vụ việc'
    };

    const ALL_LOCATIONS = new Set();
    const groups = {}; // { groupKey: { kpcd: { total: 0, locs: {} }, ... } }

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
    const mapKhuVuc = {};
    const mapLoaiHD = {};

    if (dataChotRaw.length > 1) {
        const h = dataChotRaw[0];
        const idxKy = getIdx(h, 'Kỳ lương');
        const idxMa = getIdx(h, 'Mã nhân sự');
        const idxHD = getIdx(h, 'Loại hợp đồng');
        let idxKV = getIdx(h, 'Khu vực');
        if (idxKV < 0) idxKV = 38; // Ưu tiên cột AM (38)

        dataChotRaw.slice(1).forEach(row => {
            if (String(row[idxKy]).trim() === monthStr) {
                const ma = String(row[idxMa]).trim();
                if (ma) {
                    mapKhuVuc[ma] = normalizeLocation(row[idxKV]);
                    mapLoaiHD[ma] = String(row[idxHD] || '').trim();
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

    const ORDER_GROUPS = [GROUP_KEYS.BIEN_CHE, GROUP_KEYS.THUONG_XUYEN, GROUP_KEYS.HD_68, GROUP_KEYS.VU_VIEC];
    ORDER_GROUPS.forEach(k => {
        groups[k] = {
            kpcd: { total: 0, locs: {} },
            truKhac: { total: 0, locs: {} },
            truyThuKPCD: { total: 0, locs: {} }
        };
    });

    function getGroup(ma) {
        const lhd = mapLoaiHD[ma] || '';
        if (lhd === 'Biên chế') return groups[GROUP_KEYS.BIEN_CHE];
        if (lhd === 'HĐ dài hạn') return groups[GROUP_KEYS.THUONG_XUYEN];
        if (lhd === 'HĐ 68') return groups[GROUP_KEYS.HD_68];
        if (lhd === 'HĐ vụ việc') return groups[GROUP_KEYS.VU_VIEC];
        return groups[GROUP_KEYS.BIEN_CHE];
    }

    function addToMetric(metricObj, val, maNS) {
        if (!val) return;
        let kv = mapKhuVuc[maNS] || 'Khác';
        ALL_LOCATIONS.add(kv);
        metricObj.total += val;
        metricObj.locs[kv] = (metricObj.locs[kv] || 0) + val;
    }

    // 5. PROCESS DATA
    if (dataLuong1Raw.length > 1) {
        const h = dataLuong1Raw[0];
        const idxKy = getIdx(h, 'Kỳ lương');
        const idxMa = getIdx(h, 'Mã CB');
        const idxKPCD = getIdx(h, 'KPCĐ');
        const idxTruKhac = getIdx(h, 'Trừ khác');

        dataLuong1Raw.slice(1).forEach(r => {
            if (String(r[idxKy]).trim() !== monthStr) return;
            const ma = String(r[idxMa]).trim();

            // --- KIỂM TRA LỌC THEO ĐỊA PHƯƠNG ---
            if (locationNormalized) {
                const empKV = mapKhuVuc[ma] || "";
                if (empKV !== locationNormalized) return;
            }

            const g = getGroup(ma);
            if (!g) return;
            addToMetric(g.kpcd, parseNumber(r[idxKPCD]), ma);
            addToMetric(g.truKhac, parseNumber(r[idxTruKhac]), ma);
        });
    }

    if (dataTruyThuRaw.length > 1) {
        const h = dataTruyThuRaw[0];
        const idxKy = getIdx(h, 'Kỳ trả lương');
        const idxMa = getIdx(h, 'Mã nhân sự');
        const idxKPCD = getIdx(h, 'KPCĐ');

        dataTruyThuRaw.slice(1).forEach(r => {
            if (String(r[idxKy]).trim() !== monthStr) return;
            const ma = String(r[idxMa]).trim();

            // --- KIỂM TRA LỌC THEO ĐỊA PHƯƠNG ---
            if (locationNormalized) {
                const empKV = mapKhuVuc[ma] || "";
                if (empKV !== locationNormalized) return;
            }

            const g = getGroup(ma);
            if (!g) return;
            const val = parseNumber(r[idxKPCD]);
            if (val > 0) addToMetric(g.truyThuKPCD, val, ma);
        });
    }

    // Sort locations
    const sortedLocs = Array.from(ALL_LOCATIONS).sort((a, b) => {
        if (a === 'Hà Nội') return -1; if (b === 'Hà Nội') return 1;
        if (a === 'Phú Thọ') return -1; if (b === 'Phú Thọ') return 1;
        return a.localeCompare(b);
    });

    const result = [];
    const ROMAN = { [GROUP_KEYS.BIEN_CHE]: 'I', [GROUP_KEYS.THUONG_XUYEN]: 'II', [GROUP_KEYS.HD_68]: 'III', [GROUP_KEYS.VU_VIEC]: 'IV' };
    let grandTotal = { total: 0, locs: {} };

    ORDER_GROUPS.forEach(groupKey => {
        const store = groups[groupKey];
        const gTotal = { total: 0, locs: {} };
        const items = ['kpcd', 'truKhac', 'truyThuKPCD'];

        items.forEach(k => {
            gTotal.total += store[k].total;
            sortedLocs.forEach(loc => {
                const v = store[k].locs[loc] || 0;
                gTotal.locs[loc] = (gTotal.locs[loc] || 0) + v;
            });
        });

        grandTotal.total += gTotal.total;
        sortedLocs.forEach(loc => {
            grandTotal.locs[loc] = (grandTotal.locs[loc] || 0) + (gTotal.locs[loc] || 0);
        });

        const gRow = [ROMAN[groupKey], groupKey, gTotal.total];
        sortedLocs.forEach(loc => gRow.push(gTotal.locs[loc] || 0));
        gRow.push('');
        result.push(gRow);

        const details = [
            { label: 'Tiền đoàn phí công đoàn', key: 'kpcd' },
            { label: 'Các khoản trừ khác (Quỹ xã hội)', key: 'truKhac' },
            { label: 'Truy thu đoàn phí CĐ', key: 'truyThuKPCD' }
        ];
        details.forEach((d, idx) => {
            const row = [(idx + 1).toString(), d.label, store[d.key].total];
            sortedLocs.forEach(loc => row.push(store[d.key].locs[loc] || 0));
            row.push('');
            result.push(row);
        });
    });

    const finalRow = ['', 'Cộng: I+II+III+IV', grandTotal.total];
    sortedLocs.forEach(loc => finalRow.push(grandTotal.locs[loc] || 0));
    finalRow.push('');
    result.push(finalRow);

    return { data: result, locations: sortedLocs };
}

function doGet_taoBangTongHopKhoanTru(monthStr, location = 'All') {
    const TARGET_FILE_ID = GLOBAL_CONFIG.FILES.EXPORT_DKB_TH_KHOAN_TRU;
    const TARGET_SHEET_NAME = 'THKPCD';

    const ssMaster = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.MASTER_DATA);
    const ssLuong1 = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.DATA_LUONG_1);
    const ssTruyThu1 = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.TRUY_THU_LUONG_1);

    const resources = { ssMaster, ssLuong1, ssTruyThu1 };

    try {
        const result = doGet_tongHopKhoanTru(monthStr, resources, location);
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

        // Ẩn gridline mặc định
        sheet.setHiddenGridlines(true);

        const monthParts = monthStr.substring(1).split('.');
        const month = parseInt(monthParts[0]);
        const year = monthParts[1];

        // HEADERS
        sheet.getRange(1, 1, 1, 3).merge().setValue("TRƯỜNG ĐẠI HỌC CÔNG NGHỆ GTVT").setFontWeight('bold').setFontSize(11).setHorizontalAlignment('center');
        sheet.getRange(2, 1, 1, 3).merge().setValue("──────────").setFontWeight('normal').setFontSize(10).setHorizontalAlignment('center');
        const title = `BẢNG KÊ CÁC KHOẢN ĐOÀN PHÍ CÔNG ĐOÀN + QUỸ XÃ HỘI \nTHÁNG ${month} NĂM ${year}`;
        sheet.getRange(3, 1, 2, totalCols).merge().setValue(title)
            .setHorizontalAlignment("center").setVerticalAlignment("middle")
            .setFontWeight('bold').setFontSize(14).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);

        const h1 = ['Số TT', 'Nội dung', 'Tổng tiền', 'Trong đó', ...new Array(numLocs - 1).fill(''), 'Ghi chú'];
        const h2 = ['', '', '', ...locations.map(l => l.toUpperCase()), ''];
        sheet.getRange(6, 1, 2, totalCols).setValues([h1, h2]).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle').setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.SOLID);

        sheet.getRange(6, 1, 2, 1).merge();
        sheet.getRange(6, 2, 2, 1).merge();
        sheet.getRange(6, 3, 2, 1).merge();
        sheet.getRange(6, 4, 1, numLocs).merge();
        sheet.getRange(6, totalCols, 2, 1).merge();

        // DATA
        sheet.getRange(8, 1, data.length, totalCols).setValues(data);

        // STYLING
        const lastRow = 7 + data.length;
        sheet.getRange(1, 1, lastRow + 10, totalCols).setFontFamily('Times New Roman').setFontSize(12);

        const dataRange = sheet.getRange(8, 1, data.length, totalCols);
        dataRange.setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.THIN);
        sheet.getRange(8, 3, data.length, numLocs + 1).setNumberFormat('#,##0');
        sheet.getRange(8, 1, data.length, 1).setHorizontalAlignment('center');

        for (let i = 0; i < data.length; i++) {
            const rIdx = 8 + i;
            const stt = String(data[i][0]).trim();
            const content = String(data[i][1]);
            if (['I', 'II', 'III', 'IV'].includes(stt) || content.includes('Cộng') || content.includes('Tổng cộng')) {
                sheet.getRange(rIdx, 1, 1, totalCols).setFontWeight('bold').setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.SOLID);
            }
        }

        // Bằng chữ
        const totalVal = data[data.length - 1][2];
        let textBangChu = 'Bằng chữ: ';
        if (typeof numberToVietnameseWords === 'function') {
            textBangChu += numberToVietnameseWords(totalVal);
        } else {
            textBangChu += '............................................................................';
        }
        sheet.getRange(lastRow + 1, 1, 1, totalCols).merge().setValue(textBangChu).setFontStyle('italic').setFontWeight('bold').setFontSize(12);

        // Column Widths - REMOVED as per request to keep original widths
        // sheet.setColumnWidth(1, 40);
        // sheet.setColumnWidth(2, 280);
        // sheet.setColumnWidth(3, 120);
        // for (let j = 0; j < numLocs; j++) sheet.setColumnWidth(4 + j, 120);
        // sheet.setColumnWidth(totalCols, 100);

        // SIGNATURE
        const sigRow = lastRow + 3;
        sheet.getRange(sigRow + 1, 1, 1, 2).merge().setValue('Người lập').setFontWeight('bold').setHorizontalAlignment('center');
        sheet.getRange(sigRow + 1, 3, 1, numLocs > 1 ? 2 : 1).merge().setValue('Kế toán trưởng').setFontWeight('bold').setHorizontalAlignment('center');
        const todayStr = Utilities.formatDate(new Date(), "GMT+7", "'Ngày 'dd' tháng 'MM' năm 'yyyy");
        sheet.getRange(sigRow, totalCols - 1, 1, 2).merge().setValue(todayStr).setHorizontalAlignment('center').setFontStyle('italic');
        sheet.getRange(sigRow + 1, totalCols - 1, 1, 2).merge().setValue('Ban Giám hiệu').setFontWeight('bold').setHorizontalAlignment('center');

        // FR-02: set row height for school name & underline at the very end
        sheet.setRowHeight(1, 22);
        sheet.setRowHeight(2, 18);
        sheet.getRange(1, 1, 1, 3).setFontSize(10).setFontWeight('bold').setHorizontalAlignment('center');
        sheet.getRange(2, 1, 1, 3).setFontSize(10).setFontWeight('normal').setHorizontalAlignment('center');
        sheet.getRange(3, 1, 2, totalCols).setFontSize(14).setFontWeight('bold').setHorizontalAlignment('center');

        // Đồng bộ thay đổi gridline và format
        SpreadsheetApp.flush();

        return `https://docs.google.com/spreadsheets/d/${TARGET_FILE_ID}/export?format=pdf&size=A4&portrait=true&fitw=true&gridlines=false&horizontal_alignment=CENTER`;
    } catch (e) {
        Logger.log(`Error doGet_taoBangTongHopKhoanTru: ${e.message}`);
        return null;
    }
}

/**
 * Cung cấp dữ liệu JSON cho việc in ấn Bảng tổng hợp các khoản trừ trên Client
 */
function getPrintDataTongHopKhoanTru(monthStr, location) {
    try {
        // 1. Tạo bảng và tính toán các công thức trên Google Sheets
        doGet_taoBangTongHopKhoanTru(monthStr, location);

        // 2. Đọc giá trị đã tính toán từ sheet
        const ss = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.EXPORT_DKB_TH_KHOAN_TRU);
        const sheet = ss.getSheetByName('THKPCD');
        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();

        // Tiêu đề/Header bắt đầu từ dòng 5
        const data = sheet.getRange(5, 1, lastRow - 4, lastCol).getValues();

        const monthParts = monthStr.substring(1).split('.');
        const month = monthParts[0];
        const year = monthParts[1];

        // Lấy danh sách địa phương
        const resources = {
            ssMaster: SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.MASTER_DATA)
        };
        const resultRaw = doGet_tongHopKhoanTru(monthStr, resources, location);

        return {
            status: "success",
            month: month,
            year: year,
            data: data,
            locations: resultRaw ? resultRaw.locations : [],
            dateExport: `Ngày ${new Date().getDate()} tháng ${month} năm ${year}`
        };
    } catch (e) {
        return { status: "error", message: e.message };
    }
}
