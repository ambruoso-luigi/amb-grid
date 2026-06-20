# Italian municipalities demo dataset

`italian-municipalities.demo.json` is used only by the AMB Grid multifield
lookup demo. It is served as a separate static asset and is not imported by
the library core or included in the AMB Grid runtime bundle.

Municipality names, ISTAT codes, cadastral codes, province abbreviations, and
regions are generated from the official ISTAT workbook:

<https://www.istat.it/storage/codici-unita-amministrative/Elenco-comuni-italiani.xlsx>

Postal codes are merged by ISTAT code from the community-maintained
[`matteocontrini/comuni-json`](https://github.com/matteocontrini/comuni-json)
dataset, whose CAP data was last broadly updated in 2020. Multiple postal codes
are normalized to the first available value. When a current ISTAT municipality
cannot be matched directly, the generator tries its cadastral code and then
uses a demonstration fallback from the same province. As a final safety
fallback it uses `00000`. This guarantees one non-empty five-character string
per demo record, but does not guarantee geographic accuracy. Postal codes are
not sourced from ISTAT and are never used as lookup keys.

> This dataset is provided for demonstration purposes only. It may be
> incomplete, outdated, or inaccurate. Do not use it as an official source for
> production systems.

Regenerate the JSON after downloading the ISTAT workbook:

```bash
npm run demo:data:municipalities -- \
  path/to/Elenco-comuni-italiani.xlsx \
  public/demo/data/italian-municipalities.demo.json \
  path/to/comuni.json
```
