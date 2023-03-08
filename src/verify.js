import fetch from 'node-fetch';
import { Principal } from '@dfinity/principal';
import { lebDecode, PipeArrayBuffer } from "@dfinity/candid";
import { Cbor, Certificate, lookup_path, reconstruct, hashTreeToString } from '@dfinity/agent';
import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from './declarations/ic-certified-blockchain/ic-certified-blockchain.did.js';
import { sha256 } from 'js-sha256';

// Install the global browser compatible fetch.
global.fetch = fetch;

const IC_ROOT_KEY = new Uint8Array([48, 129, 130, 48, 29, 6, 13, 43, 6, 1, 4, 1, 130, 220, 124, 5, 3, 1, 2, 1, 6, 12, 43, 6, 1, 4, 1, 130, 220, 124, 5, 3, 2, 1, 3, 97, 0, 129, 76, 14, 110, 199, 31, 171, 88, 59, 8, 189, 129, 55, 60, 37, 92, 60, 55, 27, 46, 132, 134, 60, 152, 164, 241, 224, 139, 116, 35, 93, 20, 251, 93, 156, 12, 213, 70, 217, 104, 95, 145, 58, 12, 11, 44, 197, 52, 21, 131, 191, 75, 67, 146, 228, 103, 219, 150, 214, 91, 155, 180, 203, 113, 113, 18, 248, 71, 46, 13, 90, 77, 20, 80, 95, 253, 116, 132, 176, 18, 145, 9, 28, 95, 135, 185, 136, 131, 70, 63, 152, 9, 26, 11, 170, 174]);

const canisterIds = new Map();

canisterIds.set('A', '6nlm3-giaaa-aaaae-qaepq-cai');
canisterIds.set('B', '3nump-2aaaa-aaaae-qaesa-cai');

const url = "https://ic0.app";

export const createActor = (idlFactory, canisterId, options) => {
  let agentOptions = options ? {...options.agentOptions} : {};
  const agent = new HttpAgent(agentOptions);
  return Actor.createActor(idlFactory, {
    agent,
    canisterId,
    ...(options ? options.actorOptions : {}),
  });
};

function toHex(buffer) { // buffer is an ArrayBuffer
  return [...new Uint8Array(buffer)]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');
}

const hexRe = new RegExp(/^([0-9A-F]{2})*$/i);

function fromHex(hex) {
    if (!hexRe.test(hex)) {
        throw new Error('Invalid hexadecimal string.');
    }
    const buffer = [...hex]
        .reduce((acc, curr, i) => {
        // tslint:disable-next-line:no-bitwise
        acc[(i / 2) | 0] = (acc[(i / 2) | 0] || '') + curr;
        return acc;
    }, [])
        .map(x => Number.parseInt(x, 16));
    return new Uint8Array(buffer).buffer;
}

function isBufferEqual(a, b) {
  if (a.byteLength !== b.byteLength) {
    return false;
  }
  const a8 = new Uint8Array(a);
  const b8 = new Uint8Array(b);
  for (let i = 0; i < a8.length; i++) {
    if (a8[i] !== b8[i]) {
      return false;
    }
  }
  return true;
}

function toBEBytesUint32 (num) {
  return new Uint8Array([
    (num & 0xff000000) >> 24,
    (num & 0x00ff0000) >> 16,
    (num & 0x0000ff00) >> 8,
    (num & 0x000000ff)
  ]);
}

async function getCertificateDate(block, canisterId) {
  let canisterIdPrincipal = Principal.fromText(canisterId);
  const cert = await Certificate.create({
      certificate: block.certificate,
      canisterId: canisterIdPrincipal,
      rootKey: IC_ROOT_KEY,
  });
  const time = cert.lookup(["time"]);
  return new Date(Number(lebDecode(new PipeArrayBuffer(time)) / BigInt(1000000)));
}

function getBlockEntryIndex(block, entry) {
  for (var i in block.data) {
    if (isBufferEqual(entry, block.data[i])) {
      return i;
    }
  }
  return -1;
}

function getBlockEntryIndexFromHash(block, hash) {
  for (var i in block.data) {
    if (isBufferEqual(hash, new Uint8Array(fromHex(sha256(block.data[i]))))) {
      return i;
    }
  }
  return -1;
}

async function verifyIcCertifiedBlockChainEntry(block, entry_index, canisterId, rootKey = IC_ROOT_KEY) {
  let entry = block.data[entry_index];
  let caller = block.callers[entry_index];
  entry_index = toBEBytesUint32(entry_index);
  const canisterIdPrincipal = Principal.fromText(canisterId);
  let cert;
  try {
    cert = await Certificate.create({
      certificate: block.certificate,
      canisterId: canisterIdPrincipal,
      rootKey: rootKey,
    });
  } catch (error) {
    console.log('Certificate verification failed', error);
    return false;
  }
  const certifiedData = cert.lookup([
    "canister", canisterIdPrincipal.toUint8Array(), "certified_data"]);
  const block_tree = Cbor.decode(block.tree);
  const reconstructed = await reconstruct(block_tree);

  if (!isBufferEqual(certifiedData, reconstructed)) {
    console.log('CertifiedData does not match tree hash');
    return false;
  }
  let certified_entry_hash = lookup_path(["certified_blocks", entry_index], block_tree);
  let caller_entry = new Uint8Array(concat(new Uint8Array(fromHex(sha256(caller.toUint8Array()))), new Uint8Array(fromHex(sha256(entry)))));
  const entry_hash = new Uint8Array(fromHex(sha256(caller_entry)));
  certified_entry_hash = new Uint8Array(certified_entry_hash);
  if (!isBufferEqual(certified_entry_hash, entry_hash)) {
    console.log('Certified block entry hash does not match block entry hash');
    return false;
  }
  return true;
}

function concat(...buffers) {
  const result = new Uint8Array(buffers.reduce((acc, curr) => acc + curr.byteLength, 0));
  let index = 0;
  for (const b of buffers) {
    result.set(new Uint8Array(b), index);
    index += b.byteLength;
  }
  return result.buffer;
}

// Returns null or [block_index, entry_index, date].
async function getAndVerifyCertifiedBlockChainEntry(entry, canisterId) {
  const agent = new HttpAgent();
  let hash = new Uint8Array(fromHex(sha256(entry)));
  let block_index = actor.find(hash);
  if (block_index.length < 1) {
    return undefined;
  }
  block_index = block_index[0];
  let block = await actor.get_block(block_index[0]);
  let entry_index = getBlockEntryIndex(block, entry);
  if (entry_index < 0) {
    return undefined;
  }
  if (!await verifyIcCertifiedBlockChainEntry(block, entry_index, canisterId)) {
    return undefined;
  }
  return [block_index, entry_index, await getCertifiedDate(block, canisterId)];
}

function printBlock(block) {
  let block_certificate = Cbor.decode(block.certificate);
  console.log('certificate tree', hashTreeToString(block_certificate.tree));
  console.log('certificate signature', toHex(block_certificate.signature));
  console.log('block tree', hashTreeToString(Cbor.decode(block.tree)));
  console.log('data', block.data.map((x) => toHex(x)));
  console.log('callers', block.callers.map((x) => x.toText()));
  console.log('preivous_hash', toHex(block.previous_hash));
}

export async function getAndPrintBlockContainingEntry(entry, canisterId) {
  const agent = new HttpAgent();
  let hash = new Uint8Array(fromHex(sha256(entry)));
  let block_index = actor.find(hash);
  if (block_index.length < 1) {
    return undefined;
  }
  block_index = block_index[0];
  let block = await actor.get_block(block_index[0]);
  printBlock(block);
}

let key;
if (process.argv[2]) {
  key = process.argv[2];
} else {
  console.log('Usage: node verify.js <key> (e.g. A_3_8_eb805391933c1de0d69a22b250e524b4b716e908d3adb598fe5a750da8128a08');
  process.exit(1);
}

const keyRe = new RegExp(/([A-Z])_([0-9]+)_([0-9]+)_([A-Za-z0-9]+)/);
let matches = keyRe.exec(key);
let canister = matches[1];
let block_index = Number(matches[2]);
let entry_index = Number(matches[3]);
let hash = matches[4];

let actor = createActor(idlFactory, canisterIds.get(canister), { agentOptions: { host: url }});

let hash_bytes = new Uint8Array(fromHex(hash));
let hash_block_index = await actor.find(hash_bytes);
if (hash_block_index.length < 1) {
  console.log('error: hash', hash, 'not found');
  process.exit(1);
}
hash_block_index = hash_block_index[0];
if (hash_block_index != block_index) {
  console.log('error: block index', block_index, 'does not match', hash, 'block index', hash_block_index);
  process.exit(1);
}
let block = await actor.get_block(block_index);
let hash_entry_index = getBlockEntryIndexFromHash(block, hash_bytes);
if (hash_entry_index.length < 1) {
  console.log('error: hash', hash, 'not found in block');
  process.exit(1);
}
console.log(hash_entry_index);
hash_entry_index = hash_entry_index[0];
if (hash_entry_index != entry_index) {
  console.log('error: entry index', entry_index, 'does not match', hash, 'entry index', hash_entry_index);
  process.exit(1);
}

printBlock(block);

if (!await verifyIcCertifiedBlockChainEntry(block, entry_index, canisterIds.get(canister))) {
  console.log('block does not verify');
  process.exit(1);
}
console.log('Internet Computer NNS Public Key Signature Chain Verified at time:', await getCertificateDate(block, canisterIds.get((canister))));
console.log('Block and Entry Verified!');
