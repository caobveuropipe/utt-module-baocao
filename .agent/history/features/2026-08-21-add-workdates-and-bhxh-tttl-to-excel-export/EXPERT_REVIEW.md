---
source: feature-review
feature: add-workdates-and-bhxh-tttl-to-excel-export
round: 1
timestamp: 2026-08-21T09:58:00+07:00
verdict: ✅ ĐỒNG Ý
---

# Expert Review: add-workdates-and-bhxh-tttl-to-excel-export

## Findings

### FR-01: Cấu hình alias dự phòng cho cột Ngày công tác và các cột BH TTTL
- **Severity**: Low
- **Confidence**: High
- **Issue**: Cột `Ngày công tác` trong sheet `DataChotNSThang` và các cột `BHXH`, `BHYT`, `BHTN`, `KPCĐ` trong sheet `DataTruyThuLinh` có thể có tiêu đề khác nhau giữa các phiên bản sheet (như `Ngày công tác`, `Ngày CT`, `Bảo hiểm xã hội`, `KPCĐ`, `Đoàn phí`, `KP CĐ`).
- **Evidence**: `doGet_tongHopExcel.js` sử dụng hàm `requireColumns` có tính năng fail-fast ném Exception nếu thiếu cột bắt buộc.
- **Impact**: Nếu sheet nguồn có tiêu đề hơi khác một chút, API export sẽ bị lỗi fail-fast.
- **Required Fix**: Định nghĩa mảng alias đầy đủ khi gọi `requireColumns`, ví dụ:
  - `[['Ngày công tác', 'Ngày CT', 'NgayCongTac']]`
  - `[['BHXH', 'Bảo hiểm xã hội', 'Bảo hiểm XH']]`
  - `[['BHYT', 'Bảo hiểm y tế']]`
  - `[['BHTN', 'Bảo hiểm thất nghiệp']]`
  - `[['KPCĐ', 'KP CĐ', 'Đoàn phí CĐ', 'Kinh phí công đoàn']]`

### FR-02: Đảm bảo kiểm tra kiểu Date trước khi parse chuỗi phân cách `|`
- **Severity**: Low
- **Confidence**: High
- **Issue**: Ô `Ngày công tác` trên Google Sheets đôi khi có thể bị Google Sheets tự động nhận diện thành Date Object thay vì String (hoặc ngược lại).
- **Evidence**: Một số nhân sự chỉ có 1 ngày duy nhất có thể bị Sheets format thành Date object.
- **Impact**: Nếu giá trị là Date Object mà gọi trực tiếp `.split('|')` sẽ gây runtime TypeError.
- **Required Fix**: Trong hàm `parseWorkDates(val)`, luôn ép kiểu `String(val || '').trim()` trước khi `.split('|')`. Nếu là Date Object thì format về `yyyy-mm-dd`.

## Khuyến nghị không chặn rollout
- Cần format kiểu chuỗi (text) hoặc `'yyyy-mm-dd` khi ghi vào ô Excel để tránh Excel tự động chuyển format ngày theo regional settings của máy client.
- Kiểm tra tính nhất quán thứ tự các cột mới trong header để thuận tiện nhất cho kế toán kiểm tra chéo.

## Cần xác thực thêm
- Không có.
