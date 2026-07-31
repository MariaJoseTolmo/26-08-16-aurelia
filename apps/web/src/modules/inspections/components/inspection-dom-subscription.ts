type InspectionDomListener = () => void;

const listeners = new Set<InspectionDomListener>();
let observer: MutationObserver | null = null;
let animationFrame: number | null = null;
let notifying = false;

function schedule() {
  if (animationFrame !== null) return;
  animationFrame = window.requestAnimationFrame(() => {
    animationFrame = null;
    if (notifying) return;
    notifying = true;
    try {
      listeners.forEach((listener) => listener());
    } finally {
      notifying = false;
    }
  });
}

function start() {
  if (observer || typeof document === 'undefined') return;
  observer = new MutationObserver(schedule);
  observer.observe(document.getElementById('root') ?? document.body, {
    childList: true,
    subtree: true,
  });
  window.addEventListener('focus', schedule);
  window.addEventListener('popstate', schedule);
}

function stop() {
  if (listeners.size > 0) return;
  observer?.disconnect();
  observer = null;
  window.removeEventListener('focus', schedule);
  window.removeEventListener('popstate', schedule);
  if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
  animationFrame = null;
}

export function subscribeInspectionDom(listener: InspectionDomListener) {
  listeners.add(listener);
  start();
  listener();
  return () => {
    listeners.delete(listener);
    stop();
  };
}

export function scheduleInspectionDomSync() {
  schedule();
}
