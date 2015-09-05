import EventEmitter from 'events';

import Debug from '../util/Debug';
import PokeyApiEvents from './PokeyApiEvents';

const debug = Debug('PokeyApi');

function _getUrl() {
  const loc = window.location;
  let protocol;
  if (loc.protocol === 'https:') {
    protocol = 'wss:';
  } else {
    protocol = 'ws:';
  }

  return `${protocol}//${loc.host}/connect`;
}

class PokeyApi extends EventEmitter {
  openConnection() {
    const url = _getUrl();
    debug('open_socket %s', url);
    this.conn = new WebSocket(url);

    this._sendMessage = function _sendMessage(msg) {
      debug('send_message %o', msg);
      this.conn.send(JSON.stringify(msg));
    }

    this.conn.onmessage = (message) => {
      const event = JSON.parse(message.data);
      debug('message_received %o', event);

      switch (event.event) {
        case 'connectionInfo':
          this.emit(PokeyApiEvents.ConnectionInfo, event.userId);
          break;

        case 'userUpdated':
          this.emit(PokeyApiEvents.UserUpdated, event.user);
          break;

        case 'roomCreated':
          this.emit(PokeyApiEvents.RoomCreated, event.roomId);
          break;

        case 'roomUpdated':
          this.emit(PokeyApiEvents.RoomUpdated, event.room);
          break;

        case 'userJoined':
          this.emit(PokeyApiEvents.UserJoined, event.roomId, event.user);
          break;

        case 'userLeft':
          this.emit(PokeyApiEvents.UserLeft, event.roomId, event.user);
          break;

        case 'estimateUpdated':
          this.emit(PokeyApiEvents.EstimateUpdated, event.roomId, event.userId, event.estimate);
          break;

        case 'roomRevealed':
          this.emit(PokeyApiEvents.RoomRevealed, event.roomId, event.estimates);
          break;

        case 'roomCleared':
          this.emit(PokeyApiEvents.RoomCleared, event.roomId);
          break;

        case 'roomClosed':
          this.emit(PokeyApiEvents.RoomClosed, event.roomId);
          break;

        case 'error':
          this.emit(PokeyApiEvents.Error, event.message);
          break;
      }
    };
  }

  setName(name) {
    this._sendMessage({
      command: 'setName',
      name: name
    });
  }

  createRoom() {
    this._sendMessage({
      command: 'createRoom'
    });
  }

  joinRoom(roomId) {
    this._sendMessage({
      command: 'joinRoom',
      roomId: roomId
    });
  }

  submitEstimate(roomId, estimate) {
    this._sendMessage({
      command: 'submitEstimate',
      roomId: roomId,
      estimate: estimate
    });
  }

  clearRoom(roomId) {
    this._sendMessage({
      command: 'clearRoom',
      roomId: roomId
    });
  }

  revealRoom(roomId) {
    this._sendMessage({
      command: 'revealRoom',
      roomId: roomId
    });
  }
}

export default new PokeyApi();
