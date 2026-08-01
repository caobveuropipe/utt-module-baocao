# Yêu cầu Thiết kế Bảng kê Hạch toán Lương và Truy lĩnh Lương (Tháng 6/2026)

Tài liệu này đặc tả chi tiết bối cảnh, cấu trúc dữ liệu, định dạng hiển thị và sự phân biệt giữa **Form In chính thức** và **Form Test đối chiếu** cho dự án UOTT Dikhobac.

---

## 1. Cấu trúc Cột (Columns Layout - Áp dụng chung cho 22 cột)
Bảng kê gồm 22 cột vật lý (từ cột A đến V trong Excel, tương ứng chỉ mục từ 0 đến 21 trong code):
* **Cột A (Nội dung)**: Tên diện hợp đồng hoặc phòng ban.
* **Cột B (Tổng lương, PC theo lương và truy lĩnh)**: Tổng cộng các khoản lương chính và phụ cấp.
* **Lương chính tháng T06.2026** (Gồm 3 cột):
  * **Cột C (LC 100%+H.số C.lệch B.lưu)**: Lương chính 100% + Hệ số chênh lệch bảo lưu.
  * **Cột D (Treo 60% NN+Th.sản)**: Treo 60% Nước ngoài + Thai sản.
  * **Cột E (LC hạch toán)**: Lương chính hạch toán (= Cột C - Cột D).
* **Các khoản phụ cấp theo lương** (Gồm 7 cột từ F đến L):
  * **Cột F (PC CV)**: Phụ cấp chức vụ.
  * **Cột G (PC VK)**: Phụ cấp vượt khung.
  * **Cột H (PC GV)**: Phụ cấp giảng viên/ngành.
  * **Cột I (PC TNGV)**: Phụ cấp thâm niên giảng viên.
  * **Cột J (PC ĐH)**: Phụ cấp đại học / độc hại.
  * **Cột K (PC TN)**: Phụ cấp trách nhiệm.
  * **Cột L (PC TV)**: Phụ cấp tự vệ.
* **Các khoản khấu trừ** (Gồm 9 cột từ M đến U):
  * **Cột M, N, O**: BHXH, BHYT, BHTN.
  * **Cột P (ĐPCĐ)**: Đoàn phí công đoàn.
  * **Cột Q (Quỹ XH)**: Quỹ xã hội.
  * **Cột R (hưởng 40% đi NN)**: Hưởng 40% đi nước ngoài.
  * **Cột S (Tạm ứng)**: Tạm ứng.
  * **Cột T (Treo lương)**: Chỉ áp dụng đối với nhân sự treo lương Phú Thọ.
  * **Cột U (Thuế TNCN)**: Thuế thu nhập cá nhân.
* **Cột V (Thực lĩnh)**: `= Lương chính hạch toán + Tổng phụ cấp - Tổng khấu trừ`. (Lưu ý: Thuế TNCN không khấu trừ trực tiếp tại dòng Thực lĩnh này mà được trừ tập trung ở mục D để cân hạch toán).

---

## 2. Đặc tả Form In Chính thức (Sheet: `Hạch toán - HN` và `Hạch toán - PT`)
Là form dùng để in ấn báo cáo chính thức nộp cơ quan chức năng, số liệu được tổng hợp phẳng ở cấp diện hợp đồng lớn, **không hiển thị phân rã phòng ban con**.

### Cấu trúc Hàng (Rows Structure):
```text
I. LƯƠNG NGẠCH BẬC
  1. Gián tiếp
    - Biên chế
    - HĐ dài hạn
    - HĐ dài hạn lương cố định
    - HĐ 68
    - Treo lương [Tên nhân sự] (Chỉ chèn động đối với Phú Thọ nếu có phát sinh nhân sự đi nước ngoài)
  2. Trực tiếp
    - Biên chế
    - HĐ dài hạn
    - HĐ dài hạn lương cố định
    - HĐ ngắn hạn lương cố định
II. TRUY LĨNH, TRUY THU
  1. Gián tiếp
    - Truy lĩnh (BC)
    - Truy thu (BC)
    - Truy lĩnh (HĐ 68)
    - Truy thu (HĐ 68)
    - Truy lĩnh (HĐ)
    - Truy thu (HĐ)
  2. Trực tiếp
    - Truy lĩnh (BC)
    - Truy lĩnh (HĐ)
Tổng lương ngạch bậc và truy lĩnh - Gián tiếp
Tổng truy lĩnh HĐ vụ việc - Gián tiếp (Lấy từ HĐ ngắn hạn Gián tiếp)
Tổng lương ngạch bậc và truy lĩnh - Trực tiếp
A. TỔNG LƯƠNG NGẠCH BẬC VÀ TRUY LĨNH, TRUY THU GT+TT
B. THU NHẬP TĂNG THÊM (Gồm 3 dòng: Thu nhập tăng thêm, Truy lĩnh, Truy thu)
C. ĂN CA (Gồm 3 dòng: Ăn ca, Truy lĩnh, Truy thu)
D. Thuế TNCN T5/2026 (Thuế của tháng trước đó)
TỔNG CỘNG: A+B+C-D
```

---

## 3. Đặc tả Form Test Đối chiếu (Sheet: `Test_ChiTietGTBC`)
Là form nháp dùng nội bộ để kiểm tra nguồn số liệu, giúp đối chiếu xem các diện hợp đồng lớn (như Biên chế, HĐ dài hạn) được lấy chính xác từ những phòng ban/bộ phận nào.

### Quy cách hiển thị:
Hiển thị thụt lề đầu dòng dạng ` - ` ngay dưới diện hợp đồng lớn tương ứng:
* **Biên chế** (Dòng tổng)
  * ` - Phòng Đào tạo` (Tiền phát sinh của riêng bộ phận này)
  * ` - Phòng Tổ chức cán bộ` (Tiền phát sinh của riêng bộ phận này)
  * ` - ...`
* **HĐ dài hạn** (Dòng tổng)
  * ` - Phòng Hành chính tổng hợp`
  * ` - ...`

---

## 4. Ràng buộc Kỹ thuật & Nghiệp vụ riêng biệt

### 4.1. Nhận dạng Lương cố định
* Nhân sự có `LuongCoDinh > 0` (cột AK / index 36 trong `DataChotNSThang`) sẽ được phân nhóm vào `"HĐ dài hạn lương cố định"` hoặc `"HĐ ngắn hạn lương cố định"` tương ứng (thay vì các dòng hợp đồng thường).

### 4.2. Treo lương đi nước ngoài (Phú Thọ)
* **Nhận diện**: Khu vực = Phú Thọ, trạng thái = "Đi NN" hoặc "Đi công tác NN".
* **Hạch toán**: Chèn dòng `"Treo lương [Tên nhân sự]"` trong nhóm 1. Gián tiếp. 
* **Số liệu**: Ghi nhận giá trị **dương** ở cột **Treo lương** (cột T - index 19) bằng đúng tổng số thực lĩnh phát sinh trước khi treo, và ghi số **âm** ở cột **Thực lĩnh** (cột V - index 21) để triệt tiêu thực nhận về 0.

### 4.3. Sự khác biệt Layout giữa 2 khu vực
* **Hà Nội (HN)**: Dòng trống xuất hiện tại dòng 2 (Row index 1), khiến Header 1 và Header 2 nằm ở dòng 3 & 4.
* **Phú Thọ (PT)**: Không có dòng trống tiêu đề, bắt đầu ngay từ dòng 1 & 2.

### 4.4. Quy tắc Deploy
* **Tuyệt đối không sử dụng tool tự động push/deploy** code lên cloud Apps Script trừ khi được User cho phép rõ ràng. User sẽ tự thực hiện deploy thủ công qua script `.\push-all.ps1`.
