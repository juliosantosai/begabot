---
name: create-skill
description: 'Guide the developer to create a reusable SKILL.md for this repository or a specific workflow.'
argument-hint: 'What should the new skill produce?'
disable-model-invocation: true
---

This skill helps generate a new `SKILL.md` file by turning a conversation or workflow into a reusable custom skill.

## When to use
- You have a repeatable workflow or review process that should be captured as a skill.
- You want to create repo-scoped guidance for code generation, tests, or review checklists.
- You want a structured way to turn a developer prompt into a formal skill definition.

## Step-by-step process
1. Ask for the intended outcome of the skill:
   - What artifact should it produce?
   - What problem does it solve?
   - Is it repo-scoped or personal/local?
2. Review the available conversation or repository context.
3. Extract the workflow:
   - Step-by-step actions
   - Decision points and branching logic
   - Quality criteria and completion checks
4. Draft a `SKILL.md` skeleton with metadata and clear instructions.
5. Identify ambiguous or missing details and ask clarifying questions.
6. Finalize the skill and save it as `SKILL.md` in the repository root or agreed location.

## Quality checklist
- The skill clearly states its purpose and target artifact.
- The workflow is broken into discrete, ordered steps.
- Decision logic is explicit and includes when to ask for clarification.
- The skill includes completion criteria and example prompts.
- The output is formatted as a valid `SKILL.md` file.

## Example prompts to try
- "Create a SKILL.md for generating repository-specific API endpoint tests."
- "Help me write a skill that turns architecture review notes into issue templates."
- "Draft a skill that converts a design discussion into a task list and code change plan."

## Related customization
- Add a personal skill to your local user prompts if you want a private version of this workflow.
- Create a repo-specific `copilot-guidelines.md` entry for using custom skills in this project.
