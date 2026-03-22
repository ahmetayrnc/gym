```dataviewjs
const muscleOrder = ['chest', 'back', 'shoulder', 'biceps', 'triceps', 'legs', 'abs'];
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
    rows.push(`${day.file.name} - **${workoutType}** (${sortedMuscles})`);
}

dv.list(rows);
```
