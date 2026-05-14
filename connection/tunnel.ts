import dgram from 'dgram'
import { encrypt, decrypt } from './crypto'
import type { TunnelConfig } from '../types/types'
import { openTun, tunRead, tunWrite } from './tun'

export class Tunnel{
    private socket : dgram.Socket
    private config : TunnelConfig
    private running = false
    private fd     : number

    constructor(config : TunnelConfig){
        this.config = config
        this.fd     = openTun(config.tunDevice)
        this.socket = dgram.createSocket({type: 'udp4', reuseAddr: true})
    }
    async start():Promise<void>{
        this.running = true
        this.socket.bind(this.config.listenPort)
        this.socket.on('message', (msg: Buffer, rinfo: dgram.RemoteInfo)=> this.handleInbound(msg, rinfo))
        console.log(`Tunnel listening on :${this.config.listenPort}`)
        await this.readLoop();


    }
        private async readLoop(): Promise<void> {
        const buf = Buffer.alloc(1500)
        while (this.running) {
            const n = tunRead(this.fd, buf)
            if (n > 0) {
                const packet = buf.subarray(0, n)
                await this.sendToPeers(packet)
            } else {
                // No data available yet, yield to the event loop
                await Bun.sleep(0)
            }
        }
    }
        private async sendToPeers(packet: Buffer): Promise<void> {
        for (const peer of this.config.peers) {
            const enc = await encrypt(packet, peer.publicKey)
            this.socket.send(enc, peer.port, peer.ip)
        }
    }

    private async handleInbound(msg: Buffer, rinfo: dgram.RemoteInfo): Promise<void> {
        for (const peer of this.config.peers) {
            const plain = await decrypt(msg, peer.publicKey)
            if (plain) {
                // Auto-learn/update peer address if it changed
                if (peer.ip !== rinfo.address || peer.port !== rinfo.port) {
                    console.log(`Peer address updated: ${rinfo.address}:${rinfo.port}`)
                    peer.ip = rinfo.address
                    peer.port = rinfo.port
                }
                tunWrite(this.fd, plain)
                return
            }
        }
    }

    stop(): void {
        this.running = false
        this.socket.close()
    }
}