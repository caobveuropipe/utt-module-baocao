# Workflow: Cập nhật Docs sau mỗi lần code

> ⭐ **Quy tắc vàng:** Sau mỗi lần code xong, gọi skill `skill-update-docs.md` để AI tự động cập nhật tài liệu.

---

## Cách sử dụng

### Cách 1: Gọi skill trực tiếp
Nói với AI:
```
@skill-update-docs.md
```

### Cách 2: Thủ công
Sau mỗi lần thay đổi code, cập nhật các file sau:

1. **Thay đổi UI (client/)?**
   → Cập nhật `.agent/changelog/CHANGELOG-UI.md`

2. **Thay đổi Backend (doGet/ hoặc doPost/)?**
   → Cập nhật `.agent/changelog/CHANGELOG-BACKEND.md`

3. **Quyết định kiến trúc quan trọng?**
   → Ghi vào `.agent/KNOWLEDGE_BASE.md`

4. **Thay đổi cấu trúc dự án?**
   → Cập nhật `.agent/CONTEXT.md` và `.agent/architecture/MASTER.md`

---

## Checklist nhanh

- [ ] Changelog phù hợp đã được cập nhật
- [ ] Knowledge Base đã ghi quyết định kiến trúc (nếu có)
- [ ] CONTEXT.md vẫn chính xác

---

## Lưu ý
- **KHÔNG** ghi chi tiết tính năng vào `KNOWLEDGE_BASE.md` (đó là việc của Changelog)
- **KHÔNG** ghi lý do kiến trúc vào Changelog (đó là việc của Knowledge Base)
- Mỗi entry Changelog phải ghi rõ **files bị ảnh hưởng**

---

*File này là hướng dẫn nội bộ cho workflow cập nhật tài liệu*
