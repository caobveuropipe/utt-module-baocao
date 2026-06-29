/**
 * Tổng hợp lương theo loại hợp đồng và khu vực
 * @param {string} monthStr - Kỳ lương (Tmm.yyyy)
 * @returns {Array} - Mảng 2D với 6 cột: STT, NỘI DUNG, TỔNG TIỀN, HÀ NỘI, VĨNH PHÚC, GHI CHÚ
 */


function testZ_taobangTHLuong() {
    var url = doGet_taoBangTongHopLuong("T01.2025")
    Logger.log(url)
}


function doGet_tongHopLuong(monthStr, resources, targetLocation) {
    // ====== CONFIG ======
    // ====== CONFIG ======
    // (Using GLOBAL_CONFIG from Code.js)
    // ====== CONFIG ======
    // (Using GLOBAL_CONFIG from Code.js)

    var LUONG_CO_BAN = GLOBAL_CONFIG.VALUES.LUONG_CO_BAN;

    Logger.log('Bắt đầu tổng hợp lương cho kỳ: %s', monthStr);

    // ====== LOAD DATA ======

    // 1. Dataluong1
    const values1 = getData(resources.ssLuong1, GLOBAL_CONFIG.SHEETS.DATA_LUONG_1);
    const header1 = values1[0] || [];
    const data1 = values1.slice(1);

    // (Using global getIdx from doGet_function.js)

    const idx1 = {
        KyLuong: header1.indexOf('Kỳ lương'),
        MaCB: header1.indexOf('Mã CB'),
        LoaiHD: header1.indexOf('Loại HĐ'),
        TongLuong1: header1.indexOf('Tổng lương 1'),
        HSNganh: header1.indexOf('HS ngành'),
        HSDDocHai: header1.indexOf('HS độc hại'),
        KyLuong: getIdx(header1, 'Kỳ lương'),
        MaCB: getIdx(header1, 'Mã CB'),
        HovaTen: getIdx(header1, 'Họ và tên'),
        HSL: getIdx(header1, 'HSL'),
        TongLuong: getIdx(header1, 'Tổng lương'),
        LuongGiamTru: getIdx(header1, 'Lương giảm trừ'),
        TienAnCa: getIdx(header1, 'Tiền ăn ca'),
        NgayCongHuongLuong: getIdx(header1, 'Ngày công hưởng lương'),
        PCChucVu: getIdx(header1, 'PC Chức vụ'),
        HSTrachNhiem: getIdx(header1, 'HS trách nhiệm'),
        HSTuVe: getIdx(header1, 'HS tự vệ')
    };
    Logger.log('idx1: %s', JSON.stringify(idx1));
    if (data1.length > 0) {
        Logger.log('Sample row Dataluong1: Kỳ lương=%s, Mã CB=%s, Loại HĐ=%s',
            data1[0][idx1.KyLuong], data1[0][idx1.MaCB], data1[0][idx1.LoaiHD]);
    }

    // 2. Dataluong2
    const values2 = getData(resources.ssLuong2, GLOBAL_CONFIG.SHEETS.DATA_LUONG_2);
    const header2 = values2[0] || [];
    const data2 = values2.slice(1);

    const idx2 = {
        KyLuong: getIdx(header2, 'Kỳ lương'),
        MaNS: getIdx(header2, ['Mã nhân sự', 'Mã CB', 'MaNS']),
        HoTen: getIdx(header2, ['Họ và tên', 'Họ tên']),
        NgayCongHuongLuong: getIdx(header2, 'Ngày công hưởng lương'),
        Luong2: getIdx(header2, ['Lương 2', 'Tổng lương'])
    };

    // 3. Truythuluong1
    const values3 = getData(resources.ssTruyThu1, GLOBAL_CONFIG.SHEETS.DATA_TRUY_THU);
    const header3 = values3[0] || [];
    const data3 = values3.slice(1);

    // 4. Truythuluong2
    const values4 = getData(resources.ssTruyThu2, GLOBAL_CONFIG.SHEETS.DATA_TRUY_THU);
    const header4 = values4[0] || [];
    const data4 = values4.slice(1);

    // Common Index for TruyThu
    const idx3 = {
        KyLuong: getIdx(header3, 'Kỳ trả lương'),
        MaCB: getIdx(header3, 'Mã nhân sự'),
        LoaiHopDong: getIdx(header3, 'Loại hợp đồng'),
        ConNhan: getIdx(header3, 'Còn nhận'),
        HSNganhTien: getIdx(header3, 'HS PC ngành thành tiền'),
        HSTrachNhiemTien: getIdx(header3, 'HS PC trách nhiệm thành tiền')
    };

    const idx4 = {
        KyLuong: getIdx(header4, 'Kỳ trả lương'),
        MaNS: getIdx(header4, 'Mã nhân sự'),
        HoTen: getIdx(header4, ['Họ và tên', 'Họ tên']),
        ConNhan: getIdx(header4, 'Còn nhận')
    };


    // 5. DataAnCa
    const values5 = getData(resources.ssAnCa, GLOBAL_CONFIG.SHEETS.DATA_AN_CA);
    const header5 = values5[0] || [];
    const data5 = values5.slice(1);

    const idx5 = {
        KyLuong: getIdx(header5, 'Kỳ lương'),
        MaCB: getIdx(header5, 'Mã CB'),
        AnCa: getIdx(header5, 'Ăn ca'),
        TruyLinh: getIdx(header5, 'Truy lĩnh')
    };

    // 6. DataNhanSu (Fallback location data)
    const values6 = getData(resources.ssMaster, GLOBAL_CONFIG.SHEETS.DATA_NHAN_SU);
    const data6 = values6.slice(1);

    // 7. DataChotNSThang (Primary location data)
    const values7 = getSheetNSThang().getDataRange().getValues();
    const data7 = values7.slice(1);

    // 8. TinhThue (Personal Income Tax of previous month)
    const prevMonthStr = getPrevMonthStr(monthStr);
    const thueTNCNMap = {};
    try {
        const valuesThue = getData('1Xcp4cBjKcHWt_FQULd7MrC7fhiX8ZVMzL8wXJ3aoJLw', 'TinhThue');
        if (valuesThue && valuesThue.length > 1) {
            // Cột B: Kỳ lương (index 1)
            // Cột E: Mã CB (index 4)
            // Cột AG: Thuế TNCN (index 32)
            valuesThue.slice(1).forEach(row => {
                const kyLuong = String(row[1] || '').trim();
                if (kyLuong !== prevMonthStr) return;

                const maCB = String(row[4] || '').trim();
                if (!maCB) return;

                const thueTNCN = Number(row[32]) || 0;
                thueTNCNMap[maCB] = (thueTNCNMap[maCB] || 0) + thueTNCN;
            });
            Logger.log('Đã load xong thuế TNCN từ file TinhThue cho kỳ: ' + prevMonthStr + ' - Số dòng khớp: ' + Object.keys(thueTNCNMap).length);
        }
    } catch (e) {
        Logger.log('LỖI lấy dữ liệu Thuế TNCN từ file TinhThue: ' + e.message);
    }

    // Dynamic Indexing for DataNhanSu
    const header6 = values6[0] || [];
    const idx6 = {
        MaCB: getIdx(header6, 'Mã CB') >= 0 ? getIdx(header6, 'Mã CB') : 0,
        KhuVuc: getIdx(header6, 'Khu vực')
    };
    if (idx6.KhuVuc < 0) idx6.KhuVuc = 38; // Fallback if not found

    const locationNormalized = targetLocation && targetLocation !== 'All' ? normalizeLocation(targetLocation) : null;

    // ====== CREATE EMPLOYEE MAP ======
    const empMap = {};  // {maCB: {khuVuc, loaiHD, ...amounts}}

    // Get location for each employee from DataNhanSu (fallback)
    data6.forEach(row => {
        const maCB = String(row[idx6.MaCB] || '').trim();
        const kvRaw = row[idx6.KhuVuc];
        const khuVuc = normalizeLocation(kvRaw);
        // Lọc theo khu vực nếu có yêu cầu
        if (locationNormalized && khuVuc !== locationNormalized) return;
        if (maCB) {
            empMap[maCB] = { khuVuc: khuVuc, trangThai: '', amounts: {} };
        }
    });

    // Override location from DataChotNSThang (primary for current month)
    if (values7.length > 0) {
        const header7 = values7[0];
        const idxKy = getIdx(header7, 'Kỳ lương');
        const idxMa = getIdx(header7, 'Mã nhân sự');
        const idxKV = 38; // Column AM as confirmed by user
        const idxTrangThai = getIdx(header7, ['Trạng thái', 'Status', 'TrangThai']);

        data7.forEach(row => {
            const ky = String(row[idxKy]).trim();
            if (ky === monthStr) {
                const ma = String(row[idxMa]).trim();
                const kv = normalizeLocation(row[idxKV]);
                const trangThai = idxTrangThai !== -1 ? String(row[idxTrangThai]).trim() : '';
                // Lọc theo khu vực nếu có yêu cầu (Ghi đè - Ưu tiên data chốt tháng)
                if (locationNormalized && kv !== locationNormalized) {
                    if (empMap[ma]) delete empMap[ma];
                    return;
                }
                if (ma) {
                    if (!empMap[ma]) empMap[ma] = { khuVuc: kv, trangThai: trangThai, amounts: {} };
                    else {
                        empMap[ma].khuVuc = kv;
                        empMap[ma].trangThai = trangThai;
                    }
                }
            }
        });
    }

    Logger.log('Loaded %s employees with finalized locations', Object.keys(empMap).length);

    // Log sample employee
    var sampleKeys = Object.keys(empMap).slice(0, 3);
    sampleKeys.forEach(key => {
        Logger.log('Sample employee: %s -> Khu vực: %s', key, empMap[key].khuVuc);
    });

    // ====== AGGREGATE DATA ======

    // Helper function to ensure employee exists
    const ensureEmp = (maCB) => {
        if (!empMap[maCB]) {
            if (locationNormalized) return null;
            empMap[maCB] = { khuVuc: '', amounts: {} };
        }
        return empMap[maCB];
    };

    // 1. Process Dataluong1
    var countL1 = 0;
    data1.forEach(row => {
        if (String(row[idx1.KyLuong]) !== monthStr) return;

        const maCB = String(row[idx1.MaCB] || '').trim();
        if (!maCB) return;

        countL1++;
        const emp = ensureEmp(maCB);
        if (!emp) return;
        if (!emp.hoTen) emp.hoTen = String(row[idx1.HovaTen] || '').trim();
        emp.loaiHD = String(row[idx1.LoaiHD] || '').trim();
        emp.amounts.tongLuong1 = (emp.amounts.tongLuong1 || 0) + (Number(row[idx1.TongLuong1]) || 0);
        emp.amounts.hsNganh = (emp.amounts.hsNganh || 0) + (Number(row[idx1.HSNganh]) || 0);
        emp.amounts.hsDDocHai = (emp.amounts.hsDDocHai || 0) + (Number(row[idx1.HSDDocHai]) || 0);
        emp.amounts.hsTrachNhiem = (emp.amounts.hsTrachNhiem || 0) + (Number(row[idx1.HSTrachNhiem]) || 0);
        emp.amounts.hsTuVe = (emp.amounts.hsTuVe || 0) + (Number(row[idx1.HSTuVe]) || 0);
    });
    Logger.log('Dataluong1: %s employees matched monthStr', countL1);

    // 2. Process Truythuluong1
    var countTT1 = 0;
    data3.forEach(row => {
        if (String(row[idx3.KyLuong]) !== monthStr) return;

        const maCB = String(row[idx3.MaCB] || '').trim();
        if (!maCB) return;

        countTT1++;
        const emp = ensureEmp(maCB);
        if (!emp) return;
        if (!emp.loaiHD) {
            emp.loaiHD = String(row[idx3.LoaiHopDong] || '').trim();
        }
        emp.amounts.truyThuL1 = (emp.amounts.truyThuL1 || 0) + (Number(row[idx3.ConNhan]) || 0);
        emp.amounts.hsNganhTien = (emp.amounts.hsNganhTien || 0) + (Number(row[idx3.HSNganhTien]) || 0);
        emp.amounts.hsTrachNhiemTien = (emp.amounts.hsTrachNhiemTien || 0) + (Number(row[idx3.HSTrachNhiemTien]) || 0);
    });
    Logger.log('Truythuluong1: %s employees matched monthStr', countTT1);

    // 3. Process Dataluong2
    var countL2 = 0;
    data2.forEach(row => {
        if (String(row[idx2.KyLuong]) !== monthStr) return;

        const maNS = String(row[idx2.MaNS] || '').trim();
        if (!maNS) return;

        countL2++;
        const emp = ensureEmp(maNS);
        if (!emp) return;
        if (!emp.hoTen) emp.hoTen = String(row[idx2.HoTen] || '').trim();
        emp.amounts.luong2 = (emp.amounts.luong2 || 0) + (Number(row[idx2.Luong2]) || 0);
    });
    Logger.log('Dataluong2: %s employees matched monthStr', countL2);

    // 4. Process Truythuluong2
    var countTT2 = 0;
    data4.forEach(row => {
        if (String(row[idx4.KyLuong]) !== monthStr) return;

        const maNS = String(row[idx4.MaNS] || '').trim();
        if (!maNS) return;

        countTT2++;
        const emp = ensureEmp(maNS);
        if (!emp) return;
        if (!emp.hoTen) emp.hoTen = String(row[idx4.HoTen] || '').trim();
        const conNhan = Number(row[idx4.ConNhan]) || 0;
        emp.amounts.truyThuL2 = (emp.amounts.truyThuL2 || 0) + conNhan;
    });
    Logger.log('Truythuluong2: %s employees matched monthStr', countTT2);

    // 5. Process DataAnCa
    var countAC = 0;
    data5.forEach(row => {
        if (String(row[idx5.KyLuong]) !== monthStr) return;

        const maCB = String(row[idx5.MaCB] || '').trim();
        if (!maCB) return;

        countAC++;
        const emp = ensureEmp(maCB);
        if (!emp) return;
        emp.amounts.anCa = (emp.amounts.anCa || 0) + (Number(row[idx5.AnCa]) || 0);
        emp.amounts.anCaTruyLinh = (emp.amounts.anCaTruyLinh || 0) + (Number(row[idx5.TruyLinh]) || 0);
    });

    Logger.log('DataAnCa: %s employees matched monthStr', countAC);

    // Assign thueTNCN to each employee
    Object.keys(empMap).forEach(maCB => {
        const emp = empMap[maCB];
        emp.amounts.thueTNCN = thueTNCNMap[maCB] || 0;
    });

    Logger.log('Total employees in empMap: %s', Object.keys(empMap).length);

    // Log sample aggregated data
    var samplesWithData = Object.keys(empMap).filter(key => empMap[key].amounts.tongLuong1 > 0).slice(0, 2);
    samplesWithData.forEach(key => {
        var emp = empMap[key];
        Logger.log('Sample with data: %s -> Loại HĐ: %s, Khu vực: %s, Tổng L1: %s',
            key, emp.loaiHD, emp.khuVuc, emp.amounts.tongLuong1);
    });

    // ====== AGGREGATE DATA ======
    const ALL_LOCATIONS = new Set();
    const totals = {};

    const initMetric = () => ({
        tong: 0,
        pcGiaoVien: 0,
        pcDocHai: 0,
        pcTrachNhiem: 0,
        pcTuVe: 0,
        luongCoBan: 0,
        tntt: 0,
        truyLinhTNTT: 0,
        truyThuTNTT: 0,
        anCa: 0,
        truyLinhAnCa: 0,
        truyThuAnCa: 0,
        thueTNCN: 0
    });

    const ensureType = (type) => {
        if (!totals[type]) {
            totals[type] = { total: initMetric(), locs: {} };
        }
    };

    // Aggregate by employee
    const suspendedList = [];
    Object.keys(empMap).forEach(maCB => {
        const emp = empMap[maCB];
        const loaiHD = emp.loaiHD || '';
        const kv = emp.khuVuc || 'Khác';
        if (locationNormalized && kv !== locationNormalized) return;

        const trangThai = emp.trangThai || '';
        const isTreoLuong = (kv === 'Phú Thọ' && (trangThai === 'Đi NN' || trangThai === 'Đi công tác NN'));
        const amt = emp.amounts;

        // Map loại HĐ
        let contractType = null;
        if (loaiHD === 'Biên chế') contractType = 'Biên chế';
        else if (loaiHD === 'HĐ 68') contractType = 'HĐ 68';
        else if (loaiHD === 'HĐ dài hạn') contractType = 'HĐ dài hạn';
        else if (loaiHD === 'HĐ vụ việc') contractType = 'HĐ vụ việc';

        if (isTreoLuong) {
            const tongL1 = (amt.tongLuong1 || 0) + (amt.truyThuL1 || 0);
            const luong2_net = (amt.luong2 || 0) + (amt.truyThuL2 || 0);
            const anCa_net = (amt.anCa || 0) + (amt.anCaTruyLinh || 0);
            const thueTNCN = amt.thueTNCN || 0;
            const netAmount = - (tongL1 + luong2_net + anCa_net - thueTNCN);

            if (contractType) {
                suspendedList.push({
                    maCB: maCB,
                    hoTen: emp.hoTen || 'Không rõ',
                    contractType: contractType,
                    kv: kv,
                    netAmount: netAmount
                });
            }
            ALL_LOCATIONS.add(kv);
            // Do NOT return here so they are still aggregated into standard sub-rows (e.g. 3.1)
        }

        ALL_LOCATIONS.add(kv);

        const typesToUpdate = [];
        if (contractType) typesToUpdate.push(contractType);
        typesToUpdate.push('TNTT', 'AnCa', 'ThueTNCN');

        typesToUpdate.forEach(t => {
            ensureType(t);
            if (!totals[t].locs[kv]) totals[t].locs[kv] = initMetric();

            const targetLoc = totals[t].locs[kv];
            const targetTotal = totals[t].total;

            if (t === contractType) {
                const tongL1 = (amt.tongLuong1 || 0) + (amt.truyThuL1 || 0);
                const pcGV = (amt.hsNganh || 0) * LUONG_CO_BAN + (amt.hsNganhTien || 0);
                const pcDH = (amt.hsDDocHai || 0) * LUONG_CO_BAN;
                const pcTN = (amt.hsTrachNhiem || 0) * LUONG_CO_BAN + (amt.hsTrachNhiemTien || 0);
                const pcTV = (amt.hsTuVe || 0) * LUONG_CO_BAN;

                [targetLoc, targetTotal].forEach(o => {
                    o.tong += tongL1;
                    o.pcGiaoVien += pcGV;
                    o.pcDocHai += pcDH;
                    o.pcTrachNhiem += pcTN;
                    o.pcTuVe += pcTV;
                });
            } else if (t === 'TNTT') {
                const val = amt.luong2 || 0;
                const tLinh = (amt.truyThuL2 || 0) > 0 ? amt.truyThuL2 : 0;
                const tThu = (amt.truyThuL2 || 0) < 0 ? Math.abs(amt.truyThuL2) : 0;
                [targetLoc, targetTotal].forEach(o => {
                    o.tntt += val;
                    o.truyLinhTNTT += tLinh;
                    o.truyThuTNTT += tThu;
                });
            } else if (t === 'AnCa') {
                const val = amt.anCa || 0;
                const tLinh = (amt.anCaTruyLinh || 0) > 0 ? amt.anCaTruyLinh : 0;
                const tThu = (amt.anCaTruyLinh || 0) < 0 ? Math.abs(amt.anCaTruyLinh) : 0;
                [targetLoc, targetTotal].forEach(o => {
                    o.anCa += val;
                    o.truyLinhAnCa += tLinh;
                    o.truyThuAnCa += tThu;
                });
            } else if (t === 'ThueTNCN') {
                const val = amt.thueTNCN || 0;
                [targetLoc, targetTotal].forEach(o => {
                    o.thueTNCN += val;
                });
            }
        });
    });

    // Filter out 'Khác' if it has no data
    const finalLocs = locationNormalized ? [locationNormalized] : Array.from(ALL_LOCATIONS).filter(kv => {
        if (kv !== 'Khác') return true;
        // Check if 'Khác' has any non-zero value in any type
        return Object.keys(totals).some(type => {
            const m = totals[type].locs[kv];
            if (!m) return false;
            return Object.values(m).some(v => v !== 0);
        });
    });

    // Sort locations: Hà Nội first, then Phú Thọ, then others
    const sortedLocs = finalLocs.sort((a, b) => {
        if (a === 'Hà Nội') return -1;
        if (b === 'Hà Nội') return 1;
        if (a === 'Phú Thọ') return -1;
        if (b === 'Phú Thọ') return 1;
        return a.localeCompare(b);
    });

    // ====== BUILD OUTPUT ARRAY ======
    const output = [];

    // Helper for adding rows to output
    const addRow = (stt, label, type, field, customData) => {
        const row = [stt, label];
        let totalVal = 0;
        if (customData) totalVal = customData.total;
        else if (totals[type]) totalVal = totals[type].total[field];
        row.push(totalVal);

        sortedLocs.forEach(loc => {
            let val = 0;
            if (customData) {
                val = customData.locs[loc] || 0;
            } else if (totals[type] && totals[type].locs[loc]) {
                val = totals[type].locs[loc][field];
            }
            row.push(val);
        });

        row.push(''); // Ghi chú
        output.push(row);
    };

    // Helper for complex rows (addition/subtraction of fields)
    const getComplexRowData = (type, fieldsAdd, fieldsSub) => {
        const res = { total: 0, locs: {} };
        const t = totals[type];
        if (!t) return res;

        fieldsAdd.forEach(f => res.total += t.total[f]);
        fieldsSub.forEach(f => res.total -= t.total[f]);

        sortedLocs.forEach(loc => {
            res.locs[loc] = 0;
            if (t.locs[loc]) {
                fieldsAdd.forEach(f => res.locs[loc] += t.locs[loc][f]);
                fieldsSub.forEach(f => res.locs[loc] -= t.locs[loc][f]);
            }
        });
        return res;
    };

    // First, calculate the data for 1.1, 2.1, 3.1 using unmodified totals
    const row1_1_data = getComplexRowData('Biên chế', ['tong'], ['pcGiaoVien', 'pcDocHai', 'pcTrachNhiem', 'pcTuVe']);
    const row2_1_data = getComplexRowData('HĐ 68', ['tong'], ['pcTrachNhiem']);
    const row3_1_data = getComplexRowData('HĐ dài hạn', ['tong'], ['pcGiaoVien', 'pcTrachNhiem']);

    // Adjust totals by subtracting the suspended amounts (which are negative)
    const suspendedTotals = {};
    suspendedList.forEach(emp => {
        suspendedTotals[emp.contractType] = (suspendedTotals[emp.contractType] || 0) + emp.netAmount;
    });

    ['Biên chế', 'HĐ 68', 'HĐ dài hạn', 'HĐ vụ việc'].forEach(type => {
        const subTotal = suspendedTotals[type] || 0;
        if (subTotal !== 0 && totals[type]) {
            totals[type].total.tong += subTotal; // subTotal is negative
            
            sortedLocs.forEach(loc => {
                const locSub = suspendedList
                    .filter(emp => emp.contractType === type && emp.kv === loc)
                    .reduce((sum, emp) => sum + emp.netAmount, 0); // negative
                if (totals[type].locs[loc]) {
                    totals[type].locs[loc].tong += locSub;
                }
            });
        }
    });

    // Aggregated Sections (calculated using adjusted totals)
    const I_data = { total: 0, locs: {} };
    ['Biên chế', 'HĐ 68', 'HĐ dài hạn', 'HĐ vụ việc'].forEach(t => {
        if (totals[t]) {
            I_data.total += totals[t].total.tong;
            sortedLocs.forEach(loc => {
                I_data.locs[loc] = (I_data.locs[loc] || 0) + (totals[t].locs[loc] ? totals[t].locs[loc].tong : 0);
            });
        }
    });

    // Helper to add suspended rows
    const addSuspendedRows = (type, startSubNumber) => {
        const filtered = suspendedList.filter(emp => emp.contractType === type);
        filtered.forEach((emp, index) => {
            const subNum = startSubNumber + index;
            let catNum = '';
            if (type === 'Biên chế') catNum = '1';
            else if (type === 'HĐ 68') catNum = '2';
            else if (type === 'HĐ dài hạn') catNum = '3';
            else if (type === 'HĐ vụ việc') catNum = '4';

            const stt = `${catNum}.${subNum}`;
            const label = `Treo lương : ${emp.hoTen}`;

            const customData = { total: emp.netAmount, locs: {} };
            sortedLocs.forEach(loc => {
                customData.locs[loc] = (emp.kv === loc) ? emp.netAmount : 0;
            });

            addRow(stt, label, null, null, customData);
        });
    };

    addRow('I.', 'TIỀN LƯƠNG: (1+2+3+4)', null, null, I_data);
    addRow('1.', 'Diện biên chế', 'Biên chế', 'tong');
    addRow('1.1', 'Lương điện biên chế + Truy lĩnh, truy thu lương biên chế', null, null, row1_1_data);
    addRow('1.2', 'Phụ cấp giáo viên', 'Biên chế', 'pcGiaoVien');
    addRow('1.3', 'Phụ cấp độc hại', 'Biên chế', 'pcDocHai');
    addRow('1.4', 'Phụ cấp trách nhiệm', 'Biên chế', 'pcTrachNhiem');
    addRow('1.5', 'Phụ cấp tự vệ', 'Biên chế', 'pcTuVe');
    addSuspendedRows('Biên chế', 6);

    addRow('2.', 'Diện hợp đồng 68', 'HĐ 68', 'tong');
    addRow('2.1', 'Lương điện hợp đồng 68 + Truy lĩnh, truy thu', null, null, row2_1_data);
    addRow('2.2', 'Phụ cấp trách nhiệm', 'HĐ 68', 'pcTrachNhiem');
    addSuspendedRows('HĐ 68', 3);

    addRow('3.', 'Diện hợp đồng lao động thường xuyên', 'HĐ dài hạn', 'tong');
    addRow('3.1', 'Lương diện hợp đồng LĐTX + Truy lĩnh, truy thu diện HĐ LĐTX', null, null, row3_1_data);
    addRow('3.2', 'Phụ cấp giáo viên', 'HĐ dài hạn', 'pcGiaoVien');
    addRow('3.3', 'Phụ cấp trách nhiệm', 'HĐ dài hạn', 'pcTrachNhiem');
    addSuspendedRows('HĐ dài hạn', 4);

    addRow('4.', 'Diện hợp đồng lao động theo vụ việc', 'HĐ vụ việc', 'tong');
    addSuspendedRows('HĐ vụ việc', 1);

    const II_data = getComplexRowData('TNTT', ['tntt', 'truyLinhTNTT'], ['truyThuTNTT']);
    addRow('II.', 'THU NHẬP TĂNG THÊM', null, null, II_data);
    addRow('1.', 'Thu nhập tăng thêm', 'TNTT', 'tntt');
    addRow('2.', 'Truy lĩnh', 'TNTT', 'truyLinhTNTT');
    addRow('3.', 'Truy thu TNTT làm ngoài', 'TNTT', 'truyThuTNTT');

    const III_data = getComplexRowData('AnCa', ['anCa', 'truyLinhAnCa'], ['truyThuAnCa']);
    addRow('III.', 'TIỀN ĂN CA', null, null, III_data);
    addRow('1.', 'Tiền ăn ca', 'AnCa', 'anCa');
    addRow('2.', 'Truy lĩnh', 'AnCa', 'truyLinhAnCa');
    addRow('3.', 'Truy thu tiền ăn ca làm ngoài', 'AnCa', 'truyThuAnCa');

    // IV. THU THUẾ TNCN THÁNG ...
    const prevMonthParts = prevMonthStr.substring(1).split('.');
    const prevMonth = parseInt(prevMonthParts[0], 10);
    const prevYear = prevMonthParts[1];
    const prevMonthFormatted = String(prevMonth).padStart(2, '0');
    const thueLabel = `THU THUẾ TNCN THÁNG ${prevMonthFormatted}/${prevYear}`;

    const IV_data = getComplexRowData('ThueTNCN', ['thueTNCN'], []);
    addRow('IV.', thueLabel, 'ThueTNCN', 'thueTNCN');

    const grand = { total: I_data.total + II_data.total + III_data.total - IV_data.total, locs: {} };
    sortedLocs.forEach(loc => {
        grand.locs[loc] = (I_data.locs[loc] || 0) + (II_data.locs[loc] || 0) + (III_data.locs[loc] || 0) - (IV_data.locs[loc] || 0);
    });
    addRow('', 'Cộng: ( I + II + III - IV )', null, null, grand);

    const debugLuong2 = Object.keys(empMap).map(maCB => {
        const emp = empMap[maCB];
        const amt = emp.amounts || {};
        const luong2 = amt.luong2 || 0;
        const truyLinh = (amt.truyThuL2 || 0) > 0 ? amt.truyThuL2 : 0;
        const truyThu = (amt.truyThuL2 || 0) < 0 ? Math.abs(amt.truyThuL2) : 0;
        const thuNhapTinh = luong2 + truyLinh - truyThu;

        return [
            monthStr,
            emp.khuVuc || '',
            maCB,
            emp.hoTen || '',
            emp.loaiHD || '',
            luong2,
            truyLinh,
            truyThu,
            thuNhapTinh
        ];
    }).filter(row => row[5] !== 0 || row[6] !== 0 || row[7] !== 0 || row[8] !== 0)
        .sort((a, b) => String(a[1]).localeCompare(String(b[1])) || String(a[2]).localeCompare(String(b[2])));

    return { data: output, locations: sortedLocs, debugLuong2 };
}

/**
 * Test function for doGet_tongHopLuong
 */
/**
 * Test function for doGet_tongHopLuong
 */
function doGet_taoBangTongHopLuong(monthStr, targetLocation) {
    const TARGET_FILE_ID = GLOBAL_CONFIG.FILES.EXPORT_DKB_TH_LUONG;
    const TARGET_SHEET_NAME = GLOBAL_CONFIG.SHEETS.SHEET_TH_LUONG;
    const ssMaster = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.MASTER_DATA);
    const resources = {
        ssMaster,
        ssLuong1: SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.DATA_LUONG_1),
        ssLuong2: SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.DATA_LUONG_2),
        ssTruyThu1: SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.TRUY_THU_LUONG_1),
        ssTruyThu2: SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.TRUY_THU_LUONG_2),
        ssAnCa: SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.DATA_AN_CA)
    };

    try {
        const result = doGet_tongHopLuong(monthStr, resources, targetLocation);
        if (!result || !result.data.length) return null;

        const { data, locations } = result;
        const numLocs = locations.length;
        const totalCols = 3 + numLocs + 1; // STT, Nội dung, Tổng, [Locs], Ghi chú

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
            sheet.setFrozenRows(0);
            sheet.setFrozenColumns(0);
        }

        const maxColsForPrint = sheet.getMaxColumns();
        sheet.showColumns(1, maxColsForPrint);
        if (maxColsForPrint > totalCols) {
            sheet.hideColumns(totalCols + 1, maxColsForPrint - totalCols);
        }

        const monthParts = monthStr.substring(1).split('.');
        const month = parseInt(monthParts[0]);
        const year = monthParts[1];

        sheet.getRange("A1").setValue("TRƯỜNG ĐẠI HỌC CÔNG NGHỆ GTVT").setFontWeight('bold').setFontSize(11);
        const title = `BẢNG TỔNG HỢP LƯƠNG, THU NHẬP TĂNG THÊM VÀ TIỀN ĂN CA \nTHÁNG ${month} NĂM ${year}`;
        sheet.getRange(3, 1, 2, totalCols).merge().setValue(title).setHorizontalAlignment("center").setVerticalAlignment("middle").setFontWeight('bold').setFontSize(14).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);

        const h1 = ['STT', 'NỘI DUNG', 'TỔNG TIỀN', 'Trong đó', ...new Array(numLocs - 1).fill(''), 'GHI CHÚ'];
        const h2 = ['', '', '', ...locations.map(l => l.toUpperCase()), ''];
        sheet.getRange(6, 1, 2, totalCols).setValues([h1, h2]).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle').setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.SOLID);

        sheet.getRange(6, 1, 2, 1).merge();
        sheet.getRange(6, 2, 2, 1).merge();
        sheet.getRange(6, 3, 2, 1).merge();
        sheet.getRange(6, 4, 1, numLocs).merge();
        sheet.getRange(6, totalCols, 2, 1).merge();

        sheet.getRange(8, 1, data.length, totalCols).setValues(data);

        // Styling
        const lastRow = 7 + data.length;
        sheet.getRange(1, 1, lastRow + 10, totalCols).setFontFamily('Times New Roman').setFontSize(12);
        sheet.getRange(8, 1, data.length, totalCols)
            .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP)
            .setVerticalAlignment('middle');
        sheet.getRange(8, 3, data.length, numLocs + 1).setNumberFormat('#,##0');
        sheet.getRange(8, 1, data.length, 1).setHorizontalAlignment('center');

        data.forEach((row, i) => {
            const rIdx = 8 + i;
            const stt = String(row[0]).trim();
            const content = String(row[1]);

            // Điều kiện bold:
            // 1. STT là số La Mã (I., II.)
            // 2. STT là số nguyên kèm dấu chấm (1., 2.) -> Không phải số phụ như 1.1, 2.1
            // 3. Dòng Cộng (không STT hoặc content chứa 'Cộng')
            const isRoman = /^[IVX]+\.$/.test(stt);
            const isMainNum = /^\d+\.$/.test(stt);
            const isTotal = !stt || content.includes('Cộng');

            if (isRoman || isMainNum || isTotal) {
                sheet.getRange(rIdx, 1, 1, totalCols).setFontWeight('bold');
            } else {
                sheet.getRange(rIdx, 1, 1, totalCols).setFontWeight('normal');
            }

            if (isTotal) {
                sheet.getRange(rIdx, 1, 1, totalCols).setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.SOLID);
            }
        });

        // Set column widths
        sheet.setColumnWidth(1, 40);
        sheet.setColumnWidth(2, 300);
        sheet.setColumnWidth(3, 110);
        for (let j = 0; j < numLocs; j++) {
            sheet.setColumnWidth(4 + j, 110);
        }
        sheet.setColumnWidth(totalCols, 100);

        // Border body
        sheet.getRange(8, 1, data.length, totalCols).setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.THIN);

        // Signature
        const sigRow = lastRow + 2;
        let masterSheet = ssMaster.getSheetByName(GLOBAL_CONFIG.SHEETS.MASTER);

        // Dòng ngày tháng
        const todayStr = Utilities.formatDate(new Date(), "GMT+7", "'Ngày 'dd' tháng 'MM' năm 'yyyy");
        sheet.getRange(sigRow, totalCols - 1, 1, 2).merge().setValue(todayStr).setHorizontalAlignment('center').setFontStyle('italic');

        if (masterSheet) {
            const srcNames = masterSheet.getRange("A1:F1").getValues()[0];
            const srcLabels = masterSheet.getRange("A2:F2").getValues()[0];

            // Các chức danh (Row 1)
            sheet.getRange(sigRow + 1, 1, 1, 2).merge().setValue(srcNames[0]).setFontWeight('bold').setHorizontalAlignment('center');
            sheet.getRange(sigRow + 1, 3, 1, numLocs > 1 ? 2 : 1).merge().setValue(srcNames[2]).setFontWeight('bold').setHorizontalAlignment('center');
            sheet.getRange(sigRow + 1, totalCols - 1, 1, 2).merge().setValue(srcNames[4]).setFontWeight('bold').setHorizontalAlignment('center');

            // Các nhãn (Ký ghi rõ họ tên - Row 2)
            sheet.getRange(sigRow + 2, 1, 1, 2).merge().setValue(srcLabels[0]).setHorizontalAlignment('center');
            sheet.getRange(sigRow + 2, 3, 1, numLocs > 1 ? 2 : 1).merge().setValue(srcLabels[2]).setHorizontalAlignment('center');
            sheet.getRange(sigRow + 2, totalCols - 1, 1, 2).merge().setValue(srcLabels[4]).setHorizontalAlignment('center');
        } else {
            // Fallback manual signatures if Master sheet is missing
            sheet.getRange(sigRow + 1, 1, 1, 2).merge().setValue('Người lập bảng').setFontWeight('bold').setHorizontalAlignment('center');
            sheet.getRange(sigRow + 1, 3, 1, numLocs > 1 ? 2 : 1).merge().setValue('Kế toán trưởng').setFontWeight('bold').setHorizontalAlignment('center');
            sheet.getRange(sigRow + 1, totalCols - 1, 1, 2).merge().setValue('Ban Giám hiệu').setFontWeight('bold').setHorizontalAlignment('center');

            sheet.getRange(sigRow + 2, 1, 1, 2).merge().setValue('(Ký, ghi rõ họ tên)').setHorizontalAlignment('center');
            sheet.getRange(sigRow + 2, 3, 1, numLocs > 1 ? 2 : 1).merge().setValue('(Ký, ghi rõ họ tên)').setHorizontalAlignment('center');
            sheet.getRange(sigRow + 2, totalCols - 1, 1, 2).merge().setValue('(Ký, ghi rõ họ tên)').setHorizontalAlignment('center');
        }

        // DEBUG_Luong2 is kept for short-term diagnostics; do not run in normal report flow.
        // writeDebugLuong2Sheet_(ss, monthStr, targetLocation, debugLuong2 || []);

        return `https://docs.google.com/spreadsheets/d/${TARGET_FILE_ID}/export?format=pdf&size=A4&portrait=true&fitw=true&gridlines=false&horizontal_alignment=CENTER`;
    } catch (e) {
        Logger.log('Error doGet_taoBangTongHopLuong: ' + e.message);
        throw e;
    }
}

function writeDebugLuong2Sheet_(ss, monthStr, targetLocation, rows) {
    const sheetName = 'DEBUG_Luong2';
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) sheet = ss.insertSheet(sheetName);
    else {
        sheet.clear();
        if (sheet.getFilter()) sheet.getFilter().remove();
    }

    const locationLabel = targetLocation && targetLocation !== 'All' ? targetLocation : 'Tất cả';
    const headers = [
        'Kỳ lương',
        'Khu vực',
        'Mã CB',
        'Họ và tên',
        'Loại HĐ',
        'Lương 2',
        'Truy lĩnh L2',
        'Truy thu L2',
        'Thu nhập được tính'
    ];

    sheet.getRange(1, 1).setValue('DEBUG LƯƠNG 2 / THU NHẬP TĂNG THÊM').setFontWeight('bold');
    sheet.getRange(2, 1).setValue('Kỳ lương');
    sheet.getRange(2, 2).setValue(monthStr);
    sheet.getRange(3, 1).setValue('Khu vực lọc');
    sheet.getRange(3, 2).setValue(locationLabel);
    sheet.getRange(4, 1).setValue('Ghi chú');
    sheet.getRange(4, 2).setValue('Dữ liệu này được sinh từ cùng empMap dùng để tạo dòng II. THU NHẬP TĂNG THÊM trên Bảng tổng hợp lương.');

    sheet.getRange(6, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setHorizontalAlignment('center');
    if (rows.length > 0) {
        sheet.getRange(7, 1, rows.length, headers.length).setValues(rows);
        sheet.getRange(7, 6, rows.length, 4).setNumberFormat('#,##0');
    }

    const totalRow = rows.length + 7;
    sheet.getRange(totalRow, 1).setValue('TỔNG').setFontWeight('bold');
    if (rows.length > 0) {
        sheet.getRange(totalRow, 6).setFormula(`=SUM(F7:F${totalRow - 1})`);
        sheet.getRange(totalRow, 7).setFormula(`=SUM(G7:G${totalRow - 1})`);
        sheet.getRange(totalRow, 8).setFormula(`=SUM(H7:H${totalRow - 1})`);
        sheet.getRange(totalRow, 9).setFormula(`=SUM(I7:I${totalRow - 1})`);
    } else {
        sheet.getRange(totalRow, 6, 1, 4).setValues([[0, 0, 0, 0]]);
    }
    sheet.getRange(totalRow, 1, 1, headers.length).setFontWeight('bold').setBorder(true, false, false, false, false, false);

    sheet.setFrozenRows(6);
    sheet.autoResizeColumns(1, headers.length);
}

/**
 * Cung cấp dữ liệu JSON cho việc in ấn Bảng tổng hợp lương trên Client
 */
function getPrintDataTongHopLuong(monthStr, location) {
    try {
        const ssMaster = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.MASTER_DATA);
        const resources = {
            ssMaster,
            ssLuong1: SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.DATA_LUONG_1),
            ssLuong2: SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.DATA_LUONG_2),
            ssTruyThu1: SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.TRUY_THU_LUONG_1),
            ssTruyThu2: SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.TRUY_THU_LUONG_2),
            ssAnCa: SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.DATA_AN_CA)
        };

        const result = doGet_tongHopLuong(monthStr, resources, location);
        if (!result || !result.data.length) throw new Error("Không có dữ liệu cho kỳ này");

        const monthParts = monthStr.substring(1).split('.');
        const month = monthParts[0];
        const year = monthParts[1];

        return {
            status: "success",
            month: month,
            year: year,
            data: result.data,
            locations: result.locations,
            dateExport: `Ngày ${new Date().getDate()} tháng ${month} năm ${year}`
        };
    } catch (e) {
        return { status: "error", message: e.message };
    }
}

/**
 * Lấy Kỳ lương tháng trước của một kỳ lương cho trước (Tmm.yyyy)
 */
function getPrevMonthStr(monthStr) {
    const match = monthStr.match(/^T(\d+)\.(\d+)$/);
    if (!match) return "";
    let m = parseInt(match[1], 10);
    let y = parseInt(match[2], 10);
    m--;
    if (m === 0) {
        m = 12;
        y--;
    }
    return "T" + String(m).padStart(2, '0') + "." + y;
}
