import { useState, useEffect, useCallback } from 'react';

const useInfiniteScroll = (fetchMore, hasMore) => {
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isFetching) return;
    fetchMoreData();
  }, [isFetching]);

  const handleScroll = () => {
    if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || isFetching) return;
    if (hasMore) {
      setIsFetching(true);
    }
  };

  const fetchMoreData = useCallback(async () => {
    await fetchMore();
    setIsFetching(false);
  }, [fetchMore]);

  return [isFetching, setIsFetching];
};

export default useInfiniteScroll; 