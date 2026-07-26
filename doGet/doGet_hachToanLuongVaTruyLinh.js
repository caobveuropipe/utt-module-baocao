function test_doGet_taoBangHachToanLuongVaTruyLinh() {
    const monthStr = 'T01.2025';
    const result = doGet_taoBangHachToanLuongVaTruyLinh(monthStr);
    console.log(result);
}

/**
 * Hàm TEST chi tiết từng thành phần tạo nên BẢNG KÊ HẠCH TOÁN LƯƠNG VÀ TRUY LĨNH LƯƠNG
 * Mặc định: Tháng T06.2026, Địa phương: Hà Nội
 * Ghi chi tiết dữ liệu bóc tách ra Sheet "Audit_HachToanLuong" trong file EXPORT_HT_TH_LUONG_VA_TTTL
 */
function test_chiTietThanhPhanHachToanLuong(monthStr = 'T06.2026', location = 'Hà Nội') {
    Logger.log(`=================== BẮT ĐẦU AUDIT HẠCH TOÁN LƯƠNG CHI TIẾT ĐƠN VỊ [${monthStr} - ${location}] ===================`);
    
    const EXPORT_FILE_ID = GLOBAL_CONFIG.FILES.EXPORT_HT_TH_LUONG_VA_TTTL;
    const AUDIT_SHEET_NAME = 'Audit_HachToanLuong';

    try {
        // 1. Đọc Dữ Liệu Đầu Vào
        const setupData = getData(GLOBAL_CONFIG.FILES.MASTER_DATA, 'Setup');
        const dataLuong1 = getData(GLOBAL_CONFIG.FILES.DATA_LUONG_1, GLOBAL_CONFIG.SHEETS.DATA_LUONG_1);
        const dataLuong2 = getData(GLOBAL_CONFIG.FILES.DATA_LUONG_2, GLOBAL_CONFIG.SHEETS.DATA_LUONG_2);
        const truyThu1 = getData(GLOBAL_CONFIG.FILES.TRUY_THU_LUONG_1, GLOBAL_CONFIG.SHEETS.DATA_TRUY_THU);
        const truyThu2 = getData(GLOBAL_CONFIG.FILES.TRUY_THU_LUONG_2, 'DataTruyThuLinh');
        const dataAnCa = getData(GLOBAL_CONFIG.FILES.DATA_AN_CA, GLOBAL_CONFIG.SHEETS.DATA_AN_CA);
        const dataNS = getData(GLOBAL_CONFIG.FILES.DB_DATA_CHOT_NS, GLOBAL_CONFIG.SHEETS.DATA_CHOT_NS);

        const LCB = 2340000;
        const targetMonth = String(monthStr).trim().replace(/^T/, '');
        const locationNormalized = location && location !== 'All' ? normalizeLocation(location) : null;

        // Map Setup
        const unitToType = {};
        const unitToName = {};
        const setupHeader = setupData[0] || [];
        const setupIdx = {
            MaBP: getIdx(setupHeader, ['Mã đơn vị', 'Mã bộ phận', 'MaBP']),
            TenBP: getIdx(setupHeader, ['Tên đơn vị', 'Tên bộ phận', 'TenBP', 'Đơn vị', 'Bộ phận']),
            Nhom: getIdx(setupHeader, ['Loại chi phí', 'LoaiChiPhi', 'Nhóm', 'Phân nhóm', 'Nhom'])
        };
        setupData.forEach((row, i) => {
            if (i === 0) return;
            const code = String(row[setupIdx.MaBP] || '').trim();
            const name = String(row[setupIdx.TenBP] || code).trim();
            const type = String(row[setupIdx.Nhom] || '').trim();
            if (code) {
                unitToType[code] = type;
                unitToName[code] = name;
            }
        });

        // Map Personnel
        const personnel = {};
        const allPersonnelRecords = {};
        const nsHeader = dataNS[0] || [];
        const nsIdx = {
            Ky: getIdx(nsHeader, ['Kỳ lương', 'Kỳ', 'Ky']),
            Ma: getIdx(nsHeader, ['Mã nhân sự', 'Mã NS', 'MaNS', 'Ma']),
            LoaiHD: getIdx(nsHeader, ['Loại hợp đồng', 'LoaiHD']),
            MaBP: getIdx(nsHeader, ['Mã đơn vị', 'Mã bộ phận', 'MaBP']),
            DonVi: getIdx(nsHeader, ['Đơn vị', 'DonVi']),
            TenNS: getIdx(nsHeader, ['Họ và tên', 'Họ tên', 'HoTen']),
            KhuVuc: getIdx(nsHeader, ['Khu vực', 'KhuVuc', 'Địa phương', 'Khu vuc', 'Địa bàn']),
            LuongCD: getIdx(nsHeader, ['Lương CĐ', 'Lương cố định', 'LuongCD'])
        };
        dataNS.forEach((row, i) => {
            if (i === 0) return;
            const ma = String(row[nsIdx.Ma] || '').trim();
            if (!ma) return;
            const kyRow = String(row[nsIdx.Ky] || '').trim().replace(/^T/, '');
            const kvIdx = nsIdx.KhuVuc !== -1 ? nsIdx.KhuVuc : 38;
            const luongCDChotIdx = nsIdx.LuongCD !== -1 ? nsIdx.LuongCD : -1;
            const record = {
                LoaiHD: String(row[nsIdx.LoaiHD] || '').trim(),
                MaBP: String(row[nsIdx.MaBP] || row[nsIdx.DonVi] || '').trim(),
                TenNS: String(row[nsIdx.TenNS] || '').trim(),
                KhuVuc: normalizeLocation(row[kvIdx]),
                LuongCD: luongCDChotIdx !== -1 ? parseNumber(row[luongCDChotIdx]) : 0
            };
            if (kyRow === targetMonth) {
                if (locationNormalized && record.KhuVuc !== locationNormalized) return;
                personnel[ma] = record;
            }
            allPersonnelRecords[ma] = record;
        });

        const getContractType = (ma) => {
            const p = personnel[ma] || allPersonnelRecords[ma];
            if (!p) return 'HĐ ngắn hạn';
            const lhd = String(p.LoaiHD).toUpperCase().trim();
            if (lhd.includes('BIÊN CHẾ') || lhd === 'BC') return 'Biên chế';
            if (lhd.includes('68') || lhd.includes('LƯƠNG CỐ ĐỊNH')) return 'HĐ 68';
            if (lhd.includes('DÀI HẠN') || lhd.includes('THƯỜNG XUYÊN')) return 'HĐ dài hạn';
            if (lhd.includes('VỤ VIỆC') || lhd.includes('NGẮN HẠN')) {
                if (lhd.includes('CỐ ĐỊNH')) return 'HĐ ngắn hạn (cố định)';
                return 'HĐ ngắn hạn';
            }
            return 'HĐ ngắn hạn';
        };

        const getUnitCode = (ma) => {
            const p = personnel[ma] || allPersonnelRecords[ma];
            if (!p) return 'KHAC';
            return p.MaBP || 'KHAC';
        };

        const getUnitType = (ma) => {
            const code = getUnitCode(ma);
            const cleanCode = code.split('-')[0].trim();
            return unitToType[code] || unitToType[cleanCode] || 'Gián tiếp';
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
            const bp = getUnitCode(ma);
            const key = `${gIdx}|${tIdx}|${ut}|${sub}|${ct}|${bp}`;
            if (!storage[key]) storage[key] = emptyMetric();
            return storage[key];
        };

        const sumMetricRow = (m) => {
            m.LCHachToan = m.LC100 - m.Treo60;
            m.SumLPC = m.LC100 + m.PCCV + m.PCVK + m.PCGV + m.PCTNGV + m.PCTN;
            m.ThucLinh = m.LCHachToan + (m.PCCV + m.PCVK + m.PCGV + m.PCTNGV + m.PCTN)
                - (m.BHXH + m.BHYT + m.BHTN + m.KPCD + m.QuyTN + m.Huong40 + m.TamUng + m.TreoLuong);
        };

        const addMetrics = (target, source) => {
            for (let key in source) { target[key] += source[key]; }
        };

        // Process DataLuong1
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
            TongLuong1: getIdx(l1Header, ['Tổng lương 1', 'TongLuong1', 'Còn nhận']),
            LuongCD: getIdx(l1Header, ['Lương CĐ', 'LuongCD']),
            KhuVuc: getIdx(l1Header, ['Khu vực', 'KhuVuc', 'Địa phương', 'Khu vuc'])
        };

        dataLuong1.forEach((row, i) => {
            if (i === 0) return;
            const rKy = String(row[l1Idx.Ky] || '').trim().replace(/^T/, '');
            if (rKy !== targetMonth) return;
            const maRaw = row[l1Idx.Ma];
            const ma = (maRaw && String(maRaw).trim()) || null;
            if (!ma) return;

            // Lọc khu vực đồng bộ (ưu tiên tra từ DataChotNSThang)
            let rowLocation = '';
            const pRecord = personnel[ma] || allPersonnelRecords[ma];
            if (pRecord && pRecord.KhuVuc) {
                rowLocation = pRecord.KhuVuc;
            } else {
                const kvIdx = l1Idx.KhuVuc !== -1 ? l1Idx.KhuVuc : 31;
                rowLocation = normalizeLocation(row[kvIdx]);
            }
            if (locationNormalized && rowLocation !== locationNormalized) return;

            const tongLuong1Raw = row[l1Idx.TongLuong1];
            if (tongLuong1Raw === '' || tongLuong1Raw === null || tongLuong1Raw === undefined) return;
            const tongLuong1 = parseNumber(tongLuong1Raw);
            if (tongLuong1 <= 0 || isNaN(tongLuong1)) return;

            const lc100 = (parseNumber(row[l1Idx.HSBac]) + parseNumber(row[l1Idx.HSBacBL])) * LCB;
            const pccv = parseNumber(row[l1Idx.HSCV]) * LCB;
            const pcvk = parseNumber(row[l1Idx.HSVK]) * LCB;
            const pcgv = parseNumber(row[l1Idx.HSGD]) * LCB;
            const pctngv = parseNumber(row[l1Idx.HSTNGV]) * LCB;
            const pctn = (parseNumber(row[l1Idx.HSTrachNhiem]) + parseNumber(row[l1Idx.HSDocHai]) + parseNumber(row[l1Idx.HSTuVe])) * LCB;

            let finalLC100 = lc100;
            if (getContractType(ma) === 'HĐ ngắn hạn') {
                const tongLuongFromCol = parseNumber(row[l1Idx.TongLuong]);
                if (tongLuongFromCol > 0) finalLC100 = tongLuongFromCol;
                else finalLC100 = lc100 + pccv + pcvk + pcgv + pctngv + pctn;
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

            if (!s.employees) s.employees = [];
            const empName = pRecord ? pRecord.TenNS : (row[l1Idx.HoTen] || 'Chưa rõ');
            s.employees.push({
                ma: ma,
                ten: empName,
                metrics: {
                    SumLPC: finalLC100 + pccv + pcvk + pcgv + pctngv + pctn,
                    LC100: finalLC100,
                    Treo60: parseNumber(row[l1Idx.NN]) + parseNumber(row[l1Idx.NghiBHXH]),
                    LCHachToan: finalLC100 - (parseNumber(row[l1Idx.NN]) + parseNumber(row[l1Idx.NghiBHXH])),
                    PCCV: pccv,
                    PCVK: pcvk,
                    PCGV: pcgv,
                    PCTNGV: pctngv,
                    PCTN: pctn,
                    BHXH: parseNumber(row[l1Idx.BHXH]),
                    BHYT: parseNumber(row[l1Idx.BHYT]),
                    BHTN: parseNumber(row[l1Idx.BHTN]),
                    KPCD: parseNumber(row[l1Idx.KPCD]),
                    QuyTN: parseNumber(row[l1Idx.TruKhac]),
                    Huong40: 0, TamUng: 0, TreoLuong: 0,
                    ThueTNCN: parseNumber(row[l1Idx.ThueTNCN]),
                    ThucLinh: (finalLC100 - (parseNumber(row[l1Idx.NN]) + parseNumber(row[l1Idx.NghiBHXH])))
                        + (pccv + pcvk + pcgv + pctngv + pctn)
                        - (parseNumber(row[l1Idx.BHXH]) + parseNumber(row[l1Idx.BHYT]) + parseNumber(row[l1Idx.BHTN]) + parseNumber(row[l1Idx.KPCD]) + parseNumber(row[l1Idx.TruKhac]) + parseNumber(row[l1Idx.ThueTNCN]))
                }
            });

            // Logic truy lĩnh từ chênh lệch Lương CĐ
            if (l1Idx.LuongCD !== -1) {
                const luongCDL1 = parseNumber(row[l1Idx.LuongCD]);
                if (luongCDL1 > 0) {
                    const luongCDChot = pRecord ? (pRecord.LuongCD || 0) : 0;
                    const chenhLech = luongCDChot - luongCDL1;
                    if (chenhLech > 0) {
                        const sTL = getStore(ma, 'A', 'II', 'TL');
                        sTL.LC100 += chenhLech;
                    }
                }
            }
        });

        // Process TruyThu1 (A-II): lọc khu vực + phân loại theo Còn nhận (AH)
        const tt1Header = truyThu1[0] || [];
        const tt1Idx = {
            Ky: getIdx(tt1Header, ['Kỳ trả lương', 'Kỳ lương', 'Ky']),
            Ma: getIdx(tt1Header, ['Mã nhân sự', 'Mã CB', 'MaNS', 'Ma', 'Mã NS']),
            ConNhan: getIdx(tt1Header, ['Còn nhận', 'ConNhan', 'Thực lĩnh', 'Tổng lương 1']),
            BHXH: getIdx(tt1Header, ['BHXH']),
            BHYT: getIdx(tt1Header, ['BHYT']),
            BHTN: getIdx(tt1Header, ['BHTN']),
            KPCD: getIdx(tt1Header, ['KPCĐ', 'KPCD']),
            ThueTNCN: getIdx(tt1Header, ['Thuế TNCN', 'TNCN', 'Thue TNCN', 'Thuế']),
            KhuVuc: getIdx(tt1Header, ['Khu vực', 'KhuVuc', 'Địa phương', 'Khu vuc'])
        };
        truyThu1.forEach((row, i) => {
            if (i === 0) return;
            const rKy = String(row[tt1Idx.Ky] || '').trim().replace(/^T/, '');
            if (rKy !== targetMonth) return;
            const ma = (row[tt1Idx.Ma] && String(row[tt1Idx.Ma]).trim()) || null;
            if (!ma) return;
            // Lọc khu vực
            let rowLocation = '';
            const pRec = personnel[ma] || allPersonnelRecords[ma];
            if (pRec && pRec.KhuVuc) {
                rowLocation = pRec.KhuVuc;
            } else if (tt1Idx.KhuVuc !== -1) {
                rowLocation = normalizeLocation(row[tt1Idx.KhuVuc]);
            }
            if (locationNormalized && rowLocation !== locationNormalized) return;
            const conNhan = tt1Idx.ConNhan !== -1 ? parseNumber(row[tt1Idx.ConNhan]) : 0;
            if (conNhan === 0) return;
            const sub = conNhan > 0 ? 'TL' : 'TT';
            const s = getStore(ma, 'A', 'II', sub);
            s.LC100 += conNhan;
            s.BHXH += parseNumber(row[tt1Idx.BHXH]);
            s.BHYT += parseNumber(row[tt1Idx.BHYT]);
            s.BHTN += parseNumber(row[tt1Idx.BHTN]);
            s.KPCD += parseNumber(row[tt1Idx.KPCD]);
            s.ThueTNCN += parseNumber(row[tt1Idx.ThueTNCN]);
        });

        // Process DATA_LUONG_2 & TRUY_THU_LUONG_2 (Part B)
        const l2Header = dataLuong2[0] || [];
        const l2IdxKy = getIdx(l2Header, ['Kỳ lương', 'Ky']);
        const l2IdxMa = getIdx(l2Header, ['Mã nhân sự', 'Mã CB', 'MaNS', 'Ma', 'Mã NS']);
        const l2IdxV = getIdx(l2Header, ['Lương 2', 'Luong2', 'TNTT']);
        dataLuong2.forEach((row, i) => {
            if (i === 0) return;
            const rKy = String(row[l2IdxKy] || '').trim().replace(/^T/, '');
            if (rKy !== targetMonth) return;
            const ma = (row[l2IdxMa] && String(row[l2IdxMa]).trim()) || null;
            if (!ma) return;

            let rowLocation = '';
            const pRec = personnel[ma] || allPersonnelRecords[ma];
            if (pRec && pRec.KhuVuc) rowLocation = pRec.KhuVuc;
            if (locationNormalized && rowLocation !== locationNormalized) return;

            const v = parseNumber(row[l2IdxV]);
            const s = getStore(ma, 'B', 'I', 'Regular', 'Main');
            s.LC100 += v;
        });

        const tt2Header = truyThu2[0] || [];
        const tt2IdxKy = getIdx(tt2Header, ['Kỳ trả lương', 'Kỳ lương', 'Ky']);
        const tt2IdxMa = getIdx(tt2Header, ['Mã nhân sự', 'Mã CB', 'MaNS', 'Ma', 'Mã NS']);
        const tt2IdxV = getIdx(tt2Header, ['Còn nhận', 'ConNhan']);
        truyThu2.forEach((row, i) => {
            if (i === 0) return;
            const rKy = String(row[tt2IdxKy] || '').trim().replace(/^T/, '');
            if (rKy !== targetMonth) return;
            const ma = (row[tt2IdxMa] && String(row[tt2IdxMa]).trim()) || null;
            if (!ma) return;

            let rowLocation = '';
            const pRec = personnel[ma] || allPersonnelRecords[ma];
            if (pRec && pRec.KhuVuc) rowLocation = pRec.KhuVuc;
            if (locationNormalized && rowLocation !== locationNormalized) return;

            const v = parseNumber(row[tt2IdxV]);
            if (v === 0) return;
            const s = getStore(ma, 'B', 'II', (v > 0 ? 'TL' : 'TT'), 'Main');
            s.LC100 += v;
        });

        // Process DATA_AN_CA (Part C)
        const acHeader = dataAnCa[0] || [];
        const acIdxKy = getIdx(acHeader, ['Kỳ lương', 'Ky']);
        const acIdxMa = getIdx(acHeader, ['Mã nhân sự', 'Mã CB', 'MaNS', 'Ma', 'Mã NS']);
        const acIdxV1 = getIdx(acHeader, ['Ăn ca', 'AnCa']);
        const acIdxV2 = getIdx(acHeader, ['Truy lĩnh', 'TruyLinh']);
        dataAnCa.forEach((row, i) => {
            if (i === 0) return;
            const rKy = String(row[acIdxKy] || '').trim().replace(/^T/, '');
            if (rKy !== targetMonth) return;
            const ma = (row[acIdxMa] && String(row[acIdxMa]).trim()) || null;
            if (!ma) return;

            let rowLocation = '';
            const pRec = personnel[ma] || allPersonnelRecords[ma];
            if (pRec && pRec.KhuVuc) rowLocation = pRec.KhuVuc;
            if (locationNormalized && rowLocation !== locationNormalized) return;

            const v1 = parseNumber(row[acIdxV1]);
            const s1 = getStore(ma, 'C', 'I', 'Regular', 'Main');
            s1.LC100 += v1;

            const v2 = parseNumber(row[acIdxV2]);
            if (v2 !== 0) {
                const s2 = getStore(ma, 'C', 'II', (v2 > 0 ? 'TL' : 'TT'), 'Main');
                s2.LC100 += v2;
            }
        });
        const resultTable = [];

        const getRow = (label, m, isSub = false) => {
            sumMetricRow(m);
            return [
                label, m.SumLPC, m.LC100, m.Treo60, m.LCHachToan,
                m.PCCV, m.PCVK, m.PCGV, m.PCTNGV, m.PCTN,
                m.BHXH, m.BHYT, m.BHTN, m.KPCD, m.QuyTN,
                m.Huong40, m.TamUng, m.TreoLuong, m.ThueTNCN,
                m.ThucLinh
            ];
        };

        // Grouping keys logic
        const getKeysFor = (g, t, ut, sub, ct) => {
            const prefix = `${g}|${t}|${ut}|${sub}|${ct}|`;
            return Object.keys(storage).filter(k => k.startsWith(prefix));
        };

        const getGroupMetric = (g, t, ut, sub, ct) => {
            const m = emptyMetric();
            getKeysFor(g, t, ut, sub, ct).forEach(k => addMetrics(m, storage[k]));
            return m;
        };

        const addContractWithDepts = (sectionTitle, g, t, ut, sub, ct) => {
            const groupM = getGroupMetric(g, t, ut, sub, ct);
            resultTable.push(getRow(sectionTitle, groupM));

            // Tạm thời vô hiệu hóa bóc tách chi tiết bộ phận và nhân sự
            /*
            const keys = getKeysFor(g, t, ut, sub, ct);
            const deptMap = {};
            const deptEmps = {};
            keys.forEach(k => {
                const parts = k.split('|');
                const bpCode = parts[5];
                if (!deptMap[bpCode]) {
                    deptMap[bpCode] = emptyMetric();
                    deptEmps[bpCode] = [];
                }
                addMetrics(deptMap[bpCode], storage[k]);
                if (storage[k].employees) {
                    deptEmps[bpCode] = deptEmps[bpCode].concat(storage[k].employees);
                }
            });

            Object.keys(deptMap).forEach(bpCode => {
                const bpName = unitToName[bpCode] || bpCode;
                resultTable.push(getRow(`  - ${bpName} (${bpCode})`, deptMap[bpCode], true));

                // Thêm chi tiết từng cán bộ của bộ phận
                if (deptEmps[bpCode]) {
                    deptEmps[bpCode].forEach(emp => {
                        resultTable.push(getRow(`    + ${emp.ten} (${emp.ma})`, emp.metrics, true));
                    });
                }
            });
            */
        };

        // Render Section I. Lương ngạch bậc
        const AI_GT = emptyMetric();
        const AI_TT = emptyMetric();
        Object.keys(storage).forEach(k => {
            if (k.startsWith('A|I|Gián tiếp|')) addMetrics(AI_GT, storage[k]);
            if (k.startsWith('A|I|Trực tiếp|')) addMetrics(AI_TT, storage[k]);
        });
        const combinedI = emptyMetric(); addMetrics(combinedI, AI_GT); addMetrics(combinedI, AI_TT);

        resultTable.push(getRow("I. LƯƠNG NGẠCH BẬC", combinedI));

        // 1. Gián tiếp
        resultTable.push(getRow("1. Gián tiếp", AI_GT));
        addContractWithDepts("Biên chế", 'A', 'I', 'Gián tiếp', 'Regular', 'Biên chế');
        addContractWithDepts("HĐ dài hạn", 'A', 'I', 'Gián tiếp', 'Regular', 'HĐ dài hạn');
        addContractWithDepts("HĐ 68", 'A', 'I', 'Gián tiếp', 'Regular', 'HĐ 68');
        addContractWithDepts("HĐ ngắn hạn", 'A', 'I', 'Gián tiếp', 'Regular', 'HĐ ngắn hạn');

        // 2. Trực tiếp
        resultTable.push(getRow("2. Trực tiếp", AI_TT));
        addContractWithDepts("Biên chế", 'A', 'I', 'Trực tiếp', 'Regular', 'Biên chế');
        addContractWithDepts("HĐ dài hạn", 'A', 'I', 'Trực tiếp', 'Regular', 'HĐ dài hạn');
        addContractWithDepts("HĐ 68", 'A', 'I', 'Trực tiếp', 'Regular', 'HĐ 68');
        addContractWithDepts("HĐ ngắn hạn (cố định)", 'A', 'I', 'Trực tiếp', 'Regular', 'HĐ ngắn hạn (cố định)');
        addContractWithDepts("HĐ ngắn hạn", 'A', 'I', 'Trực tiếp', 'Regular', 'HĐ ngắn hạn');

        // Render Section II. Truy thu, truy lĩnh
        const AII_GT = emptyMetric();
        const AII_TT = emptyMetric();
        Object.keys(storage).forEach(k => {
            if (k.startsWith('A|II|Gián tiếp|')) addMetrics(AII_GT, storage[k]);
            if (k.startsWith('A|II|Trực tiếp|')) addMetrics(AII_TT, storage[k]);
        });
        const combinedII = emptyMetric(); addMetrics(combinedII, AII_GT); addMetrics(combinedII, AII_TT);
        resultTable.push(getRow("II. Truy thu, truy lĩnh", combinedII));

        const pushIfNonZero = (label, m) => {
            if (Object.values(m).some(v => v !== 0)) resultTable.push(getRow(label, m));
        };
        const mergeCtListII = (ut, sub, ctList) => {
            const m = emptyMetric();
            (Array.isArray(ctList) ? ctList : [ctList]).forEach(ct => {
                const prefix = `A|II|${ut}|${sub}|${ct}|`;
                Object.keys(storage).filter(k => k.startsWith(prefix)).forEach(k => addMetrics(m, storage[k]));
            });
            return m;
        };
        const ttCtGroups = [
            { label: 'BC', ct: 'Biên chế' },
            { label: 'HĐ 68', ct: 'HĐ 68' },
            { label: 'HĐ', ctList: ['HĐ dài hạn', 'HĐ ngắn hạn', 'HĐ ngắn hạn (cố định)'] }
        ];

        resultTable.push(getRow("1. Gián tiếp", AII_GT));
        ttCtGroups.forEach(({ label, ct, ctList }) => {
            pushIfNonZero(`Truy lĩnh (${label})`, mergeCtListII('Gián tiếp', 'TL', ctList || ct));
            pushIfNonZero(`Truy thu (${label})`, mergeCtListII('Gián tiếp', 'TT', ctList || ct));
        });

        resultTable.push(getRow("2. Trực tiếp", AII_TT));
        ttCtGroups.forEach(({ label, ct, ctList }) => {
            pushIfNonZero(`Truy lĩnh (${label})`, mergeCtListII('Trực tiếp', 'TL', ctList || ct));
            pushIfNonZero(`Truy thu (${label})`, mergeCtListII('Trực tiếp', 'TT', ctList || ct));
        });

        const sumTotalGT = emptyMetric(); addMetrics(sumTotalGT, AI_GT); addMetrics(sumTotalGT, AII_GT);
        const sumTotalTT = emptyMetric(); addMetrics(sumTotalTT, AI_TT); addMetrics(sumTotalTT, AII_TT);

        resultTable.push(getRow("Tổng lương ngạch bậc và truy lĩnh-GT", sumTotalGT));

        const nhGt = emptyMetric();
        const getValTest = (g, t, ut, sub, ct) => {
            const prefix = `${g}|${t}|${ut}|${sub}|${ct}|`;
            const m = emptyMetric();
            Object.keys(storage).filter(k => k.startsWith(prefix)).forEach(k => addMetrics(m, storage[k]));
            return m;
        };
        addMetrics(nhGt, getValTest('A', 'I', 'Gián tiếp', 'Regular', 'HĐ ngắn hạn'));
        addMetrics(nhGt, getValTest('A', 'II', 'Gián tiếp', 'TL', 'HĐ ngắn hạn'));
        addMetrics(nhGt, getValTest('A', 'II', 'Gián tiếp', 'TT', 'HĐ ngắn hạn'));
        resultTable.push(getRow("Tổng truy lĩnh HĐ N.hạn-GT", nhGt));

        resultTable.push(getRow("Tổng lương ngạch bậc và truy lĩnh-TT", sumTotalTT));

        const totalA = emptyMetric(); addMetrics(totalA, sumTotalGT); addMetrics(totalA, sumTotalTT); addMetrics(totalA, nhGt);
        resultTable.push(getRow("A. Tổng lương ngạch bậc và truy lĩnh GT+TT", totalA));

        // Section B
        const bTot = emptyMetric();
        const bReg = emptyMetric(); ['Trực tiếp', 'Gián tiếp'].forEach(ut => addMetrics(bReg, getValTest('B', 'I', ut, 'Regular', 'Main')));
        const bTL = emptyMetric(); ['Trực tiếp', 'Gián tiếp'].forEach(ut => addMetrics(bTL, getValTest('B', 'II', ut, 'TL', 'Main')));
        const bTT = emptyMetric(); ['Trực tiếp', 'Gián tiếp'].forEach(ut => addMetrics(bTT, getValTest('B', 'II', ut, 'TT', 'Main')));
        addMetrics(bTot, bReg); addMetrics(bTot, bTL); addMetrics(bTot, bTT);

        resultTable.push(getRow("B. Thu nhập tăng thêm", bTot));
        resultTable.push(getRow("Thu nhập tăng thêm", bReg));
        resultTable.push(getRow("Truy lĩnh", bTL));
        resultTable.push(getRow("Truy thu", bTT));

        // Section C
        const cTot = emptyMetric();
        const cReg = emptyMetric(); ['Trực tiếp', 'Gián tiếp'].forEach(ut => addMetrics(cReg, getValTest('C', 'I', ut, 'Regular', 'Main')));
        const cTL = emptyMetric(); ['Trực tiếp', 'Gián tiếp'].forEach(ut => addMetrics(cTL, getValTest('C', 'II', ut, 'TL', 'Main')));
        const cTT = emptyMetric(); ['Trực tiếp', 'Gián tiếp'].forEach(ut => addMetrics(cTT, getValTest('C', 'II', ut, 'TT', 'Main')));
        addMetrics(cTot, cReg); addMetrics(cTot, cTL); addMetrics(cTot, cTT);

        resultTable.push(getRow("C. Ăn ca", cTot));
        resultTable.push(getRow("Ăn ca", cReg));
        resultTable.push(getRow("Truy lĩnh", cTL));
        resultTable.push(getRow("Truy thu", cTT));

        // Section D
        const finalDTot = emptyMetric();
        finalDTot.ThueTNCN = totalA.ThueTNCN + bTot.ThueTNCN + cTot.ThueTNCN;

        const rowD = getRow("D. Thuế TNCN", finalDTot);
        rowD[rowD.length - 1] = finalDTot.ThueTNCN;
        resultTable.push(rowD);

        // Tổng cộng
        const grand = emptyMetric();
        addMetrics(grand, totalA);
        addMetrics(grand, bTot);
        addMetrics(grand, cTot);

        const finalRowData = getRow("Tổng cộng: A+B+C-D", grand);
        finalRowData[finalRowData.length - 1] -= finalDTot.ThueTNCN;
        resultTable.push(finalRowData);

        // Ghi dữ liệu Audit ra Sheet
        const ss = SpreadsheetApp.openById(EXPORT_FILE_ID);
        let auditSheet = ss.getSheetByName(AUDIT_SHEET_NAME);
        if (!auditSheet) {
            auditSheet = ss.insertSheet(AUDIT_SHEET_NAME);
        }
        auditSheet.clear();
        auditSheet.getRange("A:V").clearFormat();

        // Banner Header Audit
        auditSheet.getRange("A1:T1").merge().setValue(`BẢNG AUDIT CHI TIẾT THEO BỘ PHẬN HẠCH TOÁN LƯƠNG - THÁNG ${monthStr} - ĐỊA PHƯƠNG: ${location}`)
            .setFontSize(12).setFontWeight("bold").setBackground("#FFF9C4").setHorizontalAlignment("center");
        auditSheet.getRange("A2:T2").merge().setValue(`Thời gian export audit: ${new Date().toLocaleString("vi-VN")}`)
            .setFontSize(9).setFontStyle("italic").setHorizontalAlignment("center");

        // Ghi Bảng Kết Quả Hạch Toán
        if (resultTable && resultTable.length > 0) {
            const header1 = [
                "Nội dung", "Tổng lương, PC theo lương và truy lĩnh", "Lương chính tháng " + monthStr, "", "",
                "Phụ cấp chức vụ", "Các khoản phụ cấp theo lương", "", "", "",
                "Các khoản khấu trừ", "", "", "", "", "", "", "", "", "Thực lĩnh"
            ];
            const header2 = [
                "", "", "LC 100%", "Treo 60% NN+Th.sản", "LC hạch toán",
                "PCCV", "PCVK", "PCGV", "PCTNGV", "PCTN",
                "BHXH", "BHYT", "BHTN", "Đoàn phí CĐ", "Quỹ TN", "hưởng 40% đi NN", "Tạm ứng", "treo lương", "Thuế TNCN", ""
            ];
            auditSheet.getRange(4, 1, 1, header1.length).setValues([header1]);
            auditSheet.getRange(5, 1, 1, header2.length).setValues([header2]);
            const merges = ["A4:A5", "B4:B5", "C4:E4", "F4:F5", "G4:J4", "K4:S4", "T4:T5"];
            merges.forEach(m => auditSheet.getRange(m).merge().setVerticalAlignment("middle").setHorizontalAlignment("center"));

            auditSheet.getRange(4, 1, 2, header1.length).setFontWeight("bold").setBackground("#E0E0E0").setBorder(true, true, true, true, true, true);

            auditSheet.getRange(6, 1, resultTable.length, resultTable[0].length).setValues(resultTable);
            auditSheet.getRange(6, 2, resultTable.length, resultTable[0].length - 1).setNumberFormat("#,##0");
            
            resultTable.forEach((row, idx) => {
                const rowIndex = idx + 6;
                const content = String(row[0]);
                if (content.startsWith("  - ")) {
                    auditSheet.getRange(rowIndex, 1, 1, resultTable[0].length).setFontStyle("italic").setFontSize(8);
                } else if (content.startsWith("    + ")) {
                    auditSheet.getRange(rowIndex, 1, 1, resultTable[0].length).setFontStyle("italic").setFontSize(8).setFontColor("#666666");
                } else if (content.match(/^[I-V]\./) || content.match(/^[1-9]\./) || content.includes("Tổng cộng")) {
                    auditSheet.getRange(rowIndex, 1, 1, resultTable[0].length).setFontWeight("bold");
                }
            });

            auditSheet.setColumnWidth(1, 400);
            auditSheet.setColumnWidth(2, 130);
            for (let i = 3; i <= 20; i++) auditSheet.setColumnWidth(i, 100);
        }

        const sheetUrl = `https://docs.google.com/spreadsheets/d/${EXPORT_FILE_ID}/edit#gid=${auditSheet.getSheetId()}`;
        Logger.log(`✅ AUDIT BỘ PHẬN HOÀN TẤT! Link Sheet Audit: ${sheetUrl}`);

        return {
            status: "success",
            month: monthStr,
            location: location,
            totalRows: resultTable.length,
            auditSheetUrl: sheetUrl
        };

    } catch (e) {
        Logger.log(`❌ LỖI TRONG QUÁ TRÌNH AUDIT BỘ PHẬN: ${e.toString()}`);
        return { status: "error", message: e.toString() };
    }
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
            "BHXH", "BHYT", "BHTN", "Đoàn phí CĐ", "Quỹ TN", "hưởng 40% đi NN", "Tạm ứng", "treo lương", "Thuế TNCN", ""
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
        DonVi: getIdx(nsHeader, ['Đơn vị', 'DonVi']),
        KhuVuc: getIdx(nsHeader, ['Khu vực', 'KhuVuc', 'Địa phương', 'Khu vuc', 'Địa bàn']),
        LuongCD: getIdx(nsHeader, ['Lương CĐ', 'Lương cố định', 'LuongCD'])
    };
    let personnelCount = 0;
    let allCount = 0;
    dataNS.forEach((row, i) => {
        if (i === 0) return;
        const ma = String(row[nsIdx.Ma] || '').trim();
        if (!ma) return;
        allCount++;
        const kyRow = String(row[nsIdx.Ky] || '').trim().replace(/^T/, '');
        const kvIdx = nsIdx.KhuVuc !== -1 ? nsIdx.KhuVuc : 38;
        const luongCDChotIdx = nsIdx.LuongCD !== -1 ? nsIdx.LuongCD : -1;
        const record = {
            LoaiHD: String(row[nsIdx.LoaiHD] || '').trim(),
            MaBP: String(row[nsIdx.MaBP] || row[nsIdx.DonVi] || '').trim(),
            KhuVuc: normalizeLocation(row[kvIdx]),
            LuongCD: luongCDChotIdx !== -1 ? parseNumber(row[luongCDChotIdx]) : 0
        };

        if (kyRow === targetMonth) {
            // Lọc theo khu vực nếu có yêu cầu
            if (locationNormalized && record.KhuVuc !== locationNormalized) return;

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
        HoTen: getIdx(l1Header, ['Họ và tên', 'Họ Và Tên', 'HỌ VÀ TÊN', 'Họ tên', 'Họ Tên', 'HỌ TÊN', 'HoTen', 'Tên nhân viên']),
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
        TongLuong1: getIdx(l1Header, ['Tổng lương 1', 'TongLuong1', 'Còn nhận']),
        LuongCD: getIdx(l1Header, ['Lương CĐ', 'LuongCD']),
        KhuVuc: getIdx(l1Header, ['Khu vực', 'KhuVuc', 'Địa phương', 'Khu vuc'])
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
        // Lọc khu vực đồng bộ (ưu tiên tra từ DataChotNSThang)
        let rowLocation = '';
        const pRecord = personnel[ma] || allPersonnelRecords[ma];
        if (pRecord && pRecord.KhuVuc) {
            rowLocation = pRecord.KhuVuc;
        } else {
            const kvIdx = l1Idx.KhuVuc !== -1 ? l1Idx.KhuVuc : 31;
            rowLocation = normalizeLocation(row[kvIdx]);
        }
        if (locationNormalized && rowLocation !== locationNormalized) return;

        const tongLuong1 = parseNumber(row[l1Idx.TongLuong1]);
        if (tongLuong1 <= 0 || isNaN(tongLuong1)) return;
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

        // Req 1: Nếu Lương CĐ (cột AE) > 0 và < Lương CĐ trong DataChotNSThang → truy lĩnh
        if (l1Idx.LuongCD !== -1) {
            const luongCDL1 = parseNumber(row[l1Idx.LuongCD]);
            if (luongCDL1 > 0) {
                const chotRecord = personnel[ma] || allPersonnelRecords[ma];
                const luongCDChot = chotRecord ? (chotRecord.LuongCD || 0) : 0;
                const chenhLech = luongCDChot - luongCDL1;
                if (chenhLech > 0) {
                    const sTL = getStore(ma, 'A', 'II', 'TL');
                    sTL.LC100 += chenhLech;
                }
            }
        }
    });
    Logger.log(`- DATA_LUONG_1: Đọc ${matchedL1} dòng cho tháng ${monthStr}, ${notInPersonnelL1} mã nhân sự không có trong dữ liệu chốt.`);

    // 4. TRUY_THU_LUONG_1 (Part A-II) - phân loại theo Loại HĐ và Khu vực
    const tt1Header = truyThu1[0] || [];
    const tt1Idx = {
        Ky: getIdx(tt1Header, ['Kỳ trả lương', 'Kỳ lương', 'Ky']),
        Ma: getIdx(tt1Header, ['Mã nhân sự', 'Mã CB', 'MaNS', 'Ma', 'Mã NS']),
        ConNhan: getIdx(tt1Header, ['Còn nhận', 'ConNhan', 'Thực lĩnh', 'Tổng lương 1']),
        BHXH: getIdx(tt1Header, ['BHXH']),
        BHYT: getIdx(tt1Header, ['BHYT']),
        BHTN: getIdx(tt1Header, ['BHTN']),
        KPCD: getIdx(tt1Header, ['KPCĐ', 'KPCD']),
        ThueTNCN: getIdx(tt1Header, ['Thuế TNCN', 'TNCN', 'Thue TNCN', 'Thuế']),
        KhuVuc: getIdx(tt1Header, ['Khu vực', 'KhuVuc', 'Địa phương', 'Khu vuc'])
    };

    let matchedTT1 = 0;
    let skippedTT1 = 0;
    truyThu1.forEach((row, i) => {
        if (i === 0) return;
        const rKy = String(row[tt1Idx.Ky] || '').trim().replace(/^T/, '');
        if (rKy !== targetMonth) return;

        const maRaw = row[tt1Idx.Ma];
        const ma = (maRaw && String(maRaw).trim()) || null;
        if (!ma) return;

        // Lọc khu vực: ưu tiên từ DataChotNSThang
        let rowLocation = '';
        const pRec = personnel[ma] || allPersonnelRecords[ma];
        if (pRec && pRec.KhuVuc) {
            rowLocation = pRec.KhuVuc;
        } else if (tt1Idx.KhuVuc !== -1) {
            rowLocation = normalizeLocation(row[tt1Idx.KhuVuc]);
        }
        if (locationNormalized && rowLocation !== locationNormalized) return;

        // Dùng cột Còn nhận (AH) để phân loại truy thu / truy lĩnh
        const conNhan = tt1Idx.ConNhan !== -1 ? parseNumber(row[tt1Idx.ConNhan]) : 0;
        if (conNhan === 0) { skippedTT1++; return; }

        matchedTT1++;
        const sub = conNhan > 0 ? 'TL' : 'TT';
        const s = getStore(ma, 'A', 'II', sub);
        s.LC100 += conNhan;
        s.BHXH += parseNumber(row[tt1Idx.BHXH]);
        s.BHYT += parseNumber(row[tt1Idx.BHYT]);
        s.BHTN += parseNumber(row[tt1Idx.BHTN]);
        s.KPCD += parseNumber(row[tt1Idx.KPCD]);
        s.ThueTNCN += parseNumber(row[tt1Idx.ThueTNCN]);
    });
    Logger.log(`- TRUY_THU_LUONG_1: Đọc ${matchedTT1} dòng có giá trị, ${skippedTT1} dòng Còn nhận = 0 (bỏ qua) cho tháng ${monthStr}.`);

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
        const maRaw = row[l2IdxMa];
        const ma = (maRaw && String(maRaw).trim()) || null;
        if (!ma) return;

        let rowLocation = '';
        const pRec = personnel[ma] || allPersonnelRecords[ma];
        if (pRec && pRec.KhuVuc) rowLocation = pRec.KhuVuc;
        if (locationNormalized && rowLocation !== locationNormalized) return;

        matchedL2++;
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
        const maRaw = row[tt2IdxMa];
        const ma = (maRaw && String(maRaw).trim()) || null;
        if (!ma) return;

        let rowLocation = '';
        const pRec = personnel[ma] || allPersonnelRecords[ma];
        if (pRec && pRec.KhuVuc) rowLocation = pRec.KhuVuc;
        if (locationNormalized && rowLocation !== locationNormalized) return;

        const v = parseNumber(row[tt2IdxV]);
        if (v === 0) { zeroValTT2++; return; }
        matchedTT2++;
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
        const maRaw = row[acIdxMa];
        const ma = (maRaw && String(maRaw).trim()) || null;
        if (!ma) return;

        let rowLocation = '';
        const pRec = personnel[ma] || allPersonnelRecords[ma];
        if (pRec && pRec.KhuVuc) rowLocation = pRec.KhuVuc;
        if (locationNormalized && rowLocation !== locationNormalized) return;

        matchedAc++;
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

    // Helper: chỉ push dòng nếu có ít nhất 1 giá trị != 0
    const pushIfNonZero = (label, m) => {
        const anyVal = Object.values(m).some(v => v !== 0);
        if (anyVal) table.push(getRow(label, m));
    };

    // Các nhóm loại hợp đồng cho section II
    const ttCtGroups = [
        { label: 'BC', ct: 'Biên chế' },
        { label: 'HĐ 68', ct: 'HĐ 68' },
        { label: 'HĐ', ct: ['HĐ dài hạn', 'HĐ ngắn hạn', 'HĐ ngắn hạn (cố định)'] }
    ];

    const mergeCtList = (g, t, ut, sub, ctList) => {
        const m = emptyMetric();
        (Array.isArray(ctList) ? ctList : [ctList]).forEach(ct => addMetrics(m, getVal(g, t, ut, sub, ct)));
        return m;
    };

    table.push(getRow("1. Gián tiếp", AII_GT));
    ttCtGroups.forEach(({ label, ct }) => {
        const tlM = mergeCtList('A', 'II', 'Gián tiếp', 'TL', ct);
        const ttM = mergeCtList('A', 'II', 'Gián tiếp', 'TT', ct);
        pushIfNonZero(`Truy lĩnh (${label})`, tlM);
        pushIfNonZero(`Truy thu (${label})`, ttM);
    });

    table.push(getRow("2. Trực tiếp", AII_TT));
    ttCtGroups.forEach(({ label, ct }) => {
        const tlM = mergeCtList('A', 'II', 'Trực tiếp', 'TL', ct);
        const ttM = mergeCtList('A', 'II', 'Trực tiếp', 'TT', ct);
        pushIfNonZero(`Truy lĩnh (${label})`, tlM);
        pushIfNonZero(`Truy thu (${label})`, ttM);
    });

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
