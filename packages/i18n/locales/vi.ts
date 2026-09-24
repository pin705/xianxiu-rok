import {
  ADV, BEATS, DISADV, DO_KIEP, ELDER_STEP, REBIRTH_BUILD, REBIRTH_PROD, TOWER, TRADE_KEEP, TRADE_KEEP_MAX, TRIB_COOLDOWN, WEEKEND, rebirthLevels,
  type Bonus, type BuildingId, type ElderId, type PillId, type Quest, type Res, type Skill, type Target, type TechId, type Tier,
  type UnitId, type UnitType,
} from '@rok/rules'

// Chữ hiển thị tiếng Việt. Bản tiếng Anh ở en.ts, cùng khuôn (kiểu Text).
const pct = (v: number) => `${Math.round(v * 100)}%`
const perks = (n: number) =>
  `khởi đầu với công trình tầng ${rebirthLevels(n).chuDien}, sản lượng +${pct(n * REBIRTH_PROD)}, xây nhanh hơn ${pct(n * REBIRTH_BUILD)}`
const units = { kiem: 'Kiếm tu', phap: 'Pháp tu', the: 'Thể tu' } satisfies Record<UnitType, string>
const tiers = { 1: 'Ngoại môn', 2: 'Nội môn', 3: 'Chân truyền' } satisfies Record<Tier, string>
const res = { linhThach: 'Linh thạch', linhThao: 'Linh thảo', linhKhoang: 'Linh khoáng' } satisfies Record<Res, string>

export const vi = {
  game: 'Sơn Hà Tiên Tông',
  tagline: 'Dựng tông môn · Tranh linh mạch · Phi thăng',
  tapToStart: 'Chạm để bắt đầu',
  tapToContinue: 'Chạm để tiếp tục',
  intro: [
    'Linh khí khô kiệt. Vạn tông lụi tàn.',
    'Trên ngọn núi phủ sương này, chỉ còn một chủ điện đổ nát — và bạn.',
    'Truyền thừa đã trao. Hãy dựng lại tông môn.',
  ],
  skip: 'Bỏ qua',
  naming: {
    title: 'Đặt tên tông môn',
    hint: 'Tên sẽ khắc lên ấn tông môn và hiện với mọi đạo hữu.',
    reroll: 'Gợi ý khác',
    found: 'Lập tông môn',
    tooShort: 'Tên cần từ 2 đến 20 ký tự',
    taken: 'Tên này đã có tông môn khác dùng trong giới',
    bad: 'Tên chỉ gồm chữ, số và dấu cách',
    first: ['Thanh Vân', 'Huyền Thiên', 'Lạc Hà', 'Tử Vi', 'Vô Cực', 'Thái Sơ', 'Linh Lung', 'Bích Lạc', 'Hàn Sơn', 'Vân Mộng', 'Lăng Tiêu', 'Thiên Kiếm'],
    last: ['Tông', 'Môn', 'Phái', 'Cung'],
  },

  realmName: (level: number) => ['Luyện Khí', 'Trúc Cơ', 'Kim Đan'][Math.min(3, Math.ceil(level / 5)) - 1],
  realm: (level: number) => `${vi.realmName(level)} · tầng ${level}`,
  level: (n: number) => `Tầng ${n}`,
  lv: (n: number) => `Cấp ${n}`,
  power: 'Thế lực',
  full: 'Đầy',
  sound: { on: 'Tắt âm thanh', off: 'Bật âm thanh' },
  res,
  b: {
    chuDien: { name: 'Chủ điện', lore: 'Nơi chưởng môn tọa thiền. Tầng Chủ điện là cảnh giới của bạn — không công trình nào được cao hơn.' },
    tuLinhTran: { name: 'Tụ Linh Trận', lore: 'Trận pháp gom linh khí trời đất, ngưng thành linh thạch.' },
    linhDien: { name: 'Linh điền', lore: 'Ruộng linh dược tưới bằng nước suối trên núi.' },
    khoangMach: { name: 'Khoáng mạch', lore: 'Mạch khoáng nằm sâu trong vách đá, đào ra linh khoáng.' },
    tangBaoCac: { name: 'Tàng Bảo Các', lore: 'Kho báu của tông môn. Tầng càng cao, chứa được càng nhiều.' },
    dienVoTruong: { name: 'Diễn võ trường', lore: 'Nơi đệ tử luyện kiếm mỗi sớm mai. Tầng càng cao, mỗi lượt tuyển càng đông.' },
    danPhong: { name: 'Đan phòng', lore: 'Lò đan chưa từng tắt lửa. Chữa thương binh và luyện đan dược.' },
    tangKinhCac: { name: 'Tàng Kinh Các', lore: 'Lưu giữ công pháp của các đời chưởng môn.' },
  } satisfies Record<BuildingId, { name: string; lore: string }>,
  soonTag: 'sắp có',

  quest: {
    title: 'Nhiệm vụ',
    text(q: Quest) {
      const id = Number(q.id)
      switch (q.k) {
        case 'build': {
          const b = q.id as BuildingId
          if (b === 'chuDien' && (q.n === 6 || q.n === 11)) return `Độ kiếp — đột phá ${vi.realmName(q.n)}`
          return q.n === 1 ? `Xây ${vi.b[b].name}` : `Nâng ${vi.b[b].name} lên tầng ${q.n}`
        }
        case 'train': return `Có ${q.n} đệ tử`
        case 'hunt': return `Hạ ${vi.beasts[q.n - 1]} (yêu thú cấp ${q.n})`
        case 'sect': return `Công phá ${vi.sects[id].name}`
        case 'realm': return q.n === 1 ? `Thám hiểm ${vi.realms[id].name}` : `Qua tầng ${q.n} ${vi.realms[id].name}`
        case 'tech': return q.n === 1 ? 'Lĩnh ngộ một công pháp' : `Lĩnh ngộ tổng ${q.n} tầng công pháp`
        case 'brew': return `Luyện ${q.n} viên đan`
      }
    },
    reward: 'Thưởng',
    claim: 'Nhận thưởng',
    allDone: 'Đã xong chuỗi nhiệm vụ. Chủ điện tầng 15 có thể luân hồi để mạnh hơn.',
  },
  builder: { idle: 'Rảnh', label: 'Tạp dịch' },
  // cột trái desktop: mọi việc đang chạy
  activity: { title: 'Đang diễn ra', empty: 'Không có việc nào đang chạy.', march: (elder: string, target: string) => `${elder} → ${target}` },

  panel: {
    output: 'Sản lượng',
    perHour: '/giờ',
    capacity: 'Sức chứa mỗi loại',
    batch: 'Mỗi lượt tuyển',
    hospital: 'Chỗ nằm thương binh',
    rows: 'Hàng công pháp mở',
    slots: 'Đội xuất quân',
    requires: 'Yêu cầu',
    hall: (n: number) => `Chủ điện tầng ${n}`,
    goTo: 'Đi tới',
    store: (cap: string, n: number) => `Kho chỉ chứa ${cap} mỗi loại, tài nguyên ngừng sinh khi đầy — chờ bao lâu cũng không đủ. Nâng Tàng Bảo Các lên tầng ${n}.`,
    cost: 'Chi phí',
    have: (n: string) => `có ${n}`,
    build: 'Xây dựng',
    notBuilt: 'Chưa xây',
    upgrade: 'Nâng cấp',
    upgrading: (n: number) => (n === 1 ? 'Đang xây' : `Đang nâng lên tầng ${n}`),
    busy: 'Tạp dịch đang bận việc khác',
    maxed: 'Đã đạt tầng tối đa',
    locked: (n: number) => `Mở khi Chủ điện đạt tầng ${n}`,
    close: 'Đóng',
    speed: (n: number) => `Tụ Khí Đan (${n})`,
  },

  tabs: { tongMon: 'Tông môn', monHa: 'Môn hạ', banDo: 'Bản đồ', tienMinh: 'Tiên minh', baoKho: 'Bảo khố' },

  // ---------- Đệ tử, trưởng lão ----------
  units,
  tiers,
  unit: (u: UnitId) => `${units[u.slice(0, -1) as UnitType]} · ${tiers[Number(u.slice(-1)) as Tier]}`,
  beats: (t: UnitType) => `Khắc ${units[BEATS[t]]}`,
  stat: { atk: 'Công', def: 'Thủ', hp: 'Máu' },
  elders: {
    thanhPhong: { name: 'Mộc Thanh Phong', title: 'Đại trưởng lão', lore: 'Người duy nhất ở lại khi tông môn sụp đổ. Kiếm chưa từng rời tay.', skill: 'Vạn Kiếm Quy Tông', passives: ['Kiếm Ý', 'Kiếm Tâm Thông Minh'] },
    thachKien: { name: 'Thạch Kiên', title: 'Hộ pháp', lore: 'Cựu trại chủ Hắc Phong Trại. Thua một trận, theo bạn cả đời.', skill: 'Kim Cương Bất Hoại', passives: ['Đồng Bì Thiết Cốt', 'Bất Động Như Sơn'] },
    nhuYen: { name: 'Liễu Như Yên', title: 'Truyền công trưởng lão', lore: 'Bị phong ấn trăm năm trong Thanh Mộc Bí Cảnh. Lửa trong tay nàng chưa từng nguội.', skill: 'Lưu Hỏa Phần Thiên', passives: ['Pháp Tướng', 'Ngộ Tính'] },
    loiChan: { name: 'Lôi Chấn', title: 'Chấp pháp trưởng lão', lore: 'Kiếm khách bị Vạn Độc Cốc giam giữ. Kiếm của hắn mang theo tiếng sấm.', skill: 'Cửu Thiên Lôi Động', passives: ['Lôi Kiếm', 'Tị Lôi Quyết'] },
    vanHac: { name: 'Vân Hạc Chân Nhân', title: 'Đan sư', lore: 'Lão đan sư ẩn cư nơi Xích Viêm Bí Cảnh. Cứu người nhiều hơn giết người.', skill: 'Khô Mộc Phùng Xuân', passives: ['Dưỡng Sinh', 'Tụ Tài'] },
    hanBang: { name: 'Hàn Băng Tiên Tử', title: 'Thái thượng trưởng lão', lore: 'Tỉnh giấc giữa băng nguyên Huyền Băng. Nơi nàng đi qua, sương đọng thành băng.', skill: 'Băng Phong Thiên Lý', passives: ['Hàn Khí Hộ Thể', 'Băng Tâm'] },
  } satisfies Record<ElderId, { name: string; title: string; lore: string; skill: string; passives: [string, string] }>,
  unlockHint: {
    thanhPhong: '',
    thachKien: 'Công phá Hắc Phong Trại',
    nhuYen: 'Qua tầng 5 Thanh Mộc Bí Cảnh',
    loiChan: 'Công phá Vạn Độc Cốc',
    vanHac: 'Qua tầng 5 Xích Viêm Bí Cảnh',
    hanBang: 'Qua tầng 5 Huyền Băng Bí Cảnh',
  } satisfies Record<ElderId, string>,
  skillText(s: Skill) {
    const who = s.type ? units[s.type] : 'cả đội'
    const text = {
      burst: `tung thêm một đòn bằng ${pct(s.v)} công của ${who}`,
      shield: `cả đội bớt ${pct(s.v)} sát thương phải nhận`,
      heal: `hồi sinh ${pct(s.v)} đệ tử đã ngã`,
      weaken: `địch bớt ${pct(s.v)} công trong 2 lượt`,
    }[s.kind]
    return `Lượt 3, 6, 9: ${text}.`
  },
  bonus(key: Bonus, v: number) {
    const name: Record<string, string> = {
      prod: 'Mọi tài nguyên', 'prod.linhThach': res.linhThach, 'prod.linhThao': res.linhThao, 'prod.linhKhoang': res.linhKhoang,
      storage: 'Sức chứa', build: 'Thời gian xây', train: 'Thời gian tuyển', march: 'Thời gian hành quân', heal: 'Chi phí chữa thương',
      brew: 'Chi phí luyện đan', hospital: 'Chỗ nằm thương binh', loot: 'Chiến lợi phẩm', exp: 'Kinh nghiệm', trib: 'Sức lôi kiếp',
      atk: 'Công cả đội', def: 'Thủ cả đội', hp: 'Máu cả đội',
      'atk.kiem': `Công ${units.kiem}`, 'atk.phap': `Công ${units.phap}`, 'atk.the': `Công ${units.the}`,
      'hp.kiem': `Máu ${units.kiem}`, 'hp.phap': `Máu ${units.phap}`, 'hp.the': `Máu ${units.the}`,
    }
    const down = ['build', 'train', 'march', 'heal', 'brew', 'trib'].includes(key)
    return `${name[key]} ${down ? '−' : '+'}${pct(v)}`
  },
  techs: {
    tuLinh: 'Tụ Linh Quyết', duongThao: 'Dưỡng Thảo Thuật', khaiSon: 'Khai Sơn Quyết', kiemTam: 'Kiếm Tâm Quyết',
    phapTam: 'Pháp Tâm Quyết', kimCuong: 'Kim Cương Quyết', loBan: 'Lỗ Ban Thuật', thanHanh: 'Thần Hành Thuật',
    canKhon: 'Càn Khôn Đại', luyenBinh: 'Luyện Binh Pháp', hoiXuan: 'Hồi Xuân Quyết', tranCo: 'Trận Cơ Đại Pháp',
    danDao: 'Đan Đạo Tâm Kinh', tuBao: 'Tụ Bảo Quyết', linhMach: 'Linh Mạch Quyết', truongSinh: 'Trường Sinh Quyết',
    vanKiem: 'Vạn Kiếm Trận', hoMach: 'Hộ Mạch Thuật', thienDien: 'Thiên Diễn Thuật', doKiepTam: 'Độ Kiếp Tâm Pháp',
  } satisfies Record<TechId, string>,
  pills: {
    tuKhi: { name: 'Tụ Khí Đan', desc: 'Bớt 15 phút cho một việc đang chờ: xây, tuyển, chữa hay nghiên cứu.' },
    boiNguyen: { name: 'Bồi Nguyên Đan', desc: 'Một trưởng lão nhận thêm 400 kinh nghiệm.' },
    doKiep: { name: 'Độ Kiếp Đan', desc: 'Uống trước khi độ kiếp: lôi kiếp yếu đi 30%.' },
  } satisfies Record<PillId, { name: string; desc: string }>,

  // ---------- Bản đồ ----------
  beasts: ['Hắc Lang', 'Thanh Xà', 'Thiết Bối Hùng', 'Xích Hồ', 'Kim Nhãn Điêu', 'Bạch Viên', 'Phong Lang Vương', 'Hỏa Linh Báo', 'Nham Giáp Tê', 'Cửu Vĩ Hồ', 'Lôi Ưng', 'Huyền Quy', 'Bạch Hổ', 'Băng Phượng', 'Giao Long'],
  sects: [
    { name: 'Hắc Phong Trại', lore: 'Sơn trại cướp bóc dưới chân núi. Trại chủ là một thể tu cứng đầu.' },
    { name: 'Huyết Sát Môn', lore: 'Tà phái lấy máu luyện kiếm, thường xuyên quấy nhiễu các tông nhỏ.' },
    { name: 'Vạn Độc Cốc', lore: 'Thung lũng độc chướng. Nghe nói có một kiếm khách bị giam trong đó.' },
    { name: 'Thiên Ma Giáo', lore: 'Ma giáo trỗi dậy từ phương bắc, kiếm pháp tàn độc.' },
    { name: 'Cửu U Điện', lore: 'Điện thờ nơi chín tầng u minh. Kẻ đứng đầu có thể hồi sinh thuộc hạ.' },
  ],
  realms: [
    { name: 'Thanh Mộc Bí Cảnh', lore: 'Rừng cổ thụ nghìn năm, yêu mộc canh giữ một phong ấn.' },
    { name: 'Xích Viêm Bí Cảnh', lore: 'Hỏa sơn ngầm, dung nham chảy thành sông.' },
    { name: 'Huyền Băng Bí Cảnh', lore: 'Băng nguyên vĩnh cửu, gió lạnh cắt da.' },
  ],
  target(t: Target) {
    return t.kind === 'beast' ? vi.beasts[t.i] : t.kind === 'sect' ? vi.sects[t.i].name : t.kind === 'tower' ? vi.tower.name : vi.realms[t.i].name
  },
  weekend: {
    title: 'Sự kiện cuối tuần',
    body: `Thứ Bảy, Chủ nhật: chiến lợi phẩm đánh lại và kinh nghiệm trưởng lão ×${String(WEEKEND).replace('.', ',')}`,
    tag: `Cuối tuần ×${String(WEEKEND).replace('.', ',')}`,
  },
  trade: {
    tab: 'Thương hội',
    give: 'Đổi đi',
    get: 'Nhận về',
    amount: 'Số lượng',
    rate: (keep: string) => `Nhận về ${keep} số đổi đi — nâng Tàng Bảo Các để được giá tốt hơn`,
    go: (n: string, r: string) => `Đổi lấy ${n} ${r}`,
    hint: 'Kho lệch (một loại cạn, loại khác đầy) thì đổi phần dư. Muốn nhiều lâu dài, nâng công trình tài nguyên vẫn lợi hơn.',
    done: (n: string, r: string) => `Đã nhận ${n} ${r}`,
  },
  tower: {
    name: 'Thông Thiên Tháp',
    lore: 'Tháp cổ đâm xuyên mây, mỗi tầng một yêu vương canh giữ. Chưa ai lên tới đỉnh.',
    kind: 'Tháp thử thách',
    floor: (n: number) => `Tầng ${n}`,
    best: (n: number) => (n ? `Kỷ lục: qua ${n} tầng` : 'Chưa qua tầng nào'),
    hint: 'Mỗi tầng địch mạnh hơn và đổi hệ chính. Thưởng chỉ nhận lần đầu qua tầng.',
  },
  map: {
    title: 'Bản đồ',
    home: 'Tông môn',
    beast: (n: number) => `Yêu thú cấp ${n}`,
    sect: 'Tông môn đối địch',
    realm: 'Bí cảnh',
    floor: (n: number, of: number) => `Tầng ${n}/${of}`,
    cleared: 'Đã chinh phục',
    firstWin: 'Lần đầu công phá',
    repeat: 'Mỗi lần công phá',
    respawn: (t: string) => `Có lại sau ${t}`,
    lockedBeast: (n: number) => `Hạ yêu thú cấp ${n} trước`,
    enemy: 'Quân địch',
    reward: 'Chiến lợi phẩm',
    exp: (n: number) => `${n} kinh nghiệm`,
    time: 'Hành quân',
    go: 'Xuất quân',
    enter: 'Khiêu chiến',
    out: 'Đang hành quân',
    back: 'Đang trở về',
    slots: (a: number, b: number) => `Đội xuất quân ${a}/${b}`,
    slotsFull: 'Hết đội xuất quân — đợi đội về hoặc đột phá cảnh giới',
    heading: 'Đã có đội đang tới đây',
    counter: 'Nên dùng',
  },
  army: {
    elder: 'Trưởng lão dẫn đội',
    troops: 'Đệ tử xuất chiến',
    all: 'Tất cả',
    none: 'Bỏ chọn',
    counter: 'Theo hệ khắc',
    might: 'Lực chiến',
    ours: 'Ta',
    theirs: 'Địch',
    verdict: { strong: 'Áp đảo', even: 'Ngang ngửa', weak: 'Yếu thế' },
    chance: (n: number) => `khoảng ${n}% thắng`,
    noTroops: 'Chưa có đệ tử ở tông môn',
    noElder: 'Mọi trưởng lão đều đang xuất chinh',
    busy: 'Xuất chinh',
    recruit: 'Tuyển đệ tử',
  },
  report: {
    title: 'Chiến báo',
    none: 'Chưa có trận nào.',
    win: 'Đại thắng',
    lose: 'Thất bại',
    tribWin: 'Độ kiếp thành công',
    tribLose: 'Độ kiếp thất bại',
    wave: (n: number) => `Đợt lôi kiếp ${n}`,
    round: (n: number, of: number) => `Lượt ${n}/${of}`,
    hurt: 'Thương binh',
    dead: 'Tử trận',
    gain: 'Thu được',
    exp: 'Kinh nghiệm',
    newElder: 'Thu nhận trưởng lão',
    replay: 'Xem lại',
    skip: 'Xem kết quả',
    speed: 'Tốc độ',
    close: 'Đóng',
    retreat: 'Hết 10 lượt chưa phân thắng bại — rút lui.',
    fresh: (name: string, win: boolean) => `${win ? 'Thắng' : 'Thua'} · ${name}`,
    thunder: 'Lôi kiếp',
    foeSkill: 'Sát chiêu!',
  },

  // ---------- Công trình chức năng ----------
  train: {
    tab: 'Tuyển đệ tử',
    pick: 'Chọn hệ',
    tier: 'Bậc',
    tierLocked: (n: number) => `Diễn võ trường tầng ${n}`,
    count: 'Số lượng',
    max: 'Tối đa',
    go: 'Tuyển',
    doing: (n: number, u: string) => `Đang tuyển ${n} ${u}`,
    home: 'Ở tông môn',
    needBuild: 'Xây Diễn võ trường để tuyển đệ tử.',
  },
  alchemy: {
    heal: 'Chữa thương',
    brew: 'Luyện đan',
    wounded: 'Thương binh',
    bed: (a: number, b: number) => `${a}/${b} chỗ nằm`,
    healAll: 'Chữa tất cả',
    healing: (n: number) => `Đang chữa ${n} thương binh`,
    noWounded: 'Không có thương binh.',
    brewing: (n: number, p: string) => `Đang luyện ${n} ${p}`,
    unlock: (n: number) => `Đan phòng tầng ${n}`,
    have: (n: number) => `Đang có ${n}`,
    go: 'Luyện',
    overflow: 'Đan phòng hết chỗ: thương binh mới sẽ tử trận. Chữa bớt hoặc nâng Đan phòng.',
  },
  library: {
    tab: 'Công pháp',
    row: (n: number) => `Tàng Kinh Các tầng ${n}`,
    go: 'Lĩnh ngộ',
    doing: (name: string, n: number) => `Đang lĩnh ngộ ${name} tầng ${n}`,
    maxed: 'Viên mãn',
  },
  trib: {
    title: 'Độ kiếp',
    lore: (realm: string) => `Chủ điện đã tới đỉnh cảnh giới. Muốn đột phá ${realm} phải vượt ba đợt lôi kiếp — đệ tử sống sót đi tiếp sang đợt sau.`,
    waves: 'Ba đợt lôi kiếp',
    pill: 'Dùng Độ Kiếp Đan (lôi kiếp −30%)',
    go: 'Độ kiếp',
    wait: (t: string) => `Kinh mạch chưa ổn, thử lại sau ${t}`,
    gather: 'Kiếp vân đang tụ…',
    success: 'Đột phá',
    fail: 'Độ kiếp thất bại',
    failHint: 'Chữa thương binh, tuyển thêm đệ tử hoặc luyện Độ Kiếp Đan rồi thử lại.',
    need: 'Cần tài nguyên của Chủ điện tầng sau',
    reached: (realm: string, hall: number) => `Đột phá ${realm} · Chủ điện tầng ${hall}`,
    opens: (n: number) => `${n} đội xuất quân cùng lúc`,
    detail: 'Xem chi tiết',
    next: 'Tiếp tục',
  },
  rebirth: {
    title: 'Luân hồi',
    lore: 'Kim Đan viên mãn. Tán công trùng tu, tông môn làm lại từ đầu nhưng đạo tâm vững hơn.',
    keep: 'Giữ lại',
    keepList: ['Trưởng lão và cấp của họ', 'Công pháp đã lĩnh ngộ', 'Đan dược trong Bảo khố'],
    lose: 'Làm lại',
    loseList: ['Công trình (còn lại căn cơ), tài nguyên', 'Đệ tử, thương binh', 'Bản đồ và nhiệm vụ'],
    // n: số lần đã luân hồi (tính cả lần sắp làm)
    gain: (n: number) => `Kiếp thứ ${n + 1}: ${perks(n)}`,
    // chỉ phần thưởng — màn kết quả đã có tiêu đề "Kiếp thứ n" (done)
    perks: (n: number) => perks(n).replace(/^./, c => c.toUpperCase()),
    go: 'Luân hồi',
    confirm: 'Chắc chắn luân hồi? Không thể hoàn tác.',
    marching: 'Đợi mọi đội xuất quân trở về.',
    count: (n: number) => `Đã luân hồi ${n} lần`,
    done: (n: number) => `Kiếp thứ ${n + 1}`,
    start: 'Bắt đầu kiếp mới',
  },

  // ---------- Trang ----------
  monHa: {
    title: 'Môn hạ',
    elders: 'Trưởng lão',
    disciples: 'Đệ tử',
    wounded: 'Thương binh',
    heal: 'Chữa trị',
    locked: 'Chưa thu nhận',
    home: 'Ở tông môn',
    out: 'Xuất chinh',
    exp: 'Kinh nghiệm',
    skill: 'Công pháp chủ động',
    passive: 'Bị động',
    passiveAt: (n: number) => `Cấp ${n}`,
    feed: (n: number) => `Dùng Bồi Nguyên Đan (${n})`,
    maxLevel: 'Đã đạt cấp tối đa',
    leads: 'Dẫn đội: cả đội',
    total: 'Tổng',
  },
  baoKho: {
    title: 'Bảo khố',
    pills: 'Đan dược',
    empty: 'Chưa có đan dược. Luyện ở Đan phòng.',
    use: 'Dùng',
    brewMore: 'Luyện thêm',
    pickJob: 'Rút ngắn việc nào?',
    noJob: 'Không có việc nào đang chờ.',
    pickElder: 'Cho trưởng lão nào?',
    auto: 'Tự dùng khi độ kiếp',
    rates: 'Sản lượng',
    stats: 'Thành tích',
    stat: { won: 'Trận thắng', lost: 'Trận thua', trained: 'Đệ tử đã tuyển', healed: 'Thương binh đã chữa', brewed: 'Đan đã luyện', rebirths: 'Lần luân hồi' },
  },
  jobs: { build: 'Xây dựng', train: 'Tuyển đệ tử', heal: 'Chữa thương', study: 'Nghiên cứu', brew: 'Luyện đan' },

  settings: {
    title: 'Cài đặt',
    sound: 'Hiệu ứng âm thanh',
    music: 'Nhạc nền',
    account: 'Tài khoản',
    accountHint: (name: string) => `${name} được lưu trên máy chủ: đổi máy hay xoá dữ liệu trình duyệt vẫn giữ nguyên tiến độ khi đăng nhập lại.`,
    about: 'Thông tin',
    version: (v: string) => `Phiên bản ${v}`,
    credits: 'Font Alegreya, Ma Shan Zheng — giấy phép SIL OFL. Hình vẽ tay sinh bằng mã.',
    open: 'Cài đặt',
  },

  away: {
    title: 'Xuất quan',
    for: (d: string) => `Bạn đã rời tông môn ${d}.`,
    got: 'Thu được',
    done: 'Hoàn thành',
    trained: (n: number) => `${n} đệ tử nhập môn`,
    healed: (n: number) => `${n} thương binh bình phục`,
    brewed: (n: number) => `${n} viên đan`,
    battles: (w: number, l: number) => `${w} trận thắng${l ? `, ${l} trận thua` : ''}`,
    tech: (name: string, n: number) => `${name} tầng ${n}`,
    full: 'Kho đã đầy — nâng Tàng Bảo Các để chứa thêm.',
    enter: 'Vào tông môn',
  },
  unlocked: (what: string) => `Mở khóa: ${what}`,
  guide: {
    title: 'Cẩm nang',
    items: [
      ['Chơi thế nào?', 'Nâng công trình để có thêm tài nguyên, tuyển đệ tử, đánh yêu thú và bí cảnh, rồi đi làm việc khác. Đồng hồ vẫn chạy khi bạn tắt game — quay lại nhận thành quả. Mỗi phiên 5–10 phút là đủ.'],
      ['Hệ khắc', `Kiếm tu khắc Pháp tu, Pháp tu khắc Thể tu, Thể tu khắc Kiếm tu: đánh hệ mình khắc thêm ${pct(ADV - 1)} sát thương, đánh hệ khắc mình bớt ${pct(1 - DISADV)}. Bảng mục tiêu ghi "Nên dùng", và tỉ lệ thắng ước lượng đã tính hệ khắc.`],
      ['Trưởng lão', `Mỗi đội cần một trưởng lão dẫn. Mỗi cấp trưởng lão cho cả đội +${pct(ELDER_STEP)} công và máu; công pháp chủ động bung ra ở lượt 3, 6, 9. Thu nhận thêm trưởng lão khi công phá tông môn đối địch và qua tầng 5 các bí cảnh.`],
      ['Thương binh', 'Đánh trận nào cũng có thương binh. Họ nằm ở Đan phòng chờ chữa; Đan phòng hết chỗ thì thương binh mới tử trận — chữa trước khi đánh tiếp, hoặc nâng Đan phòng.'],
      ['Độ kiếp', `Chủ điện tầng 5 và 10 phải vượt ba đợt lôi kiếp, mỗi đợt một hệ, người sống sót đi tiếp — hãy mang đủ ba hệ. Độ Kiếp Đan làm sét yếu đi ${pct(DO_KIEP)}. Thất bại chỉ phải chờ ${TRIB_COOLDOWN / 60_000} phút rồi thử lại.`],
      ['Kho đầy, kho lệch', `Tài nguyên ngừng sinh khi kho đầy: nâng Tàng Bảo Các. Thưởng nhiệm vụ và chiến lợi phẩm vẫn nhận được dù vượt sức chứa. Kho lệch (một loại cạn, loại khác đầy) thì vào Thương hội ở Tàng Bảo Các đổi phần dư — nhận về ${pct(TRADE_KEEP)} tới ${pct(TRADE_KEEP_MAX)} tuỳ tầng.`],
      ['Thông Thiên Tháp', `Mở ở Chủ điện tầng ${TOWER.hall}, trên đỉnh bản đồ. Tháp không có tầng cuối: mỗi tầng địch mạnh hơn và đổi hệ chính, nên hãy đổi đội theo hệ khắc. Thưởng chỉ nhận lần đầu qua mỗi tầng (tầng chẵn chục có Độ Kiếp Đan); kỷ lục giữ qua luân hồi.`],
      ['Nhiệm vụ ngày, tuần, luân hồi', 'Nhiệm vụ ngày làm mới lúc 0h giờ Việt Nam, nhiệm vụ tuần lúc 0h thứ Hai. Tới Chủ điện tầng 15 có thể luân hồi: giữ trưởng lão, công pháp, đan dược; kiếp sau khởi đầu với công trình tầng cao hơn (căn cơ), sinh tài nguyên nhiều hơn và xây nhanh hơn — mỗi kiếp ngắn hơn hẳn kiếp trước.'],
      ['Tiến độ', 'Tiến độ lưu trên máy chủ sau mỗi thao tác. Mất mạng thì game tự nối lại; thao tác chưa kịp ghi sẽ được báo.'],
    ] as [string, string][],
  },
  daily: {
    title: 'Nhiệm vụ ngày',
    reset: (t: string) => `Làm mới sau ${t} (0h giờ Việt Nam)`,
    task: {
      build: (n: number) => `Xây hoặc nâng công trình ${n} lần`,
      train: (n: number) => `Tuyển ${n} đệ tử`,
      win: (n: number) => `Thắng ${n} trận`,
      brew: (n: number) => `Luyện ${n} mẻ đan`,
    } as Record<'build' | 'train' | 'win' | 'brew', (n: number) => string>,
    bonus: 'Rương thưởng ngày',
    open: 'Mở rương',
    button: 'Nhiệm vụ ngày & tuần',
  },
  weekly: {
    title: 'Nhiệm vụ tuần',
    reset: (ms: number) => {
      const h = Math.max(0, Math.floor(ms / 3_600_000))
      return `Làm mới sau ${h >= 24 ? `${Math.floor(h / 24)} ngày ${h % 24} giờ` : `${h} giờ`} (0h thứ Hai giờ Việt Nam)`
    },
    task: {
      build: (n: number) => `Xây hoặc nâng công trình ${n} lần`,
      train: (n: number) => `Tuyển ${n} đệ tử`,
      win: (n: number) => `Thắng ${n} trận`,
      brew: (n: number) => `Luyện ${n} mẻ đan`,
      days: (n: number) => `Mở rương thưởng ngày ${n} hôm`,
    } as Record<'build' | 'train' | 'win' | 'brew' | 'days', (n: number) => string>,
    bonus: 'Rương thưởng tuần',
  },
  crash: {
    title: 'Tông môn gặp sự cố',
    body: 'Tiến độ nằm an toàn trên máy chủ. Tải lại để chơi tiếp.',
    reload: 'Tải lại',
  },
  err: {
    max_level: 'Đã đạt tối đa',
    need_main_hall: 'Cần nâng Chủ điện trước',
    busy: 'Đang bận',
    queue_full: 'Tạp dịch đang bận',
    not_enough: 'Không đủ tài nguyên',
    not_done: 'Chưa hoàn thành',
    locked: 'Chưa mở',
    cooldown: 'Chưa hồi lại',
    empty: 'Chưa chọn gì',
    no_item: 'Không đủ đan dược',
    slots: 'Hết đội xuất quân',
    trib: 'Cần độ kiếp',
    bad: 'Không hợp lệ',
    offline: 'Mất kết nối — thử lại khi có mạng',
    unsaved: 'Mất kết nối trước khi máy chủ ghi — kiểm tra lại thao tác vừa rồi',
    unavailable: 'Máy chủ đang bận, thử lại sau giây lát',
    rate: 'Thao tác quá nhanh, chậm lại một chút',
    moving: 'Giới đang chuyển máy chủ, đợi một chút',
    maintenance: 'Tông môn đang được kiểm tra, thử lại sau',
  } as Record<string, string>,
  net: {
    connecting: 'Đang kết nối…',
    reconnecting: 'Mất kết nối — đang nối lại…',
    retry: 'Thử lại',
    offline: 'Không có mạng',
    offlineHint: 'Tiến độ vẫn an toàn trên máy chủ. Game tự nối lại khi có mạng.',
    update: 'Đang cập nhật',
    updateHint: 'Có bản mới của luật chơi. Game sẽ tự tải lại khi máy chủ sẵn sàng.',
    lost: 'Phiên đăng nhập đã hết',
    lostHint: 'Máy này không còn giữ phiên của tông môn cũ. Có thể lập tông môn mới.',
    fresh: 'Lập tông môn mới',
    banned: 'Tài khoản bị khoá',
    bannedHint: 'Tài khoản này đã bị khoá vì vi phạm luật chơi.',
    deleted: 'Tài khoản đã xoá',
    deletedHint: 'Tài khoản này đã được xoá theo yêu cầu.',
    p1Gone: 'Bản online bắt đầu lại từ đầu — save của bản thử nghiệm offline không chuyển sang được.',
  },
  ago(ms: number) {
    const m = Math.floor(ms / 60_000), h = Math.floor(m / 60), d = Math.floor(h / 24)
    const pair = (a: number, ua: string, b: number, ub: string) => (b ? `${a} ${ua} ${b} ${ub}` : `${a} ${ua}`)
    return d ? pair(d, 'ngày', h % 24, 'giờ') : h ? pair(h, 'giờ', m % 60, 'phút') : `${m} phút`
  },
}
export type Text = typeof vi
