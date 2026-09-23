import {
  BEATS,
  type Bonus, type BuildingId, type ElderId, type PillId, type Quest, type Res, type Skill, type Target, type TechId, type Tier,
  type UnitId, type UnitType,
} from '@rok/rules'

// Chữ hiển thị tiếng Việt. Bản tiếng Anh ở en.ts, cùng khuôn (kiểu Text).
const pct = (v: number) => `${Math.round(v * 100)}%`
const units = { kiem: 'Kiếm tu', phap: 'Pháp tu', the: 'Thể tu' } satisfies Record<UnitType, string>
const tiers = { 1: 'Ngoại môn', 2: 'Nội môn', 3: 'Chân truyền' } satisfies Record<Tier, string>
const res = { linhThach: 'Linh thạch', linhThao: 'Linh thảo', linhKhoang: 'Linh khoáng' } satisfies Record<Res, string>

export const vi = {
  game: 'Sơn Hà Tiên Tông',
  gameHan: '山河仙宗',
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
    tooShort: 'Tên cần từ 2 đến 16 ký tự',
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
    return t.kind === 'beast' ? vi.beasts[t.i] : t.kind === 'sect' ? vi.sects[t.i].name : vi.realms[t.i].name
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
    han: { 6: '筑基', 11: '金丹' } as Record<number, string>,
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
    loseList: ['Công trình, tài nguyên', 'Đệ tử, thương binh', 'Bản đồ và nhiệm vụ'],
    // n: số lần đã luân hồi (tính cả lần sắp làm)
    gain: (n: number) => `Kiếp thứ ${n + 1}: sản lượng +${n * 20}%, xây nhanh hơn ${n * 10}%`,
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
    sound: 'Âm thanh',
    save: 'Dữ liệu',
    saveHint: 'Save chỉ nằm trên máy này. Trình duyệt (nhất là Safari) có thể xoá dữ liệu của trang ít mở — hãy xuất save định kỳ.',
    export: 'Xuất save',
    copied: 'Đã chép save vào bộ nhớ tạm',
    downloaded: 'Đã tải file save',
    import: 'Nhập save',
    importHint: 'Dán nội dung save hoặc chọn file .json',
    importGo: 'Nhập',
    importBad: 'Save không hợp lệ',
    importConfirm: 'Save hiện tại sẽ bị thay thế. Tiếp tục?',
    imported: 'Đã nhập save',
    reset: 'Chơi lại từ đầu',
    resetConfirm: 'Xoá toàn bộ tiến độ và chơi lại từ đầu? Không thể hoàn tác.',
    about: 'Thông tin',
    version: (v: string) => `Phiên bản ${v} · bản thử nghiệm offline`,
    credits: 'Font Be Vietnam Pro, Ma Shan Zheng — giấy phép SIL OFL.',
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
  crash: {
    title: 'Tông môn gặp sự cố',
    body: 'Tiến độ đã được lưu trên máy. Tải lại để chơi tiếp; nếu vẫn lỗi, hãy xuất save và gửi cho nhà phát triển.',
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
  } as Record<string, string>,
  ago(ms: number) {
    const m = Math.floor(ms / 60_000), h = Math.floor(m / 60), d = Math.floor(h / 24)
    const pair = (a: number, ua: string, b: number, ub: string) => (b ? `${a} ${ua} ${b} ${ub}` : `${a} ${ua}`)
    return d ? pair(d, 'ngày', h % 24, 'giờ') : h ? pair(h, 'giờ', m % 60, 'phút') : `${m} phút`
  },
}
export type Text = typeof vi
