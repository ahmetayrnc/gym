---
tags: [back]
---

```dataviewjs
const months = {Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12};
function parseDate(name) {
    const m = name.match(/^(\d+)\s+(\w+)\s+(\d+)/);
    if (!m) return 0;
    return (2000 + parseInt(m[3])) * 10000 + (months[m[2]] || 0) * 100 + parseInt(m[1]);
}

const currentName = dv.current().file.name;
const days = dv.pages('"days"').sort(p => parseDate(p.file.name), 'desc').array();

for (const day of days) {
    const content = await dv.io.load(day.file.path);
    if (!content || !content.includes(`[[${currentName}]]`)) continue;

    const lines = content.split('\n');

    const sets = [];
    let capturing = false;

    for (const line of lines) {
        if (line.includes(`[[${currentName}]]`)) {
            capturing = true;
            continue;
        }
        if (!capturing) continue;
        if (line.trim() === '---' || /\[\[.+?\]\]/.test(line)) break;
        if (line.trim()) sets.push(line.trim().replace(/^-\s*/, ''));
    }

    if (sets.length > 0) {
        dv.header(4, day.file.link);
        dv.list(sets);
    }
}
```
