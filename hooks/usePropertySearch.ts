import { useCallback, useEffect, useRef, useState } from "react";
import {
  PROPERTY_SEARCH_PAGE_SIZE,
  searchPropertyPage,
  type PropertySearchFilters,
} from "../lib/propertySearch";
import type { Property } from "../types/types";

interface SearchState {
  key: string;
  properties: Property[];
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
}

export function usePropertySearch(filters: PropertySearchFilters) {
  const [state, setState] = useState<SearchState | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const requestId = useRef(0);
  const loadingMore = useRef(false);
  const requestKey = JSON.stringify(filters);
  const currentState = state?.key === requestKey ? state : null;

  useEffect(() => {
    const currentRequestId = ++requestId.current;
    let isCurrent = true;

    const fetchFirstPage = async () => {
      setState({
        key: requestKey,
        properties: [],
        hasMore: false,
        loading: true,
        loadingMore: false,
        error: null,
      });

      try {
        const result = await searchPropertyPage(filters, 0);
        if (!isCurrent || currentRequestId !== requestId.current) return;

        setState({
          key: requestKey,
          properties: result.properties,
          hasMore: result.hasMore,
          loading: false,
          loadingMore: false,
          error: null,
        });
      } catch (error) {
        console.error("Failed to fetch search properties:", error);
        if (!isCurrent || currentRequestId !== requestId.current) return;

        setState({
          key: requestKey,
          properties: [],
          hasMore: false,
          loading: false,
          loadingMore: false,
          error: "Unable to search PGs. Please try again.",
        });
      }
    };

    const delay = filters.search.trim() ? 300 : 0;
    const timeout = setTimeout(() => {
      void fetchFirstPage();
    }, delay);

    return () => {
      isCurrent = false;
      clearTimeout(timeout);
      if (requestId.current === currentRequestId) requestId.current += 1;
    };
  }, [filters, requestKey, retryCount]);

  const loadMore = useCallback(async () => {
    const pageState = state?.key === requestKey ? state : null;
    if (
      !pageState ||
      pageState.loading ||
      !pageState.hasMore ||
      loadingMore.current
    ) {
      return;
    }

    const currentRequestId = requestId.current;
    loadingMore.current = true;
    setState((current) =>
      current?.key === requestKey
        ? { ...current, loadingMore: true, error: null }
        : current
    );

    try {
      const nextPage = Math.floor(
        pageState.properties.length / PROPERTY_SEARCH_PAGE_SIZE
      );
      const result = await searchPropertyPage(filters, nextPage);
      if (currentRequestId !== requestId.current) return;

      setState((current) => {
        if (current?.key !== requestKey) return current;

        const knownIds = new Set(current.properties.map((property) => property.id));
        const additionalProperties = result.properties.filter(
          (property) => !knownIds.has(property.id)
        );

        return {
          ...current,
          properties: [...current.properties, ...additionalProperties],
          hasMore: result.hasMore,
          loadingMore: false,
          error: null,
        };
      });
    } catch (error) {
      console.error("Failed to load more search properties:", error);
      if (currentRequestId === requestId.current) {
        setState((current) =>
          current?.key === requestKey
            ? {
                ...current,
                loadingMore: false,
                error: "Unable to load more PGs. Please try again.",
              }
            : current
        );
      }
    } finally {
      loadingMore.current = false;
    }
  }, [filters, requestKey, state]);

  const retry = useCallback(() => {
    setRetryCount((count) => count + 1);
  }, []);

  return {
    results: currentState?.properties ?? [],
    loading: currentState?.loading ?? true,
    loadingMore: currentState?.loadingMore ?? false,
    hasMore: currentState?.hasMore ?? false,
    error: currentState?.error ?? null,
    loadMore,
    retry,
  };
}
