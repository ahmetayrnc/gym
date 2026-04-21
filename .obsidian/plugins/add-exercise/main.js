const { Plugin, FuzzySuggestModal } = require('obsidian');

const MONTHS = { Jan:1, Feb:2, Mar:3, Apr:4, May:5, Jun:6, Jul:7, Aug:8, Sep:9, Oct:10, Nov:11, Dec:12 };
const SET_PATTERN = /^[\d.]+\s*[a-zA-Z]{1,3}\s+\d+/;

function parseDate(name) {
    const m = name.match(/^(\d+)\s+(\w+)\s+(\d+)/);
    if (!m) return 0;
    return (2000 + parseInt(m[3])) * 10000 + (MONTHS[m[2]] || 0) * 100 + parseInt(m[1]);
}

function collectFiles(folder) {
    let files = [];
    if (!folder || !folder.children) return files;
    for (const child of folder.children) {
        if (child.extension === 'md') files.push(child);
        else if (child.children) files = files.concat(collectFiles(child));
    }
    return files;
}

class ExercisePicker extends FuzzySuggestModal {
    constructor(app, exercises, onChoose) {
        super(app);
        this.exercises = exercises;
        this.onChoose = onChoose;
        this.setPlaceholder('Pick an exercise...');
    }
    getItems() { return this.exercises; }
    getItemText(item) { return item; }
    onChooseItem(item) { this.onChoose(item); }
}

module.exports = class AddExercisePlugin extends Plugin {
    async onload() {
        this.addCommand({
            id: 'insert-exercise',
            name: 'Insert exercise with previous values',
            editorCallback: (editor, view) => {
                const folder = this.app.vault.getAbstractFileByPath('exercises');
                if (!folder || !folder.children) return;

                const exercises = folder.children
                    .filter(f => f.extension === 'md')
                    .map(f => f.basename)
                    .sort();

                new ExercisePicker(this.app, exercises, async (name) => {
                    const currentDate = parseDate(view.file.basename);
                    const dayFiles = collectFiles(this.app.vault.getAbstractFileByPath('days'))
                        .filter(f => parseDate(f.basename) < currentDate)
                        .sort((a, b) => parseDate(b.basename) - parseDate(a.basename));

                    let prevSets = [];
                    for (const file of dayFiles) {
                        const content = await this.app.vault.cachedRead(file);
                        if (content.includes(`[[${name}]]`)) {
                            const lines = content.split('\n');
                            let capturing = false;
                            for (const line of lines) {
                                if (line.includes(`[[${name}]]`)) { capturing = true; continue; }
                                if (!capturing) continue;
                                if (/\[\[.+?\]\]/.test(line)) break;
                                const trimmed = line.trim().replace(/^-\s*/, '');
                                if (trimmed && SET_PATTERN.test(trimmed)) prevSets.push(trimmed);
                            }
                            break;
                        }
                    }

                    let text = `[[${name}]]\n`;
                    if (prevSets.length > 0) text += prevSets.join('\n') + '\n';

                    const cursor = editor.getCursor();
                    editor.replaceRange(text, cursor);
                }).open();
            }
        });
    }
};
