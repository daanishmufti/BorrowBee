interface SearchSectionProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: { genre: string; minRating: string }) => void;
  searchQuery: string;
  filters: { genre: string; minRating: string };
}

export default function SearchSection({ 
  onSearch, 
  onFilterChange, 
  searchQuery, 
  filters 
}: SearchSectionProps) {
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
  };

  const handleFilterChange = (key: string, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <section className="search-section">
      <div className="search-container">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="🔍 Search for books, authors, or genres..."
          className="search-input"
        />
        <button className="btn btn-primary">
          Find Books
        </button>
      </div>
      
      <div className="search-filters">
        <select 
          value={filters.genre}
          onChange={(e) => handleFilterChange('genre', e.target.value)}
          className="filter-select"
        >
          <option value="">📚 All Genres</option>
          <option value="Fiction">📖 Fiction</option>
          <option value="Fantasy">✨ Fantasy</option>
          <option value="Science Fiction">🚀 Science Fiction</option>
          <option value="Mystery">🔍 Mystery</option>
          <option value="Adventure">🗺️ Adventure</option>
          <option value="Picture Book">🖼️ Picture Books</option>
          <option value="Educational">🎓 Educational</option>
          <option value="Biography">📝 Biography</option>
        </select>
        
        <select 
          value={filters.minRating}
          onChange={(e) => handleFilterChange('minRating', e.target.value)}
          className="filter-select"
        >
          <option value="">🐝 Any Rating</option>
          <option value="1">🐝 1+ Bees</option>
          <option value="2">🐝🐝 2+ Bees</option>
          <option value="3">🐝🐝🐝 3+ Bees</option>
          <option value="4">🐝🐝🐝🐝 4+ Bees</option>
          <option value="5">🐝🐝🐝🐝🐝 5 Bees</option>
        </select>
      </div>
    </section>
  );
}
