export async function ensurePersistentStorage() {
  if (!('storage' in navigator)) return false as const;
  // @ts-ignore
  if (!navigator.storage || !navigator.storage.persist) return false as const;
  // @ts-ignore
  const already = await navigator.storage.persisted?.();
  if (already) return true as const;
  // @ts-ignore
  const granted = await navigator.storage.persist?.();
  return !!granted;
}

export async function getStorageEstimate() {
  // @ts-ignore
  if (!navigator?.storage?.estimate) return null;
  // @ts-ignore
  const { usage, quota } = await navigator.storage.estimate();
  return { usage: usage ?? 0, quota: quota ?? 0 };
}