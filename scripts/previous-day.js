const WT = eval(await dv.io.load("scripts/workout-type.js"));
const { parseDate, getWorkoutType, recommendType } = WT;

const current = dv.current();
const currentDate = parseDate(current.file.name);
const currentTypes = getWorkoutType(current);
const hasExercises = current.file.outlinks.array().length > 0;

const priorDays = dv.pages('"days"')
    .filter(d => parseDate(d.file.name) < currentDate)
    .sort(d => parseDate(d.file.name), 'desc')
    .array();

function isReal(t) { return t !== 'Unknown' && t !== 'Pencil Neck'; }

if (!hasExercises) {
    const recType = recommendType(priorDays, currentDate);
    const prevDay = recType
        ? priorDays.find(d => getWorkoutType(d).includes(recType))
        : null;
    if (recType && prevDay) {
        dv.paragraph(`**${recType}** — prev: ${prevDay.file.link}`);
    } else if (recType) {
        dv.paragraph(`**${recType}**`);
    } else {
        dv.paragraph(`**Unknown**`);
    }
} else if (!currentTypes.some(isReal)) {
    dv.paragraph(`**${currentTypes.join(', ')}**`);
} else {
    const real = currentTypes.filter(isReal);
    const prevLinks = [];
    const seenDays = new Set();
    for (const t of real) {
        const prev = priorDays.find(d => getWorkoutType(d).includes(t));
        if (prev && !seenDays.has(prev.file.path)) {
            seenDays.add(prev.file.path);
            prevLinks.push(`${t}: ${prev.file.link}`);
        }
    }

    if (prevLinks.length > 0) {
        dv.paragraph(`**${real.join(', ')}** — prev: ${prevLinks.join(' · ')}`);
    } else {
        dv.paragraph(`**${real.join(', ')}**`);
    }
}