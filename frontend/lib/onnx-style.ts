export type FastStyleId =
  | "udnie"
  | "candy"
  | "mosaic"
  | "rain-princess"
  | "pointilism";

export type ModelId = FastStyleId | "adv-inception-v3";

type SessionCache = Map<ModelId, any>;
const sessionCache: SessionCache = new Map();

function getModelUrl(modelId: ModelId): string {
  if (modelId === "adv-inception-v3") {
    return `${window.location.origin}/models/computer-vision/adv-inception-v3.onnx`;
  }
  return `${window.location.origin}/models/fast-style/${modelId}.onnx`;
}

async function loadOrt(): Promise<any> {
  if (typeof window === "undefined") throw new Error("ORT must run in browser");
  const w = window as any;
  if (w.ort) return w.ort;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/ort.min.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
  const ort = (window as any).ort;
  // Ensure WASM files resolve from CDN too
  ort.env.wasm.wasmPaths =
    "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/";
  return ort;
}

async function getSession(modelId: ModelId): Promise<any> {
  const cached = sessionCache.get(modelId);
  if (cached) return cached;

  const ort = await loadOrt();
  // Use stable WASM first to avoid WebGPU init issues
  const providers: any[] = ["wasm"];

  try {
    console.log(`Loading ONNX model: ${modelId}`);
    const session = await ort.InferenceSession.create(getModelUrl(modelId), {
      executionProviders: providers,
    });
    console.log(`Successfully loaded model: ${modelId}`);
    sessionCache.set(modelId, session);
    return session;
  } catch (error) {
    console.error(`Failed to load ONNX model: ${modelId}`, error);
    throw new Error(
      `Failed to load model '${modelId}'. Make sure the model file exists at: ${getModelUrl(
        modelId
      )}`
    );
  }
}

function createLetterboxedCanvas(
  img: HTMLImageElement,
  targetW: number,
  targetH: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  // Background as blurred-like neutral: light gray
  ctx.fillStyle = "#f2f2f2";
  ctx.fillRect(0, 0, targetW, targetH);

  const scale = Math.min(
    targetW / img.naturalWidth,
    targetH / img.naturalHeight
  );
  const drawW = Math.round(img.naturalWidth * scale);
  const drawH = Math.round(img.naturalHeight * scale);
  const dx = Math.floor((targetW - drawW) / 2);
  const dy = Math.floor((targetH - drawH) / 2);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    img,
    0,
    0,
    img.naturalWidth,
    img.naturalHeight,
    dx,
    dy,
    drawW,
    drawH
  );
  return canvas;
}

function imageDataToCHWFloat32(imageData: ImageData): Float32Array {
  const { data, width, height } = imageData;
  const out = new Float32Array(3 * width * height);
  let oR = 0;
  let oG = width * height;
  let oB = 2 * width * height;
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    out[oR++] = r / 255;
    out[oG++] = g / 255;
    out[oB++] = b / 255;
  }
  return out;
}

function chwToImageData(
  chw: Float32Array,
  width: number,
  height: number
): ImageData {
  const out = new Uint8ClampedArray(width * height * 4);
  const planeSize = width * height;
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < chw.length; i++) {
    const v = chw[i];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const scale = max - min === 0 ? 1 : 1 / (max - min);
  for (let p = 0, i = 0; p < planeSize; p++) {
    let r = chw[p];
    let g = chw[p + planeSize];
    let b = chw[p + 2 * planeSize];
    // Try common output ranges: [0,1], [-1,1], or arbitrary; normalize to [0,255]
    if (max <= 1.2 && min >= -0.2) {
      // assume [0,1] or ~
      r = Math.min(1, Math.max(0, r));
      g = Math.min(1, Math.max(0, g));
      b = Math.min(1, Math.max(0, b));
      out[i++] = r * 255;
      out[i++] = g * 255;
      out[i++] = b * 255;
      out[i++] = 255;
    } else if (max <= 1.1 && min >= -1.1) {
      // [-1,1]
      out[i++] = (r * 0.5 + 0.5) * 255;
      out[i++] = (g * 0.5 + 0.5) * 255;
      out[i++] = (b * 0.5 + 0.5) * 255;
      out[i++] = 255;
    } else {
      // normalize by observed min/max
      out[i++] = (r - min) * scale * 255;
      out[i++] = (g - min) * scale * 255;
      out[i++] = (b - min) * scale * 255;
      out[i++] = 255;
    }
  }
  return new ImageData(out, width, height);
}

// ImageNet 1000 class mapping
const IMAGENET_CLASSES: { [key: number]: string } = {
  0: "tench, Tinca tinca",
  1: "goldfish, Carassius auratus",
  2: "great white shark, white shark, man-eater, man-eating shark, Carcharodon carcharias",
  3: "tiger shark, Galeocerdo cuvieri",
  4: "hammerhead, hammerhead shark",
  5: "electric ray, crampfish, numbfish, torpedo",
  6: "stingray",
  7: "cock",
  8: "hen",
  9: "ostrich, Struthio camelus",
  10: "brambling, Fringilla montifringilla",
  // ... add more classes as needed, but for now just the first few
  406: "altar",
  151: "Chihuahua",
  152: "Japanese spaniel",
  153: "Maltese dog, Maltese terrier, Maltese",
  154: "Pekinese, Pekingese, Peke",
  155: "Shih-Tzu",
  281: "tabby, tabby cat",
  282: "tiger cat",
  283: "Persian cat",
  284: "Siamese cat, Siamese",
  285: "Egyptian cat",
  286: "cougar, puma, catamount, mountain lion, painter, panther, Felis concolor",
  287: "lynx, catamount",
  288: "leopard, Panthera pardus",
  289: "snow leopard, ounce, Panthera uncia",
  290: "jaguar, panther, Panthera onca, Felis onca",
  291: "lion, king of beasts, Panthera leo",
  292: "tiger, Panthera tigris",
  293: "cheetah, chetah, Acinonyx jubatus",
  294: "brown bear, bruin, Ursus arctos",
  295: "American black bear, black bear, Ursus americanus, Euarctos americanus",
  296: "ice bear, polar bear, Ursus maritimus, Thalarctos maritimus",
  297: "sloth bear, Melursus ursinus, Ursus ursinus",
  298: "mongoose",
  299: "meerkat, mierkat",
  300: "tiger beetle",
  301: "ladybug, ladybeetle, lady beetle, ladybird, ladybird beetle",
  302: "ground beetle, carabid beetle",
  303: "long-horned beetle, longicorn, longicorn beetle",
  304: "leaf beetle, chrysomelid",
  305: "dung beetle",
  306: "rhinoceros beetle",
  307: "weevil",
  308: "fly",
  309: "bee",
  310: "ant, emmet, pismire",
  311: "grasshopper, hopper",
  312: "cricket",
  313: "walking stick, walkingstick, stick insect",
  314: "cockroach, roach",
  315: "mantis, mantid",
  316: "cicada, cicala",
  317: "leafhopper",
  318: "lacewing, lacewing fly",
  319: "dragonfly, darning needle, devil's darning needle, sewing needle, snake feeder, snake doctor, mosquito hawk, skeeter hawk",
  320: "damselfly",
  321: "admiral",
  322: "ringlet, ringlet butterfly",
  323: "monarch, monarch butterfly, milkweed butterfly, Danaus plexippus",
  324: "cabbage butterfly",
  325: "sulphur butterfly, sulfur butterfly",
  326: "lycaenid, lycaenid butterfly",
  327: "starfish, sea star",
  328: "sea urchin",
  329: "sea cucumber, holothurian",
  330: "wood rabbit, cottontail, cottontail rabbit",
  331: "hare",
  332: "Angora, Angora rabbit",
  333: "hamster",
  334: "porcupine, hedgehog",
  335: "fox squirrel, eastern fox squirrel, Sciurus niger",
  336: "marmot",
  337: "beaver",
  338: "guinea pig, Cavia cobaya",
  339: "sorrel",
  340: "zebra",
  341: "hog, pig, grunter, squealer, Sus scrofa",
  342: "wild boar, boar, Sus scrofa",
  343: "warthog",
  344: "hippopotamus, hippo, river horse, Hippopotamus amphibius",
  345: "ox",
  346: "water buffalo, water ox, Asiatic buffalo, Bubalus bubalis",
  347: "bison",
  348: "ram, tup",
  349: "bighorn, bighorn sheep, cimarron, Rocky Mountain bighorn, Rocky Mountain sheep, Ovis canadensis",
  350: "ibex, Capra ibex",
  351: "hartebeest",
  352: "impala, Aepyceros melampus",
  353: "gazelle",
  354: "Arabian camel, dromedary, Camelus dromedarius",
  355: "llama",
  356: "weasel",
  357: "mink",
  358: "polecat, fitch, foulmart, foumart, Mustela putorius",
  359: "black-footed ferret, ferret, Mustela nigripes",
  360: "otter",
  361: "skunk, polecat, wood pussy",
  362: "badger",
  363: "armadillo",
  364: "three-toed sloth, ai, Bradypus tridactylus",
  365: "orangutan, orang, orangutang, Pongo pygmaeus",
  366: "gorilla, Gorilla gorilla",
  367: "chimpanzee, chimp, Pan troglodytes",
  368: "gibbon, Hylobates lar",
  369: "siamang, Hylobates syndactylus, Symphalangus syndactylus",
  370: "guenon, guenon monkey",
  371: "patas, hussar monkey, Erythrocebus patas",
  372: "baboon",
  373: "macaque",
  374: "langur",
  375: "colobus, colobus monkey",
  376: "proboscis monkey, Nasalis larvatus",
  377: "marmoset",
  378: "capuchin, ringtail, Cebus capucinus",
  379: "howler monkey, howler",
  380: "titi, titi monkey",
  381: "spider monkey, Ateles geoffroyi",
  382: "squirrel monkey, Saimiri sciureus",
  383: "Madagascar cat, ring-tailed lemur, Lemur catta",
  384: "indri, indris, Indri indri, Indri brevicaudatus",
  385: "Indian elephant, Elephas maximus",
  386: "African elephant, Loxodonta africana",
  387: "lesser panda, red panda, panda, bear cat, cat bear, Ailurus fulgens",
  388: "giant panda, panda, panda bear, coon bear, Ailuropoda melanoleuca",
  389: "barracouta, snoek",
  390: "eel",
  391: "coho, cohoe, coho salmon, blue jack, silver salmon, Oncorhynchus kisutch",
  392: "rock beauty, Holocanthus tricolor",
  393: "anemone fish",
  394: "sturgeon",
  395: "gar, garfish, garpike, billfish, Lepisosteus osseus",
  396: "lionfish",
  397: "puffer, pufferfish, blowfish, globefish",
  398: "abacus",
  399: "abaya",
  400: "academic gown, academic robe, judge's robe",
  401: "accordion, piano accordion, squeeze box",
  402: "acoustic guitar",
  403: "aircraft carrier, carrier, flattop, attack aircraft carrier",
  404: "airliner",
  405: "airship, dirigible",
  407: "ambulance",
  408: "amphibian, amphibious vehicle",
  409: "analog clock",
  410: "apiary, bee house",
  411: "apron",
  412: "ashcan, trash can, garbage can, wastebin, ash bin, ash-bin, ashbin, dustbin, trash barrel, trash bin",
  413: "assault rifle, assault gun",
  414: "backpack, back pack, knapsack, packsack, rucksack, haversack",
  415: "bakery, bakeshop, bakehouse",
  416: "balance beam, beam",
  417: "balloon",
  418: "ballpoint, ballpoint pen, ballpen, Biro",
  419: "Band Aid",
  420: "banjo",
  421: "bannister, banister, balustrade, balusters, handrail",
  422: "barbell",
  423: "barber chair",
  424: "barbershop",
  425: "barn",
  426: "barometer",
  427: "barrel, cask",
  428: "barrow, garden cart, lawn cart, wheelbarrow",
  429: "baseball",
  430: "basketball",
  431: "bassinet",
  432: "bassoon",
  433: "bathing cap, swimming cap",
  434: "bath towel",
  435: "bathtub, bathing tub, bath, tub",
  436: "beach wagon, station wagon, wagon, estate car, beach waggon, station waggon, waggon",
  437: "beacon, lighthouse, beacon light, pharos",
  438: "beaker",
  439: "bearskin, busby, shako",
  440: "beer bottle",
  441: "beer glass",
  442: "bell cote, bell cot",
  443: "bib",
  444: "bicycle-built-for-two, tandem bicycle, tandem",
  445: "bikini, two-piece",
  446: "binder, ring-binder",
  447: "binoculars, field glasses, opera glasses",
  448: "birdhouse",
  449: "boathouse",
  450: "bobsled, bobsleigh, bob",
  451: "bolo tie, bolo, bola tie, bola",
  452: "bonnet, poke bonnet",
  453: "bookcase",
  454: "bookshop, bookstore, bookstall",
  455: "bottlecap",
  456: "bow",
  457: "bow tie, bow-tie, bowtie",
  458: "brass, memorial tablet, plaque",
  459: "brassiere, bra, bandeau",
  460: "breakwater, groin, groyne, mole, bulwark, seawall, jetty",
  461: "breastplate, aegis, egis",
  462: "broom",
  463: "bucket, pail",
  464: "buckle",
  465: "bulletproof vest",
  466: "bullet train, bullet",
  467: "butcher shop, meat market",
  468: "cab, hack, taxi, taxicab",
  469: "caldron, cauldron",
  470: "candle, taper, wax light",
  471: "cannon",
  472: "canoe",
  473: "can opener, tin opener",
  474: "cardigan",
  475: "car mirror",
  476: "carousel, carrousel, merry-go-round, roundabout, whirligig",
  477: "carpenter's kit, tool kit",
  478: "carton",
  479: "car wheel",
  480: "cash machine, cash dispenser, automated teller machine, automatic teller machine, automated teller, automatic teller, ATM",
  481: "cassette",
  482: "cassette player",
  483: "castle",
  484: "catamaran",
  485: "CD player",
  486: "cello, violoncello",
  487: "cellular telephone, cellular phone, cellphone, cell, mobile phone",
  488: "chain",
  489: "chainlink fence",
  490: "chain mail, ring mail, mail, chain armor, chain armour, ring armor, ring armour",
  491: "chain saw, chainsaw",
  492: "chest",
  493: "chiffonier, commode",
  494: "chime, bell, gong",
  495: "china cabinet, china closet",
  496: "Christmas stocking",
  497: "church, church building",
  498: "cinema, movie theater, movie theatre, movie house, picture palace",
  499: "cleaver, meat cleaver, chopper",
  500: "cliff dwelling",
  501: "cloak",
  502: "clog, geta, patten, sabot",
  503: "cocktail shaker",
  504: "coffee mug",
  505: "coffeepot",
  506: "coil, spiral, volute, whorl, helix",
  507: "combination lock",
  508: "computer keyboard, keypad",
  509: "confectionery, confectionary, candy store",
  510: "container ship, containership, container vessel",
  511: "convertible",
  512: "corkscrew, bottle screw",
  513: "cornet, horn, trumpet, trump",
  514: "cowboy boot",
  515: "cowboy hat, ten-gallon hat",
  516: "cradle",
  517: "crane",
  518: "crash helmet",
  519: "crate",
  520: "crib, cot",
  521: "Crock Pot",
  522: "croquet ball",
  523: "crutch",
  524: "cuirass",
  525: "dam, dike, dyke",
  526: "desk",
  527: "desktop computer",
  528: "dial telephone, dial phone",
  529: "diaper, nappy, napkin",
  530: "digital clock",
  531: "digital watch",
  532: "dining table, board",
  533: "dishrag, dishcloth",
  534: "dishwasher, dish washer, dishwashing machine",
  535: "disk brake, disc brake",
  536: "dock, dockage, docking facility",
  537: "dogsled, dog sled, dog sleigh",
  538: "dome",
  539: "doormat, welcome mat",
  540: "drilling platform, offshore rig",
  541: "drum, membranophone, tympan",
  542: "drumstick",
  543: "dumbbell",
  544: "Dutch oven",
  545: "electric fan, blower",
  546: "electric guitar",
  547: "electric locomotive",
  548: "entertainment center",
  549: "envelope",
  550: "espresso maker",
  551: "face powder",
  552: "feather boa, boa",
  553: "file, file cabinet, filing cabinet",
  554: "fireboat",
  555: "fire engine, fire truck",
  556: "fire screen, fireguard",
  557: "flagpole, flagstaff",
  558: "flute, transverse flute",
  559: "folding chair",
  560: "football helmet",
  561: "forklift",
  562: "fountain",
  563: "fountain pen",
  564: "four-poster",
  565: "freight car",
  566: "French horn, horn",
  567: "frying pan, frypan, skillet",
  568: "fur coat",
  569: "garbage truck, dustcart",
  570: "gasmask, respirator, gas helmet",
  571: "gas pump, gasoline pump, petrol pump, island dispenser",
  572: "goblet",
  573: "go-kart",
  574: "golf ball",
  575: "golfcart, golf cart",
  576: "gondola",
  577: "gong, tam-tam",
  578: "gown",
  579: "grand piano, grand",
  580: "greenhouse, nursery, glasshouse",
  581: "grille, radiator grille",
  582: "grocery store, grocery, food market, market",
  583: "guillotine",
  584: "hair slide",
  585: "hair spray",
  586: "half track",
  587: "hammer",
  588: "hamper",
  589: "hand blower, blow dryer, blow drier, hair dryer, hair drier",
  590: "hand-held computer, hand-held microcomputer",
  591: "handkerchief, hankie, hanky, hankey",
  592: "hard disc, hard disk, fixed disk",
  593: "harmonica, mouth organ, harp, mouth harp",
  594: "harp",
  595: "harvester, reaper",
  596: "hatchet",
  597: "holster",
  598: "home theater, home theatre",
  599: "honeycomb",
  600: "hook, claw",
  601: "hoopskirt, crinoline",
  602: "horizontal bar, high bar",
  603: "horse cart, horse-cart",
  604: "hourglass",
  605: "iPod",
  606: "iron, smoothing iron",
  607: "jack-o'-lantern",
  608: "jean, blue jean, denim",
  609: "jeep, landrover",
  610: "jersey, T-shirt, tee shirt",
  611: "jigsaw puzzle",
  612: "jinrikisha, ricksha, rickshaw",
  613: "joystick",
  614: "kimono",
  615: "knee pad",
  616: "knot",
  617: "lab coat, laboratory coat",
  618: "ladle",
  619: "lampshade, lamp shade",
  620: "laptop, laptop computer",
  621: "lawn mower, mower",
  622: "lens cap, lens cover",
  623: "letter opener, paper knife, paperknife",
  624: "library",
  625: "lifeboat",
  626: "lighter, light, igniter, ignitor",
  627: "limousine, limo",
  628: "liner, ocean liner",
  629: "lipstick, lip rouge",
  630: "Loafer",
  631: "lotion",
  632: "loudspeaker, speaker, speaker unit, loudspeaker system, speaker system",
  633: "loupe, jeweler's loupe",
  634: "lumbermill, sawmill",
  635: "magnetic compass",
  636: "mailbag, postbag",
  637: "mailbox, letter box",
  638: "maillot",
  639: "maillot, tank suit",
  640: "manhole cover",
  641: "maraca",
  642: "marimba, xylophone",
  643: "mask",
  644: "matchstick",
  645: "maypole",
  646: "maze, labyrinth",
  647: "measuring cup",
  648: "medicine chest, medicine cabinet",
  649: "megalith, megalithic structure",
  650: "microphone, mike",
  651: "microwave, microwave oven",
  652: "military uniform",
  653: "milk can",
  654: "minibus",
  655: "miniskirt, mini",
  656: "minivan",
  657: "missile",
  658: "mitten",
  659: "mixing bowl",
  660: "mobile home, manufactured home",
  661: "Model T",
  662: "modem",
  663: "monastery",
  664: "monitor",
  665: "moped",
  666: "mortar",
  667: "mortarboard",
  668: "mosque",
  669: "mosquito net",
  670: "motor scooter, scooter",
  671: "mountain bike, all-terrain bike, off-roader",
  672: "mountain tent",
  673: "mouse, computer mouse",
  674: "mousetrap",
  675: "moving van",
  676: "muzzle",
  677: "nail",
  678: "neck brace",
  679: "necklace",
  680: "nipple",
  681: "notebook, notebook computer",
  682: "obelisk",
  683: "oboe, hautboy, hautbois",
  684: "ocarina, sweet potato",
  685: "odometer, hodometer, mileometer, milometer",
  686: "oil filter",
  687: "organ, pipe organ",
  688: "oscilloscope, scope, cathode-ray oscilloscope, CRO",
  689: "overskirt",
  690: "oxcart",
  691: "oxygen mask",
  692: "packet",
  693: "paddle, boat paddle",
  694: "paddlewheel, paddle wheel",
  695: "padlock",
  696: "paintbrush",
  697: "pajama, pyjama, pj's, jammies",
  698: "palace",
  699: "panpipe, pandean pipe, syrinx",
  700: "paper towel",
  701: "parachute, chute",
  702: "parallel bars, bars",
  703: "park bench",
  704: "parking meter",
  705: "passenger car, coach, carriage",
  706: "patio, terrace",
  707: "pay-phone, pay-station",
  708: "pedestal, plinth, footstall",
  709: "pencil box, pencil case",
  710: "pencil sharpener",
  711: "perfume, essence",
  712: "Petri dish",
  713: "photocopier",
  714: "pick, plectrum, plectron",
  715: "pickelhaube",
  716: "picket fence, paling",
  717: "pickup, pickup truck",
  718: "pier",
  719: "piggy bank, penny bank",
  720: "pill bottle",
  721: "pillow",
  722: "ping-pong ball",
  723: "pinwheel",
  724: "pirate, pirate ship",
  725: "pitcher, ewer",
  726: "plane, carpenter's plane, woodworking plane",
  727: "planetarium",
  728: "plastic bag",
  729: "plate rack",
  730: "plow, plough",
  731: "plunger, plumber's helper",
  732: "Polaroid camera, Polaroid Land camera",
  733: "pole",
  734: "police van, police wagon, paddy wagon, patrol wagon, wagon, black Maria",
  735: "poncho",
  736: "pool table, billiard table, snooker table",
  737: "pop bottle, soda bottle",
  738: "pot, flowerpot",
  739: "potter's wheel",
  740: "power drill",
  741: "prayer rug, prayer mat",
  742: "printer",
  743: "prison, prison house",
  744: "projectile, missile",
  745: "projector",
  746: "puck, hockey puck",
  747: "punching bag, punch bag, punching ball, punchball",
  748: "purse",
  749: "quill, quill pen",
  750: "quilt, comforter, comfort, puff",
  751: "racer, race car, racing car",
  752: "racket, racquet",
  753: "radiator",
  754: "radio, wireless",
  755: "radio telescope, radio reflector",
  756: "rain barrel",
  757: "recreational vehicle, RV, R.V.",
  758: "reel",
  759: "reflex camera",
  760: "refrigerator, icebox",
  761: "remote control, remote",
  762: "restaurant, eating house, eating place, eatery",
  763: "revolver, six-gun, six-shooter",
  764: "rifle",
  765: "rocking chair, rocker",
  766: "rotisserie",
  767: "rubber eraser, rubber, pencil eraser",
  768: "rugby ball",
  769: "rule, ruler",
  770: "running shoe",
  771: "safe",
  772: "safety pin",
  773: "saltshaker, salt shaker",
  774: "sandal",
  775: "sarong",
  776: "sax, saxophone",
  777: "scabbard",
  778: "scale, weighing machine",
  779: "school bus",
  780: "schooner",
  781: "scoreboard",
  782: "screen, CRT screen",
  783: "screw",
  784: "screwdriver",
  785: "seat belt, seatbelt",
  786: "sewing machine",
  787: "shield, buckler",
  788: "shoe shop, shoe-shop, shoe store",
  789: "shoji",
  790: "shopping basket",
  791: "shopping cart",
  792: "shovel",
  793: "shower cap",
  794: "shower curtain",
  795: "ski",
  796: "ski mask",
  797: "sleeping bag",
  798: "slide rule, slipstick",
  799: "sliding door",
  800: "slot, one-armed bandit",
  801: "snorkel",
  802: "snowmobile",
  803: "snowplow, snowplough",
  804: "soap dispenser",
  805: "soccer ball",
  806: "sock",
  807: "solar dish, solar collector, solar furnace",
  808: "sombrero",
  809: "soup bowl",
  810: "space bar",
  811: "space heater",
  812: "space shuttle",
  813: "spatula",
  814: "speedboat",
  815: "spider web, spider's web",
  816: "spindle",
  817: "sports car, sport car",
  818: "spotlight, spot",
  819: "stage",
  820: "steam locomotive",
  821: "steel arch bridge",
  822: "steel drum",
  823: "stethoscope",
  824: "stole",
  825: "stone wall",
  826: "stopwatch, stop watch",
  827: "stove",
  828: "strainer",
  829: "streetcar, tram, tramcar, trolley, trolley car",
  830: "stretcher",
  831: "studio couch, day bed",
  832: "stupa, tope",
  833: "submarine, pigboat, sub, U-boat",
  834: "suit, suit of clothes",
  835: "sundial",
  836: "sunglass",
  837: "sunglasses, dark glasses, shades",
  838: "sunscreen, sunblock, sun blocker",
  839: "suspension bridge",
  840: "swab, swob, mop",
  841: "sweatshirt",
  842: "swimming trunks, bathing trunks",
  843: "swing",
  844: "switch, electric switch, electrical switch",
  845: "syringe",
  846: "table lamp",
  847: "tank, army tank, armored combat vehicle, armoured combat vehicle",
  848: "tape player",
  849: "teapot",
  850: "teddy, teddy bear",
  851: "television, television system",
  852: "tennis ball",
  853: "thatch, thatched roof",
  854: "theater curtain, theatre curtain",
  855: "thimble",
  856: "thresher, thrasher, threshing machine",
  857: "throne",
  858: "tile roof",
  859: "toaster",
  860: "tobacco shop, tobacconist shop, tobacconist",
  861: "toilet seat",
  862: "torch",
  863: "totem pole",
  864: "tow truck, tow car, wrecker",
  865: "toyshop",
  866: "tractor",
  867: "trailer truck, tractor trailer, trucking rig, rig, articulated lorry, semi",
  868: "tray",
  869: "trench coat",
  870: "tricycle, trike, velocipede",
  871: "trimaran",
  872: "tripod",
  873: "triumphal arch",
  874: "trolleybus, trolley coach, trackless trolley",
  875: "trombone",
  876: "tub, vat",
  877: "turnstile",
  878: "typewriter keyboard",
  879: "umbrella",
  880: "unicycle, monocycle",
  881: "upright, upright piano",
  882: "vacuum, vacuum cleaner",
  883: "vase",
  884: "vault",
  885: "velvet",
  886: "vending machine",
  887: "vestment",
  888: "viaduct",
  889: "violin, fiddle",
  890: "volleyball",
  891: "waffle iron",
  892: "wall clock",
  893: "wallet, billfold, notecase, pocketbook",
  894: "wardrobe, closet, press",
  895: "warplane, military plane",
  896: "washbasin, handbasin, washbowl, lavabo, wash-hand basin",
  897: "washer, automatic washer, washing machine",
  898: "water bottle",
  899: "water jug",
  900: "water tower",
  901: "whiskey jug",
  902: "whistle",
  903: "wig",
  904: "window screen",
  905: "window shade",
  906: "Windsor tie",
  907: "wine bottle",
  908: "wing",
  909: "wok",
  910: "wooden spoon",
  911: "wool, woolen, woollen",
  912: "worm fence, snake fence, snake-rail fence, Virginia fence",
  913: "wreck",
  914: "yawl",
  915: "yurt",
  916: "web site, website, internet site, site",
  917: "comic book",
  918: "crossword puzzle, crossword",
  919: "street sign",
  920: "traffic light, traffic signal, stoplight",
  921: "book jacket, dust cover, dust jacket, dust wrapper",
  922: "menu",
  923: "plate",
  924: "guacamole",
  925: "consomme",
  926: "hot pot, hotpot",
  927: "trifle",
  928: "ice cream, icecream",
  929: "ice lolly, lolly, lollipop, popsicle",
  930: "French loaf",
  931: "bagel, beigel",
  932: "pretzel",
  933: "cheeseburger",
  934: "hotdog, hot dog, red hot",
  935: "mashed potato",
  936: "head cabbage",
  937: "broccoli",
  938: "cauliflower",
  939: "zucchini, courgette",
  940: "spaghetti squash",
  941: "acorn squash",
  942: "butternut squash",
  943: "cucumber, cuke",
  944: "artichoke, globe artichoke",
  945: "bell pepper",
  946: "cardoon",
  947: "mushroom",
  948: "Granny Smith",
  949: "strawberry",
  950: "orange",
  951: "lemon",
  952: "fig",
  953: "pineapple, ananas",
  954: "banana",
  955: "jackfruit, jak, jack",
  956: "custard apple",
  957: "pomegranate",
  958: "hay",
  959: "carbonara",
  960: "chocolate sauce, chocolate syrup",
  961: "dough",
  962: "meat loaf, meatloaf",
  963: "pizza, pizza pie",
  964: "potpie",
  965: "burrito",
  966: "red wine",
  967: "espresso",
  968: "cup",
  969: "eggnog",
  970: "alp",
  971: "bubble",
  972: "cliff, drop, drop-off",
  973: "coral reef",
  974: "geyser",
  975: "lakeside, lakeshore",
  976: "promontory, headland, head, foreland",
  977: "sandbar, sand bar",
  978: "seashore, coast, seacoast, sea-coast",
  979: "valley, vale",
  980: "volcano",
  981: "ballplayer, baseball player",
  982: "groom, bridegroom",
  983: "scuba diver",
  984: "rapeseed",
  985: "daisy",
  986: "yellow lady's slipper, yellow lady-slipper, Cypripedium calceolus, Cypripedium parviflorum",
  987: "corn",
  988: "acorn",
  989: "hip, rose hip, rosehip",
  990: "buckeye, horse chestnut, conker",
  991: "coral fungus",
  992: "agaric",
  993: "gyromitra",
  994: "stinkhorn, carrion fungus",
  995: "earthstar",
  996: "hen-of-the-woods, hen of the woods, Polyporus frondosus, Grifola frondosa",
  997: "bolete",
  998: "ear, spike, capitulum",
  999: "toilet tissue, toilet paper, bathroom tissue",
};

// Function to get class name from class ID
function getClassName(classId: number): string {
  return IMAGENET_CLASSES[classId] || `Unknown class ${classId}`;
}

export async function runFastStyleOnnx(
  imageSrc: string,
  style: FastStyleId
): Promise<string> {
  try {
    console.log(`Starting style transfer with style: ${style}`);
    const session = await getSession(style);

    // Resolve input dimensions from model (default to 224x224 for Fast Neural Style)
    const inputName = session.inputNames[0];
    const inputMeta = session.inputMetadata[inputName];
    const dims = inputMeta?.dimensions as Array<number | string> | undefined;
    const H =
      Array.isArray(dims) && typeof dims[2] === "number" && dims[2] > 0
        ? dims[2]
        : 224;
    const W =
      Array.isArray(dims) && typeof dims[3] === "number" && dims[3] > 0
        ? dims[3]
        : 224;

    // Load image
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = "anonymous";
      el.onload = () => resolve(el);
      el.onerror = (e) => reject(e);
      el.src = imageSrc;
    });

    // Letterbox + tensorize
    const canvas = createLetterboxedCanvas(img, W, H);
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const imageData = ctx.getImageData(0, 0, W, H);
    const chw = imageDataToCHWFloat32(imageData);

    const ort = await loadOrt();
    const input = new ort.Tensor("float32", chw, [1, 3, H, W]);
    const feeds: Record<string, any> = { [inputName]: input };

    const results = await session.run(feeds);
    const outputName = session.outputNames[0];
    const output = results[outputName] as any;

    // Convert back to ImageData
    const outChw = output.data as Float32Array;
    const outImage = chwToImageData(outChw, W, H);
    ctx.putImageData(outImage, 0, 0);
    return canvas.toDataURL("image/png");
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error("ONNX fast style error:", reason);
    throw new Error(`ONNX failed: ${reason}`);
  }
}

export async function runAdversarialInception(
  imageSrc: string
): Promise<{ image: string; classification: string }> {
  try {
    console.log("Starting adversarial Inception v3 processing");
    const session = await getSession("adv-inception-v3");

    // Inception v3 typically expects 299x299 input
    const H = 299;
    const W = 299;

    // Load image
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = "anonymous";
      el.onload = () => resolve(el);
      el.onerror = (e) => reject(e);
      el.src = imageSrc;
    });

    // Letterbox + tensorize
    const canvas = createLetterboxedCanvas(img, W, H);
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const imageData = ctx.getImageData(0, 0, W, H);
    const chw = imageDataToCHWFloat32(imageData);

    const ort = await loadOrt();
    const input = new ort.Tensor("float32", chw, [1, 3, H, W]);
    const feeds: Record<string, any> = { [session.inputNames[0]]: input };

    const results = await session.run(feeds);
    const outputName = session.outputNames[0];
    const output = results[outputName] as any;

    // Get classification results (top 5 predictions)
    const rawOutput = output.data as Float32Array;

    // Apply softmax to convert raw logits to probabilities
    const maxVal = Math.max(...Array.from(rawOutput));
    const expValues = Array.from(rawOutput).map((val) =>
      Math.exp(val - maxVal)
    );
    const sumExp = expValues.reduce((sum, val) => sum + val, 0);
    const probabilities = expValues.map((val) => val / sumExp);

    const top5 = Array.from(probabilities)
      .map((prob, index) => ({ prob, index }))
      .sort((a, b) => b.prob - a.prob)
      .slice(0, 5);

    // Return a proper classification result with class names
    const topClassName = getClassName(top5[0].index);
    const secondClassName = getClassName(top5[1].index);
    const thirdClassName = getClassName(top5[2].index);

    const classification = `Top prediction: ${topClassName} (${(
      top5[0].prob * 100
    ).toFixed(2)}%)
Second: ${secondClassName} (${(top5[1].prob * 100).toFixed(2)}%)
Third: ${thirdClassName} (${(top5[2].prob * 100).toFixed(2)}%)`;

    // Return both the processed image and classification
    const outChw = output.data as Float32Array;
    const outImage = chwToImageData(outChw, W, H);
    ctx.putImageData(outImage, 0, 0);

    return {
      image: canvas.toDataURL("image/png"),
      classification,
    };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error("ONNX adversarial inception error:", reason);
    throw new Error(`ONNX failed: ${reason}`);
  }
}
