const MONTHS = { Jan:1, Feb:2, Mar:3, Apr:4, May:5, Jun:6, Jul:7, Aug:8, Sep:9, Oct:10, Nov:11, Dec:12 };

function parseDate(name) {
    const m = name.match(/^(\d+)\s+(\w+)\s+(\d+)/);
    if (!m) return 0;
    return (2000 + parseInt(m[3])) * 10000 + (MONTHS[m[2]] || 0) * 100 + parseInt(m[1]);
}

function getWorkoutType(day) {
    const muscleCounts = {};

    for (const link of day.file.outlinks) {
        const exercise = dv.page(link.path);
        if (exercise && exercise.file.tags) {
            for (const tag of exercise.file.tags) {
                const t = tag.replace(/^#/, '');
                muscleCounts[t] = (muscleCounts[t] || 0) + 1;
            }
        }
    }

    const backCount = (muscleCounts['back'] || 0) + (muscleCounts['traps'] || 0);
    const chestCount = muscleCounts['chest'] || 0;
    const shoulderCount = muscleCounts['shoulder'] || 0;
    const hasBiceps = muscleCounts['biceps'] > 0;
    const hasTriceps = muscleCounts['triceps'] > 0;
    const hasLegs = muscleCounts['legs'] > 0;

    if (chestCount >= 2) return 'Push';
    if (backCount >= 2) return 'Pull';
    if (shoulderCount >= 2) return 'Shoulder';
    if (hasLegs) return 'Legs';
    if (hasBiceps || hasTriceps) return 'Arms';
    return 'Unknown';
}

const current = dv.current();
const currentDate = parseDate(current.file.name);
const currentType = getWorkoutType(current);

if (currentType === 'Unknown') {
    dv.paragraph(`**${currentType}**`);
} else {
    const days = dv.pages('"days"')
        .filter(d => parseDate(d.file.name) < currentDate)
        .sort(d => parseDate(d.file.name), 'desc')
        .array();

    let prevDay = null;
    for (const day of days) {
        if (getWorkoutType(day) === currentType) {
            prevDay = day;
            break;
        }
    }

    if (prevDay) {
        dv.paragraph(`**${currentType}** — prev: ${prevDay.file.link}`);
    } else {
        dv.paragraph(`**${currentType}**`);
    }
}
