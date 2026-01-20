
// `src/components/camviewer/browser/FilterPanel.tsx`**

import React from 'react';
import { useBrowserStore, SortByType } from '@/state/browserStore';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
    Label
} from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

export function FilterPanel() {
    const { filterPanelOpen, filters, setFilters, sortBy, setSortBy, clearFilters } = useBrowserStore();

    if (!filterPanelOpen) return null;

    return (
        <div className="p-4 glass-header bg-black/5 space-y-6 text-sm">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="sort-by" className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Sort By</Label>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortByType)}>
                        <SelectTrigger id="sort-by" className="h-10 bg-white/5 border-white/5 rounded-xl focus:ring-white/10">
                            <SelectValue placeholder="Sort by..." />
                        </SelectTrigger>
                        <SelectContent className="glass-card border-white/10">
                            <SelectItem value="num_users">Viewers</SelectItem>
                            <SelectItem value="num_followers">Followers</SelectItem>
                            <SelectItem value="display_age">Age</SelectItem>
                            <SelectItem value="start_dt_utc">Newest Session</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="region" className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Region</Label>
                    <Input
                        id="region"
                        placeholder="e.g. US"
                        value={filters.region}
                        onChange={(e) => setFilters({ region: e.target.value })}
                        className="h-10 bg-white/5 border-white/5 rounded-xl focus:bg-white/10 transition-all placeholder:text-neutral-700"
                    />
                </div>
            </div>
            <div className="space-y-3">
                <div className="flex justify-between items-end">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Min Viewers</Label>
                    <span className="text-xs font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full">{filters.minViewers.toLocaleString()}</span>
                </div>
                <Slider defaultValue={[0]} value={[filters.minViewers]} onValueChange={([v]) => setFilters({ minViewers: v })} max={5000} step={50} className="py-2" />
            </div>
            <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                    <Label htmlFor="show-new" className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-white">New Models</span>
                        <span className="text-[10px] text-neutral-500 font-medium">Only show new streamers</span>
                    </Label>
                    <Switch id="show-new" checked={filters.showNew} onCheckedChange={(c) => setFilters({ showNew: c })} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                    <Label htmlFor="show-verified" className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-white">Age Verified</span>
                        <span className="text-[10px] text-neutral-500 font-medium">Only show 18+ verified</span>
                    </Label>
                    <Switch id="show-verified" checked={filters.showVerified} onCheckedChange={(c) => setFilters({ showVerified: c })} />
                </div>
            </div>
            <button
                onClick={clearFilters}
                className="w-full py-3 rounded-xl bg-white/5 text-xs font-black uppercase tracking-widest text-neutral-400 hover:bg-white/10 hover:text-white transition-all border border-white/5"
            >
                Reset Filters
            </button>
        </div>
    );
}