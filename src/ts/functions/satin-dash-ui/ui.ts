import { SatinEngine } from '../../engine/base'
import { SatinDashUIVisit } from '../../types/functions/satin-dash-ui'
import { create_element } from '../../utils/dom'
import { RecipesTabController } from './ui/recipes'

const c = create_element

const create_svg_icon = (path_d: string, view_box = '0 0 24 24', stroke_width = '2') => {
    return c('svg', {
        classes: 'icon',
        attrs: { fill: 'none', stroke: 'currentColor', viewBox: view_box }
    }, [
        c('path', {
            attrs: {
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round',
                'stroke-width': stroke_width,
                d: path_d
            }
        })
    ])
}

export const get_age_metrics = (dob: string) => {
    if (!dob) return null
    try {
        const birthDate = new Date(dob)
        const today = new Date()
        if (isNaN(birthDate.getTime())) return null

        let years = today.getFullYear() - birthDate.getFullYear()
        let months = today.getMonth() - birthDate.getMonth()
        let days = today.getDate() - birthDate.getDate()

        if (days < 0) {
            const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0)
            days += prevMonth.getDate()
            months--
        }
        if (months < 0) {
            months += 12
            years--
        }

        return { y: Math.max(0, years), m: Math.max(0, months), d: Math.max(0, days) }
    } catch (e) {
        return null
    }
}

export const get_los_metrics = (adm_date?: string | null, dis_date?: string | null) => {
    if (!adm_date) return null
    try {
        const start = new Date(adm_date)
        const is_discharged = !!dis_date
        const end = is_discharged ? new Date(dis_date) : new Date()

        if (isNaN(start.getTime()) || isNaN(end.getTime())) return null

        const total_milliseconds = end.getTime() - start.getTime()
        if (total_milliseconds < 0) return { d: 0, h: 0, total_hours: 0, is_discharged }

        const total_hours = Math.floor(total_milliseconds / (1000 * 60 * 60))
        const days = Math.floor(total_hours / 24)
        const hours = total_hours % 24

        return { d: days, h: hours, total_hours, is_discharged }
    } catch (e) {
        return null
    }
}

export const format_date_variants = (date_input: Date | string) => {
    if (!date_input) {
        return { short: '--', long: '--', time: '--', longtime: '--' }
    }
    const date = date_input instanceof Date ? date_input : new Date(date_input)
    if (isNaN(date.getTime())) {
        return { short: '--', long: '--', time: '--', longtime: '--' }
    }
    const long = date.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })
    const short = long.replace(/\s\d{4}$/, '')
    const time = date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    })
    const longtime = (long && time) ? `${long} ${time}` : '--'
    return { short, long, time, longtime }
}

const get_patient_initials = (name: string): string => {
    if (!name) return '??'
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    if (parts.length === 1 && parts[0].length >= 2) {
        return parts[0].substring(0, 2).toUpperCase()
    }
    return parts[0] ? parts[0][0].toUpperCase() : '??'
}

/**
 * Calculates appropriate honorific prefix based on age, marital status, and gender.
 */
const get_patient_prefix = (
    age_obj: { y: number; m: number; d: number } | null,
    gender_id: string,
    marriage_status: string
): string => {
    const is_female = gender_id === '2'

    // Age < 1 year
    if (age_obj && age_obj.y === 0) {
        return 'By.'
    }

    // Age 1 - 17 years
    if (age_obj && age_obj.y < 18) {
        return 'An.'
    }

    // Age >= 18 years
    const status_clean = (marriage_status || '').trim().toLowerCase()
    const is_unmarried = status_clean === 'belum kawin'

    if (is_unmarried) {
        return is_female ? 'Nn.' : 'Sdr.'
    }

    // Married, widowed, or default fallback
    return is_female ? 'Ny.' : 'Tn.'
}

export const build_patient_card = (engine: SatinEngine, visit: SatinDashUIVisit) => {
    // Age calculations
    let age = '??y'
    const age_obj = get_age_metrics(visit.patient.demographic.birthdate)
    if (age_obj) {
        if (age_obj.y < 18) {
            age = `${age_obj.y}th, ${age_obj.m}bl, ${age_obj.d}hr`
        } else {
            age = `${age_obj.y}th`
        }
    }

    // Patient Prefix logic
    const prefix = get_patient_prefix(
        age_obj,
        visit.patient.demographic.gender_id,
        visit.patient.demographic.marriage_status
    )
    const formatted_patient_name = `${prefix} ${visit.patient.name}`

    // Length Of Stay (LOS) metrics & Fresh status calculation
    let los_text = 'LOS: --'
    let is_fresh = false
    const los_obj = get_los_metrics(visit.admission_date, visit.discharge_date)
    if (los_obj) {
        los_text = `${los_obj.d}h ${los_obj.h}j`
        if (los_obj.total_hours < 24 && !los_obj.is_discharged) {
            is_fresh = true
        }
    }

    const is_female = visit.patient.demographic.gender_id === '2'
    const genderClass = is_female ? 'gender-female' : 'gender-male'
    const initials = get_patient_initials(visit.patient.name)

    // 1. Patient Key Details Sidebar
    const room_name = visit.room.name.replace('Bangsal ', '')
    const patient_details_sidebar = c('div', {
        classes: `patient-card__details ${is_fresh ? 'is-fresh' : ''}`
    }, [
        c('div', {}, [
            c('div', { classes: 'patient-card__header-row' }, [
                c('span', { classes: 'badge-bed', text: `${room_name}/${visit.room.bed_name}` }),
                c('div', { classes: 'header-tags' }, [
                    c('span', { classes: 'los-tag', text: los_text })
                ])
            ]),
            c('div', { classes: 'patient-card__identity' }, [
                c('div', { classes: `patient-avatar ${genderClass}`, text: initials }),
                c('div', { classes: 'patient-meta' }, [
                    c('h3', { classes: 'patient-card__name', text: formatted_patient_name }),
                    c('div', { classes: `patient-card__demographics ${genderClass}` }, [
                        c('span', { text: `${age} • ${visit.patient.demographic.religion || '??'}` })
                    ]),
                    c('div', { classes: 'patient-card__mrn', text: `${visit.patient.mrn || '??'}` })
                ])
            ])
        ]),
        c('div', { classes: 'patient-card__insurance', text: `${visit.patient.insurance.type || '??'} (Kls. ${visit.patient.insurance.class || '??'})` })
    ])

    // State for Tab Management
    let active_tab = 'overview'

    const update_tab_visibility = (targetTab: string, tab_buttons: Record<string, HTMLElement>, tab_panes: Record<string, HTMLElement>) => {
        Object.keys(tab_panes).forEach((key) => {
            if (key === targetTab) {
                tab_panes[key].classList.remove('hidden')
                if (tab_buttons[key]) tab_buttons[key].classList.add('active')

                // Trigger fetch only when active
                if (key === 'recipes') {
                    recipeController.activate()
                }
            } else {
                tab_panes[key].classList.add('hidden')
                if (tab_buttons[key]) tab_buttons[key].classList.remove('active')
            }
        })
    }

    // 2. Vertical Navigation Bar
    const tab_buttons: Record<string, HTMLElement> = {}
    const tab_badges: Record<string, HTMLElement> = {}

    const create_tab_btn = (key: string, label: string, initialBadge?: string, badgeClass?: string) => {
        const children: Element[] = [c('span', { text: label })]

        if (initialBadge !== undefined) {
            const badge_el = c('span', { classes: `tab-badge ${badgeClass ?? ''}`, text: initialBadge })
            tab_badges[key] = badge_el
            children.push(badge_el)
        } else {
            children.push(create_svg_icon('M9 5l7 7-7 7', '0 0 24 24', '2'))
        }

        const btn = c('button', {
            classes: `tab-btn ${key === active_tab ? 'active' : ''}`
        }, children)

        btn.addEventListener('click', () => {
            active_tab = key
            update_tab_visibility(active_tab, tab_buttons, tab_panes)
        })

        tab_buttons[key] = btn
        return btn
    }

    // Initialize Recipe Controller with a callback to update tab badge count dynamically
    const recipeController = new RecipesTabController(visit.id, engine.api, (count: number) => {
        if (tab_badges['recipes']) {
            tab_badges['recipes'].innerText = `${count}`
        }
    })

    const navigation_sidebar = c('div', { classes: 'patient-card__nav' }, [
        create_tab_btn('overview', 'Ringkasan'),
        create_tab_btn('details', 'Detail Pasien'),
        create_tab_btn('recipes', 'Resep', '*', 'badge-emerald'),
    ])

    // 3. Tab Display Pane (Content)
    const tab_panes: Record<string, HTMLElement> = {
        overview: c('div', { classes: 'tab-pane' }, [
            c('div', { classes: 'mb-2' }, [
                c('span', { classes: 'pane-label', text: 'Diagnosis Utama' }),
                c('p', { classes: 'diagnosis-title', text: visit.diagnosis.main_dx || '??' })
            ]),
            c('div', {}, [
                c('div', {}, [c('strong', { text: 'DPJP: ' }), c('span', { text: visit.dpjp.name })]),
                c('div', {}, [c('strong', { text: 'Masuk: ' }), c('span', { text: format_date_variants(visit.admission_date ?? '').longtime })]),
                c('div', {}, [c('strong', { text: 'Keluar: ' }), c('span', { text: format_date_variants(visit.discharge_date ?? '').longtime })]),
            ]),
        ]),

        details: c('div', { classes: 'tab-pane hidden' }, [
            c('div', { classes: 'details-sections' }, [
                c('div', { classes: 'details-block' }, [
                    c('h4', { text: 'Demografi' }),
                    c('div', {}, [
                        c('div', {}, [c('span', { text: 'TTL: ' }), c('strong', { classes: 'capitalize', text: `${visit.patient.demographic.birthplace.toLowerCase() || '??'}, ${format_date_variants(visit.patient.demographic.birthdate).long.split(', ')[1] || '??'}` })]),
                        c('div', {}, [c('span', { text: 'Alamat: ' }), c('strong', { classes: 'capitalize', text: visit.patient.demographic.address.toLowerCase() || '??' })]),
                        c('div', {}, [c('span', { text: 'Pekerjaan: ' }), c('strong', { classes: 'capitalize', text: visit.patient.demographic.occupation.toLowerCase() || '??' })]),
                        c('div', {}, [c('span', { text: 'Pendidikan: ' }), c('strong', { classes: 'capitalize', text: visit.patient.demographic.education.toLowerCase() || '??' })]),
                        c('div', {}, [c('span', { text: 'Status Perkawinan: ' }), c('strong', { classes: 'capitalize', text: visit.patient.demographic.marriage_status.toLowerCase() || '??' })]),
                        c('div', {}, [c('span', { text: 'Golongan Darah: ' }), c('strong', { text: visit.patient.demographic.blood_type || '??' })]),
                        c('div', {}, [c('span', { text: 'Kontak: ' }), c('strong', { text: visit.patient.demographic.contact_num || '??' })]),
                    ])
                ]),
                c('div', { classes: 'details-block' }, [
                    c('h4', { text: 'Penjamin' }),
                    c('div', {}, [
                        c('div', {}, [c('span', { text: 'No. Peserta: ' }), c('strong', { text: visit.patient.insurance.membership.id || '??' })]),
                        c('div', {}, [c('span', { text: 'SEP: ' }), c('strong', { text: visit.patient.insurance.sep_id || '??' })]),
                        c('div', {}, [c('span', { text: 'Kelas: ' }), c('strong', { text: visit.patient.insurance.class || '??' })]),
                        c('div', {}, [c('span', { text: 'Jenis: ' }), c('strong', { text: visit.patient.insurance.membership.type || '??' })]),
                        c('div', {}, [c('span', { text: 'Provider: ' }), c('strong', { text: visit.patient.insurance.membership.provider_name || '??' })]),
                        c('div', {}, [c('span', { text: 'Status PRB: ' }), c('strong', { text: visit.patient.insurance.membership.prb_desc || '??' })]),
                        c('div', {}, [c('span', { text: 'PPK (Alamat): ' }), c('strong', { text: `${visit.patient.insurance.membership.ppk.name || '??'} (${visit.patient.insurance.membership.ppk.address || '??'})` })]),
                        c('div', {}, [c('span', { text: 'Tanggal Cetak Kartu: ' }), c('strong', { text: format_date_variants(visit.patient.insurance.membership.issuance_date).long.split(', ')[1] || '??' })]),
                    ])
                ]),
                c('div', { classes: 'details-block' }, [
                    c('h4', { text: 'Nomor' }),
                    c('div', {}, [
                        c('div', {}, [c('span', { text: 'No. RM: ' }), c('strong', { text: visit.patient.mrn || '??' })]),
                        c('div', {}, [c('span', { text: 'No. Pasien: ' }), c('strong', { text: visit.patient.id || '??' })]),
                        c('div', {}, [c('span', { text: 'No. Kunjungan: ' }), c('strong', { text: visit.id || '??' })]),
                        c('div', {}, [c('span', { text: 'No. Pendaftaran: ' }), c('strong', { text: visit.registration.id || '??' })]),
                    ])
                ])
            ])
        ]),

        recipes: recipeController.pane_el,
    }

    const content_pane = c('div', { classes: 'patient-card__content' }, [
        tab_panes.overview,
        tab_panes.details,
        tab_panes.recipes,
    ])

    // Container Assembly
    return c('div', { classes: 'patient-card' }, [
        patient_details_sidebar,
        navigation_sidebar,
        content_pane
    ])
}
