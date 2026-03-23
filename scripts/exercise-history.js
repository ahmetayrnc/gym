// --- Parsing ---

const MONTHS = { Jan:1, Feb:2, Mar:3, Apr:4, May:5, Jun:6, Jul:7, Aug:8, Sep:9, Oct:10, Nov:11, Dec:12 };
const SET_PATTERN = /^([\d.]+)\s*[a-zA-Z]{1,3}\s+(\d+)/;

function parseDate(name) {
    const m = name.match(/^(\d+)\s+(\w+)\s+(\d+)/);
    if (!m) return 0;
    return (2000 + parseInt(m[3])) * 10000 + (MONTHS[m[2]] || 0) * 100 + parseInt(m[1]);
}

function parseSet(text) {
    const m = text.match(SET_PATTERN);
    return m ? { kg: parseFloat(m[1]), reps: parseInt(m[2]) } : null;
}

function extractExerciseData(content, exerciseName) {
    const lines = content.split('\n');
    const raw = [];
    let capturing = false;

    for (const line of lines) {
        if (line.includes(`[[${exerciseName}]]`)) {
            capturing = true;
            continue;
        }
        if (!capturing) continue;
        if (line.trim() === '---' || /\[\[.+?\]\]/.test(line)) break;
        if (line.trim()) raw.push(line.trim().replace(/^-\s*/, ''));
    }

    return {
        sets: raw.filter(l => parseSet(l)),
        notes: raw.filter(l => !parseSet(l)),
    };
}

// --- Comparison ---

function ordinal(n) {
    if (n === 1) return '1st';
    if (n === 2) return '2nd';
    if (n === 3) return '3rd';
    return `${n}th`;
}

function round2(n) {
    return Math.round(n * 100) / 100;
}

function plural(n, word) {
    return `${n} ${word}${n > 1 ? 's' : ''}`;
}

function compareSets(currRaw, prevRaw) {
    const curr = currRaw.map(parseSet).filter(Boolean);
    const prev = prevRaw.map(parseSet).filter(Boolean);
    const shared = Math.min(curr.length, prev.length);

    // align from end: extras at start are warmup sets
    const cOff = curr.length - shared;
    const pOff = prev.length - shared;

    const notes = [];
    for (let i = 0; i < shared; i++) {
        const c = curr[cOff + i];
        const p = prev[pOff + i];
        const s = ordinal(i + 1);
        const kgDiff = round2(c.kg - p.kg);
        const repDiff = c.reps - p.reps;

        if (kgDiff > 0) notes.push(`👍 ${kgDiff}kg more on ${s} set`);
        else if (kgDiff < 0) notes.push(`👎 ${-kgDiff}kg less on ${s} set`);

        if (repDiff > 0) notes.push(`👍 ${plural(repDiff, 'rep')} more on ${s} set`);
        else if (repDiff < 0) notes.push(`👎 ${plural(-repDiff, 'rep')} less on ${s} set`);
    }

    // fallback: if sets matched exactly, compare total volume
    if (notes.length === 0) {
        const vol = arr => arr.reduce((sum, x) => sum + x.kg * x.reps, 0);
        const currVol = vol(curr);
        const prevVol = vol(prev);

        if (currVol > prevVol) notes.push('👍 more volume');
        else if (currVol < prevVol) notes.push('👎 less volume');
        else notes.push('😐 same shit');
    }

    return notes;
}

// --- Main ---

const exerciseName = dv.current().file.name;
const days = dv.pages('"days"').sort(p => parseDate(p.file.name), 'desc').array();

const entries = [];
for (const day of days) {
    const content = await dv.io.load(day.file.path);
    if (!content || !content.includes(`[[${exerciseName}]]`)) continue;

    const { sets, notes } = extractExerciseData(content, exerciseName);
    if (sets.length > 0) entries.push({ day, sets, notes });
}

for (let i = 0; i < entries.length; i++) {
    const { day, sets, notes } = entries[i];
    const prev = entries[i + 1]?.sets;

    let header = day.file.link;
    if (prev) {
        const cmp = compareSets(sets, prev);
        if (cmp.length > 0) header += ` ${cmp.join(' ')}`;
    }

    dv.header(4, header);
    dv.list(sets);
    if (notes.length > 0) dv.paragraph(`*${notes.join(' · ')}*`);
}
