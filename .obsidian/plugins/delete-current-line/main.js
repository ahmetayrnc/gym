"use strict";

const { Plugin } = require("obsidian");

class DeleteCurrentLinePlugin extends Plugin {
  onload() {
    this.addCommand({
      id: "delete-current-line",
      name: "Delete current line",
      editorCallback: (editor) => {
        const cursor = editor.getCursor();
        const line = cursor.line;
        const lineCount = editor.lineCount();
        if (lineCount <= 0) return;

        editor.replaceRange(
          "",
          { line: line, ch: 0 },
          line < lineCount - 1
            ? { line: line + 1, ch: 0 }
            : { line: line, ch: editor.getLine(line).length }
        );

        if (line < lineCount - 1) {
          editor.setCursor({ line: line, ch: 0 });
        } else if (line > 0) {
          editor.setCursor({ line: line - 1, ch: editor.getLine(line - 1).length });
        }
      },
    });
  }
}

module.exports = DeleteCurrentLinePlugin;