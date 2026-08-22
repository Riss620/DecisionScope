const { EventPublisher } = require('./EventPublisher');

class SocketEventPublisher extends EventPublisher {
  constructor(io) {
    super();
    this.io = io;
  }

  emit(channel, data) {
    if (this.io) {
      this.io.emit(channel, data);
    } else {
      console.warn('SocketEventPublisher: io instance not provided');
    }
  }
}

module.exports = { SocketEventPublisher };
