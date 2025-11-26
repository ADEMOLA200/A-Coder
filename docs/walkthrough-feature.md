This feature provides a shared `walkthrough.md` file that any AI agent can use to document its progress on the current task.

- The file is always named `walkthrough.md` and is written/updated by a dedicated tool callable from all agents.
- When the tool is first invoked and the document is created or updated, the sidebar chat tool-result panel should:
  - Display a preview of the current `walkthrough.md` contents.
  - Show an **Open** button that opens the document in the editor using VS Code’s built‑in Markdown preview.
- As the AI continues working, subsequent tool calls should append or update content in `walkthrough.md`. The tool-result UI must refresh to show the latest version after each update.
- When the task is finished, the final `walkthrough.md` should be rendered in the chat tool-result UI, again with an **Open** button that opens the completed walkthrough in the VS Code Markdown preview.
