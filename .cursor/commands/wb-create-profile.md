---
description: Interactive Codex workflow to generate a new Cursor profile from a guided questionnaire.
---

# /wb-create-profile

## Purpose

Create a brand-new Cursor-ready profile (folder under `profiles/`) by collecting
structured requirements from the user, generating all required metadata files,
and validating the bundle with the composer tool.

## When to Use

✅ **Run this command when**
- A consultant needs a tailored profile that is not covered by the catalog.
- The delivery context requires a specific mix of stacks, practices, and
  automation modules.
- You want Codex to scaffold the full profile folder (including
  `profile.json`, `enabled-modules.txt`, and `README.md`).

❌ **Do not use when**
- You only need to tweak an existing profile (edit its files manually instead).
- The profile already exists in `profiles/` (reuse or fork it).

## Questionnaire Flow

Codex should run an interactive interview and echo the answers back for
confirmation before generating any files.

1. **Profile Identity**
   - `profileId` (kebab-case, matches folder name; e.g. `python-data-stack`).
   - Display name (for `profile.json` → `name`).
   - Short description (1–2 sentences).

2. **Target Delivery Context**
   - Primary backend stack (e.g. `stack.backend` variant, language, framework).
   - Frontend expectations (React, Vue, mobile, none).
   - DevOps or cloud requirements (list modules such as `capability.logging-telemetry`).

3. **Practices & Automations**
   - Agile / workflow practices needed (e.g. `practice.agile-methodology`).
   - Compliance or quality add-ons (linting, security, testing modules).
   - Task Master automation surface (commands, prompts, Jira/ClickUp integrations).

4. **Validation & Distribution**
   - Ask whether the profile should ship with Task Master bundles (default yes).
   - Determine any client overlays (if a `clients/<client>/overlays/<profileId>`
     folder should also be prepared).

After all answers are collected, repeat the interpreted configuration so the
user can confirm or request adjustments.

## File Generation Steps

1. **Create the folder** `profiles/<profileId>/`.
2. **`profile.json`** — populate using the template below and insert the
   curated module list in dependency-safe order (stacks → practices →
   capabilities).

   ```json
   {
     "id": "{{profileId}}",
     "name": "{{displayName}}",
     "description": "{{shortDescription}}",
     "modules": [
       {{#each moduleIds}}
       "{{this}}"{{#unless @last}},{{/unless}}
       {{/each}}
     ]
   }
   ```

3. **`enabled-modules.txt`** — mirror the module identifiers (one per line).
   Include a leading comment that states the profile purpose, for example:

   ```text
   # Modules enabled for the {{displayName}} profile
   stack.backend
   practice.agile-methodology
   capability.task-master
   ```

4. **`README.md`** — explain the profile in prose:
   - `# {{displayName}} Profile`
   - Paragraph describing the use case.
   - `## Included modules` section with bullet list mirroring the modules and a
     short explanation of each (reference existing profile READMEs for tone).
   - Optional sections for onboarding notes or required environment setup.

5. **Catalog update** — append a bullet entry to `profiles/README.md` pointing to
   the new folder with a concise description.

## Validation Checklist

- Run the composer in dry-run mode to ensure the registry can resolve all
  modules:

  ```bash
  python toolchain/composer/build_profile.py profiles/{{profileId}} --dry-run
  ```

- If the dry run succeeds, build the distributable bundle:

  ```bash
  python toolchain/composer/build_profile.py profiles/{{profileId}} --clean
  ```

- Inspect `dist/{{profileId}}/.cursor/` to confirm commands and rules were
  materialized as expected.

- When client overlays are requested, ensure the folder exists under
  `clients/<client>/overlays/{{profileId}}/` (create it if missing) and rerun the
  composer with `--client <client>`.

## Handoff Notes

- Include the generated folder and updated catalog in the pull request.
- Summarize questionnaire answers in the PR description so reviewers can trace
  why specific modules were included.
- Encourage the consultant to version the resulting `.cursor` bundle alongside
  project assets for reproducibility.
