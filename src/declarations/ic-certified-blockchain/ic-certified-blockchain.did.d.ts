import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export type Auth = { 'User' : null } |
  { 'Admin' : null };
export interface Authorization { 'id' : Principal, 'auth' : Auth }
export interface Block {
  'certificate' : Uint8Array,
  'data' : Array<Uint8Array>,
  'tree' : Uint8Array,
  'callers' : Array<Principal>,
  'previous_hash' : Uint8Array,
}
export interface _SERVICE {
  'authorize' : ActorMethod<[Principal, Auth], undefined>,
  'commit' : ActorMethod<[Uint8Array], [] | [bigint]>,
  'deauthorize' : ActorMethod<[Principal], undefined>,
  'find' : ActorMethod<[Uint8Array], [] | [bigint]>,
  'first' : ActorMethod<[], bigint>,
  'get_authorized' : ActorMethod<[], Array<Authorization>>,
  'get_block' : ActorMethod<[bigint], Block>,
  'get_certificate' : ActorMethod<[], [] | [Uint8Array]>,
  'last_hash' : ActorMethod<[], string>,
  'mid' : ActorMethod<[], bigint>,
  'next' : ActorMethod<[], bigint>,
  'prepare' : ActorMethod<[Array<Uint8Array>], Uint8Array>,
  'prepare_some' : ActorMethod<[Array<Uint8Array>], Uint8Array>,
  'rotate' : ActorMethod<[], [] | [bigint]>,
}
