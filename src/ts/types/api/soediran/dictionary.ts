type RawDictStatusMap = {
    '1': 'Pasien Berada di ruangan ini / Sedang dilayani' | 'Hidup / Aktif' | 'Aktif'
    '2': 'Pasien sudah diterima' | 'Selesai'
}

type RawDictAgamaMap = {
    '1': 'Islam'
    '2': 'Kristen (Protestan)'
}

type RawDictProfesiMap = {
    '5': 'Farmasi'
}

type RawDictSMFMap = {
    '15': 'Saraf',
}

type RawDictJenisKelaminMap = {
    '1': 'Laki-Laki'
    '2': 'Perempuan'
}

export interface RawDataDictionary<T extends Record<string, string> = Record<string, string>> {
    TABEL_ID?: string | null //"393",
    JENIS?: string | null //"36",

    ID?: Extract<keyof T, string> | null //"4",
    DESKRIPSI?: T[keyof T] | null //"Farmasi",

    REF_ID?: string | null //"",
    TEKS?: string | null //"",
    CONFIG?: string | null //"{...\protokolpengobatan\": true}", {\"regExp\": \"[^0-9]\...", etc.
    SCORING?: string | null //"0",
    STATUS?: string | null //"1",
    LAST_UPDATE?: string | null //"2023-08-24 13:00:25"
}

export type RawDictStatus = RawDataDictionary<RawDictStatusMap> // "Selesai", etc.
export type RawDictJenisKunjungan = RawDataDictionary // "Farmasi", etc.

export type RawDictAgama = RawDataDictionary<RawDictAgamaMap> // "Islam", etc.
export type RawDictProfesi = RawDataDictionary<RawDictProfesiMap> // "Dokter", etc.

export type RawDictCara = RawDataDictionary // "Diijinkan Pulang", etc.
export type RawDictJenis = RawDataDictionary // "Telepon Seluler", etc.
export type RawDictKeadaan = RawDataDictionary // "Membaik", etc.a

export type RawDictSMF = RawDataDictionary<RawDictSMFMap> & {
    REFERENSI?: {
        PENJAMIN_SUB_SPESIALISTIK?: Array<{
            ID?: string
            PENJAMIN?: string
            SUB_SPESIALIS_PENJAMIN?: string
            SUB_SPESIALIS_RS?: string
            FINGER?: string
            STATUS?: string
        }>
    }
}

export type RawDictKelas = RawDataDictionary // "Non Kelas", etc.
export type RawDictPegawai = RawDataDictionary // "Bukan Pegawai / Lainnya", etc.
export type RawDictKenakanTarif = RawDataDictionary // "Tarif Normal", etc.
export type RawDictJenisPenjamin = RawDataDictionary // "Rencana BPJS", "BPJS - JKN", "Tanpa Asuransi / Umum", etc.

export type RawDictTempatLahir = RawDataDictionary // "WONOGIRI", etc.
export type RawDictJenisKelamin = RawDataDictionary<RawDictJenisKelaminMap> // "Laki-Laki", etc.
export type RawDictPendidikan = RawDataDictionary // "Tamat SD/Sederajat", etc.
export type RawDictPekerjaan = RawDataDictionary // "Buruh Harian Lepas", etc.
export type RawDictStatusPerkawinan = RawDataDictionary // "Kawin", etc.
export type RawDictGolonganDarah = RawDataDictionary
