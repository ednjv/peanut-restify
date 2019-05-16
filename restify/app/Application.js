"use strict";
const restify = require("restify");
const events = require("events");
const expr = require("./../../expressions");
const AbstractError = require("peanut-restify/errors/AbstractError");

/**
 * Application Wrapper
 * @class App
 */
class App {
  constructor(options) {
    expr.whenTrue(!options, () => {
      options = {};
    });

    expr.whenTrue(!options.formatters, () => {
      options.formatters = {};
    });

    options.formatters["application/json"] = (req, res, body) => {
      if (body && body.jse_cause instanceof AbstractError) {
        body = body.jse_cause;
      } else if (Buffer.isBuffer(body)) {
        body = body.toString("base64");
      }

      const data = JSON.stringify(body);
      res.setHeader("Content-Length", Buffer.byteLength(data));

      return data;
    };

    this.emitter = new events.EventEmitter();
    this.server = restify.createServer(options);
    this.extensions = {};
    this.decorators = {};
    this.models = {};
  }

  /**
   * Emit Event
   * @param {(string | symbol)} eventName Event Name
   * @param {...any[]} args Arguments
   * @memberof App
   */
  emit(eventName, args) {
    this.emitter.emit(eventName, args);
  }

  /**
   * Subscribe to Event
   * @param {(string | symbol)} eventName Event Name
   * @param {(...args: any[]) => void} callback Callback function when trigger specified event
   * @memberof App
   */
  on(eventName, callback) {
    this.emitter.on(eventName, callback);
  }

  /**
   * Get value of something in the Core App , like some settings or maybe
   * if a extension has been called!
   * @param {String} name Name of the setting to retrieve
   * @returns {Object} Setting Value
   * @memberof App
   */
  get(name) {
    const extensionPrefix = "extension-";

    // Ask for a Extension Use??
    if (name.startsWith(extensionPrefix)) {
      // Get the values
      const extension = this.extensions[name.substring(extensionPrefix.length)];
      return extension;
    }

    switch (name) {
      case "is-dev-mode":
        return this.getSettings().env == "DEV";
      case "is-prod-mode":
        return this.getSettings().env == "PROD";
      case "is-test-mode":
        return this.getSettings().env == "TEST";
      case "family":
        return this.server.address().family;
      case "host":
        let url = this.server.address().address;
        if (url === "::") {
          url = "localhost";
        }
        return url;
      case "port":
        return this.server.address().port;
      case "url":
        const scheme = this.server.address().port == 443 ? "https" : "http";
        return `${scheme}://${this.get("host")}:${this.get("port")}`;
    }
  }

  /**
   * Return the server instance
   * @returns Server Instance
   * @memberof App
   */
  getServer() {
    return this.server;
  }

  /**
   * Retrieve the configured settings for the Application
   * @returns {any}
   * @memberof App
   */
  getSettings() {
    return this.settings;
  }

  /**
   * Set Settings environment from the boot
   * @param {any} settings Boot settings
   * @memberof App
   */
  setSettings(settings) {
    this.settings = settings;
  }

  /**
   * Start Web server
   *
   * @param {any} callback
   * @memberof App
   */
  listen(callback) {
    this.server.listen(this.settings.port, () => {
      callback(this.server);
    });
  }

  /**
   * Shutdown Web server (gracefully) (emit application:shutdown event via Application befire kill)
   *
   * @param {any} callback
   * @memberof App
   */
  close() {
    this.emit("application:shutdown");
    this.server.close();
  }

  /**
   * Extension Interfaces (for simple access)
   */

  /**
   * Add Custom Content-types for others mime types
   * @param {any} config Configuration Settings
   * @memberof AddCustomFormatterExtension
   */
  addCustomFormatters(config) {}

  /**
   * Add health status for the API (default: /health)
   * @param {any} config Configuration Settings
   * @memberof addHealthStatusExtension
   */
  addHealthStatus(config) {}

  /**
   * Enable JWT Security for request's
   * @param {any} config Configuration Settings
   * @memberof AddJWTSecurityExtension
   */
  addJWTSecurity(config) {}

  /**
   * Add Standard Plugin's (body parser, query parser and validation plugin)
   * @param {any} config Configuration Settings
   * @memberof AddStandardPluginsExtension
   */
  addStandardPlugins(config) {}

  /**
   * Activate the swagger UI
   * @param {any} config Configuration Settings
   * @returns
   * @memberof AddSwaggerDocsExtension
   */
  addSwaggerDocs(config) {}

  /**
   * Insert a URI registry in the whitelist table
   * @param {any} config Configuration Settings
   * @memberof AddToWhiteListExtension
   */
  addToWhiteList(config) {}

  /**
   * Add Logger Transport
   * @param {function} callback Function that returns a transport
   */
  addLoggerTransport(callback) {}

  /**
   * Add File Logger Transport
   * @param {options} options Add file transport parameter options
   */
  addFileLoggerTransport(options) {}

  /**
   * Discover endpoints and his models and register into the controllers restify registry
   * @param {any} config Configuration Settings
   * @memberof DiscoverEndpointsExtension
   */
  discoverEndpoints(config) {}

  /**
   * Enable CORS
   * @param {any} config Configuration Settings
   * @memberof EnableCorsExtension
   */
  enableCORS(config) {}

  /**
   * Enable Socket Interaction for commander pattern
   * @param {any} config Configuration Settings
   * @memberof EnableSocketListener
   */
  enableSocketListener(config) {}

  /**
   * Get Boot Setting's
   * @param {any} config Configuration Settings
   * @returns Settings
   * @memberof GetSettingsExtension
   */
  getSettings(config) {}

  /**
   * Get Whitelist Routes
   * @param {any} config Configuration Settings
   * @memberof GetWhiteListExtension
   */
  getWhiteList(config) {}

  /**
   * Add a static file route
   * @param {any} config Configuration Settings
   * @memberof staticFileExtension
   */
  staticFile(config) {}

  /**
   * Add /ping endpoint for... maybe a loading test??
   */
  addPingEndpoint() {}

  /**
   * Add database auto connection, for checking a connection in bootstrap
   */
  autoConnectToDb() {}
}

let app;
/**
 * Get Application Wrapper
 * @returns {App} Application Wrapper
 * @memberof App
 */
module.exports = options => {
  if (!app) {
    app = new App(options);
  }
  return app;
};
