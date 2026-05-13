
export interface EncryptedPacket {
    iv:         Uint8Array   
    ciphertext: Uint8Array  
}

export interface PeerInfo {
    ip:       string
    port:     number
    publicKey: CryptoKey
}

export interface TunnelConfig {
    tunDevice:  string     
    listenPort: number
    peers:      PeerInfo[]
    key:        Buffer      
}