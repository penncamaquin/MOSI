# MoSi Study mode (PSO exit assignment) - inside evacuation_sim.html

Open `evacuation_sim.html` in a browser. No install, no server.

## Quick start
1. Click **Study** (top bar), then **Demo** under **Map** (left panel). It draws 3 rooms, a corridor, 3 exits (A left, B bottom, C right), 3 Start zones, and 1 safe zone (the assembly area, an open field below the building).
2. Press **Run study** (left panel). It takes a few seconds.
3. Use **Replay** (right panel) to watch any scenario, method and seed. Pick the speed, drag the slider, or press Replay. The replay shows one method at a time. **Dot color = which exit that person uses** (legend under the replay controls). Blue, orange and green mean the methods only in the results tables and charts.
4. **Export CSV** (top of Results) gives one row per (scenario, method, seed).

## Layout of the screen
Each mode shows only its own controls:
- **Edit Map:** drawing tools and Undo/Redo in the top bar. Left panel: Map (Demo, College, Save, Open, Clear, and the map **Scale (px per metre)**), Room tool settings (only while the Room tool is picked), Particle tool settings (only while it is picked), Snapping, Selected object (position and size, only when something is selected), Keyboard shortcuts (click to open).
- **Simulate:** Run, Step, Reset, **Speed** and counters in the top bar. Left panel: a short explanation; PSO, boids and overlay settings are folded away.
- **Study:** left panel has Map (with the Scale), Evacuees, Test runs, Block exits and **Run study**; PSO particles and iterations, queue weight and the blocked-exit scenario are under **Advanced settings**. Right panel: Run status (details folded), Replay with a one-line legend, Results with **Export CSV**.

## Drawing helpers (Edit Map mode)
- **Particle tool (key 5): several people per click.** Set **Dots per click** and **Spread (m)** in the left panel (shown while the Particle tool is picked). One click drops that many dots around the cursor, only inside the room you clicked (never through a wall), not on walls or exits, and not on top of each other. If fewer fit, the status bar says how many were placed. One Ctrl+Z removes the whole batch.
- **Snapping ("locking"):** while drawing or moving, points lock onto wall corners and wall lines, and edges line up with nearby walls and zones. Orange guides show what it locked onto. A wall within 4 degrees of horizontal or vertical is straightened automatically. An exit drawn across a wall is centred on it. Optional **Snap to grid (10 px)**. Hold **Alt** to place freely.
- **Live sizes:** wall length, zone size and door width are shown in metres while you draw, move or resize (using the map Scale).

## Zoom and pan (all modes)
- **Mouse wheel** zooms towards the cursor (100% to 800%). **+ / - / Fit** buttons sit at the bottom right of the map; keys **+**, **-** and **0** (fit) work too.
- **Pan:** drag the map in Simulate and Study. In Edit Map, dragging draws, so pan with **Space + drag** or the **middle mouse button**.
- Zoom only changes the view: drawing, snapping and clicking stay exact at any zoom, and the model and results are unchanged. Text stays readable and dots and lines grow only gently, so crowds at a door stay easy to count.

## College map (from the ground-floor escape plans)
**College** under **Map** draws the college from the two posted Emergency Escape Plans (north: 25-Classroom Building; south: Communication Arts Building) and the group's tape measurements (taken in inches, converted at 1 in = 2.54 cm). **Ground floor only.**
- **Scale:** 9 px = 1 m. The building is about 88 m x 52 m. The size now comes from measured room widths, not from an assumed classroom width.
- **Layout:** a corridor runs all around the quadrangle side; rooms are on the outer side. Measured room widths along the corridor: north, west and east rooms 5.97 m (235 in), south rooms 8.89 m (350 in); room doors 1.02 m (40 in). North: 8 classrooms in the middle of the side, with closed utility space (nobody in it) filling the rest; south: 6 rooms plus the lobby; west: 6 rooms; east: 4 rooms plus the east lobby. The four corner blocks (stairs, toilets) open onto the corridor. **24 rooms** in all; people start inside the rooms. Loading the map sets Evacuees to 600 (about 25 per room).
- **Exits (where lines form), 6 in all, all measured:** **NW** and **NE** (north wall, ends of the west/east corridors) 1.42 m each (56 in); **S** (south lobby front door to the outside) two 4.06 m openings (160 in, 80 in of wall between), modelled as one 8.13 m exit; **E** (east lobby exit) 10.16 m (400 in); **N-court** (north corridor into the quadrangle) two 4.04 m openings (159 in, 78 in of wall between), one 8.08 m exit; **S-court** (south lobby into the quadrangle) two 5.59 m openings (220 in, 18 in of wall between), one 11.18 m exit. A door's width is its longer side, which is why the 1.42 m doors are drawn thin.
- **Assembly areas (safe zones):** in front of the south lobby, and open ground on the **west** and **east** sides (3 in all). **None on the north side:** people leaving by NW or NE walk about 28 m around the building to the west or east area. **The quadrangle is not a safe zone by default:** it is enclosed by the building on all four sides, so in an earthquake it is exposed to falling debris, and everyone must leave the building through NW, NE, S or E. N-court and S-court then lead nowhere safe and are not used. The option **"College: the quadrangle is also a safe zone"** (under Map) adds it back as a fourth assembly area (the posted escape plans mark it as one).
- **Estimates to state in the report:** corridor width (3.3 m), room depth (8 m), south lobby width (12 m), the north-side space beside the classrooms, and the size and position of the outdoor assembly areas. A two-opening exit is treated as one exit whose width is the sum of its openings. No exit on the west side is shown on the plans; if there is one, draw it and rerun.
- Room doors are drawn 2.2 m wide because the map grid is 1.1 m; room doors have no capacity limit in the model, so this changes only the drawing, not the results.

Results, default map (quadrangle not a safe zone; exit-penalty PSO, queue weight 0, 15 test seeds, all exits open):

| Evacuees | Avg time to safety: nearest / reroute / PSO (s) | Longest line: nearest / reroute / PSO | Last arrival: nearest / reroute / PSO (s) | PSO vs nearest | PSO vs reroute |
|---|---|---|---|---|---|
| 300 | 58.7 / 53.5 / **53.3** | 35.6 / 13.0 / **7.3** | 102.0 / 85.3 / **84.5** | -9.1%, 15/15 seeds | -0.3%, 14/15 |
| 600 | 66.7 / 54.8 / **54.1** | 114.3 / 40.8 / **18.6** | 147.7 / 96.5 / **92.0** | **-18.9%, 15/15 seeds** | -1.4%, 15/15 |
| 900 | 76.7 / 55.9 / **55.1** | 201.1 / 57.1 / **46.3** | 195.6 / 98.2 / **92.2** | **-28.2%, 15/15 seeds** | -1.5%, 15/15 |

With everyone leaving the building and no assembly area on the north side, NW and NE are bad choices twice over: they are single 1.42 m doors, and they lead to a 28 m walk around the building. Nearest exit still sends about 290 of 600 people there, which creates lines of over 100. The PSO plan sends **nobody to NE**, keeps about 60 at NW, and moves everyone else to the wide S (8.13 m) and E (10.16 m) exits, which open straight onto assembly areas. Its longest line is 19 people instead of 114, and the last person is safe 56 s sooner. PSO's advantage over nearest exit grows with the crowd (9.1% at 300, 18.9% at 600, 28.2% at 900) and it is also slightly faster than dynamic reroute at every size. **With S closed** (600 people): nearest 90.7 s, reroute 69.8 s, PSO **67.2 s** (25.9% faster than nearest, 3.7% faster than reroute, 15/15 each).

**Comparison, quadrangle as a safe zone** (600 people): nearest 45.0 s, reroute 41.3 s, PSO **41.3 s** (8.3% faster than nearest; PSO and reroute make the same choices). With the quadrangle open, almost everyone goes through the two wide court openings.

**Comparison, quadrangle as a safe zone** (the earlier version, 600 people): nearest 41.1 s, reroute 40.2 s, PSO **39.9 s** (2.8% faster than nearest). About 460 of 600 people go out through the two wide court openings, so lines stay short and the methods are close. Whether the quadrangle counts as a safe zone matters more to the result than the routing method.

## Earthquake drill: safe zones are the destination
Philippine drill procedure: Duck, Cover, Hold during shaking; after it stops, leave by the nearest (or predetermined) exit route and go to the designated evacuation/assembly area, where a headcount is done. So in Study mode:
- Each person: **walk to an exit, wait in line at the door, then walk outside to the nearest safe zone** (draw safe zones with the blue **Safe** tool).
- "Avg time" and "Last arrival" are times to reach the safe zone. Last arrival = when the headcount can be completed.
- The outdoor walk cannot go back through the building. "Inside" is everything people can reach from where they start without passing an exit.
- **People who start outside** (anyone who can reach a safe zone without passing through an exit) walk straight to the safe zone. They never join a door line and PSO does not route them. In the replay they are gray. The run message says how many there are. If the building has a gap in a wall, people who can walk out through it also count as outside, so close the building with walls and exits.
- An exit with no outdoor route to any safe zone is not used, and the run message names it.
- PSO tunes one penalty per exit; each person inside takes the exit with the lowest (walk to exit + walk to safe zone + penalty). Dynamic reroute picks the exit that gets each person to the safe zone soonest.
- With no safe zone drawn, people count as safe once they pass an exit (the old behaviour).
- The Duck-Cover-Hold phase (about 1 minute in drills) adds the same time to everyone, so it does not change which method wins. It is not modelled.

### Queue weight (default 0)
PSO's score is average time to safety + queue weight x longest line. The default is **0**: in an earthquake drill the goal is getting everyone to safety fast. Demo map, 200 evacuees, 15 seeds, exit-penalty PSO:

| Queue weight | Avg time nearest / reroute / PSO (s) | Longest line nearest / reroute / PSO | Last arrival nearest / reroute / PSO (s) |
|---|---|---|---|
| **0 (default)** | 53.1 / 51.6 / **50.0** | 70.7 / 54.4 / 38.2 | 81.5 / 74.9 / **68.9** |
| 0.25 | 53.1 / 51.6 / 53.1 | 70.7 / 54.4 / 35.4 | 81.5 / 74.9 / 82.4 |
| 1 | 53.1 / 51.6 / 53.1 | 70.7 / 54.4 / 35.4 | 81.5 / 74.9 / 82.4 |

With weight 0, PSO is best on all three: 5.9% faster than nearest and 3.1% faster than reroute on average time (15 of 15 seeds each), the shortest longest-line, and the earliest last arrival. A positive weight makes PSO trade time for shorter lines.

## Simulate mode with safe zones
If at least one safe zone is drawn, every dot's goal in Simulate is the nearest safe zone (by walking distance), not an exit. Exits work as doors on the way: a wall drawn straight through an exit can be crossed inside the exit. Dots that start outside go straight to the safe zone. With no safe zone, dots go to the nearest exit as before.

## Simulate: exit plan and the Boids crowding experiment
Simulate is the second, more detailed level of the model: people move as individual dots with Boids flocking (separation, alignment, cohesion) and wall avoidance. Study decides *which exit* people use; Simulate shows *how they move there* and how crowded the doors get.

**Speed and clock:** the top bar has a **Speed** control like the Study replay: **1x = real time**, plus 0.5x, 2x, 5x (default), 10x, 20x and Max. One step is the time to walk the max velocity (10 px) at 1.3 m/s, about 0.85 s on the college map (Scale 9). The map shows **t = ... s** (steps and people at a safe zone are in the top-bar counters), so Simulate and Study timelines can be compared. **Step** advances exactly one step.

**Who moves:** the dots you placed. With no dots placed, Simulate uses the same crowd as Study: Study's **Evacuees** count, placed randomly in the Start zones (a new random crowd each time you enter Simulate). These generated people exist only in Simulate: they are removed when you leave, are never saved to the map, and do not change how Study places people.

**Exit plan** (Simulate panel):
- **Shortest route to a safe zone** (default): each dot heads for the nearest safe zone and uses whatever door is on the way.
- **Nearest exit (drill advice):** each dot first goes to the exit with the shortest walk, then to the nearest safe zone.
- **PSO plan (from Study):** each dot goes to the exit chosen with the PSO penalties from the last Study run (walk to exit + walk to safe zone + penalty), then to the nearest safe zone. Unlocked after a Study run; stays valid while walls, exits and safe zones are unchanged (people can be added or moved).
- **Reaction delay 10-30 s** (on by default), the same assumption as Study. One step = the time to walk the max velocity (10 px) at 1.3 m/s, about 0.85 s at 9 px/m, so the delay is about 12 to 35 steps. Waiting dots are drawn faded.
- The table shows, per exit, how many people used it and the **peak number of people within 2 m of the door** at the same time.

**Crowding experiment** (button "Compare nearest vs PSO"): runs Simulate several times from the same start positions (the placed dots, or Study's Evacuees placed randomly in the Start zones), once with nearest exit and once with the PSO plan. Each pair uses the same random seed, so the only difference is the plan. Measures:
- **Crowd exposure:** person-steps spent within 2 m of any door, summed over all doors (lower = less crowding overall).
- **Peak crowd:** the most people within 2 m of one door at once (busiest door).
- Paired Wilcoxon test for both.

Result, default college map (quadrangle not a safe zone, no north assembly areas), 600 people, 10 paired runs, Boids on, reaction delay on:

| | Nearest exit | PSO plan | PSO vs nearest |
|---|---|---|---|
| Crowd exposure (person-steps near doors) | 1426 &plusmn; 188 | 1494 &plusmn; 254 | no clear difference (lower in 6/10, p = 0.92) |
| Peak crowd, busiest door | 29.8 &plusmn; 3.3 | 27.1 &plusmn; 6.7 | no clear difference (lower in 5/10, p = 0.47) |
| Steps to clear | 101.9 | 104.5 | about the same (Simulate does not enforce door capacity; see below) |

(Measured map, quadrangle not a safe zone.)

Per door (average peak within 2 m): NW 27 -> 18 and NE 22 -> 0 (PSO keeps people off the single doors), S 18 -> 20 and E 17 -> 23 (PSO sends them there).

Reading: in Simulate the PSO plan moves the crowd from the narrow doors to the wide ones, but the total crowding near doors and the busiest door's worst moment stay about the same. The benefit of PSO shows up in Study's door lines (time to safety), not in Simulate's crowd density. On the earlier version with the quadrangle as a safe zone, PSO cut crowding near doors by 17%.

**Caveats to state:** Simulate counts steps, not seconds (about 0.85 s per step on the college map); doors in Simulate have no capacity limit (dots can overlap), so crowding is measured by density near doors, not by queues; Boids makes runs random, which is why runs are paired and repeated.


**Do not use Simulate for timing.** Simulate does not enforce the door flow rate (1.3 persons/s per metre): dots squeeze through doors, so a narrow door is not a bottleneck there. On the default map, Simulate takes about 102 steps to clear with nearest exit and 105 with the PSO plan, while Study, which enforces door lines, has PSO 18.9% faster. Use Study for time to safety and Simulate for crowding and visuals.

**Herding (follow-the-crowd) was tried and dropped.** People chose whether to follow the crowd when they started moving, but at that moment their neighbours were roommates with the same planned exit, so almost nobody switched (about 1 in 600 at h = 0.6). Since Simulate shows no PSO time advantage anyway, the test could not measure how much of the advantage survives. Compliance with the plan is listed as future work.

## Using your own map
In **Edit Map** mode: draw walls and **Exit** rectangles (door width = the longer side of the rectangle). Then choose where the people start:
- **Placed particles (Particle tool or Add particles):** each particle is one evacuee, starting exactly where you placed it. Every test seed uses the same start positions, but walking speed and reaction delay are random per seed, so the Monte Carlo part still holds. The Evacuees box is ignored. A particle that cannot reach any exit is left out, and the run message says how many.
- **Start zones (if no particles are placed):** the Evacuees box sets how many people, placed randomly inside the zones, different for each seed.
If both exist, particles win. Delete the particles to go back to Start zones.

Running Simulate does not change where Study puts people: Study uses each particle's placed position, and leaving Simulate (or pressing Reset) moves the dots back there. Set **px per metre** (default 20, so a 40 px door is 2 m). Tick an exit in Study mode to block it. Safe zones, boids, a particle's assigned target, and the Simulate PSO settings are not used by the study.

## Room tool (Edit Map mode, key 9)
Drag a box to get a room: 4 walls with doors already cut in. Settings are at the top of the left panel:
- **Doors on top / bottom / left / right** (0 to 4 each), spaced evenly along the side.
- **Door width (m)**, at least 1.5 m. Narrower doors are widened, because the map uses a 0.5 m grid for walking and a smaller gap would be closed.
- **Door type:** *Opening* is a gap people walk through. *Building exit* puts an exit on the door, where people leave the building (it gets a queue in Study mode).
- A room is one unit: dragging any of its walls moves the whole room, and deleting any part deletes the whole room. Undo works as usual. Wall endpoints can still be dragged one at a time.
- Leave corridors at least 1.5 m (30 px) wide. A narrower corridor is closed on the grid, and people behind it cannot reach an exit (Study reports how many were left out).
- Room doors (openings) have no capacity limit in the model. Only building exits form queues.

## Undo and redo (Edit Map mode)
- **Undo / Redo** buttons in the top bar, or **Ctrl+Z** and **Ctrl+Y** (Ctrl+Shift+Z also redoes). Up to 100 steps.
- Covers every layout change: drawing a wall, exit, safe zone or Start zone, placing or adding particles, deleting (right-click, Del key, Delete selected button), moving or resizing, typing new values in the selected-object panel, assigning targets, blocking an exit, Clear map, Demo/Study demo map, and Load map.
- Undoing a delete brings the element back, including a particle's assigned exit.
- Editing the map after a run marks the results as out of date (the replay is cleared), so the numbers always match the map.
- Undo works in Edit Map mode only.

## What it does
- Rasterises your drawing to a 10 px grid and computes walking distance around walls (8-neighbour Dijkstra, no corner cutting).
- Engine: each evacuee waits 10-30 s, walks at 1.2-1.4 m/s, then joins a first-come-first-served queue at the assigned exit. Each door serves 1.3 persons/s per metre of width. Time limit 300 s.
- Methods compared: **nearest exit** (shortest walk to a door, the official drill advice), **dynamic reroute** (greedy, queue-aware, person by person), **PSO** (exit penalties).
- PSO: 20 particles, 30 iterations, w 0.7, c1 = c2 = 1.5. A particle is **one penalty per open exit**, 0 to 50 m. Each person inside takes the exit with the lowest (walk to exit + walk to safe zone + penalty). A penalty makes an exit count as farther, so only people for whom it is clearly best keep using it; people near the "border" between two exits switch. One particle starts at all zeros (= shortest route to safety), so on the training crowds PSO can only match or beat that rule. Fitness = capped mean time to safety + queue weight x longest line, averaged over 3 training seeds. The best penalties are then evaluated on separate test seeds (default 15) that PSO never saw.
- The penalties turn into a fixed plan: every spot in the building gets one exit, so it can be printed as "these rooms use NE".
- Statistics: mean with 95% t-interval, paired Wilcoxon signed-rank (exact when there are no ties), negative difference means PSO is lower.

## Assumptions to state in the report
- People are safe when they reach a safe zone (assembly area), not when they pass the door. Safe zones have no capacity limit.
- Congestion is modelled at exits only. No body collisions. Room doors and corridors have unlimited capacity.
- Constant walking speed per agent, no panic, everyone knows all open exits.
- Flow rate and speeds come from the project spec. Cite Weidmann (1993) and the SFPE Handbook after checking the numbers.
- PSO's penalties are tuning knobs, not real distances. Dynamic reroute assumes agents see the queue built by agents who left earlier, which real evacuees cannot.
- Evacuation "times" are seconds in the model. The older Simulate mode (boids and PSO steering) is separate, and it has no time or queue measure.

## Verification
`node check_study.js evacuation_sim.html` runs 170 checks: 5 for the default college map without the quadrangle as a safe zone (3 outdoor assembly areas, none on the north side; the court openings are unused in Study, with a note; nobody in Study or Simulate ever enters the quadrangle, with every exit plan; the option brings the quadrangle back), 1 for a dot pressed into a room corner against a wall that is off the 1.1 m grid (it must still walk out through the door), 8 for Simulate using Study's crowd when no dots are placed (600 generated inside the Start zones, removed on leaving Simulate, new crowd each time, never saved, placed dots take priority), 8 for blocked exits (with the N-court opening blocked, no indoor walk crosses the quadrangle under any method; no walk to an exit passes through another exit; open-exit results unchanged; in Simulate no dot steps through a blocked door, all north-side dots still get out, and a blocked exit is solid), 1 more confirming the second cleanup (per-dot targets, hidden status text, unused helpers and duplicate door detection are gone), 3 for the field cleanup (removed fields stay removed, Scale lives in the Map section, a setting of 0 is kept), 12 for the Simulate exit plan and crowding experiment (start points inside Start zones, nearest plan = shortest walk, huge penalty empties an exit, door counts add up, same seed = identical run, reaction delay 10-30 s keeps people still at first, stall rescue at a wall corner, experiment needs a Study run, paired runs all finish, map left unchanged), 2 confirming the removed features stay removed, 9 for the floor-plan college map (6 exits with the measured widths, 24 rooms, 6 assembly areas, every room reachable, quadrangle only through the court openings, everyone reaches safety, PSO beats nearest exit in 15/15 seeds, Simulate gets every dot out of its room through the doors), 13 for snapping and the multi-dot drop (corner and wall-line locking, Alt to turn it off, grid, edge alignment when moving, exits centred on walls, 10 dots per click staying inside the room, no overlap, partial fill when space runs out), 9 for the exit-penalty PSO (all-zero penalties = shortest route, a huge penalty empties an exit, a moderate one moves only some people, closed exits never chosen, never worse than the shortest-route rule on training crowds, penalties within 0 to 50 m, beats nearest exit in 15/15 seeds on the demo map with 300 people and on the college with 600), 10 for people who start outside (told apart from people inside, never use an exit in Study or Simulate, arrival time = delay + direct walk, START zone partly outside flagged), 11 for safe zones (hand calculation with an outdoor walk, the walk going around the building, open-building warning, exit opening into a closed yard, demo map, replay ending in the assembly area), 14 for undo/redo, 12 for Study using placed particles, 15 for the Room tool (door layout, people trapped in a doorless room, Study and Simulate getting everyone out of rooms, delete and undo), 19 for Simulate-mode walls (no dot ever passes through a wall and every dot gets out, on a long wall, a cup-shaped trap, a solid rectangle, the demo layout 5 times, and the demo layout after undo/redo), plus these: a hand calculation (100 agents through a 2 m door finish at 10 + 100/2.6 s, peak queue 99), exact Wilcoxon value, demo map reachability, nearest-exit overload of exit B, reroute never using a blocked exit, determinism, and CSV size.
The door-queue part of the JS engine was also checked against an independent Python implementation on the same 300 agents (before safe zones were added): identical average time, max queue and last-exit time. A SimPy discrete-event model matched the Python door logic. The outdoor walk is checked by its own hand calculation (10 + 100/2.6 + 10/1.3 s).

## Fixes made to the original app
- Removed the two assembly areas on the north side (outside the NW and NE corners). People leaving by NW or NE now walk around the building to the west or east area. All results above are rerun.
- The quadrangle is no longer a safe zone by default (it is enclosed by the building), so everyone must leave the building; an option under Map brings it back. S (south lobby front door) measured: two 4.06 m openings, modelled as one 8.13 m exit. All results above are rerun.
- Simulate: an exit that leads only into an enclosed courtyard with no safe zone is never chosen, and walking past its door frame does not count as using it.
- College map rebuilt from the group's measurements: room widths (5.97 m and 8.89 m), NW/NE 1.42 m, E 10.16 m, N-court 8.08 m and S-court 11.18 m (two openings each, summed). All results above are rerun on it.
- Simulate fix: a dot pressed against a wall that does not line up with the 1.1 m walking grid could "see" through that wall when estimating its distance to the target, and got stuck in the room corner (about 1 run in 7 on the measured map). It now checks for walls in every direction.
- Plain-language UI: every panel rewritten in everyday words (e.g. Boids settings are now Keep apart, Match direction, Stay together). Study results now open with a short answer box (PSO's average time, how it compares with each method in seconds and in how many runs, and the longest line); the statistics table and the PSO plan's numbers moved into a "Statistics details" fold. The crowding test opens with a one-line verdict per measure and warns when there are too few runs. Cases are now named "All exits as drawn" and "Busiest exit (X) closed" (also in the CSV). The method is called "PSO plan" everywhere.
- Simulate now uses Study's crowd when no dots are placed (Evacuees count, random positions in the Start zones). Before, Simulate showed nothing unless dots were placed by hand.
- College exits resized to the group's ranking: S, S-court, E 4 m; one merged N-court 3 m (was two 2.2 m openings); NW, NE single 1 m doors (were 2.2 m). Results above are rerun with these sizes.
- Blocked exits were walkable. In Study, the walk to an exit could pass through another exit's doorway (open or blocked), so with the two N-court openings blocked (before they were merged into one) some people walked out through the N-court opening, across the quadrangle and back in through S-court to reach the south lobby (79 people per run under PSO, 27 under reroute). Now the walk to each exit treats every other exit as closed, so they use the hallway. In Simulate a blocked exit is now a solid closed door. Results with all exits open are unchanged; with N-court blocked, PSO is about 0.3 s slower than before because the shortcut had been helping it (now 53.6 s vs 59.1 s for nearest exit, 15/15 runs).
- Demo layout: one wall was missing `y1` and was never drawn.
- Target dropdown: choosing a safe zone used the wrong index.
- Save/load now keeps each particle's assigned exit or safe zone.
- Mouse positions are now correct when the canvas is scaled to fit the window.
- Target tool (click a particle, then an exit): it never worked, because the first click's release cleared the pending selection. (The tool was later removed.)
- Simulate mode, walls: dots used to pass through walls and get stuck at wall ends. Causes and fixes:
  - A step was only checked for wall contact *after* moving, so a fast dot could jump across a thin wall line. Every step is now checked, and a step that would cross a wall is redirected along the walking path, or slides along the wall.
  - The push-out-of-wall result was computed but never applied (the code pushed a temporary copy).
  - Near a wall's tip, dots were pushed sideways instead of away from the tip, so they could not round the corner.
  - Fitness and "nearest" target used straight-line distance, which ignores walls. They now use walking distance around walls (the same 10 px grid as Study mode), made smooth inside each cell so PSO does not stall.
  - A gentle pull along the walking path keeps dots from stalling short of the target (PSO stagnation).
  - Result on the demo layout, 30 runs: every dot gets out in 88 to 134 iterations, none through a wall.
- Study now uses placed particles as the evacuees (see "Using your own map"). With few people and wide doors there is no queue, so all methods give the same result; PSO only helps when doors get congested.
- Simulate **Reset** used to leave the dots where they ended up. It now moves them back to where they were placed.
- Replay colors: exits used to share blue, orange and green with the methods, so a green dot looked like "PSO" when it meant "exit C". Exits now have their own colors (purple, pink, brown, ...), each open exit is outlined in its color, and a legend explains the dots.
- Simulate mode: PSO pulled each dot toward the group's best dot in a straight line, even when that dot was in another room. Dots got pinned in room corners. The pull now follows the walking route when the target point is behind a wall. On a 4-classroom building, all 160 dots get out in about 124 iterations.
- Selected object panel showed the literal text `&mdash;` when nothing was selected. It now shows `-`.
- People placed outside the building were sent to an exit and into the door line. They now walk straight to the safe zone (Study and Simulate). In Simulate, dots also aimed for exits even when safe zones existed; the goal is now the safe zone.
- PSO redesign: one penalty per exit instead of one exit per region. The region version lost to nearest exit on the college building. Queue weight default changed from 1 to 0 (time to safety only).
- UI decluttered: each mode shows only its own controls; long explanations and rarely used settings are folded away. Selected object now names what was clicked (wall, exit S, safe zone, ...).
- Added multi-dot Particle tool, snapping with guides and auto-straightening, and live sizes in metres. Selected object now names what was clicked.
- Added zoom and pan in Edit, Simulate and Study.
- College map rebuilt from the ground-floor escape plans (24 rooms, 7 exits (later 6), assembly points from the plans). Simulate: dots no longer get stuck in doorways (being next to a wall inside a door is no longer penalised).
- College map: added west and east assembly areas; results updated.
- Removed the Target tool (it only forced single dots to a chosen exit in Simulate and was never used by Study). Maps saved with targets still load; the targets are ignored and every person follows the chosen exit plan.
- Cleanup (no effect on results; agent data and college results verified identical before and after):
  - Removed the Delete tool button and key 7 (delete with right-click, the Del key or the Delete selected button).
  - Removed Add random dots (use the Particle tool, which drops several people per click inside the room clicked).
  - Removed the Selected object "Kind" dropdown (it converted walls, exits, safe zones and dots into each other).
  - Removed the remaining Target tool code.
  - Removed the region grouping (k-means) and the old region-based PSO; only the exit-penalty PSO remains. See PSO_designs_explained.md for the design history.
- Simulate: exit plan switch (shortest route / nearest exit / PSO plan from Study), per-door usage and crowding, reaction delay (same as Study), and a paired crowding experiment with Boids.
- Simulate speed-up (about 3x for 600 people): Boids looks only at nearby dots (grid), and wall checks look only at nearby walls (spatial index). Behaviour unchanged.
- Simulate fixes: a dot pinned exactly on a wall corner is rescued after 15 steps without moving; door use is detected from the whole step, so a fast dot cannot skip over a door unnoticed.
- Removed redundant fields: the crowding experiment's own People field (it now uses Study's Evacuees, the crowd size the PSO plan was optimised for), the Apply PSO / Apply boids buttons (settings apply as you type), the Avoid walls checkbox (wall repel 0 = off), and the Dots demo map.
- Moved px per metre to the Map section as **Scale (px per metre)**, since it sets the size of the whole map (walking distances, door capacity, room doors, Simulate step time).
- Fixed: typing 0 into a PSO or Boids setting was silently replaced by the default; 0 is now kept (e.g. Cohesion 0 turns cohesion off).
- Simulate: added a Speed control (1x = real time) and a clock (t in seconds) on the map; removed Iters / frame (replaced by Speed); the top-bar counter now says steps.
- Second cleanup (no effect on results; Study agent data and college results verified identical before and after):
  - Simulate map clock shows only the time; step and arrival counts stay in the top bar.
  - Simulate intro text updated (it said Simulate had no timing or door lines).
  - Removed a hidden duplicate status text, an unused helper (targetPos), the old door-use check (the per-step path check covers it), and a Study warning branch that could no longer run.
  - The "Dots demo" layout moved into check_study.js as a test fixture.
  - Removed per-dot targets: every person follows the chosen exit plan. Saved maps now store only dot positions (their placed positions, even after a Simulate run).
