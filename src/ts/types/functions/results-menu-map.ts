import { CentralizedParamId } from '../api/soediran/lab-map'
import { PanelsConfig } from './results-menu'

export const PANELS_CONFIG: PanelsConfig = {
    // ---------- HEMATOLOGY ----------
    DEFAULT_PANEL_BLD: {
        panel_name: 'Darah Rutin',
        parameter_ids: [
            'BLD_HEMOGLOBIN', 'BLD_ERITROSIT', 'BLD_HEMATOKRIT', 'BLD_LEUKOSIT', 'BLD_TROMBOSIT',
            'BLD_MCV', 'BLD_MCH', 'BLD_MCHC', 'BLD_RDW_CV', 'BLD_MPV',
            'BLD_LED_BBS_I', 'BLD_LED_BBS_II',
            'BLD_CT', 'BLD_BT',
            'BLD_BLOOD_TYPE_ABO',
        ]
    },
    DEFAULT_PANEL_HJL: {
        panel_name: 'Hitung Jenis Leukosit',
        parameter_ids: [
            'HJL_EOSINOFIL', 'HJL_BASOFIL', 'HJL_NEUTROFIL', 'HJL_LIMFOSIT', 'HJL_MONOSIT',
        ]
    },
    // ---------- CLINICAL_CHEMISTRY ----------
    DEFAULT_PANEL_LPD: {
        panel_name: 'Profil Lipid',
        parameter_ids: [
            'LPD_TC', 'LPD_TG', 'LPD_HDL', 'LPD_LDL',
        ],
    },
    DEFAULT_PANEL_GLC: {
        panel_name: 'Glukosa',
        parameter_ids: [
            'GLC_GDS', 'GLC_GDS_POCT',
            'GLC_GDP', 'GLC_GD2PP',
            'GLC_HBA1C',
        ],
    },
    DEFAULT_PANEL_LIV: {
        panel_name: 'Fungsi Hati',
        parameter_ids: [
            'LIV_SGOT', 'LIV_SGPT',
            'LIV_BILIRUBIN_TOTAL', 'LIV_BILIRUBIN_DIREK',
            'LIV_PROTEIN_TOTAL', 'LIV_ALBUMIN',
        ],
    },
    DEFAULT_PANEL_KDN: {
        panel_name: 'Fungsi Ginjal',
        parameter_ids: [
            'KDN_UREUM', 'KDN_KREATININ',
            'KDN_ASAM_URAT',
        ],
    },
    DEFAULT_PANEL_HRT: {
        panel_name: 'Biomarker Jantung',
        parameter_ids: [
            'HRT_HS_TROPONIN_I',
        ],
    },
    DEFAULT_PANEL_ELC: {
        panel_name: 'Elektrolit',
        parameter_ids: [
            'ELC_NATRIUM', 'ELC_KALIUM', 'ELC_KLORIDA', 'ELC_ION_KALSIUM',
        ],
    },
    DEFAULT_PANEL_ABG: {
        panel_name: 'Analisa Gas Darah',
        parameter_ids: [
            'ABG_PH', 'ABG_PCO2', 'ABG_PO2', 'ABG_HCO3', 'ABG_CTCO2', 'ABG_BE', 'ABG_SO2',
        ],
    },
    DEFAULT_PANEL_ANM: {
        panel_name: 'Anemia',
        parameter_ids: [
            'ANM_RETIKULOSIT',
            'ANM_SI', 'ANM_FERRITIN', 'ANM_TIBC',
        ],
    },
    // ---------- IMMUNOSEROLOGY_AND_HORMONES ----------
    DEFAULT_PANEL_IMN: {
        panel_name: 'Imunoserologi',
        parameter_ids: [
            // hepar
            'IMN_HBSAG', 'IMN_ANTI_HCV',
            // gastro
            'IMN_TUBEX_TF', 'IMN_IGM_SALMONELLA',
            // respi
            'IMN_ANTIGEN_SARSCOV2',
            // sti
            'IMN_ANTI_HIV',
            // torch
            // ...
            // tumor
            // ...
            // autoimun
            'IMN_ASTO',
            'IMN_RF',
        ],
    },
    DEFAULT_PANEL_HRM: {
        panel_name: 'Hormon',
        parameter_ids: [
            'HRM_FT4', 'HRM_TSHS',
        ],
    },
    // ---------- BODY_FLUIDS_AND_FECES ----------
    DEFAULT_PANEL_URN: {
        panel_name: 'Urin Rutin',
        parameter_ids: [
            'URN_MAC_WARNA', 'URN_MAC_KEJERNIHAN', 'URN_MAC_BERAT_JENIS', 'URN_MAC_PH',
            'URN_MAC_LEUKOSIT', 'URN_MAC_NITRIT', 'URN_MAC_PROTEIN', 'URN_MAC_GLUKOSA',
            'URN_MAC_KETON', 'URN_MAC_UROBILINOGEN', 'URN_MAC_BILIRUBIN', 'URN_MAC_DARAH',
            'URN_MIC_ERITROSIT', 'URN_MIC_LEUKOSIT', 'URN_MIC_EPITHEL', 'URN_MIC_BAKTERI',
            'URN_MIC_SILINDER_GRANULA',
            'URN_MIC_KRISTAL_URAT_AMORF', 'URN_MIC_KRISTAL_FOSFAT_AMORF',
        ],
    },
    DEFAULT_PANEL_FCL: {
        panel_name: 'Feses Rutin',
        parameter_ids: [
            'FCL_MAC_WARNA', 'FCL_MAC_KONSISTENSI', 'FCL_MAC_LENDIR', 'FCL_MAC_DARAH',
            'FCL_MIC_ERITROSIT', 'FCL_MIC_LEUKOSIT',
        ],
    },
    // cairan: {
    //     panel_name: 'Cairan',
    //     parameter_ids: [
    //         // 'sperma...'
    //     ],
    // },
    // ---------- MICROBIOLOGY ----------
    // ---------- ANATOMIC_PATHOLOGY ----------
    // ---------- TOXICOLOGY ----------
}

export const LAB_PARAM_MAP: Record<CentralizedParamId, { full: string, short: string }> = {
    'BLD_HEMOGLOBIN': { full: 'Hemoglobin', short: 'Hb' },
    'BLD_ERITROSIT': { full: 'Eritrosit', short: 'AE' },
    'BLD_HEMATOKRIT': { full: 'Hematokrit', short: 'Hmt' },
    'BLD_LEUKOSIT': { full: 'Leukosit', short: 'AL' },
    'BLD_TROMBOSIT': { full: 'Trombosit', short: 'AT' },

    'BLD_MCV': { full: 'MCV', short: 'MCV' },
    'BLD_MCH': { full: 'MCH', short: 'MCH' },
    'BLD_MCHC': { full: 'MCHC', short: 'MCHC' },
    'BLD_RDW_CV': { full: 'RDW-CV', short: 'RDW-CV' },
    'BLD_MPV': { full: 'MPV', short: 'MPV' },

    'BLD_LED_BBS_I': { full: 'LED/BBS I', short: 'LED I' },
    'BLD_LED_BBS_II': { full: 'LED/BBS II', short: 'LED II' },

    'BLD_CT': { full: 'Waktu Pembekuan (CT)', short: 'CT' },
    'BLD_BT': { full: 'Waktu Perdarahan (BT)', short: 'BT' },

    'BLD_BLOOD_TYPE_ABO': { full: 'Golongan Darah ABO', short: 'Goldar' },

    'HJL_EOSINOFIL': { full: 'Eosinofil%', short: 'Eos%' },
    'HJL_BASOFIL': { full: 'Basofil%', short: 'Bas%' },
    'HJL_NEUTROFIL': { full: 'Neutrofil%', short: 'Neu%' },
    'HJL_LIMFOSIT': { full: 'Limfosit%', short: 'Lim%' },
    'HJL_MONOSIT': { full: 'Monosit%', short: 'Mon%' },

    'LPD_TC': { full: 'Kolesterol Total', short: 'TC' },
    'LPD_TG': { full: 'Trigliserida', short: 'TG' },
    'LPD_HDL': { full: 'HDL', short: 'HDL' },
    'LPD_LDL': { full: 'LDL', short: 'LDL' },

    'GLC_GDS': { full: 'Gula Darah Sewaktu', short: 'GDS' },
    'GLC_GDS_POCT': { full: 'Gula Darah Sewaktu (POCT)', short: 'GDS' },
    'GLC_GDP': { full: 'Gula Darah Puasa', short: 'GDP' },
    'GLC_GD2PP': { full: 'Gula Darah 2 Jam PP', short: 'GD2PP' },
    'GLC_HBA1C': { full: 'HbA1c', short: 'HbA1c' },

    'LIV_SGOT': { full: 'SGOT', short: 'SGOT' },
    'LIV_SGPT': { full: 'SGPT', short: 'SGPT' },
    'LIV_BILIRUBIN_TOTAL': { full: 'Bilirubin Total', short: 'TBIL' },
    'LIV_BILIRUBIN_DIREK': { full: 'Bilirubin Direk', short: 'DBIL' },
    'LIV_PROTEIN_TOTAL': { full: 'Protein Total', short: 'TP' },
    'LIV_ALBUMIN': { full: 'Albumin', short: 'Alb' },

    'KDN_UREUM': { full: 'Ureum', short: 'Ur' },
    'KDN_KREATININ': { full: 'Kreatinin', short: 'Cr' },
    'KDN_ASAM_URAT': { full: 'Asam Urat', short: 'UA' },

    'HRT_HS_TROPONIN_I': { full: 'hs-Troponin I', short: 'TnI' },

    'ELC_NATRIUM': { full: 'Natrium', short: 'Na' },
    'ELC_KALIUM': { full: 'Kalium', short: 'K' },
    'ELC_KLORIDA': { full: 'Klorida', short: 'Cl' },
    'ELC_ION_KALSIUM': { full: 'Ion Kalsium', short: 'Ca' },

    'ABG_PH': { full: 'pH', short: 'pH' },
    'ABG_PCO2': { full: 'PCO2', short: 'PCO2' },
    'ABG_PO2': { full: 'PO2', short: 'PO2' },
    'ABG_HCO3': { full: 'HCO3', short: 'HCO3' },
    'ABG_CTCO2': { full: 'ctCO2', short: 'ctCO2' },
    'ABG_BE': { full: 'BE', short: 'BE' },
    'ABG_SO2': { full: 'sO2', short: 'sO2' },

    'ANM_RETIKULOSIT': { full: 'Retikulosit', short: 'Reti' },
    'ANM_SI': { full: 'Serum Iron', short: 'SI' },
    'ANM_FERRITIN': { full: 'Ferritin', short: 'Ferritin' },
    'ANM_TIBC': { full: 'TIBC', short: 'TIBC' },

    'IMN_HBSAG': { full: 'HBsAg', short: 'HBsAg' },
    'IMN_ANTI_HCV': { full: 'Anti HCV', short: 'HCV' },
    'IMN_TUBEX_TF': { full: 'TUBEX (1)', short: 'TUBEX (1)' },
    'IMN_IGM_SALMONELLA': { full: 'TUBEX (2)', short: 'TUBEX (2)' },
    'IMN_ANTIGEN_SARSCOV2': { full: 'Antigen SARS-CoV-2', short: 'Antigen SARS-CoV-2' },
    'IMN_ANTI_HIV': { full: 'Anti HIV', short: 'HIV' },
    'IMN_ASTO': { full: 'ASTO', short: 'ASTO' },
    'IMN_RF': { full: 'RF', short: 'RF' },

    'HRM_FT4': { full: 'FT4', short: 'FT4' },
    'HRM_TSHS': { full: 'TSHs', short: 'TSH' },

    'URN_MAC_WARNA': { full: 'Warna', short: 'Warna' },
    'URN_MAC_KEJERNIHAN': { full: 'Kejernihan', short: 'Kejernihan' },
    'URN_MAC_BERAT_JENIS': { full: 'Berat Jenis', short: 'Berat Jenis' },
    'URN_MAC_PH': { full: 'pH', short: 'pH' },
    'URN_MAC_LEUKOSIT': { full: 'Leukosit', short: 'Leukosit' },
    'URN_MAC_NITRIT': { full: 'Nitrit', short: 'Nitrit' },
    'URN_MAC_PROTEIN': { full: 'Protein', short: 'Protein' },
    'URN_MAC_GLUKOSA': { full: 'Glukosa', short: 'Glukosa' },
    'URN_MAC_KETON': { full: 'Keton', short: 'Keton' },
    'URN_MAC_UROBILINOGEN': { full: 'Urobilinogen', short: 'Urobilinogen' },
    'URN_MAC_BILIRUBIN': { full: 'Bilirubin', short: 'Bilirubin' },
    'URN_MAC_DARAH': { full: 'Darah', short: 'Darah' },
    'URN_MIC_ERITROSIT': { full: '(Mikro) Eritrosit', short: '(Mi) Eritrosit' },
    'URN_MIC_LEUKOSIT': { full: '(Mikro) Leukosit', short: '(Mi) Leukosit' },
    'URN_MIC_EPITHEL': { full: '(Mikro) Epithel', short: '(Mi) Epithel' },
    'URN_MIC_BAKTERI': { full: '(Mikro) Bakteri', short: '(Mi) Bakteri' },
    'URN_MIC_SILINDER_GRANULA': { full: '(Mikro) Silinder Granula', short: '(Mi) Silinder Granula' },
    'URN_MIC_KRISTAL_URAT_AMORF': { full: '(Mikro) Kristal Urat Amorf', short: '(Mi) Kristal Urat Amorf' },
    'URN_MIC_KRISTAL_FOSFAT_AMORF': { full: '(Mikro) Kristal Fosfat Amorf', short: '(Mi) Kristal Fosfat Amorf' },

    'FCL_MAC_WARNA': { full: 'Warna', short: 'Warna' },
    'FCL_MAC_KONSISTENSI': { full: 'Konsistensi', short: 'Konsistensi' },
    'FCL_MAC_LENDIR': { full: 'Lendir', short: 'Lendir' },
    'FCL_MAC_DARAH': { full: 'Darah', short: 'Darah' },
    'FCL_MIC_ERITROSIT': { full: '(Mikro) Eritrosit', short: '(Mi) Eritrosit' },
    'FCL_MIC_LEUKOSIT': { full: '(Mikro) Leukosit', short: '(Mi) Leukosit' },
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
    'Positif 6/10': { full: '+6', short: '+6' },
}
