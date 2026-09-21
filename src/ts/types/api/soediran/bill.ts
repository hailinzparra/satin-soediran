import { RawDataPendaftaran } from './registration'

export interface RawDataTagihanPendaftaran {
    ID?: string //"539855",
    TAGIHAN?: string //"2609220007",
    PENDAFTARAN?: string //"2609220007",
    REF?: string //"",
    UTAMA?: string //"1",
    STATUS?: string //"1",
    REFERENSI?: {
        PENDAFTARAN?: RawDataPendaftaran
    }
}
