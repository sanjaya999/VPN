// crypto.ts

export async function encrypt(plaintext: Buffer, key: CryptoKey): Promise<Buffer> {
    const iv = crypto.getRandomValues(new Uint8Array(12))

    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        new Uint8Array(plaintext)
    )

    const out = new Uint8Array(12 + encrypted.byteLength)
    out.set(iv, 0)
    out.set(new Uint8Array(encrypted), 12)
    return Buffer.from(out)
}

export async function decrypt(data: Buffer, key: CryptoKey): Promise<Buffer | null> {
    const iv         = new Uint8Array(data.subarray(0, 12))   
    const ciphertext = new Uint8Array(data.subarray(12)) 

    try {
        const plain = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            ciphertext
        )
        return Buffer.from(plain)
    } catch {
        return null  
    }
}

export async function importKey(rawKey: Buffer): Promise<CryptoKey> {
    return crypto.subtle.importKey(
        'raw', new Uint8Array(rawKey),
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    )
}