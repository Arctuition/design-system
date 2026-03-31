import React, { useState, useEffect } from "react";
import type { GroupedTokens } from "./color-token-utils";

export interface OutlineGroup {
  label: string;
  id: string;
  children?: { label: string; id: string }[];
}

export interface OutlineSection {
  label: string;
  id: string;
  groups: OutlineGroup[];
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildOutlineSections(
  sections: { title: string; groups: GroupedTokens[] }[]
): OutlineSection[] {
  return sections
    .filter((s) => s.groups.reduce((sum, g) => sum + g.tokens.length, 0) > 0)
    .map((section) => {
      const sectionSlug = slugify(section.title);
      const rawGroups = section.groups
        .filter((g) => g.tokens.length > 0)
        .map((g) => ({
          label: g.groupName,
          id: `group-${sectionSlug}-${slugify(g.groupName)}`,
        }));

      // Nest groups that use "Parent / Child" naming into a 3-tier hierarchy
      const outlineGroups: OutlineGroup[] = [];
      const parentMap = new Map<string, OutlineGroup>();

      for (const group of rawGroups) {
        const slashIdx = group.label.indexOf(" / ");
        if (slashIdx !== -1) {
          const parentLabel = group.label.slice(0, slashIdx);
          const childLabel = group.label.slice(slashIdx + 3);
          let parent = parentMap.get(parentLabel);
          if (!parent) {
            parent = {
              label: parentLabel,
              // Use the first child's id as the parent scroll target
              id: group.id,
              children: [],
            };
            parentMap.set(parentLabel, parent);
            outlineGroups.push(parent);
          }
          parent.children!.push({ label: childLabel, id: group.id });
        } else {
          outlineGroups.push({ label: group.label, id: group.id });
        }
      }

      return {
        label: section.title,
        id: `section-${sectionSlug}`,
        groups: outlineGroups,
      };
    });
}

export function TokenOutlineSidebar({
  sections,
}: {
  sections: OutlineSection[];
}) {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const allIds = sections.flatMap((s) => [
      s.id,
      ...s.groups.flatMap((g) => [
        g.id,
        ...(g.children?.map((c) => c.id) ?? []),
      ]),
    ]);
    // Deduplicate (parent id may equal first child id)
    const uniqueIds = [...new Set(allIds)];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { threshold: 0.1, rootMargin: "-80px 0px -70% 0px" }
    );

    uniqueIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  if (sections.length === 0) return null;

  const handleClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  // Check if any child in a parent group is active
  const isParentActive = (group: OutlineGroup): boolean => {
    if (activeId === group.id) return true;
    return group.children?.some((c) => activeId === c.id) ?? false;
  };

  return (
    <aside className="w-[220px] shrink-0 sticky top-0 h-screen overflow-auto border-l border-border py-10 px-4 hidden lg:block">
      <p
        className="text-muted-foreground mb-4"
        style={{
          fontSize: "var(--text-label)",
          fontWeight: "var(--font-weight-medium)",
        }}
      >
        ON THIS PAGE
      </p>
      <nav className="space-y-1">
        {sections.map((section) => (
          <div key={section.id}>
            {/* Tier 1: Section heading */}
            <a
              href={`#${section.id}`}
              className={`block py-1 transition-colors ${
                activeId === section.id
                  ? "text-primary"
                  : "text-foreground hover:text-primary"
              }`}
              style={{
                fontSize: "var(--text-label)",
                fontWeight: "var(--font-weight-medium)",
              }}
              onClick={(e) => handleClick(e, section.id)}
            >
              {section.label}
            </a>
            {/* Tier 2: Group items */}
            {section.groups.map((group) => (
              <div key={group.id + group.label}>
                {group.children ? (
                  <>
                    {/* Tier 2: Parent label (clickable, scrolls to first child) */}
                    <a
                      href={`#${group.id}`}
                      className={`block py-1 transition-colors ${
                        isParentActive(group)
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      style={{
                        fontSize: "var(--text-label)",
                        paddingLeft: "12px",
                        fontWeight: "var(--font-weight-medium)",
                      }}
                      onClick={(e) => handleClick(e, group.id)}
                    >
                      {group.label}
                    </a>
                    {/* Tier 3: Children */}
                    {group.children.map((child) => (
                      <a
                        key={child.id}
                        href={`#${child.id}`}
                        className={`block py-1 transition-colors ${
                          activeId === child.id
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        style={{
                          fontSize: "var(--text-label)",
                          paddingLeft: "24px",
                        }}
                        onClick={(e) => handleClick(e, child.id)}
                      >
                        {child.label}
                      </a>
                    ))}
                  </>
                ) : (
                  /* Tier 2: Flat group (no children) */
                  <a
                    href={`#${group.id}`}
                    className={`block py-1 transition-colors ${
                      activeId === group.id
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    style={{
                      fontSize: "var(--text-label)",
                      paddingLeft: "12px",
                    }}
                    onClick={(e) => handleClick(e, group.id)}
                  >
                    {group.label}
                  </a>
                )}
              </div>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
