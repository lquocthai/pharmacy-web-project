-- ============================================================
-- Migration: Tách cột address từ bảng users ra bảng user_addresses
-- ============================================================

-- 1. Tạo bảng user_addresses
CREATE TABLE IF NOT EXISTS user_addresses (
    id              VARCHAR(36)     NOT NULL PRIMARY KEY,
    user_id         VARCHAR(36)     NOT NULL,
    full_name       VARCHAR(255)    NOT NULL,
    phone           VARCHAR(20)     NOT NULL,
    province        VARCHAR(100)    NOT NULL,
    district        VARCHAR(100)    NOT NULL,
    ward            VARCHAR(100)    NOT NULL,
    address_detail  VARCHAR(500)    NOT NULL,
    is_default      TINYINT(1)      NOT NULL DEFAULT 0,
    label           VARCHAR(20)     NOT NULL DEFAULT 'HOME',
    created_at      DATETIME(6),
    updated_at      DATETIME(6),
    CONSTRAINT fk_address_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. Migrate dữ liệu cũ từ cột address trong users
--    Những user có address không null → tạo 1 bản ghi trong user_addresses
INSERT INTO user_addresses (id, user_id, full_name, phone, province, district, ward, address_detail, is_default, label, created_at, updated_at)
SELECT
    UUID(),
    u.id,
    COALESCE(u.username, 'Người dùng'),
    COALESCE(u.phone, ''),
    '',                         -- province: để trống vì dữ liệu cũ không có
    '',                         -- district
    '',                         -- ward
    u.address,                  -- toàn bộ địa chỉ cũ vào addressDetail
    1,                          -- set làm default
    'HOME',
    NOW(),
    NOW()
FROM users u
WHERE u.address IS NOT NULL AND u.address != '';

-- 3. Xóa cột address khỏi bảng users
ALTER TABLE users DROP COLUMN IF EXISTS address;
