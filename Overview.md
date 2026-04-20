### Monthly Report
```dataviewjs
const months = {Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12};
const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const monthlyCounts = {};

for (const day of dv.pages('"days"').array()) {
    const m = day.file.name.match(/^(\d+)\s+(\w+)\s+(\d+)/);
    if (!m) continue;
    const month = months[m[2]] || 0;
    const year = 2000 + parseInt(m[3]);
    const key = year * 100 + month;
    monthlyCounts[key] = (monthlyCounts[key] || 0) + 1;
}

const today = new Date();
const sorted = Object.keys(monthlyCounts).map(Number).sort((a, b) => b - a);

const rows = sorted.map(key => {
    const year = Math.floor(key / 100);
    const month = key % 100;
    const count = monthlyCounts[key];
    const isCurrentMonth = (year === today.getFullYear() && month === today.getMonth() + 1);
    const daysInMonth = isCurrentMonth ? today.getDate() : new Date(year, month, 0).getDate();
    return `${monthNames[month]} **${count}/${daysInMonth}**`;
});

dv.list(rows);
```
### Times per Week
```dataviewjs
const displayOrder = ['legs', 'chest', 'back', 'shoulder', 'forearms', 'core'];
const months = {Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12};
function toDate(name) {
    const m = name.match(/^(\d+)\s+(\w+)\s+(\d+)/);
    if (!m) return null;
    return new Date(2000 + parseInt(m[3]), (months[m[2]] || 1) - 1, parseInt(m[1]));
}

function getDayCounts(day) {
    const seen = new Set();
    for (const link of day.file.outlinks) {
        const ex = dv.page(link.path);
        if (ex && ex.file.tags) {
            for (const tag of ex.file.tags) seen.add(tag.replace(/^#/, ''));
        }
    }
    const c = {};
    for (const m of displayOrder) c[m] = 0;
    if (seen.has('legs')) c['legs'] = 1;
    if (seen.has('chest')) c['chest'] = 1;
    if (seen.has('back') || seen.has('traps')) c['back'] = 1;
    if (seen.has('shoulder')) c['shoulder'] = 1;
    if (seen.has('forearms')) c['forearms'] = 1;
    if (seen.has('core')) c['core'] = 1;
    return c;
}

function getMonday(d) {
    const date = new Date(d);
    const day = date.getDay();
    date.setDate(date.getDate() - ((day + 6) % 7));
    date.setHours(0, 0, 0, 0);
    return date.getTime();
}

// Last week range
const today = new Date();
const dayOfWeek = today.getDay();
const thisMonday = new Date(today);
thisMonday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
const lastMonday = new Date(thisMonday);
lastMonday.setDate(thisMonday.getDate() - 7);
lastMonday.setHours(0, 0, 0, 0);
const lastSunday = new Date(lastMonday);
lastSunday.setDate(lastMonday.getDate() + 6);
lastSunday.setHours(23, 59, 59, 999);

// Last week counts + all weeks data
const lastWeekCounts = {};
for (const m of displayOrder) lastWeekCounts[m] = 0;
const weekData = {};

for (const day of dv.pages('"days"').array()) {
    const d = toDate(day.file.name);
    if (!d) continue;
    const c = getDayCounts(day);

    // Last week
    if (d >= lastMonday && d <= lastSunday) {
        for (const m of displayOrder) lastWeekCounts[m] += c[m];
    }

    // All weeks
    const weekKey = getMonday(d);
    if (!weekData[weekKey]) {
        weekData[weekKey] = {};
        for (const m of displayOrder) weekData[weekKey][m] = 0;
    }
    for (const m of displayOrder) weekData[weekKey][m] += c[m];
}

const weeks = Object.values(weekData);
function median(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const weekLabel = `${lastMonday.getDate()}/${lastMonday.getMonth()+1} - ${lastSunday.getDate()}/${lastSunday.getMonth()+1}`;
dv.table(
    ['Body Part', `Last (${weekLabel})`, 'Avg', 'Median'],
    displayOrder.map(m => {
        const vals = weeks.map(w => w[m]);
        const avg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
        const med = median(vals);
        return [m, lastWeekCounts[m], avg, med];
    })
);
```
### Schedule
```dataviewjs
const displayOrder = ['legs', 'chest', 'back', 'shoulder', 'forearms', 'core'];
const months = {Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12};
function parseDate(name) {
    const m = name.match(/^(\d+)\s+(\w+)\s+(\d+)/);
    if (!m) return 0;
    return (2000 + parseInt(m[3])) * 10000 + (months[m[2]] || 0) * 100 + parseInt(m[1]);
}
const days = dv.pages('"days"').sort(p => parseDate(p.file.name), 'desc');

const rows = [];
for (const day of days) {
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

    // Map to display groups
    const muscles = new Set();
    const groupCounts = {};
    if (muscleCounts['legs']) { muscles.add('legs'); groupCounts['legs'] = muscleCounts['legs']; }
    if (muscleCounts['chest']) { muscles.add('chest'); groupCounts['chest'] = muscleCounts['chest']; }
    const backCount = (muscleCounts['back'] || 0) + (muscleCounts['traps'] || 0);
    if (backCount) { muscles.add('back'); groupCounts['back'] = backCount; }
    if (muscleCounts['shoulder']) { muscles.add('shoulder'); groupCounts['shoulder'] = muscleCounts['shoulder']; }
    if (muscleCounts['biceps']) { muscles.add('biceps'); groupCounts['biceps'] = muscleCounts['biceps']; }
    if (muscleCounts['triceps']) { muscles.add('triceps'); groupCounts['triceps'] = muscleCounts['triceps']; }
    if (muscleCounts['forearms']) muscles.add('forearms');
    if (muscleCounts['core']) muscles.add('core');

    let workoutType = 'Unknown';
    if ((groupCounts['chest'] || 0) >= 2) {
        workoutType = 'Push';
    } else if ((groupCounts['back'] || 0) >= 2) {
        workoutType = 'Pull';
    } else if (muscles.has('shoulder') && (groupCounts['shoulder'] || 0) >= 2) {
        workoutType = 'Shoulder';
    } else if (muscles.has('legs')) {
        workoutType = 'Legs';
    } else if (muscles.has('biceps') || muscles.has('triceps')) {
        workoutType = 'Arms';
    }

    const scheduleDisplay = ['legs', 'chest', 'back', 'shoulder', 'biceps', 'triceps', 'forearms', 'core'];
    const sortedMuscles = scheduleDisplay.filter(m => muscles.has(m)).join(', ');
    rows.push(`${day.file.link} - **${workoutType}** (${sortedMuscles})`);
}

dv.list(rows);
```
