// 全局游戏实例引用（供 UI 调用）
export const G = { game: null }
if (import.meta.env.DEV) window.__G = G
