let regexes = {
  allSpacesOutsideOfParens: /(?!\(.*)\s(?![^(]*?\))/g,
  leavingWormholeName: /^(0|[1-9a-zA-Z]+)\+[1-9a-zA-Z]$/,
  returningWormholeName: /^[1-9a-zA-Z]+\s-$/,
  enclosedInParens: /^\(.+\)$/,
  signatureFirstThree: /^[A-Z]{3}$/
};

let options = {
  wormholeSize: {
    "xl": "XL (any except supercaps)",
    "l": "L (battleship and smaller)",
    "m": "M (battlecruiser and smaller)",
    "s": "S (destroyer and smaller)"
  },
  systemType: {
    "unk": "Unknown (C1/C2/C3)",
    "c4/c5": "Dangerous Unknown (C4/C5)",
    "c6": "Deadly Unknown (C6)",
    "c13": "Shattered (C13)",
    "thera": "Thera",
    "hs": "Highsec",
    "ls": "Lowsec",
    "ns": "Nullsec",
    "home": "Home",
    "pi": "PI System"
  }
};

function parseWormholeBookmarkName(name) {
  let result = {};
  result.errors = [];
  let remainingNameCells = name.split(regexes.allSpacesOutsideOfParens);
  
  // parse "chain names" of the origin/destination systems
  if (regexes.leavingWormholeName.exec(remainingNameCells[0])) {
    result.originChainName = remainingNameCells[0].split("+")[0];
    result.destinationChainName = remainingNameCells[0].replace(/[0+]/g, "");
    result.direction = "leaving";
  } else if (regexes.returningWormholeName.exec(remainingNameCells.slice(0,2).join(" "))) {
    result.originChainName = remainingNameCells[0];
    result.destinationChainName = remainingNameCells[0].slice(0,-1) || "0";
    result.direction = "returning";
  } else {
    result.errors.push("invalid chain name: '" + remainingNameCells[0] + "' or '" + remainingNameCells.slice(0,2).join(" ") + "'");
    return result;
  }
  remainingNameCells = remainingNameCells.slice(result.direction == "returning" ? 2 : 1);
  
  // parse destination type
  if (!remainingNameCells[0]) {
    result.errors.push("no destination type provided");
    return result;
  }
  let destinationType = remainingNameCells[0];
  result.destinationType = options.systemType[destinationType.toLowerCase()];
  if (!result.destinationType) {
    result.errors.push("invalid destination type: " + destinationType + " (accepted values are " + Object.keys(options.systemType).join(",") + ")");
    return result;
  }
  remainingNameCells = remainingNameCells.slice(1);
  
  // parse optional human-readable destination system name
  if (regexes.enclosedInParens.exec(remainingNameCells[0])) {
    result.alternateName = remainingNameCells[0].slice(1,-1);
    remainingNameCells = remainingNameCells.slice(1);
  }
  
  // parse optional size and abbreviated cosmic signature
  if (!remainingNameCells[0]) {
    result.errors.push("no size or signature provided");
    return result;
  }
  let optionalSize = remainingNameCells[0];
  result.size = options.wormholeSize[optionalSize.toLowerCase()];
  if (result.size) {
    remainingNameCells = remainingNameCells.slice(1);
  } else {
    result.size = options.wormholeSize["l"];
  }
  if (!remainingNameCells[0]) {
    result.errors.push("no signature provided");
    return result;
  }
  if (regexes.signatureFirstThree.exec(remainingNameCells[0])) {
    result.signatureFirstThree = remainingNameCells[0];
  } else {
    result.errors.push("invalid abbreviated signature: " + remainingNameCells[0]);
    return result;
  }
  remainingNameCells = remainingNameCells.slice(1);
  
  // parse the rest of the string as arbitrary notes
  result.notes = remainingNameCells.join(" ");
  
  if (result.errors.length == 0) {
    delete result["errors"];
  }
  return result;
}