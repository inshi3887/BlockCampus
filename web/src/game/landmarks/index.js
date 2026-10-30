// 景点注册表：真实经纬度、等级、图鉴介绍、建模函数
import { buildCantonTower, towerLOD, buildHaixinsha, buildPazhou, buildSYSU, buildErsha, buildHaizhuBridge, buildLiedeBridge, buildHaixinBridge, buildGuangzhouBridge, buildZhujiang } from './haizhu.js'
import { buildChenClanHall, buildShamian, buildShangxiajiu, buildYongqingfang, buildLizhiwan } from './liwan.js'
import { buildYuexiuPark, buildWuyang, buildMemorialHall, buildBeijingRoad, buildNanyueMuseum, buildSacredHeart, buildLiurong, buildTianziPier } from './yuexiu.js'
import { buildHuacheng, buildIFC, ifcLOD, buildCTF, ctfLOD, buildOperaHouse, buildGDMuseum, buildSportsCenter, buildGrandview, buildTaikoo, buildCitic, citicLOD, buildEastStation, buildCBD } from './tianhe.js'
import { buildMoxingling, buildBaiyunGate, buildYuntai, buildChimelong, buildSafari, buildDafushan, buildWetland, buildSeaside, buildTinHau } from './outer.js'
import { C, railing, lamp } from './common.js'

function buildTowerPier(b, ctx) {
  // 广州塔码头（南岸，局部 +z 指向江面）
  b.box(-10, 0, -6, 10, 5, 0, 0xe0e4e8, 'window')
  b.box(-11, 5, -7, 11, 5.6, 1, 0xf0f0f0)
  b.sign('广州塔码头', 0, 4, 0.05, 0.9, 0, { bg: '#0a2a4a', fg: '#7ad0ff', glow: true })
  ctx.landOverride(-3, 0, 3, 26)
  ctx.landOverride(-9, 22, 9, 28)
  b.box(-3, 0.1, 0, 3, 0.4, 22, 0x8a7a6a, { mat: 'wood', solid: false })
  railing(b, -3, 0, -3, 22, 0.4, 1, 0x666666, 2)
  railing(b, 3, 0, 3, 22, 0.4, 1, 0x666666, 2)
  b.box(-9, -0.6, 22, 9, 0.4, 28, 0x5a5a5a, { solid: false })
  for (let x = -8; x <= 8; x += 8) lamp(b, x, 0.4, 27, 3.5)
  ctx.interact({ x: 0, z: 24, r: 5, label: '登船：珠江夜游', type: 'cruise', pier: 'gzt' })
}

// grade: S 高度还原 / A 主要建筑 / B 区域氛围
// excl: 城市程序化建筑避让半径；rect: [半宽, 半深]
export const LANDMARKS = [
  // ---------- 海珠区 ----------
  { id: 'cantontower', name: '广州塔', alias: '小蛮腰', district: 'haizhu', grade: 'S', lat: 23.1066, lon: 113.3245, rect: [46, 42], focusY: 120, photoR: 1600, lod: towerLOD, lodAlways: true, loadR: 900, build: buildCantonTower,
    desc: '广州塔高600米，2010年建成，是中国第一、世界第三高的电视塔。塔身由24根钢柱与46组环梁构成，底部与顶部椭圆相对扭转135°，形成纤细的“小蛮腰”。夜晚LED灯光秀与珠江倒影交相辉映。', tip: '乘坐电梯登上488米露天观景平台俯瞰广州；夜晚观看灯光秀。' },
  { id: 'haixinsha', name: '海心沙', district: 'tianhe', grade: 'A', lat: 23.1135, lon: 113.3245, rect: [42, 32], focusY: 8, build: buildHaixinsha,
    desc: '海心沙是珠江中的一座小岛，2010年广州亚运会开幕式在此举行，标志性的白色“风帆”看台至今仍是城市中轴线的一部分。' },
  { id: 'haixinqiao', name: '海心桥', district: 'haizhu', grade: 'B', lat: 23.1102, lon: 113.3245, rect: [16, 38], focusY: 14, build: buildHaixinBridge, noCity: true,
    desc: '海心桥是珠江上首座大跨度人行桥，连接海心沙与广州塔，倾斜的钢拱宛如一把“琵琶”，被市民称作“小蛮腰的‘手链’”。' },
  { id: 'zhujiang', name: '珠江', alias: '母亲河', district: 'yuexiu', grade: 'B', lat: 23.1175, lon: 113.29, snap: 'south', snapOff: 5, rect: [32, 6], focusY: 2, photoR: 300, build: buildZhujiang,
    desc: '珠江是中国第三长河，广州段江面宽阔，两岸灯火璀璨。珠江夜游是感受广州夜景的最佳方式。' },
  { id: 'gzbridge', name: '广州大桥', district: 'haizhu', grade: 'B', lat: 23.1102, lon: 113.311, rect: [12, 36], focusY: 4, build: buildGuangzhouBridge, noCity: true,
    desc: '广州大桥建成于1985年，连接天河区与海珠区，是广州大道跨越珠江的重要通道。' },
  { id: 'liedebridge', name: '猎德大桥', district: 'tianhe', grade: 'A', lat: 23.1086, lon: 113.342, rect: [14, 40], focusY: 30, build: buildLiedeBridge, noCity: true,
    desc: '猎德大桥是独塔自锚式悬索桥，主塔造型如一枚贝壳，2009年通车，是珠江新城东侧的地标。' },
  { id: 'gztpier', name: '广州塔码头', hidden: true, district: 'haizhu', grade: 'B', lat: 23.1092, lon: 113.3205, snap: 'north', snapOff: 0, rot: Math.PI, rect: [12, 10], focusY: 4, build: buildTowerPier },
  { id: 'pazhou', name: '琶洲会展中心', district: 'haizhu', grade: 'A', lat: 23.1, lon: 113.365, rect: [125, 42], focusY: 14, photoR: 600, build: buildPazhou,
    desc: '中国进出口商品交易会展馆（广交会）位于琶洲岛，是亚洲最大的会展中心之一。旁边的琶洲塔建于明代万历年间。' },
  { id: 'sysu', name: '中山大学', district: 'haizhu', grade: 'A', lat: 23.0985, lon: 113.2985, rect: [36, 44], focusY: 8, build: buildSYSU,
    desc: '中山大学南校区（康乐园）原为岭南大学校址，红砖绿瓦的怀士堂等历史建筑掩映在百年古树之间。' },
  // ---------- 越秀区 ----------
  { id: 'zhenhai', name: '越秀公园·镇海楼', district: 'yuexiu', grade: 'A', lat: 23.1405, lon: 113.2645, rect: [34, 34], focusY: 16, build: buildYuexiuPark,
    desc: '越秀公园是广州最大的综合性公园，园内的镇海楼建于1380年，是广州古城的标志，被称为“岭南第一胜览”。' },
  { id: 'wuyang', name: '五羊石像', district: 'yuexiu', grade: 'S', lat: 23.138, lon: 113.2702, rect: [18, 18], focusY: 9, build: buildWuyang,
    desc: '五羊石像建于1959年，取材于“五仙骑五羊、衔穗降羊城”的传说，是广州的城徽，广州因此又称“羊城”“穗城”。' },
  { id: 'memorial', name: '中山纪念堂', district: 'yuexiu', grade: 'S', lat: 23.1343, lon: 113.265, rect: [30, 36], focusY: 16, build: buildMemorialHall,
    desc: '中山纪念堂为纪念孙中山先生而建，1931年落成。八角形宫殿式建筑，宝蓝色琉璃瓦，堂前的三百年木棉每年春天开满红花。' },
  { id: 'beijingroad', name: '北京路', alias: '千年古道', district: 'yuexiu', grade: 'A', lat: 23.1243, lon: 113.2685, rect: [18, 70], focusY: 5, build: buildBeijingRoad,
    desc: '北京路是广州最繁华的商业步行街，也是两千多年来广州城市的中轴线，地下发现了跨越千年的11层古道遗址。' },
  { id: 'nanyue', name: '南越王博物馆', district: 'yuexiu', grade: 'A', lat: 23.1385, lon: 113.26, rect: [24, 34], focusY: 10, build: buildNanyueMuseum,
    desc: '西汉南越王博物馆建于南越文王赵眜墓址上，出土的丝缕玉衣、“文帝行玺”金印是镇馆之宝。' },
  { id: 'sacredheart', name: '圣心大教堂', alias: '石室', district: 'yuexiu', grade: 'S', lat: 23.1185, lon: 113.2655, rect: [16, 32], focusY: 24, build: buildSacredHeart,
    desc: '石室圣心大教堂是全国最大的天主教哥特式石结构建筑，双塔尖高58.5米，彩色玻璃窗绚丽夺目。' },
  { id: 'liurong', name: '六榕寺花塔', district: 'yuexiu', grade: 'A', lat: 23.13, lon: 113.259, rect: [18, 30], focusY: 18, build: buildLiurong,
    desc: '六榕寺已有1400多年历史，寺内花塔八角九层，因塔身绚丽如花而得名，是广州古城的标志之一。' },
  { id: 'tianzi', name: '天字码头', alias: '珠江夜游', district: 'yuexiu', grade: 'A', lat: 23.1175, lon: 113.2745, snap: 'south', snapOff: 0, rect: [16, 10], focusY: 6, build: buildTianziPier,
    desc: '天字码头是广州历史最悠久的码头，清代为官府专用码头，如今是珠江夜游的主要登船点。' },
  { id: 'haizhubridge', name: '海珠桥', district: 'yuexiu', grade: 'A', lat: 23.1145, lon: 113.2685, rect: [10, 38], focusY: 6, build: buildHaizhuBridge, noCity: true,
    desc: '海珠桥建成于1933年，是珠江上第一座跨江大桥，三孔钢拱桥身是老广州的经典记忆。' },
  { id: 'ersha', name: '二沙岛·星海音乐厅', district: 'yuexiu', grade: 'A', lat: 23.115, lon: 113.3015, rect: [42, 26], focusY: 10, build: buildErsha,
    desc: '星海音乐厅位于二沙岛，以人民音乐家冼星海命名，屋顶为双曲抛物面，宛如江边展翅的天鹅。' },
  // ---------- 荔湾区 ----------
  { id: 'chenclan', name: '陈家祠', alias: '陈氏书院', district: 'liwan', grade: 'S', lat: 23.1286, lon: 113.2455, rect: [32, 42], focusY: 8, build: buildChenClanHall,
    desc: '陈家祠建于1888-1894年，是广东72县陈姓宗亲合资兴建的合族宗祠。三进三路九堂两厢，以木雕、石雕、砖雕、陶塑、灰塑、铜铁铸和彩绘闻名，被誉为“岭南建筑艺术的明珠”。' },
  { id: 'shamian', name: '沙面', district: 'liwan', grade: 'S', lat: 23.1071, lon: 113.243, rect: [98, 46], focusY: 8, build: buildShamian, noCity: true,
    desc: '沙面曾是英法租界，岛上保留了150多座欧式建筑，新古典、哥特、巴洛克风格并存。古榕成荫、江风习习，是广州最具异国风情的街区。' },
  { id: 'yongqingfang', name: '永庆坊', district: 'liwan', grade: 'A', lat: 23.119, lon: 113.2395, rect: [64, 44], focusY: 6, build: buildYongqingfang,
    desc: '永庆坊位于恩宁路，是广州最长、最完整的骑楼街所在地。微改造后的西关民居、粤剧艺术博物馆与李小龙祖居让老城焕发新活力。' },
  { id: 'shangxiajiu', name: '上下九步行街', district: 'liwan', grade: 'A', lat: 23.1175, lon: 113.247, rect: [86, 18], focusY: 6, build: buildShangxiajiu,
    desc: '上下九是广州最早的商业步行街之一，两侧是连绵的西关骑楼，陶陶居、莲香楼等老字号茶楼与各色广式小吃云集。' },
  { id: 'lizhiwan', name: '荔枝湾', district: 'liwan', grade: 'B', lat: 23.1225, lon: 113.2359, rect: [22, 42], focusY: 5, build: buildLizhiwan,
    desc: '“一湾溪水绿，两岸荔枝红”。荔枝湾涌两岸是典型的西关大屋，乘艇仔游涌、吃一碗艇仔粥是老西关的风味。' },
  // ---------- 天河区 ----------
  { id: 'huacheng', name: '花城广场', district: 'tianhe', grade: 'A', lat: 23.1195, lon: 113.3245, rect: [24, 70], focusY: 4, build: buildHuacheng,
    desc: '花城广场位于珠江新城中轴线上，北起黄埔大道，南至珠江，被称为广州的“城市客厅”。' },
  { id: 'ifc', name: '广州国际金融中心', alias: '西塔', district: 'tianhe', grade: 'A', lat: 23.12, lon: 113.3215, rect: [24, 24], focusY: 110, photoR: 1400, lod: ifcLOD, lodAlways: true, build: buildIFC,
    desc: '广州国际金融中心（西塔）高440米，外立面为斜交网格结构，与东塔、广州塔共同构成珠江新城天际线。' },
  { id: 'ctf', name: '周大福金融中心', alias: '东塔', district: 'tianhe', grade: 'A', lat: 23.12, lon: 113.3275, rect: [27, 25], focusY: 120, photoR: 1400, lod: ctfLOD, lodAlways: true, build: buildCTF,
    desc: '广州周大福金融中心（东塔）高530米，是广州第一高楼，阶梯状退台与白色陶土竖向肋条是其标志。' },
  { id: 'opera', name: '广州大剧院', district: 'tianhe', grade: 'A', lat: 23.1168, lon: 113.3218, rect: [36, 30], focusY: 12, build: buildOperaHouse,
    desc: '广州大剧院由扎哈·哈迪德设计，两块“圆润双砾”造型的建筑被誉为世界十大歌剧院之一。' },
  { id: 'gdmuseum', name: '广东省博物馆', district: 'tianhe', grade: 'A', lat: 23.1158, lon: 113.3275, rect: [30, 30], focusY: 18, build: buildGDMuseum,
    desc: '广东省博物馆新馆以“宝盒”为设计理念，外立面镂空雕刻，馆内展示广东历史、自然与艺术珍藏。' },
  { id: 'tiyuzhongxin', name: '天河体育中心', district: 'tianhe', grade: 'A', lat: 23.1395, lon: 113.3235, rect: [78, 52], focusY: 8, photoR: 500, build: buildSportsCenter,
    desc: '天河体育中心为1987年第六届全运会而建，体育场、体育馆和游泳馆三馆合一，是天河CBD的起点。' },
  { id: 'grandview', name: '正佳广场', district: 'tianhe', grade: 'B', lat: 23.1335, lon: 113.327, rect: [38, 26], focusY: 16, build: buildGrandview,
    desc: '正佳广场是华南地区规模最大的购物中心之一，集购物、娱乐、海洋馆、雨林植物园于一体。' },
  { id: 'taikoo', name: '太古汇', district: 'tianhe', grade: 'B', lat: 23.1385, lon: 113.3325, rect: [36, 22], focusY: 40, build: buildTaikoo,
    desc: '太古汇位于天河路，由商场、两座甲级写字楼和文华东方酒店组成，是广州高端商业地标。' },
  { id: 'citic', name: '中信广场', district: 'tianhe', grade: 'A', lat: 23.145, lon: 113.3235, rect: [32, 30], focusY: 90, photoR: 1200, lod: citicLOD, lodAlways: true, build: buildCitic,
    desc: '中信广场高391米，1997年建成时曾是亚洲最高的钢筋混凝土建筑，顶部双天线是天河北的标志。' },
  { id: 'eaststation', name: '广州东站', district: 'tianhe', grade: 'A', lat: 23.151, lon: 113.3235, rect: [62, 46], focusY: 16, build: buildEastStation,
    desc: '广州东站位于天河区城市中轴线北端，是广深铁路的起点站，站前广场的喷泉是许多人到达广州的第一印象。' },
  { id: 'cbd', name: '天河CBD', alias: '珠江新城', district: 'tianhe', grade: 'B', lat: 23.1235, lon: 113.3335, rect: [16, 16], focusY: 80, photoR: 1000, build: buildCBD,
    desc: '珠江新城是广州天河CBD核心区，数百栋高楼林立，是华南地区的金融与商务中心。' },
  // ---------- 白云区 ----------
  { id: 'baiyun', name: '白云山', alias: '摩星岭', district: 'baiyun', grade: 'A', lat: 23.183, lon: 113.297, rect: [16, 16], focusY: 6, photoR: 1500, build: buildMoxingling, foundation: true,
    desc: '白云山是南粤名山，主峰摩星岭海拔382米。登顶可俯瞰整个广州城，“白云晚望”为羊城八景之一。' },
  { id: 'baiyungate', name: '白云山南门', district: 'baiyun', grade: 'B', lat: 23.1625, lon: 113.2955, rect: [26, 14], focusY: 8, build: buildBaiyunGate, foundation: true,
    desc: '白云山南门附近有白云索道，可乘缆车直达山顶摩星岭附近，沿途林海苍翠。' },
  { id: 'yuntai', name: '云台花园', district: 'baiyun', grade: 'B', lat: 23.1525, lon: 113.2895, rect: [42, 32], focusY: 4, build: buildYuntai,
    desc: '云台花园位于白云山南麓，是国内最大的园林式花园之一，欧式规则花坛、花钟与喷泉四季缤纷。' },
  // ---------- 番禺区 ----------
  { id: 'chimelong', name: '长隆欢乐世界', district: 'panyu', grade: 'A', lat: 23.01, lon: 113.33, rect: [72, 52], focusY: 20, photoR: 600, build: buildChimelong,
    desc: '长隆欢乐世界是国内顶级主题乐园，拥有十环过山车、垂直过山车、摩托过山车等世界级游乐设备。' },
  { id: 'safari', name: '长隆野生动物世界', district: 'panyu', grade: 'A', lat: 23.01, lon: 113.31, rect: [72, 56], focusY: 4, build: buildSafari,
    desc: '长隆野生动物世界是中国最大的野生动物主题公园，可以近距离观赏大熊猫、白虎、长颈鹿、亚洲象等动物。' },
  { id: 'dafushan', name: '大夫山', district: 'panyu', grade: 'B', lat: 22.958, lon: 113.336, rect: [16, 10], focusY: 6, build: buildDafushan, foundation: true,
    desc: '大夫山森林公园是番禺的“绿肺”，环湖绿道与山林步道是骑行与徒步胜地。' },
  // ---------- 南沙区 ----------
  { id: 'wetland', name: '南沙湿地', district: 'nansha', grade: 'B', lat: 22.62, lon: 113.64, rect: [92, 72], focusY: 4, photoR: 400, build: buildWetland, noCity: true,
    desc: '南沙湿地公园位于珠江出海口，芦苇荡与红树林连绵，每年冬季吸引大量候鸟栖息，是“广州的天鹅湖”。' },
  { id: 'seaside', name: '南沙滨海公园', district: 'nansha', grade: 'B', lat: 22.758, lon: 113.63, snap: 'east', snapOff: 18, rot: Math.PI / 2, rect: [34, 82], focusY: 6, build: buildSeaside,
    desc: '南沙滨海公园面朝伶仃洋，椰林、沙滩与灯塔构成广州难得的海滨风光。' },
  { id: 'tinhau', name: '南沙天后宫', district: 'nansha', grade: 'A', lat: 22.745, lon: 113.618, rect: [28, 36], focusY: 12, build: buildTinHau, foundation: true,
    desc: '南沙天后宫依山面海，建筑仿北京故宫风格，红墙黄瓦层层递进，是全球规模最大的妈祖庙。' }
]

export const GRADE_INFO = { S: '高度还原建筑', A: '主要建筑', B: '区域氛围' }
