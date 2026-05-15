"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRightLeft,
  Bookmark,
  ChevronsLeft,
  ChevronsRight,
  Clock3,
  Home as HomeIcon,
  Moon,
  Search,
  Sun,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const CONFIGURED_API_BASE = process.env.NEXT_PUBLIC_API_BASE?.trim() || "";

function resolveApiBase() {
  if (CONFIGURED_API_BASE) return CONFIGURED_API_BASE;
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:4000`;
  }
  return "http://localhost:4000";
}

type Mapping = {
  termId: string;
  sourceSide: "nutanix" | "vmware";
  equivalenceType: "direct" | "partial" | "closest" | "none";
  explanation: string;
  definition: string;
  sourceRef?: string;
  nutanixTerms: { name: string }[];
  vmwareTerms: { name: string }[];
};

const sidebarItems = [
  { id: "search", label: "Search", icon: Search },
  { id: "favorites", label: "Favorites", icon: Bookmark },
  { id: "recent", label: "Recently Viewed", icon: Clock3 },
] as const;

function GlassPanel({
  isDark,
  className,
  children,
  id,
}: {
  isDark: boolean;
  className?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={`rounded-3xl border backdrop-blur-xl ${
        isDark
          ? "border-white/15 bg-white/[0.04] shadow-[0_20px_80px_rgba(6,6,14,0.5)]"
          : "border-black/10 bg-white/75 shadow-[0_20px_80px_rgba(10,6,30,0.14)]"
      } ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [results, setResults] = useState<Mapping[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<Mapping | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [activeSidebarView, setActiveSidebarView] = useState<
    "search" | "favorites" | "recent"
  >("search");
  const [searchError, setSearchError] = useState<string | null>(null);
  const isDark = theme === "dark";

  const submitSearch = () => {
    const trimmed = query.trim();
    setActiveSidebarView("search");
    setSubmittedQuery(trimmed);
    if (!trimmed) {
      setSearchError(null);
      setResults([]);
      setSelectedId(null);
      setSelectedTerm(null);
    }
  };

  const handleSelectTerm = (termId: string) => {
    setSelectedId(termId);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      document.getElementById("term-details")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    if (!submittedQuery.trim()) return;
    async function runSearch() {
      setSearchError(null);
      const apiBase = resolveApiBase();
      const res = await fetch(
        `${apiBase}/api/search?q=${encodeURIComponent(submittedQuery)}`,
      );
      if (!res.ok) {
        setResults([]);
        setSelectedId(null);
        setSelectedTerm(null);
        setSearchError("Search endpoint is unavailable. Check backend connectivity.");
        return;
      }
      const data = await res.json();
      setResults(data.results || []);
      if (data.results?.[0]) {
        setSelectedId(data.results[0].termId);
      } else {
        setSelectedId(null);
        setSelectedTerm(null);
      }
    }
    void runSearch().catch(() => {
      setResults([]);
      setSelectedId(null);
      setSelectedTerm(null);
      setSearchError("Unable to fetch search results right now.");
    });
  }, [submittedQuery]);

  useEffect(() => {
    if (!selectedId) return;
    async function loadDetails() {
      const apiBase = resolveApiBase();
      const res = await fetch(`${apiBase}/api/terms/${selectedId}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedTerm(data);
        if (selectedId) {
          setRecentlyViewed((previous) =>
            [selectedId, ...previous.filter((item) => item !== selectedId)].slice(0, 8),
          );
        }
      }
    }
    void loadDetails();
  }, [selectedId]);

  const recentSet = new Set(recentlyViewed);
  const recentRank = new Map(recentlyViewed.map((id, idx) => [id, idx]));
  const featuredResults = (
    activeSidebarView === "favorites"
      ? results.filter((item) => favorites.includes(item.termId))
      : activeSidebarView === "recent"
        ? results
            .filter((item) => recentSet.has(item.termId))
            .sort(
              (a, b) =>
                (recentRank.get(a.termId) ?? Number.MAX_SAFE_INTEGER) -
                (recentRank.get(b.termId) ?? Number.MAX_SAFE_INTEGER),
            )
        : results
  ).slice(0, 10);

  return (
    <div
      className={`relative min-h-screen overflow-hidden p-4 md:p-6 ${
        isDark
          ? "bg-[radial-gradient(circle_at_10%_20%,rgba(120,85,250,0.38),transparent_35%),radial-gradient(circle_at_90%_10%,rgba(94,68,214,0.25),transparent_32%),linear-gradient(180deg,#120d20_0%,#1d1431_40%,#171326_100%)] text-white"
          : "bg-[radial-gradient(circle_at_10%_20%,rgba(120,85,250,0.2),transparent_36%),radial-gradient(circle_at_90%_10%,rgba(196,182,253,0.3),transparent_35%),linear-gradient(180deg,#ffffff_0%,#f6f2ff_46%,#eee7ff_100%)] text-[#2D1E45]"
      }`}
    >
      <div
        className={`pointer-events-none absolute -left-16 top-16 h-64 w-64 rounded-full blur-3xl ${
          isDark ? "bg-[#7855FA]/30" : "bg-[#C4B6FD]/35"
        }`}
      />
      <div
        className={`pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full blur-3xl ${
          isDark ? "bg-[#5E44D6]/35" : "bg-[#7855FA]/20"
        }`}
      />

      <div className="mx-auto flex max-w-[1400px] gap-4">
        <motion.aside
          animate={{ width: sidebarCollapsed ? 84 : 280 }}
          className="hidden shrink-0 md:block"
        >
          <GlassPanel isDark={isDark} className="h-[calc(100vh-3rem)] p-4">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-white/20 p-2">
                  <HomeIcon className="h-4 w-4 text-[#B59BC6]" />
                </div>
                {!sidebarCollapsed && (
                  <span className={`text-sm font-semibold tracking-wide ${isDark ? "text-white/90" : "text-black"}`}>
                    Translator
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className={isDark ? "text-white/80 hover:bg-white/10" : "text-[#2D1E45] hover:bg-[#7855FA]/10"}
                onClick={() => setSidebarCollapsed((value) => !value)}
              >
                {sidebarCollapsed ? (
                  <ChevronsRight className="h-4 w-4" />
                ) : (
                  <ChevronsLeft className="h-4 w-4" />
                )}
              </Button>
            </div>

            <nav className="space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={`w-full justify-start gap-3 rounded-2xl px-3 ${
                      activeSidebarView === item.id
                        ? isDark
                          ? "bg-white/15 text-white"
                          : "bg-[#E3DBFF] text-black"
                        : isDark
                          ? "text-white/85 hover:bg-white/10 hover:text-white"
                          : "text-black hover:bg-[#7855FA]/10 hover:text-black"
                    }`}
                    onClick={() => setActiveSidebarView(item.id)}
                  >
                    <Icon className="h-4 w-4 text-[#B59BC6]" />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </Button>
                );
              })}
            </nav>

            <Separator className="my-5 bg-white/15" />
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 rounded-2xl px-3 ${
                isDark
                  ? "text-white/85 hover:bg-white/10 hover:text-white"
                  : "text-black hover:bg-[#7855FA]/10 hover:text-black"
              }`}
              onClick={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-[#B59BC6]" />
              ) : (
                <Moon className="h-4 w-4 text-[#B59BC6]" />
              )}
              {!sidebarCollapsed && (
                <span>{theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}</span>
              )}
            </Button>
          </GlassPanel>
        </motion.aside>

        <main className="min-w-0 flex-1 space-y-4">
          <GlassPanel isDark={isDark} className="p-5 md:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B59BC6]">
                  Nutanix Enterprise Translation
                </p>
                <h1 className="mt-1 text-2xl font-semibold md:text-3xl">
                  VMware ↔ Nutanix Translator
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={isDark ? "bg-[#7855FA]/30 text-white" : "bg-[#E3DBFF] text-[#2D1E45]"}>
                  Translator Workspace
                </Badge>
              </div>
            </div>

            <div
              className={`rounded-[28px] border p-3 backdrop-blur-xl ${
                isDark ? "border-white/20 bg-white/10" : "border-[#DBCDF2] bg-white/85"
              }`}
            >
              <form
                className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  submitSearch();
                }}
              >
                <Search className="ml-2 mt-1 h-5 w-5 shrink-0 text-[#B59BC6] sm:mt-0" />
                <Input
                  value={query}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setQuery(nextValue);
                    if (!nextValue.trim()) {
                      setActiveSidebarView("search");
                      setSearchError(null);
                      setSubmittedQuery("");
                      setResults([]);
                      setSelectedId(null);
                      setSelectedTerm(null);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      submitSearch();
                    }
                  }}
                  placeholder="Type VMware or Nutanix terminology..."
                  className={`w-full border-none bg-transparent text-base focus-visible:ring-0 ${
                    isDark
                      ? "text-white placeholder:text-white/60"
                      : "text-[#2D1E45] placeholder:text-[#522E91]/55"
                  }`}
                />
                <Button
                  type="button"
                  className="h-11 w-full rounded-full bg-[#7855FA] px-5 text-white hover:bg-[#6946EE] sm:h-10 sm:w-auto"
                  onClick={submitSearch}
                >
                  Enter
                </Button>
              </form>
            </div>
            {searchError ? (
              <p className={`mt-2 text-xs ${isDark ? "text-red-300" : "text-red-700"}`}>{searchError}</p>
            ) : null}

          </GlassPanel>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
            <GlassPanel isDark={isDark} className="p-4 md:p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className={`text-sm font-semibold uppercase tracking-wider ${isDark ? "text-white/75" : "text-black/75"}`}>
                  {/** text color controlled by parent mode */}
                  {activeSidebarView === "favorites"
                    ? "Favorites"
                    : activeSidebarView === "recent"
                      ? "Recently Viewed"
                      : "Results"}
                </h2>
                <Badge className={isDark ? "bg-[#7855FA]/30 text-white" : "bg-[#E3DBFF] text-black"}>
                  {featuredResults.length} matches
                </Badge>
              </div>
              <div className="space-y-3">
                {featuredResults.length === 0 && activeSidebarView !== "search" ? (
                  <Card className={`rounded-2xl p-4 text-sm ${isDark ? "border-white/15 bg-white/5 text-white/70" : "border-black/10 bg-white text-black/70"}`}>
                    {activeSidebarView === "favorites"
                      ? "No favorites yet. Open a term and use Add Favorite."
                      : "No recently viewed terms in current results yet."}
                  </Card>
                ) : null}
                <AnimatePresence mode="popLayout">
                  {featuredResults.map((item) => (
                    <motion.button
                      key={item.termId}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      whileHover={{ y: -2 }}
                      onClick={() => handleSelectTerm(item.termId)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        selectedId === item.termId
                          ? isDark
                            ? "border-[#7855FA]/60 bg-[#7855FA]/25"
                            : "border-[#7855FA]/55 bg-[#EDE6FF]"
                          : isDark
                            ? "border-white/15 bg-white/5 hover:bg-white/10"
                            : "border-black/10 bg-white hover:bg-[#F7F3FF]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-[#B59BC6]">
                            VMware
                          </p>
                          <p className={`text-base font-semibold leading-snug break-words ${isDark ? "text-white" : "text-black"}`}>{item.vmwareTerms[0]?.name}</p>
                        </div>
                        <ArrowRightLeft className={`mt-1 h-4 w-4 ${isDark ? "text-white/50" : "text-black/50"}`} />
                        <div>
                          <p className="text-xs uppercase tracking-wider text-[#B59BC6]">
                            Nutanix
                          </p>
                          <p className={`text-base font-semibold leading-snug break-words ${isDark ? "text-white" : "text-black"}`}>{item.nutanixTerms[0]?.name}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <Badge className={isDark ? "bg-white/15 text-white" : "bg-[#E3DBFF] text-black"}>{item.equivalenceType}</Badge>
                        <span className={`text-xs ${isDark ? "text-white/60" : "text-black/65"}`}>Confidence-aware mapping</span>
                      </div>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </GlassPanel>

            <GlassPanel isDark={isDark} className="p-4 md:p-5" id="term-details">
              <h2 className={`mb-3 text-sm font-semibold uppercase tracking-wider ${isDark ? "text-white/75" : "text-black/75"}`}>
                Term Details
              </h2>
              {!selectedTerm ? (
                <Card className={`rounded-2xl p-5 ${isDark ? "border-white/15 bg-white/5 text-white/70" : "border-black/10 bg-white text-black/75"}`}>
                  Select a result to view full details.
                </Card>
              ) : (
                <motion.div
                  key={selectedTerm.termId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <Card className={`rounded-2xl p-5 ${isDark ? "border-white/15 bg-white/5" : "border-black/10 bg-white"}`}>
                    <p className="text-xs uppercase tracking-wider text-[#B59BC6]">Term Pair</p>
                    <p className={`mt-3 text-sm ${isDark ? "text-white/80" : "text-black/80"}`}>
                      <span className={`font-semibold ${isDark ? "text-white" : "text-black"}`}>VMware: </span>
                      {selectedTerm.vmwareTerms.map((item) => item.name).join(", ")}
                    </p>
                    <p className={`mt-1 text-sm ${isDark ? "text-white/80" : "text-black/80"}`}>
                      <span className={`font-semibold ${isDark ? "text-white" : "text-black"}`}>Nutanix: </span>
                      {selectedTerm.nutanixTerms.map((item) => item.name).join(", ")}
                    </p>
                    <div className="mt-3">
                      <Badge className={isDark ? "bg-[#7855FA]/30 text-white" : "bg-[#E3DBFF] text-black"}>
                        {selectedTerm.equivalenceType}
                      </Badge>
                    </div>
                  </Card>

                  <Card className={`rounded-2xl p-5 ${isDark ? "border-white/15 bg-white/5" : "border-black/10 bg-white"}`}>
                    <p className="text-xs uppercase tracking-wider text-[#B59BC6]">Definition</p>
                    <p className={`mt-2 text-sm leading-6 ${isDark ? "text-white/85" : "text-black"}`}>{selectedTerm.definition}</p>
                    <p className={`mt-3 text-xs ${isDark ? "text-white/70" : "text-black/70"}`}>
                      Source: {selectedTerm.sourceRef || "@data/normalized/mappings.json"}
                    </p>
                  </Card>

                  <Card className={`rounded-2xl p-5 ${isDark ? "border-white/15 bg-white/5" : "border-black/10 bg-white"}`}>
                    <p className="text-xs uppercase tracking-wider text-[#B59BC6]">Explanation</p>
                    <p className={`mt-2 text-sm leading-6 ${isDark ? "text-white/85" : "text-black"}`}>
                      {selectedTerm.explanation}
                    </p>
                    <p className={`mt-3 text-xs ${isDark ? "text-white/70" : "text-black/70"}`}>
                      Source: {selectedTerm.sourceRef || "@data/normalized/mappings.json"}
                    </p>
                  </Card>
                </motion.div>
              )}

              <Separator className="my-5 bg-white/15" />
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider text-[#B59BC6]">Workspace</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Button
                    variant="ghost"
                    className={`justify-start rounded-xl border ${
                      isDark
                        ? "border-white/15 bg-white/5 text-white/80"
                        : "border-black/10 bg-white text-black"
                    }`}
                    onClick={() =>
                      selectedId &&
                      setFavorites((previous) =>
                        previous.includes(selectedId)
                          ? previous.filter((item) => item !== selectedId)
                          : [selectedId, ...previous].slice(0, 20),
                      )
                    }
                  >
                    <Bookmark className="mr-2 h-4 w-4 text-[#B59BC6]" />
                    {selectedId && favorites.includes(selectedId)
                      ? "Favorited"
                      : "Add Favorite"}
                  </Button>
                  <Button
                    variant="ghost"
                    className={`justify-start rounded-xl border ${
                      isDark
                        ? "border-white/15 bg-white/5 text-white/80"
                        : "border-black/10 bg-white text-black"
                    }`}
                  >
                    <Clock3 className="mr-2 h-4 w-4 text-[#B59BC6]" />
                    {recentlyViewed.length} recent
                  </Button>
                </div>
              </div>
            </GlassPanel>
          </div>
        </main>
      </div>
    </div>
  );
}
