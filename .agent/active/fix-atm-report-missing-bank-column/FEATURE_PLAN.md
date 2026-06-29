# Feature Plan - Sửa lỗi lệch cột và NaN trong Bảng Chuyển khoản (ATM)

## Mục tiêu
- Khắc phục lỗi hiển thị `NaN` trong cột "TỔNG ATM".
- Sửa lỗi thiếu cột "Tên ngân hàng" trong header làm lệch toàn bộ dữ liệu phía sau.
- Đảm bảo cấu trúc bảng (`colgroup`, `thead`, `tbody`, `tfoot`) đồng nhất với 15 cột dữ liệu.

## Phân tích lỗi
1. **Nguyên nhân chính**: Dữ liệu trả về từ server (`res.data`) hiện có 15 cột (đã thêm "Tên ngân hàng" vào vị trí index 4). Tuy nhiên, trong một số phiên bản code frontend, header chỉ có 14 cột (thiếu "Tên ngân hàng"), dẫn đến việc cột "TỔNG ATM" (header thứ 5) hiển thị dữ liệu của cột "Tên ngân hàng" (data index 4).
2. **Tại sao có NaN?**: Hàm `fmt` cố gắng chuyển đổi Tên ngân hàng (chuỗi) thành số (`Number("Vietcombank")`), kết quả là `NaN`.
3. **Lệch cột**: Cột "LƯƠNG NGÂN SÁCH" lại hiển thị dữ liệu của "TỔNG ATM", và cứ thế lệch tiếp.
4. **Lỗi Colgroup**: Trong code hiện tại, `colgroup` chỉ định nghĩa 14 cột, trong khi bảng có 15 cột.

## Các file bị ảnh hưởng
- `f:\Project\UoTT\Dikhobac\client\pg_general_3.html`

## Kế hoạch thực hiện

### Phase 1: Sửa cấu trúc Header và Colgroup
- Cập nhật `colgroup` để định nghĩa đủ 15 cột.
- Đảm bảo `thead` có đủ cột "TÊN NGÂN HÀNG" và nhãn "E".
- Đảm bảo `colspan` ở các dòng header và dòng tổng cộng là 15.

### Phase 2: Cải thiện tính an toàn của hàm định dạng
- Cập nhật hàm `fmt` để nếu giá trị không phải là số hợp lệ (như tên ngân hàng bị lệch vào), nó sẽ trả về chuỗi gốc hoặc rỗng thay vì `NaN`.

### Phase 3: Kiểm tra Backend (nếu cần)
- Đảm bảo `doGet_tongHopDiNganHang` luôn trả về đủ 15 cột và các giá trị số được parse cẩn thận. (Hiện tại backend có vẻ đã ổn, nhưng sẽ audit lại).

## Acceptance Criteria
- [ ] Bảng in ra có đủ cột "TÊN NGÂN HÀNG".
- [ ] Cột "TỔNG ATM" hiển thị đúng số tiền, không bị `NaN`.
- [ ] Các cột "LƯƠNG NGÂN SÁCH", "THU NHẬP TĂNG THÊM" hiển thị đúng dữ liệu tương ứng.
- [ ] Tổng cộng ở cuối bảng chính xác.

## Rủi ro
- Layout in ấn (Landscape) có thể bị chật do thêm cột. Cần điều chỉnh lại `width` của các cột trong `colgroup`.
