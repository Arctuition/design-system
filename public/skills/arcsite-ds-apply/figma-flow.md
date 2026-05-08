# Reference: Figma design generation

For Figma work, the source of truth split is:

- **Principles** → from `llms.txt` (decision-making, hierarchy, when to use what)
- **Variables and components** → from the ArcSite Figma Design Library, accessed through Figma MCP tools

These two sources should agree, but always pull each from its own home. Don't translate `llms.txt` token values into raw Figma fills, and don't paraphrase Figma component names into prose without verifying.

## Workflow

1. Fetch `llms.txt` and read the principle docs relevant to the screen type (e.g., dashboard, form, empty state, modal).
2. Use Figma MCP to **search the ArcSite Design Library** for the components and variables the design needs.
3. Confirm what's available before designing. If a needed component is missing, flag it to the user before continuing.
4. Build the design by:
   - Instantiating library components (don't draw lookalikes)
   - Binding library variables to fills, strokes, spacing, radius (don't hardcode hex or px)
5. Use principles from `llms.txt` to guide layout choices, hierarchy, and any decisions the variables alone don't resolve.

## When the library is incomplete

If `llms.txt` describes a principle that the Figma library doesn't yet have a variable or component for, **don't paper over it with a primitive**. Surface it:

> The ArcSite design system has a principle for `[X]`, but I don't see a corresponding `[variable / component]` in the Figma library. Options:
>
> **A.** Use the closest existing library element (`[name]`) and accept the small divergence.
> **B.** Draw a primitive for this one design — note it as design debt to formalize later.
> **C.** Pause this design until the library is updated.
>
> Which would you like?

This keeps the library as the source of truth for Figma and prevents one-off shapes from quietly proliferating.

## When the user asks for a screen with no clear precedent

If the user asks for something the design system hasn't really addressed (a new pattern, a novel layout), say so before generating. Often the right move is to look at the closest existing screen pattern, name what makes the new request different, and ask whether to mirror precedent or break new ground.

## What to return to the user

Along with the Figma design itself:

- List the library components used (by name)
- List the library variables bound (by name)
- Note any places where you fell back to primitives, and why
- Note any principle from `llms.txt` you applied as a layout/hierarchy decision

This makes the design auditable and easy for a designer to extend in Figma directly.
