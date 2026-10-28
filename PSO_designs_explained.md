# SwarmPath: the two PSO designs explained

CmpSc 173 group project. This note explains the **first PSO design** (one exit per region), why it was replaced, and the **current design** (one penalty per exit). It ends with text you can adapt for the report.

---

## 1. The question PSO answers

During an earthquake drill, after the shaking stops, each person:

1. walks from their room to an exit,
2. waits in line at the door (first come, first served),
3. walks outside to the nearest safe zone (assembly area).

Both designs answer the same question: **which exit should each person use** so that everyone reaches a safe zone as fast as possible? They differ in what a PSO particle represents.

Both are judged the same way:

- **Training:** each candidate plan is simulated on **3 practice crowds** (random speeds, reaction delays and, with Start zones, positions).
- **Fitness (lower is better):**

  > F = average over the 3 crowds of [ mean time to reach a safe zone (capped at 300 s) + w_q x longest line at any door ]

  w_q is the queue weight. The current default is **0** (time to safety only).
- **Testing:** the best plan is then run on **15 new crowds** it never saw, and compared with **nearest exit** and **dynamic reroute** (mean, 95% confidence interval, Wilcoxon test).

PSO settings in both designs: 20 particles, 30 iterations, inertia w = 0.7, c1 = c2 = 1.5.

---

## 2. Old design: one exit per region

### The idea
Group nearby people into regions and give each region one exit, like a drill plan saying "everyone in the north-west classrooms uses exit NW".

### Formulation
- **Regions:** the start area is split into **K = 8 regions** by k-means clustering on the start cells.
- **Particle:** a vector x = (x1, ..., xK), each xk a continuous number in [0, E), where E is the number of open exits.
- **Decoding:** region k uses exit floor(xk). For example, 2.7 means exit #2. Everyone in region k uses that exit.
- **PSO update:**

  > v <- 0.7 v + 1.5 r1 (pbest - x) + 1.5 r2 (gbest - x)
  > x <- x + v, kept inside [0, E)

- **Start:** all 20 particles random.
- **Search space:** E^K plans. College (5 exits): 5^8 = **390,625** plans. Demo map (3 exits): 3^8 = 6,561.

Example plan: `R1 -> NW, R2 -> NW, R3 -> S-court, R4 -> E, ...`

### How it performed

| Map | Result |
|---|---|
| Demo map, before safe zones were added | Good: average time between nearest exit and reroute, and by far the shortest lines (9 people vs 71 for nearest exit). |
| Demo map, with safe zones | Mixed: with queue weight 1 it was slower than nearest exit; with weight 0 it was faster. |
| College (earlier estimated map), 200 people | **Failed: 48.7 s vs 42.7 s for nearest exit, 14% slower, losing in all 15 test runs.** |

### Why it failed
1. **Too coarse.** A whole region gets one exit, so a person at the edge of a region can be sent past a free door to a far one.
2. **Flat fitness landscape.** Because of the rounding, a small move of a particle usually changes nothing, then suddenly reassigns a whole region at once. PSO's velocity carries little useful information on plateaus like that. On the college map the swarm never improved on its own starting best.
3. **No safe starting point.** All particles start random, so the best plan found can be worse than simply "go to the nearest exit".

---

## 3. New design: one penalty per exit

### The idea
Keep each person's own choice, but make crowded exits **count as farther away** so the crowd spreads out before lines build up.

### Formulation
- **Particle:** a vector p = (p1, ..., pE), one **penalty** per open exit, each between 0 and 50 m.
- **Decoding (per person):** person i uses the exit with the lowest score:

  > score_i(e) = d_i(e) + o(e) + p_e

  - d_i(e): walking distance **inside** the building from person i to exit e
  - o(e): walking distance **outside** from exit e to the nearest safe zone
  - p_e: the penalty PSO chooses for exit e

  People who start **outside** the building walk straight to a safe zone and are not affected.
- **Start:** particle 0 = **all zeros**, which is exactly "take the shortest route to safety". The other 19 particles start random. Maximum step: 10 m.
- **Fitness and PSO update:** the same as the old design, so the two are directly comparable.

### What a penalty does (geometry)
The border between two exits A and B is where their scores tie:

> d(A) + o(A) + p_A = d(B) + o(B) + p_B

Raising p_B moves that border **toward B**, so B serves fewer people. Each exit's catchment area is an **additively weighted Voronoi region**, measured in walking distance.

Simple case: a 100 m corridor, exit A at 0 m, exit B at 100 m.

| Penalty on A | Penalty on B | Border | Who uses B |
|---|---|---|---|
| 0 m | 0 m | 50 m | the half nearer B |
| 20 m | 0 m | 40 m | more people (everyone from 40 m on) |
| 20 m | 20 m | 50 m | same as 0 / 0 |

Only the **difference** between penalties matters. That is why PSO's penalties should be read relative to each other.

### Worked example
Exit A is crowded, so PSO sets p_A = 15 m and p_B = 0.

| Person | Walk to A | Walk to B | Score A | Score B | Uses |
|---|---|---|---|---|---|
| Near A | 5 m | 40 m | 20 | 40 | **A** (still clearly best) |
| In between | 20 m | 30 m | 35 | 30 | **B** (switched) |

Only people near the border switch.

### Why it works better
- Decisions are **per person**, from each person's own position.
- PSO tunes only **one number per exit** (5 to 7 numbers instead of 8 regions).
- A small change moves only a few "border" people, so the fitness landscape is much smoother.
- Because particle 0 is "shortest route", on the practice crowds PSO's best plan is **never worse than shortest route**.
- It is still a **printable plan**: once the penalties are fixed, every spot in the building has one exit ("rooms 1 to 4 use NE").

---

## 4. Side by side

| | Old: one exit per region | New: one penalty per exit |
|---|---|---|
| Decision is made for | Whole regions (8) | Each person, from their own position |
| Numbers PSO tunes | 8 (one per region) | One per exit |
| Search space | E^K discrete plans (390,625 on the college) | Continuous; a small step only moves border people |
| Fitness landscape | Large flat plateaus with sudden jumps | Much smoother |
| Starting point | All random | Includes "shortest route" (all zeros) |
| Guarantee on practice crowds | None | Never worse than shortest route |
| As a printed plan | "Region 3 uses exit S" | "Rooms 1 to 4 use NE" |
| College (earlier estimated map), 200 people | **48.7 s, 14% slower** than nearest exit | **41.4 s, 3% faster** than nearest exit |

### Current results, college map (measured doors, quadrangle not a safe zone, no north assembly areas; queue weight 0, 15 test runs)

Everyone must leave the building through NW, NE (1.42 m each), S (8.13 m) or E (10.16 m). Assembly areas: south, west, east.

| People | Nearest exit | Reroute | PSO (penalties) | PSO vs nearest |
|---|---|---|---|---|
| 300 | 58.7 s | 53.5 s | **53.3 s** | 9.1% faster, 15/15 runs |
| 600 | 66.7 s | 54.8 s | **54.1 s** | **18.9% faster, 15/15 runs** (and 1.4% faster than reroute) |
| 900 | 76.7 s | 55.9 s | **55.1 s** | **28.2% faster, 15/15 runs** (and 1.5% faster than reroute) |

At 600 people PSO also has the shortest longest-line (19 vs 114 for nearest exit) and the earliest last arrival (92.0 s vs 147.7 s). Its plan keeps people off the two single doors, which also lead to a long walk around the building (nobody at NE), and sends them to the wide S and E exits. With the quadrangle counted as a safe zone, PSO is 8.3% faster than nearest exit at 600 and makes the same choices as dynamic reroute.

---|---|---|---|---|
| 300 | 49.3 s | 49.0 s | **48.5 s** | 1.8% faster, 15/15 runs |
| 600 | 57.5 s | 52.9 s | **51.7 s** | **9.9% faster, 15/15 runs** (and 2.2% faster than reroute) |
| 900 | 67.4 s | 54.9 s | **53.4 s** | **20.8% faster, 15/15 runs** (and 2.7% faster than reroute) |

At 600 people PSO also has the shortest longest-line (43 vs 114 for nearest exit) and the earliest last arrival (85.1 s vs 127.7 s). Its plan keeps people off the two single doors (nobody at NE) and sends them to the wide S and E exits. With the quadrangle counted as a safe zone instead, the methods are much closer (PSO 2.8% faster than nearest at 600), because two very wide court openings carry most people.

---|---|---|---|---|
| 300 | 39.5 s | 39.3 s | **39.3 s** | 0.5% faster, 15/15 runs |
| 600 | 41.1 s | 40.2 s | **39.9 s** | **2.8% faster, 15/15 runs** (and 0.7% faster than reroute) |
| 900 | 43.3 s | 40.9 s | **40.6 s** | **6.4% faster, 15/15 runs** (and 0.9% faster than reroute) |

At 600 people PSO also has the shortest longest-line (16.5 vs 41.3 for nearest exit) and the earliest last arrival (69.1 s vs 83.5 s). With S-court closed, the three methods are within 0.5% of each other.

---|---|---|---|---|
| 300 | 45.3 s | 45.0 s | **44.6 s** | 1.5% faster, 15/15 runs |
| 600 | 52.6 s | 49.3 s | **49.1 s** | **6.7% faster, 15/15 runs** |
| 900 | 62.3 s | **54.3 s** | 56.5 s | 9.3% faster, but 4.2% slower than reroute |

At 600 people PSO also has the shortest longest-line (42.7 vs 71.7 for nearest exit). Reroute has the earliest last arrival (76.7 s vs 83.6 s for PSO and 119.6 s for nearest exit).

---

## 5. Honest limits of the new design

1. **Static plan.** It does not react during the evacuation. Dynamic reroute does, which is why reroute still ties it on average time. But reroute needs live queue information that real evacuees do not have.
2. **One redundant number.** Adding the same amount to every penalty changes nothing.
3. **The guarantee only covers the 3 practice crowds.** On the 15 test crowds it is not guaranteed; checking that is exactly what the test runs are for.
4. **It assumes people follow the plan** (the "compliance" question).
5. **PSO only adds value when lines form.** With few people, the best penalties are about zero and PSO behaves like shortest route. At 200 people, the gain over nearest exit comes from counting the walk to the safe zone, not from PSO itself.

---

## 6. Text you can adapt for the report

> **Decision variables.** One penalty p_e in [0, 50] m for each open exit e.
>
> **Routing rule.** Each occupant i uses the exit minimizing d_i(e) + o(e) + p_e, where d_i(e) is the indoor walking distance from i to exit e and o(e) is the outdoor walking distance from exit e to the nearest assembly area.
>
> **Objective.** Minimize the mean time to reach an assembly area, averaged over 3 training replications (queue weight 0). The best penalties are evaluated on 15 independent test replications.
>
> **PSO settings.** 20 particles, 30 iterations, w = 0.7, c1 = c2 = 1.5; one particle is initialized at p = 0 (the shortest-route rule).
>
> **Design iteration.** An earlier encoding assigned one exit per k-means region (8 regions). It lost to the nearest-exit rule on the college map (14% slower) because the assignment was too coarse and the rounded encoding produced a flat fitness landscape, so the encoding was changed to exit penalties.

### One-line explanation for the presentation
> "Nearest exit only looks at the closest door. PSO tunes one penalty per exit so the crowd spreads out before lines build up. When the building is crowded, everyone reaches the assembly areas faster than with the nearest-exit rule."
