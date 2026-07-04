const WT = eval(await dv.io.load("scripts/workout-type.js"));
const { parseDate, getWorkoutType, recommendType } = WT;

const current = dv.current();
const currentDate = parseDate(current.file.name);

const days = dv.pages('"days"')
    .filter(d => parseDate(d.file.name) < currentDate)
    .sort(d => parseDate(d.file.name), 'desc')
    .array();

const bestType = recommendType(days, currentDate);

if (!bestType) {
    // Either no history, or the only history is what you just did.
    const history = [];
    for (const day of days) {
        for (const t of getWorkoutType(day)) {
            if (t !== 'Unknown' && t !== 'Pencil Neck') history.push(t);
        }
    }
    dv.paragraph(history.length
        ? `**Recommended today:** Rest — you just did ${[...new Set(history)].join(', ')}.`
        : `**Recommendation:** Whatever you want — no history yet.`);
} else {
    dv.paragraph(`**Recommended today:** ${bestType}`);
}