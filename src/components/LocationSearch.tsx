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
  userLocation?: [number, number] | null;
}

const LocationSearch = ({ onLocationSelect, className, userLocation }: LocationSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // Use user location for bias if available, otherwise default to Bangalore center
      const lat = userLocation ? userLocation[0] : 12.9716;
      const lon = userLocation ? userLocation[1] : 77.5946;

      // Use Photon API with strict Bangalore bias, bounding box, and specific layer filters
      // We prioritize specific OSM tags to find "places" (apartments, schools, etc.)
      const tags = [
        "place",
        "amenity",
        "building",
        "shop",
        "office",
        "tourism",
        "leisure"
      ].map(t => `&osm_tag=${t}`).join("");

      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&lat=${lat}&lon=${lon}&limit=15&bbox=77.379,12.834,77.786,13.143${tags}`
      );
      const data = await response.json();

      // Map Photon GeoJSON to NominatimResult structure
      const mappedResults: NominatimResult[] = data.features
        .filter((feature: any) => {
          // Additional client-side filtering to ensure "Bangalore" or "Bengaluru" is in the context
          const p = feature.properties;
          const context = [p.city, p.state, p.district].join(" ").toLowerCase();
          return context.includes("bangalore") || context.includes("bengaluru") || context.includes("karnataka");
        })
        .map((feature: any, index: number) => {
          const p = feature.properties;

          // Construct a readable display name
          const parts = [
            p.name,
            p.housenumber,
            p.street,
            p.district,
            p.city,
            p.state,
            p.postcode
          ].filter(Boolean);

          return {
            place_id: p.osm_id || index,
            licence: "Data © OpenStreetMap contributors, ODbL 1.0. https://osm.org/copyright",
            osm_type: p.osm_type || "node",
            osm_id: p.osm_id || index,
            lat: feature.geometry.coordinates[1].toString(),
            lon: feature.geometry.coordinates[0].toString(),
            display_name: parts.join(", "),
            boundingbox: ["0", "0", "0", "0"] // Placeholder as Photon doesn't always return bbox
          };
        });

      setResults(mappedResults);
    } catch (error) {
      console.error("Error fetching from Photon:", error);
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
    setQuery(result.display_name.split(',')[0]); // Keep just the name in the input
    setResults([]);
  };

  return (
    <div className={cn("w-full", className)}>
      <Command shouldFilter={false} className="rounded-lg border shadow-md bg-white dark:bg-zinc-900">
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search for apartments, schools, landmarks..."
          className="h-10"
        />
        {(results.length > 0 || isLoading) && (
          <CommandList className="max-h-[300px] overflow-y-auto">
            {isLoading && <CommandItem disabled>Loading...</CommandItem>}
            {!isLoading && results.length === 0 && <CommandEmpty>No results found.</CommandEmpty>}
            {results.map((result) => (
              <CommandItem
                key={`${result.place_id}-${result.lat}-${result.lon}`}
                onSelect={() => handleSelect(result)}
                value={result.display_name}
                className="cursor-pointer hover:bg-accent"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{result.display_name.split(',')[0]}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {result.display_name.split(',').slice(1).join(', ')}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandList>
        )}
      </Command>
    </div>
  );
};

export default LocationSearch;
