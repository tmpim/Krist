const chalk = require("chalk");

const WebSocketAsPromised = require("websocket-as-promised");
const W3CWebSocket = require("websocket").w3cwebsocket;

const { api } = require("./api");

class WrappedWebsocket {
  constructor(url, init) {
    this.url = url;

    this.messageID = 1;
    this.messageResponses = {};

    this.finalClosed = false;

    this.wsp = new WebSocketAsPromised(url, {
      createWebSocket: u => new W3CWebSocket(u),
      packMessage: data => JSON.stringify(data),
      unpackMessage: data => JSON.parse(data)
    });

    this.wsp.onUnpackedMessage.addListener(this.handleMessage.bind(this));

    // Allow the test to add its own message handlers before the connection
    // is opened
    if (init) init(this, this.wsp);
  }

  handleMessage(data) {
    if (data.id) {
      const handler = this.messageResponses[data.id];
      if (!handler) {
        console.error(chalk`{red [Tests]} Websocket message had id {bold ${data.id}} (type: {bold ${typeof data.id}}) which we did not have a handler for!`, data);
        return;
      }

      handler.resolve(data);
      delete this.messageResponses[data.id];
    }
  }

  sendAndWait(data) {
    return new Promise((resolve, reject) => {
      const id = ++this.messageID;
      const message = { id, ...data }; // Allow 'data' to overwrite the ID

      this.messageResponses[id] = { resolve, reject };
      this.wsp.sendPacked(message);
    });
  }

  close() {
    // Close after 100ms to allow the server to send whatever it has to
    setTimeout(() => {
      if (!this.finalClosed && this.wsp && this.wsp.isOpened && !this.wsp.isClosing && !this.wsp.isClosed) {
        this.wsp.close();
        this.finalClosed = true;
      }
    }, 100);
  }
}

module.exports = {
  async newConnection(privatekey, init) {
    const res = await api().post("/ws/start").send({ privatekey });
    const ws = new WrappedWebsocket(res.body.url, init);
    await ws.wsp.open();

    setTimeout(() => {
      // Close after 2 seconds (the default test timeout) just in case it wasn't
      // done manually
      if (ws) ws.close();
    }, 2000);

    return ws;
  }
};
