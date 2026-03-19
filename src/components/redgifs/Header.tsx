// RedGifs v3 - Header with Tab Navigation + Search/Controls
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import {
  Search, Grid, X, ChevronDown,
  TrendingUp, Clock, Star, Hash,
  Users, Venus, Mars, Sparkles, Heart,
} from 'lucide-react';
import { useRedgifsSettings, useRedgifsSearch } from './hooks';
import { sortOptions, viewModes } from './types';

const tabs = [
  { path: '/redgifs/latest', label: 'Latest', icon: Clock },
  { path: '/redgifs/niches', label: 'Niches', icon: Hash },
  { path: '/redgifs/creators', label: 'Creators', icon: Users },
  { path: '/redgifs/favorites', label: 'Favs', icon: Heart },
] as const;

export const Header = React.memo(() => {
  const location = useLocation();
  const { viewMode, setViewMode, sortBy, setSortBy } = useRedgifsSettings();
  const { query, setQuery, gender, setGender } = useRedgifsSearch();
  const [showGenderFilter, setShowGenderFilter] = useState(false);
  const [showSortFilter, setShowSortFilter] = useState(false);
  const genderRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  const isLatestTab = location.pathname === '/redgifs/latest' || location.pathname === '/redgifs';

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (genderRef.current && !genderRef.current.contains(e.target as Node)) setShowGenderFilter(false);
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSortFilter(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const genderOptions = [
    { value: 'all', label: 'All', icon: Users },
    { value: 'straight', label: 'Straight', icon: Venus },
    { value: 'gay', label: 'Gay', icon: Mars },
    { value: 'lesbian', label: 'Lesbian', icon: Venus },
    { value: 'trans', label: 'Trans', icon: Users },
  ];

  const getSortIcon = (sortId: string) => {
    switch (sortId) {
      case 'trending': return TrendingUp;
      case 'latest': return Clock;
      case 'top28': return Star;
      case 'top7': return Star;
      case 'top': return Star;
      case 'random': return Hash;
      default: return TrendingUp;
    }
  };

  return (
    <div className="border-b border-white/10 bg-[var(--app-bg)]">
      {/* Top bar: Logo + Search + Controls */}
      <div className="flex items-center gap-3 px-4 py-2">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
            <Grid className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-black text-white leading-none">RedGifs</h1>
          </div>
        </div>

        {/* Search — only on Latest tab */}
        {isLatestTab && (
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search GIFs..."
                className="liquid-input w-full pl-9 pr-8 py-1.5 text-sm text-white placeholder-white/40"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Spacer when search is hidden */}
        {!isLatestTab && <div className="flex-1" />}

        {/* Controls — only on Latest tab */}
        {isLatestTab && (
          <div className="flex items-center gap-1.5">
            {/* View Mode */}
            <div className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-white/5">
              {viewModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode)}
                  className={`px-1.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all ${
                    viewMode.id === mode.id
                      ? 'bg-white/20 text-white'
                      : 'text-white/50 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {mode.label[0]}
                </button>
              ))}
            </div>

            {/* Gender Filter */}
            <div className="relative" ref={genderRef}>
              <button
                onClick={() => { setShowGenderFilter(!showGenderFilter); setShowSortFilter(false); }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
              >
                {React.createElement(genderOptions.find((g) => g.value === gender)?.icon || Users, { size: 13 })}
                <span className="hidden sm:inline text-white/80 text-xs">
                  {genderOptions.find((g) => g.value === gender)?.label || 'All'}
                </span>
                <ChevronDown size={11} className={`text-white/50 transition-transform duration-150 ${showGenderFilter ? 'rotate-180' : ''}`} />
              </button>

              <div className={`absolute top-full right-0 mt-1 w-36 bg-[#1a1a2e] rounded-lg border border-white/10 shadow-2xl z-50 overflow-hidden transition-all duration-150 origin-top-right ${
                showGenderFilter ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
              }`}>
                <div className="p-1">
                  {genderOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => { setGender(option.value); setShowGenderFilter(false); }}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs transition-all ${
                          gender === option.value ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Icon size={13} />
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => { setShowSortFilter(!showSortFilter); setShowGenderFilter(false); }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
              >
                {React.createElement(getSortIcon(sortOptions.find((o) => o.value === sortBy)?.id || ''), { size: 13 })}
                <span className="hidden sm:inline text-white/80 text-xs">
                  {sortOptions.find((o) => o.value === sortBy)?.label || 'Sort'}
                </span>
                <ChevronDown size={11} className={`text-white/50 transition-transform duration-150 ${showSortFilter ? 'rotate-180' : ''}`} />
              </button>

              <div className={`absolute top-full right-0 mt-1 w-40 bg-[#1a1a2e] rounded-lg border border-white/10 shadow-2xl z-50 overflow-hidden transition-all duration-150 origin-top-right ${
                showSortFilter ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
              }`}>
                <div className="p-1">
                  {sortOptions.map((option) => {
                    const Icon = getSortIcon(option.id);
                    return (
                      <button
                        key={option.id}
                        onClick={() => { setSortBy(option.value); setShowSortFilter(false); }}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs transition-all ${
                          sortBy === option.value ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Icon size={13} />
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-0 px-4">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`relative flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                isActive
                  ? 'text-pink-400'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Icon size={13} />
              <span>{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-pink-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
});

Header.displayName = 'Header';
