# Test Cases: Fix Print Table Overflow and Wrap (Báo Cáo Lương & BHXH)

> Feature: Tối ưu độ rộng cột tự động và đồng bộ cỡ chữ bản in báo cáo lương BHXH
> Ngày thực hiện: 2026-08-19
> Scope: `client/pg_general_3.html`

---

## 1. Mục Tiêu Kiểm Thử
- Đảm bảo các bảng báo cáo lương nhiều cột (Bảng Tổng hợp nộp BHXH 11 cột, Bảng Kê hạch toán lương & truy lĩnh 22 cột, Bảng Phân bổ tiền lương & BHXH 23 cột) khi in ra giấy/PDF không bị lấp số, mất đuôi số, hay đè lên viền kẻ ô.
- Đảm bảo các cột chỉ chứa số `0` có độ rộng tối thiểu hợp lý (bằng cột `PC TV` = 46px) để tiêu đề ngắt dòng tự nhiên, không bị rớt từng ký tự thành 1 dòng.
- Đảm bảo cỡ chữ đồng đều 100% trên toàn bộ bảng.
- Đảm bảo khổ giấy mặc định khi in Bảng Tổng hợp nộp BHXH là A4 Ngang (Landscape).

---

## 2. Danh Sách Test Cases

### TC-01: Auto-Fit độ rộng cột có số tiền lớn (14 chữ số) - Happy Path
- **Mục tiêu:** Kiểm tra các ô số tiền hàng chục tỷ (`14.428.580.284`, `12.247.286.244`, `10.565.493.214`, `10.504.751.962`, `13.552.052.376`).
- **Thực hiện:** Mở in BẢNG KÊ HẠCH TOÁN LƯƠNG VÀ TRUY LĨNH LƯƠNG.
- **Kỳ vọng:**
  - Cột `Tổng lương`, `LC 100%`, `LC hạch toán`, `Thực lĩnh` được cấp độ rộng 92px.
  - Số tiền 14 chữ số hiển thị trọn vẹn, không bị đè viền hoặc cắt đuôi số.
- **Kết quả:** ✅ PASS

### TC-02: Khóa độ rộng tối thiểu an toàn cho cột có tổng cộng = 0 (Edge Case)
- **Mục tiêu:** Kiểm tra các cột không phát sinh số tiền (`hưởng 40% đi NN`, `Tạm ứng`, `treo lương`, `Thuế TNCN`).
- **Thực hiện:** Quan sát tiêu đề và các ô số `0` của 4 cột này trên bản in.
- **Kỳ vọng:**
  - Độ rộng cột đạt tối thiểu 46px (bằng cột `PC TV`).
  - Tiêu đề ngắt dòng gọn gàng, đẹp mắt, không bị rớt từng ký tự thành từng dòng đơn lẻ.
- **Kết quả:** ✅ PASS

### TC-03: Đồng bộ cỡ chữ toàn bảng (Uniform Font Size)
- **Mục tiêu:** Kiểm tra độ đồng đều của cỡ chữ trên tất cả các hàng.
- **Thực hiện:** Đối chiếu cỡ chữ giữa các ô số nhỏ (1 chữ số `0`), số vừa (`1.905.579`), và số lớn (`14.428.580.284`) ở cả dòng chi tiết và dòng in đậm.
- **Kỳ vọng:**
  - Tất cả các ô số dùng chung một cỡ chữ chuẩn `6.6pt !important; letter-spacing: -0.2px;` trên bảng 22/23 cột.
  - Không có ô to ô nhỏ nhấp nhô.
- **Kết quả:** ✅ PASS

### TC-04: Khổ giấy mặc định A4 Ngang cho Bảng Tổng hợp nộp BHXH
- **Mục tiêu:** Kiểm tra hộp thoại in của trình duyệt khi mở in BẢNG TỔNG HỢP NỘP BẢO HIỂM XÃ HỘI, BHYT, BHTN.
- **Thực hiện:** Nhấn nút in báo cáo BHXH.
- **Kỳ vọng:**
  - Trình duyệt tự động nhận diện Orientation là **Landscape (Ngang)**.
  - Cột *Nội dung* mở rộng 210px thoáng đẹp.
  - Bảng phủ đều trang A4, lề in cân đối.
- **Kết quả:** ✅ PASS

---

## 3. Kết Luận
Bản in HTML của cả 3 bảng báo cáo đã được kiểm thử thực tế và đạt độ hoàn thiện cao, đáp ứng đầy đủ yêu cầu trình bày chuyên nghiệp trên khổ giấy A4.
