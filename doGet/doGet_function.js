/**
 * MODULE: TIỆN ÍCH & CHỨC NĂNG CHUNG (doGet_function)
 * 
 * MÔ TẢ:
 * File này chứa các hàm hỗ trợ (Utility) dùng chung.
 */

// ====== HELPER FUNCTIONS ======
function getData(idOrSs, sheetName) {
  if (!idOrSs) return [];
  try {
    let ss;
    if (typeof idOrSs === 'string') {
      ss = SpreadsheetApp.openById(idOrSs);
    } else {
      ss = idOrSs;
    }
    const sh = ss.getSheetByName(sheetName);
    return sh ? sh.getDataRange().getValues() : [];
  } catch (e) {
    Logger.log(`Error in getData for ${sheetName}: ${e.message}`);
    return [];
  }
}

/**
 * Lấy index của cột dựa trên tên hoặc danh sách tên (alias)
 * @param {Array} header Dòng đầu của sheet
 * @param {String|Array} names Tên cột hoặc mảng các tên cột thay thế
 */
function getIdx(header, names) {
  if (!header || !Array.isArray(header)) return -1;
  if (!names) {
    // Trả về object map toàn bộ header nếu không truyền names
    const map = {};
    header.forEach((name, i) => {
      if (name) {
        map[String(name).trim()] = i;
        // Alias không dấu/khoảng trắng để code linh hoạt hơn
        const alias = String(name).trim().replace(/\s+/g, '');
        if (!map[alias]) map[alias] = i;
      }
    });
    return map;
  }

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
  // Xử lý cả định dạng VN (chấm phân cách nghìn, phẩy phân cách thập phân)
  // Nhưng thường Data là chuẩn số, ta cứ replace phẩy/chấm cho chắc
  const str = String(val).replace(/,/g, '');
  const num = Number(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Chuẩn hóa tên địa phương/khu vực từ dữ liệu thô
 */
function normalizeLocation(kv) {
  if (!kv) return '';
  const v = String(kv).trim().toLowerCase();
  if (v.includes('hà nội') || v === 'hn') return 'Hà Nội';
  if (v.includes('phú thọ') || v === 'pt' || v.includes('vĩnh phúc') || v === 'vp') return 'Phú Thọ';
  return String(kv).trim();
}

// =================================================================================================
// --- CHỨC NĂNG: TỔNG HỢP TRỪ KPCĐ VÀ CÁC QUỸ ---
// =================================================================================================

// Các hàm tiện ích khác giữ nguyên...