import { sha256, sha384 } from '@noble/hashes/sha2';
import { concatBytes } from '@noble/hashes/utils';

function i2osp(value: number, length: number): Uint8Array {
  const res = new Uint8Array(length);
  for (let i = length - 1; i >= 0; i--) {
    res[i] = value & 0xff;
    value >>= 8;
  }
  return res;
}

function bytesToBigInt(bytes: Uint8Array): bigint {
  return bytes.reduce((acc, b) => (acc << 8n) + BigInt(b), 0n);
}

interface HashFunction {
  (data: Uint8Array): Uint8Array;
  outputLen: number;
  blockLen: number;
}

export function expandMessageXMD(
  H: HashFunction,
  msg: Uint8Array,
  dst: Uint8Array,
  lenInBytes: number
): Uint8Array {
  const bInBytes = H.outputLen;
  const sInBytes = H.blockLen;

  const ell = Math.ceil(lenInBytes / bInBytes);
  if (ell > 255 || lenInBytes > 65535 || dst.length > 255)
    throw new Error(
      'expand_message_xmd: ell > 255 or lenInBytes > 65535 or len(DST) > 255 not allowed'
    );

  const DSTPrime = concatBytes(dst, i2osp(dst.length, 1));
  const ZPad = new Uint8Array(sInBytes).fill(0);
  const lIBStr = i2osp(lenInBytes, 2);
  const msgPrime = concatBytes(ZPad, msg, lIBStr, new Uint8Array([0]), DSTPrime);

  const b0 = H(msgPrime);
  const b1 = H(concatBytes(b0, new Uint8Array([1]), DSTPrime));
  const output = [b1];

  for (let i = 2; i <= ell; i++) {
    const t = output[i - 2].map((x, j) => x ^ b0[j]);
    output.push(H(concatBytes(Uint8Array.from(t), new Uint8Array([i]), DSTPrime)));
  }

  return concatBytes(...output).slice(0, lenInBytes);
}

export function hashToField(
  H: HashFunction,
  L: number,
  msg: Uint8Array,
  count: number,
  dst: Uint8Array,
  p: bigint
): bigint[] {
  const lenInBytes = count * L;
  const pseudoRandomBytes = expandMessageXMD(H, msg, dst, lenInBytes);

  const elements: bigint[] = [];
  for (let i = 0; i < count; i++) {
    const chunk = pseudoRandomBytes.slice(i * L, (i + 1) * L);
    const num = bytesToBigInt(chunk) % p;
    elements.push(num);
  }
  return elements;
}

interface HashToFieldConfig {
  HASH: HashFunction;
  L: number;
  P: bigint;
}

const HASH_TO_FIELD_CONFIGS: Record<string, HashToFieldConfig> = {
  P256: {
    HASH: sha256,
    L: 48,
    P: BigInt('0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff'),
  },
  P384: {
    HASH: sha384,
    L: 72,
    P: BigInt(
      '0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffeffffffff0000000000000000ffffffff'
    ),
  },
  BN254: {
    HASH: sha256,
    L: 48,
    P: BigInt('21888242871839275222246405745257275088696311157297823662689037894645226208583'), // prime p
  },
  BN254R: {
    HASH: sha256,
    L: 48,
    P: BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617'), // prime r (not p)
  },
  BLS12381G1: {
    HASH: sha256,
    L: 48,
    P: BigInt('0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001'),
  },
};

export function hashToFieldWithConfig(
  config: HashToFieldConfig,
  msg: Uint8Array,
  dst: Uint8Array,
  count: number
): bigint[] {
  return hashToField(config.HASH, config.L, msg, count, dst, config.P);
}

export function hashToFieldP256(msg: Uint8Array, dst: Uint8Array, count: number = 1): bigint[] {
  return hashToFieldWithConfig(HASH_TO_FIELD_CONFIGS.P256, msg, dst, count);
}

export function hashToFieldP384(msg: Uint8Array, dst: Uint8Array, count: number = 1): bigint[] {
  return hashToFieldWithConfig(HASH_TO_FIELD_CONFIGS.P384, msg, dst, count);
}

export function hashToFieldBN254(msg: Uint8Array, dst: Uint8Array, count: number = 1): bigint[] {
  return hashToFieldWithConfig(HASH_TO_FIELD_CONFIGS.BN254, msg, dst, count);
}

export function hashToFieldBN254Fr(msg: Uint8Array, dst: Uint8Array, count: number = 1): bigint[] {
  return hashToFieldWithConfig(HASH_TO_FIELD_CONFIGS.BN254R, msg, dst, count);
}

export function hashToFieldBLS12381G1(
  msg: Uint8Array,
  dst: Uint8Array,
  count: number = 1
): bigint[] {
  return hashToFieldWithConfig(HASH_TO_FIELD_CONFIGS.BLS12381G1, msg, dst, count);
}
