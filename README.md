# TX-08 DINO.MOD — Modular 8-Bit Chrome Dino 3D Print Configurator

A **MoMA Design Store × Teenage Engineering** inspired 3D configurator for a modular, 3D-printable **Chrome Browser Dino × Mr. Potato Head** figurine.

## Features
- **Mechanical Snap-Fit Architecture**: `dino_body` features **11 boolean-cut recessed socket holes** with anodized circular bezels (`anchor_head`, `anchor_eyes`, `anchor_snout`, `anchor_neck`, `anchor_chest`, `anchor_back`, `anchor_hand_r`, `anchor_hand_l`, `anchor_tail`, `anchor_foot_r`, `anchor_foot_l`). Every module features a coaxial notched split-barb peg protrusion.
- **46 Watertight 3D-Printable Modules**:
  - **12 8-Bit Voxel Industry Props**: Healthcare (`prop_healthcare`), Legal (`prop_legal`), Retail (`prop_retail`), Creative (`prop_creative`), Research (`prop_research`), Financial Services (`prop_finance`), Tech (`prop_tech`), Hospitality & Food (`prop_hospitality`), Travel (`prop_travel`), Manufacturing (`prop_manufacturing`), Industrial (`prop_industrial`), and Classic Chrome Cactus (`prop_cactus`).
  - **8 Headwear Modules**: Studio Over-Ear Headphones, Silk Top Hat, Propeller Cap, Safety Hardhat, 8-Bit Crown, Sheriff Stetson, Culinary Toque, and Viking Crest.
  - **4 Side-Mounted Eyewear Modules**: 8-Bit Deal Shades, Architect Rounds, TE Synth Visor, and Gold Monocle (custom-fitted to the Dino's blocky side eyes).
  - **6 Neck & Torso Fit Modules**: Matte Black Tech Bro Crewneck Tee, Midtown Patagonia-Style Fleece Zip Vest, Maker Overalls, Executive Silk Tie, Gold Cuban Chain, and 8-Bit Bowtie.
  - **Dorsal, Snout, Tail & Plinth Modules**: Brass Wind-Up Key, Twin Thruster Jetpack, Explorer Field Pack, 8-Bit Dragon Wings, Swallowtail Cape, High-Top Sneakers, Heavy Lug Boots, Chrome Desert Plinth, and Street Cruiser Skateboard.
- **1-Click Slicer Export**: Export watertight Z-up millimeter `.STL` files (**Merged Solid Figurine** or **Peg & Socket Build Plate Kit** at `80mm`–`150mm`) or full-color `.GLB`.

## Running Locally

```bash
node server.js
```

Then open [http://127.0.0.1:3030](http://127.0.0.1:3030).
