import { Item, type Settings } from './data'
import { mergeItem } from './work'

export function solveAllCombinations(items: Item[], settings: Settings) {
  const allItemMap = new Map<number, Item>()
  const allItemId: number[] = []
  let globalId: number = 0
  items.forEach((item, idx) => {
    allItemMap.set(globalId, item)
    allItemId.push(globalId)
    globalId++
    item.usedItemIdx = [idx]
  })

  let results: Item[]
  // resolve
}
