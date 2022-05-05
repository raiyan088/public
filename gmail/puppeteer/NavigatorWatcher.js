const helper = require('./helper');

class NavigatorWatcher {
  
  constructor(client, ignoreHTTPSErrors, options = {}) {
    this._client = client;
    this._ignoreHTTPSErrors = ignoreHTTPSErrors;
    this._timeout = typeof options['timeout'] === 'number' ? options['timeout'] : 30000;
    this._idleTime = typeof options['networkIdleTimeout'] === 'number' ? options['networkIdleTimeout'] : 1000;
    this._idleInflight = typeof options['networkIdleInflight'] === 'number' ? options['networkIdleInflight'] : 2;
    this._waitUntil = typeof options['waitUntil'] === 'string' ? options['waitUntil'] : 'load';
    console.assert(this._waitUntil === 'load' || this._waitUntil === 'networkidle', 'Unknown value for options.waitUntil: ' + this._waitUntil);
  }

  async waitForNavigation() {
    this._requestIds = new Set();

    this._eventListeners = [];

    const watchdog = new Promise(fulfill => this._maximumTimer = setTimeout(fulfill, this._timeout))
        .then(() => 'Navigation Timeout Exceeded: ' + this._timeout + 'ms exceeded');
    const navigationPromises = [watchdog];

    if (!this._ignoreHTTPSErrors) {
      const certificateError = new Promise(fulfill => {
        this._eventListeners.push(helper.addEventListener(this._client, 'Security.certificateError', fulfill));
      }).then(error => 'SSL Certificate error: ' + error.errorType);
      navigationPromises.push(certificateError);
    }

    if (this._waitUntil === 'load') {
      const loadEventFired = new Promise(fulfill => {
        this._eventListeners.push(helper.addEventListener(this._client, 'Page.loadEventFired', fulfill));
      }).then(() => null);
      navigationPromises.push(loadEventFired);
    } else {
      this._eventListeners.push(...[
        helper.addEventListener(this._client, 'Network.requestWillBeSent', this._onLoadingStarted.bind(this)),
        helper.addEventListener(this._client, 'Network.loadingFinished', this._onLoadingCompleted.bind(this)),
        helper.addEventListener(this._client, 'Network.loadingFailed', this._onLoadingCompleted.bind(this)),
        helper.addEventListener(this._client, 'Network.webSocketCreated', this._onLoadingStarted.bind(this)),
        helper.addEventListener(this._client, 'Network.webSocketClosed', this._onLoadingCompleted.bind(this)),
      ]);
      const networkIdle = new Promise(fulfill => this._networkIdleCallback = fulfill).then(() => null);
      navigationPromises.push(networkIdle);
    }

    const error = await Promise.race(navigationPromises);
    this._cleanup();
  }

  cancel() {
    this._cleanup();
  }

  
  _onLoadingStarted(event) {
    this._requestIds.add(event.requestId);
    if (this._requestIds.size > this._idleInflight) {
      clearTimeout(this._idleTimer);
      this._idleTimer = null;
    }
  }

  
  _onLoadingCompleted(event) {
    this._requestIds.delete(event.requestId);
    if (this._requestIds.size <= this._idleInflight && !this._idleTimer)
      this._idleTimer = setTimeout(this._networkIdleCallback, this._idleTime);
  }

  _cleanup() {
    helper.removeEventListeners(this._eventListeners);

    clearTimeout(this._idleTimer);
    clearTimeout(this._maximumTimer);
  }
}

module.exports = NavigatorWatcher;
