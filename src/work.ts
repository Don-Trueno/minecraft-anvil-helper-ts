import { type Settings, getInfo, Enchantment, Item } from './data'

function lvlToXp(lvl: number) {
  if (lvl === 0) {
    return 0
  }
  if (lvl < 17) {
    return lvl ** 2 + 6 * lvl
  }
  if (lvl < 32) {
    return 2.5 * lvl ** 2 - 40.5 * lvl + 360
  }
  return 4.5 * lvl ** 2 - 162.5 * lvl + 2220
}

export function mergeItem(left: Item, right: Item, settings: Settings) {
  if (left.type != 'enchanted_book' || right.type === 'enchanted_book') {
    let resultName = left.type
    let resultEnchantment: Enchantment[] = []
    let resultPenaltyCount = 1 + Math.max(left.penaltyCount, right.penaltyCount)
    let mergeCost = 0
    let isSuccess = false
    // for each enchantment in right item ...
    for (const r of right.enchantments) {
      let w =
        right.type === 'enchanted_book'
          ? getInfo(r.id, settings.useBedrock).weightFromBook
          : getInfo(r.id, settings.useBedrock).weightFromItem
      // if left item has enchantment of the same name...
      let l = left.enchantments.find((_) => _.id === r.id)
      if (l) {
        if (l.level > r.level) {
          resultEnchantment.push(l)
          continue
        }
        if (l.level === r.level) {
          resultEnchantment.push(new Enchantment(r.id, r.level + 1))
          isSuccess = true
          mergeCost += settings.useBedrock ? w : w * (r.level + 1)
          continue
        }
        if (l.level < r.level) {
          resultEnchantment.push(r)
          isSuccess = true
          mergeCost += settings.useBedrock ? w * (r.level - l.level) : w * r.level
          continue
        }
      }
      // if left item has incompatible enchantment...
      if (!settings.compatibilityCheck && left.enchantments.length > 0) {
        const l = left.enchantments.filter((_) =>
          getInfo(_.id, settings.useBedrock).incompatibleEnchantments.includes(r.id),
        )
        console.log(l)
        if (l.length > 0) {
          resultEnchantment.push(...l)
          mergeCost += settings.useBedrock ? 0 : l.length
          continue
        } else {
          // default...
          isSuccess = true
          resultEnchantment.push(r)
          mergeCost += w * r.level
        }
      }
    }
    if (isSuccess) {
      let c: number = settings.mode === 'leastLvl' ? 1 : 2
      if (settings.mode === 'lvl') {
        let lvlCost = c
        let xpCost = lvlToXp(c)
        return [lvlCost, xpCost, new Item(resultName, resultEnchantment, resultPenaltyCount)]
      } else {
        let xpCost = c
        return [-1, xpCost, new Item(resultName, resultEnchantment, resultPenaltyCount)]
      }
    }
  }
  return null
}
