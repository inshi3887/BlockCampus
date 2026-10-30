# BlockCampus（方块校园）· MVP 阶段一

Vue 3 + Three.js 单机渲染，Node 24 + TypeScript 模块化单体，PostgreSQL / Redis / S3。新增项目独立于 `../guangzhou`，原蓝本没有修改。设计以 `../docs/方块校园-完整策划案.md` v1.4 为准。

实现：账号/实名占位/防沉迷、云存档、服务端三币与积分、课程结算、装扮商店、广东工业大学示意校园、摄影打卡、论坛/朋友圈、人工审核、独立广告运营端。没有 WebSocket、武汉地图、抢点或 GPS 重合结算；这些属于 P1。63次重合上限仅保留配置，不开放领取入口。

## 启动（正式依赖链路）

依赖：Node.js 24、npm 11、Docker Compose v2；浏览器需支持 WebGL2 与 IndexedDB。也可以自行提供 PostgreSQL 16、Redis 7 和 S3 兼容服务，修改 `.env` 即可。

在 PowerShell 中：

```powershell
Set-Location D:\wsl\Ubuntu\items\game\BlockCampus
npm ci
Copy-Item .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# 将输出写入 .env 的 IDENTITY_HASH_SECRET；不要沿用 replace- 占位值。
docker compose up -d
npm run migrate
npm run storage:init -w server
npm run dev
```

另一个终端：

```powershell
Set-Location D:\wsl\Ubuntu\items\game\BlockCampus
npm run dev:web
```

打开 [游戏](http://127.0.0.1:5173/)；[运营端](http://127.0.0.1:5173/admin.html)。请使用 `127.0.0.1`，与 `APP_ORIGIN` 保持完全一致。端口占用时修改 `APP_ORIGIN` 和 Vite 端口，或关闭占用程序。Vite 的 `/api` 代理到 `127.0.0.1:3001`。

MinIO 管理页：[对象存储控制台](http://127.0.0.1:9001/)，开发凭据见 `.env.example`。`storage:init` 创建桶和图片公开读取策略，不开放写入；写入仅通过鉴权后的后端上传。广告/CDN 图片需配置允许游戏源跨域读取，MinIO 默认开发配置可用于本机；正式 CDN 请配置对应 CORS。

账号流程：注册 → 自建实名占位 → 创建角色 → 选择广东工业大学。普通账号从0金币/0积分开始，没有调试赠币。课程采用自产图文讲义，10分钟，可选1×/1.25×；完整观看+10分，升级自动发金币。

## 运营账号与审核

`.env` 的 `ADMIN_ACCOUNTS` 是运营账号名白名单。公开注册不能占用白名单账号名。由服务端命令创建运营账号，密码从环境变量读取，不放命令参数或 Git：

```powershell
$env:OPERATOR_USERNAME = 'operator'
$env:OPERATOR_PHONE = '<运营人员手机号>'
# 通过你自己的秘密管理方式设置 OPERATOR_PASSWORD（至少12位）。
npm run operator:create -w server
Remove-Item Env:OPERATOR_PASSWORD -ErrorAction SilentlyContinue
```

运营人员在游戏入口登录、完成实名占位后，可在 `/admin.html` 登录同一账号：上传一张图片 → 绑定图书馆灯箱或超市 → 设置有效期 → 保存 → 审核素材并上线。游戏每60秒刷新有效广告，近距离进入视野时记录曝光；点击可选查看详情，不弹强制观看窗口。

所有帖子与评论默认待审。文字敏感词先拦截，图片与正文由运营端人工审核；不假称已接第三方图片审核。审核通过后才对公众展示，广告打卡奖励在同一数据库事务中补发。拒绝、重试、重复审核不会重复发币。广告拍照事件保存当时有效的活动ID，排期结束后通过审核仍可补发。

朋友圈在 MVP 中仅本人可见，好友关系属于 P1。已预留 `friends` 内容通道，未把私人内容作为公开论坛返回。

## 环境变量

| 变量 | 用途 |
| --- | --- |
| `DATABASE_URL` | PostgreSQL 连接，账号/存档/经济/内容/广告/审计的权威存储 |
| `REDIS_URL` | 会话、接口与登录限流；丢失会话后重新登录，不影响钱包 |
| `PORT` | API端口，默认3001，只监听本机回环 |
| `APP_ORIGIN` | 完整前端源，所有写入请求检查 Origin，无结尾斜杠 |
| `COOKIE_SECURE` | HTTPS生产环境设为true；本机HTTP为false |
| `IDENTITY_HASH_SECRET` | 至少32字符随机密钥；证件号只持久化HMAC与出生日期，不保存姓名/证件原文 |
| `ADMIN_ACCOUNTS` | 逗号分隔运营账号名，必须由CLI预置 |
| `HOLIDAYS` | 运营复核后配置的逗号分隔中国法定节假日，如 YYYY-MM-DD；空值仅按周五六日 |
| `BLOCKED_WORDS` | 额外敏感词，逗号分隔；内置基础词表仅供内测 |
| `S3_ENDPOINT` / `S3_REGION` | 对象存储服务地址与region |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | 后端对象存储凭据，绝不发给游戏客户端 |
| `S3_BUCKET` / `S3_PUBLIC_URL` | 桶名与可公开读取的CDN/对象前缀 |

实名是自建占位：校验身份证格式/校验位/生日，并按北京时间检查未成年人游戏时段、持久日时长。国家接口未接入。正式发布前需替换认证提供方、复核节假日日历和运营规则。

## 数据库与权威边界

`server/migrations/001_*.sql` 至 `008_*.sql` 顺序执行。`npm run migrate` 使用事务、迁移记录与 PostgreSQL advisory lock，可重复运行。升级前先备份数据库。Compose 的 `pgdata`、`objects` 持久卷保存数据；不要用 `down -v` 清理正式数据。

关键约束：

- 钱包分 `gold_copper / silver_copper / copper` 三个整数铜余额，1金=100银=10000铜，禁止自动把铜银升格为金币。没有充值或兑换API。
- 积分累计只用于升级：`exp(n)=10n`；升级奖励10/9/8/7/2/2…金；五级免费解锁纯外观名片。
- 普通掉落90%10铜，10%1–2银，期望24铜；广告0.5%1金、20%1–2银、79.5%10铜，期望87.95铜。按北京时间日界限20/5次封顶，超限仍记录照片与图鉴。
- 经济写入持有账号行锁，事务内写账本/回执/物品/每日计数；客户端只提交事件或商品ID。幂等键是UUID，跨动作复用会拒绝。同一照片事件只结算一次相应奖励。
- 商店仅外观、宿舍装饰和摄影道具；每件保留 `unlock.level`，木纹边框 100 铜/件、银色贴纸 100 银/件（10000 铜单位）为可重复购买消耗品。购买累加库存，每次装扮应用通过 `/api/shop/use` 服务端事务扣减 1 件；购买/使用均要求 UUID 幂等键。旧库存迁移后每条拥有记录变为 1 件，金币装扮仍永久拥有。广告活动照片只走广告审核结算，不叠加普通掉落。
- 课程开始、可用座位、服务端经过时间、五分钟确认、后台/断线超2分钟和完成结算均由后端处理。15秒pulse只累计有确认且连续的前台时段；提前finish不产分。
- 云存档v1只允许角色/设置/位置，拒绝余额、积分、物品字段。版本冲突返回409并读取远端，不覆盖其他窗口的新档。图鉴来自服务端事件表。
- 广州ID保持不变，新增学校用 `school:*`。所有模型是Builder/共享材质/顶点色，无外部3D模型。

单机渲染的空间信息由客户端上报，服务端验证注册表、距离、频率、权限和上限；P0不提供可证明的防改客户端移动/相机验证，也不提供GPS防作弊。后台定位风控及权威多人位置同步留P1；不要把MVP的坐标检查当作防外挂承诺。

## 存档与照片

旧 `block-guangzhou-save-v1` 只用于游客漫游，不导入校园账号。游客没有经济或内容接口权限。账号的角色、设置、位置保存在 PostgreSQL，旧羊城产币与购物逻辑在账号模式禁用，交通内测免费。

照片仍保存在IndexedDB，账号使用 `block-campus-photos-<accountId>` 独立数据库，游客沿用 `block-guangzhou`。只有主动发帖才把所选照片上传到S3（最大5MiB，PNG/JPEG/WebP，拒绝SVG/HTML）。更换设备不会自动同步本地照片，已发布附件可从帖子查看。

## 检查与运行结果

```powershell
npm test
npm run test:storage
npm run build
```

本次验证：

- TypeScript严格检查与Vite生产构建通过，游戏和运营端分别构建；Three.js独立分包。
- 9个测试通过，包括PostgreSQL/PGlite真实SQL集成，80多个API请求：注册/鉴权、实名门禁、云档注入/版本冲突、并发幂等与余额不足、20/5日上限、重复审核、朋友圈隔离、提前结课/后台超时/五分钟确认。
- 两类各10000次分层采样核对24/87.95铜；升级阶梯与纯外观商品校验通过。
- 另1个S3 SDK HTTP协议测试通过：建桶、策略、图片PUT、内容类型/字节与拒绝SVG。测试使用本机协议桩，未冒充MinIO部署验收。
- 浏览器验证了登录、全新账号与游客隔离、角色创建、校园渲染、商店解锁、校园传送；详细结果见 `docs/VALIDATION.md`。
- **当前机器没有Docker、原生PostgreSQL/Redis/MinIO，完整Compose依赖链未在本机启动。** CI配置为用真实PostgreSQL/Redis执行集成测试（含TTL检查），尚未运行远端CI；本地SQL测试使用嵌入式PostgreSQL，Redis为测试替身。真实Redis TTL/重启和MinIO/CDN需在依赖齐全的环境复验。
- **60FPS尚未验收**：当前内嵌浏览器原版广州塔与校园均约1FPS，无法证明目标硬件60FPS基线。保留距离加载/LOD，新增HUD显示实际平均FPS/P95帧时/draw calls；请按下述步骤在目标GPU上复测。

目标机性能回归：同分辨率/画质/天气/时间，在原版与校园版广州塔各暖机30秒、采样60秒，再跑校门/教室/图书馆与摄影模式；核对平均FPS、P95≤16.7ms目标及帧峰值，并往返城区/校园10次检查资源回收。未达到60FPS之前，不将性能指标标为通过。

## 无Docker时的隔离QA预览

仅用于界面与API演示，与正式启动分开，数据退出即丢失。该模式使用PGlite和内存cache，无Redis TTL、无S3，不能用于运营；不会静默替代正式后端。

```powershell
# 终端1：默认允许5175前端源
npm run qa -w server
# 终端2：与QA源一致
npm exec -w web -- vite --host 127.0.0.1 --port 5175
```

测试账号 `qa_student` / `qa_operator`，测试密码均为 `campus-qa-only-2026`，虚构数据已在测试脚本初始化，没有初始经济赠送。图片发布和广告素材上传须切换到正式S3链路后验证。

## 构建与部署

`npm run build` 输出 `web/dist`；服务端通过 `npm run start -w server` 运行TypeScript（tsx）。生产环境将静态站点与 `/api` 放同一HTTPS源，反向代理到本机3001，设置对应 `APP_ORIGIN`、`COOKIE_SECURE=true` 和实际对象CDN地址。后端保持私有网络；不要用Vite开发服务器作为正式部署。

代码入口：`server/src/app.ts` 模块装配；`rules.ts` GDD数值；`economy.ts` 账本与课程；`content.ts` 审核补发；`web/src/campus` 账号接入；`web/src/game/landmarks/school/gdut.js` 校园模型。逐模块提交和命令见 `docs/MODULES.md`。

景点注册表同步：修改前端景点后运行 `npm run sync:places`，`npm run check:places` / CI检查服务端坐标与客户端投影/岸边吸附完全一致。
