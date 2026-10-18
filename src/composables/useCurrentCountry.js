import { ref } from 'vue'
import axios from 'axios'

/**
 * Текущее государство (many_teams, ТЗ № 2, § 1.1).
 *
 * Зеркалит бэкендное `Country.current`: государство хранится в сессии
 * (`session[:country_id]`) и меняется вызовом `GET /login_country/:id.json`.
 * Отдельного «режима на несколько команд» нет — приложение всегда работает
 * в разрезе текущего государства; когда мастера играют за одну страну,
 * поведение не отличается от прежнего (бейдж просто показывает эту страну).
 *
 * Состояние модульное (разделяется всеми компонентами), поэтому смена
 * государства в шапке сразу видна на всех экранах.
 */

const api = () => import.meta.env.VITE_PROXY

const currentCountry = ref(null)
const currentCountryId = ref(null)
const countries = ref([])
// Счётчик перечитывания: компоненты следят за ним и заново запрашивают свои данные
// (сброс кэшей компонентов + повторная загрузка, § 1.1).
const reloadToken = ref(0)
const isLoading = ref(false)
const error = ref(null)

let countriesLoaded = false
let currentLoaded = false

function normalize(data) {
  return data && data.id ? data : null
}

/**
 * Все государства — список для выбора. Признака «играбельное государство» нет:
 * взять можно любое.
 */
async function loadCountries(force = false) {
  if (countriesLoaded && !force) return countries.value
  try {
    const { data } = await axios.get(`${api()}/countries.json`)
    countries.value = Array.isArray(data) ? data : []
    countriesLoaded = true
    error.value = null
  } catch (e) {
    error.value = e?.message || 'Не удалось загрузить список государств'
    countries.value = []
  }
  return countries.value
}

/** Текущее государство сессии (`GET /current_country.json`). */
async function loadCurrentCountry(force = false) {
  if (currentLoaded && !force && currentCountry.value) return currentCountry.value
  try {
    const { data } = await axios.get(`${api()}/current_country.json`)
    currentCountry.value = normalize(data)
    currentCountryId.value = currentCountry.value?.id ?? null
    currentLoaded = true
    error.value = null
  } catch (e) {
    error.value = e?.message || 'Не удалось загрузить текущее государство'
  }
  if (!countries.value.length) await loadCountries()
  return currentCountry.value
}

/**
 * Выбрать текущее государство. Сессия на бэкенде меняется только при успехе;
 * несуществующий id возвращает 404 и состояние не меняется.
 * После смены все экраны перечитывают данные (reloadToken).
 */
async function setCurrentCountry(id) {
  if (!id) return null
  isLoading.value = true
  try {
    const { data } = await axios.get(`${api()}/login_country/${id}.json`)
    const country = normalize(data)
    if (!country) {
      error.value = 'Государство не найдено'
      return null
    }
    currentCountry.value = country
    currentCountryId.value = country.id
    currentLoaded = true
    error.value = null
    reloadAll()
    return country
  } catch (e) {
    error.value = e?.response?.data?.error || e?.message || 'Не удалось сменить государство'
    return null
  } finally {
    isLoading.value = false
  }
}

/** Принудительное перечитывание данных всеми экранами. */
function reloadAll() {
  reloadToken.value += 1
}

/**
 * Добавляет `country_id` в адрес запроса: явный контекст государства для
 * эндпоинтов с параметром (бэкенд по умолчанию тоже берёт текущее государство).
 */
function withCountryParam(url, id = currentCountryId.value) {
  if (!id) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}country_id=${id}`
}

/** Поиск государства по id в загруженном списке (без запроса). */
function findCountry(id) {
  return countries.value.find(country => country.id === Number(id)) || null
}

async function ensureLoaded() {
  await loadCurrentCountry()
  if (!countries.value.length) await loadCountries()
}

export function useCurrentCountry() {
  return {
    // состояние
    currentCountry,
    currentCountryId,
    countries,
    reloadToken,
    isLoading,
    error,
    // действия
    loadCurrentCountry,
    loadCountries,
    setCurrentCountry,
    reloadAll,
    withCountryParam,
    findCountry,
    ensureLoaded,
  }
}
