import { useState, useEffect } from 'react';

const STORAGE_KEY = 'ibda3d_recent_searches';
const MAX_HISTORY = 6;

export function useSearchHistory() {
    const [history, setHistory] = useState<string[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setHistory(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse search history', e);
            }
        }
    }, []);

    const addSearch = (term: string) => {
        if (!term || term.trim().length < 2) return;

        const cleanTerm = term.trim();

        setHistory(prev => {
            // Remove if exists (to move to top), take first MAX-1, prepend new
            const filtered = prev.filter(t => t.toLowerCase() !== cleanTerm.toLowerCase());
            const newHistory = [cleanTerm, ...filtered].slice(0, MAX_HISTORY);

            localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
            return newHistory;
        });
    };

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem(STORAGE_KEY);
    };

    const removeSearch = (term: string) => {
        setHistory(prev => {
            const newHistory = prev.filter(t => t !== term);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
            return newHistory;
        });
    };

    return {
        history,
        addSearch,
        clearHistory,
        removeSearch
    };
}
