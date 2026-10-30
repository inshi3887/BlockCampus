# 模块交付记录

按用户指定顺序，后端 B01–B07，然后前端 F01–F08。每个提交保留该时点实现与验证范围；最终完整验证见 README。

## B01 工程骨架
- Node 24 / TypeScript / Fastify 模块化单体；Vue3/Three.js 蓝本复制，原目录不修改。
- PostgreSQL 事务迁移、Redis 连接、S3 环境、Compose、CI。
- 运行：`npm install`；`docker compose up -d`；复制 `.env.example`；`npm run migrate`；`npm run dev` / `npm run dev:web`。
- 本机 Node 24.12.0；Docker 不可用，容器启动尚未验证。
