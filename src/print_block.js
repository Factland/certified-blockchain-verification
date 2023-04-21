import fetch from 'node-fetch';
import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from './declarations/ic-certified-blockchain/ic-certified-blockchain.did.js';

// Install the global browser compatible fetch.
global.fetch = fetch;

const canisterIds = new Map();
canisterIds.set('A', '6nlm3-giaaa-aaaae-qaepq-cai'); // Production
canisterIds.set('B', '3nump-2aaaa-aaaae-qaesa-cai'); // Staging

const url = "https://ic0.app";

function toHex(buffer) { // buffer is an ArrayBuffer
	return [...new Uint8Array(buffer)]
		.map(x => x.toString(16).padStart(2, '0'))
		.join('');
}

function blockToHex(block) {
	return {
		certificate: toHex(block.certificate),
		tree: toHex(block.tree),
		data: block.data.map(x => new TextDecoder().decode(x)),
		previous_hash: toHex(block.previous_hash)
	};
}

export const createActor = (idlFactory, canisterId, options) => {
	let agentOptions = options ? {...options.agentOptions} : {};
	const agent = new HttpAgent(agentOptions);
	return Actor.createActor(idlFactory, {
		agent,
		canisterId,
		...(options ? options.actorOptions : {}),
	});
};

let block_number = 0;
let canister = 'A';
if (process.argv[2]) {
  const keyRe = new RegExp(/([A-Z])([0-9]+)/);
  let matches = keyRe.exec(process.argv[2]);
  canister = matches[1];
  block_number = Number(matches[2]);
} else {
  console.log('Usage: node print_block.js 0');
  process.exit(1);
}

// Now for the actual test
let actor = createActor(idlFactory, canisterIds.get(canister), { agentOptions: { host: url }});

let block = await actor.get_block(block_number);
console.log(blockToHex(block));
