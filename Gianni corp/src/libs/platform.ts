
export const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
export const isStandalone = () => (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (window.navigator as any).standalone;
