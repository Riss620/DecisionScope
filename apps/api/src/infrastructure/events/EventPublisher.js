class EventPublisher {
  /**
   * @param {string} channel
   * @param {any} data
   */
  emit(channel, data) {
    throw new Error('emit() not implemented');
  }
}

module.exports = { EventPublisher };
