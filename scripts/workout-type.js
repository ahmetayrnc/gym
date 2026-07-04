(() => {
    const MONTHS = { Jan:1, Feb:2, Mar:3, Apr:4, May:5, Jun:6, Jul:7, Aug:8, Sep:9, Oct:10, Nov:11, Dec:12 };

    function parseDate(name) {
        const m = name.match(/^(\d+)\s+(\w+)\s+(\d+)/);
        if (!m) return 0;
        return (2000 + parseInt(m[3])) * 10000 + (MONTHS[m[2]] || 0) * 100 + parseInt(m[1]);
    }

    // Returns an array of workout types for a day. A day can have multiple
    // types when no single muscle group dominates (e.g. military press +
    // deadlift → both "Upper - shoulders" and "Lower"). A type is included
    // when its exercise count is at least half the top group's count, so a
    // near-tie yields both while a clearly dominant group stays solo.
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

        const candidates = [
            ['Lower', muscleCounts['legs'] || 0],
            ['Upper - chest', muscleCounts['chest'] || 0],
            ['Upper - back', muscleCounts['back'] || 0],
            ['Upper - shoulders', (muscleCounts['shoulder'] || 0) + (muscleCounts['traps'] || 0)],
        ];

        const hasExercises = day.file.outlinks.array().length > 0;
        if (!hasExercises) return ['Unknown'];

        const present = candidates.filter(c => c[1] > 0);
        if (present.length === 0) return ['Pencil Neck'];

        const max = Math.max(...present.map(c => c[1]));
        return present.filter(c => c[1] >= max / 2).map(c => c[0]);
    }

    // Neglect-scored recommendation. `priorDays` must be sorted desc by date
    // and filtered to days before the current date. Returns null if none.
    // Excludes the most recent workout's type so you don't repeat it.
    // score = daysSince + (avgCount - count) * 0.3  -- recency dominates,
    // the small bonus only nudges historically-neglected types.
    function recommendType(priorDays, currentDate) {
        const history = [];
        for (const day of priorDays) {
            const types = getWorkoutType(day).filter(t => t !== 'Unknown' && t !== 'Pencil Neck');
            const date = parseDate(day.file.name);
            for (const t of types) history.push({ type: t, date });
        }
        if (history.length === 0) return null;
        const recentType = history[0].type;
        const lastByType = {}, countByType = {};
        for (const h of history) {
            if (h.type === recentType) continue;
            lastByType[h.type] = Math.max(lastByType[h.type] || 0, h.date);
            countByType[h.type] = (countByType[h.type] || 0) + 1;
        }
        const counts = Object.values(countByType);
        const avgCount = counts.reduce((s, c) => s + c, 0) / counts.length;
        let bestType = null, bestScore = -Infinity;
        for (const [type, last] of Object.entries(lastByType)) {
            const daysSince = Math.max(0, Math.round((currentDate - last) / 10000));
            const score = daysSince + (avgCount - (countByType[type] || 0)) * 0.3;
            if (score > bestScore) { bestScore = score; bestType = type; }
        }
        return bestType;
    }

    return { parseDate, getWorkoutType, recommendType };
})()