import { RawDictAgama, RawDictJenis, RawDictProfesi, RawDictSMF } from './dictionary'

export interface RawDataWilayah {
    ID?: string //"3312132004",
    JENIS?: string //"4",
    DESKRIPSI?: string //"PONDOK",
    KOTA?: string //"0",
    STATUS?: string //"1",
    REMOTE_CHANGE?: string //"0",
    REFERENSI?: {
        JENIS_WILAYAH?: any
        KECAMATAN?: any
        KABUPATEN?: any
        PROVINSI?: any
    }
}

export interface RawDataKartuIdentitasItem {
    ID?: string //"215",
    JENIS?: string //"1",
    NIP?: string //"199...",
    NORM?: string //"236290",
    NOMOR?: string //"3312125404950002",
    ALAMAT?: string //"Jl. Ahmad yani 147A",
    RT?: string //"",
    RW?: string //"",
    KODEPOS?: string //"57612",
    WILAYAH?: string //"3312121006"
    REFERENSI?: {
        WILAYAH?: RawDataWilayah
    }
}

export interface RawDataKontakItem {
    ID?: string //"158",
    JENIS?: string //"3",
    NIP?: string //"199...",
    NORM?: string //"236290",
    NOMOR?: string //"0853...",
    STATUS?: string //"1",
    REFERENSI?: {
        JENIS?: RawDictJenis
    }
}

export interface RawDataDokter {
    ID?: string //"14",
    NAMA?: string //"dr. Gregory House, M.Kes, Sp.S",
    NIP?: string //"196801112009041001",
    REFERENSI?: {
        KARTU_INDETITAS?: Array<RawDataKartuIdentitasItem>
        KONTAKS?: Array<RawDataKontakItem>
        SMF?: RawDictSMF
    }
}

export interface RawDataPetugas {
    ID?: string //"1061",
    NIP?: string //"199...",
    NAMA?: string //"Gregory...",
    PANGGILAN?: string //"",
    GELAR_DEPAN?: string //"dr",
    GELAR_BELAKANG?: string //"",
    TEMPAT_LAHIR?: string //"WONOGIRI",
    TANGGAL_LAHIR?: string //"1999-04-14 00:00:00",
    AGAMA?: string //"1",
    JENIS_KELAMIN?: string //"2",
    PROFESI?: string //"4",
    SMF?: string //"31",
    ALAMAT?: string //"",
    RT?: string //"",
    RW?: string //"",
    KODEPOS?: string //"",
    WILAYAH?: string //"",
    TANGGAL?: string //"2025-08-01 09:20:46",
    NON_PEGAWAI?: string //"0",
    STATUS?: string //"1",
    REFERENSI?: {
        PROFESI?: RawDictProfesi
        AGAMA?: RawDictAgama
    }
    KARTU_IDENTITAS?: Array<RawDataKartuIdentitasItem>
    KONTAKS?: Array<RawDataKontakItem>
}

export interface RawDataOleh {
    NIP?: string //"199...",
    NAMA?: string //"Gregory...",
    GELAR_DEPAN?: string //"dr",
    GELAR_BELAKANG?: string //"",
    PROFESI?: string //"4"
}
