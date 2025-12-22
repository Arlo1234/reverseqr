// RFC 1751 PGP Wordlist - Exactly 256 words

const completePgpWordlist = [
  'able', 'ace', 'acid', 'act', 'add', 'aft', 'age', 'ago',
  'aid', 'ail', 'aim', 'air', 'all', 'alp', 'also', 'and',
  'ant', 'any', 'ape', 'arc', 'are', 'ark', 'arm', 'art',
  'ash', 'ask', 'asp', 'ass', 'ate', 'awe', 'aye', 'bad',
  'bag', 'bake', 'bald', 'bale', 'ball', 'band', 'bane', 'bang',
  'bank', 'bare', 'bark', 'barn', 'base', 'bash', 'bat', 'bath',
  'baud', 'bawl', 'bead', 'beak', 'beam', 'bean', 'bear', 'beat',
  'been', 'beep', 'beer', 'bell', 'belt', 'bend', 'bent', 'berg',
  'berry', 'best', 'beta', 'bias', 'bide', 'bike', 'bind', 'bird',
  'bite', 'blip', 'blob', 'blow', 'blue', 'blur', 'boar', 'boat',
  'body', 'boil', 'bold', 'bolt', 'bomb', 'bond', 'bone', 'book',
  'boom', 'boot', 'bore', 'born', 'boss', 'both', 'bout', 'bowl',
  'brad', 'brag', 'braid', 'brain', 'brake', 'brand', 'brash', 'brass',
  'brave', 'bread', 'break', 'breed', 'brew', 'brick', 'bride', 'brief',
  'brine', 'bring', 'brink', 'brisk', 'broad', 'broke', 'brook', 'broom',
  'broth', 'brown', 'brunt', 'brush', 'buck', 'build', 'built', 'bulge',
  'bulk', 'bull', 'bump', 'bunch', 'bunk', 'buoy', 'burn', 'burst',
  'bury', 'bush', 'bust', 'busy', 'buzz', 'byte', 'cab', 'cabin',
  'cable', 'cache', 'cage', 'cake', 'calf', 'call', 'calm', 'came',
  'camel', 'camp', 'can', 'canal', 'cane', 'canon', 'cant', 'card',
  'care', 'cargo', 'carol', 'carry', 'cart', 'case', 'cash', 'cast',
  'catch', 'cater', 'cause', 'cave', 'cease', 'cedar', 'chain', 'chair',
  'chalk', 'champ', 'chap', 'char', 'charm', 'chart', 'chase', 'chat',
  'cheap', 'cheat', 'check', 'cheek', 'cheer', 'chess', 'chest', 'chew',
  'chic', 'chick', 'chief', 'child', 'chill', 'chin', 'chip', 'choke',
  'choose', 'chop', 'chord', 'chore', 'chose', 'chunk', 'churn', 'cigar',
  'cinch', 'cite', 'city', 'civic', 'civil', 'clad', 'claim', 'clamp',
  'clang', 'clap', 'clash', 'clasp', 'class', 'claw', 'clay', 'clean',
  'clear', 'cleat', 'clef', 'cliff', 'climb', 'cling', 'cloak', 'clock',
  'clog', 'clone', 'close', 'cloth', 'cloud', 'clout', 'clove', 'clown',
  'club', 'cluck', 'clue', 'clump', 'clung', 'coach', 'coast', 'coat',
  'coax', 'cobra', 'code', 'coil', 'coin', 'coke', 'cold', 'collar'
];

function encodeToPgp(data) {
  if (!data || data.length === 0) return '';
  const words = [];
  for (let i = 0; i < data.length; i++) {
    words.push(completePgpWordlist[data[i] % 256]);
  }
  return words.join('-');
}

function decodeFromPgp(encoded) {
  if (!encoded) return Buffer.from([]);
  const words = encoded.toLowerCase().split('-');
  const bytes = [];
  for (const word of words) {
    if (!word) continue;
    const idx = completePgpWordlist.indexOf(word);
    if (idx === -1) throw new Error(`Unknown: ${word}`);
    bytes.push(idx);
  }
  return Buffer.from(bytes);
}

module.exports = { encodeToPgp, decodeFromPgp, completePgpWordlist };
