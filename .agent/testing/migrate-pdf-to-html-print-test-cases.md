# Kịch bản kiểm thử: Di chuyển xuất báo cáo PDF sang Form in HTML (HTML Print)

> **Mã tính năng:** `migrate-pdf-to-html-print`
> **Phạm vi kiểm thử:** 8 báo cáo in ấn trên Client (độ lặp tiêu đề, font chữ, độ rộng cột, viền nét đứt, căn lề và giao diện Swal modal)

---

## 1. Hộp thoại modal SweetAlert (Xuất / In)
* **Mục đích:** Đảm bảo giao diện modal xuất hiện chuẩn và các nút hiển thị đúng định dạng.
* **Kịch bản kiểm thử:**
  1. Click chọn tháng/địa phương và nhấn in bất kỳ báo cáo nào trong 8 báo cáo.
  2. **Kết quả mong đợi:**
     - Modal Swal xuất hiện bình thường.
     - 3 nút **In**, **PDF**, và **Excel** nằm gọn gàng trên **cùng 1 dòng**.
     - Nút **In** (màu xanh lam, icon máy in) nằm ngoài cùng bên trái.
     - Nút **PDF** (đỏ, icon PDF) ở giữa.
     - Nút **Excel** (xanh lá, icon Excel) ở bên phải.
     - Cỡ chữ nhỏ gọn (`13px`) vừa vặn, không bị tràn hay rớt dòng.

---

## 2. In ấn 4 Báo cáo Tổng hợp (Portrait / Landscape)
* **Mục đích:** Đảm bảo bố cục tiêu đề trường, gạch chân và lề in chính xác.
* **Kịch bản kiểm thử:**
  1. Chọn "In" (HTML) đối với các bảng: *Tổng hợp lương*, *Tổng hợp bảo hiểm*, *Các khoản khấu trừ*, *Tổng hợp KPCĐ*.
  2. **Kết quả mong đợi:**
     - Tên trường `"TRƯỜNG ĐẠI HỌC CÔNG NGHỆ GTVT"` xuất hiện ở góc trái phía trên.
     - Có gạch chân dưới tên trường học (nếu chọn Cơ sở `All`/`Tất cả`, gạch chân dài khoảng 50% độ rộng của dòng chữ và căn giữa tương đối).
     - Nếu chọn cơ sở cụ thể (ví dụ: `Hà Nội`, `Phú Thọ`), thông tin Cơ sở xuống dòng dưới dạng `"Cơ sở [Tên cơ sở]"`, dòng cơ sở có gạch chân toàn bộ, còn dòng tên trường phía trên không gạch chân.
     - Tiêu đề bảng in ở phía dưới không bị chồng đè lên Tên trường học.

---

## 3. In ấn 4 Báo cáo Hạch toán & Phân bổ (Compact Tables)
* **Mục đích:** Kiểm tra font chữ Tahoma, in đậm phân cấp, dòng kẻ nét chấm và chống mất số.
* **Kịch bản kiểm thử:**
  1. Chọn "In" đối với các bảng: *Hạch toán bảo hiểm*, *Hạch toán KPCĐ*, *Phân bổ tiền lương và BHXH*, *Hạch toán lương và truy lĩnh*.
  2. **Kết quả mong đợi:**
     - **Font chữ:** Toàn bộ bảng in đổi sang font **Tahoma** nét dày, hiển thị rõ ràng khi in khổ siêu nhỏ.
     - **Ngắt trang:** Tiêu đề cột (header) được lặp lại tự động ở đầu mỗi trang tiếp theo (`thead { display: table-header-group; }`).
     - **Cỡ chữ & Chống mất số:**
       - Các dòng thường dùng cỡ chữ `6.2pt`, độ dày nét chữ trung bình `500`.
       - Các dòng tổng/in đậm dùng cỡ chữ `5.8pt` để chống tràn cột, không bị cắt bớt chữ số cuối.
     - **In đậm (Bold) phân cấp:**
       - Các dòng bắt đầu bằng chữ cái La Mã (`I.`, `II.`, `III.`), chữ cái thường (`A.`, `B.`, `C.`), số kèm dấu chấm (`1.`, `2.`), và dòng `Cộng`, `Tổng cộng` được in đậm (`bold`).
       - Các dòng chi tiết số thứ tự bình thường (`1`, `2`, `3`...) không in đậm.
     - **Đường kẻ bảng (Borders):**
       - Các dòng chi tiết thường sử dụng đường kẻ ngang nét chấm (`1px dotted`).
       - Dòng tiêu đề cột và các dòng tổng cộng sử dụng đường kẻ ngang nét liền (`1px solid`).
     - **Cột Số thứ tự (Số TT):** Được nhận diện chuẩn xác (kể cả khi hiển thị "Số TT", "STT") và tự động căn lề giữa cột. Cột Nội dung tự động căn trái.

---

*Cập nhật tự động bởi update-docs*
