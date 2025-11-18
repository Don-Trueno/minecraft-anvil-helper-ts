import { type Settings, type Mode, getInfo, Enchantment, Item } from './data'

const BOOK = 'enchanted_book'

type MergeStep = {
  left: Item
  right: Item
  merged: Item
  costLvl: number
  costXp: number
}
type MergeResult = {
  merged: Item
  costLvl: number
  costXp: number
  steps: MergeStep[]
} | null

const memo = new Map<string, MergeResult>()

function getStateKey(items: Item[]): string {
  return items
    .map(
      (item) =>
        `${item.type}:${item.enchantments
          .map((e) => `${e.id}-${e.level}`)
          .sort()
          .join(',')}:${item.penaltyCount}`,
    )
    .sort()
    .join('|')
}

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

export function mergeItems(left: Item, right: Item, settings: Settings): MergeResult {
  if (left.type === BOOK && right.type !== BOOK) {
    // if left item is a book then right item must also be a book
    return null
  }

  let resultType = left.type
  let resultEnchantments = left.enchantments.map((e) => new Enchantment(e.id, e.level))
  let resultPenaltyCount = 1 + Math.max(left.penaltyCount, right.penaltyCount)
  let resultLvl = left.penaltyCount + right.penaltyCount
  let isSuccess = false
  // Start to combine...
  for (const r of right.enchantments) {
    // get enchantment weight
    let w =
      right.type === BOOK
        ? getInfo(r.id, settings.useBedrock).weightFromBook
        : getInfo(r.id, settings.useBedrock).weightFromItem || 0
    // check if left item has the same enchantment
    const l = resultEnchantments.find((e) => e.id === r.id)
    if (l) {
      if (l.level > r.level) {
        // left level is higher, do nothing
        continue
      }
      if (l.level === r.level) {
        if (!settings.allowOverMaxLevel && l.level > getInfo(l.id, settings.useBedrock).maxLevel) {
          // already at max level, do nothing
        } else {
          // upgrade enchantment to next level
          // set flag to true if there's at least 1 enchantment successfully merged
          // in Java Edition, cost = weight * new level
          // in Bedrock Edition, cost = weight * (new level - old level) = weight * 1 = weight
          l.level++
          resultLvl += settings.useBedrock ? w : w * l.level
          isSuccess = true
        }
        continue
      }
      if (l.level < r.level) {
        // right level is higher, overwrite the level
        // set flag to true because successed merge an enchantment
        // in Java Edition, cost = weight * new level
        // in Bedrock Edition, cost = weight * (new level - old level)
        let lvl: number = l.level
        l.level = r.level
        resultLvl += settings.useBedrock ? w * (l.level - lvl) : w * l.level
        isSuccess = true
        continue
      }
    } else {
      // left item does not have this enchantment
      // check if the enchantment can be applied to left item
      const canEnchant = getInfo(r.id, settings.useBedrock).compatibleItems.includes(resultType)
      if (!canEnchant) {
        // left item cannot be enchanted with this enchantment, do nothing
        continue
      }
      const isConflict =
        !settings.allowIncompatible &&
        resultEnchantments.some((e) => {
          return getInfo(e.id, settings.useBedrock).incompatibleEnchantments.includes(r.id)
        })
      if (isConflict) {
        if (settings.useBedrock) {
          // in Bedrock Edtion, the game just does nothing
        } else {
          // in Java Edition, any conflict enchantment leads to 1 more level
          resultLvl += 1
        }
        continue
      } else {
        // if none of the above conditions is matched, then just push the enchantment to the left item
        resultEnchantments.push(new Enchantment(r.id, r.level))
        resultLvl += w * r.level
        isSuccess = true
        continue
      }
    }
  }
  if (!settings.allowTooExpensive && resultLvl > 39) {
    // last check: if 'ignoreTooExpensive' is false and the result level is over 39, then fail this try
    isSuccess = false
  }
  if (isSuccess) {
    return {
      merged: new Item(resultType, resultEnchantments, resultPenaltyCount),
      costLvl: resultLvl,
      costXp: lvlToXp(resultLvl),
      steps: [],
    }
  }
  return null
}

function dfs(
  items: Item[],
  mode: Mode,
  settings: Settings,
  accCostLvl: number,
  accCostXp: number,
  steps: MergeStep[] = [],
  bestCost: number = Infinity,
): MergeResult {
  if (items.length === 1) {
    return { merged: items[0], costLvl: accCostLvl, costXp: accCostXp, steps }
  }

  const key = getStateKey(items)
  if (memo.has(key)) {
    const cached = memo.get(key)
    return cached ? { ...cached, steps: [...cached.steps] } : null
  }

  let best: MergeResult = null
  for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < items.length; j++) {
      if (i === j) continue
      const left = items[i]
      const right = items[j]
      const merged = mergeItems(left, right, settings)
      if (merged) {
        const nextItems = items.filter((_, idx) => idx !== i && idx !== j)
        nextItems.push(merged.merged)
        const nextStep: MergeStep = {
          left,
          right,
          merged: merged.merged,
          costLvl: merged.costLvl,
          costXp: merged.costXp,
        }
        const currentCost = mode === 'lvl' ? accCostLvl + merged.costLvl : accCostXp + merged.costXp
        if (currentCost >= bestCost) continue

        const result = dfs(
          nextItems,
          mode,
          settings,
          accCostLvl + merged.costLvl,
          accCostXp + merged.costXp,
          [...steps, nextStep],
          best ? (mode === 'lvl' ? best.costLvl : best.costXp) : bestCost,
        )
        if (result) {
          if (
            !best ||
            (mode === 'lvl' && result.costLvl < best.costLvl) ||
            (mode === 'xp' && result.costXp < best.costXp)
          ) {
            best = result
          }
        }
      }
    }
  }
  memo.set(key, best ? { ...best, steps: [...best.steps] } : null)
  return best
}

export function solve(items: Item[], mode: Mode, settings: Settings) {
  memo.clear()
  const start = performance.now()
  const result = dfs(items, mode, settings, 0, 0, [], Infinity)
  const end = performance.now()
  return result ? { ...result, elapsedMs: end - start } : null
}
