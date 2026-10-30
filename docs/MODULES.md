# 模块交付记录

按用户指定顺序，后端 B01–B07，然后前端 F01–F08。每个提交保留该时点实现与验证范围；最终完整验证见 README。

## B01 工程骨架
- Node 24 / TypeScript / Fastify 模块化单体；Vue3/Three.js 蓝本复制，原目录不修改。
- PostgreSQL 事务迁移、Redis 连接、S3 环境、Compose、CI。
- 运行：`npm install`；`docker compose up -d`；复制 `.env.example`；`npm run migrate`；`npm run dev` / `npm run dev:web`。
- 本机 Node 24.12.0；Docker 不可用，容器启动尚未验证。

## B02 账号鉴权
- 账号/手机号唯一、scrypt、HttpOnly Cookie、Redis 会话与登录限流、退出撤销。
- 验证：npm test（密码正反例与 token 哈希）；后续集成测试覆盖注册/会话。

## B03 实名与防沉迷
- 身份证校验位/日期、自建占位适配，身份证仅存 HMAC；北京时间未成年时段与持久日预算。
- 验证命令 npm test；已加入校验位、成人/未成年人、20/21点、3600秒边界测试。

## B04 云存档
- schema v1 白名单、乐观并发版本检查；拒绝 money/points/items 等经济注入。
- npm test：允许坐标、拒绝非有限数与经济字段；旧广州档不导入。

## B05 服务端经济与课程结算
- 整数铜分币种账本，禁逆兑/自动进位；事务账号行锁、幂等回执、每日20/5上限、纯外观商店。
- 课程50固定座位、服务端时间累计、每5分钟确认、离线超2分钟中断；单课10分。
- npm test：10,000次分层掉落测试期望24/87.95，升级10/9/8/7/2/2，成长曲线与纯外观校验。
