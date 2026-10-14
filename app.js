import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// ============================================================================
// 1. CATALOG OF ANCHOR SOCKETS, 43 NOTCHED-PEG MODULES & 11 INDUSTRY EDITIONS
// ============================================================================
// Note: Blender (x, y, z) exports to glTF Y-up as (x, z, -y).
// Every socket normal below matches the exact coaxial axis of the boolean-cut
// notched socket hole in `dino_body` and the notched peg on each module.

const SOCKET_DEFS = {
  anchor_head:   { slotId: 'head',  label: 'PORT 01 • CROWN',   defaultPos: new THREE.Vector3( 0.000,  0.946,  0.385), normal: new THREE.Vector3( 0,  1,  0) },
  anchor_eyes_r: { slotId: 'eyes',  label: 'PORT 02R • R-EYE',  defaultPos: new THREE.Vector3(-0.275,  0.646,  0.404), normal: new THREE.Vector3(-1,  0,  0) },
  anchor_eyes_l: { slotId: 'eyes',  label: 'PORT 02L • L-EYE',  defaultPos: new THREE.Vector3( 0.275,  0.646,  0.404), normal: new THREE.Vector3( 1,  0,  0) },
  anchor_snout:  { slotId: 'snout', label: 'PORT 03 • SNOUT',   defaultPos: new THREE.Vector3( 0.000,  0.440,  0.750), normal: new THREE.Vector3( 0,  0,  1) },
  anchor_neck:   { slotId: 'neck',  label: 'PORT 04 • COLLAR',  defaultPos: new THREE.Vector3( 0.000,  0.145,  0.474), normal: new THREE.Vector3( 0,  0,  1) },
  anchor_back:   { slotId: 'back',  label: 'PORT 05 • DORSAL',  defaultPos: new THREE.Vector3( 0.000,  0.020, -0.090), normal: new THREE.Vector3( 0,  0, -1) },
  anchor_hand_r: { slotId: 'hands', label: 'PORT 06 • R-WRIST', defaultPos: new THREE.Vector3(-0.539, -0.215,  0.270), normal: new THREE.Vector3(-1,  0,  0) },
  anchor_hand_l: { slotId: 'hands', label: 'PORT 07 • L-WRIST', defaultPos: new THREE.Vector3( 0.535, -0.215,  0.270), normal: new THREE.Vector3( 1,  0,  0) },
  anchor_tail:   { slotId: 'tail',  label: 'PORT 08 • TAIL',    defaultPos: new THREE.Vector3( 0.000, -0.221, -0.757), normal: new THREE.Vector3( 0,  0.52, -0.85).normalize() },
  anchor_base:   { slotId: 'base',  label: 'PORT 09 • SOLES',   defaultPos: new THREE.Vector3( 0.000, -0.950,  0.240), normal: new THREE.Vector3( 0, -1,  0) },
};

const SLOTS = [
  {
    id: 'hands',
    label: '8-Bit Props',
    anchorName: 'anchor_hand_r',
    camOffset: new THREE.Vector3(-0.35, 0.22, 3.05),
    lookAt: new THREE.Vector3(0, -0.05, 0.12),
  },
  {
    id: 'head',
    label: 'Headwear',
    anchorName: 'anchor_head',
    camOffset: new THREE.Vector3(0.75, 1.05, 2.35),
    lookAt: new THREE.Vector3(0, 0.72, 0.2),
  },
  {
    id: 'eyes',
    label: 'Optics',
    anchorName: 'anchor_eyes_l',
    camOffset: new THREE.Vector3(1.15, 0.72, 2.05),
    lookAt: new THREE.Vector3(0, 0.64, 0.38),
  },
  {
    id: 'snout',
    label: 'Snout',
    anchorName: 'anchor_snout',
    camOffset: new THREE.Vector3(0.75, 0.50, 2.15),
    lookAt: new THREE.Vector3(0, 0.44, 0.4),
  },
  {
    id: 'neck',
    label: 'Collar',
    anchorName: 'anchor_neck',
    camOffset: new THREE.Vector3(0.8, 0.25, 2.45),
    lookAt: new THREE.Vector3(0, 0.02, 0.25),
  },
  {
    id: 'back',
    label: 'Dorsal',
    anchorName: 'anchor_back',
    camOffset: new THREE.Vector3(-1.65, 0.45, -1.95),
    lookAt: new THREE.Vector3(0, 0.02, -0.15),
  },
  {
    id: 'tail',
    label: 'Tail',
    anchorName: 'anchor_tail',
    camOffset: new THREE.Vector3(1.55, 0.25, -1.85),
    lookAt: new THREE.Vector3(0, -0.12, -0.45),
  },
  {
    id: 'base',
    label: 'Footwear & Plinth',
    anchorName: 'anchor_base',
    camOffset: new THREE.Vector3(0.85, -0.25, 2.85),
    lookAt: new THREE.Vector3(0, -0.65, 0.1),
  },
  {
    id: 'finish',
    label: 'Chassis Resin',
    anchorName: null,
    camOffset: new THREE.Vector3(1.15, 0.45, 3.35),
    lookAt: new THREE.Vector3(0, 0.0, 0.0),
  },
];

// Each module maps to its Blender mesh name and the exact tension-fit socket hole it pegs into
const ACCESSORIES = [
  // 12 INDUSTRY-SPECIFIC 8-BIT VOXEL PROPS -> anchor_hand_r / anchor_hand_l
  { id: 'prop_healthcare',    slot: 'hands', group: 'hand_r', label: 'First-Aid Medkit',  badge: 'HEALTH • R', emoji: '🧰', anchor: 'anchor_hand_r' },
  { id: 'prop_legal',         slot: 'hands', group: 'hand_r', label: 'Yellow Legal Pad',  badge: 'LEGAL • R',  emoji: '📝', anchor: 'anchor_hand_r' },
  { id: 'prop_research',      slot: 'hands', group: 'hand_r', label: 'Erlenmeyer Flask',  badge: 'LAB • R',    emoji: '🧪', anchor: 'anchor_hand_r' },
  { id: 'prop_hospitality',   slot: 'hands', group: 'hand_r', label: 'Barista Steam Mug', badge: 'FOOD • R',   emoji: '☕', anchor: 'anchor_hand_r' },
  { id: 'prop_manufacturing', slot: 'hands', group: 'hand_r', label: 'Machined Gear Cog', badge: 'MFG • R',    emoji: '⚙️', anchor: 'anchor_hand_r' },
  { id: 'prop_industrial',    slot: 'hands', group: 'hand_r', label: 'Heavy Pipe Wrench', badge: 'IND • R',    emoji: '🔧', anchor: 'anchor_hand_r' },
  { id: 'prop_cactus',        slot: 'hands', group: 'hand_r', label: '8-Bit Desert Cactus',badge: 'CHROME • R',emoji: '🌵', anchor: 'anchor_hand_r' },
  { id: 'prop_tech',          slot: 'hands', group: 'hand_l', label: 'Retro Dev Terminal',badge: 'TECH • L',   emoji: '💻', anchor: 'anchor_hand_l' },
  { id: 'prop_finance',       slot: 'hands', group: 'hand_l', label: 'Bullish Chart Pad', badge: 'FIN • L',    emoji: '📈', anchor: 'anchor_hand_l' },
  { id: 'prop_retail',        slot: 'hands', group: 'hand_l', label: 'Boutique Tote Bag', badge: 'RETAIL • L', emoji: '🛍️', anchor: 'anchor_hand_l' },
  { id: 'prop_creative',      slot: 'hands', group: 'hand_l', label: 'Pixel Art Palette', badge: 'ART • L',    emoji: '🎨', anchor: 'anchor_hand_l' },
  { id: 'prop_travel',        slot: 'hands', group: 'hand_l', label: 'Jetsetter Suitcase',badge: 'TRAVEL • L', emoji: '✈️', anchor: 'anchor_hand_l' },

  // HEADWEAR (8) -> anchor_head
  { id: 'hat_headphones', slot: 'head', group: 'hat', label: 'Studio Headphones', emoji: '🎧', anchor: 'anchor_head' },
  { id: 'hat_tophat',     slot: 'head', group: 'hat', label: 'Silk Top Hat',      emoji: '🎩', anchor: 'anchor_head' },
  { id: 'hat_cap',        slot: 'head', group: 'hat', label: 'Propeller Cap',     emoji: '🧢', anchor: 'anchor_head' },
  { id: 'hat_hardhat',    slot: 'head', group: 'hat', label: 'Safety Hardhat',    emoji: '👷', anchor: 'anchor_head' },
  { id: 'hat_crown',      slot: 'head', group: 'hat', label: '8-Bit Crown',       emoji: '👑', anchor: 'anchor_head' },
  { id: 'hat_cowboy',     slot: 'head', group: 'hat', label: 'Sheriff Stetson',   emoji: '🤠', anchor: 'anchor_head' },
  { id: 'hat_chef',       slot: 'head', group: 'hat', label: 'Culinary Toque',    emoji: '👨‍🍳', anchor: 'anchor_head' },
  { id: 'hat_horns',      slot: 'head', group: 'hat', label: 'Viking Crest',      emoji: '🦕', anchor: 'anchor_head' },

  // OPTICS / SIDE-EYE EYEWEAR (4) -> anchor_eyes_l & anchor_eyes_r (side-of-head peg holes!)
  { id: 'eyes_pixel',   slot: 'eyes', group: 'eyes', label: '8-Bit Deal Shades', emoji: '🕶️', anchor: 'anchor_eyes_l' },
  { id: 'eyes_round',   slot: 'eyes', group: 'eyes', label: 'Architect Rounds',  emoji: '👓', anchor: 'anchor_eyes_l' },
  { id: 'eyes_vr',      slot: 'eyes', group: 'eyes', label: 'TE Synth Visor',    emoji: '🥽', anchor: 'anchor_eyes_l' },
  { id: 'eyes_monocle', slot: 'eyes', group: 'eyes', label: 'Gold Monocle',      emoji: '🧐', anchor: 'anchor_eyes_l' },

  // SNOUT / MOUTH (4) -> anchor_snout
  { id: 'snout_stache', slot: 'snout', group: 'snout', label: '8-Bit Handlebar', emoji: '🥸', anchor: 'anchor_snout' },
  { id: 'snout_pipe',   slot: 'snout', group: 'snout', label: 'Briar Smoke Pipe',emoji: '🪈', anchor: 'anchor_snout' },
  { id: 'snout_fire',   slot: 'snout', group: 'snout', label: 'Arcade Fireball', emoji: '🔥', anchor: 'anchor_snout' },
  { id: 'snout_clown',  slot: 'snout', group: 'snout', label: 'Voxel Honk Nose', emoji: '🔴', anchor: 'anchor_snout' },

  // COLLAR / HALF-WRAP NECK ACCESSORIES (5) -> anchor_neck
  { id: 'neck_tie',         slot: 'neck', group: 'collar', label: 'Exec Silk Tie',        emoji: '👔', anchor: 'anchor_neck' },
  { id: 'neck_stethoscope', slot: 'neck', group: 'collar', label: 'Clinical Stethoscope', emoji: '🩺', anchor: 'anchor_neck' },
  { id: 'neck_lanyard',     slot: 'neck', group: 'collar', label: 'Tech ID Lanyard',      emoji: '🪪', anchor: 'anchor_neck' },
  { id: 'neck_chain',       slot: 'neck', group: 'collar', label: 'Gold Cuban Chain',     emoji: '⛓️', anchor: 'anchor_neck' },
  { id: 'neck_bowtie',      slot: 'neck', group: 'collar', label: '8-Bit Bowtie',         emoji: '🎀', anchor: 'anchor_neck' },

  // DORSAL / BACK (5) -> anchor_back
  { id: 'back_windup',   slot: 'back', group: 'back', label: 'Brass Wind-Up Key', emoji: '🗝️', anchor: 'anchor_back' },
  { id: 'back_jetpack',  slot: 'back', group: 'back', label: 'Twin Thruster Pack',emoji: '🚀', anchor: 'anchor_back' },
  { id: 'back_backpack', slot: 'back', group: 'back', label: 'Field Explorer Bag',emoji: '🎒', anchor: 'anchor_back' },
  { id: 'back_wings',    slot: 'back', group: 'back', label: '8-Bit Dragon Wings',emoji: '🪽', anchor: 'anchor_back' },
  { id: 'back_cape',     slot: 'back', group: 'back', label: 'Swallowtail Cape',  emoji: '🦸', anchor: 'anchor_back' },

  // TAIL (3) -> anchor_tail
  { id: 'tail_spikes', slot: 'tail', group: 'tail', label: 'Stego Thagomizer', emoji: '⚡', anchor: 'anchor_tail' },
  { id: 'tail_flame',  slot: 'tail', group: 'tail', label: '8-Bit Tail Torch', emoji: '🔥', anchor: 'anchor_tail' },
  { id: 'tail_bow',    slot: 'tail', group: 'tail', label: 'Gift Ribbon Bow',  emoji: '🎗️', anchor: 'anchor_tail' },

  // FOOTWEAR & PLINTH (4) -> anchor_base (twin foot-sole pegs)
  { id: 'base_sneakers',   slot: 'base', group: 'base', label: '8-Bit High-Tops',   emoji: '👟', anchor: 'anchor_base' },
  { id: 'base_boots',      slot: 'base', group: 'base', label: 'Heavy Lug Boots',   emoji: '🥾', anchor: 'anchor_base' },
  { id: 'base_desert',     slot: 'base', group: 'base', label: 'Chrome Desert Base',emoji: '🏜️', anchor: 'anchor_base' },
  { id: 'base_skateboard', slot: 'base', group: 'base', label: 'Street Cruiser Deck',emoji: '🛹', anchor: 'anchor_base' },
];

const BODY_FINISHES = [
  { id: 'celadon',    label: 'TE Celadon Sage',     emoji: '🌿', color: '#8fb89d', scaleColor: '#486e58', roughness: 0.32, metalness: 0.02 },
  { id: 'chrome',     label: 'Chrome Offline Grey', emoji: '🦖', color: '#646870', scaleColor: '#3a3d42', roughness: 0.34, metalness: 0.06 },
  { id: 'bone',       label: 'MoMA Warm Bone',      emoji: '🦴', color: '#ebe6dc', scaleColor: '#b8b0a0', roughness: 0.36, metalness: 0.02 },
  { id: 'orange',     label: 'TE Field Orange',     emoji: '🟠', color: '#ea580c', scaleColor: '#9a3412', roughness: 0.30, metalness: 0.04 },
  { id: 'cobalt',     label: 'Klein Ultramarine',   emoji: '💙', color: '#3b82f6', scaleColor: '#1d4ed8', roughness: 0.32, metalness: 0.05 },
  { id: 'cyber',      label: 'OP-1 Signal Yellow',  emoji: '⚡', color: '#eab308', scaleColor: '#a16207', roughness: 0.30, metalness: 0.05 },
  { id: 'terracotta', label: 'Architectural Clay',  emoji: '🏺', color: '#d96b4b', scaleColor: '#8f3d24', roughness: 0.40, metalness: 0.02 },
  { id: 'obsidian',   label: 'Anodized Graphite',   emoji: '🖤', color: '#272a30', scaleColor: '#141619', roughness: 0.28, metalness: 0.14 },
];

const FILAMENT_SWATCHES = [
  { name: 'Factory Spec', hex: null },
  { name: 'Anodized Dark',hex: '#22252a' },
  { name: 'Signal Red',   hex: '#e03c32' },
  { name: 'Brass Gold',   hex: '#ebad28' },
  { name: 'Cobalt Blue',  hex: '#3878e8' },
  { name: 'Pure Ceramic', hex: '#f7f7f2' },
  { name: 'Saddle Ochre', hex: '#ab6c38' },
  { name: 'Synth Cyan',   hex: '#28d1eb' },
  { name: 'Mint Sage',    hex: '#47b872' },
  { name: 'Field Orange', hex: '#f26522' },
];

// 11 Curated Industry Edition Presets (All peg-on & half-wrap modules, zero wraparound clothing)
const OUTFIT_PRESETS = {
  tech: {
    label: 'Tech Bro Edition',
    items: ['hat_headphones', 'eyes_round', 'neck_lanyard', 'prop_tech', 'prop_hospitality', 'base_sneakers'],
    finish: 'celadon',
  },
  healthcare: {
    label: 'Healthcare Edition',
    items: ['neck_stethoscope', 'prop_healthcare'],
    finish: 'bone',
  },
  legal: {
    label: 'Legal Edition',
    items: ['neck_tie', 'prop_legal'],
    finish: 'chrome',
  },
  finance: {
    label: 'Finance Bro Edition',
    items: ['eyes_pixel', 'neck_tie', 'prop_finance'],
    finish: 'celadon',
  },
  creative: {
    label: 'Creative Studio Edition',
    items: ['hat_cap', 'eyes_round', 'snout_stache', 'neck_bowtie', 'back_wings', 'prop_creative', 'base_skateboard'],
    finish: 'bone',
  },
  retail: {
    label: 'Retail Boutique Edition',
    items: ['hat_crown', 'eyes_pixel', 'neck_chain', 'back_cape', 'prop_retail', 'tail_bow', 'base_sneakers'],
    finish: 'celadon',
  },
  research: {
    label: 'Research Lab Edition',
    items: ['eyes_vr', 'snout_pipe', 'neck_lanyard', 'back_jetpack', 'prop_research', 'tail_spikes', 'base_desert'],
    finish: 'bone',
  },
  hospitality: {
    label: 'Hospitality & Food Edition',
    items: ['hat_chef', 'snout_stache', 'neck_bowtie', 'back_windup', 'prop_hospitality', 'tail_bow', 'base_boots'],
    finish: 'terracotta',
  },
  travel: {
    label: 'Travel & Aviation Edition',
    items: ['hat_cowboy', 'eyes_pixel', 'neck_chain', 'back_backpack', 'prop_travel', 'tail_spikes', 'base_desert'],
    finish: 'celadon',
  },
  manufacturing: {
    label: 'Manufacturing Edition',
    items: ['hat_hardhat', 'eyes_vr', 'neck_lanyard', 'back_windup', 'prop_manufacturing', 'tail_spikes', 'base_boots'],
    finish: 'cyber',
  },
  industrial: {
    label: 'Industrial Field Edition',
    items: ['hat_hardhat', 'eyes_pixel', 'snout_pipe', 'back_backpack', 'prop_industrial', 'base_boots'],
    finish: 'orange',
  },
};

// ============================================================================
// 2. SOUND SYNTHESIZER (Tactile Mechanical Detent Snap Clicks)
// ============================================================================

class TactileAudio {
  constructor() {
    this.ctx = null;
  }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playSnap(isAttach = true) {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      if (isAttach) {
        osc.frequency.setValueAtTime(210, now);
        osc.frequency.exponentialRampToValueAtTime(620, now + 0.055);
      } else {
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.05);
      }
      gain.gain.setValueAtTime(0.13, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    } catch (_) {}
  }
}

const sfx = new TactileAudio();

// ============================================================================
// 3. THREE.JS SCENE, CAMERA, STUDIO SOFTBOX ENVIRONMENT & CYCLORAMA STAGE
// ============================================================================

const canvas = document.getElementById('webglCanvas');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.04;

const scene = new THREE.Scene();

// Museum-grade studio reflection environment (Teenage Engineering / MoMA product lighting)
const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.45;

const camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(1.25, 0.48, 3.55);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.minDistance = 1.25;
controls.maxDistance = 7.5;
controls.maxPolarAngle = Math.PI * 0.56;
controls.target.set(0, 0.04, 0);

let camGoalPos = null;
let camGoalTarget = null;
controls.addEventListener('start', () => {
  camGoalPos = null;
  camGoalTarget = null;
});

function focusCameraOnSlot(slotObj) {
  if (!slotObj || !slotObj.camOffset) return;
  camGoalPos = slotObj.camOffset.clone();
  camGoalTarget = (slotObj.lookAt || new THREE.Vector3(0, 0, 0)).clone();
}

// Key, Fill & Rim Studio Lighting
const hemiLight = new THREE.HemisphereLight(0xffffff, 0xdad5c8, 1.15);
hemiLight.position.set(0, 6, 0);
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight(0xfffdf8, 1.95);
keyLight.position.set(3.2, 5.4, 4.2);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 15;
const d = 2.4;
keyLight.shadow.camera.left = -d;
keyLight.shadow.camera.right = d;
keyLight.shadow.camera.top = d;
keyLight.shadow.camera.bottom = -d;
keyLight.shadow.bias = -0.0004;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xeef4ff, 0.75);
fillLight.position.set(-3.5, 2.2, 2.0);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 0.85);
rimLight.position.set(0.5, 3.2, -4.2);
scene.add(rimLight);

// Ground Contact Shadow Receiver Plane
const shadowPlaneGeo = new THREE.PlaneGeometry(12, 12);
const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.15 });
const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = -0.955;
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);

// Optional 3D Printer Slicer Build Plate (200x200mm representation)
const buildPlateGroup = new THREE.Group();
buildPlateGroup.position.y = -0.955;
buildPlateGroup.visible = false;
scene.add(buildPlateGroup);

{
  const plateGeo = new THREE.BoxGeometry(3.8, 0.04, 3.8);
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0x1e2026,
    roughness: 0.55,
    metalness: 0.25,
  });
  const plateMesh = new THREE.Mesh(plateGeo, plateMat);
  plateMesh.position.y = -0.022;
  plateMesh.receiveShadow = true;
  buildPlateGroup.add(plateMesh);

  const grid = new THREE.GridHelper(3.6, 18, 0xea580c, 0x3b404c);
  grid.position.y = 0.002;
  buildPlateGroup.add(grid);
}

// Coaxial Explode Guide Lines Group
const guideLinesGroup = new THREE.Group();
scene.add(guideLinesGroup);

// ============================================================================
// 4. STATE, MESH REGISTRY & SOCKET NODES
// ============================================================================

const state = {
  activeSlot: 'hands',
  lastInteractedItem: 'prop_tech',
  equipped: new Set(),
  customColors: {},
  bodyFinish: 'celadon',
  showAnchors: true,
  explodePegs: false,
  printMode: 'merged', // 'merged' | 'modular' | 'glb'
  printScaleMm: 100,   // 80 | 100 | 120 | 150
  previewBuildPlate: false,
};

let dinoBodyMesh = null;
const accessoryMeshes = {};    // id -> THREE.Object3D
const accessoryOrigMats = {};  // id -> Array<{ mesh, mat }>
const anchorNodes = {};        // anchorName -> { slotId, label, pos, normal, pinEl }
const activeAnimations = [];

const dinoRootGroup = new THREE.Group();
scene.add(dinoRootGroup);

function spawnSnapRipple(pos, normal) {
  const ringGeo = new THREE.RingGeometry(0.042, 0.068, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xea580c,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
  });
  const mesh = new THREE.Mesh(ringGeo, ringMat);
  mesh.position.copy(pos).addScaledVector(normal, 0.015);
  mesh.lookAt(pos.clone().add(normal));
  dinoRootGroup.add(mesh);

  const start = performance.now();
  activeAnimations.push((now) => {
    const t = Math.min(1, (now - start) / 360);
    const s = 1 + t * 2.6;
    mesh.scale.set(s, s, s);
    ringMat.opacity = 0.9 * (1 - t);
    if (t >= 1) {
      dinoRootGroup.remove(mesh);
      ringGeo.dispose();
      ringMat.dispose();
      return false;
    }
    return true;
  });
}

// ============================================================================
// 5. LOAD DINO KIT GLB (WITH 11 BOOLEAN-CUT CHASSIS HOLES & 43 NOTCHED MODULES)
// ============================================================================

const loader = new GLTFLoader();
const loadingPill = document.getElementById('loadingPill');

loader.load(
  '/models/dino_kit.glb?v=' + Date.now(),
  (gltf) => {
    const root = gltf.scene;

    // 1. Register all 10 interactive socket anchor definitions
    Object.entries(SOCKET_DEFS).forEach(([anchorName, def]) => {
      anchorNodes[anchorName] = {
        anchorName,
        slotId: def.slotId,
        label: def.label,
        pos: def.defaultPos.clone(),
        normal: def.normal.clone(),
        pinEl: null,
      };
    });

    // 2. Extract dino_body and all 43 snap-on modules
    const allNames = ['dino_body', ...ACCESSORIES.map((a) => a.id)];
    allNames.forEach((name) => {
      const obj = root.getObjectByName(name);
      if (!obj) return;

      obj.traverse((c) => {
        if (c.isMesh) {
          c.castShadow = true;
          c.receiveShadow = true;
        }
      });

      if (name === 'dino_body') {
        dinoBodyMesh = obj;
        dinoRootGroup.add(dinoBodyMesh);
      } else {
        const origMats = [];
        obj.traverse((c) => {
          if (c.isMesh) {
            c.material = c.material.clone();
            if (c.material.name !== 'Mat_Snap_Peg') {
              origMats.push({ mesh: c, mat: c.material.clone() });
            }
          }
        });
        accessoryOrigMats[name] = origMats;

        obj.visible = false;
        accessoryMeshes[name] = obj;
        dinoRootGroup.add(obj);
      }
    });

    loadingPill.classList.add('hidden');
    buildAnchorPinsOverlay();
    renderSlotTabs();
    renderAccessoryStrip();
    renderSwatches();

    // Equip Tech Industry Edition on launch!
    applyPreset('tech');
  },
  undefined,
  (err) => {
    console.error('Error loading dino_kit.glb:', err);
    document.getElementById('loadingText').textContent = 'FAILED TO LOAD TX-08 KIT';
  }
);

// ============================================================================
// 6. EQUIP / UNEQUIP WITH COAXIAL NOTCHED-PEG INSERTION ANIMATIONS
// ============================================================================

function getAccessorySlideVector(meta) {
  if (meta.slot === 'eyes' && meta.id !== 'eyes_monocle') {
    return new THREE.Vector3(0, 0, 1);
  }
  const anchorInfo = anchorNodes[meta.anchor];
  return anchorInfo ? anchorInfo.normal.clone() : new THREE.Vector3(0, 1, 0);
}

function toggleAccessory(accId, forceState = null, silent = false) {
  const meta = ACCESSORIES.find((a) => a.id === accId);
  const obj = accessoryMeshes[accId];
  if (!meta || !obj) return;

  const willEquip = forceState !== null ? forceState : !state.equipped.has(accId);

  if (willEquip) {
    // Unequip mutually exclusive modules in the same sub-group
    ACCESSORIES.forEach((other) => {
      if (other.id === accId || !state.equipped.has(other.id)) return;
      const sameGroup = other.slot === meta.slot && other.group === meta.group;
      if (sameGroup) {
        state.equipped.delete(other.id);
        if (accessoryMeshes[other.id]) {
          accessoryMeshes[other.id].visible = false;
        }
      }
    });

    state.equipped.add(accId);
    state.lastInteractedItem = accId;
    obj.visible = true;

    // Coaxial insertion animation: slides the module's tension-fit peg straight into the socket hole!
    const normal = getAccessorySlideVector(meta);
    const targetOffset = state.explodePegs ? 0.22 : 0.0;
    const startOffset = targetOffset + 0.26;
    const startTime = performance.now();

    activeAnimations.push((now) => {
      const elapsed = (now - startTime) / 1000;
      const duration = 0.34;
      if (elapsed >= duration) {
        updateSingleAccessoryTransform(accId);
        return false;
      }
      const progress = elapsed / duration;
      const spring = 1 - Math.cos(progress * Math.PI * 2.1) * Math.exp(-progress * 6.2);
      const curOffset = startOffset + (targetOffset - startOffset) * spring;
      obj.position.copy(normal).multiplyScalar(curOffset);
      return true;
    });

    const anchorInfo = anchorNodes[meta.anchor];
    if (anchorInfo && !silent) {
      spawnSnapRipple(anchorInfo.pos, anchorInfo.normal);
      if (meta.slot === 'eyes' && meta.id !== 'eyes_monocle' && anchorNodes.anchor_eyes_r) {
        spawnSnapRipple(anchorNodes.anchor_eyes_r.pos, anchorNodes.anchor_eyes_r.normal);
      }
      sfx.playSnap(true);
    }
  } else {
    state.equipped.delete(accId);
    obj.visible = false;
    obj.position.set(0, 0, 0);
    if (!silent) sfx.playSnap(false);
  }

  updateGroundPlaneHeight();
  updateAllUI();
}

function updateGroundPlaneHeight() {
  let lowestY = -0.955;
  if (state.explodePegs && (state.equipped.has('base_desert') || state.equipped.has('base_skateboard') || state.equipped.has('base_sneakers') || state.equipped.has('base_boots'))) {
    lowestY = -1.36;
  } else if (state.equipped.has('base_desert')) {
    lowestY = -1.055;
  } else if (state.equipped.has('base_skateboard')) {
    lowestY = -1.118;
  } else if (state.equipped.has('base_sneakers') || state.equipped.has('base_boots')) {
    lowestY = -1.158;
  }
  shadowPlane.position.y = lowestY;
  buildPlateGroup.position.y = lowestY;
}

function updateSingleAccessoryTransform(accId) {
  const obj = accessoryMeshes[accId];
  const meta = ACCESSORIES.find((a) => a.id === accId);
  if (!obj || !meta) return;

  // If previewing Modular Peg & Socket Kit on the Slicer Build Plate, arrange modules on the plate around the Dino
  if (state.previewBuildPlate && state.printMode === 'modular') {
    const equippedArr = Array.from(state.equipped);
    const idx = equippedArr.indexOf(accId);
    const count = Math.max(1, equippedArr.length);
    const angle = (idx / count) * Math.PI * 2 - Math.PI / 4;
    const radius = 1.28;

    obj.position.set(0, 0, 0);
    const bbox = new THREE.Box3().setFromObject(obj);
    const center = bbox.getCenter(new THREE.Vector3());
    const minY = bbox.min.y;
    const plateY = buildPlateGroup.position.y + 0.02;

    obj.position.set(
      Math.cos(angle) * radius - center.x,
      plateY - minY,
      Math.sin(angle) * radius - center.z
    );
    return;
  }

  // Otherwise, position on Dino (flush at 0.0 or pulled out by 0.22 along the socket axis to show the notched peg!)
  const normal = getAccessorySlideVector(meta);
  const offset = state.explodePegs ? 0.22 : 0.0;
  obj.position.copy(normal).multiplyScalar(offset);
}

function rebuildExplodeGuideLines() {
  while (guideLinesGroup.children.length > 0) {
    const child = guideLinesGroup.children[0];
    guideLinesGroup.remove(child);
    if (child.geometry) child.geometry.dispose();
  }
  if (!state.explodePegs) return;

  const lineMat = new THREE.LineDashedMaterial({
    color: 0xea580c,
    dashSize: 0.025,
    gapSize: 0.018,
    transparent: true,
    opacity: 0.82,
  });

  state.equipped.forEach((accId) => {
    const meta = ACCESSORIES.find((a) => a.id === accId);
    const anchorInfo = meta ? anchorNodes[meta.anchor] : null;
    if (!anchorInfo) return;
    const slideVec = getAccessorySlideVector(meta);
    const p0 = anchorInfo.pos.clone();
    const p1 = p0.clone().addScaledVector(slideVec, 0.22);
    const geo = new THREE.BufferGeometry().setFromPoints([p0, p1]);
    const line = new THREE.Line(geo, lineMat);
    line.computeLineDistances();
    guideLinesGroup.add(line);

    if (meta.slot === 'eyes' && meta.id !== 'eyes_monocle' && anchorNodes.anchor_eyes_r) {
      const p0r = anchorNodes.anchor_eyes_r.pos.clone();
      const p1r = p0r.clone().addScaledVector(slideVec, 0.22);
      const geor = new THREE.BufferGeometry().setFromPoints([p0r, p1r]);
      const liner = new THREE.Line(geor, lineMat);
      liner.computeLineDistances();
      guideLinesGroup.add(liner);
    }
  });
}

function syncAllAccessoryTransforms() {
  updateGroundPlaneHeight();
  ACCESSORIES.forEach((a) => {
    if (state.equipped.has(a.id)) {
      updateSingleAccessoryTransform(a.id);
    }
  });
  rebuildExplodeGuideLines();
}

function applyBodyFinish(finishId) {
  const finish = BODY_FINISHES.find((f) => f.id === finishId);
  if (!finish || !dinoBodyMesh) return;
  state.bodyFinish = finishId;

  dinoBodyMesh.traverse((c) => {
    if (!c.isMesh || !c.material) return;
    const matName = c.material.name || '';
    // Preserve 8-bit eye sclera, dark square pupil, anodized socket bezel, and recessed socket hole!
    if (
      matName === 'Mat_Socket_Hole' ||
      matName === 'Mat_Socket_Bezel' ||
      matName === 'Mat_Eye_White' ||
      matName === 'Mat_Eye_Pupil'
    ) {
      return;
    }

    if (matName === 'Mat_Dino_Scales') {
      c.material = new THREE.MeshStandardMaterial({
        name: 'Mat_Dino_Scales',
        color: new THREE.Color(finish.scaleColor || finish.color),
        roughness: finish.roughness + 0.04,
        metalness: finish.metalness,
      });
    } else {
      c.material = new THREE.MeshStandardMaterial({
        name: 'Mat_Dino_Chassis',
        color: new THREE.Color(finish.color),
        roughness: finish.roughness,
        metalness: finish.metalness,
      });
    }
  });

  sfx.playSnap(true);
  updateAllUI();
}

function applyColorToActiveItem(hex) {
  if (state.activeSlot === 'finish') return;
  let targetId = state.lastInteractedItem;
  const slotItem = ACCESSORIES.find((a) => a.slot === state.activeSlot && state.equipped.has(a.id));
  if (slotItem) targetId = slotItem.id;
  if (!targetId || !accessoryMeshes[targetId]) return;

  const origList = accessoryOrigMats[targetId] || [];
  if (!hex) {
    delete state.customColors[targetId];
    origList.forEach(({ mesh, mat }) => {
      mesh.material = mat.clone();
    });
  } else {
    state.customColors[targetId] = hex;
    if (origList.length > 0) {
      origList[0].mesh.material = origList[0].mat.clone();
      origList[0].mesh.material.color.set(hex);
    }
  }
  sfx.playSnap(true);
  renderSwatches();
}

function applyPreset(presetKey) {
  const preset = OUTFIT_PRESETS[presetKey];
  if (!preset) return;

  state.equipped.clear();
  Object.values(accessoryMeshes).forEach((m) => {
    m.visible = false;
    m.position.set(0, 0, 0);
  });

  applyBodyFinish(preset.finish || 'celadon');

  preset.items.forEach((id, idx) => {
    setTimeout(() => {
      toggleAccessory(id, true, idx > 0);
    }, idx * 42);
  });

  document.querySelectorAll('#presetChips .mini-chip').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.preset === presetKey);
  });
}

// ============================================================================
// 7. PILL UI RENDERING & DRAG-AND-DROP ONTO 3D ANCHOR SOCKETS
// ============================================================================

const slotTabsEl = document.getElementById('slotTabs');
const accessoryStripEl = document.getElementById('accessoryStrip');
const swatchRowEl = document.getElementById('swatchRow');
const anchorOverlayEl = document.getElementById('anchorOverlay');
const dragGhostEl = document.getElementById('dragGhost');

let dragState = null;

function buildAnchorPinsOverlay() {
  anchorOverlayEl.innerHTML = '';
  Object.entries(anchorNodes).forEach(([anchorName, info]) => {
    const pin = document.createElement('button');
    pin.className = 'anchor-pin';
    pin.dataset.anchor = anchorName;
    pin.innerHTML = `<span class="anchor-pin-label">${info.label}</span>`;
    pin.addEventListener('click', (e) => {
      e.stopPropagation();
      state.activeSlot = info.slotId;
      const slotObj = SLOTS.find((s) => s.id === info.slotId);
      focusCameraOnSlot(slotObj);
      updateAllUI();
    });
    info.pinEl = pin;
    anchorOverlayEl.appendChild(pin);
  });
}

function updateAnchorPinsProjection() {
  if (!state.showAnchors) {
    anchorOverlayEl.classList.add('hidden');
    return;
  }
  anchorOverlayEl.classList.remove('hidden');

  const w = window.innerWidth;
  const h = window.innerHeight;

  Object.entries(anchorNodes).forEach(([anchorName, info]) => {
    const pin = info.pinEl;
    if (!pin) return;

    const worldPos = info.pos.clone();
    const projected = worldPos.project(camera);

    if (projected.z > 1) {
      pin.style.display = 'none';
      return;
    }

    const x = (projected.x * 0.5 + 0.5) * w;
    const y = (-projected.y * 0.5 + 0.5) * h;

    pin.style.display = 'flex';
    pin.style.left = `${x}px`;
    pin.style.top = `${y}px`;

    const hasEquipped = ACCESSORIES.some((a) => {
      if (!state.equipped.has(a.id)) return false;
      if (a.anchor === anchorName) return true;
      if (anchorName === 'anchor_eyes_r' && a.slot === 'eyes' && a.id !== 'eyes_monocle') return true;
      return false;
    });
    pin.classList.toggle('equipped', hasEquipped);
    pin.classList.toggle('active', state.activeSlot === info.slotId);
  });
}

function renderSlotTabs() {
  slotTabsEl.innerHTML = '';
  SLOTS.forEach((slot) => {
    const btn = document.createElement('button');
    const isEquipped = ACCESSORIES.some((a) => a.slot === slot.id && state.equipped.has(a.id));
    btn.className = `slot-tab${state.activeSlot === slot.id ? ' active' : ''}`;
    btn.innerHTML = `
      <span>${slot.label}</span>
      ${isEquipped ? '<span class="slot-dot-equipped"></span>' : ''}
    `;
    btn.addEventListener('click', () => {
      state.activeSlot = slot.id;
      focusCameraOnSlot(slot);
      updateAllUI();
    });
    slotTabsEl.appendChild(btn);
  });
}

function renderAccessoryStrip() {
  accessoryStripEl.innerHTML = '';

  if (state.activeSlot === 'finish') {
    BODY_FINISHES.forEach((fin) => {
      const btn = document.createElement('button');
      btn.className = `acc-pill${state.bodyFinish === fin.id ? ' active' : ''}`;
      btn.innerHTML = `<span class="acc-emoji">${fin.emoji}</span><span>${fin.label}</span>`;
      btn.addEventListener('click', () => applyBodyFinish(fin.id));
      accessoryStripEl.appendChild(btn);
    });
    return;
  }

  const slotItems = ACCESSORIES.filter((a) => a.slot === state.activeSlot);

  // "Empty Port" chip to unclip current slot modules and reveal the bare recessed socket port!
  const hasAnyInSlot = slotItems.some((a) => state.equipped.has(a.id));
  const noneBtn = document.createElement('button');
  noneBtn.className = `acc-pill${!hasAnyInSlot ? ' active' : ''}`;
  noneBtn.innerHTML = `<span class="acc-emoji">⊘</span><span>Open Port</span>`;
  noneBtn.addEventListener('click', () => {
    slotItems.forEach((a) => {
      if (state.equipped.has(a.id)) toggleAccessory(a.id, false, true);
    });
    sfx.playSnap(false);
    updateAllUI();
  });
  accessoryStripEl.appendChild(noneBtn);

  slotItems.forEach((item) => {
    const active = state.equipped.has(item.id);
    const btn = document.createElement('button');
    btn.className = `acc-pill${active ? ' active' : ''}`;
    btn.title = 'Click to snap notched peg into chassis socket, or drag onto 3D port';
    btn.innerHTML = `
      <span class="acc-emoji">${item.emoji}</span>
      <span>${item.label}</span>
      ${item.badge ? `<span class="acc-badge">${item.badge}</span>` : ''}
    `;

    btn.addEventListener('click', () => {
      toggleAccessory(item.id);
    });

    // Pointer drag-to-socket support
    btn.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const startX = e.clientX;
      const startY = e.clientY;

      const onMove = (me) => {
        const dist = Math.hypot(me.clientX - startX, me.clientY - startY);
        if (!dragState && dist > 8) {
          dragState = {
            accId: item.id,
            anchorName: item.anchor,
            emoji: item.emoji,
            label: item.label,
            matched: false,
          };
          dragGhostEl.innerHTML = `<span>${item.emoji}</span><span>SNAP ${item.label.toUpperCase()}</span>`;
          dragGhostEl.classList.remove('hidden');
        }
        if (dragState) {
          dragGhostEl.style.left = `${me.clientX}px`;
          dragGhostEl.style.top = `${me.clientY}px`;
          checkDragProximity(me.clientX, me.clientY);
        }
      };

      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        if (dragState) {
          finishDragDrop();
        }
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });

    accessoryStripEl.appendChild(btn);
  });
}

function checkDragProximity(clientX, clientY) {
  if (!dragState) return;
  const candidateNames =
    dragState.anchorName === 'anchor_eyes_l'
      ? ['anchor_eyes_l', 'anchor_eyes_r']
      : [dragState.anchorName];

  let anyNear = false;
  candidateNames.forEach((name) => {
    const targetAnchor = anchorNodes[name];
    if (!targetAnchor) return;
    const worldPos = targetAnchor.pos.clone().project(camera);
    const sx = (worldPos.x * 0.5 + 0.5) * window.innerWidth;
    const sy = (-worldPos.y * 0.5 + 0.5) * window.innerHeight;
    const dist = Math.hypot(clientX - sx, clientY - sy);
    const isNear = dist < 135;
    if (isNear) anyNear = true;
    if (targetAnchor.pinEl) {
      targetAnchor.pinEl.classList.toggle('drop-target', isNear);
    }
  });
  dragState.matched = anyNear;
}

function finishDragDrop() {
  if (!dragState) return;
  ['anchor_eyes_l', 'anchor_eyes_r', dragState.anchorName].forEach((name) => {
    const targetAnchor = anchorNodes[name];
    if (targetAnchor?.pinEl) {
      targetAnchor.pinEl.classList.remove('drop-target');
    }
  });
  if (dragState.matched) {
    const targetAnchor = anchorNodes[dragState.anchorName];
    toggleAccessory(dragState.accId, true);
    showToast(`SNAPPED ${dragState.label.toUpperCase()} → ${targetAnchor?.label || 'PORT'}`);
  }
  dragGhostEl.classList.add('hidden');
  syncAllAccessoryTransforms();
  dragState = null;
}

function renderSwatches() {
  swatchRowEl.innerHTML = '';
  const slotItem = ACCESSORIES.find((a) => a.slot === state.activeSlot && state.equipped.has(a.id));
  const targetId = slotItem ? slotItem.id : state.lastInteractedItem;
  const activeHex = targetId ? state.customColors[targetId] || null : null;

  FILAMENT_SWATCHES.forEach((sw) => {
    const dot = document.createElement('button');
    dot.className = `swatch-dot${activeHex === sw.hex ? ' active' : ''}`;
    dot.title = `${sw.name} Filament`;
    dot.style.background = sw.hex
      ? sw.hex
      : 'conic-gradient(#e03c32, #ebad28, #47b872, #3878e8, #e03c32)';
    dot.addEventListener('click', () => applyColorToActiveItem(sw.hex));
    swatchRowEl.appendChild(dot);
  });
}

function updateTelemetryAndSpecs() {
  let totalTris = 0;
  if (dinoBodyMesh) {
    dinoBodyMesh.traverse((c) => {
      if (c.isMesh && c.geometry) {
        const idx = c.geometry.index;
        totalTris += idx ? idx.count / 3 : c.geometry.attributes.position.count / 3;
      }
    });
  }
  state.equipped.forEach((id) => {
    const obj = accessoryMeshes[id];
    if (!obj) return;
    obj.traverse((c) => {
      if (c.isMesh && c.geometry) {
        const idx = c.geometry.index;
        totalTris += idx ? idx.count / 3 : c.geometry.attributes.position.count / 3;
      }
    });
  });
  totalTris = Math.round(totalTris);

  const scaleFactor = state.printScaleMm / 1.9;
  const bbox = new THREE.Box3();
  if (dinoBodyMesh) bbox.expandByObject(dinoBodyMesh);
  state.equipped.forEach((id) => {
    if (accessoryMeshes[id]) bbox.expandByObject(accessoryMeshes[id]);
  });

  const size = bbox.getSize(new THREE.Vector3());
  const wMm = Math.round(size.x * scaleFactor);
  const dMm = Math.round(size.z * scaleFactor);
  const hMm = Math.round(size.y * scaleFactor);

  const volScale = Math.pow(state.printScaleMm / 100, 3);
  const baseGrams = 34 + state.equipped.size * 2.5;
  const estGrams = Math.round(baseGrams * volScale);

  document.getElementById('telemetrySummary').textContent = `${state.printScaleMm}MM • ~${estGrams}G PLA`;
  document.getElementById('specDims').textContent = `${wMm} × ${dMm} × ${hMm} mm`;
  document.getElementById('specParts').textContent = `1 chassis + ${state.equipped.size} module${state.equipped.size === 1 ? '' : 's'}`;
  document.getElementById('specTris').textContent = totalTris.toLocaleString();
  document.getElementById('specWeight').textContent = `~${estGrams}g PLA (20% infill)`;

  const dlText = document.getElementById('downloadBtnText');
  if (state.printMode === 'merged') {
    dlText.textContent = `DOWNLOAD MERGED .STL (${state.printScaleMm}MM)`;
  } else if (state.printMode === 'modular') {
    dlText.textContent = `DOWNLOAD PEG & SOCKET KIT .STL (${state.printScaleMm}MM)`;
  } else {
    dlText.textContent = `DOWNLOAD FULL COLOR .GLB`;
  }
}

function updateAllUI() {
  syncAllAccessoryTransforms();
  renderSlotTabs();
  renderAccessoryStrip();
  renderSwatches();
  updateTelemetryAndSpecs();
}

let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toastPill');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 2200);
}

// ============================================================================
// 8. BINARY .STL EXPORTER (Z-UP MILLIMETERS FOR 3D SLICERS) & .GLB EXPORTER
// ============================================================================

function collectPrintMeshes() {
  const meshesToExport = [];
  if (dinoBodyMesh) {
    dinoBodyMesh.updateMatrixWorld(true);
    dinoBodyMesh.traverse((c) => {
      if (c.isMesh) meshesToExport.push(c);
    });
  }

  state.equipped.forEach((id) => {
    const obj = accessoryMeshes[id];
    if (!obj) return;
    obj.updateMatrixWorld(true);
    obj.traverse((c) => {
      if (c.isMesh && c.visible) {
        meshesToExport.push(c);
      }
    });
  });

  return meshesToExport;
}

function generateBinarySTL() {
  const prevPreview = state.previewBuildPlate;
  const prevExplode = state.explodePegs;
  state.explodePegs = false;
  state.previewBuildPlate = state.printMode === 'modular';
  syncAllAccessoryTransforms();
  dinoRootGroup.updateMatrixWorld(true);

  const meshes = collectPrintMeshes();

  const scaleMm = state.printScaleMm / 1.9;
  let minY = Infinity;
  const vTemp = new THREE.Vector3();

  meshes.forEach((m) => {
    const posAttr = m.geometry.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      vTemp.fromBufferAttribute(posAttr, i).applyMatrix4(m.matrixWorld);
      if (vTemp.y < minY) minY = vTemp.y;
    }
  });

  let triCount = 0;
  meshes.forEach((m) => {
    const geom = m.geometry;
    triCount += geom.index ? geom.index.count / 3 : geom.attributes.position.count / 3;
  });

  const buffer = new ArrayBuffer(84 + triCount * 50);
  const view = new DataView(buffer);

  const headerStr = `TX-08 DINO.MOD 3D Print (${state.printMode.toUpperCase()} ${state.printScaleMm}mm)`;
  for (let i = 0; i < 80; i++) {
    view.setUint8(i, i < headerStr.length ? headerStr.charCodeAt(i) : 32);
  }
  view.setUint32(80, triCount, true);

  let offset = 84;
  const pA = new THREE.Vector3();
  const pB = new THREE.Vector3();
  const pC = new THREE.Vector3();
  const cb = new THREE.Vector3();
  const ab = new THREE.Vector3();

  const toSlicerMm = (v) => {
    const x = v.x * scaleMm;
    const y = -v.z * scaleMm;
    const z = (v.y - minY) * scaleMm;
    v.set(x, y, z);
  };

  meshes.forEach((m) => {
    const geom = m.geometry;
    const posAttr = geom.attributes.position;
    const indexAttr = geom.index;
    const count = indexAttr ? indexAttr.count : posAttr.count;

    for (let i = 0; i < count; i += 3) {
      const i0 = indexAttr ? indexAttr.getX(i) : i;
      const i1 = indexAttr ? indexAttr.getX(i + 1) : i + 1;
      const i2 = indexAttr ? indexAttr.getX(i + 2) : i + 2;

      pA.fromBufferAttribute(posAttr, i0).applyMatrix4(m.matrixWorld);
      pB.fromBufferAttribute(posAttr, i1).applyMatrix4(m.matrixWorld);
      pC.fromBufferAttribute(posAttr, i2).applyMatrix4(m.matrixWorld);

      toSlicerMm(pA);
      toSlicerMm(pB);
      toSlicerMm(pC);

      cb.subVectors(pC, pB);
      ab.subVectors(pA, pB);
      cb.cross(ab).normalize();

      view.setFloat32(offset, cb.x, true); offset += 4;
      view.setFloat32(offset, cb.y, true); offset += 4;
      view.setFloat32(offset, cb.z, true); offset += 4;

      view.setFloat32(offset, pA.x, true); offset += 4;
      view.setFloat32(offset, pA.y, true); offset += 4;
      view.setFloat32(offset, pA.z, true); offset += 4;

      view.setFloat32(offset, pB.x, true); offset += 4;
      view.setFloat32(offset, pB.y, true); offset += 4;
      view.setFloat32(offset, pB.z, true); offset += 4;

      view.setFloat32(offset, pC.x, true); offset += 4;
      view.setFloat32(offset, pC.y, true); offset += 4;
      view.setFloat32(offset, pC.z, true); offset += 4;

      view.setUint16(offset, 0, true); offset += 2;
    }
  });

  state.previewBuildPlate = prevPreview;
  state.explodePegs = prevExplode;
  syncAllAccessoryTransforms();

  return new Blob([buffer], { type: 'application/octet-stream' });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function handleExportPrint() {
  if (state.printMode === 'glb') {
    const exporter = new GLTFExporter();
    exporter.parse(
      dinoRootGroup,
      (result) => {
        const blob = new Blob([result], { type: 'model/gltf-binary' });
        downloadBlob(blob, `tx08-dino-mod-${state.printScaleMm}mm.glb`);
        showToast('EXPORTED CUSTOMIZED TX-08 .GLB ARTIFACT');
      },
      (err) => console.error(err),
      { binary: true, onlyVisible: true }
    );
    return;
  }

  const stlBlob = generateBinarySTL();
  const suffix = state.printMode === 'modular' ? 'peg-socket-kit' : 'merged-artifact';
  downloadBlob(stlBlob, `tx08-dino-${suffix}-${state.printScaleMm}mm.stl`);
  showToast(`EXPORTED 3D-PRINTABLE ${suffix.toUpperCase()} (.STL)`);
}

// ============================================================================
// 9. TOP BAR & POPOVER EVENT LISTENERS
// ============================================================================

document.getElementById('btnToggleAnchors').addEventListener('click', (e) => {
  state.showAnchors = !state.showAnchors;
  e.currentTarget.classList.toggle('active', state.showAnchors);
});

document.getElementById('btnTogglePegs').addEventListener('click', (e) => {
  state.explodePegs = !state.explodePegs;
  e.currentTarget.classList.toggle('active', state.explodePegs);
  syncAllAccessoryTransforms();
  sfx.playSnap(state.explodePegs);
  showToast(state.explodePegs ? 'EXPLODED DIAGRAM: COAXIAL NOTCHED PEGS & SOCKET PORTS' : 'MODULES LOCKED FLUSH INTO CHASSIS PORTS');
});

document.getElementById('btnRandomize').addEventListener('click', () => {
  state.equipped.clear();
  Object.values(accessoryMeshes).forEach((m) => (m.visible = false));

  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const groupsToPick = ['hat', 'eyes', 'snout', 'torso', 'back', 'hand_r', 'hand_l', 'tail', 'base'];
  groupsToPick.forEach((grp, idx) => {
    if (Math.random() < 0.85 || grp === 'hand_r' || grp === 'hand_l') {
      const candidates = ACCESSORIES.filter((a) => a.group === grp);
      const chosen = pickRandom(candidates);
      if (chosen) {
        setTimeout(() => toggleAccessory(chosen.id, true, idx > 0), idx * 38);
      }
    }
  });
  showToast('RANDOMIZED TX-08 MODULAR LOADOUT');
});

document.getElementById('btnReset').addEventListener('click', () => {
  state.equipped.clear();
  Object.values(accessoryMeshes).forEach((m) => {
    m.visible = false;
    m.position.set(0, 0, 0);
  });
  sfx.playSnap(false);
  updateAllUI();
  showToast('ALL MODULES DETACHED — BARE 11-PORT CHASSIS');
});

document.getElementById('btnTheme').addEventListener('click', () => {
  const body = document.body;
  const next = body.dataset.theme === 'dark' ? 'light' : 'dark';
  body.dataset.theme = next;
  shadowPlaneMat.opacity = next === 'dark' ? 0.34 : 0.15;
});

document.querySelectorAll('#presetChips .mini-chip').forEach((btn) => {
  btn.addEventListener('click', () => {
    applyPreset(btn.dataset.preset);
    const p = OUTFIT_PRESETS[btn.dataset.preset];
    if (p) showToast(`LOADED ${p.label.toUpperCase()}`);
  });
});

const exportModal = document.getElementById('exportModal');
document.getElementById('btnOpenExport').addEventListener('click', (e) => {
  e.stopPropagation();
  exportModal.classList.toggle('hidden');
  updateTelemetryAndSpecs();
});

document.addEventListener('click', (e) => {
  if (!exportModal.classList.contains('hidden')) {
    if (!exportModal.contains(e.target) && !document.getElementById('topRightPill').contains(e.target)) {
      exportModal.classList.add('hidden');
    }
  }
});

document.querySelectorAll('#printModeGroup .seg-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.printMode = btn.dataset.mode;
    document.querySelectorAll('#printModeGroup .seg-btn').forEach((b) => b.classList.toggle('active', b === btn));
    updateAllUI();
  });
});

document.querySelectorAll('#printScaleGroup .seg-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.printScaleMm = parseInt(btn.dataset.scale, 10);
    document.querySelectorAll('#printScaleGroup .seg-btn').forEach((b) => b.classList.toggle('active', b === btn));
    updateTelemetryAndSpecs();
  });
});

document.getElementById('btnTogglePlatePreview').addEventListener('click', (e) => {
  state.previewBuildPlate = !state.previewBuildPlate;
  buildPlateGroup.visible = state.previewBuildPlate;
  e.currentTarget.classList.toggle('active', state.previewBuildPlate);
  document.getElementById('plateToggleIndicator').textContent = state.previewBuildPlate ? 'ON' : 'OFF';
  if (state.previewBuildPlate) {
    camGoalPos = new THREE.Vector3(2.2, 1.85, 3.6);
    camGoalTarget = new THREE.Vector3(0, -0.35, 0);
  }
  syncAllAccessoryTransforms();
});

document.getElementById('btnDownloadPrint').addEventListener('click', handleExportPrint);

// ============================================================================
// 10. RENDER LOOP & RESIZE HANDLER
// ============================================================================

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate(now) {
  requestAnimationFrame(animate);

  if (camGoalPos && camGoalTarget) {
    camera.position.lerp(camGoalPos, 0.08);
    controls.target.lerp(camGoalTarget, 0.08);
    if (camera.position.distanceTo(camGoalPos) < 0.02) {
      camGoalPos = null;
      camGoalTarget = null;
    }
  }

  for (let i = activeAnimations.length - 1; i >= 0; i--) {
    const keep = activeAnimations[i](now);
    if (!keep) activeAnimations.splice(i, 1);
  }

  controls.update();
  updateAnchorPinsProjection();
  renderer.render(scene, camera);
}

requestAnimationFrame(animate);
