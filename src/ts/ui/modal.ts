import { create_element } from '../utils/dom'

interface ModalConfigOptions {
    width?: string
    height?: string
    left?: string
    top?: string
}

interface ModalConfig {
    id: string
    title: string
    content: HTMLElement | string
    parent_el: HTMLElement
    options?: ModalConfigOptions
}

export class ModalInstance {
    public id: string
    public el: HTMLDivElement
    public header: HTMLDivElement
    public title_el: HTMLSpanElement
    public min_btn: HTMLButtonElement
    public pin_btn: HTMLButtonElement
    public close_btn: HTMLButtonElement
    public chevron_svg: SVGElement
    public body: HTMLDivElement
    public parent: HTMLElement

    public starting_parent_id: string

    public original_width: string
    public original_height: string
    public is_minimized: boolean = false
    public is_pinned: boolean = false

    public minimized_width: string = '200px'

    constructor(data: {
        id: string
        el: HTMLDivElement
        header: HTMLDivElement
        title_el: HTMLSpanElement
        min_btn: HTMLButtonElement
        pin_btn: HTMLButtonElement
        close_btn: HTMLButtonElement
        chevron_svg: SVGElement
        body: HTMLDivElement
        parent: HTMLElement
        starting_parent_id: string
        original_width: string
        original_height: string
    }) {
        this.id = data.id
        this.el = data.el
        this.header = data.header
        this.title_el = data.title_el
        this.min_btn = data.min_btn
        this.pin_btn = data.pin_btn
        this.close_btn = data.close_btn
        this.chevron_svg = data.chevron_svg
        this.body = data.body
        this.parent = data.parent
        this.starting_parent_id = data.starting_parent_id
        this.original_width = data.original_width
        this.original_height = data.original_height
    }

    public close(): void {
        ModalManager.get_instance().close(this.id)
    }

    public focus(trigger_type: 'click' | 'action' | 'menu_fire' = 'click'): void {
        ModalManager.get_instance().focus(this.id, trigger_type)
    }

    public toggle_minimize(): void {
        ModalManager.get_instance().toggle_minimize(this.id)
    }

    public toggle_pin(): void {
        ModalManager.get_instance().toggle_pin(this.id)
    }
}

class ModalManager {
    private static instance: ModalManager

    private modals: Map<string, ModalInstance> = new Map()
    private modal_stack: string[] = []
    private default_base_z_index: number = 100
    private default_parent_base_z_index: number = 10000

    private static CHEVRON_SVG = `<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>`
    private static PIN_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`
    private static CLOSE_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`

    private static DEFAULT_CONFIG: Required<ModalConfig & { options: Required<ModalConfigOptions> }> = {
        id: '',
        title: '',
        content: '',
        parent_el: document.body,
        options: {
            width: '400px',
            height: '300px',
            left: '50px',
            top: '50px',
        },
    }

    public selectors = {
        ids: {
            modal: (id: string) => `sn-modal-${id}`,
        },
        classes: {
            modal: 'sn-modal animate-open',
            header: 'sn-modal-header',
            title: 'sn-modal-title',
            action_wrapper: 'sn-modal-action-wrapper',
            min_btn: 'sn-modal-action-btn sn-modal-min-btn',
            pin_btn: 'sn-modal-action-btn sn-modal-pin-btn',
            close_btn: 'sn-modal-action-btn sn-modal-close-btn',
            body: 'sn-modal-body',
        },
    }

    private constructor() { }

    public static get_instance(): ModalManager {
        if (!ModalManager.instance) {
            ModalManager.instance = new ModalManager()
        }
        return ModalManager.instance
    }

    private get_parent_z_index(el: HTMLElement): number {
        let current: HTMLElement | null = el
        while (current && current !== document.body) {
            const style = window.getComputedStyle(current)
            const z_index = parseInt(style.zIndex, 10)
            if (!isNaN(z_index) && z_index !== 0) {
                return z_index
            }
            current = current.parentElement
        }
        return this.default_base_z_index
    }

    private build_modal(config: ModalConfig, options: { width: string, height: string, left: string, top: string }): {
        modal_el: HTMLDivElement
        header_el: HTMLDivElement
        title_el: HTMLSpanElement
        min_btn: HTMLButtonElement
        pin_btn: HTMLButtonElement
        close_btn: HTMLButtonElement
        chevron_svg: SVGElement
        body_el: HTMLDivElement
    } {
        const { id, title, content } = config
        const c = create_element

        const title_el = c('span', { classes: this.selectors.classes.title, text: title })
        const min_btn = c('button', { classes: this.selectors.classes.min_btn, html: ModalManager.CHEVRON_SVG })
        const chevron_svg = min_btn.querySelector('svg') as SVGElement
        if (chevron_svg) chevron_svg.style.transform = 'rotate(0deg)'

        const pin_btn = c('button', { classes: this.selectors.classes.pin_btn, html: ModalManager.PIN_SVG })
        const close_btn = c('button', { classes: this.selectors.classes.close_btn, html: ModalManager.CLOSE_SVG })

        const actions_wrapper = c('div', { classes: this.selectors.classes.action_wrapper }, [
            min_btn,
            pin_btn,
            close_btn,
        ])

        const header_el = c('div', { classes: this.selectors.classes.header }, [
            title_el,
            actions_wrapper,
        ])

        const body_el = c('div', { classes: this.selectors.classes.body })

        if (typeof content === 'string') {
            body_el.innerHTML = content
        } else {
            body_el.append(content)
        }

        const modal_el = c('div', {
            id: this.selectors.ids.modal(id),
            classes: this.selectors.classes.modal,
            styles: {
                width: options.width,
                height: options.height,
                left: options.left,
                top: options.top,
            },
        }, [
            header_el,
            body_el,
        ])

        return {
            modal_el,
            header_el,
            title_el,
            min_btn,
            pin_btn,
            close_btn,
            chevron_svg,
            body_el,
        }
    }

    public fire(config: ModalConfig): { instance: ModalInstance, is_existing: boolean } {
        const { id, parent_el } = config
        const existing = this.modals.get(id)

        if (existing) {
            if (existing.parent !== parent_el && !existing.is_pinned) {
                this.close(id)
            } else {
                this.focus(id, 'menu_fire')
                return { instance: existing, is_existing: true }
            }
        }

        if (!this.modal_stack.includes(id)) {
            this.modal_stack.push(id)
        }

        if (!parent_el.dataset.customModalParentId) {
            parent_el.dataset.customModalParentId = `parent-uid-${Math.random().toString(36).substring(2, 11)}`
            parent_el.dataset.customModalParentZ = this.get_parent_z_index(parent_el).toString()
        }

        const starting_parent_id = parent_el.dataset.customModalParentId
        const starting_parent_z_index = parent_el.dataset.customModalParentZ
            ? parseInt(parent_el.dataset.customModalParentZ, 10)
            : this.default_parent_base_z_index

        const modal_width = config.options?.width ?? ModalManager.DEFAULT_CONFIG.options.width
        const modal_height = config.options?.height ?? ModalManager.DEFAULT_CONFIG.options.height
        const modal_left = config.options?.left ?? ModalManager.DEFAULT_CONFIG.options.left
        const modal_top = config.options?.top ?? ModalManager.DEFAULT_CONFIG.options.top

        const {
            modal_el,
            header_el,
            title_el,
            min_btn,
            pin_btn,
            close_btn,
            chevron_svg,
            body_el,
        } = this.build_modal(config, {
            width: modal_width,
            height: modal_height,
            left: modal_left,
            top: modal_top,
        })

        modal_el.style.zIndex = (starting_parent_z_index + 1).toString()

        this.setup_dragging(header_el, modal_el)

        modal_el.addEventListener('mousedown', () => this.focus(id))

        min_btn.addEventListener('click', (e) => {
            e.stopPropagation()
            this.toggle_minimize(id)
        })

        pin_btn.addEventListener('click', (e) => {
            e.stopPropagation()
            this.toggle_pin(id)
        })

        close_btn.addEventListener('click', (e) => {
            e.stopPropagation()
            this.close(id)
        })

        if (parent_el.style.position !== 'relative' && parent_el.style.position !== 'absolute') {
            parent_el.style.position = 'relative'
        }

        parent_el.append(modal_el)

        const instance = new ModalInstance({
            id: id,
            el: modal_el,
            header: header_el,
            title_el: title_el,
            min_btn: min_btn,
            pin_btn: pin_btn,
            close_btn: close_btn,
            chevron_svg: chevron_svg,
            body: body_el,
            parent: parent_el,
            starting_parent_id: starting_parent_id,
            original_width: modal_width,
            original_height: modal_height,
        })

        this.modals.set(id, instance)
        this.focus(id)

        return { instance, is_existing: false }
    }

    public toggle_minimize(id: string): void {
        const target = this.modals.get(id)
        if (!target) return

        if (!target.is_minimized) {
            target.el.classList.add('is-minimized')
            target.el.style.width = target.minimized_width
            target.el.style.height = 'auto'
            target.is_minimized = true
            if (target.chevron_svg) target.chevron_svg.style.transform = 'rotate(-90deg)'
        } else {
            target.el.classList.remove('is-minimized')
            target.el.style.width = target.original_width
            target.el.style.height = target.original_height
            target.is_minimized = false
            if (target.chevron_svg) target.chevron_svg.style.transform = 'rotate(0deg)'
        }
    }

    public toggle_pin(id: string): void {
        const target = this.modals.get(id)
        if (!target) return

        target.el.classList.remove('animate-open')

        if (!target.is_pinned) {
            // --- PINNING TO BODY ---
            target.is_pinned = true
            target.el.classList.add('is-pinned')
            target.parent = document.body

            document.body.append(target.el)

            this.focus(id)
        } else {
            // --- UNPINNING BACK TO ORIGINAL CONTAINER ---
            const recovered_parent = document.querySelector<HTMLElement>(
                `[data-custom-modal-parent-id="${target.starting_parent_id}"]`
            )

            if (recovered_parent) {
                target.is_pinned = false
                target.el.classList.remove('is-pinned')
                target.parent = recovered_parent

                recovered_parent.append(target.el)

                this.focus(id)
            } else {
                this.close(id)
            }
        }
    }

    public focus(id: string, trigger_type: 'click' | 'action' | 'menu_fire' = 'click'): void {
        const target = this.modals.get(id)
        if (!target) return

        const was_already_focused = target.el.classList.contains('is-focused')

        this.modal_stack = this.modal_stack.filter(stack_id => stack_id !== id)
        this.modal_stack.push(id)

        this.modals.forEach((item) => {
            if (item.el !== target.el) {
                item.el.classList.remove('animate-open', 'animate-pop', 'is-focused')
                item.el.style.borderColor = '#b5b5b5'
                if (item.header) item.header.style.background = '#f1f1f1'
            }

            let base_z = this.default_base_z_index
            const original_parent = document.querySelector<HTMLElement>(`[data-custom-modal-parent-id="${item.starting_parent_id}"]`)
            if (original_parent) {
                base_z = this.get_parent_z_index(original_parent)
            }

            const stack_position = this.modal_stack.indexOf(item.id)
            item.el.style.zIndex = (base_z + stack_position + 2).toString()
        })

        target.el.classList.add('is-focused')
        target.el.style.borderColor = '#157fcc'
        if (target.header) target.header.style.background = '#e1effb'

        if (trigger_type === 'menu_fire') {
            this.trigger_pop_animation(target.el)
        } else if (trigger_type === 'action' && was_already_focused) {
            this.trigger_pop_animation(target.el)
        }
    }

    private trigger_pop_animation(el: HTMLElement): void {
        el.classList.remove('animate-open', 'animate-pop')
        void el.offsetWidth // force reflow
        el.classList.add('animate-pop')
    }

    public close(id: string): void {
        const target = this.modals.get(id)
        if (!target) return

        this.modal_stack = this.modal_stack.filter(stack_id => stack_id !== id)
        this.modals.delete(id)

        target.el.classList.remove('animate-open', 'animate-pop')
        target.el.classList.add('animate-close')

        target.el.addEventListener('animationend', () => {
            target.el.remove()
        }, { once: true })
    }

    public close_all(): void {
        this.modals.forEach((item) => {
            item.el.remove()
        })
        this.modals.clear()
        this.modal_stack = []
    }

    private setup_dragging(handle: HTMLElement, target: HTMLElement): void {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0

        const on_mouse_move = (e: MouseEvent) => {
            e.preventDefault()
            pos1 = pos3 - e.clientX
            pos2 = pos4 - e.clientY
            pos3 = e.clientX
            pos4 = e.clientY

            target.style.top = `${target.offsetTop - pos2}px`
            target.style.left = `${target.offsetLeft - pos1}px`
        }

        const on_mouse_up = () => {
            document.removeEventListener('mousemove', on_mouse_move)
            document.removeEventListener('mouseup', on_mouse_up)
        }

        handle.addEventListener('mousedown', (e: MouseEvent) => {
            const clicked_el = e.target as HTMLElement
            if (clicked_el.closest('.sn-modal-action-btn')) {
                return
            }

            e.preventDefault()
            pos3 = e.clientX
            pos4 = e.clientY

            document.addEventListener('mousemove', on_mouse_move)
            document.addEventListener('mouseup', on_mouse_up)
        })
    }
}

export const ModalUI = ModalManager.get_instance()
