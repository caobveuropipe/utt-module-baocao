# Review Notes: filter-phu-tho-status-in-kho-bac

Ngày review: 2026-06-19

## Kết Luận

Không còn phát hiện blocker nghiêm trọng trong plan/tasks bản hiện tại.

Các vấn đề nghiêm trọng ở các vòng review trước đã được xử lý:

- Risk của `doGet_tongHopCk.js` đã nâng lên `Trung bình`.
- Phú Thọ thiếu cột `Trạng thái` đã được quy định phải throw lỗi/chặn xuất báo cáo.
- Test `Tất cả địa phương (All)` đã được bổ sung.
- Rollout đã phân biệt rõ `push-all.ps1` để test Dev URL (`/dev`) và `deploy-all.ps1` để phát hành chính thức.
- Test đổi tên cột `Trạng thái` đã có quy trình an toàn: dùng sheet copy hoặc restore header ngay sau test.

Plan có thể chuyển sang thực thi, miễn là implementation bám đúng các ràng buộc bên dưới.

## Watchpoints Khi Thực Thi

### 1. Check thiếu cột `Trạng thái` phải chạy trước khi đọc dữ liệu trạng thái

Khi thêm `idx7.TrangThai`, cần xác định `locationNormalized` đủ sớm để xử lý:

- Nếu `locationNormalized === 'Phú Thọ'` và `idx7.TrangThai === -1`: throw/trả lỗi rõ ràng.
- Với `All` hoặc địa phương khác: có thể log warning và không lọc theo trạng thái.

Không để code rơi vào kiểu `String(row[idx7.TrangThai] || '').trim()` trước khi đã xử lý trường hợp `idx7.TrangThai === -1` cho Phú Thọ.

### 2. Điều kiện lọc phải chỉ áp dụng cho Phú Thọ

Trong loop tạo `output`, cần giữ đúng thứ tự plan đã ghi:

1. Lọc theo địa phương.
2. Lấy `emp`.
3. Guard `if (!emp) return`.
4. Nếu `locationNormalized === 'Phú Thọ'` và `emp.trangThai` khác rỗng thì log và bỏ qua.

Không lọc nhân sự có trạng thái khi `location` là `All` hoặc Hà Nội.

### 3. Test đổi tên cột phải có cleanup bắt buộc

Vì `DataChotNSThang` là sheet dùng chung qua `getSheetNSThang()`, test đổi tên cột `Trạng thái` không được để lại trạng thái sai.

Ưu tiên dùng sheet copy/test. Nếu test trực tiếp trên sheet chung, phải restore header gốc ngay sau khi verify lỗi và test lại một lượt Phú Thọ xuất bình thường.

## Đối Chiếu Code Hiện Tại

- `doGet/Code.js`: `getSheetNSThang()` lấy sheet chung `DataChotNSThang`.
- `doGet/doGet_tongHopCk.js`: `doGet_taoBangTongHopCk` và `getPrintDataCk` đều dùng `doGet_tongHopDiNganHang`, nên đặt logic lọc ở đây là đúng.
- `doGet/doGet_function.js`: `normalizeLocation()` chuẩn hóa `Phú Thọ`, bao gồm cả alias `Vĩnh Phúc`.
- `doGet/doGet_tongHopBaoHiem.js`: cột `Trạng thái` đã được dùng cho nghiệp vụ `Đi NN`, nên việc đọc cột này từ `DataChotNSThang` là phù hợp với hệ thống hiện tại.

## Trạng Thái Review

Đạt yêu cầu review. Không cần chặn thực thi ở cấp plan.
