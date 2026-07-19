# UI Skills Upstream Lock

Repository: https://github.com/ibelick/ui-skills.git
Commit: 5dfc4a783f6f0338d5086b693bf9edfdf4367310
Tree: ebcd1606cb7681239b3b35ac4b610f727197c4b5
Commit date: 2026-07-17T14:31:30+02:00
Commit title: feat: add new skills
License: MIT, copyright 2026 Julien Thibeaut

The upstream source text below was copied from the audited commit without
semantic changes. Do not replace it from a branch name, an npm release, or
`npx ui-skills`. Any update requires a new source audit and a new exact commit
lock.

The patch writer normalized the missing terminal newline in upstream
`skills/fixing-accessibility/SKILL.md`. Its upstream SHA-256 is listed below;
the installed copy SHA-256 is
`8ccc8ff441a832a78a77f9b0006f3e1420ced8ed2187f6464dc89d9e07fed506`.

## Included Upstream Files

| Upstream path | Project path | Upstream SHA-256 |
| --- | --- | --- |
| `LICENSE` | `.agents/skills/UI_SKILLS_LICENSE.txt` | `c615621c4cc1676ccde194e7a01b6469ba477780251bd71e007fc473a49c2c2b` |
| `skills/fixing-accessibility/SKILL.md` | `.agents/skills/fixing-accessibility/SKILL.md` | `549261e8a53b53a1a20c0ddbf736821e5fc0876ad82eee76e0efab8e9ee9dadf` |
| `skills/fixing-metadata/SKILL.md` | `.agents/skills/fixing-metadata/SKILL.md` | `b8315ff95a92dcfa48c33e2b4838a31d9448bd46252aab45726549ce865d6547` |
| `skills/fixing-motion-performance/SKILL.md` | `.agents/skills/fixing-motion-performance/SKILL.md` | `0a2d654902bc04263ce68c8c02967ef03f17b482e855360a5463211d99d7baa9` |
| `skills/improve-ui/SKILL.md` | `.agents/skills/improve-ui/SKILL.md` | `fa2ac808f6d9dab7bb3620880b014d2c18e227e5b006102856038096e573e69a` |
| `skills/improve-ui/references/plan-template.md` | `.agents/skills/improve-ui/references/plan-template.md` | `8faca7a14659a7f951d3b89fb730a43a4ce99966cc00481bf83d82b90f34b868` |

## Local Policy Sidecars

Each installed Skill has a project-local `agents/openai.yaml` with
`policy.allow_implicit_invocation: false`. These sidecars are local policy,
not verbatim upstream files.

## Deliberately Excluded

- `skills/baseline-ui`
- `skills/ui-skills-root`
- Upstream CLI, package files, lockfile, scripts, website source, and assets
- Upstream `skills/improve-ui/agents/openai.yaml`, because it enables implicit invocation
