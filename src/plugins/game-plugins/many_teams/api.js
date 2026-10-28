import axios from 'axios'

/** Короткий клиент API движка many_teams (монтируется в /many_teams). */
const BASE = () => `${import.meta.env.VITE_PROXY}/many_teams`

export const engineApi = {
  /** Государства игроков, подтверждённые на «Дашборде» (п. 7). */
  getPlayerCountries: () => axios.get(`${BASE()}/player_countries`),
  savePlayerCountries: countryIds => axios.patch(`${BASE()}/player_countries`, { country_ids: countryIds }),

  /** Разрешения гильдий на строительство и работу предприятий (п. 0-4). */
  getGuildPermissions: countryId => axios.get(`${BASE()}/guild_permissions`, { params: { country_id: countryId } }),
  setGuildPermission: payload => axios.post(`${BASE()}/guild_permissions`, payload),

  /** Эмбарго страна → гильдия (п. 9, п. 10). */
  getEmbargoes: (countryId, targetCountryId) => axios.get(`${BASE()}/guild_embargoes`, {
    params: { country_id: countryId, target_country_id: targetCountryId },
  }),
  imposeEmbargo: payload => axios.post(`${BASE()}/guild_embargoes`, payload),
  liftEmbargo: payload => axios.delete(`${BASE()}/guild_embargoes`, { data: payload }),
  imposeEmbargoOnAll: payload => axios.post(`${BASE()}/guild_embargoes/impose_all`, payload),
  liftAllEmbargoesForCountry: payload => axios.post(`${BASE()}/guild_embargoes/lift_all_for_country`, payload),
  liftAllEmbargoes: payload => axios.post(`${BASE()}/guild_embargoes/lift_all`, payload),

  /** Статус технологии «Заморская торговля» у текущего государства (п. 10, предупреждение). */
  getLiftAllAvailability: () => axios.get(`${BASE()}/guild_embargoes/lift_all_availability`),

  /** Табло «Служебное → Гильдии»: все гильдии игры — разрешение, эмбарго, ресурсы. */
  getGuildsOverview: countryId => axios.get(`${BASE()}/guilds_overview`, { params: { country_id: countryId } }),

  /** Табло «Служебное → Результаты всех команд»: общий и личный зачёт по всем командам. */
  getAllTeamsResults: () => axios.get(`${BASE()}/all_teams_results`),

  /** «Рынок»: какие государства наложили эмбарго на конкретную гильдию. */
  getMarketEmbargoes: (guildId, countryId) => axios.get(`${BASE()}/guild_embargoes/market`, {
    params: { guild_id: guildId, country_id: countryId },
  }),

  /** Пункты разведки и цели (п. 11). */
  getIntelligenceTargets: () => axios.get(`${BASE()}/intelligence/targets`),
}

export const errorMessage = error =>
  error?.response?.data?.error || error?.message || 'Не удалось выполнить запрос'
