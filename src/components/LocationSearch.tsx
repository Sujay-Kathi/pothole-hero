import { useState, useEffect, useCallback } from "react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import { useDebounce } from "@/hooks/use-debounce"; 
import { cn } from "@/lib/utils";

export interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  boundingbox: [string, string, string, string];
}

interface LocationSearchProps {
  onLocationSelect: (result: NominatimResult) => void;
  className?: string;
}

const LocationSearch = ({ onLocationSelect, className }: LocationSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 500);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // Bangalore bounding box
      const viewbox = "77.3,12.7,77.9,13.2";
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&viewbox=${viewbox}&bounded=1&countrycodes=in`
      );
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error fetching from Nominatim:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    handleSearch(debouncedQuery);
  }, [debouncedQuery, handleSearch]);

  const handleSelect = (result: NominatimResult) => {
    onLocationSelect(result);
    setQuery("");
    setResults([]);
  };

  return (
    <div className={cn("w-full", className)}>
      <Command className="rounded-lg border shadow-md">
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search for a location in Bangalore..."
          className="h-10"
        />
        {(results.length > 0 || isLoading) && (
          <CommandList>
            {isLoading && <CommandItem>Loading...</CommandItem>}
            <CommandEmpty>No results found.</CommandEmpty>
            {results.map((result) => (
              <CommandItem
                key={result.place_id}
                onSelect={() => handleSelect(result)}
                value={result.display_name}
              >
                <span>{result.display_name}</span>
              </CommandItem>
            ))}
          </CommandList>
        )}
      </Command>
    </div>
  );
};

export default LocationSearch;
