import {
  ADV, BEATS, DISADV, DO_KIEP, ELDER_STEP, REBIRTH_BUILD, REBIRTH_PROD, TOWER, TRADE_KEEP, TRADE_KEEP_MAX, TRIB_COOLDOWN, rebirthLevels,
  type Bonus, type BuildingId, type ElderId, type PillId, type Quest, type Res, type Skill, type Target, type TechId, type Tier,
  type UnitId, type UnitType,
} from '@rok/rules'
import type { Text } from './vi.ts'

// English text. Same shape as vi.ts (type Text) — TypeScript flags any missing key.
// Glossary (PLAN.md §4): Luyện Khí = Qi Refining, Trúc Cơ = Foundation Establishment, Kim Đan = Golden Core.
const pct = (v: number) => `${Math.round(v * 100)}%`
const perks = (n: number) =>
  `start with buildings at level ${rebirthLevels(n).chuDien}, output +${pct(n * REBIRTH_PROD)}, building ${pct(n * REBIRTH_BUILD)} faster`
const units = { kiem: 'Sword Cultivators', phap: 'Spell Cultivators', the: 'Body Cultivators' } satisfies Record<UnitType, string>
const short = { kiem: 'Sword', phap: 'Spell', the: 'Body' } satisfies Record<UnitType, string>
const tiers = { 1: 'Outer', 2: 'Inner', 3: 'Core' } satisfies Record<Tier, string>
const res = { linhThach: 'Spirit Stone', linhThao: 'Spirit Herb', linhKhoang: 'Spirit Ore' } satisfies Record<Res, string>
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

export const en: Text = {
  game: 'Immortal Sect',
  tagline: 'Build your sect · Seize spirit veins · Ascend',
  tapToStart: 'Tap to begin',
  tapToContinue: 'Tap to continue',
  intro: [
    'Spiritual qi has dried up. A thousand sects have fallen.',
    'On this misty mountain, only a ruined main hall remains — and you.',
    'The legacy is yours. Rebuild the sect.',
  ],
  skip: 'Skip',
  naming: {
    title: 'Name your sect',
    hint: 'The name is carved on your sect seal and shown to every fellow cultivator.',
    reroll: 'More ideas',
    found: 'Found the sect',
    tooShort: 'Names need 2 to 20 characters',
    first: ['Azure Cloud', 'Mystic Heaven', 'Falling Mist', 'Purple Star', 'Boundless', 'Primordial', 'Jade Chime', 'Emerald Sky', 'Frost Peak', 'Cloud Dream', 'Soaring Sky', 'Heaven Sword'],
    last: ['Sect', 'School', 'Palace', 'Hall'],
  },

  realmName: (level: number) => ['Qi Refining', 'Foundation', 'Golden Core'][Math.min(3, Math.ceil(level / 5)) - 1],
  realm: (level: number) => `${en.realmName(level)} · level ${level}`,
  level: (n: number) => `Level ${n}`,
  lv: (n: number) => `Lv ${n}`,
  power: 'Power',
  full: 'Full',
  sound: { on: 'Mute', off: 'Unmute' },
  res,
  b: {
    chuDien: { name: 'Main Hall', lore: 'Where the sect master meditates. Its level is your realm — no building can rise higher.' },
    tuLinhTran: { name: 'Spirit Array', lore: 'An array that gathers the qi of heaven and earth into spirit stones.' },
    linhDien: { name: 'Spirit Field', lore: 'Terraces of spirit herbs, watered by mountain springs.' },
    khoangMach: { name: 'Ore Vein', lore: 'A vein deep in the cliff, yielding spirit ore.' },
    tangBaoCac: { name: 'Treasure Pavilion', lore: 'The sect treasury. The higher it rises, the more it holds.' },
    dienVoTruong: { name: 'Training Grounds', lore: 'Where disciples drill at dawn. Higher levels recruit more per batch.' },
    danPhong: { name: 'Alchemy Room', lore: 'A furnace that never goes out. Heals the wounded and brews pills.' },
    tangKinhCac: { name: 'Scripture Pavilion', lore: 'Keeper of the techniques of every sect master before you.' },
  } satisfies Record<BuildingId, { name: string; lore: string }>,
  soonTag: 'soon',

  quest: {
    title: 'Quest',
    text(q: Quest) {
      const id = Number(q.id)
      switch (q.k) {
        case 'build': {
          const b = q.id as BuildingId
          if (b === 'chuDien' && (q.n === 6 || q.n === 11)) return `Tribulation — break through to ${en.realmName(q.n)}`
          return q.n === 1 ? `Build the ${en.b[b].name}` : `Upgrade the ${en.b[b].name} to level ${q.n}`
        }
        case 'train': return `Have ${q.n} disciples`
        case 'hunt': return `Defeat the ${en.beasts[q.n - 1]} (beast lv ${q.n})`
        case 'sect': return `Conquer the ${en.sects[id].name}`
        case 'realm': return q.n === 1 ? `Explore the ${en.realms[id].name}` : `Clear floor ${q.n} of the ${en.realms[id].name}`
        case 'tech': return q.n === 1 ? 'Master a technique' : `Master ${q.n} technique levels in total`
        case 'brew': return `Brew ${plural(q.n, 'pill')}`
      }
    },
    reward: 'Reward',
    claim: 'Claim',
    allDone: 'Quest chain complete. At Main Hall level 15 you can reincarnate to grow stronger.',
  },
  builder: { idle: 'Idle', label: 'Builder' },
  activity: { title: 'In progress', empty: 'Nothing is running.', march: (elder: string, target: string) => `${elder} → ${target}` },

  panel: {
    output: 'Output',
    perHour: '/h',
    capacity: 'Capacity per resource',
    batch: 'Per batch',
    hospital: 'Beds for the wounded',
    rows: 'Technique rows open',
    slots: 'March slots',
    requires: 'Requires',
    hall: (n: number) => `Main Hall level ${n}`,
    goTo: 'Go',
    store: (cap: string, n: number) => `Storage holds only ${cap} of each, and resources stop growing when full — waiting will never be enough. Upgrade the Treasure Pavilion to level ${n}.`,
    cost: 'Cost',
    have: (n: string) => `have ${n}`,
    build: 'Build',
    notBuilt: 'Not built',
    upgrade: 'Upgrade',
    upgrading: (n: number) => (n === 1 ? 'Building' : `Upgrading to level ${n}`),
    busy: 'The builder is busy',
    maxed: 'Max level reached',
    locked: (n: number) => `Unlocks at Main Hall level ${n}`,
    close: 'Close',
    speed: (n: number) => `Qi Pill (${n})`,
  },

  tabs: { tongMon: 'Sect', monHa: 'Disciples', banDo: 'Map', tienMinh: 'Alliance', baoKho: 'Treasury' },

  // ---------- Disciples, elders ----------
  units,
  tiers,
  unit: (u: UnitId) => `${tiers[Number(u.slice(-1)) as Tier]} ${short[u.slice(0, -1) as UnitType]}`,
  beats: (t: UnitType) => `Beats ${short[BEATS[t]]}`,
  stat: { atk: 'Atk', def: 'Def', hp: 'HP' },
  elders: {
    thanhPhong: { name: 'Mu Qingfeng', title: 'Grand Elder', lore: 'The only one who stayed when the sect fell. His sword has never left his hand.', skill: 'Ten Thousand Swords', passives: ['Sword Intent', 'Clear Sword Heart'] },
    thachKien: { name: 'Shi Jian', title: 'Guardian', lore: 'Former chief of Black Wind Stronghold. Lost one fight, sworn to you for life.', skill: 'Adamant Body', passives: ['Bronze Skin', 'Unmoving Mountain'] },
    nhuYen: { name: 'Liu Ruyan', title: 'Teaching Elder', lore: 'Sealed for a century in the Verdant Wood Realm. The fire in her hands never cooled.', skill: 'Skyburning Flame', passives: ['Dharma Form', 'Insight'] },
    loiChan: { name: 'Lei Zhen', title: 'Law Elder', lore: 'A swordsman held captive in Myriad Poison Valley. His blade carries thunder.', skill: 'Nine Heavens Thunder', passives: ['Thunder Blade', 'Lightning Ward'] },
    vanHac: { name: 'Daoist Yunhe', title: 'Alchemist', lore: 'An old alchemist hermit of the Crimson Flame Realm. Has saved more lives than he has taken.', skill: 'Spring Revival', passives: ['Nurture Life', 'Gather Wealth'] },
    hanBang: { name: 'Frost Fairy Hanbing', title: 'Supreme Elder', lore: 'Awoke in the Dark Ice wastes. Where she walks, mist turns to ice.', skill: 'Thousand-Li Frost', passives: ['Frost Aegis', 'Ice Heart'] },
  } satisfies Record<ElderId, { name: string; title: string; lore: string; skill: string; passives: [string, string] }>,
  unlockHint: {
    thanhPhong: '',
    thachKien: 'Conquer Black Wind Stronghold',
    nhuYen: 'Clear floor 5 of the Verdant Wood Realm',
    loiChan: 'Conquer Myriad Poison Valley',
    vanHac: 'Clear floor 5 of the Crimson Flame Realm',
    hanBang: 'Clear floor 5 of the Dark Ice Realm',
  } satisfies Record<ElderId, string>,
  skillText(s: Skill) {
    const who = s.type ? units[s.type] : 'the whole army'
    const text = {
      burst: `strikes again with ${pct(s.v)} of the attack of ${who}`,
      shield: `the army takes ${pct(s.v)} less damage`,
      heal: `revives ${pct(s.v)} of fallen disciples`,
      weaken: `enemies lose ${pct(s.v)} attack for 2 rounds`,
    }[s.kind]
    return `Rounds 3, 6, 9: ${text}.`
  },
  bonus(key: Bonus, v: number) {
    const name: Record<string, string> = {
      prod: 'All resources', 'prod.linhThach': res.linhThach, 'prod.linhThao': res.linhThao, 'prod.linhKhoang': res.linhKhoang,
      storage: 'Capacity', build: 'Build time', train: 'Recruit time', march: 'March time', heal: 'Healing cost',
      brew: 'Brewing cost', hospital: 'Beds', loot: 'Loot', exp: 'Experience', trib: 'Tribulation strength',
      atk: 'Army attack', def: 'Army defense', hp: 'Army HP',
      'atk.kiem': `${short.kiem} attack`, 'atk.phap': `${short.phap} attack`, 'atk.the': `${short.the} attack`,
      'hp.kiem': `${short.kiem} HP`, 'hp.phap': `${short.phap} HP`, 'hp.the': `${short.the} HP`,
    }
    const down = ['build', 'train', 'march', 'heal', 'brew', 'trib'].includes(key)
    return `${name[key]} ${down ? '−' : '+'}${pct(v)}`
  },
  techs: {
    tuLinh: 'Spirit Gathering', duongThao: 'Herb Nurturing', khaiSon: 'Mountain Splitting', kiemTam: 'Sword Heart',
    phapTam: 'Spell Heart', kimCuong: 'Diamond Body', loBan: "Lu Ban's Craft", thanHanh: 'Divine Stride',
    canKhon: 'Cosmos Pouch', luyenBinh: 'Troop Tempering', hoiXuan: 'Spring Rejuvenation', tranCo: 'Array Foundation',
    danDao: 'Alchemy Canon', tuBao: 'Treasure Gathering', linhMach: 'Spirit Veins', truongSinh: 'Longevity',
    vanKiem: 'Myriad Swords Array', hoMach: 'Vein Guarding', thienDien: 'Heavenly Deduction', doKiepTam: 'Tribulation Heart',
  } satisfies Record<TechId, string>,
  pills: {
    tuKhi: { name: 'Qi Pill', desc: 'Cuts 15 minutes off one timer: building, recruiting, healing or research.' },
    boiNguyen: { name: 'Origin Pill', desc: 'One elder gains 400 experience.' },
    doKiep: { name: 'Tribulation Pill', desc: 'Taken before a tribulation: the lightning is 30% weaker.' },
  } satisfies Record<PillId, { name: string; desc: string }>,

  // ---------- Map ----------
  beasts: ['Black Wolf', 'Green Serpent', 'Ironback Bear', 'Crimson Fox', 'Golden-eyed Eagle', 'White Ape', 'Wind Wolf King', 'Fire Leopard', 'Rockhide Rhino', 'Nine-tailed Fox', 'Thunder Hawk', 'Dark Tortoise', 'White Tiger', 'Ice Phoenix', 'Flood Dragon'],
  sects: [
    { name: 'Black Wind Stronghold', lore: 'A bandit camp at the foot of the mountain. Its chief is a stubborn body cultivator.' },
    { name: 'Blood Slaughter Sect', lore: 'A demonic sect that tempers swords in blood and preys on small sects.' },
    { name: 'Myriad Poison Valley', lore: 'A valley of toxic miasma. Rumor says a swordsman is imprisoned inside.' },
    { name: 'Heavenly Demon Cult', lore: 'A demonic cult rising in the north, with ruthless swordplay.' },
    { name: 'Nine Nether Palace', lore: 'A temple of the nine netherworlds. Its master can raise the fallen.' },
  ],
  realms: [
    { name: 'Verdant Wood Realm', lore: 'A thousand-year-old forest where tree spirits guard a seal.' },
    { name: 'Crimson Flame Realm', lore: 'An underground volcano where lava flows like rivers.' },
    { name: 'Dark Ice Realm', lore: 'Eternal ice fields and winds that cut like blades.' },
  ],
  target(t: Target) {
    return t.kind === 'beast' ? en.beasts[t.i] : t.kind === 'sect' ? en.sects[t.i].name : t.kind === 'tower' ? en.tower.name : en.realms[t.i].name
  },
  trade: {
    tab: 'Trading house',
    give: 'Give',
    get: 'Receive',
    amount: 'Amount',
    rate: (keep: string) => `The traders keep a cut: you receive ${keep} — upgrade the Treasure Pavilion for better rates`,
    go: (n: string, r: string) => `Trade for ${n} ${r}`,
    hint: 'When storage is lopsided (one resource short, others full), trade the surplus. For steady income, upgrading resource buildings is still better.',
    done: (n: string, r: string) => `Received ${n} ${r}`,
  },
  tower: {
    name: 'Heaven-Piercing Tower',
    lore: 'An ancient tower that pierces the clouds, each floor guarded by a demon king. No one has reached the top.',
    kind: 'Trial tower',
    floor: (n: number) => `Floor ${n}`,
    best: (n: number) => (n ? `Record: ${n} floors cleared` : 'No floors cleared yet'),
    hint: 'Each floor is stronger and changes its main type. Rewards only on the first clear of a floor.',
  },
  map: {
    title: 'Map',
    home: 'Sect',
    beast: (n: number) => `Beast lv ${n}`,
    sect: 'Rival sect',
    realm: 'Secret realm',
    floor: (n: number, of: number) => `Floor ${n}/${of}`,
    cleared: 'Conquered',
    firstWin: 'First conquest',
    repeat: 'Each raid',
    respawn: (t: string) => `Returns in ${t}`,
    lockedBeast: (n: number) => `Defeat the lv ${n} beast first`,
    enemy: 'Enemy forces',
    reward: 'Spoils',
    exp: (n: number) => `${n} experience`,
    time: 'March',
    go: 'March',
    enter: 'Challenge',
    out: 'Marching',
    back: 'Returning',
    slots: (a: number, b: number) => `Marches ${a}/${b}`,
    slotsFull: 'All march slots in use — wait for a return or break through',
    heading: 'An army is already on its way',
    counter: 'Best with',
  },
  army: {
    elder: 'Leading elder',
    troops: 'Disciples',
    all: 'All',
    none: 'None',
    counter: 'Counter',
    might: 'Might',
    ours: 'Us',
    theirs: 'Enemy',
    verdict: { strong: 'Overwhelming', even: 'Even', weak: 'Outmatched' },
    chance: (n: number) => `about ${n}% to win`,
    noTroops: 'No disciples at the sect',
    noElder: 'Every elder is away',
    busy: 'Away',
    recruit: 'Recruit disciples',
  },
  report: {
    title: 'Reports',
    none: 'No battles yet.',
    win: 'Victory',
    lose: 'Defeat',
    tribWin: 'Tribulation passed',
    tribLose: 'Tribulation failed',
    wave: (n: number) => `Lightning wave ${n}`,
    round: (n: number, of: number) => `Round ${n}/${of}`,
    hurt: 'Wounded',
    dead: 'Fallen',
    gain: 'Gained',
    exp: 'Experience',
    newElder: 'New elder',
    replay: 'Replay',
    skip: 'Skip to result',
    speed: 'Speed',
    close: 'Close',
    retreat: 'No victor after 10 rounds — the army withdrew.',
    fresh: (name: string, win: boolean) => `${win ? 'Won' : 'Lost'} · ${name}`,
    thunder: 'Lightning',
    foeSkill: 'Killing move!',
  },

  // ---------- Function buildings ----------
  train: {
    tab: 'Recruit',
    pick: 'Path',
    tier: 'Rank',
    tierLocked: (n: number) => `Training Grounds lv ${n}`,
    count: 'Amount',
    max: 'Max',
    go: 'Recruit',
    doing: (n: number, u: string) => `Recruiting ${n} ${u}`,
    home: 'At the sect',
    needBuild: 'Build the Training Grounds to recruit disciples.',
  },
  alchemy: {
    heal: 'Healing',
    brew: 'Brewing',
    wounded: 'Wounded',
    bed: (a: number, b: number) => `${a}/${b} beds`,
    healAll: 'Heal all',
    healing: (n: number) => `Healing ${n} wounded`,
    noWounded: 'No wounded.',
    brewing: (n: number, p: string) => `Brewing ${n} ${p}`,
    unlock: (n: number) => `Alchemy Room lv ${n}`,
    have: (n: number) => `Have ${n}`,
    go: 'Brew',
    overflow: 'No beds left: new wounded will die. Heal some or upgrade the Alchemy Room.',
  },
  library: {
    tab: 'Techniques',
    row: (n: number) => `Scripture Pavilion lv ${n}`,
    go: 'Study',
    doing: (name: string, n: number) => `Studying ${name} level ${n}`,
    maxed: 'Perfected',
  },
  trib: {
    title: 'Tribulation',
    lore: (realm: string) => `The Main Hall has reached its peak. To break through to ${realm} you must survive three waves of heavenly lightning — survivors carry on to the next wave.`,
    waves: 'Three lightning waves',
    pill: 'Take a Tribulation Pill (lightning −30%)',
    go: 'Face the tribulation',
    wait: (t: string) => `Meridians unsettled — retry in ${t}`,
    gather: 'Tribulation clouds gather…',
    success: 'Breakthrough',
    fail: 'Tribulation failed',
    failHint: 'Heal the wounded, recruit more disciples or brew a Tribulation Pill, then try again.',
    need: 'Costs as much as the next Main Hall level',
    reached: (realm: string, hall: number) => `Reached ${realm} · Main Hall level ${hall}`,
    opens: (n: number) => `${n} marches at once`,
    detail: 'Details',
    next: 'Continue',
  },
  rebirth: {
    title: 'Reincarnation',
    lore: 'Golden Core perfected. Disperse your cultivation and start anew — the sect rebuilds from scratch, but your dao heart is firmer.',
    keep: 'Keep',
    keepList: ['Elders and their levels', 'Mastered techniques', 'Pills in the Treasury'],
    lose: 'Reset',
    loseList: ['Buildings (a foundation remains), resources', 'Disciples, wounded', 'Map and quests'],
    gain: (n: number) => `Life ${n + 1}: ${perks(n)}`,
    perks: (n: number) => perks(n).replace(/^./, c => c.toUpperCase()),
    go: 'Reincarnate',
    confirm: 'Reincarnate for sure? This cannot be undone.',
    marching: 'Wait for every march to return.',
    count: (n: number) => `Reincarnated ${n} times`,
    done: (n: number) => `Life ${n + 1}`,
    start: 'Begin the new life',
  },

  // ---------- Pages ----------
  monHa: {
    title: 'Disciples',
    elders: 'Elders',
    disciples: 'Disciples',
    wounded: 'Wounded',
    heal: 'Heal',
    locked: 'Not recruited',
    home: 'At the sect',
    out: 'Away',
    exp: 'Experience',
    skill: 'Active technique',
    passive: 'Passives',
    passiveAt: (n: number) => `Lv ${n}`,
    feed: (n: number) => `Give an Origin Pill (${n})`,
    maxLevel: 'Max level reached',
    leads: 'Leading: whole army',
    total: 'Total',
  },
  baoKho: {
    title: 'Treasury',
    pills: 'Pills',
    empty: 'No pills yet. Brew them in the Alchemy Room.',
    use: 'Use',
    brewMore: 'Brew more',
    pickJob: 'Speed up which timer?',
    noJob: 'Nothing is in progress.',
    pickElder: 'For which elder?',
    auto: 'Used automatically in a tribulation',
    rates: 'Output',
    stats: 'Records',
    stat: { won: 'Battles won', lost: 'Battles lost', trained: 'Disciples recruited', healed: 'Wounded healed', brewed: 'Pills brewed', rebirths: 'Reincarnations' },
  },
  jobs: { build: 'Building', train: 'Recruiting', heal: 'Healing', study: 'Research', brew: 'Brewing' },

  settings: {
    title: 'Settings',
    sound: 'Sound effects',
    music: 'Music',
    save: 'Save data',
    saveHint: 'Your save lives only on this device. Browsers (Safari especially) may clear data of rarely opened sites — export your save regularly.',
    export: 'Export save',
    copied: 'Save copied to clipboard',
    downloaded: 'Save file downloaded',
    import: 'Import save',
    importHint: 'Paste a save or choose a .json file',
    importGo: 'Import',
    importBad: 'Invalid save',
    importConfirm: 'This replaces your current save. Continue?',
    imported: 'Save imported',
    reset: 'Start over',
    resetConfirm: 'Erase all progress and start over? This cannot be undone.',
    about: 'About',
    version: (v: string) => `Version ${v} · offline test build`,
    credits: 'Fonts: Alegreya, Ma Shan Zheng — SIL Open Font License. Hand-painted art is generated in code.',
    open: 'Settings',
  },

  away: {
    title: 'Out of Seclusion',
    for: (d: string) => `You were away for ${d}.`,
    got: 'Gathered',
    done: 'Completed',
    trained: (n: number) => `${plural(n, 'disciple')} joined`,
    healed: (n: number) => `${n} wounded recovered`,
    brewed: (n: number) => plural(n, 'pill'),
    battles: (w: number, l: number) => `${plural(w, 'battle')} won${l ? `, ${l} lost` : ''}`,
    tech: (name: string, n: number) => `${name} level ${n}`,
    full: 'Storage is full — upgrade the Treasure Pavilion to hold more.',
    enter: 'Enter the sect',
  },
  unlocked: (what: string) => `Unlocked: ${what}`,
  guide: {
    title: 'Guide',
    items: [
      ['How do I play?', 'Upgrade buildings for more resources, recruit disciples, fight beasts and secret realms, then go do something else. Timers keep running while the game is closed — come back to collect. 5–10 minutes per session is enough.'],
      ['Counters', `Sword beats Spell, Spell beats Body, Body beats Sword: hitting the type you counter deals +${pct(ADV - 1)} damage, hitting your counter deals ${pct(1 - DISADV)} less. Target sheets say "Best with", and the estimated win chance already accounts for counters.`],
      ['Elders', `Every army needs a leading elder. Each elder level gives the whole army +${pct(ELDER_STEP)} attack and HP; their active technique fires on rounds 3, 6 and 9. Recruit more elders by conquering rival sects and clearing floor 5 of the secret realms.`],
      ['Wounded', 'Every battle leaves wounded. They wait in the Alchemy Room to be healed; when it runs out of beds, new wounded die — heal before fighting again, or upgrade the Alchemy Room.'],
      ['Tribulation', `At Main Hall levels 5 and 10 you must survive three lightning waves, one type each, and survivors carry on — bring all three types. A Tribulation Pill weakens the lightning by ${pct(DO_KIEP)}. Failing only means waiting ${TRIB_COOLDOWN / 60_000} minutes before trying again.`],
      ['Full or lopsided storage', `Resources stop growing when storage is full: upgrade the Treasure Pavilion. Quest rewards and loot still arrive above capacity. If one resource runs short while others are full, trade the surplus at the Trading house in the Treasure Pavilion — you receive ${pct(TRADE_KEEP)} to ${pct(TRADE_KEEP_MAX)} depending on its level.`],
      ['Heaven-Piercing Tower', `Opens at Main Hall level ${TOWER.hall}, at the top of the map. The tower has no last floor: each floor is stronger and changes its main type, so switch your army to the counter. Rewards come only on the first clear of each floor (every tenth floor gives a Tribulation Pill); your record carries over reincarnation.`],
      ['Daily and weekly tasks, reincarnation', 'Daily tasks reset at midnight, Vietnam time; weekly tasks on Monday at midnight. At Main Hall level 15 you can reincarnate: keep elders, techniques and pills; the next life starts with higher-level buildings, produces more and builds faster — each life is much shorter than the last.'],
      ['Keep your save', 'Your save lives only on this device. Tap "Export save" below now and then to keep a copy.'],
    ] as [string, string][],
  },
  daily: {
    title: 'Daily tasks',
    reset: (t: string) => `Resets in ${t} (midnight, Vietnam time)`,
    task: {
      build: (n: number) => `Start ${n} building upgrades`,
      train: (n: number) => `Recruit ${n} disciples`,
      win: (n: number) => `Win ${n} battles`,
      brew: (n: number) => `Brew ${n} batch of pills`,
    } as Record<'build' | 'train' | 'win' | 'brew', (n: number) => string>,
    bonus: 'Daily chest',
    open: 'Open',
    button: 'Daily & weekly tasks',
  },
  weekly: {
    title: 'Weekly tasks',
    reset: (ms: number) => {
      const h = Math.max(0, Math.floor(ms / 3_600_000))
      return `Resets in ${h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${h}h`} (Monday midnight, Vietnam time)`
    },
    task: {
      build: (n: number) => `Start ${n} building upgrades`,
      train: (n: number) => `Recruit ${n} disciples`,
      win: (n: number) => `Win ${n} battles`,
      brew: (n: number) => `Brew ${n} batches of pills`,
      days: (n: number) => `Open the daily chest on ${n} days`,
    } as Record<'build' | 'train' | 'win' | 'brew' | 'days', (n: number) => string>,
    bonus: 'Weekly chest',
  },
  crash: {
    title: 'The sect ran into trouble',
    body: 'Your progress is saved on this device. Reload to keep playing; if it keeps failing, export your save and send it to the developer.',
    reload: 'Reload',
  },
  err: {
    max_level: 'Already at max',
    need_main_hall: 'Upgrade the Main Hall first',
    busy: 'Busy',
    queue_full: 'The builder is busy',
    not_enough: 'Not enough resources',
    not_done: 'Not complete yet',
    locked: 'Locked',
    cooldown: 'Not ready yet',
    empty: 'Nothing selected',
    no_item: 'Not enough pills',
    slots: 'No march slots left',
    trib: 'Tribulation required',
    bad: 'Invalid',
  } as Record<string, string>,
  ago(ms: number) {
    const m = Math.floor(ms / 60_000), h = Math.floor(m / 60), d = Math.floor(h / 24)
    const pair = (a: number, ua: string, b: number, ub: string) => (b ? `${plural(a, ua)} ${plural(b, ub)}` : plural(a, ua))
    return d ? pair(d, 'day', h % 24, 'hour') : h ? pair(h, 'hour', m % 60, 'minute') : plural(m, 'minute')
  },
}
