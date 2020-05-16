minisockets
===

A wrapper around a web socket client that can handle disconnects and queues outgoing messages

## Install

```bash
npm install minisockets
```

## Usage

```ts
import MiniSockets from 'minisockets'

const socket = new MiniSockets('ws://localhost')

socket.on('message', message => {
  socket.send('hello', { foo: true })
  socket.close()
})
```

## Reconnection

If the client disconnects, it will reconnect automatically. You can define an interval of milliseconds between each reconnect (default is 1000)

```ts
const socket = new MiniSockets('ws://localhost', { interval: 5000 })
```

## Queue message

If you trying to send a message when the client is reconnecting, your message will be queued and sent once the client has reconnected

## JSON enabled

Each data is sent as a JSON