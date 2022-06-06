const axios = require("axios").default;
const hbRouter = require("./hb");

class ServiceManager {
  constructor(serviceManagerURL, localURL, port) {
    if (ServiceManager._instance) return ServiceManager._instance;
    ServiceManager._instance = this;
    this._serviceManagerURL = new URL(serviceManagerURL);
    this._localURL = new URL(localURL);
    this._localURL.port = port;
  }

  static instance(serviceManagerURL, localURL, port) {
    if (!ServiceManager._instance) {
      return new ServiceManager(serviceManagerURL, localURL, port);
    }
    return ServiceManager._instance;
  }

  static _buildRoutes(stack, routes = [], parent = "") {
    for (let middleware of stack) {
      if (middleware.route) {
        routes.push({
          path: parent + middleware.route.path,
          methods: middleware.route.methods,
        });
      } else if (middleware.name === "router") {
        routes.concat(
          ServiceManager._buildRoutes(
            middleware.handle.stack,
            routes,
            parent + middleware.regexp.toString().slice(3, -13)
          )
        );
      }
    }

    return routes;
  }

  async register({ app }) {
    this._serviceManagerURL.pathname = "/services/connect";

    app.use(hbRouter);

    let routes = ServiceManager._buildRoutes(app._router.stack);

    axios
      .post(this._serviceManagerURL.href, {
        name: "auth",
        hosts: [this._localURL.host],
        endpoints: {
          public: routes.filter(
            (route) =>
              !route.path.includes("/protected/") &&
              !route.path.includes("/internal/")
          ),
          protected: routes.filter((route) =>
            route.path.includes("/protected/")
          ),
          internal: routes.filter((route) => route.path.includes("/internal/")),
        },
      })
      .then(function () {
        console.log("[auth-service] connected to service-manager");
      })
      .catch(function (err) {
        throw err;
      });
  }
}

module.exports = ServiceManager.instance;
