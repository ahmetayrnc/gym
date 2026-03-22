### Last 14 days

```dataviewjs
const muscleOrder = ['chest', 'back', 'shoulder', 'biceps', 'triceps', 'forearms', 'traps', 'legs', 'core'];
const months = {Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12};
function toDate(name) {
    const m = name.match(/^(\d+)\s+(\w+)\s+(\d+)/);
    if (!m) return null;
    return new Date(2000 + parseInt(m[3]), (months[m[2]] || 1) - 1, parseInt(m[1]));
}

const cutoff = new Date();
cutoff.setDate(cutoff.getDate() - 14);

const counts = {};
for (const m of muscleOrder) counts[m] = 0;

for (const day of dv.pages('"days"').array()) {
    const d = toDate(day.file.name);
    if (!d || d < cutoff) continue;
    const seen = new Set();
    for (const link of day.file.outlinks) {
        const ex = dv.page(link.path);
        if (ex && ex.file.tags) {
            for (const tag of ex.file.tags) seen.add(tag.replace(/^#/, ''));
        }
    }
    for (const m of seen) {
        if (counts[m] !== undefined) counts[m]++;
    }
}

const chartData = {
    type: 'bar',
    data: {
        labels: muscleOrder.map(m => `${m} (${counts[m]})`),
        datasets: [{
            label: 'Days trained (last 14 days)',
            data: muscleOrder.map(m => counts[m]),
            backgroundColor: 'rgba(124, 77, 255, 0.5)',
        }]
    },
    options: {
        indexAxis: 'y',
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
        },
        scales: {
            x: {
                beginAtZero: true,
                ticks: { stepSize: 1 }
            },
            y: {
                ticks: { autoSkip: false }
            }
        }
    }
};

window.renderChart(chartData, this.container);
```

### Schedule

```dataviewjs
const muscleOrder = ['chest', 'back', 'shoulder', 'biceps', 'triceps', 'forearms', 'traps', 'legs', 'core'];
const months = {Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12};
function parseDate(name) {
    const m = name.match(/^(\d+)\s+(\w+)\s+(\d+)/);
    if (!m) return 0;
    return (2000 + parseInt(m[3])) * 10000 + (months[m[2]] || 0) * 100 + parseInt(m[1]);
}
const days = dv.pages('"days"').sort(p => parseDate(p.file.name), 'desc');

const rows = [];
for (const day of days) {
    const muscles = new Set();

    for (const link of day.file.outlinks) {
        const exercise = dv.page(link.path);
        if (exercise && exercise.file.tags) {
            for (const tag of exercise.file.tags) {
                muscles.add(tag.replace(/^#/, ''));
            }
        }
    }

    let workoutType = 'Unknown';
    if (muscles.has('triceps') && muscles.has('biceps')) {
        workoutType = 'Arms';
    } else if (muscles.has('chest')) {
        workoutType = 'Push';
    } else if (muscles.has('back')) {
        workoutType = 'Pull';
    } else if (muscles.has('shoulder')) {
        workoutType = 'Shoulder';
    } else if (muscles.has('legs')) {
        workoutType = 'Legs';
    }

    const sortedMuscles = muscleOrder.filter(m => muscles.has(m)).join(', ');
    rows.push(`${day.file.link} - **${workoutType}** (${sortedMuscles})`);
}

dv.list(rows);
```
