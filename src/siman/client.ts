type BridgeCall = (method: string, params?: any, timeout?: number) => Promise<any>;

export async function getSource(callBridge: BridgeCall): Promise<{ source: string; ok: boolean }> {
  const result = await callBridge("getSimanSource", {});
  return { source: result?.source ?? "", ok: result?.ok ?? false };
}

export async function getBlocks(callBridge: BridgeCall): Promise<any[]> {
  const result = await callBridge("getSimanBlocks", {});
  return result?.blocks ?? [];
}

export async function getMacros(callBridge: BridgeCall): Promise<any[]> {
  const result = await callBridge("getVbaMacros", {});
  return result?.macros ?? [];
}

export async function runMacro(callBridge: BridgeCall, macroName: string): Promise<boolean> {
  const result = await callBridge("runVbaMacro", { macroName });
  return result?.ok ?? false;
}
