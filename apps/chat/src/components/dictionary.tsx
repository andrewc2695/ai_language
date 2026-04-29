import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { searchWords } from "@/server/functions/searchWords";

interface Word {
  id: number;
  english: string;
  jyutping: string;
  proficiency_level: number;
  date_last_practiced: string | null;
  times_practiced: number;
}

export function Dictionary() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Word[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const words = await searchWords({ data: { query: query.trim() } });
        setResults(words as Word[]);
      } catch {
        // ignore search errors
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div className="flex flex-col gap-4 w-full max-w-md mx-auto p-4">
      <h2 className="text-lg font-semibold">Dictionary</h2>
      <Input
        placeholder="Search English or Jyutping..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {loading && (
        <p className="text-sm text-muted-foreground">Searching...</p>
      )}
      {!loading && query.trim() && results.length === 0 && (
        <p className="text-sm text-muted-foreground">No results found.</p>
      )}
      <div className="flex flex-col gap-2">
        {results.map((word) => (
          <Card key={word.id}>
            <CardContent className="flex justify-between items-center py-3 px-4">
              <div>
                <p className="font-medium">{word.english}</p>
                <p className="text-sm text-muted-foreground">{word.jyutping}</p>
              </div>
              <span className="text-xs text-muted-foreground">
                Lvl {word.proficiency_level}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
