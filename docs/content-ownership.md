# Content ownership

- Mappings in `data/normalized/mappings.json` are maintained through git pull requests.
- Each record requires a non-empty `owner` and `lastReviewedAt`.
- If `prismCentralPath` is unavailable, `myNutanixLink` is mandatory.
- Reviewers should verify equivalence type: `direct`, `partial`, `closest`, `none`.
- Sales engineering content editors can update mappings without changing app code.
