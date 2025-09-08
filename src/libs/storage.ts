
export async function getStorageUsage(): Promise<{usage?:number; quota?:number}>{
  if (navigator.storage && (navigator.storage as any).estimate){
    try {
      const est = await navigator.storage.estimate();
      return { usage: est.usage, quota: est.quota };
    } catch { return {}; }
  }
  return {};
}
