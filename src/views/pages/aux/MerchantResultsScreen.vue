<template>
  <div class="results-screen">
    <!-- Заглушки -->
    <div v-if="activeScreen === 'merchPlaceholder'" class="all-results-container">
      <div class="fullscreen-text-container">
        <div class="fullscreen-place-title">Результаты купцов <br></br>(По капиталу)</div>
      </div>
    </div>

    <div v-else-if="activeScreen === 'merchBoyarPlaceholder'" class="all-results-container">
      <div class="fullscreen-text-container">
        <div class="fullscreen-place-title">Результаты купцов <br></br>(По боярским милостям)</div>
      </div>
    </div>

    <!-- Текстовые заголовки -->
    <div v-else-if="activeScreen === 'thirdPlaceMerch'" class="place-section bronze">
      <div class="fullscreen-text-container">
        <div class="fullscreen-place-title">Третье место</div> 
      </div>
    </div>

    <div v-else-if="activeScreen === 'secondPlaceMerch'" class="place-section silver">
      <div class="fullscreen-text-container">
        <div class="fullscreen-place-title">Второе место</div> 
      </div>
    </div>

    <div v-else-if="activeScreen === 'firstPlaceMerch'" class="place-section gold">
      <div class="fullscreen-text-container">
        <div class="fullscreen-place-title">Первое место</div> 
      </div>
    </div>

    <!-- Детальные результаты -->
    <div v-else-if="activeScreen === 'thirdMerch'" class="place-section bronze">
      <div class="fullscreen-text-container">
        <div class="fullscreen-place-title" style="margin-bottom: 20px;">Третье место</div>
        <div class="winner-list">
          <div 
            v-for="(team, index) in merchResults" 
            :key="team.guild_id || team.player_id || index" 
            class="winner-line"
          >
            <span class="winner-name">{{ team.player }}</span>
            <div class="winner-header">
              <span>Капитал</span> • 
              <span>Игроков</span> • 
              <span>На игрока</span>
            </div>
            <span class="winner-stats">
              {{ team.capital.toLocaleString() }}<img :src="getResourceImageUrl('gold')" alt="золото" style="width: 1em; height: 1em; vertical-align: middle; display: inline-block;"> • 
              {{ team.number_of_players }}👥 • 
              <span class="highlight-gold">{{ (team.cap_per_pl || 0).toLocaleString() }}</span><img :src="getResourceImageUrl('gold')" alt="золото" style="width: 1em; height: 1em; vertical-align: middle; display: inline-block;">
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="activeScreen === 'secondMerch'" class="place-section silver">
      <div class="fullscreen-text-container">
        <div class="fullscreen-place-title" style="margin-bottom: 20px;">Второе место</div>
        <div class="winner-list">
          <div 
            v-for="(team, index) in merchResults" 
            :key="team.guild_id || team.player_id || index" 
            class="winner-line"
          >
            <span class="winner-name">{{ team.player }}</span>
            <div class="winner-header">
              <span>Капитал</span> • 
              <span>Игроков</span> • 
              <span>На игрока</span>
            </div>
            <span class="winner-stats">
              {{ team.capital.toLocaleString() }}<img :src="getResourceImageUrl('gold')" alt="золото" style="width: 1em; height: 1em; vertical-align: middle; display: inline-block;"> • 
              {{ team.number_of_players }}👥 • 
              <span class="highlight-gold">{{ (team.cap_per_pl || 0).toLocaleString() }}</span><img :src="getResourceImageUrl('gold')" alt="золото" style="width: 1em; height: 1em; vertical-align: middle; display: inline-block;">
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="activeScreen === 'firstMerch'" class="place-section gold">
      <div class="fullscreen-text-container">
        <div class="fullscreen-place-title" style="margin-bottom: 20px;">Первое место</div>
        <div class="winner-list">
          <div 
            v-for="(team, index) in merchResults" 
            :key="team.guild_id || team.player_id || index" 
            class="winner-line"
          >
            <span class="winner-name">{{ team.player }}</span>
            <div class="winner-header">
              <span>Капитал</span> • 
              <span>Игроков</span> • 
              <span>На игрока</span>
            </div>
            <span class="winner-stats">
              {{ team.capital.toLocaleString() }}<img :src="getResourceImageUrl('gold')" alt="золото" style="width: 1em; height: 1em; vertical-align: middle; display: inline-block;"> • 
              {{ team.number_of_players }}👥 • 
              <span class="highlight-gold">{{ (team.cap_per_pl || 0).toLocaleString() }}</span><img :src="getResourceImageUrl('gold')" alt="золото" style="width: 1em; height: 1em; vertical-align: middle; display: inline-block;">
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Таблица всех результатов по капиталу -->
    <div v-else-if="activeScreen === 'allMerch'" class="all-results-container">
      <div class="fullscreen-text-container">
        <div class="fullscreen-place-title" style="margin-bottom: 20px;">Результаты купцов</div>
        <table class="merchant-table">
          <thead>
            <tr>
              <th class="place-col">Место</th>
              <th class="name-col">Команда</th>
              <th class="capital-col">Капитал</th>
              <th class="players-col">Игроков</th>
              <th class="capital-per-player-col">На игрока</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(team, index) in merchResults" 
              :key="team.guild_id || team.player_id || index"
              :class="'place-' + team.place"
            >
              <td class="place-number">{{ team.place }}</td>
              <td class="team-name">{{ team.player }}</td>
              <td class="team-capital">{{ team.capital.toLocaleString() }}<img :src="getResourceImageUrl('gold')" alt="золото" style="width: 1em; height: 1em; vertical-align: middle; display: inline-block;"></td>
              <td class="team-players">{{ team.number_of_players }}👥</td>
              <td class="team-capital-per-player">{{ (team.cap_per_pl || 0).toLocaleString() }}<img :src="getResourceImageUrl('gold')" alt="золото" style="width: 1em; height: 1em; vertical-align: middle; display: inline-block;"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Результаты по боярским милостям: заглушки мест -->
    <div v-else-if="activeScreen === 'thirdPlaceMerchBoyar'" class="place-section bronze">
      <div class="fullscreen-text-container">
        <div class="fullscreen-place-title">Третье место</div> 
      </div>
    </div>

    <div v-else-if="activeScreen === 'secondPlaceMerchBoyar'" class="place-section silver">
      <div class="fullscreen-text-container">
        <div class="fullscreen-place-title">Второе место</div> 
      </div>
    </div>

    <div v-else-if="activeScreen === 'firstPlaceMerchBoyar'" class="place-section gold">
      <div class="fullscreen-text-container">
        <div class="fullscreen-place-title">Первое место</div> 
      </div>
    </div>

    <!-- Результаты по боярским милостям: детальные -->
    <div v-else-if="activeScreen === 'thirdMerchBoyar'" class="place-section bronze">
      <div class="fullscreen-text-container">
        <div class="fullscreen-place-title" style="margin-bottom: 20px;">Третье место</div>
        <div class="winner-list">
          <div 
            v-for="(team, index) in merchResults" 
            :key="team.guild_id || team.player_id || index" 
            class="winner-line"
          >
            <span class="winner-name">{{ team.player }}</span>
            <div class="winner-header">
              <span>Боярская милость</span> •
              <span>Игроков</span>
            </div>
            <span class="winner-stats">
              <span class="highlight-gold">{{ team.boyar_favor || 0 }}⚜️</span> •
              {{ team.number_of_players }}👥
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="activeScreen === 'secondMerchBoyar'" class="place-section silver">
      <div class="fullscreen-text-container">
        <div class="fullscreen-place-title" style="margin-bottom: 20px;">Второе место</div>
        <div class="winner-list">
          <div 
            v-for="(team, index) in merchResults" 
            :key="team.guild_id || team.player_id || index" 
            class="winner-line"
          >
            <span class="winner-name">{{ team.player }}</span>
            <div class="winner-header">
              <span>Боярская милость</span> •
              <span>Игроков</span>
            </div>
            <span class="winner-stats">
              <span class="highlight-gold">{{ team.boyar_favor || 0 }}⚜️</span> •
              {{ team.number_of_players }}👥
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="activeScreen === 'firstMerchBoyar'" class="place-section gold">
      <div class="fullscreen-text-container">
        <div class="fullscreen-place-title" style="margin-bottom: 20px;">Первое место</div>
        <div class="winner-list">
          <div 
            v-for="(team, index) in merchResults" 
            :key="team.guild_id || team.player_id || index" 
            class="winner-line"
          >
            <span class="winner-name">{{ team.player }}</span>
            <div class="winner-header">
              <span>Боярская милость</span> •
              <span>Игроков</span>
            </div>
            <span class="winner-stats">
              <span class="highlight-gold">{{ team.boyar_favor || 0 }}⚜️</span> •
              {{ team.number_of_players }}👥
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Таблица всех результатов по боярским милостям -->
    <div v-else-if="activeScreen === 'allMerchBoyar'" class="all-results-container">
      <div class="fullscreen-text-container">
        <div class="fullscreen-place-title" style="margin-bottom: 20px;">Результаты купцов</div>
        <table class="merchant-table">
          <thead>
            <tr>
              <th class="place-col">Место</th>
              <th class="name-col">Команда</th>
              <th class="favor-col">Боярская милость</th>
              <th class="players-col">Игроков</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(team, index) in merchResults" 
              :key="team.guild_id || team.player_id || index"
              :class="'place-' + team.place"
            >
              <td class="place-number">{{ team.place }}</td>
              <td class="team-name">{{ team.player }}</td>
              <td class="team-favor">{{ team.boyar_favor || 0 }}⚜️</td>
              <td class="team-players">{{ team.number_of_players }}👥</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Комбинированный вывод: боярские милости + капитал (сортировка по боярским милостям) -->
    <div v-else-if="activeScreen === 'allMerchBoyarWithCapital'" class="all-results-container">
      <div class="fullscreen-text-container">
        <div class="fullscreen-place-title" style="margin-bottom: 20px;">Результаты купцов</div>
        <table class="merchant-table">
          <thead>
            <tr>
              <th class="place-col">Место</th>
              <th class="name-col">Команда</th>
              <th class="favor-col">Боярская милость</th>
              <th class="capital-col">Капитал</th>
              <th class="players-col">Игроков</th>
              <th class="capital-per-player-col">На игрока</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(team, index) in merchResults" 
              :key="team.guild_id || team.player_id || index"
              :class="'place-' + team.place"
            >
              <td class="place-number">{{ team.place }}</td>
              <td class="team-name">{{ team.player }}</td>
              <td class="team-favor">{{ team.boyar_favor || 0 }}⚜️</td>
              <td class="team-capital">{{ team.capital.toLocaleString() }}<img :src="getResourceImageUrl('gold')" alt="золото" style="width: 1em; height: 1em; vertical-align: middle; display: inline-block;"></td>
              <td class="team-players">{{ team.number_of_players }}👥</td>
              <td class="team-capital-per-player">{{ (team.cap_per_pl || 0).toLocaleString() }}<img :src="getResourceImageUrl('gold')" alt="золото" style="width: 1em; height: 1em; vertical-align: middle; display: inline-block;"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Fallback -->
    <div v-else class="fullscreen-text-container">
        <div class="fullscreen-place-title">Результаты купцов</div>
    </div>
  </div>
</template>

<script setup>
// URL для загрузки изображений ресурсов с бэкенда
const baseURL = import.meta.env.VITE_PROXY
const getResourceImageUrl = (identificator) => `${baseURL}/images/resources/${identificator}.png`

defineProps({
  activeScreen: {
    type: String,
    required: true
  },
  merchResults: {
    type: Array,
    required: true
  }
})
</script>

<style scoped lang="scss">
@import './Screen.style.scss';
</style>

