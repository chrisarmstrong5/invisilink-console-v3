"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { config, type GeoTargetingCountry } from "@/lib/config";

interface GeoTargetingSelectorProps {
  enabled: boolean;
  selectedCountries: string[];
  onEnabledChange: (enabled: boolean) => void;
  onCountriesChange: (countries: string[]) => void;
}

export function GeoTargetingSelector({
  enabled,
  selectedCountries,
  onEnabledChange,
  onCountriesChange,
}: GeoTargetingSelectorProps) {
  const [open, setOpen] = useState(false);

  const countries = config.geoTargeting.countries;

  // Group countries by region
  const englishSpeaking = countries.filter(
    (c) => c.region === "english-speaking"
  );
  const european = countries.filter((c) => c.region === "european");
  const other = countries.filter((c) => c.region === "other");

  const toggleCountry = (code: string) => {
    if (selectedCountries.includes(code)) {
      onCountriesChange(selectedCountries.filter((c) => c !== code));
    } else {
      onCountriesChange([...selectedCountries, code]);
    }
  };

  const selectAllInRegion = (region: GeoTargetingCountry[]) => {
    const regionCodes = region.map((c) => c.code);
    const allSelected = regionCodes.every((code) =>
      selectedCountries.includes(code)
    );

    if (allSelected) {
      // Deselect all in region
      onCountriesChange(
        selectedCountries.filter((code) => !regionCodes.includes(code))
      );
    } else {
      // Select all in region
      const newSelection = Array.from(
        new Set([...selectedCountries, ...regionCodes])
      );
      onCountriesChange(newSelection);
    }
  };

  const selectedCountryNames = countries
    .filter((c) => selectedCountries.includes(c.code))
    .map((c) => c.name);

  return (
    <div className="space-y-3">
      {/* Enable/Disable Toggle */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="geo-enabled"
          checked={enabled}
          onCheckedChange={(checked) => onEnabledChange(checked as boolean)}
        />
        <Label htmlFor="geo-enabled" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Enable Geo-Targeting
        </Label>
      </div>

      {/* Country Selector */}
      {enabled && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Select Target Countries ({selectedCountries.length} selected)
          </Label>

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {selectedCountries.length === 0 ? (
                  <span className="text-muted-foreground">
                    Select countries...
                  </span>
                ) : (
                  <span className="truncate">
                    {selectedCountries.length <= 3
                      ? selectedCountryNames.join(", ")
                      : `${selectedCountryNames
                          .slice(0, 3)
                          .join(", ")} +${selectedCountries.length - 3} more`}
                  </span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search countries..." />
                <CommandEmpty>No countries found.</CommandEmpty>

                {/* English-speaking Countries */}
                <CommandGroup heading="English-speaking">
                  <CommandItem
                    onSelect={() => selectAllInRegion(englishSpeaking)}
                    className="text-xs text-muted-foreground"
                  >
                    {englishSpeaking.every((c) =>
                      selectedCountries.includes(c.code)
                    )
                      ? "Deselect all"
                      : "Select all"}
                  </CommandItem>
                  {englishSpeaking.map((country) => (
                    <CommandItem
                      key={country.code}
                      onSelect={() => toggleCountry(country.code)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCountries.includes(country.code)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {country.name} ({country.code})
                    </CommandItem>
                  ))}
                </CommandGroup>

                {/* European Countries */}
                <CommandGroup heading="European">
                  <CommandItem
                    onSelect={() => selectAllInRegion(european)}
                    className="text-xs text-muted-foreground"
                  >
                    {european.every((c) => selectedCountries.includes(c.code))
                      ? "Deselect all"
                      : "Select all"}
                  </CommandItem>
                  {european.map((country) => (
                    <CommandItem
                      key={country.code}
                      onSelect={() => toggleCountry(country.code)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCountries.includes(country.code)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {country.name} ({country.code})
                    </CommandItem>
                  ))}
                </CommandGroup>

                {/* Other Countries */}
                <CommandGroup heading="Other">
                  <CommandItem
                    onSelect={() => selectAllInRegion(other)}
                    className="text-xs text-muted-foreground"
                  >
                    {other.every((c) => selectedCountries.includes(c.code))
                      ? "Deselect all"
                      : "Select all"}
                  </CommandItem>
                  {other.map((country) => (
                    <CommandItem
                      key={country.code}
                      onSelect={() => toggleCountry(country.code)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCountries.includes(country.code)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {country.name} ({country.code})
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Selected Countries Badges */}
          {selectedCountries.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedCountries.slice(0, 10).map((code) => {
                const country = countries.find((c) => c.code === code);
                return (
                  <Badge
                    key={code}
                    variant="secondary"
                    className="text-xs"
                  >
                    {country?.code}
                  </Badge>
                );
              })}
              {selectedCountries.length > 10 && (
                <Badge variant="outline" className="text-xs">
                  +{selectedCountries.length - 10} more
                </Badge>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Traffic from selected countries will be allowed. All others will be
            blocked.
          </p>
        </div>
      )}
    </div>
  );
}
