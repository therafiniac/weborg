import { Search as SearchIcon } from "lucide-react";
import { useState, type FormEvent } from "react";

import type { WidgetProps } from "@/core/widgets/types";

import type { SearchData } from ".";
import { buildSearchUrl, engineName } from "./engines";
import "./Search.css";

export default function Search({ data }: WidgetProps<SearchData>) {
  const [query, setQuery] = useState("");
  const label = `Search with ${engineName(data.engine)}`;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const url = buildSearchUrl(data.engine, data.customUrl, query);
    if (!url) return;
    if (data.openInNewTab) window.open(url, "_blank", "noopener");
    else window.location.assign(url);
  };

  return (
    <form className="search" role="search" onSubmit={handleSubmit}>
      <SearchIcon className="search__icon" size={18} aria-hidden />
      <input
        className="search__input"
        type="search"
        value={query}
        placeholder={label}
        aria-label={label}
        autoComplete="off"
        onChange={(event) => setQuery(event.target.value)}
      />
    </form>
  );
}
