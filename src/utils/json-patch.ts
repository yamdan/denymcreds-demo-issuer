export interface PatchOperation {
  op: 'add';
  path: string;
  value: string | number;
}

function setValueAtPath(obj: Record<string, unknown>, path: string, value: string | number): void {
  if (!path.startsWith('/')) {
    throw new Error('Path must start with "/"');
  }
  
  const parts = path.slice(1).split('/').filter(part => part !== '');
  
  if (parts.length === 0) {
    throw new Error('Cannot set root value');
  }
  
  let current: Record<string, unknown> = obj;
  
  // Navigate to the parent of the target, creating intermediate objects as needed
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    
    if (!(part in current)) {
      current[part] = {};
    } else if (typeof current[part] !== 'object' || current[part] === null) {
      // If the property exists but is not an object, replace it with an object
      current[part] = {};
    }
    
    current = current[part] as Record<string, unknown>;
  }
  
  // Set the final value
  const finalKey = parts[parts.length - 1];
  current[finalKey] = value;
}

export function applyJsonPatch(document: Record<string, unknown>, pairs: [string, string | number][]): Record<string, unknown> {
  // Deep clone the document to avoid mutating the original
  const result = JSON.parse(JSON.stringify(document));
  
  // Apply each patch operation
  for (const [path, value] of pairs) {
    try {
      setValueAtPath(result, path, value);
    } catch (error) {
      console.warn(`Failed to apply patch for path "${path}":`, error);
      // Continue with other patches even if one fails
    }
  }
  
  return result;
}
