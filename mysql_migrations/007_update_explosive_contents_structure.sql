-- ============================================
-- 更新爆款内容表结构迁移脚本
-- 添加tone字段，更新枚举值，清除现有数据
-- ============================================

-- 设置字符集和时区
SET NAMES utf8mb4;
SET time_zone = '+08:00';

-- 1. 清除现有数据
DELETE FROM explosive_contents;

-- 2. 修改industry字段的枚举值
ALTER TABLE explosive_contents 
MODIFY COLUMN industry ENUM('decoration', 'travel', 'study_abroad', 'other') NOT NULL 
COMMENT '行业分类：decoration=装修，travel=旅游，study_abroad=游学，other=其他';

-- 3. 修改content_type字段的枚举值
ALTER TABLE explosive_contents 
MODIFY COLUMN content_type ENUM('review', 'guide', 'marketing', 'other') NOT NULL 
COMMENT '内容形式：review=测评，guide=干货，marketing=推荐/营销，other=其他';

-- 4. 添加tone字段
ALTER TABLE explosive_contents 
ADD COLUMN tone ENUM('personal', 'business', 'other') NOT NULL DEFAULT 'other' 
COMMENT '笔记口吻：personal=素人口吻，business=商家口吻，other=其他'
AFTER content_type;

-- 5. 添加tone字段的索引
ALTER TABLE explosive_contents 
ADD INDEX idx_explosive_contents_tone (tone);

-- 6. 更新组合索引
ALTER TABLE explosive_contents 
DROP INDEX idx_explosive_contents_industry_type,
ADD INDEX idx_explosive_contents_industry_type_tone (industry, content_type, tone);

-- 7. 重置自增ID（如果有的话）
-- ALTER TABLE explosive_contents AUTO_INCREMENT = 1;

-- 8. 插入新的示例数据
INSERT INTO explosive_contents (title, content, tags, industry, content_type, tone, source_urls, cover_image, likes, views, author, status) VALUES
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
'personal',
'["https://xiaohongshu.com/note/example1"]', 
'/placeholder.jpg', 
2580, 
15670, 
'装修小能手', 
'enabled'),

('新西兰旅游攻略｜超详细行程规划', '刚从新西兰回来，整理了一份超详细的旅游攻略！

🏔️ 南岛必去景点：
• 皇后镇 - 户外运动天堂
• 米尔福德峡湾 - 世界第八大奇迹
• 库克山 - 新西兰最高峰
• 蒂卡波湖 - 观星圣地

🌊 北岛推荐：
• 奥克兰 - 现代都市风情
• 罗托鲁瓦 - 地热奇观
• 霍比特村 - 电影取景地

💡 实用贴士：
• 签证提前2个月办理
• 租车记得带国际驾照
• 天气多变，记得带雨具
• 小费不是必须的

总花费约2.5万/人，性价比超高！', 
'["新西兰", "旅游", "攻略", "南岛", "北岛"]', 
'travel', 
'guide', 
'personal',
'["https://xiaohongshu.com/note/example2"]', 
'/placeholder.jpg', 
1890, 
8760, 
'旅行达人小李', 
'enabled'),

('英国游学项目测评｜哪个机构最值得选？', '作为过来人，测评了5个热门英国游学项目：

🏫 项目对比：
1. XX教育 - 性价比最高
2. YY游学 - 课程最丰富  
3. ZZ留学 - 服务最贴心
4. AA国际 - 名校资源最好
5. BB游学 - 住宿条件最佳

💰 费用对比：
• 2周项目：3-5万不等
• 4周项目：6-10万不等
• 包含：机票、住宿、课程、部分餐食

📝 选择建议：
• 预算有限选XX教育
• 想体验名校选AA国际
• 注重住宿选BB游学
• 追求性价比选XX教育

记得提前3个月报名，暑期档位很紧张！', 
'["英国", "游学", "测评", "留学", "教育"]', 
'study_abroad', 
'review', 
'personal',
'["https://xiaohongshu.com/note/example3"]', 
'/placeholder.jpg', 
1234, 
5678, 
'游学妈妈', 
'enabled'),

('【商家推荐】装修材料选购指南', '🏠 作为从业10年的装修公司，给大家推荐几个靠谱的材料品牌：

🔨 瓷砖推荐：
• 马可波罗 - 质量稳定
• 东鹏 - 性价比高
• 诺贝尔 - 高端选择

🚪 地板推荐：
• 圣象 - 复合地板首选
• 大自然 - 实木地板专家
• 德尔 - 强化地板性价比王

🎨 涂料推荐：
• 立邦 - 环保性能好
• 多乐士 - 色彩丰富
• 三棵树 - 国产品牌优选

💡 选购技巧：
• 货比三家不吃亏
• 看准活动时机下手
• 环保等级要重视
• 售后服务要保障

需要详细报价可以私信咨询～', 
'["装修材料", "选购", "品牌推荐", "装修公司"]', 
'decoration', 
'marketing', 
'business',
'["https://xiaohongshu.com/note/example4"]', 
'/placeholder.jpg', 
890, 
3456, 
'XX装修公司', 
'enabled');

-- 9. 更新统计视图
DROP VIEW IF EXISTS explosive_contents_stats;

CREATE VIEW explosive_contents_stats AS
SELECT 
  industry,
  content_type,
  tone,
  COUNT(*) as total_count,
  SUM(CASE WHEN status = 'enabled' THEN 1 ELSE 0 END) as enabled_count,
  SUM(CASE WHEN status = 'disabled' THEN 1 ELSE 0 END) as disabled_count,
  AVG(likes) as avg_likes,
  AVG(views) as avg_views
FROM explosive_contents
GROUP BY industry, content_type, tone;

-- 10. 更新存储过程
DROP PROCEDURE IF EXISTS GetExplosiveContentsStats;

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
    GROUP BY content_type
    
    UNION ALL
    
    SELECT 
        CONCAT('tone_', tone) as type,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'enabled' THEN 1 ELSE 0 END) as enabled_count,
        SUM(CASE WHEN status = 'disabled' THEN 1 ELSE 0 END) as disabled_count
    FROM explosive_contents
    GROUP BY tone;
END$$

DELIMITER ;

-- 完成提示
SELECT '数据库结构更新完成！' as message; 