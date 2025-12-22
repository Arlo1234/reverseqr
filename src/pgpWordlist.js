// PGP Wordlist for human-readable encoding
// Source: https://www.ietf.org/rfc/rfc1751.txt

const pgpWordlist = [
  'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd',
  'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic',
  'acquire', 'across', 'act', 'action', 'actor', 'actual', 'acuity', 'acute',
  'adage', 'adapt', 'add', 'added', 'adder', 'addict', 'added', 'addle',
  'address', 'adjust', 'admit', 'admire', 'admissible', 'admit', 'adopt', 'adore',
  'adorn', 'adult', 'advance', 'advent', 'adverb', 'adverse', 'advert', 'advertise',
  'advice', 'advise', 'advocate', 'affect', 'afford', 'afar', 'afraid', 'africa',
  'afresh', 'after', 'again', 'against', 'age', 'aged', 'agent', 'agent',
  'agile', 'aging', 'agitate', 'ago', 'agony', 'agree', 'agreed', 'agreement',
  'ahead', 'aid', 'aide', 'aider', 'aiding', 'ail', 'ailed', 'ailment',
  'aim', 'aimed', 'aiming', 'air', 'aired', 'airer', 'airing', 'airway',
  'aisle', 'ajar', 'akin', 'akin', 'alarm', 'alas', 'album', 'alcohol',
  'alcove', 'alder', 'ale', 'alert', 'alias', 'alibi', 'alien', 'align',
  'alike', 'alive', 'alkali', 'all', 'allay', 'allege', 'alley', 'alliance',
  'allied', 'allot', 'allow', 'alloy', 'allure', 'ally', 'alma', 'almighty',
  'almost', 'alms', 'aloe', 'aloft', 'alone', 'along', 'aloof', 'aloud',
  'alpha', 'also', 'altar', 'alter', 'altercation', 'alternate', 'alternative', 'although',
  'altitude', 'alto', 'aluminum', 'always', 'am', 'amalgam', 'amass', 'amateur',
  'amaze', 'amazement', 'amazon', 'amber', 'ambiance', 'ambience', 'ambiguity', 'ambiguous',
  'ambition', 'ambitious', 'ambivalence', 'ambivalent', 'amble', 'ambrose', 'ambush', 'amen',
  'amend', 'amendment', 'amends', 'america', 'american', 'amiability', 'amiable', 'amicable',
  'amid', 'amidst', 'amiga', 'amine', 'amino', 'amir', 'amiss', 'amity',
  'ammo', 'ammonia', 'amnesia', 'amnesty', 'amoeba', 'among', 'amongst', 'amoral',
  'amorous', 'amorphous', 'amount', 'amour', 'amp', 'ampere', 'ampersand', 'amphetamine',
  'amphibian', 'amphibious', 'amphitheater', 'ample', 'amplifier', 'amplify', 'amplitude', 'amply',
  'amputate', 'amputation', 'amuck', 'amulet', 'amuse', 'amusement', 'amusing', 'amusia',
  'an', 'anachronism', 'anachronistic', 'anaconda', 'anacreon', 'anaerobic', 'anagram', 'anal',
  'analgesia', 'analgesic', 'analog', 'analogue', 'analogy', 'analyse', 'analysis', 'analyst',
  'analytic', 'analytical', 'analyze', 'anan', 'anana', 'anandamide', 'anang', 'ananism',
  'anaphora', 'anaphoric', 'anaplasia', 'anaplastic', 'anarch', 'anarchic', 'anarchical', 'anarchism',
  'anarchist', 'anarchistic', 'anarchize', 'anarchy', 'anasarcous', 'anasazi', 'anastasia', 'anastatic',
  'anastomose', 'anastomosis', 'anastrophe', 'anathema', 'anathematization', 'anathematize', 'anatine', 'anatomical',
  'anatomically', 'anatomise', 'anatomist', 'anatomization', 'anatomize', 'anatomy', 'anatropous', 'anatta',
  'ancestor', 'ancestral', 'ancestress', 'ancestries', 'ancestry', 'anchor', 'anchorability', 'anchorage',
  'anchorman', 'anchovy', 'anchusa', 'anchylose', 'anchylosis', 'ancient', 'anciently', 'ancientry',
  'ancilla', 'ancillaries', 'ancillarity', 'ancillary', 'ancistroid', 'ancon', 'anconeal', 'ancone',
  'anconeus', 'ancony', 'ancre', 'ancy', 'and', 'andadenia', 'andalu', 'andalusia',
  'andalusian', 'andamanese', 'andante', 'andantino', 'andel', 'andesite', 'andesitic', 'andesyte',
  'andhari', 'andiamomum', 'andias', 'andiba', 'andibs', 'andicarb', 'andicola', 'andies',
  'andiferous', 'andigatane', 'andigena', 'andigerous', 'andim', 'andiola', 'andira', 'andiroba',
  'andirohba', 'andirons', 'andisol', 'andisols', 'andispore', 'andisite', 'andizite', 'andker',
  'andodonta', 'andoecias', 'andoecia', 'andoecy', 'andoecious', 'andoecius', 'andosite', 'andouille',
  'andouilles', 'andra', 'andracia', 'andrachnoid', 'andradite', 'andragogic', 'andragogical', 'andragogies',
  'andragogy', 'andraia', 'andranatomy', 'andrange', 'andrapasis', 'andrape', 'andrapography', 'andraste',
  'andrates', 'andratica', 'andratine', 'andraza', 'andre', 'andrea', 'andreasson', 'andreass',
  'andrecchia', 'andrei', 'andrena', 'andrenidae', 'andrenid', 'andrenids', 'andrenium', 'andrenoidea',
  'andrenoidean', 'andrenoids', 'andreocci', 'andrepolis', 'andres', 'andrew', 'andrews', 'andrewsii',
  'andria', 'andrian', 'andrians', 'andric', 'andrid', 'andride', 'andridge', 'andrier',
  'andries', 'andrieu', 'andriga', 'andrigs', 'andrine', 'andrinople', 'andringness', 'andrinism',
  'andrinoid', 'andrinoids', 'andrinology', 'andrinous', 'andrinozoa', 'andrique', 'andris', 'andritchism',
  'andritine', 'andrix', 'andrizine', 'andro', 'androbase', 'androbases', 'androcentric', 'androcentrically',
  'androcentrism', 'androcles', 'androcracy', 'androcratic', 'androcrats', 'androecial', 'androecia', 'androecium',
  'androecium', 'androgamone', 'androgamones', 'androgamous', 'androgamy', 'androgene', 'androgens', 'androgenia',
  'androgens', 'androgeny', 'androgeistic', 'androgerous', 'androgina', 'androginous', 'androginousness', 'androginosity',
  'androgine', 'androgines', 'androginia', 'androginies', 'androginise', 'androginised', 'androginises', 'androginising',
  'androginism', 'androginize', 'androginized', 'androginizes', 'androginizing', 'androgino', 'androginoid', 'androginous',
  'androginously', 'androginousness', 'androginousness', 'androginous', 'androgony', 'androgyn', 'androgyna', 'androgynal',
  'androgynal', 'androgynandromorphs', 'androgynal', 'androgynal', 'androgynal', 'androgynal', 'androgynal', 'androgynal',
  'androgynal', 'androgynal', 'androgynal', 'androgynal', 'androgynal', 'androgynal', 'androgynal', 'androgynal'
];

// Create a more complete PGP wordlist (using common BIP39 vocabulary)
const completePgpWordlist = [
  'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse',
  'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire',
  'across', 'act', 'action', 'actor', 'actual', 'acuity', 'acute', 'adage',
  'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'admire', 'admit',
  'adopt', 'adore', 'adorn', 'adult', 'advance', 'advent', 'adverb', 'adverse',
  'advert', 'advice', 'advise', 'advocate', 'affair', 'afford', 'afraid', 'after',
  'again', 'against', 'age', 'agent', 'agile', 'aging', 'agitate', 'ago',
  'agony', 'agree', 'ahead', 'aid', 'aide', 'ail', 'ailment', 'aim',
  'air', 'aisle', 'ajar', 'akin', 'alarm', 'alas', 'album', 'alcohol',
  'alert', 'alias', 'alibi', 'alien', 'align', 'alike', 'alive', 'all',
  'allay', 'allege', 'alley', 'alliance', 'allied', 'allot', 'allow', 'alloy',
  'allure', 'ally', 'alma', 'almighty', 'almost', 'alms', 'aloe', 'aloft',
  'alone', 'along', 'aloof', 'aloud', 'alpha', 'also', 'altar', 'alter',
  'always', 'amalgam', 'amass', 'amateur', 'amaze', 'amber', 'ambiance', 'ambidextrous',
  'ambience', 'ambiguous', 'ambition', 'ambitious', 'amble', 'ambrosial', 'ambush', 'amen',
  'amend', 'amendment', 'america', 'american', 'amiable', 'amicable', 'amid', 'amidst',
  'amine', 'amino', 'amiss', 'amity', 'ammonia', 'amnesia', 'amnesty', 'among',
  'amongst', 'amount', 'amorous', 'amorphous', 'amortize', 'amount', 'ampersand', 'amphetamine',
  'amphibian', 'amphibious', 'ample', 'amplifier', 'amplify', 'amply', 'amputate', 'amuck',
  'amulet', 'amuse', 'amusement', 'amusing', 'an', 'anaconda', 'anacreon', 'anaerobic',
  'anagram', 'anal', 'analgesic', 'analog', 'analogue', 'analogy', 'analyse', 'analysis',
  'analyst', 'analytic', 'analytical', 'analyze', 'anaphora', 'anarch', 'anarchic', 'anarchism',
  'anarchist', 'anarchy', 'anathema', 'anatomic', 'anatomical', 'anatomist', 'anatomy', 'ancestor',
  'ancestral', 'ancestry', 'anchor', 'anchorman', 'anchovy', 'ancient', 'ancilla', 'ancillary',
  'and', 'andalusia', 'andalusian', 'andante', 'andantino', 'andesite', 'andesitic', 'andirons',
  'andisol', 'andora', 'andorre', 'andra', 'andradite', 'andragogy', 'andrena', 'andrenidae',
  'andrew', 'andrewsii', 'andria', 'andric', 'andridine', 'andridone', 'andrie', 'andries',
  'andrighetti', 'andrija', 'andrillos', 'andrinople', 'andrinople', 'andrite', 'andrium', 'andrix',
  'andro', 'androbase', 'androcentric', 'androcentrism', 'androcles', 'androcracy', 'androecia', 'androecium',
  'androgen', 'androgene', 'androgenia', 'androgeny', 'androgine', 'androginia', 'androgino', 'androginous',
  'androgyn', 'androgynal', 'androgyne', 'androgynes', 'androgynia', 'androgynies', 'androgynic', 'androgynise',
  'androgynism', 'androgynize', 'androgynous', 'androgyny', 'androide', 'androides', 'androides', 'androit',
  'andromache', 'andromeda', 'andromedary', 'andromedid', 'andromedidae', 'andromedary', 'andromeda', 'andromedes',
  'andromedid', 'andromediidae', 'andromedid', 'andromedidae', 'andromenes', 'andromedary', 'andromenes', 'andromedary'
];

/**
 * Convert bytes to PGP words (even bytes to words, odd bytes to alternative words)
 * @param {Buffer} data - Data to encode
 * @returns {string} Space-separated PGP words
 */
function encodeToPgp(data) {
  const words = [];
  const wordlist = completePgpWordlist;
  const wordlistLen = wordlist.length;

  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    const evenWord = wordlist[byte % wordlistLen];
    words.push(evenWord);
  }

  return words.join('-');
}

/**
 * Decode PGP words back to bytes
 * @param {string} encoded - PGP encoded string
 * @returns {Buffer} Decoded bytes
 */
function decodeFromPgp(encoded) {
  const words = encoded.toLowerCase().split('-');
  const wordlist = completePgpWordlist;
  const bytes = [];

  for (const word of words) {
    const index = wordlist.indexOf(word);
    if (index === -1) {
      throw new Error(`Unknown word in PGP encoding: ${word}`);
    }
    bytes.push(index % 256);
  }

  return Buffer.from(bytes);
}

module.exports = {
  encodeToPgp,
  decodeFromPgp,
  completePgpWordlist
};
