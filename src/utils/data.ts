import dataJE from './dataJE.json'
import dataBE from './dataBE.json'

export type Mode = 'lvl' | 'xp'

export const allItemTypesJE = dataJE.item
export const allItemTypesBE = dataBE.item

export const allEnchantmentsJE = Object.keys(dataJE.data)
export const allEnchantmentsBE = Object.keys(dataBE.data)

export interface Settings {
  useBedrock: boolean // using Bedrock Edition enchantment rules
  allowIncompatible: boolean // allowing incompatible enchantments (e.g., Sharpness and Smite on the same item)
  allowTooExpensive: boolean // allowing "Too Expensive" (levels can be over 39)
  allowOverMaxLevel: boolean // allowing enchantment levels over the max level (e.g., Sharpness VI)
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
