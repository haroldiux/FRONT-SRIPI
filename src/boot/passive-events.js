// src/boot/passive-events.js
export default () => {
  // Hacer que los eventos táctiles sean pasivos por defecto
  const originalAddEventListener = window.EventTarget.prototype.addEventListener;
  window.EventTarget.prototype.addEventListener = function(type, listener, options) {
    // Convertir eventos touch a pasivos por defecto
    if (type === 'touchstart' || type === 'touchmove') {
      if (options === undefined || options === false) {
        options = { passive: true };
      } else if (typeof options === 'object' && options !== null && options.passive === undefined) {
        options = { ...options, passive: true };
      }
    }
    return originalAddEventListener.call(this, type, listener, options);
  };
};
