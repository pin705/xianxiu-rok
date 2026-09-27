// Kiểm save / patch cho các trường thêm sau (save.ts đã chạm trần dòng): pháp bảo (cả khai linh), Trận Pháp (trận đang bày,
// túi trận khí, ô đeo, Hiền Sĩ Lệnh, vân du hôm nay), Linh Tinh Trận Pháp, Ẩn Sĩ Động Phủ
import {
  ARM_BAG,
  ARM_SLOTS,
  AWAKEN_MAX,
  CTECH,
  CTECH_MAX,
  DRILLF,
  ELDERS,
  FORMS,
  GEAR,
  HERMITS,
  HERMIT_TASKS,
  INS,
  INS_SPECIAL,
} from '../data.ts'
import { int, num, obj } from './parse.ts'

const validArm = (a: any) =>
  obj(a) &&
  num(a.id) &&
  Object.hasOwn(FORMS, a.f) &&
  int(0, ARM_SLOTS.length - 1)(a.slot) &&
  int(0, 3)(a.q) &&
  Array.isArray(a.ins) &&
  a.ins.length <= 4 &&
  a.ins.every((i: unknown) => i === INS_SPECIAL || int(0, INS.length - 1)(i))
const validForm = (s: any) =>
  (s.form === undefined || Object.hasOwn(FORMS, s.form)) &&
  (s.arms === undefined || (Array.isArray(s.arms) && s.arms.length <= ARM_BAG && s.arms.every(validArm))) &&
  (s.armOn === undefined ||
    (obj(s.armOn) &&
      Object.entries(s.armOn).every(
        ([f, on]) =>
          Object.hasOwn(FORMS, f) &&
          Array.isArray(on) &&
          on.length === ARM_SLOTS.length &&
          on.every(x => x === null || num(x)),
      ))) &&
  (s.armCoin === undefined || num(s.armCoin)) &&
  (s.vandu === undefined || (obj(s.vandu) && num(s.vandu.day) && num(s.vandu.n))) &&
  (s.formStars === undefined ||
    (Array.isArray(s.formStars) && s.formStars.length <= DRILLF.length && s.formStars.every(int(0, 7))))
const byHermit = (x: unknown, ok: (v: any) => boolean) =>
  obj(x) && Object.entries(x).every(([k, v]) => Object.hasOwn(HERMITS, k) && ok(v))
const validSeason = (s: any) =>
  (s.ctech === undefined ||
    (Array.isArray(s.ctech) && s.ctech.length <= CTECH.length && s.ctech.every(int(0, CTECH_MAX)))) &&
  [s.ctechSpent, s.ctechGot].every(x => x === undefined || num(x)) &&
  (s.hermit === undefined ||
    (obj(s.hermit) &&
      num(s.hermit.day) &&
      num(s.hermit.n) &&
      byHermit(s.hermit.fav, num) &&
      byHermit(s.hermit.jobs, j => obj(j) && int(0, HERMIT_TASKS.length - 1)(j.t) && num(j.base))))
// pháp bảo: cấp, người đeo, tầng khai linh
const validGear = (s: any) =>
  obj(s.gear) &&
  Object.entries(s.gear).every(
    ([g, x]: [string, any]) =>
      Object.hasOwn(GEAR, g) &&
      obj(x) &&
      num(x.lv) &&
      (x.on === undefined || Object.hasOwn(ELDERS, x.on)) &&
      (x.aw === undefined || int(0, AWAKEN_MAX)(x.aw)),
  )
// Chân Thân: danh sách trưởng lão đã chuyển thế
const validPrime = (s: any) =>
  s.prime === undefined ||
  (Array.isArray(s.prime) && s.prime.every((e: unknown) => typeof e === 'string' && Object.hasOwn(ELDERS, e)))
// Viễn Chinh: sao từng màn, huân chương, rương ngày, số đã đổi
const validVc = (s: any) =>
  s.vc === undefined ||
  (obj(s.vc) &&
    Array.isArray(s.vc.stars) &&
    s.vc.stars.every(int(0, 7)) &&
    [s.vc.medals, s.vc.spent, s.vc.chest].every(num) &&
    (s.vc.week === undefined || num(s.vc.week)) &&
    (s.vc.n === undefined || (Array.isArray(s.vc.n) && s.vc.n.every(num))))
// tự vận hành: công tắc
const validAuto = (s: any) =>
  s.auto === undefined || (obj(s.auto) && (s.auto.heal === undefined || typeof s.auto.heal === 'boolean'))
export const validLater = (s: any) =>
  validGear(s) && validForm(s) && validSeason(s) && validAuto(s) && validPrime(s) && validVc(s)
