declare global {
  interface Window {
    // 任何想要添加到window的全局类型
  }

  // 确保DOM API可用
  // 这会使得ESLint在浏览器环境下不会对Document、setTimeout等API报错
  const document: Document;
  const setTimeout: typeof globalThis.setTimeout;
  const clearTimeout: typeof globalThis.clearTimeout;
  const setInterval: typeof globalThis.setInterval;
  const clearInterval: typeof globalThis.clearInterval;
  class Event {}
  class CustomEvent<T = any> extends Event {
    constructor(typeArg: string, eventInitDict?: CustomEventInit<T>);
    readonly detail: T;
  }
  interface EventListenerOptions {}
  interface AddEventListenerOptions extends EventListenerOptions {}
  type EventListener = (event: Event) => void;
} 