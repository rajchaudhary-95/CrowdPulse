---
name: brainstorming-project-plans
description: Facilitates structured brainstorming and project architecture planning. Use when the user introduces a new idea, asks for a project roadmap, or needs help breaking down a complex application into manageable phases.
---

# Project Brainstorming & Planning Facilitator

## When to use this skill

- The user presents a high-level idea and asks "how should I build this?"
- A new workspace is created and needs an initial project architecture.
- The user is stuck on feature prioritization or technical stack choices.

## Workflow

- [ ] `discovery` Ask 1-2 clarifying questions about the project's ultimate goal and target audience.
- [ ] `ideation` Generate a broad list of potential features, categorizing them into "Must-Have" (MVP) and "Nice-to-Have".
- [ ] `architecture` Propose a technical stack and folder structure based on the agreed-upon features.
- [ ] `milestones` Break the project down into sequential, actionable steps.
- [ ] `validation` Ask the user to approve the plan before generating any actual source code.

## Instructions

### Brainstorming Heuristics

When generating ideas or plans, adhere to these principles:

- **Think in Phases:** Always separate the Minimum Viable Product (MVP) from future scaling.
- **Component-Driven:** When planning UI, break the interface down into reusable components early in the discussion.
- **Align with Roadmaps:** When structuring learning or portfolio projects, map the milestones to mirror established progression paths (e.g., organizing a MERN stack application to follow logical steps similar to Aman Kumar's web development roadmap, isolating React frontend tasks from Express/MongoDB backend integration).

### The "Plan-Validate-Execute" Loop

Do not write implementation code during the brainstorming phase. Your goal is to produce a `PROJECT_PLAN.md` document.

1.  **Plan:** Use the provided markdown template to structure the user's thoughts.
2.  **Validate:** Present the draft plan to the user. Explicitly ask: _"Does this architecture look correct, or should we adjust the scope of Phase 1?"_
3.  **Execute:** Only after confirmation, save the output to the workspace root.

## Resources

- `resources/PROJECT_PLAN_TEMPLATE.md`
