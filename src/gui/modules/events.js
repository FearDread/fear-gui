
  // Event System
  const EventSystem = (() => {
    const events = new Map();

    const on = (event, callback, context = null) => {
      if (!events.has(event)) {
        events.set(event, []);
      }
      events.get(event).push({ callback, context });
    };

    const off = (event, callback = null) => {
      if (!events.has(event)) return;
      
      if (callback) {
        const handlers = events.get(event);
        events.set(event, handlers.filter(h => h.callback !== callback));
      } else {
        events.delete(event);
      }
    };

    const emit = (event, data = null) => {
      if (!events.has(event)) return;
      
      events.get(event).forEach(({ callback, context }) => {
        try {
          callback.call(context, data);
        } catch (error) {
          CoreUtils.log(`Error in event handler for ${event}: ${error.message}`, 'error', 'Events');
        }
      });
    };

    const once = (event, callback, context = null) => {
      const wrapper = (data) => {
        callback.call(context, data);
        off(event, wrapper);
      };
      on(event, wrapper, context);
    };

    return { on, off, emit, once };
  })();