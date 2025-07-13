# MemBuddy 项目信息

## 任务

用户的多步骤任务是：
1.  将前端项目从 `/Users/ravey/Downloads/fintech-landing (4)` 迁移到 `/Users/ravey/Documents/code/project/memBuddy/front`。
2.  修改前端代码以与位于 `/Users/ravey/Documents/code/project/memBuddy/back` 的后端设计保持一致。
3.  更新后端以使用 Supabase 进行身份验证和数据存储。
4.  向后端添加一个 Gemini API 调用，使用原始前端项目中的 `gemini-ai.ts` 文件中的提示。

## 凭据

*   **电子邮件：** `ccxrw0626@gmail.com`
*   **密码：** `password@ravey`

## 后端

*   **框架：** FastAPI
*   **数据库���** Supabase
*   **虚拟环境：** uv
*   **依赖管理：** `requirements.txt`

### API 端点

| 方法 | 路径 | 描述 | 状态 |
| --- | --- | --- | --- |
| POST | /api/auth/register | 注册一个新用户。 | ✅ |
| POST | /api/auth/login | 用户登录。 | ✅ |
| POST | /api/memory/generate | 生成记忆辅助工具。 | ✅ |
| GET | /api/memory_items | 检索记忆项。 | ✅ |
| POST | /api/memory_items | 创建一个新的记忆项。 | ✅ |
| GET | /api/memory_items/{item_id} | 检索特定的记忆项。 | ✅ |
| PUT | /api/memory_items/{item_id} | 更新一个记忆项。 | ✅ |
| DELETE | /api/memory_items/{item_id} | 删除一个记忆项。 | ✅ |
| POST | /api/review/schedule | 安排一次复习。 | ✅ |
| GET | /api/review/schedule | 检索复习计划。 | ✅ |

## 前端

*   **框架：** Next.js
*   **包管理器：** pnpm
*   **状态：** 记忆库页面现在可以正确呈现从后端获取的数据。登录和身份验证流程已修复。
*   **已知问题：** 记忆库页面在从未经身份验证的用户导航到经过身份验证的用户时，或者在令牌过期后，可能无法正确重新加载。
