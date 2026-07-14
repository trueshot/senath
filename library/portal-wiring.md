(unverified) Portal Wiring — How a Recipient Gets Connected to the Documents

Authored senath gen-9 2026-06-10, from George's question + prospectheights'
analysis + leyden's link facets. A reasoning doc for prospectheights,
portland, leyden, sunrise: what it takes to show a recipient (e.g. INGLES)
the documents Willis has already put on disk for them.

>> LIVE COORDINATION DOC: c:/clients/leyden/portal-wiring-plan.md (leyden
   gen-3) is now the working resolution plan with per-stakeholder blocks,
   a decisions log, and THE CRUX named: Issue A — the bytes are
   canopylake-resident (no preyName), so the prey-path resolver formula
   doesn't apply. inola+effingham own that fork. Read the plan to act.
   CORRECTION leyden flagged: the inode-link command is the 6-arg subpath
   form (below, fixed), NOT the old 5-arg ~_~$$prostan8$$ form.
   senath out-box location (verified): \\172.31.24.120\canopylake\inode3\
   82\82vlsz7s\local_c\server\produceflow\portals\outgoing\INGLES\

=== THE SITUATION ===

The documents EXIST. Willis's sendEmail.js writes each PDF (+ apron) into
the grantor's canopylake out-box:
  outgoing/INGLES/{date}_{who}_{ext}_{name}.pdf   (+ .email.json apron)
What's missing is not the bytes — it's the WIRE from INGLES to them.
INGLES's portal has nothing to read because the connection from Willis's
out-box to INGLES was never built. (prospectheights, 2026-06-10.)

=== TWO THINGS ARE BOTH CALLED "LINK" — DON'T CONFLATE ===

This is the single most important distinction for reasoning here.

  1. AUTHORITY LINK   (leyden:--facet-creation-flow)
     Tool:    createlink_modular.js
     Writes:  l_<license>-LICEE : s_<server>-LINK couplet in the ledger;
              canopy sync creates a HAS_LINK edge in The Canopy (Neo4j).
     Answers: "Is the gate open?" (license-gated access)
     Needs:   a licenseId (Ligonier) + serverId (Senoia) FIRST.
              Order: License -> Server -> Link.

  2. INODE LINK       (leyden:--facet-inode-link)  <-- the membrane wire
     Tool:    createinodelink_modular.js
     Writes:  a <link> child in a tree's drive dirArray whose epath is
              ~_~$$<prostan8>$$ (a boundary crossing into the target).
     Answers: "Here's the PATH to the data."
     This is what "give INGLES an in-box that points at Willis's out-box"
     actually means.

prospectheights' "option 1 (build the connection)" = the INODE LINK.

=== HOW THE INODE LINK WORKS (leyden's domain, verified live 2026-05-08) ===

  Command shape (CURRENT 6-arg subpath form, per leyden's plan correction):
    node createinodelink_modular.js <suffix> <corp> <drive> <linkName> <appUsername> [subpath]
    epath form: ~_~$<appUsername>$~<subpath>  (username form, subpath inline)
  (The old 5-arg form with epath ~_~$$<prostan8>$$ was pre-redesign — stale.)
  Live example (willdev, prey-resident data):
    createinodelink_modular.js 3 willdev local_c willis willdev_pf_app
    -> willdev's Drive C dirArray gains a <link>willis entry
  NOTE: that example resolves PREY-style. The portal out-box is canopylake-
  resident (no preyName) — see Issue A in leyden's plan; the target form for
  the out-box case is NOT yet settled (inola+effingham own the fork).

  Walk-time (how a recipient READS through it):
    1. Start at recipient's root inode, expand the drive
    2. Hit the <link> entry -> resolver reaches the ~_~ boundary
    3. traversecity boundary-check.js authority check
       (SUP bypass / LINK gate / USER authority on owning CORP)
    4. If authorized -> cross into the target namespace
    5. inola resolves .link.json -> physical path via the prey bridge
  chimayo materializes the .link.json onto canopylake after creation.
  HTTP entry point: prosser POST /createLink on Monkey:3005 wraps the
  modular wrapper (use MODULAR — legacy bypasses the canopy-sync hook).

=== THE PREREQUISITE THAT GATES OPTION 1 ===

The <link> lives IN THE RECIPIENT'S inode tree. So before you can wire
INGLES to the out-box, the recipient must EXIST as a uTERA entity WITH a
tree to hang the link on. Two consequences:

  A. NO TREE, NO LINK. In our model a recipient company is NOT
     automatically a uTERA entity — only REGISTERED parties are. If
     nobody at INGLES has registered, INGLES has no tree, and the inode
     link has nowhere to live. Option 1 cannot run yet. THIS is why
     prospectheights recommends option 2 as the today-fix.

  B. THE LINK IS PER-PERSON, NOT PER-COMPANY. (The folder-vs-LINK
     distinction, settled repeatedly.) The FOLDER outgoing/INGLES/ is
     per-company — it holds the bytes, shared. ACCESS is granted to a
     registered PERSON: when someone at INGLES registers, leyden's
     createinodelink_modular puts a <link> in THAT PERSON'S tree pointing
     at outgoing/INGLES/. Two people at INGLES = two links, one folder.

=== THE TWO OPTIONS, REASONED ===

  OPTION 2 — READ THE FOLDER DIRECTLY (today-fix, prospectheights' rec)
    Point the portal at outgoing/INGLES/ by company name. No link, no
    membrane, no boundary check. Works NOW because the docs are real and
    on disk. This is already what portland's portal manifest does (reads
    aprons from the folder). Access control is application discipline,
    not the uTERA membrane.

  OPTION 1 — BUILD THE MEMBRANE LINK (grow-into, proper design)
    createinodelink_modular into a registered recipient's tree. Gives
    real uTERA authority: boundary-checked, severable, ledger-backed.
    BUT it only exists for a REGISTERED entity, and it is created at
    registration. => Option 1 IS the same work as completing the SeedDrop
    cold path (the registered->authorized flip, step 4). You don't build
    it separately; it falls out of a recipient registering.

=== HOW THIS MAPS TO THE THREE-CHANNEL MODEL ===

  Option 2 (read folder by name)  -> closest to CHANNEL 3 thinking:
    trusted app reads a scoped view; access by application discipline.
  Option 1 (inode link)           -> CHANNEL 2 proper: bytes crossing
    estates, gated by the ~_~ membrane test.
  See senath:--facet-three-channels.

=== OPEN QUESTIONS FOR THE GROUP ===

  1. Is INGLES (the company) ever a uTERA entity, or is the recipient
     always a PERSON at INGLES? If company-level access is wanted, that's
     a CORP-CORP link (atlanta:--facet-membranes) and INGLES needs a CORP
     entity created first — a bigger lift than the per-person path.
  2. For option 1: what does the inode link TARGET? The live example
     crosses into an APP (willdev_pf_app). Willis's outgoing/INGLES/ sits
     under the willis CORP's local_c/server/produceflow/portals/ tree —
     so is the target the willis app + a sub-path, or a new construct?
     This is leyden's to specify for this exact case.
  3. If we ship option 2 now, what's the migration when a recipient later
     registers and gets option 1 — does the portal switch read paths, or
     does option 1 just light up the membrane underneath the same view?

=== WHO OWNS WHAT ===

  senath        writes outgoing/{companyId}/ (the out-box + aprons)
  portland      the portal reader (option 2 manifest today)
  leyden        createinodelink_modular (the inode link — option 1)
  prosser       POST /createLink HTTP wrapper (Monkey:3005)
  chimayo       materializes .link.json to canopylake
  traversecity  boundary-check.js (authority at ~_~)
  inola         .link.json + physical path resolution
  nashville     registration (births the registered entity that option 1
                needs a tree on)

=== SEE ALSO ===

  leyden:--facet-inode-link          the <link> mechanism (source)
  leyden:--facet-creation-flow       authority link vs inode link
  leyden:--facet-prerequisites       license->server->link ordering
  senath:--facet-portal-membrane     outgoing/incoming structure
  senath:--facet-three-channels      estate / membrane / app-portal
  portland:--facet-portal-build      the option-2 reader pipeline
  traversecity:--facet-boundary-check  ~_~ authority (LIVE)

— senath gen-9 2026-06-10
