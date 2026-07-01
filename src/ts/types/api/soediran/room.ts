import { RawDictJenisKunjungan, RawDictJenisPenjamin, RawDictKelas } from './dictionary'

interface RawDataPenjaminRuanganItem {
    ID?: string //"12",
    PENJAMIN?: string //"2",
    RUANGAN_PENJAMIN?: string //"IGD",
    RUANGAN_RS?: string //"101020201",
    STATUS?: string //"1",
    REFERENSI?: {
        PENJAMIN?: RawDictJenisPenjamin
        RUANGAN_RS?: RawDataRuangan
    }
}

export interface RawDataRuangan {
    ID?: string //"101040102",
    JENIS?: string //"5",
    JENIS_KUNJUNGAN?: string //"11",
    REF_ID?: string //"0",
    DESKRIPSI?: string //"Depo Gawat Darurat",
    TANGGAL?: string //"2023-07-03 08:58:17",
    AKSES_PERMINTAAN?: string //"1",
    OLEH?: string | null
    CONFIG?: string | null
    STATUS?: string //"1",
    REFERENSI?: {
        JENIS_KUNJUNGAN?: RawDictJenisKunjungan
        PENJAMIN_RUANGAN?: Array<RawDataPenjaminRuanganItem>
    }
}

export interface RawDataRuangKamar {
    ID?: string //"524",
    RUANGAN?: string //"101030103",
    KAMAR?: string //"K2-15",
    KELAS?: string //"2",
    TANGGAL?: string //"2025-12-18 01:49:54",
    STATUS?: string //"1",
    REFERENSI?: {
        RUANGAN?: RawDataRuangan
        KELAS?: RawDictKelas
    }
}

export interface RawDataRuangKamarTidur {
    ID?: string //"980",
    RUANG_KAMAR?: string //"524",
    TEMPAT_TIDUR?: string //"K2-15C",
    STATUS?: string //"3",
    TANGGAL?: string //"2026-06-29 17:39:26",
    LAST_UPDATE?: string //"2026-06-29 17:39:26",
    REFERENSI?: {
        RUANG_KAMAR?: RawDataRuangKamar
    }
}
