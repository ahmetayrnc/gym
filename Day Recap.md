```dataviewjs
const months = {Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12};
const monthNames = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function toSortKey(name) {
    const m = name.match(/^(\d+)\s+(\w+)\s+(\d+)/);
    if (!m) return 0;
    return (2000 + parseInt(m[3])) * 10000 + (months[m[2]] || 0) * 100 + parseInt(m[1]);
}

function parseExercises(content) {
    const exercises = [];
    const lines = content.split('\n');
    let current = null;
    for (const line of lines) {
        const linkMatch = line.match(/\[\[(.+?)\]\]/);
        if (linkMatch) {
            current = { name: linkMatch[1], sets: [] };
            exercises.push(current);
        } else if (current && line.trim()) {
            current.sets.push(line.trim());
        }
    }
    return exercises;
}

// Find today's file
const now = new Date();
const dayNum = String(now.getDate()).padStart(2, '0');
const monthStr = monthNames[now.getMonth() + 1];
const yearStr = String(now.getFullYear()).slice(2);
const todayPrefix = `${dayNum} ${monthStr} ${yearStr}`;

const allDays = dv.pages('"days"').sort(p => toSortKey(p.file.name), 'desc').array();
const todayPage = allDays.find(p => p.file.name.startsWith(todayPrefix));

if (!todayPage) {
    dv.paragraph("No workout found for today.");
} else {
    dv.paragraph(`**Today:** ${todayPage.file.link}`);

    const todayContent = await dv.io.load(todayPage.file.path);
    const todayExercises = parseExercises(todayContent);
    const todaySortKey = toSortKey(todayPage.file.name);

    // For each exercise, find the most recent previous day that had it
    // Build a map: exercise name -> { dayName, sets } from previous days
    const prevMap = {};
    const needed = new Set(todayExercises.map(e => e.name));

    for (const day of allDays) {
        if (needed.size === 0) break;
        if (toSortKey(day.file.name) >= todaySortKey) continue;

        const content = await dv.io.load(day.file.path);
        const exercises = parseExercises(content);

        for (const ex of exercises) {
            if (needed.has(ex.name)) {
                prevMap[ex.name] = { dayName: day.file.name, sets: ex.sets };
                needed.delete(ex.name);
            }
        }
    }

    let output = [];
    for (const ex of todayExercises) {
        const prev = prevMap[ex.name];
        output.push(`**[[${ex.name}]]**`);
        if (prev) {
            output.push(`prev: [[${prev.dayName}]]`);
        }

        const maxSets = Math.max(ex.sets.length, prev ? prev.sets.length : 0);
        for (let i = 0; i < maxSets; i++) {
            const todaySet = ex.sets[i] || '—';
            const prevSet = prev ? (prev.sets[i] || '—') : '—';

            if (!prev) {
                output.push(`  ${todaySet} *(new)*`);
            } else {
                // Compare: parse weight and reps
                const parseSet = (s) => {
                    const m = s.match(/([\d.]+)kg\s+(\d+)/);
                    return m ? { weight: parseFloat(m[1]), reps: parseInt(m[2]) } : null;
                };
                const t = parseSet(todaySet);
                const p = parseSet(prevSet);
                let icon = '';
                if (t && p) {
                    if (t.weight > p.weight || (t.weight === p.weight && t.reps > p.reps)) {
                        icon = ' 👍';
                    } else if (t.weight < p.weight || (t.weight === p.weight && t.reps < p.reps)) {
                        icon = ' 👎';
                    }
                }
                output.push(`  ${prevSet}  →  ${todaySet}${icon}`);
            }
        }
        output.push('');
    }

    dv.paragraph(output.join('\n'));
}
```
