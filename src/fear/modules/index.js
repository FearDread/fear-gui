import Event from "./events";
import Router from "./router";


$.FEAR().use((gui) => {
    return { load: sandbox => sandbox.event = new Event() }
})
$.FEAR().use((gui) => {
    return { load: sandbox => sandbox.Router = new Router() };
})