<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

import dataJE from './dataJE.json'
import dataBE from './dataBE.json'

import { Enchantment, Item, type Settings, getInfo } from './data'
import { mergeItem } from './work'
import { solveAllCombinations } from './solve'

// i18n
const { t } = useI18n()
const n: string[] = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

// settings
const settings = ref<Settings>({
  mode: 'leastLvl', //leastLvl or leastXp
  useBedrock: false,
  compatibilityCheck: true,
  tooExpensiveCheck: false,
})
//input
const input = ref<Item[]>([new Item('enchanted_book')])
// item operation
const allItemTypes = computed(() => {
  return settings.value.useBedrock ? dataBE.item : dataJE.item
})
const currentItemType = computed(() => {
  return (
    input.value.find((_) => _.type != '' && _.type != 'enchanted_book')?.type || 'enchanted_book'
  )
})
const currentAvailableItemTypes = computed(() => {
  if (currentItemType.value != 'enchanted_book') {
    return [currentItemType.value]
  }
  return allItemTypes.value
})
function addNewItem(): void {
  input.value.push(new Item('enchanted_book'))
}
function itemTypeUpdate(item: Item): void {
  item.enchantments = []
}
//enchantment operation

function addNewEnchantment(item: Item): void {
  item.enchantments.push(new Enchantment(''))
}
function enchantmentIdUpdate(enchantment: Enchantment): void {
  enchantment.level = 1
}
function getAllEnchantments(itemType: string, settings: Settings) {
  return Object.entries(settings.useBedrock ? dataBE.data : dataJE.data)
    .filter(([_, info]) => info.compatibleItems?.includes(itemType))
    .map(([enchantmentId]) => enchantmentId)
}
function enchantmentDisabled(enchantmentId: string, item: Item, settings: Settings) {
  return (
    item.enchantments.map((e, _) => e.id).includes(enchantmentId) ||
    (settings.compatibilityCheck &&
      item.enchantments.some((e, _) =>
        getInfo(e.id, settings.useBedrock)?.incompatibleEnchantments.includes(enchantmentId),
      ))
  )
}
function getAvailableLevel(enchantmentId: string, settings: Settings) {
  let maxLevel = getInfo(enchantmentId, settings.useBedrock).maxLevel
  return [...Array(maxLevel)].map((_, i) => i + 1)
}

let result: any
function solve(input: Item[], settings: Settings) {
  let parsedInput = JSON.parse(JSON.stringify(input))
  result = mergeItem(parsedInput[0], parsedInput[1], settings)
}
</script>

<template>
  <div>
    <input type="checkbox" id="useBedrock" v-model="settings.useBedrock" />
    <label for="useBedrock"> {{ t('useBedrock') }}</label>
    <br />
    <input type="checkbox" id="compatibilityCheck" v-model="settings.compatibilityCheck" />
    <label for="compatibilityCheck"> {{ t('compatibilityCheck') }}</label>
  </div>
  <hr />
  <div>
    {{ currentItemType }}
    <div v-for="item in input">
      <select v-model="item.type" @change="itemTypeUpdate(item)">
        <option disabled value="">{{ t('chooseOne') }}</option>
        <option :value="itemTypes" v-for="itemTypes in currentAvailableItemTypes">
          {{ t(itemTypes) }}
        </option>
        <option value="enchanted_book">{{ t('enchanted_book') }}</option>
      </select>
      <br />
      <div v-for="ench in item.enchantments">
        <select v-model="ench.id" @change="enchantmentIdUpdate(ench)">
          <option disabled value="">{{ t('chooseOne') }}</option>
          <option
            :value="e"
            :disabled="enchantmentDisabled(e, item, settings)"
            v-for="e in getAllEnchantments(currentItemType, settings)"
          >
            {{ t(e) }}
          </option>
        </select>
        <span v-if="ench.id != ''" v-for="i in getAvailableLevel(ench.id, settings)">
          <input type="radio" :id="ench.id + String(i)" :value="i" v-model="ench.level" />
          <label :for="ench.id + String(i)">{{ n[i] }}</label>
        </span>
      </div>
      <button
        :disabled="
          item.enchantments.length === getAllEnchantments(currentItemType, settings).length
        "
        @click="addNewEnchantment(item)"
      >
        {{ t('addEnchantment') }}
      </button>
      <hr />
    </div>
    <button @click="addNewItem()">{{ t('addItem') }}</button>
    <hr />
  </div>
  <button @click="solve(input, settings)">{{ t('solve') }}</button>
  {{ result }}
</template>
