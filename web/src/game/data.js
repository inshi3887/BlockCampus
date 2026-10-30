// 游戏数据：美食、文化、纪念品、商店、任务、NPC 对白
export const FOODS = {
  dimsum: { name: '早茶·虾饺烧卖', icon: '🥟', price: 38, desc: '“叹早茶”是广州人的生活方式。一盅两件：一壶茶配虾饺、烧卖、凤爪，虾饺皮薄透亮，是点心之王。' },
  charsiu: { name: '叉烧包', icon: '🍙', price: 10, desc: '广式早茶“四大天王”之一，面皮松软微裂，内馅是蜜汁叉烧，咸甜适中。' },
  cheungfun: { name: '肠粉', icon: '🍜', price: 12, desc: '布拉肠粉米浆蒸得薄如蝉翼，淋上特调酱油。北京路的银记肠粉是老字号。' },
  wonton: { name: '云吞面', icon: '🍲', price: 18, desc: '竹升打制的全蛋细面配鲜虾云吞，汤底用大地鱼与猪骨熬制，是西关的经典味道。' },
  goose: { name: '烧鹅', icon: '🍗', price: 45, desc: '皮脆肉嫩、肥而不腻，蘸酸梅酱食用。深井烧鹅、烧腊店的招牌。' },
  dessert: { name: '双皮奶', icon: '🍮', price: 15, desc: '起源于顺德的甜品，以水牛奶制作，表面两层奶皮，香滑可口，上下九南信是老字号。' },
  congee: { name: '艇仔粥', icon: '🥣', price: 16, desc: '源自荔枝湾的水上人家，粥底绵滑，配鱼片、虾仁、花生、油条，“艇仔”即小船。' },
  beef: { name: '牛杂', icon: '🍢', price: 15, desc: '萝卜炖牛杂是广州街头的经典小吃，香气四溢，配上一点芥辣更地道。' },
  herbal: { name: '凉茶', icon: '🍵', price: 6, desc: '岭南地区湿热，广州人常饮凉茶清热祛湿，王老吉、廿四味都是常见品种。' },
  coffee: { name: '沙面咖啡', icon: '☕', price: 32, desc: '在沙面百年欧式建筑间喝一杯咖啡，感受中西交融的广州味道。' }
}

export const CULTURE = {
  opera: { name: '粤剧', icon: '🎭', desc: '粤剧是联合国人类非物质文化遗产，以粤语演唱，唱腔丰富、服饰华丽，被誉为“南国红豆”。恩宁路是粤剧艺人的聚居地。' },
  lion: { name: '舞狮（醒狮）', icon: '🦁', desc: '广东醒狮是南狮的代表，以鼓乐伴奏，模仿狮子的喜、怒、哀、乐、动、静、惊、疑八态，逢年过节必舞，寓意驱邪纳福。' },
  guangfu: { name: '广府文化', icon: '🏮', desc: '广府文化以广州为中心，包括粤语、粤剧、广府菜、骑楼建筑、早茶等，兼收并蓄、务实包容。' },
  qilou: { name: '骑楼建筑', icon: '🏛️', desc: '骑楼是岭南特有的建筑形式，楼上住人、楼下开店，柱廊连成一片，可遮阳避雨，上下九与恩宁路最为完整。' },
  huisu: { name: '陶塑与灰塑', icon: '🏺', desc: '陈家祠屋脊上的陶塑瓦脊由石湾窑烧制，人物、亭台色彩鲜艳；灰塑以石灰为主料塑造，是岭南建筑独有的装饰工艺。' },
  wuyang: { name: '五羊传说', icon: '🐏', desc: '相传周朝时五位仙人骑着口衔稻穗的五只仙羊降临广州，祝愿此地永无饥荒，广州因此得名“羊城”“穗城”。' },
  kapok: { name: '木棉·英雄花', icon: '🌺', desc: '木棉是广州市花，每年春天先花后叶，红花开满枝头，花大而红，被称为“英雄花”。' },
  dragonboat: { name: '龙舟', icon: '🐉', desc: '端午扒龙舟是广州的传统，猎德村的龙舟景、车陂的龙舟赛远近闻名，“猎德龙舟”还会在珠江上“游龙探亲”。' },
  teaculture: { name: '早茶文化', icon: '🫖', desc: '“饮早茶”不仅是吃，更是社交。斟茶时以手指轻敲桌面致谢，掀起壶盖示意添水，都是茶楼里的老规矩。' }
}

export const SOUVENIRS = {
  s_tower: { name: '小蛮腰模型', icon: '🗼', desc: '登上广州塔观景平台获得。' },
  s_lion: { name: '醒狮头挂件', icon: '🦁', desc: '观看陈家祠醒狮表演获得。' },
  s_wood: { name: '陈家祠木雕', icon: '🪵', desc: '在陈家祠纪念品店购买或完成寻找陈家祠任务获得。' },
  s_ram: { name: '五羊公仔', icon: '🐑', desc: '聆听五羊传说获得。' },
  s_porcelain: { name: '广彩瓷杯', icon: '🍶', desc: '广彩是广州传统釉上彩瓷，金碧辉煌。', price: 88 },
  s_card: { name: '羊城通纪念卡', icon: '💳', desc: '首次乘坐地铁获得。' },
  s_fan: { name: '岭南折扇', icon: '🪭', desc: '北京路手信店有售。', price: 25 },
  s_postcard: { name: '广州明信片套装', icon: '🖼️', desc: '北京路手信店有售。', price: 15 },
  s_badge: { name: '广州旅行纪念章', icon: '🏅', desc: '完成新手旅行任务获得。' },
  s_kapok: { name: '木棉书签', icon: '🔖', desc: '在中山纪念堂赏木棉获得。' },
  s_opera: { name: '粤剧脸谱', icon: '🎭', desc: '观看粤剧表演获得。' },
  s_cruise: { name: '珠江夜游船票', icon: '🎫', desc: '乘坐珠江夜游获得。' },
  s_cable: { name: '白云索道票根', icon: '🚡', desc: '乘坐白云索道获得。' },
  s_yuexiu: { name: '越秀历史徽章', icon: '📜', desc: '完成越秀区历史探索路线。' },
  s_liwan: { name: '西关风情徽章', icon: '🏮', desc: '完成荔湾区岭南老广州任务。' },
  s_tianhe: { name: '都市天际线徽章', icon: '🏙️', desc: '完成天河区现代都市探索。' },
  s_haizhu: { name: '珠江夜景徽章', icon: '🌃', desc: '完成海珠区夜景模式任务。' },
  s_baiyun: { name: '白云登高徽章', icon: '⛰️', desc: '登上白云山摩星岭。' },
  s_panyu: { name: '欢乐番禺徽章', icon: '🎢', desc: '游览长隆。' },
  s_nansha: { name: '滨海南沙徽章', icon: '🌊', desc: '游览南沙湿地与天后宫。' },
  s_foodie: { name: '“食在广州”金筷子', icon: '🥢', desc: '品尝6种广州美食。' },
  s_culture: { name: '岭南文化达人证书', icon: '📕', desc: '解锁6项广府文化。' },
  s_tshirt: { name: '“我爱广州”T恤', icon: '👕', desc: '正佳广场有售。', price: 59 }
}

export const SHOPS = {
  teahouse: { name: '老字号茶楼', greet: '早晨！饮咗茶未呀？一盅两件，慢慢叹～', items: ['dimsum', 'charsiu'] },
  cheungfun: { name: '银记肠粉', greet: '靓仔靓女，要牛肉肠定虾肠呀？', items: ['cheungfun'] },
  noodle: { name: '云吞面世家', greet: '竹升面，新鲜鲜虾云吞，细蓉一碗？', items: ['wonton'] },
  goose: { name: '深井烧鹅', greet: '啱啱出炉嘅烧鹅，要上庄定下庄？', items: ['goose'] },
  dessert: { name: '南信双皮奶', greet: '食碗双皮奶，甜甜蜜蜜！', items: ['dessert'] },
  congee: { name: '艇仔粥摊', greet: '荔枝湾艇仔粥，好味又暖胃！', items: ['congee'] },
  beef: { name: '牛杂档', greet: '萝卜牛杂，香到隔离街都闻到！', items: ['beef', 'herbal'] },
  cafe: { name: '沙面咖啡馆', greet: '欢迎光临，来杯手冲咖啡配江景吧。', items: ['coffee'] },
  souvenir: { name: '广州手信店', greet: '买份手信带返屋企啦！', items: ['s_fan', 's_postcard'] },
  chenclan: { name: '陈家祠纪念品店', greet: '欢迎参观陈家祠，这里有精美的广彩和木雕。', items: ['s_porcelain', 's_wood'] },
  mall: { name: '正佳广场', greet: '欢迎来到正佳广场！', items: ['s_tshirt', 'dimsum'] }
}
SOUVENIRS.s_wood.price = 120

// ---------- 任务 ----------
// cond: {type, ...}  事件驱动累计
export const NOVICE = [
  { id: 'n1', title: '拍摄广州塔', desc: '前往海珠区，用相机（C键）拍下广州塔“小蛮腰”。', cond: { type: 'photo', id: 'cantontower' }, reward: { money: 100 } },
  { id: 'n2', title: '寻找陈家祠', desc: '前往荔湾区中山七路，找到岭南建筑艺术明珠——陈家祠。', cond: { type: 'discover', id: 'chenclan' }, reward: { money: 100, item: 's_wood' } },
  { id: 'n3', title: '购买一份早茶', desc: '到上下九的老字号茶楼或正佳广场，叹一份广式早茶。', cond: { type: 'buy', id: 'dimsum' }, reward: { money: 80 } },
  { id: 'n4', title: '完成广州旅行', desc: '乘坐广州塔电梯登上观景平台，俯瞰整座羊城。', cond: { type: 'deck' }, reward: { money: 300, item: 's_badge' } }
]

export const QUESTS = [
  { id: 'q_yuexiu', district: 'yuexiu', title: '越秀·历史探索路线', desc: '拍摄越秀区5处历史景点', cond: { type: 'photoSet', ids: ['zhenhai', 'wuyang', 'memorial', 'beijingroad', 'nanyue', 'sacredheart', 'liurong', 'haizhubridge', 'tianzi'], n: 5 }, reward: { money: 200, item: 's_yuexiu' } },
  { id: 'q_liwan', district: 'liwan', title: '荔湾·岭南老广州', desc: '拍摄陈家祠、沙面、永庆坊、上下九', cond: { type: 'photoSet', ids: ['chenclan', 'shamian', 'yongqingfang', 'shangxiajiu'], n: 4 }, reward: { money: 200, item: 's_liwan' } },
  { id: 'q_tianhe', district: 'tianhe', title: '天河·现代都市探索', desc: '拍摄西塔、东塔、体育中心、中信广场、广州东站', cond: { type: 'photoSet', ids: ['ifc', 'ctf', 'tiyuzhongxin', 'citic', 'eaststation'], n: 5 }, reward: { money: 200, item: 's_tianhe' } },
  { id: 'q_haizhu', district: 'haizhu', title: '海珠·夜景模式', desc: '夜晚拍摄广州塔灯光秀，并乘坐一次珠江夜游', cond: { type: 'multi', parts: [{ type: 'nightPhoto', id: 'cantontower' }, { type: 'cruise' }] }, reward: { money: 250, item: 's_haizhu' } },
  { id: 'q_baiyun', district: 'baiyun', title: '白云·登高望远', desc: '登上白云山摩星岭（可乘白云索道）远眺广州', cond: { type: 'view', id: 'peak' }, reward: { money: 200, item: 's_baiyun' } },
  { id: 'q_panyu', district: 'panyu', title: '番禺·欢乐长隆', desc: '游览长隆欢乐世界与长隆野生动物世界', cond: { type: 'discoverSet', ids: ['chimelong', 'safari'], n: 2 }, reward: { money: 200, item: 's_panyu' } },
  { id: 'q_nansha', district: 'nansha', title: '南沙·滨海湿地', desc: '游览南沙湿地与南沙天后宫', cond: { type: 'discoverSet', ids: ['wetland', 'tinhau'], n: 2 }, reward: { money: 200, item: 's_nansha' } },
  { id: 'q_food', title: '食在广州', desc: '品尝6种不同的广州美食', cond: { type: 'foodCount', n: 6 }, reward: { money: 150, item: 's_foodie' } },
  { id: 'q_culture', title: '岭南文化达人', desc: '解锁6项广府文化图鉴', cond: { type: 'cultureCount', n: 6 }, reward: { money: 150, item: 's_culture' } }
]

export const DAILY_POOL = [
  { id: 'd_photo3', title: '今天拍摄3个建筑', cond: { type: 'dailyPhotos', n: 3 }, reward: { money: 60 } },
  { id: 'd_npc5', title: '找到5个NPC聊天', cond: { type: 'dailyTalk', n: 5 }, reward: { money: 50 } },
  { id: 'd_district', title: '探索一个新区', cond: { type: 'dailyDistricts', n: 2 }, reward: { money: 60 } },
  { id: 'd_bus', title: '乘坐一次观光巴士', cond: { type: 'dailyCount', key: 'bus', n: 1 }, reward: { money: 40 } },
  { id: 'd_metro', title: '乘坐一次地铁', cond: { type: 'dailyCount', key: 'metro', n: 1 }, reward: { money: 40 } },
  { id: 'd_food2', title: '品尝2种美食', cond: { type: 'dailyCount', key: 'food', n: 2 }, reward: { money: 50 } },
  { id: 'd_night', title: '夜晚拍摄一张照片', cond: { type: 'dailyCount', key: 'nightPhoto', n: 1 }, reward: { money: 50 } },
  { id: 'd_walk', title: '步行1000米', cond: { type: 'dailyCount', key: 'walk', n: 1000 }, reward: { money: 40 } },
  { id: 'd_culture', title: '体验一项岭南文化', cond: { type: 'dailyCount', key: 'culture', n: 1 }, reward: { money: 50 } },
  { id: 'd_selfie', title: '拍一张自拍', cond: { type: 'dailyCount', key: 'selfie', n: 1 }, reward: { money: 30 } }
]

// ---------- NPC ----------
export const NPC_TYPES = {
  office: { name: '上班族', weight: 3 },
  student: { name: '学生', weight: 2 },
  elder: { name: '老人', weight: 2 },
  tourist: { name: '游客', weight: 3 },
  kid: { name: '小孩', weight: 1 },
  local: { name: '街坊', weight: 2 }
}

export const SURNAMES = ['陈', '李', '黄', '梁', '何', '张', '林', '罗', '郭', '冯', '麦', '邓', '谭', '吴', '杨']
export const NICK = { office: ['先生', '小姐', '经理', '工'], student: ['同学'], elder: ['伯', '婆婆', '叔', '姨'], tourist: ['游客'], kid: ['仔', '妹妹'], local: ['师傅', '姐', '哥'] }

export const DIALOG = {
  office: ['又要加班……今晚去珠江新城吃个宵夜先。', '地铁3号线早高峰真系“人肉罐头”！', '我喺东塔上班，落班可以睇到广州塔亮灯。', '下班一齐去饮茶？我知道一间好正嘅茶楼。', '天河CBD好多公司，机会多，压力都大。'],
  student: ['我哋学校就喺附近，放学成日去食双皮奶！', '周末想去长隆玩过山车！', '你知唔知中山大学系孙中山先生创办嘅？', '老师话广州有两千多年历史，好劲呀！', '我最钟意喺沙面影相，好似去咗欧洲。'],
  elder: ['以前这里都是骑楼。', '后生仔，饮咗茶未？我日日去茶楼叹早茶。', '我细个嗰阵，珠江边仲有好多艇仔。', '木棉花开就系春天到喇，英雄花呀！', '粤剧好好听㗎，得闲去恩宁路听下。', '以前海珠桥系珠江上第一座桥，好多人过桥返工。'],
  tourist: ['第一次来广州，要去哪里玩？', '广州塔晚上的灯光秀太美了！', '听说陈家祠的屋脊雕塑超级精美。', '我要把广州的美食都吃一遍！', '珠江夜游一定要坐，夜景超赞！', '能帮我拍张照吗？谢谢～'],
  kid: ['我想食雪糕！', '哥哥姐姐，你见过五羊石像吗？有五只羊咩咩！', '我阿爸话今晚带我去睇广州塔！', '醒狮好好睇呀，咚咚锵！'],
  local: ['广州人讲“食咗饭未”就系打招呼。', '落雨记得带遮，广州啲天说变就变。', '台风嚟嘅时候唔好出街呀！', '呢度啲肠粉一流，记得试下！', '搭地铁去边度都好方便。', '“广州”简称“穗”，又叫羊城、花城。']
}

export const WEATHER_LINES = {
  rain: ['落雨喇，快啲揾地方避雨！', '回南天又嚟，成屋都湿晒。', '下雨天去茶楼饮茶最舒服。'],
  typhoon: ['打风喇！大家快啲返屋企！', '台风信号挂咗，听日可能唔使返工？'],
  night: ['夜晚嘅珠江好靓，你去咗夜游未？', '宵夜时间到！去食烧烤定糖水？', '广州塔又亮灯喇！']
}

export const LANDMARK_LINES = {
  cantontower: ['广州塔又叫“小蛮腰”，600米高！', '塔顶有摩天轮，可以坐住转一圈睇全城。'],
  chenclan: ['陈家祠系陈氏书院，好多雕刻都系手工做嘅。', '屋顶上面啲公仔叫“陶塑瓦脊”，好精细。'],
  shamian: ['沙面以前系租界，所以有咁多欧式建筑。', '呢度啲榕树都好多年历史喇。'],
  beijingroad: ['北京路地下有千年古道，可以隔住玻璃睇到。', '北京路系广州最旺嘅步行街之一。'],
  shangxiajiu: ['上下九啲骑楼好有特色，落雨都唔会湿身。', '记得试下南信双皮奶！'],
  yongqingfang: ['李小龙祖居就喺永庆坊入面！', '粤剧艺术博物馆有时会有表演。'],
  memorial: ['纪念堂入面冇一条柱，好劲嘅设计。', '门口嗰棵木棉有三百几岁喇。'],
  zhenhai: ['镇海楼又叫五层楼，好多年历史。'],
  wuyang: ['五只羊口衔稻穗，祝广州五谷丰登。'],
  baiyun: ['白云山顶睇日落，正到爆！'],
  huacheng: ['花城广场系广州嘅城市客厅。'],
  chimelong: ['十环过山车好刺激！', '排队要好耐，但系值得。']
}
