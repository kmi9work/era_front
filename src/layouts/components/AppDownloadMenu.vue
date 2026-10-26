<script setup>
import { ref } from 'vue'

/**
 * Иконка «Скачать приложение» в навбаре.
 *
 * Открывает меню выбора сборки Android-приложения (era_native). Файлы публикует
 * era_scripts/build-prod.sh в каталог /opt/era/era_front/downloads, сайт отдаёт их
 * по /apk/era-<игра>.apk. Если версия ещё не собрана и не загружена, файла нет —
 * пункт помечается «не опубликовано», а ссылка не открывается (иначе nginx отдаст
 * index.html под видом apk).
 */

const gameVersions = [
  {
    key: 'base',
    title: 'Эпоха перемен',
    url: '/apk/era-base.apk',
  },
  {
    key: 'vassals',
    title: 'Вассалы и разбойники',
    url: '/apk/era-vassals.apk',
  },
  {
    key: 'artel',
    title: 'Артель',
    url: '/apk/era-artel.apk',
  },
  {
    // key = имя productFlavor в era_native/android/app/build.gradle:
    // era_scripts/build-prod.sh публикует файл как era-<flavor>.apk
    key: 'manyteams',
    title: 'Много команд',
    url: '/apk/era-manyteams.apk',
  },
]

// key -> { state: 'unknown' | 'checking' | 'available' | 'missing', size: Number }
const checks = ref({})
const menuOpen = ref(false)

function formatSize(bytes) {
  if (!bytes) return ''
  return `${Math.round(bytes / 1024 / 1024)} МБ`
}

function stateOf(key) {
  return checks.value[key]?.state ?? 'unknown'
}

/**
 * Проверка наличия файла: HEAD-запрос по ссылке.
 * text/html означает, что nginx отдал SPA-заглушку — файла нет.
 */
async function checkVersion(game) {
  checks.value = {
    ...checks.value,
    [game.key]: { state: 'checking' },
  }

  try {
    const response = await fetch(game.url, { method: 'HEAD', cache: 'no-store' })
    const type = (response.headers.get('content-type') || '').toLowerCase()
    const size = Number(response.headers.get('content-length') || 0)

    if (response.ok && !type.includes('text/html')) {
      checks.value = {
        ...checks.value,
        [game.key]: { state: 'available', size },
      }
    } else {
      checks.value = {
        ...checks.value,
        [game.key]: { state: 'missing' },
      }
    }
  } catch {
    checks.value = {
      ...checks.value,
      [game.key]: { state: 'missing' },
    }
  }
}

function checkAll() {
  gameVersions.forEach(checkVersion)
}

function onMenuUpdate(open) {
  menuOpen.value = open
  if (open) checkAll()
}
</script>

<template>
  <VMenu v-model="menuOpen" :close-on-content-click="true" offset="8" @update:model-value="onMenuUpdate">
    <template #activator="{ props }">
      <IconBtn v-bind="props" title="Скачать приложение для Android">
        <VIcon icon="ri-download-2-line" />
      </IconBtn>
    </template>

    <VList density="compact" min-width="320" class="download-list">
      <VListSubheader class="text-wrap">
        Приложение для планшета (Android)
      </VListSubheader>

      <VListItem
        v-for="game in gameVersions"
        :key="game.key"
        :href="stateOf(game.key) === 'available' ? game.url : undefined"
        :disabled="stateOf(game.key) !== 'available'"
        download
      >
        <template #prepend>
          <VIcon :icon="stateOf(game.key) === 'available' ? 'ri-android-line' : 'ri-forbid-line'" />
        </template>

        <VListItemTitle>{{ game.title }}</VListItemTitle>
        <VListItemSubtitle>
          <template v-if="stateOf(game.key) === 'available'">
            Скачать APK<template v-if="checks[game.key]?.size"> · {{ formatSize(checks[game.key].size) }}</template>
          </template>
          <template v-else-if="stateOf(game.key) === 'checking'">проверяем…</template>
          <template v-else>не опубликовано</template>
        </VListItemSubtitle>
      </VListItem>

      <VListSubheader class="text-caption download-note">
        Установка из неизвестных источников
      </VListSubheader>
    </VList>
  </VMenu>
</template>

<style scoped>
.download-list {
  max-inline-size: 22rem;
}

/* Vuetify режет текст подзаголовков в одну строку — здесь нужен перенос */
.download-list :deep(.v-list-subheader) {
  block-size: auto;
  white-space: normal;
  line-height: 1.3;
  padding-block: 0.5rem;
}
</style>
