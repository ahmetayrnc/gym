<%*
const MONTHS = { Jan:1, Feb:2, Mar:3, Apr:4, May:5, Jun:6, Jul:7, Aug:8, Sep:9, Oct:10, Nov:11, Dec:12 };
const SET_PATTERN = /^[\d.]+\s*[a-zA-Z]{1,3}\s+\d+/;

function parseDate(name) {
    const m = name.match(/^(\d+)\s+(\w+)\s+(\d+)/);
    if (!m) return 0;
    return (2000 + parseInt(m[3])) * 10000 + (MONTHS[m[2]] || 0) * 100 + parseInt(m[1]);
}

const folder = app.vault.getAbstractFileByPath("exercises");
const exercises = folder.children
    .filter(f => f.extension === "md")
    .map(f => f.basename)
    .sort();

const input = await tp.system.prompt("Exercise name:");
if (!input) return;

const lower = input.toLowerCase();
const matches = exercises.filter(e => e.toLowerCase().includes(lower));

let choice;
if (matches.length === 0) {
    new Notice("No matching exercise found");
    return;
} else if (matches.length === 1) {
    choice = matches[0];
} else {
    const numbered = matches.map((m, i) => `${i + 1}. ${m}`);
    const pick = await tp.system.prompt(numbered.join("\n") + "\n\nEnter number:");
    if (!pick) return;
    const idx = parseInt(pick) - 1;
    if (idx < 0 || idx >= matches.length) {
        new Notice("Invalid selection");
        return;
    }
    choice = matches[idx];
}

const currentDate = parseDate(tp.file.title);

function collectFiles(f) {
    let files = [];
    if (!f || !f.children) return files;
    for (const c of f.children) {
        if (c.extension === "md") files.push(c);
        else if (c.children) files = files.concat(collectFiles(c));
    }
    return files;
}

const dayFiles = collectFiles(app.vault.getAbstractFileByPath("days"))
    .filter(f => parseDate(f.basename) < currentDate)
    .sort((a, b) => parseDate(b.basename) - parseDate(a.basename));

let prevSets = [];
for (const file of dayFiles) {
    const content = await app.vault.cachedRead(file);
    if (content.includes(`[[${choice}]]`)) {
        const lines = content.split('\n');
        let capturing = false;
        for (const line of lines) {
            if (line.includes(`[[${choice}]]`)) { capturing = true; continue; }
            if (!capturing) continue;
            if (/\[\[.+?\]\]/.test(line)) break;
            const trimmed = line.trim().replace(/^-\s*/, '');
            if (trimmed && SET_PATTERN.test(trimmed)) prevSets.push(trimmed);
        }
        break;
    }
}

let text = `[[${choice}]]\n`;
if (prevSets.length > 0) text += prevSets.join('\n');
tR += text;
_%>
