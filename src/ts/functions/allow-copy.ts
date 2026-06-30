import { SatinBaseFunction } from '../types/functions/base'

export class AllowCopyFunction extends SatinBaseFunction {
    bind_events() {
        document.addEventListener('selectstart', (e) => {
            const allow_copy = this.engine.get_settings().global_allow_copy
            if (!allow_copy) return
            e.stopPropagation()
            return true
        }, true)
    }
    apply() {
        const allow_copy = this.engine.get_settings().global_allow_copy
        const unselectable_elements = document.querySelectorAll<HTMLElement>('.x-unselectable')
        unselectable_elements.forEach(el => {
            if (allow_copy) {
                el.style.setProperty('user-select', 'text', 'important')
                el.style.setProperty('-webkit-user-select', 'text', 'important')
                if (!el.matches('button, a, .x-btn')) {
                    el.style.setProperty('cursor', 'text', 'important')
                }
            } else {
                el.style.removeProperty('user-select')
                el.style.removeProperty('-webkit-user-select')
                if (!el.matches('button, a, .x-btn')) {
                    el.style.removeProperty('cursor')
                }
            }
        })
    }
}
