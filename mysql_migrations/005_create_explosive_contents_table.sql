-- ============================================
-- 爆款内容表迁移脚本
-- 用于note-rewrite页面的爆款内容管理
-- ============================================

-- 设置字符集和时区
SET NAMES utf8mb4;
SET time_zone = '+08:00';

-- ============================================
-- 爆款内容表
-- ============================================

CREATE TABLE explosive_contents (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()) COMMENT '爆款内容ID',
  title VARCHAR(500) NOT NULL COMMENT '内容标题',
  content TEXT NOT NULL COMMENT '内容正文',
  tags JSON DEFAULT ('[]') COMMENT '标签列表',
  industry VARCHAR(50) NOT NULL COMMENT '行业分类：decoration|beauty|parenting|food|travel|fashion|tech|education|lifestyle|fitness',
  content_type VARCHAR(50) NOT NULL COMMENT '内容形式：note|review|guide|case',
  source_urls JSON DEFAULT ('[]') COMMENT '来源链接列表，支持多个链接',
  cover_image VARCHAR(1000) DEFAULT NULL COMMENT '封面图片URL',
  likes INTEGER DEFAULT 0 COMMENT '点赞数',
  views INTEGER DEFAULT 0 COMMENT '浏览数',
  author VARCHAR(100) DEFAULT NULL COMMENT '作者',
  status ENUM('enabled', 'disabled') DEFAULT 'enabled' COMMENT '状态：enabled=启用，disabled=禁用',
  published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '笔记发布时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  -- 索引优化
  INDEX idx_explosive_contents_industry (industry),
  INDEX idx_explosive_contents_content_type (content_type),
  INDEX idx_explosive_contents_status (status),
  INDEX idx_explosive_contents_published_at (published_at DESC),
  INDEX idx_explosive_contents_created_at (created_at DESC),
  INDEX idx_explosive_contents_industry_type (industry, content_type),
  INDEX idx_explosive_contents_status_created (status, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='爆款内容表';

-- ============================================
-- 插入示例数据
-- ============================================

INSERT INTO explosive_contents (title, content, tags, industry, content_type, source_urls, cover_image, likes, views, author, status) VALUES
('装修避坑指南！5个装修雷区千万别踩', '装修是人生大事，但很多人都会踩坑。今天分享5个最容易踩的装修雷区：

1. 开关插座位置不合理
很多人装修时没有仔细考虑开关插座的位置，结果入住后发现各种不方便。

2. 防水工程偷工减料
防水是隐蔽工程，一旦出问题后果严重，千万不能省钱。

3. 水电改造不规范
水电改造关系到安全，一定要找专业师傅，按照规范施工。

4. 材料质量差
装修材料直接影响健康和使用寿命，不要贪便宜买劣质材料。

5. 施工队不靠谱
选择有资质、有经验的施工队，签订详细合同。

希望这些经验能帮到准备装修的朋友们！', 
'["装修", "避坑", "指南", "家装", "经验分享"]', 
'decoration', 
'guide', 
'["https://xiaohongshu.com/note/example1", "https://xiaohongshu.com/note/example2"]', 
'/placeholder.jpg', 
2580, 
15670, 
'装修小能手', 
'enabled'),

('平价好用的护肤品推荐！学生党必看', '作为一个试过无数护肤品的人，今天给大家推荐几款平价又好用的护肤品：

💧 洁面：氨基酸洁面乳
温和不刺激，适合敏感肌，价格也很亲民。

💧 水乳：玻尿酸爽肤水+保湿乳液
补水效果很好，性价比很高。

💧 精华：烟酰胺精华
美白效果明显，坚持用会有惊喜。

💧 面膜：补水面膜
一周2-3次，皮肤会变得水润有光泽。

💧 防晒：物理防晒霜
不会闷痘，适合日常使用。

这些产品都是我亲测有效的，推荐给预算有限的小伙伴们！', 
'["护肤", "平价", "学生党", "推荐", "美妆"]', 
'beauty', 
'review', 
'["https://xiaohongshu.com/note/example3"]', 
'/placeholder.jpg', 
4250, 
28900, 
'美妆达人小李', 
'enabled'),

('新手妈妈必看！宝宝睡眠训练全攻略', '宝宝不好好睡觉是很多新手妈妈的困扰，今天分享一些实用的睡眠训练方法：

🌙 建立睡前仪式
固定的睡前流程可以帮助宝宝建立睡眠信号。

🌙 营造睡眠环境
房间要保持安静、黑暗、温度适宜。

🌙 掌握睡眠信号
学会识别宝宝困倦的信号，及时安排睡觉。

🌙 循序渐进训练
不要操之过急，要有耐心，循序渐进。

🌙 保持一致性
训练过程中要保持方法的一致性。

记住，每个宝宝都是独特的，找到适合自己宝宝的方法最重要！', 
'["育儿", "睡眠训练", "新手妈妈", "宝宝", "经验分享"]', 
'parenting', 
'guide', 
'["https://xiaohongshu.com/note/example4", "https://xiaohongshu.com/note/example5"]', 
'/placeholder.jpg', 
3890, 
21300, 
'育儿专家妈妈', 
'enabled'),

('这家餐厅绝了！人均50吃到撑', '今天发现了一家超棒的餐厅，性价比真的太高了！

🍽️ 环境：装修很有特色，适合拍照
🍽️ 服务：服务员态度很好，上菜速度快
🍽️ 口味：菜品味道正宗，分量足
🍽️ 价格：人均50左右，性价比很高

推荐菜品：
- 招牌红烧肉：肥而不腻，入口即化
- 蒜蓉粉丝扇贝：新鲜美味
- 麻婆豆腐：麻辣鲜香
- 银耳莲子汤：清甜润燥

地址：XX路XX号
营业时间：11:00-22:00
电话：XXX-XXXX-XXXX

强烈推荐给吃货朋友们！', 
'["美食", "餐厅推荐", "性价比", "探店", "好吃"]', 
'food', 
'review', 
'["https://xiaohongshu.com/note/example6"]', 
'/placeholder.jpg', 
1950, 
12400, 
'美食探店王', 
'enabled'),

('小白也能学会的理财方法！', '理财其实没有想象中那么难，今天分享一些适合小白的理财方法：

💰 基础知识
先了解基本的理财概念，比如复利、风险、收益等。

💰 记账习惯
记录每天的收支，了解自己的财务状况。

💰 应急基金
准备3-6个月的生活费作为应急基金。

💰 定投基金
选择优质的指数基金，坚持定投。

💰 分散投资
不要把所有鸡蛋放在一个篮子里。

💰 长期投资
理财是长期的过程，不要急于求成。

记住：理财有风险，投资需谨慎！', 
'["理财", "投资", "小白", "基金", "财务规划"]', 
'lifestyle', 
'guide', 
'["https://xiaohongshu.com/note/example7", "https://xiaohongshu.com/note/example8"]', 
'/placeholder.jpg', 
5670, 
34200, 
'理财小助手', 
'enabled');

-- ============================================
-- 创建视图用于统计
-- ============================================

CREATE VIEW explosive_contents_stats AS
SELECT 
  industry,
  content_type,
  COUNT(*) as total_count,
  SUM(CASE WHEN status = 'enabled' THEN 1 ELSE 0 END) as enabled_count,
  SUM(CASE WHEN status = 'disabled' THEN 1 ELSE 0 END) as disabled_count,
  AVG(likes) as avg_likes,
  AVG(views) as avg_views
FROM explosive_contents
GROUP BY industry, content_type;

-- ============================================
-- 触发器：自动更新updated_at
-- ============================================

DROP TRIGGER IF EXISTS update_explosive_contents_updated_at;

DELIMITER $$
CREATE TRIGGER update_explosive_contents_updated_at
    BEFORE UPDATE ON explosive_contents
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$
DELIMITER ;

-- ============================================
-- 创建存储过程：按筛选条件查询爆款内容
-- ============================================

DELIMITER $$

CREATE PROCEDURE GetExplosiveContents(
    IN p_industry VARCHAR(50),
    IN p_content_type VARCHAR(50),
    IN p_status VARCHAR(20),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    SET @sql = 'SELECT * FROM explosive_contents WHERE 1=1';
    
    IF p_industry IS NOT NULL AND p_industry != '' THEN
        SET @sql = CONCAT(@sql, ' AND industry = ''', p_industry, '''');
    END IF;
    
    IF p_content_type IS NOT NULL AND p_content_type != '' THEN
        SET @sql = CONCAT(@sql, ' AND content_type = ''', p_content_type, '''');
    END IF;
    
    IF p_status IS NOT NULL AND p_status != '' THEN
        SET @sql = CONCAT(@sql, ' AND status = ''', p_status, '''');
    ELSE
        SET @sql = CONCAT(@sql, ' AND status = ''enabled''');
    END IF;
    
    SET @sql = CONCAT(@sql, ' ORDER BY created_at DESC LIMIT ', p_limit, ' OFFSET ', p_offset);
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END$$

DELIMITER ;

-- ============================================
-- 创建存储过程：获取爆款内容统计信息
-- ============================================

DELIMITER $$

CREATE PROCEDURE GetExplosiveContentsStats()
BEGIN
    SELECT 
        'total' as type,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'enabled' THEN 1 ELSE 0 END) as enabled_count,
        SUM(CASE WHEN status = 'disabled' THEN 1 ELSE 0 END) as disabled_count
    FROM explosive_contents
    
    UNION ALL
    
    SELECT 
        CONCAT('industry_', industry) as type,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'enabled' THEN 1 ELSE 0 END) as enabled_count,
        SUM(CASE WHEN status = 'disabled' THEN 1 ELSE 0 END) as disabled_count
    FROM explosive_contents
    GROUP BY industry
    
    UNION ALL
    
    SELECT 
        CONCAT('content_type_', content_type) as type,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'enabled' THEN 1 ELSE 0 END) as enabled_count,
        SUM(CASE WHEN status = 'disabled' THEN 1 ELSE 0 END) as disabled_count
    FROM explosive_contents
    GROUP BY content_type;
END$$

DELIMITER ; 