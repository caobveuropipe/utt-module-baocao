---
description: Quy trình phát triển, deploy và quản lý dự án Dikhobac
---

# 1. Cấu trúc dự án
Dự án được chia thành 2 module Apps Script riêng biệt:
- **Client (`/client`)**: Chứa giao diện người dùng (HTML/JS/CSS).
  - Script ID: `1rw3zCd_hWzZK3yxE-p5BAyqx7K9CXskeJPISwuX6GLi1TVTOzE3H5Rui`
- **Server API (`/doGet`)**: Chứa logic xử lý nghiệp vụ, API endpoint (`doGet`).
  - Script ID: `12SC6GgAoUWrKchLhjET9mt3k1Dqrb6RfMBK4zMXDIoqb3NoroVZjtViw`

# 2. Quy trình Deploy Code
## 2.1. Cập nhật Client (Giao diện)
Khi sửa đổi file trong thư mục `client` (ví dụ: `pg_general_2.html`, css...):
1. Mở terminal tại thư mục `client`: `cd client`
2. Push code lên Apps Script:
   ```bash
   clasp push
   ```
3. Nếu cần redeploy Web App (để update version):
   ```bash
   clasp deploy
   ```

## 2.2. Cập nhật Server (API Logic)
Khi sửa đổi file trong thư mục `doGet` (ví dụ: `doGet_tongHopLuong.js`, `Code.js`...):
1. Mở terminal tại thư mục `doGet`: `cd doGet`
2. Push code lên Apps Script:
   ```bash
   clasp push
   ```
3. Redeploy Web App (BẮT BUỘC để API mới có hiệu lực):
   ```bash
   clasp deploy --description "Update API"
   ```

# 3. Quy trình thêm Báo cáo mới (Server)
Để thêm một loại báo cáo mới (ví dụ `taoBangABC`):

1. **Tạo logic báo cáo**:
   - Tạo file mới trong `doGet`, ví dụ `doGet_taoBangABC.js`.
   - Viết hàm xử lý chính, ví dụ `function doGet_taoBangABC(monthStr) {...}`.
   - Hàm cần trả về URL file Excel/PDF kết quả hoăc JSON data.

2. **Đăng ký Route**:
   - Mở file `doGet/Code.js`.
   - Tìm object `ROUTE_MAP`.
   - Thêm route mới:
     ```javascript
     'taoBangABC': { fn: doGet_taoBangABC, desc: 'Tạo bảng ABC' },
     ```

3. **Deploy**:
   - Thực hiện bước 2.2 để push và deploy API.

# 4. Quy trình thêm tính năng Client
Để thêm nút bấm xuất báo cáo mới:

1. **Sửa UI**:
   - Mở `client/pg_general_2.html`.
   - Thêm Card hoặc Button mới.
   - Gán sự kiện onclick, ví dụ: `onclick="exportBangABC()"`

2. **Viết hàm gọi API**:
   - Mở `client/pg_general_4.html` (hoặc tạo file js mới nếu cần).
   - Viết hàm `exportBangABC()` gọi `fetch`:
     ```javascript
     const apiUrl = `${url_api_doGet}?type=taoBangABC&month=${monthStr}`;
     ```

3. **Deploy**:
   - Thực hiện bước 2.1 để update giao diện.

# 5. Lưu ý quan trọng
- Không sửa trực tiếp trên trình duyệt Apps Script để tránh conflicts.
- Luôn `clasp pull` trước khi bắt đầu phiên làm việc mới nếu có người khác cùng sửa.
- File `doGet/doGet_function.js` chỉ chứa các hàm tiện ích chung (`getData`, `getIdx`...). Không để logic nghiệp vụ cụ thể ở đây.

# 6. Danh sách Module Báo cáo (Server)
- `doGet_tongHopLuong.js`: Bảng tổng hợp lương.
- `doGet_tongHopCk.js`: Bảng đổ tài khoản ngân hàng (Logic xử lý `taoBangTongHopCk`).
- `doGet_tongHopBaoHiem.js`: Bảng tổng hợp bảo hiểm.
- `doGet_tongHopKhoanTru.js`: Các khoản trừ.
- `doGet_tongHopKPCD.js`: Kinh phí công đoàn.
