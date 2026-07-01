import { RawDictSMF, RawDictStatus } from './dictionary'
import { RawDataPenjamin } from './insurance'
import { RawDataPasien, RawDataPasienPulang } from './patient'
import { RawDataRuangan } from './room'
import { RawDataDokter, RawDataOleh } from './user'

interface RawDataDiagnosaMasuk {
    ID?: string //"6",
    ICD?: string //"",
    DIAGNOSA?: string //"0"
}

interface RawDataRujukan {
    ID?: string //"313431",
    PPK?: string //"0",
    NORM?: string //"236290",
    NOMOR?: string //"2606300369",
    TANGGAL?: string //"2026-06-30 16:33:16",
    DOKTER?: string //"",
    BAGIAN_DOKTER?: string //"",
    DIAGNOSA_MASUK?: string //"6",
    STATUS?: string //"1",
    REFERENSI?: {
        DIAGNOSA_MASUK?: RawDataDiagnosaMasuk
    }
}

interface RawDataDiagnosaUtama {
    ID?: string //"1682608",
    NOPEN?: string //"2606300369",
    KODE?: string //"",
    SNOMED_CT_ID?: string //"",
    DIAGNOSA?: string //"obs seizure dd status epileptikus\nriwayat epilepsi pengobatan rutin\nmigraine berat\n",
    UTAMA?: string //"1",
    INACBG?: string //"1",
    BARU?: string //"0",
    DIAGNOSA_OLEH?: string //"716",
    DIAGNOSA_TANGGAL?: string //"2026-06-30 17:05:55",
    TANGGAL?: string //"2026-06-30 17:05:55",
    OLEH?: string //"716",
    STATUS?: string //"1",
    INA_GROUPER?: string //"1",
    CATATAN?: string //"",
    REFERENSI?: {
        DIAGNOSA_OLEH?: RawDataOleh
        OLEH?: RawDataOleh
    }
}

interface RawDataKelengkapanBerkas {
    NOPEN?: string //"2606300369",
    DOKUMEN_VERIF?: string | null
    STATUS?: string //"1",
    tagihan_ID?: string //"2606300378",
    tagihan_KUNCI?: string //"0",
    tagihan_STATUS?: string //"1"
}

interface RawDataEncounter {
    id?: string //"11046777-8d8b-47ef-82d4-4a21a9890153"
}

interface RawDataPendaftaranAntrian {
    ID?: string //"452085",
    RUANGAN?: string //"101020201",
    TANGGAL?: string //"2026-06-30",
    POS?: string //"",
    NOMOR?: string //"25",
    JENIS?: string //"1",
    REF?: string //"2606300369",
    STATUS?: string //"2",
    IS_ANTRIAN_ONLINE?: string //"0",
    DOKTER?: string //"0",
    KODEBOOKING?: string | null
    TIMEDATE?: string //"2026-06-30 16:34:24"
}

interface RawDataPendaftaranTujuan {
    NOPEN?: string //"2606300369",
    RUANGAN?: string //"101020201",
    RESERVASI?: string | null
    SMF?: string //"31",
    DOKTER?: string //"14",
    IKUT_IBU?: string //"0",
    KUNJUNGAN_IBU?: string //"",
    STATUS?: string //"2",
    REFERENSI?: {
        RUANGAN?: RawDataRuangan
        STATUS?: RawDictStatus
        SMF?: RawDictSMF
        DOKTER?: RawDataDokter
        ANTRIAN?: RawDataPendaftaranAntrian
    }
}

export interface RawDataPendaftaran {
    NOMOR?: string //"2606300369",
    NORM?: string //"236290",
    TANGGAL?: string //"2026-06-30 16:33:16",
    DIAGNOSA_MASUK?: string //"6",
    RUJUKAN?: RawDataRujukan,
    PAKET?: string | null
    BERAT_BAYI?: string | null
    PANJANG_BAYI?: string | null
    CITO?: string //"0",
    RESIKO_JATUH?: string //"0",
    LOKASI_DITEMUKAN?: string //"",
    TANGGAL_DITEMUKAN?: string | null
    JAM_LAHIR?: string | null
    CONSENT_SATUSEHAT?: string //"0",
    OLEH?: string //"551",
    STATUS?: string //"1",
    FLAPON?: string //"0",
    POSTING?: string //"N",
    FINAL_TAGIHAN?: string //"N",
    DPJP?: string | null
    REFERENSI: {
        PASIEN?: RawDataPasien
        PASIEN_PULANG?: RawDataPasienPulang
        PASIEN_PULANG_SEBELUMNYA?: RawDataPasienPulang
        DIAGNOSAUTAMA?: RawDataDiagnosaUtama
        STATUS?: RawDictStatus
        KELENGKAPAN_BERKAS?: RawDataKelengkapanBerkas
        ENCOUNTER?: RawDataEncounter
        SYSDATE?: string //"2026-07-01 03:39:25"
    }
    DIAGNOSAMASUK?: RawDataDiagnosaMasuk
    TUJUAN?: RawDataPendaftaranTujuan
    PENJAMIN?: RawDataPenjamin
}
