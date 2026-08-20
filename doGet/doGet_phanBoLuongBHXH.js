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
    var monthStr = 'T06.2026';
    var location = 'Hà Nội';
    Logger.log("=== CHẠY BẢNG PHÂN BỔ ===");
    Logger.log(doGet_taoBangPhanBoLuongBHXH(monthStr, location));
}

/**
 * Hàm Test kiểm tra và audit chi tiết từng nhân sự được xếp vào nhóm/dòng nào trong Bảng Phân Bổ Tiền Lương & BHXH
 * Mặc định kiểm tra khu vực Hà Nội, tháng T06.2026
 */
function test_auditChiTietPhanBoLuongBHXH() {
    var monthStr = 'T06.2026';
    var location = 'Hà Nội';
    var res = auditChiTietPhanBoLuongBHXH(monthStr, location);
    Logger.log(`Kết quả audit phân bổ: ${JSON.stringify(res)}`);
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
        MaCB: getIdx(hL1, ['Mã CB', 'Mã nhân sự', 'MaNS', 'Ma', 'Mã NS']),
        LoaiHD: getIdx(hL1, ['Loại HĐ', 'Loại hợp đồng', 'LoaiHD']),
        DonVi: getIdx(hL1, ['Đơn vị', 'DonVi', 'Mã đơn vị', 'Mã ĐV']),
        HSBac: getIdx(hL1, ['HS bậc', 'HS Bậc', 'HSBac']),
        HSBacBL: getIdx(hL1, ['HS bậc BL', 'HSBacBL']),
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

    // LOAD & MAP DATACHOTNSTHANG TO RESOLVE UNIT & CONTRACT TYPE FOR EMPLOYEES
    const mapChotNS = {};
    try {
        const dataChotRaw = getSheetNSThang().getDataRange().getValues();
        if (dataChotRaw.length > 1) {
            const headerChot = dataChotRaw[0] || [];
            const idxChot = {
                KyLuong: getIdx(headerChot, ['Kỳ lương', 'KyLuong', 'Ky']),
                MaNS: getIdx(headerChot, ['Mã nhân sự', 'Mã NS', 'MaNS', 'Ma']),
                LoaiHD: getIdx(headerChot, ['Loại hợp đồng', 'LoaiHD']),
                MaDonVi: getIdx(headerChot, ['Mã đơn vị', 'MaDonVi', 'MaBP']),
                DonVi: getIdx(headerChot, ['Tên đơn vị', 'TenDonVi', 'Đơn vị', 'DonVi']),
                KhuVuc: getIdx(headerChot, ['Khu vực', 'KhuVuc', 'Địa phương', 'Khu vuc', 'Địa bàn'])
            };
            const targetMonth = monthStr.replace(/^T/, '');
            dataChotRaw.slice(1).forEach(row => {
                const kyRow = String(row[idxChot.KyLuong] || '').trim().replace(/^T/, '');
                if (kyRow !== targetMonth) return;
                const ma = String(row[idxChot.MaNS] || '').trim();
                if (ma) {
                    const kvIdx = idxChot.KhuVuc !== -1 ? idxChot.KhuVuc : 38;
                    mapChotNS[ma] = {
                        MaDonVi: String(row[idxChot.MaDonVi] || '').trim(),
                        TenDonVi: String(row[idxChot.DonVi] || '').trim(),
                        LoaiHD: String(row[idxChot.LoaiHD] || '').trim(),
                        KhuVuc: normalizeLocation(row[kvIdx])
                    };
                }
            });
        }
    } catch (e) {
        Logger.log("⚠️ CẢNH BÁO: Lỗi khi đọc DataChotNSThang trong phân bổ lương: " + e.message);
    }

    // Fallback for arrears records that do not exist in DataChotNSThang.
    // DataNhanSu supplies the unit/contract needed to continue Setup mapping.
    const mapNhanSu = {};
    try {
        const shNhanSu = ssMaster.getSheetByName(GLOBAL_CONFIG.SHEETS.DATA_NHAN_SU);
        const valuesNhanSu = shNhanSu ? shNhanSu.getDataRange().getValues() : [];
        const headerNhanSu = valuesNhanSu[0] || [];
        const idxNhanSu = {
            Ma: getIdx(headerNhanSu, ['Mã nhân sự', 'Mã CB', 'Mã NS', 'MaNS', 'Ma']),
            LoaiHD: getIdx(headerNhanSu, ['Loại hợp đồng', 'Loại HĐ', 'LoaiHD']),
            MaDonVi: getIdx(headerNhanSu, ['Mã đơn vị', 'Mã bộ phận', 'MaDonVi', 'MaBP']),
            DonVi: getIdx(headerNhanSu, ['Tên đơn vị', 'Đơn vị', 'DonVi']),
            KhuVuc: getIdx(headerNhanSu, ['Khu vực', 'KhuVuc', 'Địa phương', 'Khu vuc'])
        };
        valuesNhanSu.slice(1).forEach(row => {
            const ma = String(row[idxNhanSu.Ma] || '').trim();
            if (!ma) return;
            mapNhanSu[ma] = {
                MaDonVi: String(row[idxNhanSu.MaDonVi] || '').trim(),
                TenDonVi: String(row[idxNhanSu.DonVi] || '').trim(),
                LoaiHD: String(row[idxNhanSu.LoaiHD] || '').trim(),
                KhuVuc: normalizeLocation(row[idxNhanSu.KhuVuc])
            };
        });
    } catch (e) {
        Logger.log("⚠️ CẢNH BÁO: Không đọc được DataNhanSu fallback: " + e.message);
    }

    const locationNormalized = location && location !== 'All' ? normalizeLocation(location) : null;

    // 3. STORAGE STRUCTURE
    const createMetrics = () => ({
        HSBac: 0, HSBacBL: 0, HSChucVu: 0, HSVượtKhung: 0, HSNganh: 0, HSThamNien: 0, HSDocHai: 0, HSTrachNhiem: 0, HSTuVe: 0,
        TongLuong: 0, BHXH: 0, BHYT: 0, BHTN: 0, KPCD: 0, NuocNgoai: 0, NghiBHXH: 0,
        TamUngTamGiu: 0, QuyXH: 0, GiamTru: 0, BHTra: 0, SoTienLinh: 0
    });

    const groups = {
        'BIEN_CHE': { label: 'BIÊN CHẾ', data: {} },
        'HD_DAI_HAN': { label: 'HỢP ĐỒNG DÀI HẠN', data: {} },
        'HD_68': { label: 'HỢP ĐỒNG 68', data: {} },
        'HD_VU_VIEC': { label: 'HỢP ĐỒNG VỤ VIỆC', data: {} }
    };

    let matchedRows = 0;
    let masterMatched = 0;
    let groupMatched = 0;
    // Keep the exact allocation selected for each salary employee.  Truy lĩnh/truy thu
    // must reuse this mapping instead of attempting a second, potentially different lookup.
    const allocationByEmployee = {};

    dataLuong1Raw.slice(1).forEach((row, index) => {
        if (String(row[idxL1.KyLuong]).trim() !== monthStr) return;



        // Lọc bỏ trường hợp nghỉ thai sản / không hưởng lương (Thực lĩnh/Tổng lương 1 rỗng)
        const thucLinhVal = row[idxL1.TongLuong1];
        if (thucLinhVal === '' || thucLinhVal === null || thucLinhVal === undefined) return;
        const tongLuong1 = parseNumber(thucLinhVal);
        if (tongLuong1 <= 0 || isNaN(tongLuong1)) return;

        matchedRows++;

        const maRaw = row[idxL1.MaCB];
        const ma = (maRaw && String(maRaw).trim()) || null;

        let loaiHD = String(row[idxL1.LoaiHD] || '').trim();
        const donViRaw = String(row[idxL1.DonVi] || '').trim();

        // Xác định khu vực chính thức của cán bộ (ưu tiên tra từ DataChotNSThang) để lọc đồng bộ
        let rowLocation = normalizeLocation(row[31]); // Cột AF: Khu vực trong DataLuong1
        if (ma && mapChotNS[ma] && mapChotNS[ma].KhuVuc) {
            rowLocation = mapChotNS[ma].KhuVuc;
        }
        if (locationNormalized && rowLocation !== locationNormalized) return;

        let maDV = '';
        if (ma && mapChotNS[ma]) {
            let rawCode = String(mapChotNS[ma].MaDonVi || mapChotNS[ma].TenDonVi || '').trim();
            if (rawCode && !/^DV/i.test(rawCode)) {
                const codeMatch = rawCode.match(/^(\d+)(.*)$/);
                maDV = 'DV' + (codeMatch ? (codeMatch[1].length < 3 ? codeMatch[1].padStart(3, '0') : codeMatch[1]) + (codeMatch[2] || '') : rawCode);
            } else {
                maDV = rawCode;
            }
            
            // Chuẩn hóa loại hợp đồng từ DataChotNSThang để đồng bộ 100%
            const rawLhd = String(mapChotNS[ma].LoaiHD).toUpperCase().trim();
            if (rawLhd.includes('BIÊN CHẾ') || rawLhd === 'BC') loaiHD = 'Biên chế';
            else if (rawLhd.includes('68') || rawLhd.includes('LƯƠNG CỐ ĐỊNH')) loaiHD = 'HĐ 68';
            else if (rawLhd.includes('DÀI HẠN') || rawLhd.includes('THƯỜNG XUYÊN')) loaiHD = 'HĐ dài hạn';
            else if (rawLhd.includes('VỤ VIỆC') || rawLhd.includes('NGẮN HẠN')) loaiHD = 'HĐ vụ việc';
        } else {
            // Chuẩn hóa mã đơn vị: Chỉ pad thêm số 0 khi độ dài mã gốc < 3 ký tự (ví dụ: '2' hoặc '02' -> 'DV002', '7B' -> 'DV007B')
            // Giữ nguyên các mã có độ dài từ 3 ký tự trở lên (như '0091', '00A'...)
            const rawCode = donViRaw.split('-')[0].trim();
            maDV = 'DV' + rawCode;
            if (rawCode.length < 3) {
                const codeMatch = rawCode.match(/^(\d+)(.*)$/);
                if (codeMatch) {
                    maDV = 'DV' + codeMatch[1].padStart(3, '0') + (codeMatch[2] || '');
                }
            }
        }

        let mainKey = '';
        if (loaiHD === 'Biên chế') mainKey = 'BIEN_CHE';
        else if (loaiHD === 'HĐ dài hạn') mainKey = 'HD_DAI_HAN';
        else if (loaiHD === 'HĐ 68') mainKey = 'HD_68';
        else if (loaiHD === 'HĐ vụ việc') mainKey = 'HD_VU_VIEC';

        if (!mainKey) {
            if (matchedRows <= 5) Logger.log(`Dòng ${index + 2}: Không khớp Loại HD. Giá trị nhận được: "${loaiHD}"`);
            return;
        }
        groupMatched++;



        const master = mapMaster[maDV];

        if (mainKey !== 'HD_VU_VIEC') {
            if (!master) {
                if (matchedRows <= 5) Logger.log(`Dòng ${index + 2}: Không khớp Master. maDV: "${maDV}"`);
                return;
            }
            masterMatched++;
        }

        let subKey = '';
        let deptKey = '';
        if (mainKey === 'HD_68') {
            // HĐ 68: Phân loại theo Gián tiếp / Trực tiếp dựa trên LoaiDV của đơn vị
            subKey = (master && master.LoaiDV === 'Bộ phận quản lý') ? 'Gián tiếp' : 'Trực tiếp';
        } else if (mainKey === 'HD_VU_VIEC') {
            // HĐ vụ việc: Phân loại Gián tiếp / Trực tiếp, kèm chi tiết đơn vị
            // FR-03: Fallback nếu master undefined -> mặc định 'Trực tiếp'
            subKey = (master && master.LoaiDV === 'Bộ phận quản lý') ? 'Gián tiếp' : 'Trực tiếp';
            const chotNS = ma && mapChotNS[ma];
            const maDonVi = String((chotNS && chotNS.MaDonVi) || maDV || '').trim().replace(/^DV/i, '');
            const tenDonVi = String((chotNS && chotNS.TenDonVi) || '').trim();
            deptKey = maDonVi && tenDonVi ? `${maDonVi}-${tenDonVi}` : (maDonVi || tenDonVi);
        } else {
            subKey = master.LoaiDV;
            deptKey = master.NhomDV;
        }

        if (ma) allocationByEmployee[ma] = { mainKey, subKey, deptKey };

        if (!groups[mainKey].data[subKey]) groups[mainKey].data[subKey] = {};

        if (!groups[mainKey].data[subKey][deptKey]) groups[mainKey].data[subKey][deptKey] = createMetrics();

        const m = groups[mainKey].data[subKey][deptKey];
        m.HSBac += parseNumber(row[idxL1.HSBac]);
        m.HSBacBL += parseNumber(row[idxL1.HSBacBL]);
        
        m.HSChucVu += parseNumber(row[idxL1.HSChucVu]);
        m.HSVượtKhung += parseNumber(row[idxL1.HSVượtKhung]);
        m.HSNganh += parseNumber(row[idxL1.HSNganh]);
        m.HSThamNien += parseNumber(row[idxL1.HSThamNien]);
        m.HSDocHai += parseNumber(row[idxL1.HSDocHai]);
        m.HSTrachNhiem += parseNumber(row[idxL1.HSTrachNhiem]);
        m.HSTuVe += parseNumber(row[idxL1.HSTuVe]);
        m.TongLuong += parseNumber(row[idxL1.TongLuong]);
        m.BHXH += parseNumber(row[idxL1.BHXH]);
        m.BHYT += parseNumber(row[idxL1.BHYT]);
        m.BHTN += parseNumber(row[idxL1.BHTN]);
        m.KPCD += parseNumber(row[idxL1.KPCD]);
        m.NuocNgoai += parseNumber(row[idxL1.NuocNgoai]);
        m.NghiBHXH += parseNumber(row[idxL1.NghiBHXH]);
        m.QuyXH += parseNumber(row[idxL1.TruKhac]);
    });
    Logger.log(`Kết quả lọc: Tìm thấy ${matchedRows} dòng tháng ${monthStr}. Khớp Master: ${masterMatched}. Khớp Nhóm: ${groupMatched}`);

    // Apply insurance arrears/recoveries directly to the existing "HĐ dài hạn - Bộ phận trực tiếp"
    // aggregate. This keeps the report layout unchanged while reconciling it with accounting.
    try {
        const ssTruyThu = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.TRUY_THU_LUONG_1);
        const shTruyThu = ssTruyThu.getSheetByName(GLOBAL_CONFIG.SHEETS.DATA_TRUY_THU);
        const truyValues = shTruyThu ? shTruyThu.getDataRange().getValues() : [];
        const hTruy = truyValues[0] || [];
        const idxTruy = {
            Ky: getIdx(hTruy, ['Kỳ trả lương', 'Kỳ lương', 'Ky']),
            Ma: getIdx(hTruy, ['Mã nhân sự', 'Mã CB', 'MaNS', 'Ma']),
            BHXH: getIdx(hTruy, ['BHXH']),
            BHYT: getIdx(hTruy, ['BHYT']),
            BHTN: getIdx(hTruy, ['BHTN'])
        };
        let adjustedBHXH = 0;

        truyValues.slice(1).forEach(row => {
            if (String(row[idxTruy.Ky] || '').trim() !== monthStr) return;
            const ma = String(row[idxTruy.Ma] || '').trim();
            let allocation = allocationByEmployee[ma];
            if (!allocation) {
                const fallback = mapChotNS[ma] || mapNhanSu[ma];
                if (!fallback) return;
                if (locationNormalized && fallback.KhuVuc && fallback.KhuVuc !== locationNormalized) return;
                
                // Xác định mainKey dựa trên Loại HĐ tương tự như luồng chính
                let mainKey = '';
                let subKey = '';
                const rawLhd = String(fallback.LoaiHD || '').toUpperCase();
                if (rawLhd.includes('BIÊN CHẾ') || rawLhd === 'BC') {
                    mainKey = 'BIEN_CHE';
                } else if (rawLhd.includes('68') || rawLhd.includes('LƯƠNG CỐ ĐỊNH')) {
                    mainKey = 'HD_68';
                } else if (rawLhd.includes('DÀI HẠN') || rawLhd.includes('THƯỜNG XUYÊN')) {
                    mainKey = 'HD_DAI_HAN';
                } else if (rawLhd.includes('VỤ VIỆC') || rawLhd.includes('NGẮN HẠN')) {
                    mainKey = 'HD_VU_VIEC';
                }
                if (!mainKey) return;

                let maDV = String(fallback.MaDonVi || fallback.TenDonVi || '').trim();
                if (!mapMaster[maDV] && maDV && !/^DV/i.test(maDV)) {
                    const codeMatch = maDV.match(/^(\d+)(.*)$/);
                    maDV = 'DV' + (codeMatch ? codeMatch[1].padStart(3, '0') + (codeMatch[2] || '') : maDV);
                }
                const master = mapMaster[maDV];
                
                if (mainKey === 'HD_68') {
                    subKey = (master && master.LoaiDV === 'Bộ phận quản lý') ? 'Gián tiếp' : 'Trực tiếp';
                    allocation = { mainKey, subKey, deptKey: subKey };
                } else if (mainKey === 'HD_VU_VIEC') {
                    // FR-03: fallback nếu master undefined -> mặc định 'Trực tiếp'
                    subKey = (master && master.LoaiDV === 'Bộ phận quản lý') ? 'Gián tiếp' : 'Trực tiếp';
                    const codePart = maDV.replace(/^DV/i, '');
                    const tenDV = String(fallback.TenDonVi || '').trim();
                    const deptKey = codePart && tenDV ? `${codePart}-${tenDV}` : (codePart || tenDV);
                    allocation = { mainKey, subKey, deptKey };
                } else {
                    if (!master) return;
                    if (!subKey) {
                        subKey = master.LoaiDV; // 'Bộ phận quản lý' hoặc 'Bộ phận trực tiếp'
                    }
                    allocation = { mainKey, subKey, deptKey: master.NhomDV };
                }
            }
            
            const groupData = groups[allocation.mainKey].data;
            if (!groupData[allocation.subKey]) groupData[allocation.subKey] = {};
            const subDepts = groupData[allocation.subKey];
            if (!subDepts[allocation.deptKey]) subDepts[allocation.deptKey] = createMetrics();
            const adjustment = subDepts[allocation.deptKey];
            if (!adjustment) return;

            // Cộng dồn truy lĩnh/thu
            adjustment.BHXH += parseNumber(row[idxTruy.BHXH]);
            adjustment.BHYT += parseNumber(row[idxTruy.BHYT]);
            adjustment.BHTN += parseNumber(row[idxTruy.BHTN]);
            adjustedBHXH += parseNumber(row[idxTruy.BHXH]);
        });
        Logger.log(`Phân bổ BHXH: điều chỉnh truy lĩnh/truy thu HĐ dài hạn trực tiếp: ${adjustedBHXH}`);
    } catch (e) {
        throw new Error('Không thể áp dụng điều chỉnh truy lĩnh/truy thu vào bảng phân bổ: ' + e.message);
    }

    // 4. BUILD OUTPUT ARRAY
    const result = [];

    function finalizeMetrics(m) {
        // Làm tròn các cột tiền của nhóm đến hàng đơn vị trước khi tính tổng giảm trừ và thực lĩnh
        m.TongLuong = Math.round(m.TongLuong || 0);
        m.BHXH = Math.round(m.BHXH || 0);
        m.BHYT = Math.round(m.BHYT || 0);
        m.BHTN = Math.round(m.BHTN || 0);
        m.KPCD = Math.round(m.KPCD || 0);
        m.NuocNgoai = Math.round(m.NuocNgoai || 0);
        m.NghiBHXH = Math.round(m.NghiBHXH || 0);
        m.TamUngTamGiu = Math.round(m.TamUngTamGiu || 0);
        m.QuyXH = Math.round(m.QuyXH || 0);

        m.GiamTru = m.BHXH + m.BHYT + m.BHTN + m.KPCD + m.NuocNgoai + m.NghiBHXH + m.TamUngTamGiu + m.QuyXH;
        m.BHTra = m.NghiBHXH;
        m.SoTienLinh = m.TongLuong - m.GiamTru;
    }

    function addRowToTable(stt, content, m) {
        if (!m) {
            result.push([stt, content, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
            return;
        }
        finalizeMetrics(m);
        result.push([
            stt, content,
            m.HSBac, m.HSBacBL, m.HSChucVu, m.HSVượtKhung, m.HSNganh, m.HSThamNien, m.HSDocHai, m.HSTrachNhiem, m.HSTuVe,
            m.TongLuong, m.BHXH, m.BHYT, m.BHTN, m.KPCD, m.NuocNgoai, m.NghiBHXH,
            m.TamUngTamGiu, m.QuyXH,
            m.GiamTru, m.BHTra, m.SoTienLinh
        ]);
    }

    const MAIN_ORDER = ['BIEN_CHE', 'HD_DAI_HAN', 'HD_68', 'HD_VU_VIEC'];
    const ROMAN = { 'BIEN_CHE': 'I', 'HD_DAI_HAN': 'II', 'HD_68': 'III', 'HD_VU_VIEC': 'IV' };
    const grandTotal = createMetrics();
    // FR-02: Lưu riêng subtotal cho HĐDH và HĐ68 để render dòng tổng hợp trung gian
    let subTotalHDDH = null;
    let subTotalHD68 = null;

    MAIN_ORDER.forEach(mainKey => {
        const groupData = groups[mainKey].data;
        if (Object.keys(groupData).length === 0) return;

        // Dòng tiêu đề La Mã (In hoa, Bold)
        addRowToTable(ROMAN[mainKey], groups[mainKey].label, null);

        const subTotal = createMetrics();

        if (mainKey === 'BIEN_CHE' || mainKey === 'HD_DAI_HAN') {
            // Nhóm I, II: phân theo Bộ phận quản lý / Bộ phận trực tiếp
            const subOrder = ['Bộ phận quản lý', 'Bộ phận trực tiếp'];

            subOrder.forEach((subKey, idx) => {
                const depts = groupData[subKey];
                if (!depts) return;

                const subMetrics = createMetrics();
                Object.values(depts).forEach(dm => {
                    // dm là dữ liệu thô tổng hợp của từng tổ, finalizeMetrics(dm) sẽ làm tròn đến hàng đơn vị
                    finalizeMetrics(dm);
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
        } else if (mainKey === 'HD_68') {
            // Nhóm III: phân theo Gián tiếp / Trực tiếp (không có chi tiết phòng ban)
            ['Gián tiếp', 'Trực tiếp'].forEach(subKey => {
                const depts = groupData[subKey];
                if (!depts) return;

                const subMetrics = createMetrics();
                Object.values(depts).forEach(dm => {
                    finalizeMetrics(dm);
                    Object.keys(subMetrics).forEach(k => subMetrics[k] += dm[k]);
                });
                addRowToTable('', subKey, subMetrics);
                Object.keys(subTotal).forEach(k => subTotal[k] += subMetrics[k]);
            });
        } else if (mainKey === 'HD_VU_VIEC') {
            // Nhóm IV: phân theo Gián tiếp / Trực tiếp, kèm chi tiết đơn vị
            ['Gián tiếp', 'Trực tiếp'].forEach(subKey => {
                const depts = groupData[subKey];
                if (!depts) return;

                const subMetrics = createMetrics();
                Object.values(depts).forEach(dm => {
                    finalizeMetrics(dm);
                    Object.keys(subMetrics).forEach(k => subMetrics[k] += dm[k]);
                });

                const deptKeys = Object.keys(depts);
                if (deptKeys.length > 0) {
                    // Hiển thị tiêu đề nhánh (Gián tiếp / Trực tiếp)
                    addRowToTable('', subKey, null);
                    addRowToTable('', 'Trong đó:', null);
                    deptKeys.forEach(deptName => {
                        addRowToTable('', deptName, depts[deptName]);
                    });
                    addRowToTable('', `Cộng ${subKey.toLowerCase()}`, subMetrics);
                } else {
                    // Nếu không có tổ cụ thể -> hiển thị dòng tổng
                    addRowToTable('', subKey, subMetrics);
                }

                Object.keys(subTotal).forEach(k => subTotal[k] += subMetrics[k]);
            });
        }

        // Dòng chốt cho mỗi nhóm
        const footerLabel = mainKey === 'BIEN_CHE' ? 'CỘNG BIÊN CHẾ' :
            mainKey === 'HD_VU_VIEC' ? 'CỘNG HĐ VỤ VIỆC' : null;
        if (footerLabel) {
            addRowToTable('', footerLabel, subTotal);
        }

        // Lưu subtotal riêng cho HĐDH và HĐ68 (FR-02)
        if (mainKey === 'HD_DAI_HAN') subTotalHDDH = subTotal;
        if (mainKey === 'HD_68') subTotalHD68 = subTotal;

        // Dòng tổng hợp trung gian sau Mục III (FR-02: display-only)
        if (mainKey === 'HD_68' && subTotalHDDH) {
            const combineTotal = createMetrics();
            Object.keys(combineTotal).forEach(k => {
                combineTotal[k] = (subTotalHDDH[k] || 0) + (subTotalHD68 ? subTotalHD68[k] : 0);
            });
            addRowToTable('', 'CỘNG HĐDH + HĐ 68', combineTotal);
        }

        // Cộng dồn vào grandTotal (mỗi nhóm 1 lần, KHÔNG cộng dòng display-only)
        Object.keys(grandTotal).forEach(k => grandTotal[k] += subTotal[k]);
    });

    if (result.length > 0) {
        addRowToTable('', 'Tổng cộng', grandTotal);
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
    if (sheet.getMaxColumns() < 23) {
        sheet.insertColumnsAfter(sheet.getMaxColumns(), 23 - sheet.getMaxColumns());
    }

    // Replace "Thiện nguyện" with "Quỹ XH" in headers (row 7-8) dynamically
    const headerRange = sheet.getRange(7, 1, 2, 23);
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
                    const titleRange = sheet.getRange("A4:W4");
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

                // Merge lại "Hệ số" mới (từ cột 3 đến cột 11) ở dòng 7
                try {
                    sheet.getRange(7, 3, 1, 9).merge().setValue("Hệ số").setHorizontalAlignment("center").setFontWeight("bold");
                } catch (e) { }

                // Cập nhật lại các dòng hiển thị số thứ tự cột và công thức ở dòng r + 1 (Dòng 8) và r + 2 (Dòng 9)
                sheet.getRange(r + 1, c).setValue(c);
                sheet.getRange(r + 1, c + 1).setValue(c + 1);
                for (let col = c + 2; col <= 23; col++) {
                    sheet.getRange(r + 1, col).setValue(col);
                }

                // Ghi đè các công thức tĩnh vào các cột tương ứng ở dòng r + 2 (Dòng 9)
                sheet.getRange(r + 2, 12).setValue("12 = (3+4+5+6+7+8+9+10+11) * 2.340.000");
                sheet.getRange(r + 2, 13).setValue("13 = (3+4+5+6+8) * 2.340.000");
                sheet.getRange(r + 2, 14).setValue("14 = (3+4+5+6+8) * 2.340.000");
                sheet.getRange(r + 2, 15).setValue("15 = (3+4+5+6+8) * 2.340.000");
                sheet.getRange(r + 2, 16).setValue("16 = (3+4+5+6+8) * 2.340.000");
                sheet.getRange(r + 2, 21).setValue("21 = 13+14+15+16+17+18+19+20");
                sheet.getRange(r + 2, 23).setValue("23 = 12 - 21");

                foundDH = true;
                break;
            }
        }
        if (foundDH) break;
    }

    const headerCleanupCols = Math.min(sheet.getMaxColumns(), 23);

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
        sheet.getRange("A7:A9").merge().setValue("Stt").setHorizontalAlignment("center").setVerticalAlignment("middle").setFontWeight("bold");
        sheet.getRange("B7:B9").merge().setValue("Nội dung").setHorizontalAlignment("center").setVerticalAlignment("middle").setFontWeight("bold");
        sheet.getRange("C7:K7").merge().setValue("Hệ số").setHorizontalAlignment("center").setVerticalAlignment("middle").setFontWeight("bold");
        sheet.getRange("L8:L9").merge().setValue("Tổng lương").setHorizontalAlignment("center").setVerticalAlignment("middle").setFontWeight("bold");
        sheet.getRange("M7:P7").merge().setValue("Các khoản phải nộp theo lương").setHorizontalAlignment("center").setVerticalAlignment("middle").setFontWeight("bold");
        sheet.getRange("Q7:R7").merge().setValue("Các khoản giảm trừ").setHorizontalAlignment("center").setVerticalAlignment("middle").setFontWeight("bold");
        sheet.getRange("S7:T7").merge().setValue("Trừ khác").setHorizontalAlignment("center").setVerticalAlignment("middle").setFontWeight("bold");
        sheet.getRange("U7:U9").merge().setValue("Cộng các khoản giảm trừ").setHorizontalAlignment("center").setVerticalAlignment("middle").setFontWeight("bold");
        sheet.getRange("V7:V9").merge().setValue("BH trả").setHorizontalAlignment("center").setVerticalAlignment("middle").setFontWeight("bold");
        sheet.getRange("W7:W9").merge().setValue("Số tiền được lĩnh").setHorizontalAlignment("center").setVerticalAlignment("middle").setFontWeight("bold");
    } catch (e) { }

    // Ghi lại các tiêu đề cột chi tiết ở dòng 8-9
    const detailHeaders = [
        "Lương\nngạch bậc", "HSB BL", "Chức vụ", "Vượt\nkhung", "P/c\nngành", "Thâm niên", "ĐH", "TN", "Tự vệ",
        "BHXH", "BHYT", "BHTN", "Đoàn phí\nCĐ", "N/ngoài", "Nghỉ BHXH", "Tạm ứng tạm\ngiữ", "Quỹ XH"
    ];
    [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20].forEach((col, idx) => {
        sheet.getRange(8, col, 2, 1).merge().setValue(detailHeaders[idx]);
    });

    [
        30, 145, 45, 38, 42, 42, 42, 42, 42, 42, 42, 72,
        58, 58, 58, 58, 52, 52, 38, 48, 54, 50, 80
    ].forEach((width, idx) => {
        sheet.setColumnWidth(idx + 1, width);
    });

    // Luôn định dạng và ghi đè dòng 10: số thứ tự cột + công thức diễn giải
    sheet.getRange(10, 1, 1, 23).clearContent().setNumberFormat('@');
    const indexAndFormulaRow = [
        "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11",
        "12=(3+4+5+6+7+8+9+10+11)\n*2.340.000",
        "13=(3+4+5+6+8)\n*2.340.000",
        "14=(3+4+5+6+8)\n*2.340.000",
        "15=(3+4+5+6+8)\n*2.340.000",
        "16=(3+4+5+6+8)\n*2.340.000",
        "17", "18", "19", "20",
        "21=\n13+14+15+16+17+18+19+20",
        "22",
        "23=12-21"
    ];
    sheet.getRange(10, 1, 1, 23).setValues([indexAndFormulaRow]);

    if (result.length > 0) {
        const dataRange = sheet.getRange(11, 1, result.length, 23);
        dataRange.setValues(result);

        // 1. Font & Body Size
        dataRange.setFontFamily('Arial').setFontSize(10.5);

        // 2. Number Format
        // Columns 3-11: Hệ số (3 decimal)
        sheet.getRange(11, 3, result.length, 9).setNumberFormat('0.000');
        // Columns 12-23: Tiền (Thousands separator)
        sheet.getRange(11, 12, result.length, 12).setNumberFormat('#,##0');

        // 3. Bold rows based on logic
        for (let i = 0; i < result.length; i++) {
            const rowIdx = 11 + i;
            const stt = String(result[i][0] || '').trim();
            const content = String(result[i][1] || '').trim();
            const contentLower = content.toLowerCase();

            // Bold if STT is present (I, II, III, IV, 1, 2...) OR contains "cộng", "tổng cộng" (bất kể hoa/thường)
            const isBold = stt !== '' ||
                contentLower.includes('cộng') ||
                contentLower.includes('tổng cộng');

            sheet.getRange(rowIdx, 1, 1, 23).setFontWeight(isBold ? 'bold' : 'normal');
        }

        // 4. Alignment
        sheet.getRange(11, 1, result.length, 1).setHorizontalAlignment('center'); // STT center
    }

    // Header Title
    const monthParts = monthStr.substring(1).split('.');
    const month = parseInt(monthParts[0]);
    const year = monthParts[1];
    sheet.getRange("A1:W3").setFontSize(12); // Đảm bảo các tiêu đề trên (nếu có) là size 12
    try {
        const titleRange = sheet.getRange("A4:W4");
        const merges = titleRange.getMergedRanges();
        for (let i = 0; i < merges.length; i++) {
            merges[i].breakApart();
        }
    } catch (e) { }
    sheet.getRange("A4:W4").merge().setValue(`THÁNG ${month < 10 ? '0' + month : month} NĂM ${year}`)
        .setFontWeight('bold').setFontSize(12).setHorizontalAlignment('center');

    // ====== BƯỚC CUỐI: TẠO ĐƯỜNG KẺ BẢNG ======
    const totalTableRows = result.length + 4; // Header 7-10 + Data
    const finalTableRange = sheet.getRange(7, 1, totalTableRows, 23);
    // 1. Viền ngoài và kẻ dọc: Nét liền (SOLID)
    finalTableRange.setBorder(true, true, true, true, true, null, 'black', SpreadsheetApp.BorderStyle.SOLID);
    // 2. Kẻ ngang nội dung: Nét đứt (DOTTED)
    finalTableRange.setBorder(null, null, null, null, null, true, 'black', SpreadsheetApp.BorderStyle.DOTTED);
    // 3. Header (Dòng 7-10): Nét liền toàn bộ
    sheet.getRange(7, 1, 4, 23).setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.SOLID)
        .setFontWeight('bold').setFontSize(11).setHorizontalAlignment('center').setVerticalAlignment('middle');
    sheet.getRange(8, 1, 3, 23).setWrap(true);
    sheet.getRange(10, 1, 1, 23).setFontSize(7).setFontWeight('bold');
    // 4. Các dòng đặc biệt (Bold): Nét liền cho chân dòng
    for (let i = 0; i < result.length; i++) {
        const rowIdx = 11 + i;
        const stt = String(result[i][0] || '').trim();
        const content = String(result[i][1] || '').trim();
        const contentLower = content.toLowerCase();
        if (stt !== '' || contentLower.includes('cộng') || contentLower.includes('tổng cộng')) {
            sheet.getRange(rowIdx, 1, 1, 23).setBorder(null, null, true, null, null, null, 'black', SpreadsheetApp.BorderStyle.SOLID);
        }
    }

    // Chỉ giữ vùng báo cáo A:W, tránh cột X trống bị xuất ra Excel/PDF.
    const maxColumns = sheet.getMaxColumns();
    if (maxColumns > 23) {
        sheet.deleteColumns(24, maxColumns - 23);
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
        const lastCol = Math.min(sheet.getLastColumn(), 23);

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

/**
 * HÀM THỰC THI AUDIT: Bóc tách chi tiết từng nhân sự và phân loại vào các nhóm/dòng của Bảng Phân Bổ Tiền Lương & BHXH
 * Xuất kết quả trực tiếp ra Sheet "Audit_PhanBoLuongBHXH" trong file EXPORT_HT_PHAN_BO_LUONG_BHXH
 * 
 * @param {string} monthStr Kỳ lương cần audit (VD: 'T06.2026')
 * @param {string} location Khu vực cần audit (VD: 'Hà Nội', 'Phú Thọ', 'All')
 */
function auditChiTietPhanBoLuongBHXH(monthStr = 'T06.2026', location = 'Hà Nội') {
    Logger.log(`=================== BẮT ĐẦU AUDIT CHI TIẾT PHÂN BỔ TIỀN LƯƠNG & BHXH [${monthStr} - ${location}] ===================`);
    
    const EXPORT_FILE_ID = GLOBAL_CONFIG.FILES.EXPORT_HT_PHAN_BO_LUONG_BHXH;
    const AUDIT_SHEET_NAME = 'Audit_PhanBoLuongBHXH';

    try {
        const locationNormalized = location && location !== 'All' ? normalizeLocation(location) : null;

        const ssLuong1 = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.DATA_LUONG_1);
        const ssMaster = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.MASTER_DATA);

        // 1. Đọc Master Data (Setup!K:O)
        const sheetSetup = ssMaster.getSheetByName('Setup');
        if (!sheetSetup) throw new Error("Không tìm thấy sheet 'Setup' trong file Master Data");
        const dataMasterRaw = sheetSetup.getRange("K2:O" + Math.max(2, sheetSetup.getLastRow())).getValues();

        const mapMaster = {};
        dataMasterRaw.forEach(row => {
            const ma = String(row[0]).trim();
            if (ma) {
                mapMaster[ma] = {
                    TenDV: row[1],
                    NhomDV: String(row[3] || 'Khác').trim(), // Tên phòng ban
                    LoaiDV: String(row[4] || 'Bộ phận trực tiếp').trim() // Bộ phận quản lý / Bộ phận trực tiếp
                };
            }
        });

        // 2. Đọc DataChotNSThang
        const mapChotNS = {};
        try {
            const dataChotRaw = getSheetNSThang().getDataRange().getValues();
            if (dataChotRaw.length > 1) {
                const headerChot = dataChotRaw[0] || [];
                const idxChot = {
                    KyLuong: getIdx(headerChot, ['Kỳ lương', 'KyLuong', 'Ky']),
                    MaNS: getIdx(headerChot, ['Mã nhân sự', 'Mã NS', 'MaNS', 'Ma']),
                    HoTen: getIdx(headerChot, ['Họ và tên', 'Họ tên', 'HoTen', 'Tên']),
                    LoaiHD: getIdx(headerChot, ['Loại hợp đồng', 'LoaiHD']),
                    MaDonVi: getIdx(headerChot, ['Mã đơn vị', 'MaDonVi', 'MaBP']),
                    DonVi: getIdx(headerChot, ['Tên đơn vị', 'TenDonVi', 'Đơn vị', 'DonVi']),
                    KhuVuc: getIdx(headerChot, ['Khu vực', 'KhuVuc', 'Địa phương', 'Khu vuc', 'Địa bàn'])
                };
                const targetMonth = monthStr.replace(/^T/, '');
                dataChotRaw.slice(1).forEach(row => {
                    const kyRow = String(row[idxChot.KyLuong] || '').trim().replace(/^T/, '');
                    if (kyRow !== targetMonth) return;
                    const ma = String(row[idxChot.MaNS] || '').trim();
                    if (ma) {
                        const kvIdx = idxChot.KhuVuc !== -1 ? idxChot.KhuVuc : 38;
                        mapChotNS[ma] = {
                            MaDonVi: String(row[idxChot.MaDonVi] || '').trim(),
                            TenDonVi: String(row[idxChot.DonVi] || '').trim(),
                            HoTen: idxChot.HoTen !== -1 ? String(row[idxChot.HoTen] || '').trim() : '',
                            LoaiHD: String(row[idxChot.LoaiHD] || '').trim(),
                            KhuVuc: normalizeLocation(row[kvIdx])
                        };
                    }
                });
            }
        } catch (e) {
            Logger.log("⚠️ Lỗi đọc DataChotNSThang trong audit: " + e.message);
        }

        // 3. Đọc DataNhanSu Fallback
        const mapNhanSu = {};
        try {
            const shNhanSu = ssMaster.getSheetByName(GLOBAL_CONFIG.SHEETS.DATA_NHAN_SU);
            const valuesNhanSu = shNhanSu ? shNhanSu.getDataRange().getValues() : [];
            const headerNhanSu = valuesNhanSu[0] || [];
            const idxNhanSu = {
                Ma: getIdx(headerNhanSu, ['Mã nhân sự', 'Mã CB', 'Mã NS', 'MaNS', 'Ma']),
                HoTen: getIdx(headerNhanSu, ['Họ và tên', 'Họ tên', 'HoTen']),
                LoaiHD: getIdx(headerNhanSu, ['Loại hợp đồng', 'Loại HĐ', 'LoaiHD']),
                MaDonVi: getIdx(headerNhanSu, ['Mã đơn vị', 'Mã bộ phận', 'MaDonVi', 'MaBP']),
                DonVi: getIdx(headerNhanSu, ['Tên đơn vị', 'Đơn vị', 'DonVi']),
                KhuVuc: getIdx(headerNhanSu, ['Khu vực', 'KhuVuc', 'Địa phương', 'Khu vuc'])
            };
            valuesNhanSu.slice(1).forEach(row => {
                const ma = String(row[idxNhanSu.Ma] || '').trim();
                if (!ma) return;
                mapNhanSu[ma] = {
                    MaDonVi: String(row[idxNhanSu.MaDonVi] || '').trim(),
                    TenDonVi: String(row[idxNhanSu.DonVi] || '').trim(),
                    HoTen: idxNhanSu.HoTen !== -1 ? String(row[idxNhanSu.HoTen] || '').trim() : '',
                    LoaiHD: String(row[idxNhanSu.LoaiHD] || '').trim(),
                    KhuVuc: normalizeLocation(row[idxNhanSu.KhuVuc])
                };
            });
        } catch (e) {
            Logger.log("⚠️ Lỗi đọc DataNhanSu fallback: " + e.message);
        }

        // 4. Bóc tách DataLuong1
        const sheetL1 = ssLuong1.getSheetByName(GLOBAL_CONFIG.SHEETS.DATA_LUONG_1);
        if (!sheetL1) throw new Error(`Không tìm thấy sheet '${GLOBAL_CONFIG.SHEETS.DATA_LUONG_1}'`);
        const dataLuong1Raw = sheetL1.getDataRange().getValues();
        const hL1 = dataLuong1Raw[0] || [];
        const idxL1 = {
            KyLuong: getIdx(hL1, ['Kỳ lương', 'Ky']),
            MaCB: getIdx(hL1, ['Mã CB', 'Mã nhân sự', 'MaNS', 'Ma', 'Mã NS']),
            HoTen: getIdx(hL1, ['Họ và tên', 'Họ tên', 'HoTen']),
            LoaiHD: getIdx(hL1, ['Loại HĐ', 'Loại hợp đồng', 'LoaiHD']),
            DonVi: getIdx(hL1, ['Đơn vị', 'DonVi', 'Mã đơn vị', 'Mã ĐV']),
            HSBac: getIdx(hL1, ['HS bậc', 'HS Bậc', 'HSBac']),
            HSBacBL: getIdx(hL1, ['HS bậc BL', 'HSBacBL']),
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

        const auditRows = [];

        dataLuong1Raw.slice(1).forEach(row => {
            if (String(row[idxL1.KyLuong]).trim() !== monthStr) return;

            const thucLinhVal = row[idxL1.TongLuong1];
            if (thucLinhVal === '' || thucLinhVal === null || thucLinhVal === undefined) return;
            const tongLuong1 = parseNumber(thucLinhVal);
            if (tongLuong1 <= 0 || isNaN(tongLuong1)) return;

            const maRaw = row[idxL1.MaCB];
            const ma = (maRaw && String(maRaw).trim()) || '';
            if (!ma) return;

            let loaiHD = String(row[idxL1.LoaiHD] || '').trim();
            const donViRaw = String(row[idxL1.DonVi] || '').trim();

            let rowLocation = normalizeLocation(row[31]); // Cột AF
            if (ma && mapChotNS[ma] && mapChotNS[ma].KhuVuc) {
                rowLocation = mapChotNS[ma].KhuVuc;
            }
            if (locationNormalized && rowLocation !== locationNormalized) return;

            let maDV = '';
            let tenDonViDisplay = '';
            if (ma && mapChotNS[ma]) {
                let rawCode = String(mapChotNS[ma].MaDonVi || mapChotNS[ma].TenDonVi || '').trim();
                if (rawCode && !/^DV/i.test(rawCode)) {
                    const codeMatch = rawCode.match(/^(\d+)(.*)$/);
                    maDV = 'DV' + (codeMatch ? (codeMatch[1].length < 3 ? codeMatch[1].padStart(3, '0') : codeMatch[1]) + (codeMatch[2] || '') : rawCode);
                } else {
                    maDV = rawCode;
                }
                tenDonViDisplay = mapChotNS[ma].TenDonVi;
                const rawLhd = String(mapChotNS[ma].LoaiHD).toUpperCase().trim();
                if (rawLhd.includes('BIÊN CHẾ') || rawLhd === 'BC') loaiHD = 'Biên chế';
                else if (rawLhd.includes('68') || rawLhd.includes('LƯƠNG CỐ ĐỊNH')) loaiHD = 'HĐ 68';
                else if (rawLhd.includes('DÀI HẠN') || rawLhd.includes('THƯỜNG XUYÊN')) loaiHD = 'HĐ dài hạn';
                else if (rawLhd.includes('VỤ VIỆC') || rawLhd.includes('NGẮN HẠN')) loaiHD = 'HĐ vụ việc';
            } else {
                const rawCode = donViRaw.split('-')[0].trim();
                maDV = 'DV' + rawCode;
                if (rawCode.length < 3) {
                    const codeMatch = rawCode.match(/^(\d+)(.*)$/);
                    if (codeMatch) {
                        maDV = 'DV' + codeMatch[1].padStart(3, '0') + (codeMatch[2] || '');
                    }
                }
                tenDonViDisplay = donViRaw;
            }

            let mainLabel = '';
            if (loaiHD === 'Biên chế') mainLabel = 'I. Biên chế';
            else if (loaiHD === 'HĐ dài hạn') mainLabel = 'II. HĐ dài hạn';
            else if (loaiHD === 'HĐ 68') mainLabel = 'III. HĐ 68';
            else if (loaiHD === 'HĐ vụ việc') mainLabel = 'IV. HĐ vụ việc';
            else mainLabel = `Khác (${loaiHD})`;

            const master = mapMaster[maDV];
            let subLabel = '';
            let deptLabel = '';

            if (loaiHD === 'HĐ 68') {
                subLabel = (master && master.LoaiDV === 'Bộ phận quản lý') ? 'Gián tiếp' : 'Trực tiếp';
                deptLabel = subLabel;
            } else if (loaiHD === 'HĐ vụ việc') {
                // FR-03: fallback nếu master undefined -> mặc định 'Trực tiếp'
                subLabel = (master && master.LoaiDV === 'Bộ phận quản lý') ? 'Gián tiếp' : 'Trực tiếp';
                const chotNS = ma && mapChotNS[ma];
                const maDonVi = String((chotNS && chotNS.MaDonVi) || maDV || '').trim().replace(/^DV/i, '');
                const tenDonVi = String((chotNS && chotNS.TenDonVi) || '').trim();
                deptLabel = maDonVi && tenDonVi ? `${maDonVi}-${tenDonVi}` : (maDonVi || tenDonVi || 'Khác');
            } else {
                subLabel = master ? master.LoaiDV : 'Bộ phận trực tiếp';
                deptLabel = master ? master.NhomDV : 'Khác';
            }

            const dongPhanBo = `${mainLabel} -> ${subLabel} -> ${deptLabel}`;

            const hsBac = parseNumber(row[idxL1.HSBac]);
            const hsBacBL = parseNumber(row[idxL1.HSBacBL]);
            const hsChucVu = parseNumber(row[idxL1.HSChucVu]);
            const hsVuotKhung = parseNumber(row[idxL1.HSVượtKhung]);
            const hsNganh = parseNumber(row[idxL1.HSNganh]);
            const hsThamNien = parseNumber(row[idxL1.HSThamNien]);
            const hsDocHai = parseNumber(row[idxL1.HSDocHai]);
            const hsTrachNhiem = parseNumber(row[idxL1.HSTrachNhiem]);
            const hsTuVe = parseNumber(row[idxL1.HSTuVe]);
            const tongLuong = parseNumber(row[idxL1.TongLuong]);
            const bhxh = parseNumber(row[idxL1.BHXH]);
            const bhyt = parseNumber(row[idxL1.BHYT]);
            const bhtn = parseNumber(row[idxL1.BHTN]);
            const kpcd = parseNumber(row[idxL1.KPCD]);
            const nuocNgoai = parseNumber(row[idxL1.NuocNgoai]);
            const nghiBHXH = parseNumber(row[idxL1.NghiBHXH]);
            const quyXH = parseNumber(row[idxL1.TruKhac]);
            const giamTru = bhxh + bhyt + bhtn + kpcd + nuocNgoai + nghiBHXH + quyXH;
            const bhTra = nghiBHXH;
            const soTienLinh = tongLuong - giamTru;

            const hoTen = (mapChotNS[ma] && mapChotNS[ma].HoTen) || (mapNhanSu[ma] && mapNhanSu[ma].HoTen) || (idxL1.HoTen !== -1 ? String(row[idxL1.HoTen] || '').trim() : '');

            auditRows.push({
                maNS: ma,
                hoTen: hoTen,
                maDV: maDV,
                donVi: tenDonViDisplay,
                nhomChinh: mainLabel,
                loaiBP: subLabel,
                nhomDV: deptLabel,
                dongPhanBo: dongPhanBo,
                nguon: 'Lương',
                hsBac, hsBacBL, hsChucVu, hsVuotKhung, hsNganh, hsThamNien, hsDocHai, hsTrachNhiem, hsTuVe,
                tongLuong, bhxh, bhyt, bhtn, kpcd, nuocNgoai, nghiBHXH,
                tamUng: 0, quyXH, giamTru, bhTra, soTienLinh
            });
        });

        // 5. Bóc tách điều chỉnh Truy Thu / Truy Lĩnh
        try {
            const ssTruyThu = SpreadsheetApp.openById(GLOBAL_CONFIG.FILES.TRUY_THU_LUONG_1);
            const shTruyThu = ssTruyThu.getSheetByName(GLOBAL_CONFIG.SHEETS.DATA_TRUY_THU);
            const truyValues = shTruyThu ? shTruyThu.getDataRange().getValues() : [];
            const hTruy = truyValues[0] || [];
            const idxTruy = {
                Ky: getIdx(hTruy, ['Kỳ trả lương', 'Kỳ lương', 'Ky']),
                Ma: getIdx(hTruy, ['Mã nhân sự', 'Mã CB', 'MaNS', 'Ma']),
                HoTen: getIdx(hTruy, ['Họ và tên', 'Họ tên', 'HoTen']),
                BHXH: getIdx(hTruy, ['BHXH']),
                BHYT: getIdx(hTruy, ['BHYT']),
                BHTN: getIdx(hTruy, ['BHTN']),
                ConNhan: getIdx(hTruy, ['Còn nhận', 'ConNhan', 'Con nhan'])
            };

            truyValues.slice(1).forEach(row => {
                if (String(row[idxTruy.Ky] || '').trim() !== monthStr) return;
                const ma = String(row[idxTruy.Ma] || '').trim();
                if (!ma) return;

                const fallback = mapChotNS[ma] || mapNhanSu[ma];
                if (locationNormalized && fallback && fallback.KhuVuc && fallback.KhuVuc !== locationNormalized) return;

                const bhxh = parseNumber(row[idxTruy.BHXH]);
                const bhyt = parseNumber(row[idxTruy.BHYT]);
                const bhtn = parseNumber(row[idxTruy.BHTN]);
                if (bhxh === 0 && bhyt === 0 && bhtn === 0) return;

                let loaiHD = fallback ? String(fallback.LoaiHD || '').trim() : '';
                let mainLabel = 'II. HĐ dài hạn';
                let subLabel = 'Bộ phận trực tiếp';
                let deptLabel = 'Khác';

                const rawLhd = loaiHD.toUpperCase();
                if (rawLhd.includes('BIÊN CHẾ') || rawLhd === 'BC') mainLabel = 'I. Biên chế';
                else if (rawLhd.includes('68') || rawLhd.includes('LƯƠNG CỐ ĐỊNH')) mainLabel = 'III. HĐ 68';
                else if (rawLhd.includes('DÀI HẠN') || rawLhd.includes('THƯỜNG XUYÊN')) mainLabel = 'II. HĐ dài hạn';
                else if (rawLhd.includes('VỤ VIỆC') || rawLhd.includes('NGẮN HẠN')) mainLabel = 'IV. HĐ vụ việc';

                let rawCode = fallback ? String(fallback.MaDonVi || fallback.TenDonVi || '').trim() : '';
                let maDV = '';
                if (rawCode && !/^DV/i.test(rawCode)) {
                    const codeMatch = rawCode.match(/^(\d+)(.*)$/);
                    maDV = 'DV' + (codeMatch ? (codeMatch[1].length < 3 ? codeMatch[1].padStart(3, '0') : codeMatch[1]) + (codeMatch[2] || '') : rawCode);
                } else {
                    maDV = rawCode;
                }
                const master = mapMaster[maDV];

                if (mainLabel === 'III. HĐ 68') {
                    subLabel = (master && master.LoaiDV === 'Bộ phận quản lý') ? 'Gián tiếp' : 'Trực tiếp';
                    deptLabel = subLabel;
                } else if (mainLabel === 'IV. HĐ vụ việc') {
                    subLabel = (master && master.LoaiDV === 'Bộ phận quản lý') ? 'Gián tiếp' : 'Trực tiếp';
                    const codePart = maDV.replace(/^DV/i, '');
                    const tenDV = fallback ? String(fallback.TenDonVi || '').trim() : '';
                    deptLabel = codePart && tenDV ? `${codePart}-${tenDV}` : (codePart || tenDV || 'Khác');
                } else {
                    subLabel = master ? master.LoaiDV : 'Bộ phận trực tiếp';
                    deptLabel = master ? master.NhomDV : 'Khác';
                }

                const dongPhanBo = `${mainLabel} -> ${subLabel} -> ${deptLabel}`;
                const conNhanVal = idxTruy.ConNhan !== -1 ? parseNumber(row[idxTruy.ConNhan]) : 1;
                const nguon = conNhanVal > 0 ? 'Truy lĩnh' : 'Truy thu';
                const hoTen = (fallback && fallback.HoTen) || (idxTruy.HoTen !== -1 ? String(row[idxTruy.HoTen] || '').trim() : '');

                auditRows.push({
                    maNS: ma,
                    hoTen: hoTen,
                    maDV: maDV,
                    donVi: (fallback && fallback.TenDonVi) || '',
                    nhomChinh: mainLabel,
                    loaiBP: subLabel,
                    nhomDV: deptLabel,
                    dongPhanBo: dongPhanBo,
                    nguon: nguon,
                    hsBac: 0, hsBacBL: 0, hsChucVu: 0, hsVuotKhung: 0, hsNganh: 0, hsThamNien: 0, hsDocHai: 0, hsTrachNhiem: 0, hsTuVe: 0,
                    tongLuong: 0, bhxh: bhxh, bhyt: bhyt, bhtn: bhtn, kpcd: 0, nuocNgoai: 0, nghiBHXH: 0,
                    tamUng: 0, quyXH: 0, giamTru: (bhxh + bhyt + bhtn), bhTra: 0, soTienLinh: -(bhxh + bhyt + bhtn)
                });
            });
        } catch (e) {
            Logger.log("⚠️ Lỗi bóc tách truy thu trong audit: " + e.message);
        }

        // Sắp xếp dữ liệu theo Dòng phân bổ, sau đó theo Mã NS
        auditRows.sort((a, b) => {
            if (a.dongPhanBo !== b.dongPhanBo) return a.dongPhanBo.localeCompare(b.dongPhanBo);
            return a.maNS.localeCompare(b.maNS);
        });

        // 6. Ghi kết quả vào Sheet "Audit_PhanBoLuongBHXH"
        const ssExport = SpreadsheetApp.openById(EXPORT_FILE_ID);
        let auditSheet = ssExport.getSheetByName(AUDIT_SHEET_NAME);
        if (!auditSheet) {
            auditSheet = ssExport.insertSheet(AUDIT_SHEET_NAME);
        }
        auditSheet.clear();
        auditSheet.getRange("A:AE").clearFormat();

        // Banner Tiêu đề
        auditSheet.getRange("A1:AE1").merge()
            .setValue(`BẢNG AUDIT CHI TIẾT PHÂN BỔ TIỀN LƯƠNG VÀ BHXH - THÁNG ${monthStr} - ĐỊA PHƯƠNG: ${location}`)
            .setFontSize(12).setFontWeight("bold").setBackground("#D1E7DD").setHorizontalAlignment("center");
        auditSheet.getRange("A2:AE2").merge()
            .setValue(`Thời gian export audit: ${new Date().toLocaleString("vi-VN")}`)
            .setFontSize(9).setFontStyle("italic").setHorizontalAlignment("center");

        // Headers 2 tầng (31 cột)
        const header1 = [
            "STT", "Mã NS", "Họ và tên", "Mã ĐV", "Tên đơn vị", "Nhóm HĐ chính", "Loại bộ phận", "Phòng ban hạch toán", "Dòng phân bổ báo cáo", "Nguồn",
            "Tiền lương & Các khoản phụ cấp theo lương", "", "", "", "", "", "", "", "", "Tổng lương",
            "Các khoản trích nộp theo lương", "", "", "", "", "",
            "Các khoản khấu trừ & Thực lĩnh", "", "", "", "Số tiền lĩnh"
        ];
        const header2 = [
            "", "", "", "", "", "", "", "", "", "",
            "HS bậc", "HS bậc BL", "HS chức vụ", "HS vượt khung", "HS ngành", "HS thâm niên", "HS độc hại", "HS trách nhiệm", "HS tự vệ", "",
            "BHXH", "BHYT", "BHTN", "KPCĐ", "Nước ngoài", "Nghỉ BHXH",
            "Tạm ứng/giữ", "Quỹ XH", "Tổng giảm trừ", "BH trả", ""
        ];

        auditSheet.getRange(4, 1, 1, header1.length).setValues([header1]);
        auditSheet.getRange(5, 1, 1, header2.length).setValues([header2]);

        const merges = [
            "A4:A5", "B4:B5", "C4:C5", "D4:D5", "E4:E5", "F4:F5", "G4:G5", "H4:H5", "I4:I5", "J4:J5",
            "K4:S4", "T4:T5", "U4:Z4", "AA4:AD4", "AE4:AE5"
        ];
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
            r.nhomChinh,
            r.loaiBP,
            r.nhomDV,
            r.dongPhanBo,
            r.nguon,
            r.hsBac,
            r.hsBacBL,
            r.hsChucVu,
            r.hsVuotKhung,
            r.hsNganh,
            r.hsThamNien,
            r.hsDocHai,
            r.hsTrachNhiem,
            r.hsTuVe,
            r.tongLuong,
            r.bhxh,
            r.bhyt,
            r.bhtn,
            r.kpcd,
            r.nuocNgoai,
            r.nghiBHXH,
            r.tamUng,
            r.quyXH,
            r.giamTru,
            r.bhTra,
            r.soTienLinh
        ]);

        if (tableData.length > 0) {
            auditSheet.getRange(6, 1, tableData.length, header1.length).setValues(tableData);
            // Định dạng số tiền
            auditSheet.getRange(6, 11, tableData.length, 21).setNumberFormat("#,##0");
            // Kẻ viền bảng
            auditSheet.getRange(6, 1, tableData.length, header1.length)
                .setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.SOLID);

            // Căn lề
            auditSheet.getRange(6, 1, tableData.length, 1).setHorizontalAlignment("center"); // STT
            auditSheet.getRange(6, 2, tableData.length, 1).setHorizontalAlignment("center"); // Mã NS
            auditSheet.getRange(6, 4, tableData.length, 1).setHorizontalAlignment("center"); // Mã ĐV
            auditSheet.getRange(6, 6, tableData.length, 1).setHorizontalAlignment("center"); // Nhóm chính
            auditSheet.getRange(6, 7, tableData.length, 1).setHorizontalAlignment("center"); // Loại BP
            auditSheet.getRange(6, 10, tableData.length, 1).setHorizontalAlignment("center"); // Nguồn
        }

        // Dòng Tổng Cộng
        const totalRowIdx = 6 + tableData.length;
        const totalSums = [];
        for (let colIdx = 10; colIdx < 31; colIdx++) {
            totalSums.push(auditRows.reduce((sum, r) => {
                const keys = [
                    'hsBac', 'hsBacBL', 'hsChucVu', 'hsVuotKhung', 'hsNganh', 'hsThamNien', 'hsDocHai', 'hsTrachNhiem', 'hsTuVe',
                    'tongLuong', 'bhxh', 'bhyt', 'bhtn', 'kpcd', 'nuocNgoai', 'nghiBHXH', 'tamUng', 'quyXH', 'giamTru', 'bhTra', 'soTienLinh'
                ];
                return sum + (r[keys[colIdx - 10]] || 0);
            }, 0));
        }

        auditSheet.getRange(totalRowIdx, 1, 1, 10).merge()
            .setValue(`TỔNG CỘNG (${tableData.length} bản ghi phát sinh)`).setHorizontalAlignment("right");
        auditSheet.getRange(totalRowIdx, 11, 1, 21).setValues([totalSums]).setNumberFormat("#,##0");

        auditSheet.getRange(totalRowIdx, 1, 1, header1.length)
            .setFontWeight("bold").setBackground("#FFF3CD").setBorder(true, true, true, true, true, true);

        // Chỉnh độ rộng các cột
        auditSheet.setColumnWidth(1, 45);   // STT
        auditSheet.setColumnWidth(2, 90);   // Mã NS
        auditSheet.setColumnWidth(3, 170);  // Họ và tên
        auditSheet.setColumnWidth(4, 75);   // Mã ĐV
        auditSheet.setColumnWidth(5, 170);  // Tên đơn vị
        auditSheet.setColumnWidth(6, 130);  // Nhóm chính
        auditSheet.setColumnWidth(7, 130);  // Loại BP
        auditSheet.setColumnWidth(8, 150);  // Phòng ban hạch toán
        auditSheet.setColumnWidth(9, 280);  // Dòng phân bổ báo cáo
        auditSheet.setColumnWidth(10, 80);  // Nguồn
        for (let c = 11; c <= 31; c++) auditSheet.setColumnWidth(c, 95);

        auditSheet.setFrozenRows(5);

        const sheetUrl = `https://docs.google.com/spreadsheets/d/${EXPORT_FILE_ID}/edit#gid=${auditSheet.getSheetId()}`;
        Logger.log(`✅ AUDIT PHÂN BỔ TIỀN LƯƠNG & BHXH HOÀN TẤT!`);
        Logger.log(`- Tổng số bản ghi: ${tableData.length}`);
        Logger.log(`- Link Sheet: ${sheetUrl}`);

        return {
            status: "success",
            month: monthStr,
            location: location,
            totalRecords: tableData.length,
            sheetUrl: sheetUrl
        };
    } catch (e) {
        Logger.log(`❌ LỖI TRONG QUÁ TRÌNH AUDIT PHÂN BỔ TIỀN LƯƠNG & BHXH: ${e.message} \n ${e.stack}`);
        return {
            status: "error",
            message: e.message
        };
    }
}
