class ComponentRegistry {
  constructor() {
    this.components = new Map()
    this.defaultComponents = new Map()
  }

  /**
   * Регистрирует компонент в registry
   * @param {string} name - Имя компонента
   * @param {Component} component - Vue компонент
   * @param {boolean} isDefault - Является ли это компонентом ядра
   */
  register(name, component, isDefault = false) {
    console.log(`[Registry] Registering component: ${name}`)
    
    if (isDefault) {
      this.defaultComponents.set(name, component)
    }
    
    this.components.set(name, component)
  }

  /**
   * Получает компонент из registry
   * @param {string} name - Имя компонента
   * @returns {Component}
   */
  get(name) {
    const component = this.components.get(name)
    if (!component) {
      console.warn(`Component "${name}" not found in registry`)
      return null
    }
    return component
  }

  /**
   * Проверяет наличие компонента
   * @param {string} name - Имя компонента
   * @returns {boolean}
   */
  has(name) {
    return this.components.has(name)
  }

  /**
   * Получает компонент ядра (до переопределения)
   * @param {string} name - Имя компонента
   * @returns {Component}
   */
  getDefault(name) {
    return this.defaultComponents.get(name)
  }

  /**
   * Проверяет, был ли компонент переопределён
   * @param {string} name - Имя компонента
   * @returns {boolean}
   */
  isOverridden(name) {
    const current = this.components.get(name)
    const defaultComp = this.defaultComponents.get(name)
    return current !== defaultComp
  }

  /**
   * Массовая регистрация компонентов
   * @param {Object} components - Объект с компонентами
   * @param {boolean} isDefault - Являются ли это компонентами ядра
   */
  registerBatch(components, isDefault = false) {
    Object.entries(components).forEach(([name, component]) => {
      this.register(name, component, isDefault)
    })
  }

  /**
   * Список всех зарегистрированных компонентов
   * @returns {Array<string>}
   */
  list() {
    return Array.from(this.components.keys())
  }

  /**
   * Список переопределённых компонентов
   * @returns {Array<string>}
   */
  listOverridden() {
    return this.list().filter(name => this.isOverridden(name))
  }
}

// Singleton instance
export const componentRegistry = new ComponentRegistry()

