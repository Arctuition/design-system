import { useTheme, type ThemeMode } from "../../store/theme";
import { LibraryIcon } from "../shared/LibraryIcon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const OPTIONS: Array<{ mode: ThemeMode; label: string; iconName: string }> = [
  { mode: "light", label: "Light Mode", iconName: "sun" },
  { mode: "dark", label: "Dark Mode", iconName: "moon" },
  { mode: "system", label: "Follow Computer Setting", iconName: "computer" },
];

export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const active = OPTIONS.find((o) => o.mode === mode) ?? OPTIONS[2];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Theme: ${active.label}`}
          title={active.label}
          className="flex items-center justify-center size-[28px] rounded-[var(--radius)] text-secondary-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <LibraryIcon name={active.iconName} size={24} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={6} className="min-w-[220px]">
        {OPTIONS.map((opt) => {
          const selected = opt.mode === mode;
          return (
            <DropdownMenuItem
              key={opt.mode}
              onSelect={() => setMode(opt.mode)}
              className="gap-2.5"
            >
              <LibraryIcon name={opt.iconName} size={24} className="text-muted-foreground" />
              <span className="flex-1">{opt.label}</span>
              {selected && (
                <span className="text-primary" style={{ lineHeight: 0 }}>
                  <LibraryIcon name="check mark 16x16" size={16} />
                </span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
