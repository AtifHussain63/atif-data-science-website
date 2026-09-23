import React, { useState, useEffect } from 'react';
import {
  Youtube,
  Search,
  Play,
  Plus,
  Layers,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Sparkles,
  ListPlus,
  Sliders,
  Trash2,
  Edit2,
  X,
  Clock,
  Calendar,
  Eye,
  Key,
  ChevronRight,
  ArrowLeft,
  Check,
  Film,
  FolderPlus,
} from 'lucide-react';
import {
  Course,
  Module,
  Lesson,
  YouTubeSearchResultItem,
  YouTubePlaylistItem,
  YouTubeCourseVideo,
  YouTubeCoursePlaylist,
} from '../../types';
import {
  searchYouTubeVideos,
  searchYouTubePlaylists,
  getYouTubePlaylistItems,
  generateCourseSearchQueries,
  createLessonFromYouTubeVideo,
  importPlaylistAsCourseCurriculum,
  getCourseYouTubeVideos,
  getCourseYouTubePlaylists,
  deleteYouTubeVideoFromCourse,
  saveYouTubeVideoToCourse,
  saveYouTubePlaylistToCourse,
  getActiveYouTubeApiKey,
  saveYouTubeApiKey,
  getYouTubeEmbedUrl,
} from '../../services/youtubeService';
import {
  getCourseFullDetail,
  saveLesson,
  deleteLesson,
  saveModule,
} from '../../services/courseService';
import { useToast } from '../../context/ToastContext';

interface YouTubeCourseManagerProps {
  courses: Course[];
  onRefreshCourses?: () => void;
  onNavigateToLearning?: (courseId: string) => void;
}

export const YouTubeCourseManager: React.FC<YouTubeCourseManagerProps> = ({
  courses,
  onRefreshCourses,
  onNavigateToLearning,
}) => {
  const { success, error, info } = useToast();

  // Navigation State
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseFilter, setCourseFilter] = useState('');
  const [courseStatsMap, setCourseStatsMap] = useState<
    Record<string, { videoCount: number; playlistCount: number; lessonCount: number }>
  >({});

  // Active Course Detail State
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courseSavedVideos, setCourseSavedVideos] = useState<YouTubeCourseVideo[]>([]);
  const [courseSavedPlaylists, setCourseSavedPlaylists] = useState<YouTubeCoursePlaylist[]>([]);
  const [activeTab, setActiveTab] = useState<'videos' | 'playlists' | 'curriculum'>('videos');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [videoResults, setVideoResults] = useState<YouTubeSearchResultItem[]>([]);
  const [playlistResults, setPlaylistResults] = useState<YouTubeSearchResultItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Modals
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [previewVideoTitle, setPreviewVideoTitle] = useState<string>('');

  // Add Lesson Modal
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [selectedVideoForLesson, setSelectedVideoForLesson] = useState<YouTubeSearchResultItem | null>(null);
  const [targetModuleId, setTargetModuleId] = useState<string>('');
  const [newModuleName, setNewModuleName] = useState<string>('');
  const [lessonTitle, setLessonTitle] = useState<string>('');
  const [lessonDescription, setLessonDescription] = useState<string>('');
  const [lessonDurationMinutes, setLessonDurationMinutes] = useState<number>(25);
  const [lessonRequired, setLessonRequired] = useState<boolean>(true);
  const [savingLesson, setSavingLesson] = useState<boolean>(false);

  // Import Playlist Modal
  const [playlistModalOpen, setPlaylistModalOpen] = useState<boolean>(false);
  const [selectedPlaylistForImport, setSelectedPlaylistForImport] = useState<YouTubeSearchResultItem | null>(null);
  const [playlistItems, setPlaylistItems] = useState<YouTubePlaylistItem[]>([]);
  const [selectedItemIndices, setSelectedItemIndices] = useState<Set<number>>(new Set());
  const [loadingPlaylistItems, setLoadingPlaylistItems] = useState<boolean>(false);
  const [playlistTargetModule, setPlaylistTargetModule] = useState<string>('new');
  const [customPlaylistModuleName, setCustomPlaylistModuleName] = useState<string>('');
  const [importingPlaylist, setImportingPlaylist] = useState<boolean>(false);

  // API Key Settings Modal
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);

  // Load API key status & overview stats on mount
  useEffect(() => {
    const checkKey = async () => {
      const key = await getActiveYouTubeApiKey();
      setHasApiKey(Boolean(key && key.length > 10));
      if (key) setApiKeyInput(key);
    };
    checkKey();
    loadAllCourseStats();
  }, [courses]);

  // Load summary stats for all courses
  const loadAllCourseStats = async () => {
    const stats: Record<string, { videoCount: number; playlistCount: number; lessonCount: number }> = {};
    for (const c of courses) {
      try {
        const [vids, plists, detail] = await Promise.all([
          getCourseYouTubeVideos(c.id),
          getCourseYouTubePlaylists(c.id),
          getCourseFullDetail(c.id),
        ]);
        stats[c.id] = {
          videoCount: vids.length,
          playlistCount: plists.length,
          lessonCount: detail.lessons.length,
        };
      } catch {
        stats[c.id] = { videoCount: 0, playlistCount: 0, lessonCount: 0 };
      }
    }
    setCourseStatsMap(stats);
  };

  // Load selected course detail
  const loadCourseData = async (course: Course) => {
    setSelectedCourse(course);
    setSearching(true);
    setSearchError(null);

    try {
      const [detail, savedVids, savedPlists] = await Promise.all([
        getCourseFullDetail(course.id),
        getCourseYouTubeVideos(course.id),
        getCourseYouTubePlaylists(course.id),
      ]);

      setModules(detail.modules);
      setLessons(detail.lessons);
      setCourseSavedVideos(savedVids);
      setCourseSavedPlaylists(savedPlists);

      // Set default target module
      if (detail.modules.length > 0) {
        setTargetModuleId(detail.modules[0].id);
      }

      // Generate prefilled educational search
      const queries = generateCourseSearchQueries(course);
      const initialQuery = queries[0];
      setSearchQuery(initialQuery);

      // Execute initial search
      await executeYouTubeSearch(initialQuery);
    } catch (err: any) {
      console.error('Error loading course data:', err);
      setSearchError('Could not load course curriculum.');
    } finally {
      setSearching(false);
    }
  };

  // Execute Search for Videos & Playlists
  const executeYouTubeSearch = async (queryToSearch: string) => {
    if (!queryToSearch.trim()) return;
    setSearching(true);
    setSearchError(null);

    const [vRes, pRes] = await Promise.all([
      searchYouTubeVideos({ query: queryToSearch, maxResults: 12 }),
      searchYouTubePlaylists({ query: queryToSearch, maxResults: 8 }),
    ]);

    if (vRes.error) {
      setSearchError(vRes.error);
    } else {
      setVideoResults(vRes.items);
    }

    if (!pRes.error) {
      setPlaylistResults(pRes.items);
    }

    setSearching(false);
  };

  // Check if video is already attached to this course
  const isVideoAlreadyInCourse = (videoId: string): boolean => {
    if (!videoId) return false;
    const cleanId = videoId.trim();
    // Check in lessons
    const inLessons = lessons.some(
      (l) => l.youtubeVideoId === cleanId || (l.videoUrl && l.videoUrl.includes(cleanId))
    );
    if (inLessons) return true;

    // Check in saved course videos
    return courseSavedVideos.some((v) => v.videoId === cleanId);
  };

  // Save Video directly to Course Repository
  const handleSaveVideoToCourse = async (video: YouTubeSearchResultItem) => {
    if (!selectedCourse) return;
    try {
      await saveYouTubeVideoToCourse({
        videoId: video.id,
        videoUrl: video.url,
        title: video.title,
        description: video.description,
        thumbnailUrl: video.thumbnailUrl,
        channelTitle: video.channelTitle,
        courseId: selectedCourse.id,
        duration: video.duration,
        durationMinutes: video.durationMinutes || 25,
        status: 'saved',
      });

      const updated = await getCourseYouTubeVideos(selectedCourse.id);
      setCourseSavedVideos(updated);
      success('Video Saved to Course', `Added "${video.title}" to ${selectedCourse.title} repository.`);
    } catch (err) {
      error('Failed to Save Video', 'Could not save video to course repository.');
    }
  };

  // Open "Add as Lesson" modal
  const openAddAsLessonModal = (video: YouTubeSearchResultItem) => {
    setSelectedVideoForLesson(video);
    setLessonTitle(video.title);
    setLessonDescription(video.description || `Educational lecture: ${video.title}`);
    setLessonDurationMinutes(video.durationMinutes || 25);
    setLessonRequired(true);
    if (modules.length > 0) {
      setTargetModuleId(modules[0].id);
    } else {
      setTargetModuleId('new');
      setNewModuleName(`Module 1: ${selectedCourse?.title || 'Core Fundamentals'}`);
    }
    setLessonModalOpen(true);
  };

  // Save Lesson from YouTube Video
  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !selectedVideoForLesson) return;
    if (!lessonTitle.trim()) {
      error('Validation', 'Lesson Title is required.');
      return;
    }

    try {
      setSavingLesson(true);
      let activeModId = targetModuleId;

      // Create new module if needed
      if (activeModId === 'new') {
        const newMod: Module = {
          id: `mod-${selectedCourse.id}-${Date.now().toString(36)}`,
          courseId: selectedCourse.id,
          title: newModuleName.trim() || `Module ${modules.length + 1}: Video Lectures`,
          order: modules.length + 1,
        };
        await saveModule(newMod);
        setModules((prev) => [...prev, newMod]);
        activeModId = newMod.id;
      }

      const created = await createLessonFromYouTubeVideo({
        courseId: selectedCourse.id,
        moduleId: activeModId,
        videoId: selectedVideoForLesson.id,
        videoUrl: selectedVideoForLesson.url,
        title: lessonTitle.trim(),
        description: lessonDescription.trim(),
        channelTitle: selectedVideoForLesson.channelTitle,
        thumbnailUrl: selectedVideoForLesson.thumbnailUrl,
        durationMinutes: lessonDurationMinutes,
        required: lessonRequired,
      });

      setLessons((prev) => [...prev, created]);

      // Refresh saved videos list
      const updatedSaved = await getCourseYouTubeVideos(selectedCourse.id);
      setCourseSavedVideos(updatedSaved);

      // Update overview counts
      setCourseStatsMap((prev) => ({
        ...prev,
        [selectedCourse.id]: {
          ...(prev[selectedCourse.id] || { videoCount: 0, playlistCount: 0, lessonCount: 0 }),
          lessonCount: (prev[selectedCourse.id]?.lessonCount || 0) + 1,
          videoCount: updatedSaved.length,
        },
      }));

      setLessonModalOpen(false);
      success('Lesson Created & Published!', `Added "${created.title}" to ${selectedCourse.title}.`);
    } catch (err: any) {
      console.error(err);
      error('Failed to Create Lesson', err?.message || 'Could not publish lesson.');
    } finally {
      setSavingLesson(false);
    }
  };

  // Open Playlist Import Modal
  const openPlaylistImportModal = async (playlist: YouTubeSearchResultItem) => {
    setSelectedPlaylistForImport(playlist);
    setCustomPlaylistModuleName(playlist.title);
    setPlaylistModalOpen(true);
    setLoadingPlaylistItems(true);

    const res = await getYouTubePlaylistItems(playlist.id);
    if (res.error) {
      error('Playlist Error', res.error);
      setPlaylistItems([]);
    } else {
      setPlaylistItems(res.items);
      // Select all by default
      setSelectedItemIndices(new Set(res.items.map((_, i) => i)));
    }
    setLoadingPlaylistItems(false);
  };

  // Toggle selection for playlist item
  const togglePlaylistItemSelect = (index: number) => {
    setSelectedItemIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Import Selected Playlist items as sequential course lessons
  const handleImportPlaylist = async () => {
    if (!selectedCourse || !selectedPlaylistForImport) return;
    const selectedVideos = playlistItems.filter((_, idx) => selectedItemIndices.has(idx));

    if (selectedVideos.length === 0) {
      error('Selection Required', 'Please select at least 1 video from the playlist to import.');
      return;
    }

    try {
      setImportingPlaylist(true);

      const result = await importPlaylistAsCourseCurriculum({
        courseId: selectedCourse.id,
        playlistTitle: selectedPlaylistForImport.title,
        playlistDescription: selectedPlaylistForImport.description,
        targetModuleId: playlistTargetModule === 'new' ? '' : playlistTargetModule,
        newModuleName: customPlaylistModuleName || selectedPlaylistForImport.title,
        selectedVideos,
      });

      // Save playlist reference
      await saveYouTubePlaylistToCourse({
        playlistId: selectedPlaylistForImport.id,
        playlistUrl: selectedPlaylistForImport.url,
        title: selectedPlaylistForImport.title,
        description: selectedPlaylistForImport.description,
        thumbnailUrl: selectedPlaylistForImport.thumbnailUrl,
        channelTitle: selectedPlaylistForImport.channelTitle,
        courseId: selectedCourse.id,
        itemCount: selectedVideos.length,
      });

      // Reload course details
      const detail = await getCourseFullDetail(selectedCourse.id);
      const savedPlists = await getCourseYouTubePlaylists(selectedCourse.id);
      const savedVids = await getCourseYouTubeVideos(selectedCourse.id);

      setModules(detail.modules);
      setLessons(detail.lessons);
      setCourseSavedPlaylists(savedPlists);
      setCourseSavedVideos(savedVids);

      setPlaylistModalOpen(false);
      success(
        'Playlist Imported Successfully!',
        `Created ${result.createdLessonsCount} structured lessons in ${selectedCourse.title}.`
      );
    } catch (err: any) {
      console.error(err);
      error('Import Failed', err?.message || 'Could not import playlist videos.');
    } finally {
      setImportingPlaylist(false);
    }
  };

  // Save API Key
  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) {
      error('Validation', 'Please enter a valid YouTube Data API key.');
      return;
    }
    await saveYouTubeApiKey(apiKeyInput.trim());
    setHasApiKey(true);
    setApiKeyModalOpen(false);
    success('API Key Saved', 'YouTube Data API key is active and ready for searches.');
    if (selectedCourse && searchQuery) {
      executeYouTubeSearch(searchQuery);
    }
  };

  // Delete Lesson
  const handleDeleteLesson = async (lessonId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete lesson "${title}"?`)) return;
    try {
      await deleteLesson(lessonId);
      setLessons((prev) => prev.filter((l) => l.id !== lessonId));
      success('Lesson Removed', `Deleted "${title}".`);
    } catch (err) {
      error('Error', 'Could not delete lesson.');
    }
  };

  const filteredCourses = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(courseFilter.toLowerCase()) ||
      c.category.toLowerCase().includes(courseFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* VIEW 1: COURSES CATALOG & YOUTUBE STATUS OVERVIEW */}
      {!selectedCourse ? (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-red-950/70 via-slate-900 to-amber-950/40 border border-red-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-600/10 via-transparent to-transparent pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center font-bold shadow-inner">
                  <Youtube className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30">
                      AUTOMATED YOUTUBE COURSE SYSTEM
                    </span>
                    <span className="text-xs text-slate-400">YouTube Data API v3</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                    YouTube Course Content & Video Engine
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
                    Automatically discover high-quality educational videos and full playlists for every existing course.
                    Convert YouTube lectures into structured lessons and curricula with one click.
                  </p>
                </div>
              </div>

              {/* API Key Status & Actions */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setApiKeyModalOpen(true)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                    hasApiKey
                      ? 'bg-slate-900 border-emerald-500/30 text-emerald-400 hover:bg-slate-800'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  {hasApiKey ? 'YouTube API Key Active ✓' : 'Configure YouTube API Key'}
                </button>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                placeholder="Filter courses by title, category, or level..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50"
              />
            </div>
            <div className="text-xs text-slate-400">
              Showing <span className="font-bold text-white">{filteredCourses.length}</span> of{' '}
              <span className="font-bold text-white">{courses.length}</span> existing courses
            </div>
          </div>

          {/* Courses Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-4">Course Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4 text-center">Lessons</th>
                    <th className="p-4 text-center">YouTube Videos</th>
                    <th className="p-4 text-center">Playlists</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredCourses.map((course) => {
                    const stats = courseStatsMap[course.id] || {
                      videoCount: 0,
                      playlistCount: 0,
                      lessonCount: 0,
                    };
                    return (
                      <tr key={course.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-4 font-bold text-white flex items-center gap-3">
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-11 h-11 rounded-xl object-cover bg-slate-950 shrink-0 border border-slate-800"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0 max-w-sm">
                            <p className="truncate text-white font-bold">{course.title}</p>
                            <span className="text-[11px] text-slate-400 font-normal">
                              {course.difficulty} • {course.duration}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg font-medium text-[11px]">
                            {course.category}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-mono font-bold text-white">{stats.lessonCount}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20">
                            <Youtube className="w-3 h-3" /> {stats.videoCount}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-mono font-bold text-slate-300">
                            {stats.playlistCount}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            id={`btn-find-youtube-${course.id}`}
                            onClick={() => loadCourseData(course)}
                            className="px-3.5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 ml-auto shadow-md shadow-red-950/30 transition-all cursor-pointer"
                          >
                            <Youtube className="w-4 h-4" /> Find YouTube Videos
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW 2: ACTIVE COURSE YOUTUBE EXPLORER & CURRICULUM WORKSPACE */
        <div className="space-y-6">
          {/* Top Return Header */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setSelectedCourse(null);
                  loadAllCourseStats();
                }}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> All Courses
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    {selectedCourse.category}
                  </span>
                  <span className="text-xs text-slate-400">{selectedCourse.difficulty} Level</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                  {selectedCourse.title}
                </h1>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setApiKeyModalOpen(true)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs border border-slate-700"
                title="API Key Settings"
              >
                <Key className="w-4 h-4 text-amber-400" />
              </button>
              {onNavigateToLearning && (
                <button
                  onClick={() => onNavigateToLearning(selectedCourse.id)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" /> Open Course Player
                </button>
              )}
            </div>
          </div>

          {/* Smart Query Generator Chips */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Smart Educational Query Presets
              </span>
              <span className="text-[11px] text-slate-400">Click any keyword preset to auto-search</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {generateCourseSearchQueries(selectedCourse).map((queryPreset) => {
                const isCurrent = searchQuery === queryPreset;
                return (
                  <button
                    key={queryPreset}
                    onClick={() => {
                      setSearchQuery(queryPreset);
                      executeYouTubeSearch(queryPreset);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isCurrent
                        ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                    }`}
                  >
                    <Search className="w-3 h-3 text-red-400" /> {queryPreset}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeYouTubeSearch(searchQuery);
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search YouTube for educational tutorials, lectures, or playlists..."
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-6 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 cursor-pointer"
            >
              {searching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" /> Search YouTube
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => executeYouTubeSearch(searchQuery)}
              disabled={searching}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${searching ? 'animate-spin' : ''}`} /> Search Again
            </button>
          </form>

          {/* Error Message if any */}
          {searchError && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-between text-xs text-red-300">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{searchError}</span>
              </div>
              <button
                onClick={() => setApiKeyModalOpen(true)}
                className="px-3 py-1 bg-red-600 text-white font-bold rounded-lg text-[11px] underline"
              >
                Set API Key
              </button>
            </div>
          )}

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            {[
              { id: 'videos', label: `Educational Videos (${videoResults.length})`, icon: Film },
              { id: 'playlists', label: `Playlists (${playlistResults.length})`, icon: Layers },
              {
                id: 'curriculum',
                label: `Course Curriculum & Lessons (${lessons.length})`,
                icon: BookOpen,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-red-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: VIDEOS SEARCH RESULTS */}
          {activeTab === 'videos' && (
            <div className="space-y-4">
              {searching ? (
                <div className="py-16 text-center text-slate-400 space-y-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-red-500 mx-auto" />
                  <p className="text-xs">Finding and filtering high-quality educational videos...</p>
                </div>
              ) : videoResults.length === 0 ? (
                <div className="py-16 text-center text-slate-400 bg-slate-900/50 border border-slate-800 rounded-3xl space-y-3">
                  <Film className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-white">No YouTube videos found for this search</p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Try using the preset query buttons above or adjust your search keywords.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {videoResults.map((video) => {
                    const alreadyAdded = isVideoAlreadyInCourse(video.id);

                    return (
                      <div
                        key={video.id}
                        className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden flex flex-col hover:border-slate-700 transition-all shadow-lg group"
                      >
                        {/* Thumbnail Container */}
                        <div className="relative aspect-video bg-slate-950 overflow-hidden">
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                          {/* Duration Badge */}
                          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 backdrop-blur text-white text-[10px] font-mono font-bold rounded">
                            {video.duration || 'Video Lecture'}
                          </div>

                          {/* Quick Preview Hover Overlay */}
                          <button
                            onClick={() => {
                              setPreviewVideoUrl(video.url);
                              setPreviewVideoTitle(video.title);
                            }}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold backdrop-blur-[2px]"
                          >
                            <Play className="w-5 h-5 fill-white" /> Preview Video
                          </button>
                        </div>

                        {/* Card Body */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div className="space-y-1.5">
                            <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug">
                              {video.title}
                            </h3>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                              <span className="truncate">{video.channelTitle}</span>
                              <span>•</span>
                              <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
                            </p>
                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                              {video.description || 'Comprehensive educational tutorial.'}
                            </p>
                          </div>

                          {/* Status & Actions */}
                          <div className="pt-3 border-t border-slate-800/80 space-y-2">
                            {alreadyAdded ? (
                              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] font-semibold text-emerald-400 flex items-center justify-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" /> This video is already added to this course.
                              </div>
                            ) : null}

                            <div className="grid grid-cols-3 gap-1.5">
                              <button
                                onClick={() => {
                                  setPreviewVideoUrl(video.url);
                                  setPreviewVideoTitle(video.title);
                                }}
                                className="py-2 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 border border-slate-700"
                              >
                                <Eye className="w-3.5 h-3.5 text-amber-400" /> Preview
                              </button>

                              <button
                                onClick={() => handleSaveVideoToCourse(video)}
                                disabled={alreadyAdded}
                                className="py-2 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 border border-slate-700"
                              >
                                <Plus className="w-3.5 h-3.5 text-blue-400" /> Add to Course
                              </button>

                              <button
                                onClick={() => openAddAsLessonModal(video)}
                                disabled={alreadyAdded}
                                className="py-2 px-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm"
                              >
                                <ListPlus className="w-3.5 h-3.5" /> Add as Lesson
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PLAYLISTS SEARCH RESULTS */}
          {activeTab === 'playlists' && (
            <div className="space-y-4">
              {searching ? (
                <div className="py-16 text-center text-slate-400 space-y-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-red-500 mx-auto" />
                  <p className="text-xs">Searching relevant YouTube playlists...</p>
                </div>
              ) : playlistResults.length === 0 ? (
                <div className="py-16 text-center text-slate-400 bg-slate-900/50 border border-slate-800 rounded-3xl space-y-3">
                  <Layers className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-white">No playlists found for this query</p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Try searching for "[Course Name] playlist" or "[Topic] full course".
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {playlistResults.map((playlist) => (
                    <div
                      key={playlist.id}
                      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 hover:border-slate-700 transition-all shadow-lg"
                    >
                      <div className="w-full sm:w-44 aspect-video bg-slate-950 rounded-xl overflow-hidden relative shrink-0 border border-slate-800">
                        {playlist.thumbnailUrl ? (
                          <img
                            src={playlist.thumbnailUrl}
                            alt={playlist.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600">
                            <Layers className="w-8 h-8" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/80 backdrop-blur text-amber-400 text-[10px] font-mono font-bold rounded flex items-center gap-1">
                          <Layers className="w-3 h-3" /> {playlist.itemCount || 'Series'}
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col justify-between space-y-3 min-w-0">
                        <div className="space-y-1">
                          <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2">
                            {playlist.title}
                          </h3>
                          <p className="text-[11px] text-slate-400 truncate">
                            By {playlist.channelTitle}
                          </p>
                          <p className="text-[11px] text-slate-500 line-clamp-2">
                            {playlist.description || 'Curated educational playlist.'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                          <button
                            onClick={() => openPlaylistImportModal(playlist)}
                            className="flex-1 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-950/40"
                          >
                            <FolderPlus className="w-3.5 h-3.5" /> Import Playlist into Curriculum
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COURSE CURRICULUM & LESSONS MANAGER */}
          {activeTab === 'curriculum' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white">Course Curriculum Structure</h3>
                  <p className="text-xs text-slate-400">
                    {modules.length} Modules • {lessons.length} Total Lessons in {selectedCourse.title}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const newModTitle = prompt('Enter New Module Title:', `Module ${modules.length + 1}: Applied Topics`);
                      if (newModTitle && newModTitle.trim()) {
                        const newMod: Module = {
                          id: `mod-${selectedCourse.id}-${Date.now().toString(36)}`,
                          courseId: selectedCourse.id,
                          title: newModTitle.trim(),
                          order: modules.length + 1,
                        };
                        saveModule(newMod).then(() => {
                          setModules((prev) => [...prev, newMod]);
                          success('Module Added', `Created ${newMod.title}`);
                        });
                      }
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" /> New Module
                  </button>
                </div>
              </div>

              {/* Modules & Lessons List */}
              <div className="space-y-4">
                {modules.map((mod, modIdx) => {
                  const modLessons = lessons.filter((l) => l.moduleId === mod.id);

                  return (
                    <div
                      key={mod.id}
                      className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden space-y-3 p-4 shadow-md"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold flex items-center justify-center">
                            {modIdx + 1}
                          </span>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-white">{mod.title}</h4>
                            {mod.description && (
                              <p className="text-[11px] text-slate-400">{mod.description}</p>
                            )}
                          </div>
                        </div>

                        <span className="text-[11px] text-slate-400 font-mono">
                          {modLessons.length} lessons
                        </span>
                      </div>

                      {/* Lessons under this module */}
                      <div className="space-y-2">
                        {modLessons.length === 0 ? (
                          <p className="text-xs text-slate-500 italic py-2">
                            No lessons added to this module yet. Use "Find YouTube Videos" to add lectures.
                          </p>
                        ) : (
                          modLessons.map((les, lesIdx) => (
                            <div
                              key={les.id}
                              className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {les.youtubeThumbnailUrl ? (
                                  <img
                                    src={les.youtubeThumbnailUrl}
                                    alt={les.title}
                                    className="w-10 h-7 rounded object-cover shrink-0 border border-slate-800"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-10 h-7 rounded bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                                    <Film className="w-3.5 h-3.5" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="font-bold text-white truncate">
                                    {lesIdx + 1}. {les.title}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-mono">
                                    {les.durationMinutes || 25} mins • {les.youtubeChannelTitle || 'Atif Skills Hub'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {les.videoUrl && (
                                  <button
                                    onClick={() => {
                                      setPreviewVideoUrl(les.videoUrl || '');
                                      setPreviewVideoTitle(les.title);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-red-400 bg-slate-800 hover:bg-slate-700 rounded-lg"
                                    title="Preview Video"
                                  >
                                    <Play className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteLesson(les.id, les.title)}
                                  className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700 rounded-lg"
                                  title="Delete Lesson"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          MODAL 1: ADD AS LESSON MODAL
         ========================================================= */}
      {lessonModalOpen && selectedVideoForLesson && selectedCourse && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Youtube className="w-5 h-5 text-red-500" />
                <h3 className="text-base font-bold text-white">Add Video as Lesson</h3>
              </div>
              <button
                onClick={() => setLessonModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLesson} className="space-y-4 text-xs">
              {/* Course Display */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Course
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedCourse.title}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-bold"
                />
              </div>

              {/* Target Module */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Target Module
                </label>
                <select
                  value={targetModuleId}
                  onChange={(e) => setTargetModuleId(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-red-500"
                >
                  {modules.map((mod, idx) => (
                    <option key={mod.id} value={mod.id}>
                      Module {idx + 1}: {mod.title}
                    </option>
                  ))}
                  <option value="new">+ Create New Module</option>
                </select>
              </div>

              {/* If creating new module */}
              {targetModuleId === 'new' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    New Module Title
                  </label>
                  <input
                    type="text"
                    value={newModuleName}
                    onChange={(e) => setNewModuleName(e.target.value)}
                    placeholder="e.g. Module 3: Advanced Deep Dive"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    required
                  />
                </div>
              )}

              {/* Lesson Title */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Lesson Title
                </label>
                <input
                  type="text"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              {/* Lesson Description */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Description / Overview
                </label>
                <textarea
                  value={lessonDescription}
                  onChange={(e) => setLessonDescription(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Duration & Required */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={360}
                    value={lessonDurationMinutes}
                    onChange={(e) => setLessonDurationMinutes(parseInt(e.target.value) || 25)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Requirement
                  </label>
                  <label className="flex items-center gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lessonRequired}
                      onChange={(e) => setLessonRequired(e.target.checked)}
                      className="accent-red-500"
                    />
                    <span>Required for Certificate</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setLessonModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLesson}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-red-950/40"
                >
                  {savingLesson ? 'Creating Lesson...' : 'Save Lesson & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 2: IMPORT PLAYLIST MODAL
         ========================================================= */}
      {playlistModalOpen && selectedPlaylistForImport && selectedCourse && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-red-500" />
                <h3 className="text-base font-bold text-white">Import Playlist as Course Lessons</h3>
              </div>
              <button
                onClick={() => setPlaylistModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 text-xs">
              {/* Module Destination Selector */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Destination Module
                  </label>
                  <select
                    value={playlistTargetModule}
                    onChange={(e) => setPlaylistTargetModule(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="new">+ Create New Module Named After Playlist</option>
                    {modules.map((mod, idx) => (
                      <option key={mod.id} value={mod.id}>
                        Add to Module {idx + 1}: {mod.title}
                      </option>
                    ))}
                  </select>
                </div>

                {playlistTargetModule === 'new' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Module Title
                    </label>
                    <input
                      type="text"
                      value={customPlaylistModuleName}
                      onChange={(e) => setCustomPlaylistModuleName(e.target.value)}
                      className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white"
                      placeholder="e.g. Complete Video Series"
                    />
                  </div>
                )}
              </div>

              {/* Videos Selection List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">
                    Select Videos to Import ({selectedItemIndices.size} selected)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedItemIndices(new Set(playlistItems.map((_, i) => i)))}
                      className="text-red-400 underline font-semibold text-[11px]"
                    >
                      Select All
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedItemIndices(new Set())}
                      className="text-slate-400 underline font-semibold text-[11px]"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {loadingPlaylistItems ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-red-500 mx-auto" />
                    <p>Loading playlist videos...</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/80 max-h-72 overflow-y-auto border border-slate-800 rounded-2xl p-2 bg-slate-950/60">
                    {playlistItems.map((item, idx) => {
                      const isSelected = selectedItemIndices.has(idx);
                      return (
                        <div
                          key={item.videoId}
                          onClick={() => togglePlaylistItemSelect(idx)}
                          className={`p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                            isSelected ? 'bg-red-500/10 border border-red-500/30' : 'hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => togglePlaylistItemSelect(idx)}
                              className="accent-red-500 shrink-0"
                            />
                            <span className="text-[11px] font-mono text-slate-500 w-5 text-center">
                              {idx + 1}
                            </span>
                            <img
                              src={item.thumbnailUrl}
                              alt={item.title}
                              className="w-10 h-7 rounded object-cover shrink-0 border border-slate-800"
                              referrerPolicy="no-referrer"
                            />
                            <span className="font-bold text-white truncate text-xs">{item.title}</span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewVideoUrl(item.videoUrl);
                              setPreviewVideoTitle(item.title);
                            }}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setPlaylistModalOpen(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportPlaylist}
                disabled={importingPlaylist || selectedItemIndices.size === 0}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-red-950/40"
              >
                {importingPlaylist
                  ? 'Importing Curriculum...'
                  : `Import ${selectedItemIndices.size} Lessons`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 3: INTERACTIVE VIDEO PREVIEW EMBED
         ========================================================= */}
      {previewVideoUrl && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 min-w-0 pr-4">
                <Youtube className="w-5 h-5 text-red-500 shrink-0" />
                <h3 className="text-sm font-bold text-white truncate">{previewVideoTitle}</h3>
              </div>
              <button
                onClick={() => setPreviewVideoUrl(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
              <iframe
                src={getYouTubeEmbedUrl(previewVideoUrl)}
                title={previewVideoTitle}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="text-[11px] font-mono">Embedded official YouTube player</span>
              <a
                href={previewVideoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-red-400 hover:underline flex items-center gap-1"
              >
                Watch on YouTube <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 4: YOUTUBE DATA API KEY SETTINGS
         ========================================================= */}
      {apiKeyModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">YouTube Data API Configuration</h3>
              </div>
              <button
                onClick={() => setApiKeyModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveApiKey} className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-slate-400 leading-relaxed text-[11px]">
                <p>
                  To search YouTube for educational content and playlists automatically, enter your{' '}
                  <strong className="text-white">Google YouTube Data API v3 key</strong>.
                </p>
                <p>
                  1. Visit Google Cloud Console & enable <strong>YouTube Data API v3</strong>.<br />
                  2. Create an API Key in Credentials and paste it below.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  YouTube Data API Key
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setApiKeyModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
                >
                  Save API Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
