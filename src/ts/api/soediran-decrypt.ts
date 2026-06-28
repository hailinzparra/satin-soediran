const my_base64 = {
    _str: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
    decode(z: string) {
        var A = this
        var D = '', E, G, w, F, v, x, y, C = 0
        z = z.replace(/[^A-Za-z0-9\+\/\=]/g, '')
        var B = z.length
        while (C < B) {
            F = A._str.indexOf(z.charAt(C++))
            v = A._str.indexOf(z.charAt(C++))
            x = A._str.indexOf(z.charAt(C++))
            y = A._str.indexOf(z.charAt(C++))
            E = (F << 2) | (v >> 4)
            G = ((v & 15) << 4) | (x >> 2)
            w = ((x & 3) << 6) | y
            D = D + String.fromCharCode(E)
            if (x !== 64) { D += String.fromCharCode(G) }
            if (y !== 64) { D += String.fromCharCode(w) }
        }
        return A._utf8_decode(D)
    },
    _utf8_decode(t: string) {
        var q = '', w = 0, v = 0, s = 0, p = 0, u = t.length
        while (w < u) {
            v = t.charCodeAt(w)
            if (v < 128) {
                q += String.fromCharCode(v)
                w++
            }
            else if (v > 191 && v < 224) {
                p = t.charCodeAt(w + 1)
                q += String.fromCharCode(((v & 31) << 6) | (p & 63))
                w += 2
            } else {
                p = t.charCodeAt(w + 1)
                s = t.charCodeAt(w + 2)
                q += String.fromCharCode(((v & 15) << 12) | ((p & 63) << 6) | (s & 63))
                w += 3
            }
        }
        return q
    }
}

const hex_to_array_data = (o: string) => {
    var q = Math.ceil(o.length / 2)
    var s = new Uint8Array(q)
    for (var p = 0; p < q; p++) {
        var n = o.substr(p * 2, 2)
        s[p] = parseInt(n, 16)
    }
    return s
}

const ascii_to_hex = (p: string) => {
    var o = ''
    for (var n = 0; n < p.length; n++) {
        var m = p.charCodeAt(n).toString(16)
        o += m.padStart(2, '0')
    }
    return o
}

export const decrypt_data = (encrypted_base64: string, token_base64: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            var C = window.crypto.subtle,
                z = my_base64.decode(token_base64),
                u = my_base64.decode(encrypted_base64),
                y = u.substring(0, 16),
                A = new TextDecoder(),
                B = hex_to_array_data(z),
                uData = u.substring(16)

            if (!C) throw new Error('Crypto API not available')
            const ivArr = hex_to_array_data(ascii_to_hex(y))
            const cipherArr = hex_to_array_data(ascii_to_hex(uData))

            C.importKey('raw', B, { name: 'AES-CBC', length: 32 }, false, ['decrypt'])
                .then(f => C.decrypt({ name: 'AES-CBC', iv: ivArr }, f, cipherArr))
                .then(g => {
                    const decoded_text = A.decode(new Uint8Array(g))
                    const decompressed = LZString.decompressFromEncodedURIComponent(decoded_text)
                    resolve(decompressed)
                }).catch(e => reject(e))
        } catch (err) { reject(err) }
    })
}
