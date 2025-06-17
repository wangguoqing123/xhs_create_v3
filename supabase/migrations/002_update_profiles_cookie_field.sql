-- 更新 profiles 表结构：将 cookie_settings 改为 user_cookie
-- 这个迁移脚本用于更新现有的数据库

-- 1. 添加新的 user_cookie 字段
ALTER TABLE profiles ADD COLUMN user_cookie TEXT DEFAULT NULL;

-- 2. 删除旧的 cookie_settings 字段
ALTER TABLE profiles DROP COLUMN IF EXISTS cookie_settings;

-- 3. 更新注释
COMMENT ON COLUMN profiles.user_cookie IS '用户Cookie字符串，用于爬虫接口调用'; 