(unverified) Facet Graph Access — How to Read and Write It

The facet graph is the ONLY graph we use: the Neo4j `facets` database,
hosted on the MacBook (192.168.1.56). Access it via
`graph-add.js --db facets`. READ it with Cypher queries, not by grepping
command output.

## Only Facet nodes are live

The facets db also contains old `Specialist`, `Corporal`, `File`, etc.
nodes. These are DEPRECATED leftover data — ignore them. Do not try to
sync or update them. Only `:Facet` nodes matter. `facets.js sync` only
touches Facet nodes, and that is correct.

## READ — query the graph with Cypher

Prefix: `node c:/clients/neoga/graph-add.js --db facets query "<cypher>"`

All facets for a repo (name, state, description):
```
MATCH (f:Facet) WHERE f.repo = 'savoy'
RETURN f.name, f.state, f.description ORDER BY f.name
```

One facet's full content:
```
MATCH (f:Facet {name: 'pullman:--facet-pear-spec'}) RETURN f.content
```

Search facets by topic (description or domain):
```
MATCH (f:Facet) WHERE toLower(f.description) CONTAINS 'email'
   OR toLower(f.domain) CONTAINS 'email'
RETURN f.name, f.description
```

A facet's connections:
```
MATCH (a:Facet {name:'senath:--facet-upstream-pipeline'})-[r]-(b:Facet)
RETURN type(r), b.name
```

## WHY NOT facets.js show / read

`facets.js read | grep` is lossy — grep only sees what's inside the
context window, so you miss facets. `facets.js show <name>` works for one
facet but isn't the graph — query the graph so you get canonical data
(state, repo, relationships) in structured rows. Lesson learned the hard
way: grep showed 10 of savoy's facets; the Cypher query showed all 12.

## WRITE — sync your facets into the graph

1. Edit/create the library .md file. **Line 1 must be `(state) Title`**
   where state is `(tbd)`, `(unverified)`, or `(verified)`.
2. Register it in readme.js `facetMap` (the `--facet-*` key).
3. Copy readme.js + library files to the official repo `c:/clients/senath/`
   (the facet scanner reads the registered repo path, NOT the corporal dir).
4. `node c:/clients/neoga/facets.js sync senath`

## STATE rules

- `(tbd)` → `(unverified)`: only the specialist (me). Moves when I fill it.
- `(unverified)` → `(verified)`: only George. I CANNOT self-verify.

## CONNECT — wire relationships

```
node c:/clients/neoga/facets.js connect "senath:--facet-x" REL_TYPE \
  "otherrepo:--facet-y" "reason"
```
After connecting, DM the other specialist. The graph also auto-queues
a notification to them on sync if a connected facet changes.
