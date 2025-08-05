# 管理员操作 API 文档

## 概述

本文档描述了管理员后台操作相关的API接口，包括用户管理、会员管理、积分操作等功能。

## 认证

所有管理员API都需要管理员认证。需要在请求中包含有效的管理员认证cookie。

```http
Cookie: admin_auth=authenticated
```

### 获取认证

```http
POST /api/admin/login
Content-Type: application/json

{
  "username": "admin",
  "password": "your_password"
}
```

## 会员管理 API

### 调整会员到期时间

调整指定用户的会员到期时间，支持设置过去或未来的日期。

#### 请求

```http
POST /api/admin/operations/adjust-membership-expiry
Content-Type: application/json
Cookie: admin_auth=authenticated

{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "new_expiry_date": "2024-12-31T23:59:59",
  "reason": "测试会员到期功能"
}
```

#### 请求参数

| 参数名 | 类型 | 必需 | 描述 |
|--------|------|------|------|
| `user_id` | string | 是 | 用户的UUID，必须是有效的UUID格式 |
| `new_expiry_date` | string | 是 | 新的到期时间，ISO 8601格式 (YYYY-MM-DDTHH:mm:ss) |
| `reason` | string | 否 | 调整原因，最大长度500字符 |

#### 参数验证规则

- **user_id**: 必须是有效的UUID格式
- **new_expiry_date**: 
  - 必须是有效的ISO 8601日期格式
  - 日期范围：2020-01-01 至 2030-12-31
  - 支持过去日期（用于测试过期会员功能）
- **reason**: 可选，字符串类型，最大长度500字符

#### 响应

##### 成功响应 (200 OK)

```json
{
  "success": true,
  "message": "成功调整用户会员到期时间",
  "data": {
    "new_expiry_date": "2024-12-31T23:59:59.000Z",
    "previous_expiry_date": "2024-11-30T23:59:59.000Z"
  }
}
```

##### 错误响应

**400 Bad Request - 参数验证失败**
```json
{
  "success": false,
  "message": "用户ID格式无效，必须是有效的UUID"
}
```

**401 Unauthorized - 未授权访问**
```json
{
  "success": false,
  "message": "未授权访问"
}
```

**404 Not Found - 用户不存在**
```json
{
  "success": false,
  "message": "用户不存在"
}
```

**400 Bad Request - 用户非活跃会员**
```json
{
  "success": false,
  "message": "用户当前不是活跃会员"
}
```

**500 Internal Server Error - 服务器错误**
```json
{
  "success": false,
  "message": "服务器错误"
}
```

#### 操作日志

成功的调整操作会在 `admin_operation_logs` 表中创建日志记录：

```json
{
  "admin_user": "admin",
  "operation_type": "adjust_membership_expiry",
  "target_user_id": "123e4567-e89b-12d3-a456-426614174000",
  "target_user_email": "user@example.com",
  "operation_details": {
    "membership_level": "pro",
    "membership_duration": "monthly",
    "previous_expiry_date": "2024-11-30T23:59:59.000Z",
    "new_expiry_date": "2024-12-31T23:59:59.000Z",
    "reason": "测试会员到期功能"
  },
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

#### 使用示例

##### JavaScript/Node.js

```javascript
async function adjustMembershipExpiry(userId, newExpiryDate, reason) {
  try {
    const response = await fetch('/api/admin/operations/adjust-membership-expiry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Cookie会自动包含在浏览器请求中
      },
      body: JSON.stringify({
        user_id: userId,
        new_expiry_date: newExpiryDate,
        reason: reason
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('调整成功:', data.message);
      return data.data;
    } else {
      console.error('调整失败:', data.message);
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('请求失败:', error);
    throw error;
  }
}

// 使用示例
adjustMembershipExpiry(
  '123e4567-e89b-12d3-a456-426614174000',
  '2024-12-31T23:59:59',
  '测试会员过期功能'
);
```

##### curl

```bash
# 调整到未来日期
curl -X POST http://localhost:3000/api/admin/operations/adjust-membership-expiry \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_auth=authenticated" \
  -d '{
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "new_expiry_date": "2024-12-31T23:59:59",
    "reason": "延长会员期限"
  }'

# 调整到过去日期（测试过期功能）
curl -X POST http://localhost:3000/api/admin/operations/adjust-membership-expiry \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_auth=authenticated" \
  -d '{
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "new_expiry_date": "2023-01-01T00:00:00",
    "reason": "测试会员过期功能"
  }'
```

## 其他会员管理 API

### 设置会员

```http
POST /api/admin/operations/set-membership
```

设置用户的会员状态和等级。

### 取消会员

```http
POST /api/admin/operations/cancel-membership
```

取消用户的会员资格。

### 赠送积分包

```http
POST /api/admin/operations/gift-credit-package
```

为用户赠送积分包。

### 直接赠送积分

```http
POST /api/admin/operations/grant-credits
```

直接为用户账户添加积分。

## 用户管理 API

### 搜索用户

```http
GET /api/admin/users/search?q=user@example.com&limit=20
```

根据邮箱搜索用户。

### 获取用户积分历史

```http
GET /api/admin/users/{user_id}/credits-history
```

获取指定用户的积分使用历史。

## 操作日志 API

### 获取操作日志

```http
GET /api/admin/logs?limit=50&offset=0
```

获取管理员操作日志列表。

## 错误处理

### 常见错误码

| 状态码 | 描述 | 解决方案 |
|-------|------|----------|
| 400 | 请求参数无效 | 检查参数格式和必需字段 |
| 401 | 未授权访问 | 确认管理员已登录 |
| 403 | 权限不足 | 检查管理员权限级别 |
| 404 | 资源不存在 | 确认用户ID等资源标识符正确 |
| 500 | 服务器内部错误 | 联系技术支持 |

### 错误响应格式

所有错误响应都遵循统一格式：

```json
{
  "success": false,
  "message": "错误描述信息"
}
```

## 安全注意事项

### 认证安全

1. **管理员认证**: 所有API都需要有效的管理员认证
2. **会话管理**: 管理员会话有效期为8小时
3. **权限验证**: 每个请求都会验证管理员权限

### 数据安全

1. **输入验证**: 所有输入都会进行严格验证
2. **SQL注入防护**: 使用参数化查询防止SQL注入
3. **日志记录**: 所有操作都会记录详细日志

### 最佳实践

1. **操作确认**: 重要操作前进行二次确认
2. **原因记录**: 为所有操作填写详细原因
3. **定期审计**: 定期检查操作日志
4. **权限最小化**: 只授予必要的操作权限

## 版本信息

- **API版本**: v1.2.0
- **最后更新**: 2024-01-XX
- **兼容性**: 向后兼容v1.1.0及以上版本

## 联系支持

如有API使用问题或发现Bug，请联系：

- **技术支持邮箱**: [support@example.com]
- **文档仓库**: [GitHub链接]
- **问题报告**: [Issue跟踪系统链接]

---

*此文档与系统版本同步更新，请以最新版本为准。*