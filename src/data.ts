import dataJE from './dataJE.json'
import dataBE from './dataBE.json'

export interface Settings {
  mode: string
  useBedrock: boolean
  tooExpensiveCheck: boolean
  compatibilityCheck: boolean
}

export type EnchantmentInfo = Record<
  string,
  {
    maxLevel: number
    weightFromItem: number
    weightFromBook: number
    compatibleItems: string[]
    incompatibleEnchantments: string[]
  }
>

export class Enchantment {
  id: string
  level: number
  constructor(name: string, level: number = 1) {
    this.id = name
    this.level = level
  }
}

export function getInfo(
  enchantmentId: string,
  useBedrock: boolean,
): {
  maxLevel: number
  weightFromItem: number
  weightFromBook: number
  compatibleItems: string[]
  incompatibleEnchantments: string[]
} {
  return useBedrock
    ? (dataBE.data as EnchantmentInfo)[enchantmentId]
    : (dataJE.data as EnchantmentInfo)[enchantmentId]
}

export class Item {
  type: string
  enchantments: Enchantment[]
  penaltyCount: number
  unused: boolean
  usedItemIdx: number[]
  constructor(type: string, enchantments: Enchantment[] = [], penaltyCount: number = 0) {
    this.type = type
    this.enchantments = enchantments
    this.penaltyCount = penaltyCount
    this.unused = false
    this.usedItemIdx = []
  }
  isBook() {
    return this.type === 'enchanted_book'
  }
  key(): string {
    return `${this.isBook}:${this.enchantments
      .map((e) => `${e.id}-${e.level}`)
      .sort()
      .join(',')}`
  }
}
