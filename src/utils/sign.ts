import { utf8ToBytes } from '@noble/hashes/utils';
import elliptic from 'elliptic';
import { poseidon2 } from 'poseidon-lite';
import { hashToFieldBN254Fr } from './hashToField';

const EC = elliptic.ec;
const ec = new EC('p256'); // ECDSA P-256 (secp256r1)

const DST_BN254_Fr = 'QUUX-V01-CS02-with-BN254Fr_XMD:SHA-256_SSWU_RO_';

const hashUtf8ToField = (msg: string): bigint =>
  hashToFieldBN254Fr(utf8ToBytes(msg), utf8ToBytes(DST_BN254_Fr), 1)[0];

const hashBytesToField = (msg: Uint8Array): bigint =>
  hashToFieldBN254Fr(msg, utf8ToBytes(DST_BN254_Fr), 1)[0];

export interface KeyPair {
  privateKey: string[];
  publicKey: {
    x: string[];
    y: string[];
  };
}

export interface PublicKey {
  x: number[];
  y: number[];
}

export interface Signature {
  r: number[];
  s: number[];
}

export interface SignatureWithHash extends Signature {
  hashedNonce: string;
}

export interface UserPublicKeyResult {
  userPk: bigint;
  contextField: bigint;
}

export interface SignResult {
  header: bigint;
  root: bigint;
  pathElements: bigint[][];
  pathIndices: number[][];
  publicKey: PublicKey;
  signature: Signature;
}

export interface SignPairsResult extends SignResult {
  fieldElements: bigint[][];
}

// Browser-compatible base64url encode
export function base64urlEncode(input: string | number | Uint8Array): string {
  let buf: Uint8Array;
  if (typeof input === 'string') {
    buf = utf8ToBytes(input);
  } else if (typeof input === 'number') {
    buf = new Uint8Array(4);
    new DataView(buf.buffer).setUint32(0, input, false);
  } else {
    buf = new Uint8Array(input);
  }
  
  const base64 = btoa(String.fromCharCode(...buf));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function genKey(): KeyPair {
  const keyPair = ec.genKeyPair();
  const privateKey = keyPair.getPrivate();
  const publicKey = keyPair.getPublic();

  const pubXArray = publicKey.getX();
  const pubYArray = publicKey.getY();

  return {
    privateKey: privateKey.toArray('be').map((b) => `0x${b.toString(16).padStart(2, '0')}`),
    publicKey: {
      x: pubXArray.toArray('be').map((b) => `0x${b.toString(16).padStart(2, '0')}`),
      y: pubYArray.toArray('be').map((b) => `0x${b.toString(16).padStart(2, '0')}`),
    },
  };
}

// Browser-compatible random generation
export function genUsk(): bigint {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes); // Web Crypto API
  return hashBytesToField(randomBytes);
}

function pointCompress(point: PublicKey): Uint8Array {
  const out = new Uint8Array(point.x.length + 1);
  out[0] = 2 + (point.y[point.y.length - 1] & 1);
  out.set(point.x, 1);
  return out;
}

export function genUpk(
  userSk: string | bigint,
  devicePk: PublicKey,
  context: string
): UserPublicKeyResult {
  const devicePkCompressed = pointCompress(devicePk);
  const devicePkField1 = BigInt(
    `0x${Array.from(devicePkCompressed.slice(0, 31)).map(b => b.toString(16).padStart(2, '0')).join('')}`
  );
  const devicePkField2 = BigInt(
    `0x${Array.from(devicePkCompressed.slice(31, 33)).map(b => b.toString(16).padStart(2, '0')).join('')}`
  );
  const contextField = hashUtf8ToField(context);

  const devicePkField = poseidon2([devicePkField1, devicePkField2]);
  const userDeviceSk = poseidon2([userSk, devicePkField]);
  const userPk = poseidon2([userDeviceSk, contextField]);

  return { userPk, contextField };
}

// Browser-compatible SHA-256
async function sha256Hash(data: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', data));
}

function signCore(userSk: number[], hash: Uint8Array): SignatureWithHash {
  const keyPair = ec.keyFromPrivate(userSk);
  const signature = keyPair.sign(hash);

  // low-s normalize
  const n = ec.curve.n;
  if (signature.s.cmp(n.shrn(1)) > 0) {
    signature.s = n.sub(signature.s);
  }

  return {
    r: signature.r.toArray('be', 32),
    s: signature.s.toArray('be', 32),
    hashedNonce: Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join(''),
  };
}

export async function signBytes(userSk: number[], bytes: Uint8Array): Promise<SignatureWithHash> {
  const hash = await sha256Hash(bytes);
  return signCore(userSk, hash);
}

export async function signUtf8(userSk: number[], utf8String: string): Promise<SignatureWithHash> {
  const hash = await sha256Hash(utf8ToBytes(utf8String));
  return signCore(userSk, hash);
}

function hashJsonValue(value: string | number): bigint {
  if (typeof value === 'string') {
    return hashUtf8ToField(value);
  } else if (typeof value === 'number') {
    return BigInt(value);
  }
  throw new Error('Unsupported value type for hashing');
}

export async function issueJwp(
  issuerSk: number[],
  header: string,
  userPk: string,
  pairs: (string | number)[][]
): Promise<string> {
  const headerB64 = base64urlEncode(header);
  const headerField = hashUtf8ToField(headerB64);

  const payloadB64 = pairs.map((pair) => `${base64urlEncode(JSON.stringify(pair))}`).join('~');

  const pairsField = pairs.map((pair) => pair.map(hashJsonValue));
  const leaves = pairsField.map((pair) => poseidon2(pair));

  const pad = poseidon2([0, 0]);
  const nextPow2 = (n: number): number => 1 << (32 - Math.clz32(n - 1));
  const paddedLeaves = leaves.slice();
  const targetLength = nextPow2(leaves.length);
  while (paddedLeaves.length < targetLength) {
    paddedLeaves.push(pad);
  }
  const levels = [paddedLeaves];

  while (levels[0].length > 1) {
    const currentLevel = levels[0];
    const upperLevel: bigint[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      upperLevel.push(poseidon2([currentLevel[i], currentLevel[i + 1]]));
    }
    levels.unshift(upperLevel);
  }

  const root = levels[0][0];

  // Decode base64url userPk to bigint
  const userPkDecoded = userPk.replace(/-/g, '+').replace(/_/g, '/');
  const userPkBytes = Uint8Array.from(atob(userPkDecoded), c => c.charCodeAt(0));
  const userPkBigint = BigInt(`0x${Array.from(userPkBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`);

  // SHA256
  const toBeHashed = poseidon2([poseidon2([headerField, userPkBigint]), root]);
  const toBeHashedHex = toBeHashed.toString(16).padStart(64, '0');
  const toBeHashedBytes = new Uint8Array(toBeHashedHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  const toBeSigned = await sha256Hash(toBeHashedBytes);

  // ECDSA
  const keyPair = ec.keyFromPrivate(issuerSk);
  const signature = keyPair.sign(toBeSigned);

  // low-s normalize
  const n = ec.curve.n;
  if (signature.s.cmp(n.shrn(1)) > 0) {
    signature.s = n.sub(signature.s);
  }

  const rArray = signature.r.toArray('be', 32);
  const sArray = signature.s.toArray('be', 32);
  const signatureBytes = new Uint8Array([...rArray, ...sArray]);
  const signatureB64 = base64urlEncode(signatureBytes);

  return `${headerB64}.${payloadB64}.${signatureB64}`;
}
