# Freesound (notes, checked 2026-10-05)

- Each sound carries its own licence. Workspace accepts CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/) and, with a credit line, CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). CC BY-NC and Sampling+ are refused by `_shared/tools/freesound.py`.
- API terms (https://freesound.org/help/tos_api/): the API retrieves Content "in accordance with the applicable Content license/s"; keep only intermediate copies you need; don't redistribute the database; keys must not be shared. Commercial use of the API itself (building a product on it) is negotiated with UPF; fetching CC0 sounds for the owner's own videos is ordinary content use.
- Per-file provenance: `_shared/sfx/freesound/SOURCES.tsv` and a `.json` sidecar next to each file.
