
export const DOMAINES = {
  mobilier: { nom: "Mobilier archéologique", domaine: "Archéologie" },
  architecture: { nom: "Architecture religieuse", domaine: "Architecture" },
  arts: { nom: "Arts décoratifs et peinture", domaine: "Histoire de l'art" },
}

export const DICTIONNAIRE = {
  amphore: { domaine: "mobilier", en: "amphora", alt: ["amphora", "jarre à anses"], broader: "récipient", narrower: ["amphore vinaire", "amphore à huile"], def: "Récipient en céramique à deux anses et col étroit, utilisé dans l'Antiquité pour le transport et le stockage du vin, de l'huile ou des salaisons." },
  fibule: { domaine: "mobilier", en: "fibula", alt: ["agrafe", "broche antique"], broader: "parure", narrower: ["fibule cruciforme", "fibule ansée"], def: "Épingle de sûreté antique, en métal, servant à fixer les vêtements et souvent ornée." },
  "lampe à huile": { domaine: "mobilier", en: "oil lamp", alt: ["lucerne"], broader: "luminaire", narrower: ["lampe à volutes", "lampe de firme"], def: "Petit récipient muni d'un bec où brûle une mèche alimentée par de l'huile, utilisé pour l'éclairage domestique." },
  "céramique sigillée": { domaine: "mobilier", en: "terra sigillata", alt: ["terre sigillée", "sigillée"], broader: "céramique", narrower: ["sigillée moulée", "sigillée lisse"], def: "Céramique romaine fine à vernis rouge brillant, souvent décorée en relief et portant l'estampille du potier." },
  ostracon: { domaine: "mobilier", en: "ostracon", alt: ["ostrakon", "tesson inscrit"], broader: "support d'écriture", narrower: [], def: "Fragment de poterie ou éclat de calcaire portant une inscription ou un dessin." },
  sarcophage: { domaine: "mobilier", en: "sarcophagus", alt: ["cercueil de pierre"], broader: "mobilier funéraire", narrower: ["sarcophage à strigiles", "sarcophage paléochrétien"], def: "Cercueil de pierre, de terre cuite ou de bois, souvent sculpté, destiné à recevoir le corps d'un défunt." },
  monnaie: { domaine: "mobilier", en: "coin", alt: ["pièce de monnaie", "numéraire"], broader: "objet monétaire", narrower: ["denier", "sesterce"], def: "Pièce de métal frappée par une autorité, servant de moyen d'échange et portant des marques officielles." },
  stèle: { domaine: "mobilier", en: "stele", alt: ["stela", "pierre dressée"], broader: "monument", narrower: ["stèle funéraire", "stèle votive"], def: "Pierre plate dressée verticalement, portant une inscription ou un décor sculpté, à vocation funéraire ou commémorative." },
  "urne funéraire": { domaine: "mobilier", en: "cinerary urn", alt: ["urne cinéraire"], broader: "mobilier funéraire", narrower: [], def: "Vase destiné à recueillir les cendres d'un défunt après crémation." },
  tesselle: { domaine: "mobilier", en: "tessera", alt: ["tessère", "abaque"], broader: "élément de mosaïque", narrower: [], def: "Petit cube de pierre, de verre ou de terre cuite entrant dans la composition d'une mosaïque." },
  torque: { domaine: "mobilier", en: "torc", alt: ["torques"], broader: "parure", narrower: [], def: "Collier rigide en métal, ouvert à l'avant, porté notamment par les peuples celtes." },

  chapelle: { domaine: "architecture", en: "chapel", alt: ["chapelle de dévotion"], broader: "édifice religieux", narrower: ["chapelle funéraire", "chapelle castrale", "chapelle votive"], def: "Édifice religieux de dimensions réduites, consacré au culte, qui n'a pas le statut d'église paroissiale." },
  cathédrale: { domaine: "architecture", en: "cathedral", alt: ["église cathédrale"], broader: "édifice religieux", narrower: ["cathédrale gothique", "cathédrale romane"], def: "Église principale d'un diocèse, où se trouve le siège de l'évêque." },
  chapiteau: { domaine: "architecture", en: "capital", alt: ["chapiteau sculpté"], broader: "élément d'architecture", narrower: ["chapiteau corinthien", "chapiteau historié"], def: "Partie supérieure d'une colonne ou d'un pilier, élargie et souvent sculptée, qui reçoit la charge de l'élément porté." },
  pilastre: { domaine: "architecture", en: "pilaster", alt: ["pilier engagé"], broader: "élément d'architecture", narrower: [], def: "Pilier plat engagé dans un mur, formant une légère saillie et comportant base et chapiteau." },
  retable: { domaine: "architecture", en: "retable", alt: ["rétable"], broader: "mobilier liturgique", narrower: ["retable sculpté", "retable peint"], def: "Construction verticale peinte ou sculptée placée derrière l'autel, servant de décor et d'enseignement religieux." },
  crypte: { domaine: "architecture", en: "crypt", alt: ["chapelle souterraine"], broader: "espace religieux", narrower: [], def: "Chapelle ou caveau souterrain situé sous le chœur d'une église, abritant souvent des reliques ou des sépultures." },
  abside: { domaine: "architecture", en: "apse", alt: ["chevet"], broader: "partie d'édifice", narrower: ["absidiole"], def: "Extrémité arrondie ou polygonale d'une église, située généralement derrière le chœur." },
  transept: { domaine: "architecture", en: "transept", alt: ["nef transversale"], broader: "partie d'édifice", narrower: ["croisillon"], def: "Partie d'une église perpendiculaire à la nef, qui donne au plan sa forme de croix." },
  clocher: { domaine: "architecture", en: "bell tower", alt: ["campanile", "beffroi"], broader: "partie d'édifice", narrower: ["flèche"], def: "Tour d'une église abritant les cloches." },
  nef: { domaine: "architecture", en: "nave", alt: ["vaisseau central"], broader: "partie d'édifice", narrower: ["bas-côté"], def: "Partie centrale d'une église, allant du portail à la croisée du transept, où se tiennent les fidèles." },
  tympan: { domaine: "architecture", en: "tympanum", alt: ["tympan sculpté"], broader: "élément d'architecture", narrower: [], def: "Espace compris entre le linteau et l'arc d'un portail, souvent orné de sculptures." },
  bénitier: { domaine: "architecture", en: "holy water stoup", alt: ["vasque à eau bénite"], broader: "mobilier liturgique", narrower: [], def: "Vasque placée à l'entrée d'une église, contenant l'eau bénite." },
  oculus: { domaine: "architecture", en: "oculus", alt: ["œil-de-bœuf"], broader: "baie", narrower: [], def: "Ouverture circulaire pratiquée dans un mur ou au sommet d'une coupole." },
  "fonts baptismaux": { domaine: "architecture", en: "baptismal font", alt: ["cuve baptismale"], broader: "mobilier liturgique", narrower: [], def: "Bassin destiné à contenir l'eau du baptême, placé dans une église ou un baptistère." },

  fresque: { domaine: "arts", en: "fresco", alt: ["peinture murale à fresque"], broader: "peinture murale", narrower: ["fresque romane"], def: "Peinture murale réalisée sur un enduit de chaux encore frais, dans lequel les pigments se fixent en séchant." },
  mosaïque: { domaine: "arts", en: "mosaic", alt: ["opus tessellatum"], broader: "revêtement décoratif", narrower: ["mosaïque de pavement", "mosaïque pariétale"], def: "Assemblage de tesselles fixées dans un mortier pour former un motif ou une image." },
  enluminure: { domaine: "arts", en: "illumination", alt: ["miniature", "lettrine ornée"], broader: "décor de manuscrit", narrower: ["lettrine historiée"], def: "Décor peint ou dessiné ornant un manuscrit : lettrines, encadrements et miniatures." },
  tapisserie: { domaine: "arts", en: "tapestry", alt: ["tenture"], broader: "art textile", narrower: ["tapisserie de haute lisse"], def: "Ouvrage textile tissé à la main sur un métier, dont le décor est formé par les fils de trame." },
  émail: { domaine: "arts", en: "enamel", alt: ["émaillerie"], broader: "technique décorative", narrower: ["émail champlevé", "émail cloisonné"], def: "Matière vitreuse colorée, fondue sur un support métallique ou céramique pour le décorer." },
  marqueterie: { domaine: "arts", en: "marquetry", alt: ["placage décoratif"], broader: "art du bois", narrower: ["marqueterie Boulle"], def: "Décor formé de pièces de bois ou d'autres matériaux découpées et assemblées en placage sur un meuble." },
  icône: { domaine: "arts", en: "icon", alt: ["image sainte"], broader: "peinture religieuse", narrower: [], def: "Image sacrée peinte sur panneau de bois, propre aux traditions chrétiennes orientales." },
  vitrail: { domaine: "arts", en: "stained glass", alt: ["verrière"], broader: "art du verre", narrower: ["vitrail historié", "grisaille"], def: "Composition de pièces de verre colorées assemblées par des plombs, fermant une baie." },
  orfèvrerie: { domaine: "arts", en: "goldsmithing", alt: ["travail des métaux précieux"], broader: "arts du métal", narrower: ["orfèvrerie religieuse"], def: "Art de fabriquer des objets en métaux précieux, notamment la vaisselle et les objets liturgiques." },
  gravure: { domaine: "arts", en: "engraving", alt: ["estampe gravée"], broader: "arts graphiques", narrower: ["eau-forte", "burin"], def: "Technique consistant à inciser une matrice pour en tirer des épreuves imprimées ; l'épreuve elle-même." },
  polyptyque: { domaine: "arts", en: "polyptych", alt: ["retable à volets"], broader: "peinture sur panneau", narrower: ["triptyque"], def: "Œuvre peinte ou sculptée composée de plusieurs panneaux articulés." },
  diptyque: { domaine: "arts", en: "diptych", alt: ["tablette double"], broader: "peinture sur panneau", narrower: [], def: "Œuvre composée de deux panneaux reliés par des charnières." },
}

export const SOURCES_EXTERNES = [
  { id: "pactols", nom: "PACTOLS (Frantiq)", base: "https://pactols.frantiq.fr/exemple/", serveur: "mcp-opentheso" },
  { id: "aat", nom: "Getty AAT", base: "http://vocab.getty.edu/aat/exemple-", serveur: "mcp-getty" },
  { id: "wikidata", nom: "Wikidata", base: "https://www.wikidata.org/wiki/exemple-", serveur: "mcp-wikidata" },
  { id: "rameau", nom: "RAMEAU (BnF)", base: "https://data.bnf.fr/exemple/", serveur: "mcp-bnf" },
]

export const MODELES = {
  concepts: ["Mistral-7B", "Llama-3.1-8B", "Qwen2.5-7B"],
  thesaurus: ["Mistral-7B", "Llama-3.1-8B"],
  alignements: ["Mistral 7B · agent MCP", "Llama 3.1 8B · agent MCP"],
}

export function lookup(label) {
  return DICTIONNAIRE[label.trim().toLowerCase()]
}
