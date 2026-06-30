interface CreateElementOptions {
    id?: string
    classes?: string
    attrs?: Record<string, string | number | boolean>
    styles?: {
        [K in keyof Omit<
            CSSStyleDeclaration,
            'length' | 'parentRule' | 'getPropertyPriority' | 'getPropertyValue' | 'item' | 'removeProperty' | 'setProperty' | number
        >]?: string | number | null
    }
    text?: string
    html?: string
}

type CreatedElement<T extends string> =
    T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] :
    T extends keyof SVGElementTagNameMap ? SVGElementTagNameMap[T] :
    Element

export const create_element = <T extends (keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap)>(
    tag: T,
    { id = '', classes = '', attrs = {}, styles = {}, text = '', html = '' }: CreateElementOptions = {},
    children: (Node | string | null | undefined | false)[] = []
): CreatedElement<T> => {
    const svg_tags = ['svg', 'path', 'g', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse', 'use', 'defs']
    const is_svg = svg_tags.includes(tag.toLowerCase())

    const element = (is_svg
        ? document.createElementNS('http://www.w3.org/2000/svg', tag)
        : document.createElement(tag)) as CreatedElement<T>

    if (id) {
        element.id = id
    }

    if (classes.length) {
        element.setAttribute('class', classes)
    }

    for (const [key, val] of Object.entries(attrs)) {
        element.setAttribute(key, String(val))
    }

    if (element instanceof HTMLElement || element instanceof SVGElement) {
        for (const [key, val] of Object.entries(styles)) {
            if (val !== null && val !== undefined) {
                (element.style as any)[key] = String(val)
            }
        }
    }

    if (html) {
        element.innerHTML = html
    } else if (text) {
        element.textContent = text
    }

    if (children.length) {
        const valid_children = children.filter((child): child is Node | string => !!child)
        element.append(...valid_children)
    }

    return element
}
