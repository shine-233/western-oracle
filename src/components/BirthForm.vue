<script setup lang="ts">
import { ref } from 'vue'
import { CITY_PRESETS, TIMEZONES, type BirthInput } from '../lib/astrology'
import { loadJSON, saveJSON } from '../lib/storage'
import { sparkleFromEvent } from '../lib/sparkle'
import { t } from '../lib/i18n'

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
    errorText.value = t('err.date')
    return
  }
  if (!Number.isFinite(form.value.lat) || !Number.isFinite(form.value.lng)) {
    errorText.value = t('err.coord')
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
    <label class="field"><span>{{ t('bf.date') }}</span><input v-model="form.date" type="date" /></label>
    <label class="field"><span>{{ t('bf.time') }}</span><input v-model="form.time" type="time" /></label>
    <label class="field">
      <span>{{ t('bf.tz') }}</span>
      <select v-model.number="form.tz">
        <option v-for="tz in TIMEZONES" :key="tz.label" :value="tz.value">{{ tz.label }}</option>
      </select>
    </label>
  </div>
  <div class="form-row">
    <label class="field">
      <span>{{ t('bf.city') }}</span>
      <select v-model.number="form.cityIndex" @change="onCityChange">
        <option :value="-1">{{ t('bf.manual') }}</option>
        <option v-for="(c, i) in CITY_PRESETS" :key="c.city" :value="i">{{ c.city }}</option>
      </select>
    </label>
    <label class="field"><span>{{ t('bf.lat') }}</span><input v-model.number="form.lat" type="number" step="0.0001" /></label>
    <label class="field"><span>{{ t('bf.lng') }}</span><input v-model.number="form.lng" type="number" step="0.0001" /></label>
  </div>
  <button class="btn" @click="submit">{{ buttonLabel ?? t('bf.submit') }}</button>
  <p v-if="errorText" class="error-text">{{ errorText }}</p>
</template>
