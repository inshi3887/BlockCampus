# SeaweedFS 对象存储实测记录

验证日期：2026-10-31（Asia/Shanghai）。先实际拉取镜像成功，再修改 Compose；未向远程仓库推送。

## 镜像来源与匿名拉取

- 上游：[SeaweedFS 4.51](https://github.com/seaweedfs/seaweedfs/releases/tag/4.51)，[Apache 2.0 许可](https://github.com/seaweedfs/seaweedfs/blob/4.51/LICENSE)，无需商业授权密钥。
- 国内源：DaoCloud，`m.daocloud.io/docker.io/chrislusf/seaweedfs:4.51`。
- 验证环境：WSL `openEuler-24.03`，Linux amd64，Docker Engine 26.1.3，Compose v2.27.0。
- 镜像本地解压大小约 536 MB；不能把上游宣传中的大小当作该标签的实测大小。

首次下载命令（Windows PowerShell）：

```powershell
wsl -d openEuler-24.03 -- docker pull m.daocloud.io/docker.io/chrislusf/seaweedfs:4.51
```

退出码 0，关键原始输出：

```text
4.51: Pulling from chrislusf/seaweedfs
8be1926aac0e: Pull complete
47a7a7918062: Pull complete
018e268ad9d3: Pull complete
6b95bd4d7993: Pull complete
d291fcf22f5b: Pull complete
3356273a8b01: Pull complete
eee8c4812dd5: Pull complete
cd39e0f022e9: Pull complete
4f4fb700ef54: Pull complete
Digest: sha256:f7a49e3f3972ebed5be2ed4befa4a0c68eb7bdddba6e692d42729ceb545134b8
Status: Downloaded newer image for m.daocloud.io/docker.io/chrislusf/seaweedfs:4.51
m.daocloud.io/docker.io/chrislusf/seaweedfs:4.51
```

随后使用全新空目录作为 Docker 客户端配置，排除已有登录凭据的影响：

```powershell
wsl -d openEuler-24.03 -- mkdir /tmp/blockcampus-anon-20261031-7b39f2
wsl -d openEuler-24.03 -- docker --config /tmp/blockcampus-anon-20261031-7b39f2 pull m.daocloud.io/docker.io/chrislusf/seaweedfs:4.51
```

退出码 0，输出如下；这次层文件命中首次下载的缓存，Registry 标签查询成功：

```text
4.51: Pulling from chrislusf/seaweedfs
Digest: sha256:f7a49e3f3972ebed5be2ed4befa4a0c68eb7bdddba6e692d42729ceb545134b8
Status: Image is up to date for m.daocloud.io/docker.io/chrislusf/seaweedfs:4.51
m.daocloud.io/docker.io/chrislusf/seaweedfs:4.51
```

空配置目录已清理。`docker image inspect` 回读的 RepoDigest 与上面一致。未执行 `docker login`；未把 HTTP manifest 查询当作成功下载的替代证据。

## 真实服务启动与 S3 兼容性

实际执行：

```powershell
wsl -d openEuler-24.03 -- docker compose -f /mnt/d/wsl/Ubuntu/items/game/BlockCampus/compose.yaml config --quiet
wsl -d openEuler-24.03 -- docker compose -f /mnt/d/wsl/Ubuntu/items/game/BlockCampus/compose.yaml up -d --wait --wait-timeout 90 seaweedfs
```

均退出 0，容器 `blockcampus-seaweedfs-1` 为 `healthy`，新建卷 `blockcampus_seaweed_objects`；未重启或修改已有 PostgreSQL/Redis。S3 `/healthz` 可达；控制台 `http://127.0.0.1:9001/` 返回 307 登录跳转。

`server/src/init-storage.ts` 和 `storage.ts` 保持原样。真实初始化输出 `Object bucket initialized`。真实 S3 测试通过：

```text
REAL S3 PASS: init twice; policy readback; signed PNG upload; anonymous GET bytes match; private GET/list/PUT/DELETE all 403
ok 1 - real S3: repeatable init, signed upload, public images and denied anonymous writes
# tests 1
# pass 1
# fail 0
```

验证了：创建随机桶、重复初始化、回读仅允许 `images/*` 的 GetObject 策略、原 `putImage()` 签名上传、匿名 PNG 读取字节和 Content-Type 一致、拒绝匿名私有路径读取/列桶/上传/删除。测试自动清理自己的桶和对象；默认 `campus` 桶保留供应用使用。SeaweedFS 会将策略内单元素 Action/Resource 数组序列化为字符串，两种形式均符合 S3 策略格式，测试按语义比较。

### 本机运行方式与限制

项目没有 `.env`，因此本轮用 `.env.example` 的开发凭据测试，没有创建或覆盖用户私有配置。Windows Node 为 24.12.0；WSL Node 为 20.18.2。Windows 侧无法访问 WSL 的回环映射，而 Windows 安装的 esbuild 不能直接在 Linux 执行，因此本轮先在 Windows 用 TypeScript 编译到被 Git 忽略的 `.local`，再在 Docker 所在 WSL 执行同一份代码：

```powershell
# 项目根目录，Windows
npm exec -w server -- tsc --noEmit false --outDir ../.local/seaweedfs-check
wsl -d openEuler-24.03 -- node --env-file=/mnt/d/wsl/Ubuntu/items/game/BlockCampus/.env.example /mnt/d/wsl/Ubuntu/items/game/BlockCampus/.local/seaweedfs-check/src/init-storage.js
wsl -d openEuler-24.03 -- node --env-file=/mnt/d/wsl/Ubuntu/items/game/BlockCampus/.env.example --test /mnt/d/wsl/Ubuntu/items/game/BlockCampus/.local/seaweedfs-check/test/storage.live.js
```

三个命令均成功。WSL Node 20 的 AWS SDK 版本支持警告未隐藏；项目正式要求仍为 Node.js 22+，本轮不将 Node 20 列为支持版本。推荐在同一网络环境中使用 Node.js 22+ 并安装本平台依赖，配置 `.env` 后直接执行：

```sh
npm run storage:init -w server
npm run test:storage:live
```

## 回归检查

- `npm test`：12 项通过，135 个 API 请求，PGlite/Redis 替身。
- `npm run test:storage`：1 项协议桩测试通过；首次在沙箱内被回环网络 EACCES 拒绝，允许本机回环后重跑通过。
- `npm run build`：TypeScript 与前端生产构建通过。
- `git diff --check`：通过。

当前证据证明本次国内源匿名拉取和真实 SeaweedFS S3 兼容性；未重新验收整个 PG/Redis 依赖链、远端 CDN、目标 GPU 性能。旧 MinIO `objects` 卷保留，不能直接作为 SeaweedFS 的磁盘数据使用。
