export const idlFactory = ({ IDL }) => {
  const Auth = IDL.Variant({ 'User' : IDL.Null, 'Admin' : IDL.Null });
  const Authorization = IDL.Record({ 'id' : IDL.Principal, 'auth' : Auth });
  const Block = IDL.Record({
    'certificate' : IDL.Vec(IDL.Nat8),
    'data' : IDL.Vec(IDL.Vec(IDL.Nat8)),
    'tree' : IDL.Vec(IDL.Nat8),
    'callers' : IDL.Vec(IDL.Principal),
    'previous_hash' : IDL.Vec(IDL.Nat8),
  });
  return IDL.Service({
    'authorize' : IDL.Func([IDL.Principal, Auth], [], []),
    'commit' : IDL.Func([IDL.Vec(IDL.Nat8)], [IDL.Opt(IDL.Nat64)], []),
    'deauthorize' : IDL.Func([IDL.Principal], [], []),
    'find' : IDL.Func([IDL.Vec(IDL.Nat8)], [IDL.Opt(IDL.Nat64)], ['query']),
    'first' : IDL.Func([], [IDL.Nat64], ['query']),
    'get_authorized' : IDL.Func([], [IDL.Vec(Authorization)], ['query']),
    'get_block' : IDL.Func([IDL.Nat64], [Block], ['query']),
    'get_certificate' : IDL.Func([], [IDL.Opt(IDL.Vec(IDL.Nat8))], ['query']),
    'last_hash' : IDL.Func([], [IDL.Text], ['query']),
    'mid' : IDL.Func([], [IDL.Nat64], ['query']),
    'next' : IDL.Func([], [IDL.Nat64], ['query']),
    'prepare' : IDL.Func([IDL.Vec(IDL.Vec(IDL.Nat8))], [IDL.Vec(IDL.Nat8)], []),
    'prepare_some' : IDL.Func(
        [IDL.Vec(IDL.Vec(IDL.Nat8))],
        [IDL.Vec(IDL.Nat8)],
        [],
      ),
    'rotate' : IDL.Func([], [IDL.Opt(IDL.Nat64)], []),
  });
};
export const init = ({ IDL }) => { return [IDL.Opt(IDL.Text)]; };
