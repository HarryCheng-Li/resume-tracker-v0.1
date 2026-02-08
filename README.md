# Resume Tracker 简历跟踪系统

一个完整的简历跟踪管理系统，支持多角色权限管理、SLA超期监控、数据可视化等功能。

## 功能特性

- 🏢 **多层级部门结构**：一层 → 二层 → 三层部门(A-O)
- 👥 **5种角色权限**：Admin、HR、二层经理、三层助理、专家
- 📊 **数据可视化**：饼图/柱状图展示状态、来源、部门分布
- ⏰ **SLA监控**：即将超期预警、超期时长显示
- 🔔 **通知系统**：超期提醒、审批通知
- 📤 **简历上传**：支持PDF智能解析（本地运行，数据不出本地）
- 📈 **数据导出**：CSV格式导出

## 技术栈

- React 18 + TypeScript
- TanStack Query (React Query)
- Tailwind CSS
- Vite
- 纯前端Mock数据（localStorage持久化）

## 快速开始

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 测试账号

所有账号密码都是 `123`

| 角色 | 用户名 |
|------|--------|
| 管理员 | admin |
| HR | hr |
| 二层经理 | l2_manager_1 |
| 三层助理 | l3_assistant_a ~ l3_assistant_o |
| 专家 | expert_a_1, expert_a_2 ... |

## 许可证

MIT License
