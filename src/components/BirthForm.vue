<script setup lang="ts">
import { ref } from 'vue'
import { CITY_PRESETS, TIMEZONES, type BirthInput } from '../lib/astrology'
import { loadJSON, saveJSON } from '../lib/storage'
import { sparkleFromEvent } from '../lib/sparkle'

export interface BirthFormValue {
  date: string
  time: string
  tz: number
  cityIndex: number
  lat: number
  lng: number
}

const props = defineProps<{
  /** 是否预填本机保存的出生档案 */
  useSaved?: boolean
  buttonLabel?: string
}>()

const emit = defineEmits<{ submit: [input: BirthInput] }>()

const saved = props.useSaved ? loadJSON<Partial<BirthFormValue>>('birth-profile', {}) : {}
const form = ref<BirthFormValue>({
  date: '',
  time: '12:00',
  tz: 8,
  cityIndex: -1,
  lat: 39.9042,
  lng: 116.4074,
  ...saved,
})

const errorText = ref('')

function onCityChange(): void {
  const preset = CITY_PRESETS[form.value.cityIndex]
  if (preset) {
    form.value.lat = preset.lat
    form.value.lng = preset.lng
  }
}

function submit(e: MouseEvent): void {
  errorText.value = ''
  const [y, m, d] = form.value.date.split('-').map(Number)
  const [hh, mm] = form.value.time.split(':').map(Number)
  if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) {
    errorText.value = '请填写完整的出生日期与时间～'
    return
  }
  if (!Number.isFinite(form.value.lat) || !Number.isFinite(form.value.lng)) {
    errorText.value = '经纬度必须是有效数字哦。'
    return
  }
  if (props.useSaved) saveJSON('birth-profile', form.value)
  sparkleFromEvent(e, 8)
  emit('submit', {
    year: y, month: m, day: d, hour: hh, minute: mm,
    timezone: form.value.tz, latitude: form.value.lat, longitude: form.value.lng,
  })
}
</script>

<template>
  <div class="form-row">
    <label class="field"><span>出生日期</span><input v-model="form.date" type="date" /></label>
    <label class="field"><span>出生时间</span><input v-model="form.time" type="time" /></label>
    <label class="field">
      <span>时区</span>
      <select v-model.number="form.tz">
        <option v-for="t in TIMEZONES" :key="t.label" :value="t.value">{{ t.label }}</option>
      </select>
    </label>
  </div>
  <div class="form-row">
    <label class="field">
      <span>出生城市（快捷选择）</span>
      <select v-model.number="form.cityIndex" @change="onCityChange">
        <option :value="-1">—— 手动输入经纬度 ——</option>
        <option v-for="(c, i) in CITY_PRESETS" :key="c.city" :value="i">{{ c.city }}</option>
      </select>
    </label>
    <label class="field"><span>北纬（°）</span><input v-model.number="form.lat" type="number" step="0.0001" /></label>
    <label class="field"><span>东经（°）</span><input v-model.number="form.lng" type="number" step="0.0001" /></label>
  </div>
  <button class="btn" @click="submit">{{ buttonLabel ?? '绘制星盘' }}</button>
  <p v-if="errorText" class="error-text">{{ errorText }}</p>
</template>
