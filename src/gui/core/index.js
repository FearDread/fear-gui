// example-usage.js - How to use the refactored FEAR GUI framework

import { FEAR, createGUI } from './gui';
import Router from "../plugins/router";
import MVCPlugin from "../plugins/mvc";
import Metrics from "../modules/metrics";

FEAR.use(MVCPlugin);
// Register as GUI plugin
FEAR.use(function (GUI) {
  console.log('gui outside load func router', GUI);
  GUI.Router = Router;

  // Add router helper to sandbox
  return {
    load: function (options) {
      console.log('Sanbox in Router plugin ', options);
      GUI.router = function (config) {
        return new Router(config);
      };
    }
  };
});

$.FEAR = function (options) {
  const instance = options.instance ? createGUI() : options.instance;
  if (options && options.config) instance.configure(options.config);

  instance.metrics = Metrics;
  return instance;
};

$.fear = $.FEAR({instance: FEAR, config: {name: "GDREA - SPA"}});

window.FEAR = FEAR;