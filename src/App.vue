<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { solve } from './utils/work'
import type { Mode, Settings } from './utils/data'
import {
  allItemTypesJE,
  allItemTypesBE,
  allEnchantmentsJE,
  allEnchantmentsBE,
  getInfo,
} from './utils/data'
import Item from './components/item.vue'
import LanguageSelector from './components/LanguageSelector.vue'

// i18n
const { t, locale } = useI18n()
const currentLocale = ref(locale.value === 'en-US' ? 'en' : locale.value || 'en')

const input = ref<any[]>([
  {
    type: 'helmet',
    enchantments: [],
    penaltyCount: 0,
  },
  {
    type: 'enchanted_book',
    enchantments: [{ id: 'protection', level: 4 }],
    penaltyCount: 0,
  },
  {
    type: 'enchanted_book',
    enchantments: [{ id: 'respiration', level: 3 }],
    penaltyCount: 0,
  },
  {
    type: 'enchanted_book',
    enchantments: [{ id: 'aqua_affinity', level: 1 }],
    penaltyCount: 0,
  },
  {
    type: 'enchanted_book',
    enchantments: [{ id: 'unbreaking', level: 3 }],
    penaltyCount: 0,
  },
  {
    type: 'enchanted_book',
    enchantments: [{ id: 'thorn', level: 3 }],
    penaltyCount: 0,
  },
  {
    type: 'enchanted_book',
    enchantments: [{ id: 'mending', level: 1 }],
    penaltyCount: 0,
  },
])

const defaultInput = JSON.parse(JSON.stringify(input.value))

const mode = ref<Mode>('xp')
const settings = ref<Settings>({
  useBedrock: false,
  allowIncompatible: false,
  allowTooExpensive: false,
  allowOverMaxLevel: false,
})

const lastInput = ref<any[]>([])
const lastMode = ref<Mode>('xp')
const lastSettings = ref<Settings>({ ...settings.value })
const result = ref<any>(null)

const editingArr = ref<boolean[]>(input.value.map(() => false))

function setEditing(idx: number, val: boolean) {
  editingArr.value[idx] = val
}
const canCalculate = computed(
  () =>
    editingArr.value.every((e) => !e) &&
    input.value.length > 1 &&
    input.value.every(
      (it) => (it.type && it.type !== 'enchanted_book') || it.enchantments.length !== 0,
    ),
)

// if any item is other type than Enchanted Book,
// then only show available item and enchantment in each dropdown list.
const selectedItemType = computed(() => {
  const types = input.value
    .filter((it) => it.type && it.type !== 'enchanted_book')
    .map((it) => it.type)
  return types.length > 0 ? types[0] : ''
})

const nonBookIndexes = computed(() =>
  input.value
    .map((it, idx) => (it.type && it.type !== 'enchanted_book' ? idx : -1))
    .filter((idx) => idx !== -1),
)

function getItemTypeList(idx: number) {
  if (nonBookIndexes.value.length > 0) {
    if (nonBookIndexes.value.includes(idx)) {
      return settings.value.useBedrock ? allItemTypesBE : allItemTypesJE
    } else {
      return [selectedItemType.value, 'enchanted_book']
    }
  } else {
    return settings.value.useBedrock ? allItemTypesBE : allItemTypesJE
  }
}

const selectedEnchantments = computed(() => {
  const enchants = new Set<string>()
  input.value.forEach((it) => {
    if (it.enchantments && Array.isArray(it.enchantments)) {
      it.enchantments.forEach((e: any) => {
        if (e.id) {
          enchants.add(e.id)
        }
      })
    }
  })
  return Array.from(enchants)
})

function getEnchantmentsList() {
  if (selectedItemType.value === '') {
    return settings.value.useBedrock ? allEnchantmentsBE : allEnchantmentsJE
  } else {
    const allEnchants = settings.value.useBedrock ? allEnchantmentsBE : allEnchantmentsJE
    return allEnchants.filter((e) =>
      getInfo(e, settings.value.useBedrock).compatibleItems.includes(selectedItemType.value),
    )
  }
}

function removeOneItem(idx: number) {
  if (editingArr.value[idx]) return
  input.value.splice(idx, 1)
  editingArr.value.splice(idx, 1)
}

function resetAllItem() {
  input.value = [...defaultInput]
  editingArr.value = input.value.map(() => false)
  result.value = null
}

function addItem() {
  input.value.push({
    type: 'enchanted_book',
    enchantments: [],
    penaltyCount: 0,
  })
  editingArr.value.push(false)
}

function calculate() {
  lastInput.value = JSON.parse(JSON.stringify(input.value))
  lastMode.value = mode.value
  lastSettings.value = JSON.parse(JSON.stringify(settings.value))
  result.value = solve(lastInput.value, lastMode.value, lastSettings.value)
}

watch(currentLocale, (v) => {
  locale.value = v
})
</script>

<template>
  <div class="container">
    <div class="itemPanel">
      <h3>{{ t('titleIngredients') }}</h3>
      <div v-for="(it, idx) in input" :key="idx" class="itemCard">
        <item
          :item="it"
          :editable="true"
          :editing="editingArr[idx]"
          :type-list="getItemTypeList(idx)"
          :enchantment-list="getEnchantmentsList()"
          :use-bedrock="settings.useBedrock"
          @update:editing="(val) => setEditing(idx, val)"
        />
        <button
          v-if="!editingArr[idx]"
          :key="'del-' + idx"
          class="deleteBtn"
          @click="removeOneItem(idx)"
        >
          ×
        </button>
      </div>
      <button @click="addItem">{{ t('addItem') }}</button>
      <button @click="resetAllItem" :disabled="input.length === 0">{{ t('resetAll') }}</button>
      <button @click="calculate" :disabled="!canCalculate">{{ t('startCalculate') }}</button>
      <h3>{{ $t('titleSettings') }}</h3>
      <div>
        <select v-model="mode">
          <option value="xp">{{ t('modeXp') }}</option>
          <option value="lvl">{{ t('modeLvl') }}</option>
        </select>
        <br />
        <input type="checkbox" id="useBedrock" v-model="settings.useBedrock" />
        <label for="useBedrock">{{ t('useBedrock') }} </label>
        <!--
        <br />
        <input type="checkbox" id="allowIncompatible" v-model="settings.allowIncompatible" />
        <label for="allowIncompatible">{{ t('allowIncompatible') }} </label>-->
        <br />
        <input type="checkbox" id="allowTooExpensive" v-model="settings.allowTooExpensive" />
        <label for="allowTooExpensive">{{ t('allowTooExpensive') }} </label>
        <!--
        <br />
        <input type="checkbox" id="allowOverMaxLevel" v-model="settings.allowOverMaxLevel" />
        <label for="allowOverMaxLevel">{{ t('allowOverMaxLevel') }} </label>-->
      </div>
    </div>
    <div class="resultPanel">
      <h3 v-if="result">{{ t('titleResult') }}</h3>
      <table v-if="result?.steps?.length">
        <thead>
          <tr>
            <th>{{ t('step') }}</th>
            <th>{{ t('itemA') }}</th>
            <th>{{ t('itemB') }}</th>
            <th>{{ t('result') }}</th>
            <th>{{ t('cost') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(step, idx) in result.steps" :key="idx">
            <td style="text-align: center">{{ idx + 1 }}</td>
            <td><item :item="step.left" /></td>
            <td><item :item="step.right" /></td>
            <td><item :item="step.merged" /></td>
            <td style="text-align: center">
              <span v-if="lastMode === 'lvl'">{{ step.costLvl }} lvl </span>
              <span v-else> {{ step.costXp }} Exp </span>
            </td>
          </tr>
          <tr>
            <td style="text-align: center">{{ t('total') }}</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td style="text-align: center">
              <span v-if="lastMode === 'lvl'">{{ result?.costLvl }} lvl </span>
              <span v-else> {{ result?.costXp }} Exp </span>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="result?.elapsedMs">
        <small>Elapsed: {{ result.elapsedMs.toFixed(2) }} ms</small>
      </div>
    </div>
  </div>
  <div class="footer">
    <LanguageSelector
      :currentLocale="currentLocale"
      @update:currentLocale="(val) => (currentLocale = val)"
    />
    <span>© 2025 Minecraft Anvil Helper TS</span>
  </div>
  {{ selectedEnchantments }}
</template>

<style>
html,
body {
  margin: 0;
  padding: 0;
}
button {
  border-color: #eee;
  margin: 0.25em;
}
#app {
  display: flex;
  flex-direction: column;
  min-height: 90vh;
}
.container {
  flex: 1 1 auto;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: stretch;
  width: 100vw;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
}
.itemPanel {
  flex: 0 0 40%;
  min-width: 0;
  box-sizing: border-box;
  padding-right: 1em;
  display: flex;
  flex-direction: column;
}
.resultPanel {
  flex: 1 1 60%;
  min-width: 0;
  box-sizing: border-box;
  margin-bottom: 5em;
  padding-left: 1em;
  display: flex;
  flex-direction: column;
}
.itemPanel h3,
.resultPanel h3,
.itemCard {
  flex: 0 0 auto;
  margin: 0.25em;
  padding: 0.25em;
  display: inline-block;
  position: relative;
}
.itemCard {
  border: 1px solid black;
}
.deleteBtn {
  position: absolute;
  right: 0.2em;
  top: 0.2em;
  color: red;
  border: none;
  background: transparent;
  z-index: 2;
  padding: 0 0.3em;
}
table {
  border-collapse: collapse;
  margin: 0.25em;
}
th,
td {
  border: 1px solid black;
}
th {
  text-align: center;
}
th,
tr,
td {
  vertical-align: text-top;
  padding: 0 0.5em;
}
.footer {
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100%;
  background-color: lightgray;
  display: flex;
  z-index: 10;
  box-shadow: 0 -2px 8px #0001;
  padding: 0.5em 0;
}
.footer * {
  margin-left: auto;
  margin-right: 1em;
}
.footer span {
  margin-left: 0;
}
</style>
