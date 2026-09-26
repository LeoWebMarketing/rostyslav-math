# Klasno - image prompts (Codex image_generation)

Shared style block (prepend to every prompt):
> Cartoon illustration for a kids' learning app, ages 7-9. Friendly prehistoric jungle adventure mood.
> Clean bold outlines, flat colors with soft cel shading, big expressive eyes, rounded shapes, no scary
> teeth, no blood. Palette: leaf green #2FB36B, deep jungle #12352A, sand #FFF6DF, sun yellow #FFC23D,
> sunset orange #FF8A3D, sky blue #5CC8F5, berry purple #B04ADB. No text unless specified. No logos or
> trademarks of any film or brand (nothing from Jurassic Park). No photorealism.

| # | File | Size | Background | Prompt |
|---|---|---|---|---|
| 1 | `logo-mark.png` | 1024x1024 | transparent | Mascot "Дино": a cute green baby T-rex with a small explorer hat and a yellow pencil tucked behind its ear, waving, head-and-shoulders, centered, reads clearly at 32px. |
| 2 | `logo-wordmark.png` | 2048x640 | transparent | Horizontal logo: the mascot head on the left and the word **Класно** in chunky rounded bold Cyrillic letters, deep jungle #12352A with a sun-yellow #FFC23D outline; the letter "о" at the end is a dinosaur egg. Exact spelling: К-л-а-с-н-о. |
| 3 | `mascot-hello.png` | 1024x1024 | transparent | Full body Дино waving hello, standing. |
| 4 | `mascot-thinking.png` | 1024x1024 | transparent | Дино scratching head with a claw, question mark above. |
| 5 | `mascot-cheer.png` | 1024x1024 | transparent | Дино jumping with both arms up, confetti and stars. |
| 6 | `mascot-oops.png` | 1024x1024 | transparent | Дино with a gentle "oops" face, encouraging, one claw up (not sad). |
| 7 | `mascot-sleep.png` | 1024x1024 | transparent | Дино curled up sleeping on a leaf, "zzz". |
| 8 | `subject-math.png` | 1024x1024 | transparent | Icon: a triceratops holding numbers 1 2 3 and a plus sign, sun-yellow accent. |
| 9 | `subject-ukrainian.png` | 1024x1024 | transparent | Icon: a stegosaurus reading an open book, a sunflower and a vyshyvanka-pattern bookmark, berry-purple accent. Letters on the book: "А Б В" only. |
| 10 | `subject-english.png` | 1024x1024 | transparent | Icon: a brachiosaurus with a speech bubble "ABC", sky-blue accent. |
| 11 | `grade-2-card.png` | 1200x800 | opaque | Card art for "2nd grade - classic games": dark #0f0f1a background, neon pink #FF0080 and teal #00F5D4 circle, triangle and square shapes, playful numbers floating. No people, no masks, no text. |
| 12 | `grade-3-card.png` | 1200x800 | opaque | Card art for "3rd grade": sunny jungle clearing, Дино with a backpack on a path leading to a volcano, ferns. No text. |
| 13 | `bg-jungle-tall.webp` | 1080x2340 | opaque | Vertical jungle background for phones: layered ferns and palms at the bottom and sides, soft sky, distant friendly volcano, lots of calm empty space in the middle for UI. Low detail, low contrast. |
| 14 | `bg-jungle-wide.webp` | 2560x1440 | opaque | Same scene, wide for tablets/desktop, empty calm centre. |
| 15 | `lesson-complete.png` | 1600x1200 | transparent | Дино and a small pterodactyl friend celebrating on top of a rock with a golden trophy egg and three gold stars. |
| 16 | `node-egg.png` | 512x512 | transparent | Lesson node: a round dinosaur egg button, sand color with green spots. |
| 17 | `node-egg-done.png` | 512x512 | transparent | Same egg hatched, little dino peeking out, golden glow. |
| 18 | `node-locked.png` | 512x512 | transparent | Same egg greyed with a small vine lock. |
| 19 | `runner-kid.png` | 1024x1024 | transparent | (Phase 2 preview) side view of a kid explorer running, hat and backpack, gender-neutral. |
| 20 | `runner-dino.png` | 1024x1024 | transparent | (Phase 2 preview) side view of a big goofy friendly T-rex running, tongue out, playful not scary. |

## Game art

Prepend the shared style block above to every prompt in this table. Use the existing mascot illustrations as the visual reference. Transparent means a real alpha channel; all sprites must be fully inside the frame with a small margin. The three parallax strips must tile horizontally.

| File | Size | Background | Prompt |
|---|---|---|---|
| `park-map-wide.webp` | 2400x1500 | opaque | Top-down wide island dinosaur park map: five clearly separated empty fenced enclosures at top-left, top-right, centre, bottom-left and bottom-right; connecting paths, visitor gate at bottom centre, lake and friendly volcano. No dinosaurs, people, text or signs. |
| `park-map-tall.webp` | 1500x2400 | opaque | Portrait version of the island park for phones: five large empty fenced enclosures stacked in a zig-zag, connecting paths, gate at bottom, lake and friendly volcano. No dinosaurs, people, text or signs. |
| `dino-raptor.webp` | 1024x1024 | transparent | Full-body slim raptor mid-run in side view facing right; green body with berry-purple accents, playful smile and friendly eye; no scary teeth. |
| `dino-triceratops.webp` | 1024x1024 | transparent | Full-body chunky triceratops mid-run in side view facing right; green body with sunset-orange accents and three rounded ivory horns; playful face. |
| `dino-trex.webp` | 1024x1024 | transparent | Full-body big goofy T-rex mid-run in side view facing right; leaf-green body, tiny arms and closed friendly smile; no scary teeth. |
| `dino-stegosaurus.webp` | 1024x1024 | transparent | Full-body stegosaurus mid-run in side view facing right; green body with sky-blue plates and rounded spiky tail; playful face. |
| `dino-pterodactyl.webp` | 1024x1024 | transparent | Full-body pterodactyl mid-flight in side view facing right, wings spread, sun-yellow accents, cheerful eye and closed beak. |
| `runner-run.webp` | 768x768 | transparent | Gender-neutral kid explorer in side view facing right, mid-run stride; tan safari hat with green band, short brown hair, teal shirt, tan shorts, orange backpack and yellow sneakers. Match the other runner poses exactly. |
| `runner-jump.webp` | 768x768 | transparent | The same kid explorer in side view facing right, jumping with knees tucked and arms raised for balance. Preserve hat, hair, clothes, backpack, shoes and face. |
| `runner-duck.webp` | 768x768 | transparent | The same kid explorer in side view facing right, ducking or sliding low with bent knees and a hand near the ground. Preserve hat, hair, clothes, backpack, shoes and face. |
| `obstacle-log.webp` | 768x384 | transparent | Single horizontal fallen jungle log to jump over, warm brown bark and a few fern leaves; no ground plane. |
| `obstacle-branch.webp` | 768x384 | transparent | Low hanging leafy branch and vine attached at the top edge, leaving open space below to duck under; no ground plane. |
| `obstacle-wall.webp` | 768x1024 | transparent | Chunky stone wall with a large completely blank light-sand wooden sign in the middle, occupying about 60% of the image width for app-rendered math questions. No letters or marks. |
| `obstacle-fence.webp` | 768x768 | transparent | Single straight wooden enclosure fence panel, front view, warm amber posts and horizontal rails; no ground plane. |
| `wall-rubble.webp` | 768x512 | transparent | Broken cartoon stone wall pieces flying outward with transparent gaps, playful and nonviolent; no ground plane. |
| `gate-exit.webp` | 1024x1024 | transparent | Open tropical dinosaur park exit gate with warm golden sunlight shining through and an inviting escape feeling; no flames, signs or text. |
| `ruby.webp` | 256x256 | transparent | Single shiny faceted red ruby gem with a strong simple silhouette readable at 24px. |
| `bg-far.webp` | 2400x800 | opaque | Wide calm far parallax layer with sky, distant friendly volcano and layered jungle hills; left and right edges connect seamlessly. No people or dinosaurs. |
| `bg-near.webp` | 2400x600 | transparent | Near parallax foliage: ferns and bushes along the bottom half; upper half entirely transparent; left and right edges connect seamlessly. |
| `ground.webp` | 1200x200 | opaque | Side-view horizontal sandy dirt path strip with a grassy top edge and brown earth below; seamless horizontal tile. |
