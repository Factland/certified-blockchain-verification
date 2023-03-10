# Factland Certified Blockchain Verification

Instructions and tools to download and verify Factland certified blockchain data.

## Quick Start TL;DR

Install nodejs: https://nodejs.org/en/download/

Clone the repsitory:

```bash
% git clone https://github.com/Factland/certified-blockchain-verification.git
```

verify::

```bash
% ./verify.sh B_2_0_fbaa85233700a8ed1795abe1b11ce7b78c102b953cab07871f49b3fefed40397
```

### OSX

You may need to install git [how to install git on a mac](https://git-scm.com/download/mac).

You may need to install xcode:

```bash
xcode-select --install
```

## The Data

Factland data is stored on the [Internet Computer](https://internetcomputer.org) in a canister smart contract:

* **Production Canister ID:** 6nlm3-giaaa-aaaae-qaepq-cai
* **Staging Canister ID:** 3nump-2aaaa-aaaae-qaesa-cai
* **Source Code:** https://github.com/Factland/ic-certified-blockchain.git
* **Dashboard URL:** https://dashboard.internetcomputer.org/canister/6nlm3-giaaa-aaaae-qaepq-cai

Each adjudicated claim is stored as JSON with fields:

* **title** The title of the claim that was adjudicated.
* **text** The text body of the claim that was adjudicated.
* **date** The date of the adjudicated.
* **jurySize** The size of the Jury that made the adjudication.
* **ruling** The ruling:
  * *undecided* The jury was unable to come to a decision.
  * *true* The jury ruled that the claim was true.
  * *false* The jury ruled that the claim was false.

## Blocks

Factland data is stored in blockchain with each block containing a hash of the previous block
and a set of entries.  The record of each adjudication claim occupies a single entry of a block.
Entries may be located by block and entry number or by a hash of the contents via a `find` function
from `hash` to block number after which the entry can be found by linear search.  The schema of the
blockchain and the methods available on the canister smart contract are detailed in the
[API](https://github.com/Factland/ic-certified-blockchain/blob/main/ic_certified_blockchain.did).

## IC Blockchain Key

Each adjudicated claim has a key assocated with it which appears in the Factland app.  The key has the form:

`B_2_0_fbaa85233700a8ed1795abe1b11ce7b78c102b953cab07871f49b3fefed40397`

where the `B_` prefix indicates that this is a staging adjudicated claim, the `2_0_` indicates that the
record of this claim is in block `2` entry `0`.  The suffix `fbaa85233700a8ed1795abe1b11ce7b78c102b953cab07871f49b3fefed40397`
is the hash (SHA256) of the record.

## Block and Record Verification

The data is stored in blocks which are certified by the Internet Computer NNS public key via
a delegation to the subnet and then the canister smart contract.  This certification chain canister
be verified offline by retriving the data and checking the signatures and Merkle tree of entry hashes.

### Installation

The verification code is written in javascript for nodejs and requires a nodejs installation,
download of this code and installation of the dependencies:

```bash
% git clone https://github.com/Factland/certified-blockchain-verification.git
% cd src
% npm i
```

### Printing Blocks

Blocks can be printed (in the src directory) by executing:

```bash
% node print_block.js 0
```

This will produce output like:

```
{
  certificate: 'd9d9f7a3647472656583018301830183024863616e6973746572830182045820e09f2cef0ae5b419c2df4ae6142c5b22d8a0f415059255bd8e3fb4dd6360e256830182045820b01b2960dd048ec1f53773d78d80b01592635084eb1b15e829132032e45e86cb8301820458202604790b69b2172fa87e6e174fc5df50fc10c35a0a0c544d25ae964ed5e6e4d4830182045820ec04bba498a949a19c5425f51be3f850a06b69ef35f2b6984ba754e850eb22b683024a0000000000900124010183018301830183024e6365727469666965645f64617461820358205f6cb6d4a350d6e739e4e56a6883f736ca86f8daf5b9b4c23d0e7c187acd485d8204582083c56bf14dde3d28de66c692b5fc9d97e9dd985b6ad72b0fe6f84e8a8df3dcb2820458207d574681d46f6f3f10b55d81be300a186963df4de0dfe94765fb5d4001e7a20182045820df2c71e9f564b5f15e63b526dd6f52355756ca96917b620545c0f79407462817820458208c30514f981ff9be529a1943be0b10cbc583b6293b334074c71fe5bce395434282045820b363b5ab2cdd74f0f078a543c2dd68d38451934898fa7122437af80da5d0b920830182045820cc578109fc5dbde591cf79cb3fa6326cdccdd9fa88ea27592ca888824366afe383024474696d65820349ba83ab8ce693d3a017697369676e61747572655830ae4cd43764a619418a29ad07f9bea0eb88ee8a18e6efed67db364dd2fa9ba7d5b94df6494e70b7eac66676809fce39746a64656c65676174696f6ea2697375626e65745f6964581d2d030caf397e446c03cece4fd072acce432c75b6a700592e73f5d133026b6365727469666963617465590257d9d9f7a264747265658301820458208361d130f8b40c117cd43ca9f6c9772b427fffef8028c3578368b722907eca4c83018302467375626e657483018301830183018204582035bc207266aa1f9a1b4eea393efe91ae33ed4ce77069ed8e881d86716adf7b6b830182045820f8c3eae0377ee00859223bf1c6202f5885c4dcdc8fd13b1d48c3c838688919bc8301820458209022b3b0e42f9dcaf1a3c6a621e62d4fd749eef6af3bed0c0a39f48c7ef4fd998302581d2d030caf397e446c03cece4fd072acce432c75b6a700592e73f5d13302830183024f63616e69737465725f72616e6765738203581bd9d9f781824a000000000090000001014a00000000009fffff010183024a7075626c69635f6b657982035885308182301d060d2b0601040182dc7c0503010201060c2b0601040182dc7c05030201036100805230c2da9687218fdfa49bddab093578c2e8a10b27d69fdda097f286abccdae2541c711e3ca771202bfc9b366bf61b17e9f1173d7c9a6eaaa907ccdba3bc86764bc1d552437c4948038e1018a9c49e444189cd55358e37a6f879d88c0a269382045820028fc5e5f70868254e7215e7fc630dbd29eefc3619af17ce231909e1faf97e9582045820a7f251951eed726811460449388214773c94153c758afe3aaa54f9b51704268682045820df1124435df1c9bae1f1344ef3fda6a60f8faf7d06720e35f01349d8a64fc96483024474696d65820349b8d190ac9197d89f17697369676e61747572655830a5af06a2ce8b8017c40a8e2bd8c00ac9cc204dda63af71cc4ab8e064db57f4966d98925139e746db1926aa6c7ccae355',
  tree: 'd9d9f78302506365727469666965645f626c6f636b73830183018301830244000000008203582005dd7c071fd74ee5eb03db998c402f14eb1b304a0778d7307c86599c9dcec16283018302440000000182035820d8f8743deafd50b221bb9db707b4e0d116c1c1a494b989ea684c63369bf596558302440000000282035820cb7e0d0cdc9329492e85aae26fcc57d1109dc85252f440ef1dff9af7ea639ac483018302440000000382035820c10796db92ccd2b846255ae8a8618625a04a7304346ec09ef13657742f932423830183024400000004820358201e6d6f88aff10c6a353e78f932f07b8ea8fbb24ef60b6d525ff471255921b046830183024400000005820358204c703f642fe228a210e12de68dc9cd7400822800b06dacd9ab05c2283bd0954b830244000000068203582006ffbda5446c54d214c2bc74e527a07497ee777cc69fff4391fc62f7e0c9aab583018302440000000782035820c2115e945cca2081ec3e6f83bb16716b1fa244659a51229b9a9679cd6ace53af83018301830244000000088203582040998bf1910e1d2751cdc1e6c48009d564ebbfe03b51edc59e8a2f3c22091855830183024400000009820358204c9e2378371353b5c33dd75c45c6112b32899a9764d06323aa570df70c5c0fab8302440000000a820358208248fdb4617d3ce77172874fe945d38e2abd84027652250ee3ae585b26e15f4a83018302440000000b8203582058a38588732eb6c01a599336c077daec4f6ddb63efa084e375e7578228d81b15830183018302440000000c82035820dcc8955b7f53054c7682314306784cc5c16014755e051a8026cd130c7bdde3e483018302440000000d82035820080bb8248d2219b608af41eb7ec1fc51e422005232de7cdc0edc1cc65b61897f8302440000000e82035820d2438644257a98a4d4fb01c12baba1990aa6f8cc62811fcfeb514b32395f200f83018302440000000f82035820ba0cca5fd48d7dafb4e9688ddbc3db85693b5e3f4d7fe3585a3147178a68d9cf83018302440000001082035820aaf5d33ca69e58aa364e9060f59f24476db1cabf0aa39d8b0ff1df70e459b7fc83024d70726576696f75735f68617368820358200000000000000000000000000000000000000000000000000000000000000000',
  data: [
   '{"title":"Changes now live on staging. Does it work?","text":"Bleep","date":"2023-01-17T22:03:04.905Z","jurySize":0,"ruling":"undecided"}',
   '{"title":"FAA network outage caused recent Bitcoin price spike","text":"Source of the claim: FOX News pundit Tucker Carlson.\\n\\nTheory: The FAA’s computer systems went down on January 11th reportedly due to a network outage caused by a corrupt file. Since then, the price of Bitcoin has jumped over 20%. Coincidence? Carlson doesn’t think so. He claims that the U.S government was secretly forced into paying a ransom using Bitcoin, causing the price to jump.\\n","date":"2023-02-02T20:59:04.790Z","jurySize":2,"ruling":"undecided"}',
   ],
   previous_hash: '0000000000000000000000000000000000000000000000000000000000000000'
}
```

The `certificate` is the signature chain from the Internet Computer NNS public key down to the root of the Merkle `tree` and includes the date of certification.  The `tree` is a Merkle tree containing a map from entry index to entry hash (SHA256).

### Verifiying Records

Records are verified by key, including block and entry numbers and hash:

```bash
% node verify.js B_2_0_fbaa85233700a8ed1795abe1b11ce7b78c102b953cab07871f49b3fefed40397
```

Correctly verfied blocks will report:

```
block and entry verified!
```
