export type Language = 'ja' | 'en';

export interface Translations {
  // Header
  title: string;
  subtitle: string;
  
  // Sections
  issuerKeySection: string;
  headerSection: string;
  userPkSection: string;
  payloadSection: string;
  resultSection: string;
  
  // Issuer Key Section
  generateRandomKey: string;
  manualKeyInput: string;
  hexStringFormat: string;
  numberArrayFormat: string;
  privateKeyInput: string;
  jwkDisplay: string;
  generateJwk: string;
  
  // Header Section
  jsonInput: string;
  autoRemoveWhitespace: string;
  formatJson: string;
  jsonPreview: string;
  
  // User PK Section
  userSk: string;
  devicePk: string;
  devicePkX: string;
  devicePkY: string;
  context: string;
  generateUserPk: string;
  userPkResult: string;
  currentUserPk: string;
  userPkInput: string;
  invalidUserPkJwk: string;
  contextMismatch: string;
  
  // Payload Section
  addPair: string;
  removePair: string;
  path: string;
  value: string;
  jsonPatchPreview: string;
  patchedJson: string;
  
  // Result Section
  generateJwp: string;
  generating: string;
  jwpResult: string;
  copyToClipboard: string;
  
  // Messages
  fillAllFields: string;
  jwpGenerationError: string;
  copied: string;
  invalidJson: string;
  invalidPrivateKey: string;
  
  // Language
  language: string;
  japanese: string;
  english: string;
}

const translations: Record<Language, Translations> = {
  ja: {
    // Header
    title: 'DenymCreds Issuerデモ',
    subtitle: 'JWP (JSON Web Proof) 風の証明書発行のデモ',
    
    // Sections
    issuerKeySection: 'Issuer秘密鍵',
    headerSection: 'ヘッダー',
    userPkSection: 'ユーザー公開鍵',
    payloadSection: 'ペイロード',
    resultSection: '結果',
    
    // Issuer Key Section
    generateRandomKey: 'ランダム生成',
    manualKeyInput: '手動入力',
    hexStringFormat: '16進数文字列',
    numberArrayFormat: '数値配列',
    privateKeyInput: '秘密鍵入力',
    jwkDisplay: 'JWK表示',
    generateJwk: 'JWK生成',
    
    // Header Section
    jsonInput: 'JSON入力',
    autoRemoveWhitespace: '空白・改行を自動削除',
    formatJson: 'JSON整形',
    jsonPreview: 'プレビュー',
    
    // User PK Section
    userSk: 'ユーザー秘密鍵',
    devicePk: 'デバイス公開鍵',
    devicePkX: 'デバイス公開鍵 X',
    devicePkY: 'デバイス公開鍵 Y',
    context: 'コンテキスト',
    generateUserPk: '仮名公開鍵生成',
    userPkResult: 'ユーザー公開鍵結果',
    currentUserPk: 'ユーザーの仮名公開鍵',
    userPkInput: 'ユーザー公開鍵JWK入力',
    invalidUserPkJwk: '無効なユーザー公開鍵JWK形式です',
    contextMismatch: 'JWKのコンテキスト(c)がヘッダーのiss値と一致しません',
    
    // Payload Section
    addPair: 'ペア追加',
    removePair: '削除',
    path: 'パス',
    value: '値',
    jsonPatchPreview: 'JSON Patch適用後プレビュー',
    patchedJson: '',
    
    // Result Section
    generateJwp: 'JWP生成',
    generating: 'JWP生成中...',
    jwpResult: 'JWP結果',
    copyToClipboard: 'クリップボードにコピー',
    
    // Messages
    fillAllFields: 'すべてのフィールドを入力してください',
    jwpGenerationError: 'JWP生成中にエラーが発生しました',
    copied: 'コピーしました',
    invalidJson: '無効なJSON形式です',
    invalidPrivateKey: '無効な秘密鍵形式です',
    
    // Language
    language: '言語',
    japanese: '日本語',
    english: 'English',
  },
  
  en: {
    // Header
    title: 'DenymCreds Issuer Demo',
    subtitle: 'Web demo app for issuing JWP-like credentials using DenymCreds Issuer',
    
    // Sections
    issuerKeySection: 'Issuer Private Key',
    headerSection: 'Header',
    userPkSection: 'User Public Key',
    payloadSection: 'Payload',
    resultSection: 'Result',
    
    // Issuer Key Section
    generateRandomKey: 'Random Generation',
    manualKeyInput: 'Manual Input',
    hexStringFormat: 'Hex String',
    numberArrayFormat: 'Number Array',
    privateKeyInput: 'Private Key Input',
    jwkDisplay: 'JWK Display',
    generateJwk: 'Generate JWK',
    
    // Header Section
    jsonInput: 'JSON Input',
    autoRemoveWhitespace: 'Auto remove whitespace',
    formatJson: 'Format JSON',
    jsonPreview: 'Preview',
    
    // User PK Section
    userSk: 'User Private Key',
    devicePk: 'Device Public Key',
    devicePkX: 'Device Public Key X',
    devicePkY: 'Device Public Key Y',
    context: 'Context',
    generateUserPk: 'Generate User PK',
    userPkResult: 'User PK Result',
    currentUserPk: 'Current User PK',
    userPkInput: 'User Public Key JWK Input',
    invalidUserPkJwk: 'Invalid User Public Key JWK format',
    contextMismatch: 'JWK context (c) does not match header iss value',
    
    // Payload Section
    addPair: 'Add Pair',
    removePair: 'Remove',
    path: 'Path',
    value: 'Value',
    jsonPatchPreview: 'JSON Patch Preview',
    patchedJson: 'Patched JSON',
    
    // Result Section
    generateJwp: 'Generate JWP',
    generating: 'Generating JWP...',
    jwpResult: 'JWP Result',
    copyToClipboard: 'Copy to Clipboard',
    
    // Messages
    fillAllFields: 'Please fill in all fields',
    jwpGenerationError: 'An error occurred during JWP generation',
    copied: 'Copied',
    invalidJson: 'Invalid JSON format',
    invalidPrivateKey: 'Invalid private key format',
    
    // Language
    language: 'Language',
    japanese: '日本語',
    english: 'English',
  }
};

export function getTranslations(language: Language): Translations {
  return translations[language];
}
