import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Film, MoreVertical, Play, SlidersHorizontal, X, Trash2 } from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import { useTenant } from '../../context/TenantContext';
import { formatBytes, formatDuration } from '../../hooks/useVideoValidation';
import useVideoLibraryFilters from '../../hooks/useVideoLibraryFilters';
import SearchBar from '../../components/filters/SearchBar';
import SortDropdown from '../../components/filters/SortDropdown';
import FilterDrawer from '../../components/filters/FilterDrawer';
import FilterChip from '../../components/filters/FilterChip';
import PaginationControls from '../../components/filters/PaginationControls';
import EmptyState from '../../components/feedback/EmptyState';
import { useNotifications } from '../../context/NotificationContext';

const inferCategory = (video) => {
  const text = `${video.title || ''} ${video.fileName || ''}`.toLowerCase();
  if (text.includes('training') || text.includes('onboarding') || text.includes('compliance')) return 'Training';
  if (text.includes('event') || text.includes('all hands') || text.includes('town hall')) return 'Events';
  if (text.includes('match') || text.includes('sport')) return 'Sports';
  if (text.includes('launch') || text.includes('brand') || text.includes('campaign')) return 'Marketing';
  if (text.includes('lecture') || text.includes('course') || text.includes('student')) return 'Education';
  return 'General';
};

const inferReviewState = (video) => {
  if ((video.status || '').toLowerCase() === 'processing') return 'processing';
  const text = `${video.title || ''} ${video.fileName || ''}`.toLowerCase();
  if (text.includes('compliance') || text.includes('sensitive') || text.includes('flag')) return 'flagged';
  return 'safe';
};

const Library = () => {
  const [videos, setVideos] = useState([]);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [videoToDelete, setVideoToDelete] = useState(null);
  const { currentTenant } = useTenant();
  const { notifyWarning } = useNotifications();

  const handleDeleteClick = (e, id) => {
    e.stopPropagation();
    setVideoToDelete(id);
    setOpenMenuId(null);
  };

  const confirmDelete = () => {
    if (!videoToDelete) return;
    const stored = JSON.parse(localStorage.getItem('mockVideos') || '[]');
    const newStored = stored.filter((v) => v.id !== videoToDelete && v.libraryId !== videoToDelete);
    localStorage.setItem('mockVideos', JSON.stringify(newStored));
    setVideos((prev) => prev.filter((v) => v.id !== videoToDelete && v.libraryId !== videoToDelete));
    setVideoToDelete(null);
  };

  useEffect(() => {
    let stored = JSON.parse(localStorage.getItem('mockVideos') || '[]');
    let upgraded = false;

    stored = stored.map((video) => {
      if (video.status === 'Processing' || !video.videoUrl) {
        upgraded = true;
        return {
          ...video,
          status: 'Processed',
          videoUrl: video.videoUrl || 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        };
      }
      return video;
    });

    if (upgraded) {
      localStorage.setItem('mockVideos', JSON.stringify(stored));
    }

    setVideos(stored.filter((video) => !video.tenantId || video.tenantId === currentTenant?.id));
  }, [currentTenant]);

  const normalizedVideos = useMemo(
    () =>
      videos.map((video) => ({
        ...video,
        title: video.title || video.fileName || 'Untitled upload',
        fileName: video.fileName || video.title || 'video.mp4',
        durationSeconds: Math.max(0, Math.round(video.duration || 0)),
        category: video.category || inferCategory(video),
        reviewState: video.reviewState || inferReviewState(video),
      })),
    [videos],
  );

  useEffect(() => {
    const flaggedCount = normalizedVideos.filter((video) => video.reviewState === 'flagged').length;
    if (flaggedCount) {
      notifyWarning('Video flagged', `${flaggedCount} video${flaggedCount > 1 ? 's are' : ' is'} flagged in ${currentTenant?.name}.`, false);
    }
  }, [currentTenant?.name, normalizedVideos, notifyWarning]);

  const {
    filters,
    searchInput,
    setSearchInput,
    toggleStatus,
    setFilter,
    clearAllFilters,
    saveCurrentFilter,
    applySavedFilter,
    removeSavedFilter,
    savedFilters,
    filteredVideos,
    paginatedVideos,
    currentPage,
    totalPages,
    setPage,
    activeChips,
    statusOptions,
    categoryOptions,
    sortOptions,
  } = useVideoLibraryFilters(normalizedVideos);

  if (normalizedVideos.length === 0) {
    return (
      <EmptyState
        title="Video Library"
        description="Manage your uploaded videos. Edit metadata, thumbnails, and privacy settings."
        icon={Film}
        actionTo="/editor/upload"
        actionLabel="Upload video"
        tone="sky"
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <BackButton to="/editor/dashboard" label="Back to Dashboard" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Video Library</h2>
          <p className="mt-1 text-gray-500">Manage uploaded content for {currentTenant?.name}</p>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <SearchBar value={searchInput} onChange={setSearchInput} onClear={() => setSearchInput('')} />
          <div className="flex flex-wrap gap-3">
            <SortDropdown value={filters.sortBy} options={sortOptions} onChange={(value) => setFilter('sort', value)} />
            <button type="button" onClick={() => setDrawerOpen(true)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <SlidersHorizontal size={16} />
              Filters
            </button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {activeChips.map((chip) => (
            <FilterChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
          ))}
          {!activeChips.length ? <span className="text-sm text-slate-500">No active filters</span> : null}
        </div>
      </div>

      {playingVideo ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-800 p-4">
              <h3 className="font-medium text-white">{playingVideo.title}</h3>
              <button type="button" onClick={() => setPlayingVideo(null)} className="text-gray-400 transition-colors hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="aspect-video bg-black">
              <video src={playingVideo.videoUrl} controls autoPlay className="h-full w-full object-contain" />
            </div>
          </div>
        </div>
      ) : null}

      {videoToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete Video</h3>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete this video? This action cannot be undone and it will be permanently removed from your library.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button 
                className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => setVideoToDelete(null)}
              >
                Cancel
              </button>
              <button 
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors shadow-sm"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{filteredVideos.length} results</span>
        <span>{savedFilters.length} saved filters</span>
      </div>

      {paginatedVideos.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
          <h3 className="text-xl font-bold text-slate-900">No videos match these filters</h3>
          <p className="mt-2 text-sm text-slate-500">Try clearing a few chips or broadening your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {paginatedVideos.map((video) => (
            <div key={video.id} className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
              <div
                className="relative aspect-video cursor-pointer bg-gray-100"
                onClick={() => {
                  if (video.videoUrl) setPlayingVideo(video);
                }}
              >
                {video.thumbnail ? (
                  <img src={video.thumbnail} alt={video.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">
                    <Film size={32} />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <button type="button" className="rounded-full bg-white p-3 text-gray-900 transition-transform group-hover:scale-100">
                    <Play size={20} className="fill-current" />
                  </button>
                </div>
                {video.reviewState === 'processing' ? (
                  <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                    <Clock size={12} />
                    Processing
                  </div>
                ) : video.reviewState === 'flagged' ? (
                  <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700">
                    <AlertTriangle size={12} />
                    Flagged
                  </div>
                ) : (
                  <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                    <CheckCircle2 size={12} />
                    Safe
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h3 className="line-clamp-1 font-semibold text-gray-900" title={video.title}>
                    {video.title}
                  </h3>
                  <div className="relative">
                    <button 
                      type="button" 
                      className="text-gray-400 hover:text-gray-600 p-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === video.id ? null : video.id);
                      }}
                    >
                      <MoreVertical size={18} />
                    </button>
                    {openMenuId === video.id && (
                      <div className="absolute right-0 top-full mt-1 w-32 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-10 overflow-hidden">
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                          onClick={(e) => handleDeleteClick(e, video.id)}
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span>{formatBytes(video.size)}</span>
                  <span>{new Date(video.date).toLocaleDateString()}</span>
                  <span>{formatDuration(video.durationSeconds)}</span>
                  <span>{video.category}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        statusOptions={statusOptions}
        categoryOptions={categoryOptions}
        toggleStatus={toggleStatus}
        setFilter={setFilter}
        clearAllFilters={clearAllFilters}
        savedFilters={savedFilters}
        applySavedFilter={applySavedFilter}
        removeSavedFilter={removeSavedFilter}
        saveCurrentFilter={saveCurrentFilter}
      />
    </div>
  );
};

export default Library;
