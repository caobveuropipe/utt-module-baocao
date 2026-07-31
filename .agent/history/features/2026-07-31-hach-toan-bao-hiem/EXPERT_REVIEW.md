---
source: expert-rebuttal-codex
feature: hach-toan-bao-hiem
round: 2
timestamp: 2026-07-27T09:42:00+07:00
verdict: ⚠️ CÒN FINDING
---

# Expert Review - Codex Desktop

## Tóm tắt

- Findings mới: 1
- Findings đã dedupe/không lặp: 4 finding vòng trước đã được `REBUTTAL_LOG.md` ghi nhận accepted và phản ánh vào plan/task; không lặp lại.
- Vùng đã scan:
  - `.agent/active/hach-toan-bao-hiem/FEATURE_PLAN.md:17-119`
  - `.agent/active/hach-toan-bao-hiem/FEATURE_TASKS.md:17-48`
  - `.agent/active/hach-toan-bao-hiem/REBUTTAL_LOG.md:1-12`
  - `doGet/doGet_hachToanBaoHiem.js:17-100,125-165,202-260`
  - `doGet/doGet_hachToanLuongVaTruyLinh.js:60-111,880-941`

## Findings Cần Antigravity Phản Biện

### EFR-05: Task 1.1 đã được đánh dấu hoàn thành nhưng code chưa triển khai contract nhân sự đã yêu cầu [P1][High]

- Issue: Execution Log đánh dấu Task 1.1 hoàn thành, nhưng `processDataHachToanBaoHiem` vẫn dùng bản đồ nhân sự cũ, chỉ lưu `LoaiHD` và cờ `IsTrucTiep`. Nó không có `personnel`/`allPersonnelRecords`, không lưu `MaBP`, `KhuVuc`, `TrangThai`, và không có `getContractType`, `getUnitCode`, `getUnitType` đồng bộ với hạch toán lương. Vì vậy các task tiếp theo không có contract dữ liệu cần thiết để loại trạng thái NN, fallback nhân sự ngoài kỳ, hoặc áp dụng phân loại nhất quán.
- Evidence:
  - `FEATURE_TASKS.md:20` yêu cầu Task 1.1 xây `personnel` & `allPersonnelRecords` từ `DataChotNSThang`, lưu đủ `LoaiHD`, `MaBP`, `KhuVuc`, `TrangThai` và tích hợp ba helper đồng bộ; `FEATURE_TASKS.md:47` lại ghi task này là `done`.
  - `FEATURE_PLAN.md:52-58,89-91` xem `DataChotNSThang` và các helper/fallback này là contract bắt buộc cho toàn feature.
  - `doGet/doGet_hachToanBaoHiem.js:49-55` chỉ tìm index `KyLuong`, `MaNS`, `LoaiHD`, `MaDonVi`, `DonVi`; không có `TrangThai` hoặc header-driven `KhuVuc`.
  - `doGet/doGet_hachToanBaoHiem.js:57-79` tạo duy nhất `mapNhanSu[ma] = { LoaiHD, IsTrucTiep }`; không có `allPersonnelRecords`, `MaBP`, `KhuVuc`, `TrangThai`, hoặc fallback theo mã nhân sự.
  - `doGet/doGet_hachToanBaoHiem.js:125-139` phân loại trực tiếp bằng so sánh literal `LoaiHD` và trả storage ngay, thay vì helper chuẩn hóa; nó không thể dùng trạng thái NN.
  - `doGet/doGet_hachToanLuongVaTruyLinh.js:73-111,880-941` là implementation tham chiếu mà task yêu cầu đồng bộ: nó xây `personnel`/`allPersonnelRecords` và định nghĩa `getContractType`, `getUnitCode`, `getUnitType` với fallback.
- Impact: Nếu Task 1.2–1.4 được triển khai tiếp trên trạng thái hiện tại, code sẽ thiếu đầu vào để thực hiện đúng bản cập nhật đã approved, đặc biệt là tách Mục III theo `TrangThai` và giữ hành vi địa phương/fallback thống nhất. Checklist có thể cho thấy Phase 1 đang tiến triển trong khi contract cốt lõi chưa tồn tại.
- Required Fix: Đưa Task 1.1 về trạng thái chưa hoàn thành (hoặc bổ sung implementation thiếu) trước khi tiếp tục các task phụ thuộc. Trong `processDataHachToanBaoHiem`, xây `personnel` và `allPersonnelRecords` từ header của `DataChotNSThang`, lưu `LoaiHD`, `MaBP`, `KhuVuc`, `TrangThai`; áp dụng location filter giống module tham chiếu; rồi dùng các helper chuẩn hóa/fallback cho mọi lượt aggregate. Chỉ đánh dấu lại `done` khi phần này có regression evidence.

## Không Raise Vì Thiếu Evidence / Đã Được Cover

- Không lặp EFR về nguồn xác định `Đi công tác NN`: plan/task hiện tại đã chốt `TrangThai` từ `DataChotNSThang`.
- Không lặp EFR về cấu trúc Mục II và hai dòng tổng: các yêu cầu đó vẫn nằm rõ trong Phase 2, chưa có evidence implementation mới để review lại.
- Không raise mismatch dấu Truy lĩnh/Truy thu ở code cũ vì Task 1.2 vẫn đang chưa bắt đầu và đã cover trực tiếp việc sửa.

## Kết Luận

- Gửi file này cho `expert-rebuttal`.
- Chưa hội tụ trong phạm vi scan vì Task 1.1 đang được ghi completed nhưng chưa có evidence implementation tương ứng.
