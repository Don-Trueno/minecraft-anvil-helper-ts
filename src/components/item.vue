<script lang="ts" setup>
import { ref, computed, watch, getCurrentInstance } from 'vue'
import { useI18n } from 'vue-i18n'
import { getInfo } from '../utils/data'

const { t } = useI18n()
const n: string[] = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

const props = defineProps<{
  item: any
  editable?: boolean
  editing?: boolean
  typeList?: string[]
  enchantmentList?: any[]
  useBedrock?: boolean
}>()
const emit = defineEmits(['update:editing'])

const { uid: _uid } = getCurrentInstance()!

const imgSrc = ref('')
if (props.item) {
  imgSrc.value = `${props.item.type}.png`
}
function handleImgError() {
  if (imgSrc.value.endsWith('.png')) {
    imgSrc.value = `${props.item.type}.gif`
  }
}

const editing = ref(props.editing ?? false)
watch(
  () => props.editing,
  (val) => (editing.value = val),
)

const editType = ref(props.item?.type || '')
const editPenalty = ref(props.item?.penaltyCount || 0)
const editEnchantments = ref(
  props.item?.enchantments ? props.item.enchantments.map((e: any) => ({ ...e })) : [],
)

// edit
function startEdit() {
  if (props.editable) {
    editing.value = true
    emit('update:editing', true)
    editType.value = props.item.type
    editPenalty.value = props.item.penaltyCount
    editEnchantments.value = props.item.enchantments
      ? props.item.enchantments.map((e: any) => ({ ...e }))
      : []
  }
}
function saveEdit() {
  props.item.type = editType.value
  props.item.penaltyCount = editPenalty.value
  props.item.enchantments = editEnchantments.value.map((e: any) => ({ ...e }))
  editing.value = false
  emit('update:editing', false)
  imgSrc.value = `${props.item.type}.png`
}
const saveCheck1 = computed(
  () => editType.value === 'enchanted_book' && editEnchantments.value.length === 0,
)
const saveCheck2 = computed(() => editEnchantments.value.some((e: any) => e.id === ''))
function cancelEdit() {
  editing.value = false
  emit('update:editing', false)
}

function addEnchantment() {
  editEnchantments.value.push({ id: '', level: 1 })
}
//TODO: implement max level enforcement
function getEnchantmentMaxLevel(e: any) {
  console.log(e.value)
  return getInfo(e.value, props.useBedrock)?.maxLevel || 10
}
function removeEnchantment(idx: number) {
  editEnchantments.value.splice(idx, 1)
}
</script>

<template>
  <div v-if="item" @click="startEdit" :class="{ editableItemCard: props.editable }">
    <div class="itemTitle">
      <img
        :src="imgSrc"
        class="itemIcon"
        :alt="`${t(item.type)} Minecraft item icon`"
        height="16px"
        @error="handleImgError"
      />
      {{ t(`${item.type}`) }}
    </div>
    <div v-if="item.enchantments">
      <div v-for="(ench, index) in item.enchantments" :key="index" class="itemDesc">
        {{ t(`${ench.id}`) }} {{ n[ench.level] || ench.level }}
      </div>
    </div>
    <div v-if="item.penaltyCount" class="itemDesc penaltyCount">
      {{ t('penaltyCount') }}{{ item.penaltyCount }}
    </div>
    <!--editing panel-->
    <div v-if="props.editable && editing" class="editingPanel" @click.stop>
      <div class="editingRow">
        <label :for="'type-' + _uid">{{ t('selectType') }}</label>
        <select :id="'type-' + _uid" v-model="editType" @click.stop>
          <option v-for="type in typeList" :key="type" :value="type">
            {{ t(type) }}
          </option>
        </select>
      </div>
      <div class="editingRow">
        <label :for="'penalty-' + _uid">{{ t('penaltyCount') }}</label>
        <input :id="'penalty-' + _uid" type="number" v-model="editPenalty" min="0" @click.stop />
      </div>
      <div class="editingRow">
        {{ t('selectEnchantments') }}
      </div>
      <div v-for="(ench, idx) in editEnchantments" :key="idx" class="editingRow">
        <select v-model="ench.id" @click.stop style="flex: 5">
          <option v-for="e in enchantmentList" :key="e" :value="e">
            {{ t(e) }}
          </option>
        </select>
        <input
          type="number"
          v-model="ench.level"
          min="1"
          :max="getEnchantmentMaxLevel(ench)"
          @click.stop
          style="flex: 3"
        />
        <span @click.stop="removeEnchantment(idx)" style="color: red; flex: 2; text-align: center"
          >×</span
        >
      </div>
      <button @click.stop="addEnchantment" class="editingRow">
        {{ t('addNewEnchantment') }}
      </button>
      <div v-if="saveCheck1" class="editingRow">
        <small style="color: red">{{ t('needAtLeastOneEnchantment') }}</small>
      </div>
      <div v-if="saveCheck2" class="editingRow">
        <small style="color: red">{{ t('noEmptyEnchantment') }}</small>
      </div>
      <div class="editingRow">
        <button @click.stop="saveEdit" :disabled="saveCheck1 || saveCheck2">
          {{ t('saveBtn') }}
        </button>
        <button @click.stop="cancelEdit">{{ t('cancelBtn') }}</button>
      </div>
    </div>
  </div>
</template>
<style>
.itemDesc {
  font-size: small;
  text-wrap-mode: nowrap;
  margin-left: 1em;
  color: gray;
}
.editableItemCard {
  cursor: pointer;
  border: 2px dashed #ccc;
  padding: 0.25em;
}
.itemIcon {
  margin-left: 0.25em;
  margin-right: 0.25em;
  vertical-align: text-bottom;
}
.penaltyCount {
  color: #ff5555;
}
.editingPanel {
  background: #f8f8f8;
  border: 1px solid #ccc;
  margin-top: 0.5em;
  padding: 0.5em;
  display: flex;
  flex-direction: column;
}
.editingRow {
  display: flex;
  align-items: center;
  width: 100%;
  margin-bottom: 0.25em;
}
.editingRow label {
  flex: 0 0 auto;
  margin: 0;
  margin-right: 0.5em;
  width: auto;
  display: block;
}
.editingRow input,
.editingRow select,
.editingRow button {
  flex: 1 1 0;
  min-width: 0;
  box-sizing: border-box;
  display: block;
}
</style>
