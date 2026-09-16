import { Bell, Search } from 'lucide-react';

export const Header = () => {
  return (
    <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 items-center gap-x-4 border-b border-slate-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="relative flex flex-1" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">
            Search
          </label>
          <div className="relative w-full max-w-md items-center flex">
            <Search className="pointer-events-none absolute inset-y-0 left-3 h-full w-4 text-slate-400" aria-hidden="true" />
            <input
              id="search-field"
              className="block h-9 w-full rounded-md border-0 py-0 pl-10 pr-0 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm bg-slate-100"
              placeholder="Quick search leads..."
              type="search"
              name="search"
            />
          </div>
        </form>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button type="button" className="-m-2.5 p-2.5 text-slate-400 hover:text-slate-500">
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
};
