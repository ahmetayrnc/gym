---
tags:
  - compound
---

```dataviewjs
const months = {Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12};
function parseDate(name) {
    const m = name.match(/^(\d+)\s+(\w+)\s+(\d+)/);
    if (!m) return 0;
    return (2000 + parseInt(m[3])) * 10000 + (months[m[2]] || 0) * 100 + parseInt(m[1]);
}

const currentName = dv.current().file.name;
const days = dv.pages('"days"').sort(p => parseDate(p.file.name), 'desc');

for (const day of days) {
    const sets = [];
    for (const item of day.file.lists) {
        if (item.outlinks.some(l => l.path === currentName)) {
            sets.push(...item.children.map(c => c.text));
        }
    }
    if (sets.length > 0) {
        dv.header(4, day.file.link);
        dv.list(sets);
    }
}
```

