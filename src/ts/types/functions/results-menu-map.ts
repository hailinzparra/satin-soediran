import { PanelsConfig } from './results-menu'

export const PANELS_CONFIG: PanelsConfig = {
    // ---------- HEMATOLOGY ----------
    darah_rutin: {
        panel_name: 'Darah Rutin',
        parameter_names: [
            'Hemoglobin', 'Eritrosit', 'Hematrokit', 'Leukosit', 'Trombosit',
            'MCV', 'MCH', 'MCHC', 'RDW-CV', 'MPV',
            'LED / BBS I', 'LED / BBS II',
            'Waktu Pembekuan ( CT )', 'Waktu Perdarahan ( BT )',
            'Golongan Darah ABO',
        ]
    },
    hitung_jenis_leukosit: {
        panel_name: 'Hitung Jenis Leukosit',
        parameter_names: [
            'Eosinofil%', 'Basofil%', 'Neutrofil%', 'Limfosit%', 'Monosit%',
        ]
    },
    // ---------- CLINICAL_CHEMISTRY ----------
    profil_lipid: {
        panel_name: 'Profil Lipid',
        parameter_names: [
            'Kolesterol Total', 'Trigliserida', 'HDL', 'LDL',
        ],
    },
    glukosa: {
        panel_name: 'Glukosa',
        parameter_names: [
            'Glukosa Darah Sewaktu', 'Glukosa Darah Sewaktu (POCT)',
            'Glukosa Darah Puasa', 'Glukosa Darah 2 JAM PP',
        ],
    },
    fungsi_hati: {
        panel_name: 'Fungsi Hati',
        parameter_names: [
            'SGOT', 'SGPT',
            'Albumin',
        ],
    },
    fungsi_ginjal: {
        panel_name: 'Fungsi Ginjal',
        parameter_names: [
            'Ureum', 'Kreatinin',
            // 'Asam Urat',
        ],
    },
    // biomarker_jantung: {
    //     panel_name: 'Biomarker Jantung',
    //     parameter_names: [],
    // },
    elektrolit: {
        panel_name: 'Elektrolit',
        parameter_names: [
            'Natrium', 'Kalium', 'Chlorida', 'Ion Calsium',
        ],
    },
    // analisa_gas_darah: {
    //     panel_name: 'Analisa Gas Darah',
    //     parameter_names: [],
    // },
    // anemia: {
    //     panel_name: 'Anemia',
    //     parameter_names: [],
    // },
    // ---------- IMMUNOSEROLOGY_AND_HORMONES ----------
    imunoserologi: {
        panel_name: 'Imunoserologi',
        parameter_names: [
            // hepar
            'HBsAg',
            // gastro
            'TUBEX TF',
            'IgM Salmonella',
            // sti
            'ANTI HIV',
            // torch
            // ...
            // tumor
            // ...
            // autoimun
            'ASTO',
        ],
    },
    hormon: {
        panel_name: 'Hormon',
        parameter_names: [
            'FT4', 'TSHs',
        ],
    },
    // ---------- BODY_FLUIDS_AND_FECES ----------
    // urinalisis: {
    //     panel_name: 'Urinalisis',
    //     parameter_names: [
    //     ],
    // },
    // fekalisis: {
    //     panel_name: 'Fekalisis',
    //     parameter_names: [
    //     ],
    // },
    // cairan: {
    //     panel_name: 'Cairan',
    //     parameter_names: [
    //         // 'sperma...'
    //     ],
    // },
    // ---------- MICROBIOLOGY ----------
    // ---------- ANATOMIC_PATHOLOGY ----------
    // ---------- TOXICOLOGY ----------
}

export const LAB_PARAM_MAP: Record<string, { full: string, short: string }> = {
    // darah_rutin
    'Hemoglobin': { full: 'Hemoglobin', short: 'Hb' },
    'Eritrosit': { full: 'Eritrosit', short: 'AE' },
    'Hematrokit': { full: 'Hematokrit', short: 'Hmt' },
    'Leukosit': { full: 'Leukosit', short: 'AL' },
    'Trombosit': { full: 'Leukosit', short: 'AT' },
    'MCV': { full: 'MCV', short: 'MCV' },
    'MCH': { full: 'MCH', short: 'MCH' },
    'MCHC': { full: 'MCHC', short: 'MCHC' },
    'RDW-CV': { full: 'RDW-CV', short: 'RDW-CV' },
    'MPV': { full: 'MPV', short: 'MPV' },
    'LED / BBS I': { full: 'LED/BBS I', short: 'LED I' },
    'LED / BBS II': { full: 'LED/BBS II', short: 'LED II' },
    'Waktu Pembekuan ( CT )': { full: 'Waktu Pembekuan (CT)', short: 'CT' },
    'Waktu Perdarahan ( BT )': { full: 'Waktu Perdarahan (BT)', short: 'BT' },
    'Golongan Darah ABO': { full: 'Golongan Darah ABO', short: 'Goldar' },
    // hitung_jenis_leukosit
    'Eosinofil%': { full: 'Eosinofil%', short: 'Eos%' },
    'Basofil%': { full: 'Basofil%', short: 'Bas%' },
    'Neutrofil%': { full: 'Neutrofil%', short: 'Neu%' },
    'Limfosit%': { full: 'Limfosit%', short: 'Lim%' },
    'Monosit%': { full: 'Monosit%', short: 'Mon%' },
    // profil_lipid
    'Kolesterol Total': { full: 'Kolesterol Total', short: 'TC' },
    'Trigliserida': { full: 'Trigliserida', short: 'TG' },
    'HDL': { full: 'HDL', short: 'HDL' },
    'LDL': { full: 'LDL', short: 'LDL' },
    // glukosa
    'Glukosa Darah Sewaktu': { full: 'Gula Darah Sewaktu', short: 'GDS' },
    'Glukosa Darah Sewaktu (POCT)': { full: 'Gula Darah Sewaktu (POCT)', short: 'GDS' },
    'Glukosa Darah Puasa': { full: 'Gula Darah Puasa', short: 'GDP' },
    'Glukosa Darah 2 JAM PP': { full: 'Gula Darah 2 Jam PP', short: 'GD2PP' },
    // fungsi_hati
    'SGOT': { full: 'SGOT', short: 'SGOT' },
    'SGPT': { full: 'SGPT', short: 'SGPT' },
    'Albumin': { full: 'Albumin', short: 'Alb' },
    // fungsi_ginjal
    'Ureum': { full: 'Ureum', short: 'Ur' },
    'Kreatinin': { full: 'Kreatinin', short: 'Cr' },
    // 'Asam Urat': { full: 'Asam Urat', short: 'UA' },
    // elektrolit
    'Natrium': { full: 'Natrium', short: 'Na' },
    'Kalium': { full: 'Kalium', short: 'K' },
    'Chlorida': { full: 'Klorida', short: 'Cl' },
    'Ion Calsium': { full: 'Ion Kalsium', short: 'Ca' },
    // imunoserologi: 
    'HBsAg': { full: 'HBsAg', short: 'HBsAg' },
    'TUBEX TF': { full: 'TUBEX (1)', short: 'TUBEX (1)' },
    'IgM Salmonella': { full: 'TUBEX (2)', short: 'TUBEX (2)' },
    'ANTI HIV': { full: 'Anti HIV', short: 'HIV' },
    'ASTO': { full: 'ASTO', short: 'ASTO' },
    // hormon
    'FT4': { full: 'FT4', short: 'FT4' },
    'TSHs': { full: 'TSHs', short: 'TSH' },
}

export const LAB_SYMBOL_MAP: Record<string, { full: string, short: string }> = {
    'Reaktif': { full: 'Reaktif', short: 'R' },
    'Non Reaktif': { full: 'Non Reaktif', short: 'NR' },
    'Negatif': { full: 'Negatif', short: '-' },
    '+/Positif 1': { full: '+1', short: '+1' },
    '++/Positif 2': { full: '+2', short: '+2' },
    '+++/Positif 3': { full: '+3', short: '+3' },
    '++++/Positif 4': { full: '+4', short: '+4' },
    'Positif 4/10': { full: '+4', short: '+4' },
}
