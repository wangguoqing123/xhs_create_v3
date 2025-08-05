# 管理员会员到期时间调整功能测试指南

## 测试概述

本文档描述了管理员会员到期时间调整功能的测试方法和验证步骤。

## 手动测试流程

### 前置条件

1. 管理员已登录管理后台
2. 系统中存在测试用户且具有活跃会员
3. 数据库连接正常

### 测试用例

#### 测试用例 1：正常调整到期时间（未来日期）

**步骤：**
1. 访问管理员页面 `/admin`
2. 搜索具有活跃会员的用户
3. 点击用户的"调整到期时间"按钮
4. 在模态框中选择未来的日期时间
5. 输入调整原因（可选）
6. 点击"确认调整"

**预期结果：**
- 显示成功消息（如果触发积分重置，会显示"积分已重置为X"提示）
- 用户会员状态更新
- 如果是延长会员，用户积分重置为月度额度
- 操作日志中记录此次调整和积分变化信息
- 模态框关闭，用户列表刷新

#### 测试用例 2：调整到期时间（过去日期，测试过期会员）

**步骤：**
1. 访问管理员页面 `/admin`
2. 搜索具有活跃会员的用户
3. 点击用户的"调整到期时间"按钮
4. 在模态框中选择过去的日期时间
5. 输入调整原因："测试过期会员功能"
6. 点击"确认调整"

**预期结果：**
- 显示成功消息（包含"积分已清零"提示）
- 用户会员显示为"已过期"状态
- 会员状态标签变为红色
- 用户积分变为0
- 操作日志记录包含过去日期和积分变化信息

#### 测试用例 3：参数验证测试

**步骤：**
1. 尝试不选择日期直接提交
2. 选择无效日期格式
3. 选择过于久远的日期（如1900年）
4. 输入过长的原因文本（>500字符）

**预期结果：**
- 每种情况都显示相应的错误消息
- 表单不能提交
- 不会创建错误的操作日志

#### 测试用例 4：权限验证测试

**步骤：**
1. 未登录状态下直接访问API
2. 使用错误的管理员凭证

**预期结果：**
- 返回401未授权错误
- 不允许执行调整操作

#### 测试用例 5：积分重置逻辑测试

**步骤：**
1. 测试月会员过期：将月会员到期时间设为过去日期
2. 测试年会员过期：将年会员到期时间设为过去日期
3. 测试月会员延长：延长月会员到期时间
4. 测试年会员延长：延长年会员到期时间

**预期结果：**
- 月会员过期：积分清零，next_credits_reset为null
- 年会员过期：积分清零，next_credits_reset为null  
- 月会员延长：积分重置为monthly_credits，next_credits_reset为null
- 年会员延长：积分重置为monthly_credits，计算新的next_credits_reset

#### 测试用例 6：边界条件测试

**步骤：**
1. 对无会员用户尝试调整
2. 对已过期会员用户调整
3. 数据库连接中断时调整

**预期结果：**
- 无会员用户：不显示调整按钮
- 已过期会员：可以正常调整
- 数据库错误：显示错误消息且不创建日志

### 用户界面测试

#### 会员状态显示优化验证

**检查项：**
- [ ] 活跃会员显示绿色"活跃会员"标签
- [ ] 已过期会员显示红色"会员已过期"标签  
- [ ] 无会员用户显示灰色"无会员"标签
- [ ] 会员等级正确显示（入门版/标准版/高级版）
- [ ] 付费周期正确显示（月付/年付）
- [ ] 到期状态提示正确（正常/即将过期/已过期）

#### 加载状态和反馈验证

**检查项：**
- [ ] 模态框提交时显示加载指示器
- [ ] 提交按钮变为"调整中..."状态
- [ ] 提交期间按钮被禁用
- [ ] 成功后显示成功消息
- [ ] 失败时显示错误消息
- [ ] 用户列表自动刷新

## API 测试

### 使用 curl 进行 API 测试

```bash
# 测试正常调整（需要先获取管理员认证cookie）
curl -X POST http://localhost:3000/api/admin/operations/adjust-membership-expiry \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_auth=authenticated" \
  -d '{
    "user_id": "用户UUID",
    "new_expiry_date": "2024-12-31T23:59:59",
    "reason": "测试调整会员到期时间"
  }'

# 测试参数验证（无效UUID）
curl -X POST http://localhost:3000/api/admin/operations/adjust-membership-expiry \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_auth=authenticated" \
  -d '{
    "user_id": "invalid-uuid",
    "new_expiry_date": "2024-12-31T23:59:59"
  }'

# 测试权限验证（无认证）
curl -X POST http://localhost:3000/api/admin/operations/adjust-membership-expiry \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "用户UUID",
    "new_expiry_date": "2024-12-31T23:59:59"
  }'
```

## 数据库验证

### 验证数据更新

```sql
-- 检查会员到期时间是否正确更新
SELECT user_id, end_date, updated_at 
FROM memberships 
WHERE user_id = '用户UUID' AND status = 'active';

-- 检查用户积分和重置时间
SELECT id, email, credits, last_credits_reset, next_credits_reset, monthly_credits 
FROM users 
WHERE id = '用户UUID';

-- 检查会员类型和付费周期（验证积分重置逻辑）
SELECT u.id, u.email, u.credits, u.monthly_credits, m.tier, m.duration, m.start_date, m.end_date 
FROM users u 
JOIN memberships m ON u.id = m.user_id 
WHERE u.id = '用户UUID' AND m.status = 'active';

-- 检查操作日志是否正确记录（包含积分变化详情）
SELECT admin_user, operation_type, target_user_email, operation_details, created_at
FROM admin_operation_logs 
WHERE operation_type = 'adjust_membership_expiry' 
ORDER BY created_at DESC 
LIMIT 5;
```

### 验证积分重置逻辑

```sql
-- 验证积分重置逻辑是否正确
-- 对于月会员：next_credits_reset应该为NULL
-- 对于年会员：next_credits_reset应该基于start_date + 30天计算
SELECT 
  u.id, u.email, u.credits, u.next_credits_reset,
  m.duration, m.start_date, m.end_date,
  CASE 
    WHEN m.duration = 'monthly' THEN 'next_credits_reset应该为NULL'
    WHEN m.duration = 'yearly' THEN CONCAT('next_credits_reset应该为: ', DATE_ADD(m.start_date, INTERVAL 30 DAY))
    ELSE '无会员'
  END as expected_reset
FROM users u 
LEFT JOIN memberships m ON u.id = m.user_id AND m.status = 'active'
WHERE u.id = '用户UUID';

-- 验证积分变化是否符合业务逻辑
-- 过期会员：积分应该为0
-- 延长会员：积分应该重置为monthly_credits
SELECT 
  u.id,
  u.credits as current_credits,
  u.monthly_credits as expected_credits_if_active,
  m.end_date,
  CASE 
    WHEN m.end_date < NOW() THEN '过期会员，积分应该为0'
    WHEN m.end_date > NOW() THEN '活跃会员，积分应该为monthly_credits'
    ELSE '检查会员状态'
  END as expected_credits_status
FROM users u
LEFT JOIN memberships m ON u.id = m.user_id AND m.status = 'active'
WHERE u.id = '用户UUID';
```

### 验证数据一致性

```sql
-- 检查用户统计视图是否正确更新
SELECT user_id, is_active_member, membership_end, membership_type
FROM user_membership_summary 
WHERE user_id = '用户UUID';
```

## 性能测试

### 并发调整测试

使用工具如 Apache Bench 或类似工具测试：
- 同时调整多个用户的到期时间
- 验证数据库事务处理是否正确
- 确认没有数据竞争条件

## 回滚测试

### 事务回滚验证

1. 在数据库操作中引入故意错误
2. 验证事务是否正确回滚
3. 确认没有部分更新的数据

## 测试报告模板

```
测试日期: ____
测试者: ____
环境: [开发/测试/生产]

功能测试结果:
□ 正常调整功能 - 通过/失败
□ 过去日期调整 - 通过/失败  
□ 参数验证 - 通过/失败
□ 权限验证 - 通过/失败
□ 边界条件 - 通过/失败

界面测试结果:
□ 状态显示优化 - 通过/失败
□ 加载状态 - 通过/失败
□ 用户反馈 - 通过/失败

问题记录:
- 
- 

建议:
- 
- 
```

## 自动化测试建议

如果后续需要添加自动化测试，建议：

1. 安装 Jest 和相关测试工具
2. 创建测试数据库
3. 编写单元测试和集成测试
4. 设置 CI/CD 流程

```bash
# 安装测试依赖（可选）
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev @testing-library/react @testing-library/jest-dom
```