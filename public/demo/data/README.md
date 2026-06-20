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
are normalized as a comma-separated string. Postal codes are not sourced from
ISTAT, are not used as lookup keys, and are not guaranteed to be complete or
current. The generator rejects postal-code sources covering less than 90% of
the current ISTAT municipality list.

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
