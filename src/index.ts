import compact from 'lodash.compact'
import { EventEmitter } from 'events'

enum SocketStatus {
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  CLOSED = 'CLOSED'
}

interface Options {
  interval?: number
}

export default interface MiniSockets<Message> {
  emit(event: 'connected'): boolean
  on(event: 'connected', handler: () => void): this

  emit(event: 'disconnected'): boolean
  on(event: 'disconnected', handler: () => void): this

  emit(event: 'closed'): boolean
  on(event: 'closed', handler: () => void): this

  emit(event: 'error', error: Error | Event): boolean
  on(event: 'error', handler: (error: Error | Event) => void): this

  emit(event: 'message', message: any): boolean
  on(event: 'message', handler: (message: Message) => void): this
}

export default class MiniSockets<Message> extends EventEmitter {
  private readonly url: string
  private connection: WebSocket | null = null
  private status: SocketStatus = SocketStatus.DISCONNECTED
  private interval = 1000
  private messages: { event: string, payload?: any }[] = []

  constructor(url: string, options: Options = {}) {
    super()
    this.url = url
    if (options.interval) {
      this.interval = options.interval
    }
    this.connect()
  }

  private connect() {
    this.connection = new WebSocket(this.url)
    this.status = SocketStatus.CONNECTING
    this.connection.onopen = this.onopen.bind(this)
    this.connection.onerror = this.onerror.bind(this)
    this.connection.onclose = this.onclose.bind(this)
    this.connection.onmessage = this.onmessage.bind(this)
  }

  private onopen() {
    console.warn('connected to websockets')
    this.status = SocketStatus.CONNECTED
    this.emit('connected')
    this.messages = compact(this.messages)
    const nextMessages = this.messages.map(message => {
      const result = this.send(message.event, message.payload)
      return result ? null : message
    })
    this.messages = compact(nextMessages)
  }

  private onclose() {
    console.warn('disconnected from websockets')
    this.status = SocketStatus.DISCONNECTED
    this.emit('disconnected')
    setTimeout(this.connect.bind(this), this.interval)
  }

  private onmessage(event: MessageEvent) {
    const { data } = event
    try {
      const message = JSON.parse(data)
      this.emit('message', message)
    } catch (error) {
      this.emit('error', error)
    }
  }

  private onerror(error: Event) {
    this.emit('error', error)
  }

  send(event: string, payload?: any): boolean {
    if (this.connection && this.status === SocketStatus.CONNECTED) {
      this.connection.send(JSON.stringify({ event, payload }))
      return true
    }
    this.messages.push({ event, payload })
    return false
  }

  close() {
    if (this.connection) {
      this.connection.close()
      this.status = SocketStatus.CLOSED
      this.emit('closed')
    }
  }
}
