# 数据库设置指南

## 📊 Profiles 表结构

已创建自定义的 `profiles` 表来存储用户数据，包含以下字段：

### 字段说明

| 字段名 | 类型 | 描述 | 默认值 |
|--------|------|------|--------|
| `id` | UUID | 用户ID（关联auth.users） | - |
| `email` | TEXT | 用户邮箱 | - |
| `created_at` | TIMESTAMP | 创建时间 | NOW() |
| `updated_at` | TIMESTAMP | 更新时间 | NOW() |
| `user_cookie` | TEXT | 用户Cookie字符串 | NULL |
| `task_indices` | JSONB | 任务索引数组 | [] |
| `display_name` | TEXT | 显示名称 | 邮箱前缀 |
| `avatar_url` | TEXT | 头像URL | null |
| `last_login_at` | TIMESTAMP | 最后登录时间 | NOW() |

### 用户Cookie字段说明
- 存储用户的Cookie字符串，用于后续爬虫接口调用
- 格式为标准的HTTP Cookie字符串，例如：`sessionid=abc123; csrftoken=xyz789`
- 默认值为NULL，表示用户尚未设置Cookie

## 🚀 数据库迁移

### 方法一：在 Supabase 控制台执行

1. 登录 [Supabase 控制台](https://supabase.com/dashboard)
2. 选择您的项目
3. 点击左侧菜单的 "SQL Editor"
4. 创建新查询
5. 复制 `supabase/migrations/001_create_profiles_table.sql` 中的所有内容
6. 点击 "Run" 执行

### 方法二：使用 Supabase CLI（推荐）

如果您安装了 Supabase CLI：

```bash
# 初始化 Supabase 项目（如果还没有）
supabase init

# 链接到您的远程项目
supabase link --project-ref your-project-id

# 运行迁移
supabase db push
```

## ⚡ 自动化功能

### 1. 用户注册时自动创建 Profile

- 当用户通过邮箱验证码注册时，系统会自动在 `profiles` 表中创建对应记录
- 使用数据库触发器 `on_auth_user_created` 实现
- 自动填充邮箱和显示名称（默认为邮箱前缀）

### 2. 行级安全策略 (RLS)

- 启用了 Row Level Security
- 用户只能查看和修改自己的 profile 数据
- 确保数据安全性

### 3. 自动更新时间戳

- `updated_at` 字段在每次更新时自动更新
- 使用触发器 `update_profiles_updated_at` 实现

## 🔧 API 功能

项目中已实现以下 Profile 相关的 API 函数：

### 基础操作
- `getProfile(userId)` - 获取用户资料
- `updateProfile(userId, updates)` - 更新用户资料
- `updateLastLogin(userId)` - 更新最后登录时间

### Cookie 管理
- `updateUserCookie(userId, cookieString)` - 更新用户Cookie字符串

### 任务索引管理
- `addTaskIndex(userId, taskIndex)` - 添加任务索引
- `removeTaskIndex(userId, taskIndex)` - 移除任务索引

## 📝 使用示例

### 在组件中使用

```tsx
import { useAuth } from '@/components/auth-context'

function UserProfile() {
  const { user, profile, refreshProfile } = useAuth()

  if (!user || !profile) {
    return <div>请先登录</div>
  }

  return (
    <div>
      <h2>欢迎，{profile.display_name}！</h2>
      <p>邮箱：{profile.email}</p>
      <p>注册时间：{new Date(profile.created_at).toLocaleDateString()}</p>
      <p>任务数量：{profile.task_indices.length}</p>
      <p>Cookie状态：{profile.user_cookie ? '已设置' : '未设置'}</p>
    </div>
  )
}
```

### 直接调用 API

```tsx
import { getProfile, updateProfile, addTaskIndex, updateUserCookie } from '@/lib/supabase'

// 获取用户资料
const { data: profile } = await getProfile(userId)

// 更新显示名称
await updateProfile(userId, { display_name: '新名称' })

// 设置用户Cookie
await updateUserCookie(userId, 'sessionid=abc123; csrftoken=xyz789')

// 添加任务索引
await addTaskIndex(userId, 12345)
```

## 🛠️ 故障排除

### 常见问题

1. **表不存在错误**
   - 确保已在 Supabase 控制台执行了迁移 SQL
   - 检查表名是否正确（`profiles`）

2. **权限错误**
   - 确认 RLS 策略已正确设置
   - 检查用户是否已正确认证

3. **触发器不工作**
   - 确认触发器函数已创建
   - 检查 `auth.users` 表的权限设置

### 验证设置

在 Supabase 控制台的 Table Editor 中：
1. 检查 `profiles` 表是否存在
2. 注册一个新用户，查看是否自动创建了 profile 记录
3. 尝试更新 profile 数据，检查 `updated_at` 是否自动更新

## 🔮 未来扩展

当需要创建任务表时，可以：
1. 创建 `tasks` 表
2. 在 `profiles.task_indices` 中存储任务ID的引用
3. 建立适当的外键关系和索引

这样的设计为未来的功能扩展提供了良好的基础。 