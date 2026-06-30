# Test Cases - Bảng tổng hợp bảo hiểm: Làm tròn và Công thức Excel

> Tạo ngày: 2026-06-30
> Liên kết feature: `insurance-rounding-formulas`
> Phạm vi: Feature

---

## 1. Mục tiêu kiểm thử

- Đảm bảo tất cả dữ liệu chi tiết đóng bảo hiểm được làm tròn đến hàng đơn vị trước khi tính tổng.
- Đảm bảo các ô tính tổng hiển thị đúng công thức Excel bằng dấu ngăn cách chấm phẩy (`;`) và dấu thập phân phẩy (,) tương thích với thiết lập vùng.
- Kiểm tra tính tương thích khi tải xuống file Excel (.xlsx), đảm bảo tự động tính toán lại khi thay đổi dữ liệu chi tiết.
- Kiểm tra ánh xạ mã LA/HW chính xác theo địa phương (Hà Nội, Phú Thọ).

## 2. Tiền điều kiện

- Có quyền chạy hàm kiểm thử trên môi trường Google Apps Script.
- Spreadsheet đích `EXPORT_DKB_TH_BH` đã được cấu hình trong `GLOBAL_CONFIG`.

## 3. Happy Path

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| HP-01 | Chạy hàm `test_doGet_taoBangTongHopbaoHiem()` với `targetLocation = "Hà Nội"`. | Dữ liệu được ghi thành công vào sheet `THBH`. Không có lỗi runtime. |
| HP-02 | Kiểm tra các cột NLĐ đóng bảo hiểm (E, F, G). | Các số liệu được điền đều là số nguyên (đã làm tròn về hàng đơn vị). |
| HP-03 | Kiểm tra cột Thành tiền NLĐ (Cột H). | Ô ở dòng `R` hiển thị công thức `=SUM(E[R]:G[R])`. |
| HP-04 | Kiểm tra cột Bảo hiểm Nhà trường đóng (I, J, K). | Hiển thị công thức tương ứng dạng: `=ROUND(E[R]*17,5/8; 0)`. |
| HP-05 | Kiểm tra cột Thành tiền Nhà trường (Cột L). | Ô hiển thị công thức `=SUM(I[R]:K[R])`. |
| HP-06 | Kiểm tra cột Tổng tiền (Cột M). | Ô hiển thị công thức `=H[R]+L[R]`. |
| HP-07 | Kiểm tra các dòng tổng nhóm (I, II, III, IV) cho cột E, F, G, I, J, K. | Hiển thị công thức `=SUBTOTAL(9; E[R1]:E[R3])`. |
| HP-08 | Kiểm tra dòng "Cộng" chính của bảng 1. | Hiển thị công thức `=SUBTOTAL(9; E7:E22)` cho các cột E, F, G, I, J, K. |
| HP-09 | Kiểm tra dòng "Cộng" cuối bảng và phần tách mã (LA, HW). | Dòng HW (II) hiển thị công thức `=E23-E26` (phép trừ trực tiếp), dòng Cộng cuối cùng hiển thị `=E26+E29` (phép cộng trực tiếp). |

## 4. Edge / Regression

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| RG-01 | Thay đổi địa phương `targetLocation = "Phú Thọ"` và xuất báo cáo. | Dòng Mã LA hiển thị `Mã LA0001A (đi nước ngoài)`, dòng Mã HW hiển thị `Mã HW0004A`. |
| RG-02 | Thay đổi địa phương `targetLocation = "Hà Nội"` và xuất báo cáo. | Dòng Mã LA hiển thị `Mã LA0001N (đi nước ngoài)`, dòng Mã HW hiển thị `Mã HW0013N`. |
| RG-03 | Tải file Excel (.xlsx) từ Google Sheet về máy, thay đổi một giá trị chi tiết ở cột E. | Các cột H, I, L, M và các dòng tổng tự động thay đổi giá trị tương ứng. |

## 5. Negative Cases

- *Không áp dụng.*

## 6. Security / Permission

- *Không áp dụng.*

## 7. Ghi chú regression

- Cần kiểm tra lại định dạng viền kẻ bảng (SOLID và DOTTED) của sheet sau khi chèn các dòng công thức xem có bị ảnh hưởng hay lỗi hiển thị không.
