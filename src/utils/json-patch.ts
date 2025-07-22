import * as jsonpatch from 'jsonpatch';

// JSON値として有効な型を定義
export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
export interface JsonObject {
  [key: string]: JsonValue;
}

export interface PatchOperation {
  op: 'add';
  path: string;
  value: JsonValue;
}

/**
 * JSON Pointerをパースする（RFC 6901準拠）
 */
function parseJsonPointer(pointer: string): string[] {
  if (pointer === '') return [];
  if (!pointer.startsWith('/')) {
    throw new Error('JSON Pointer must start with "/"');
  }
  
  return pointer.slice(1).split('/').map(token => {
    // RFC 6901: ~1 は / に、~0 は ~ にエスケープ解除
    // 順序が重要：~01 のような場合を正しく処理するため ~1 を先に処理
    return token.replace(/~1/g, '/').replace(/~0/g, '~');
  });
}

/**
 * JSON Pointerトークンをエスケープする
 */
function escapeJsonPointerToken(token: string): string {
  // RFC 6901: ~ を ~0 に、/ を ~1 にエスケープ
  // 順序が重要：~ を先に処理してから / を処理
  return token.replace(/~/g, '~0').replace(/\//g, '~1');
}


/**
 * パスが存在するかチェックする
 */
function pathExists(obj: JsonValue, path: string): boolean {
  try {
    const tokens = parseJsonPointer(path);
    let current: JsonValue = obj;
    
    for (const token of tokens) {
      if (Array.isArray(current)) {
        const index = parseInt(token, 10);
        if (isNaN(index) || index < 0 || index >= current.length) {
          return false;
        }
        current = current[index];
      } else if (current && typeof current === 'object' && current !== null) {
        const currentObj = current as JsonObject;
        if (!(token in currentObj)) {
          return false;
        }
        current = currentObj[token];
      } else {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * JSON Patchを適用する（中間ノードの自動生成付き）
 */
export function applyJsonPatch(document: JsonValue, pairs: [string, JsonValue][]): JsonValue {
  let result = JSON.parse(JSON.stringify(document));
  
  for (const [path, value] of pairs) {
    try {
      // 通常のJSON Patch適用を試行
      const patch = [{
        op: 'add',
        path,
        value
      }];
      
      result = jsonpatch.apply_patch(result, patch);
    } catch {
      // 失敗した場合は中間ノードを段階的に作成
      try {
        const tokens = parseJsonPointer(path);
        
        // 各中間パスを段階的にチェックして作成
        for (let i = 0; i < tokens.length; i++) {
          const partialPath = '/' + tokens.slice(0, i + 1).map(escapeJsonPointerToken).join('/');
          const nextToken = tokens[i + 1];
          
          if (i === tokens.length - 1) {
            // 最終的な値を設定
            try {
              result = jsonpatch.apply_patch(result, [{
                op: 'add',
                path: partialPath,
                value: value
              }]);
            } catch {
              // addが失敗した場合はreplaceを試行
              result = jsonpatch.apply_patch(result, [{
                op: 'replace',
                path: partialPath,
                value: value
              }]);
            }
          } else {
            // 中間ノードが存在しない場合のみ作成
            if (!pathExists(result, partialPath)) {
              const shouldCreateArray = nextToken && (/^\d+$/.test(nextToken) || nextToken === '-');
              const nodeValue = shouldCreateArray ? [] : {};
              
              try {
                result = jsonpatch.apply_patch(result, [{
                  op: 'add',
                  path: partialPath,
                  value: nodeValue
                }]);
              } catch {
                // 中間ノードの作成に失敗した場合はスキップ
                continue;
              }
            }
          }
        }
      } catch (createError) {
        console.warn(`Failed to apply patch for path "${path}":`, createError);
        // エラーが発生しても他のパッチの適用を続行
      }
    }
  }
  
  return result;
}

/**
 * 文字列値を適切な型にパースする（stringまたはnumberのみ）
 */
export function parseValue(valueStr: string): string | number {
  if (valueStr === '') return '';
  
  // 数値チェック
  if (/^\d+$/.test(valueStr)) return parseInt(valueStr, 10);
  if (/^-?\d+$/.test(valueStr)) return parseInt(valueStr, 10);
  if (/^-?\d+\.\d+$/.test(valueStr)) return parseFloat(valueStr);
  
  // その他はすべて文字列として扱う
  return valueStr;
}
