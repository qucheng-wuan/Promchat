/// <reference types="vite/client" />

// 全局对象类型定义
interface Window {
  // 在这里添加window的自定义属性
}

// 自定义事件类型
interface CustomEventMap {
  themeChanged: CustomEvent<{ theme: string }>;
}

// 扩展EventTarget接口，添加自定义事件
declare global {
  interface Document {
    addEventListener<K extends keyof CustomEventMap>(
      type: K,
      listener: (this: Document, ev: CustomEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions
    ): void;
    removeEventListener<K extends keyof CustomEventMap>(
      type: K,
      listener: (this: Document, ev: CustomEventMap[K]) => void,
      options?: boolean | EventListenerOptions
    ): void;
    dispatchEvent<K extends keyof CustomEventMap>(ev: CustomEventMap[K]): boolean;
  }
} 