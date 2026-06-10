-- ============================================================
-- V3: Refactor conversations table — Shared Inbox model
-- Chuyển từ PENDING/IN_PROGRESS/RESOLVED/CLOSED
-- sang mô hình Messenger/Zalo không có status
-- ============================================================

-- 1. Thêm các cột mới
ALTER TABLE conversations
    ADD COLUMN IF NOT EXISTS unread_count    INT         NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS user_avatar_url VARCHAR(512)         DEFAULT NULL;

-- 2. Xóa các cột cũ không còn dùng
--    Chạy từng lệnh để tránh lỗi nếu cột không tồn tại
ALTER TABLE conversations DROP INDEX IF EXISTS idx_conv_user_status;
ALTER TABLE conversations DROP INDEX IF EXISTS idx_conv_status;

-- Xóa cột cũ (comment nếu muốn giữ dữ liệu cũ để migration an toàn)
ALTER TABLE conversations
    DROP COLUMN IF EXISTS status,
    DROP COLUMN IF EXISTS pharmacist_id,
    DROP COLUMN IF EXISTS version,
    DROP COLUMN IF EXISTS updated_at;

-- 3. Tạo index mới cho shared inbox
-- Index theo userId để user load conversation của mình nhanh
CREATE INDEX IF NOT EXISTS idx_conv_user_id  ON conversations (user_id);
-- Index theo lastMessageAt để sort shared inbox nhanh
-- (idx_conv_last_msg đã tồn tại từ schema cũ, giữ nguyên)

-- 4. Cập nhật unread_count cho các conversation hiện có (để không bị null)
UPDATE conversations SET unread_count = 0 WHERE unread_count IS NULL;
