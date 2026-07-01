import { RawDataKunjungan } from './admission'
import { RawDictJenisKunjungan, RawDictStatus } from './dictionary'
import { RawDataDokter, RawDataPetugas } from './user'

interface RawDataOrderResepTujuan {
    ID?: string //"101040103",
    JENIS?: string //"5",
    JENIS_KUNJUNGAN?: string //"11",
    REF_ID?: string //"0",
    DESKRIPSI?: string //"Depo Rawat Inap",
    TANGGAL?: string //"2023-07-03 08:58:17",
    AKSES_PERMINTAAN?: string //"1",
    OLEH?: string | null
    CONFIG?: string | null
    STATUS?: string //"1",
    REFERENSI?: {
        JENIS_KUNJUNGAN?: RawDictJenisKunjungan
    }
}

export interface RawDataOrderResep {
    NOMOR?: string //"141010202012606300037",
    KUNJUNGAN?: string //"1010202012606300025",
    TANGGAL?: string //"2026-06-30 17:25:35",
    DOKTER_DPJP?: string //"108",
    PEMBERI_RESEP?: string //"Gregory...",
    NO_HP_PEMBERI_RESEP?: string //"0853...",
    BERAT_BADAN?: string //"0.00",
    TINGGI_BADAN?: string //"0.00",
    DIAGNOSA?: string //"obs seizure dd status epileptikus\nriwayat epilepsi pengobatan rutin\nmigraine berat\n",
    ALERGI_OBAT?: string //"",
    GANGGUAN_FUNGSI_GINJAL?: string //"0",
    MENYUSUI?: string //"0",
    HAMIL?: string //"0",
    RESEP_PASIEN_PULANG?: string //"0",
    TUJUAN?: string //"101040102",
    CITO?: string //"0",
    KETERANGAN?: string //"-",
    STATUS_PUASA_PASIEN?: string //"0",
    LUAS_PERMUKAAN_TUBUH_ANAK?: string //"0.00",
    OLEH?: string //"716",
    STATUS?: string //"2",
    REF?: string //"0",
    TINDAKAN_PAKET?: string //"0",
    REF_PROTOKOL?: string //"",
    REF_ITERASI?: string | null
    IS_FORMULIR_ANTIBIOTIK?: string //"0",
    REFERENSI?: {
        KUNJUNGAN?: RawDataKunjungan
        TUJUAN?: RawDataOrderResepTujuan
        DOKTER_DPJP?: RawDataDokter
        STATUS?: RawDictStatus
        PETUGAS?: RawDataPetugas
    }
}
