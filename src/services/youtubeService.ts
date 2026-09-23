import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import {
  Course,
  Module,
  Lesson,
  YouTubeCourseVideo,
  YouTubeCoursePlaylist,
  YouTubeSearchResultItem,
  YouTubePlaylistItem,
  YouTubeSettings,
} from '../types';

const YOUTUBE_VIDEOS_COL = 'courseYouTubeVideos';
const YOUTUBE_PLAYLISTS_COL = 'courseYouTubePlaylists';
const YOUTUBE_SETTINGS_DOC = 'youtubeSettings/config';
const LESSONS_COL = 'lessons';
const MODULES_COL = 'modules';

// Cache for runtime key
let cachedApiKey: string | null = null;

/**
 * Extract 11-character YouTube video ID from various URL formats or raw ID
 */
export const extractYouTubeVideoId = (input?: string): string | null => {
  if (!input) return null;
  const trimmed = input.trim();
  
  // If already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex match for standard YouTube URLs
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/;
  const match = trimmed.match(regExp);
  return match ? match[1] : null;
};

/**
 * Format standard secure embed URL with player parameters
 */
export const getYouTubeEmbedUrl = (urlOrId?: string): string => {
  const videoId = extractYouTubeVideoId(urlOrId);
  if (!videoId) return '';
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`;
};

/**
 * Parse ISO 8601 duration (e.g., PT1H23M45S or PT45M) into human readable string and minutes
 */
export const parseISODuration = (iso?: string): { formatted: string; minutes: number } => {
  if (!iso) return { formatted: '25 mins', minutes: 25 };
  
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const match = iso.match(regex);
  
  if (!match) return { formatted: '25 mins', minutes: 25 };
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  const totalMinutes = Math.max(1, hours * 60 + minutes + (seconds > 30 ? 1 : 0));
  
  if (hours > 0) {
    return {
      formatted: `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`.trim(),
      minutes: totalMinutes,
    };
  }
  
  return {
    formatted: `${minutes || 1} min${minutes === 1 ? '' : 's'}`,
    minutes: totalMinutes,
  };
};

/**
 * Retrieve active YouTube API Key (from Firestore settings or cached local storage)
 * Server-side environment variable YOUTUBE_API_KEY is preferred via /api/youtube proxy
 */
export const getActiveYouTubeApiKey = async (): Promise<string> => {
  if (cachedApiKey) return cachedApiKey;

  // 1. Check Firestore Settings Doc
  try {
    const settingsDoc = await getDoc(doc(db, YOUTUBE_SETTINGS_DOC));
    if (settingsDoc.exists()) {
      const data = settingsDoc.data() as YouTubeSettings;
      if (data.apiKey && data.apiKey.trim().length > 10) {
        cachedApiKey = data.apiKey.trim();
        return cachedApiKey;
      }
    }
  } catch (err) {
    console.warn('Notice reading YouTube API key from Firestore:', err);
  }

  // 2. Fallback to localStorage for admin convenience in preview
  const localKey = localStorage.getItem('ash_youtube_api_key');
  if (localKey && localKey.trim().length > 10) {
    cachedApiKey = localKey.trim();
    return cachedApiKey;
  }

  return '';
};

/**
 * Save YouTube API Key in Firestore and local storage
 */
export const saveYouTubeApiKey = async (apiKey: string): Promise<void> => {
  const trimmed = apiKey.trim();
  cachedApiKey = trimmed;
  localStorage.setItem('ash_youtube_api_key', trimmed);

  try {
    if (auth.currentUser) {
      await setDoc(
        doc(db, YOUTUBE_SETTINGS_DOC),
        {
          apiKey: trimmed,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn('Error saving YouTube API key to Firestore:', err);
  }
};

/**
 * Generate smart educational YouTube search queries for a course
 */
export const generateCourseSearchQueries = (course: Course): string[] => {
  const cleanTitle = course.title.replace(/^\d+[\.\s\-]+\s*/, '').trim();
  const category = course.category || 'Tutorial';

  return [
    `${cleanTitle} full course`,
    `${cleanTitle} complete tutorial`,
    `${cleanTitle} step by step tutorial for beginners`,
    `${cleanTitle} ${category} masterclass`,
    `${cleanTitle} practical project tutorial`,
  ];
};

/**
 * Search educational YouTube videos using official YouTube Data API v3
 */
export const searchYouTubeVideos = async (params: {
  query: string;
  maxResults?: number;
  regionCode?: string;
  relevanceLanguage?: string;
  customApiKey?: string;
}): Promise<{ items: YouTubeSearchResultItem[]; error?: string }> => {
  const customKey = params.customApiKey || (await getActiveYouTubeApiKey());

  // 1. Check server-side proxy first (API key kept server-side)
  try {
    const q = encodeURIComponent(params.query.trim());
    const max = Math.min(25, params.maxResults || 12);
    const lang = params.relevanceLanguage || 'en';
    const region = params.regionCode || 'US';

    const headers: Record<string, string> = {};
    if (customKey) {
      headers['x-youtube-key'] = customKey;
    }

    const proxyRes = await fetch(
      `/api/youtube/search?q=${q}&maxResults=${max}&relevanceLanguage=${lang}&regionCode=${region}`,
      { headers }
    );

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        return { items: data.items, error: data.error };
      }
      if (data.error && !customKey) {
        return { items: [], error: data.error };
      }
    }
  } catch (err) {
    console.warn('Backend YouTube proxy notice:', err);
  }

  if (!customKey) {
    return {
      items: [],
      error:
        'YouTube Data API key is missing. Please configure YOUTUBE_API_KEY in server secrets or enter a key in Settings.',
    };
  }

  try {
    const q = encodeURIComponent(params.query.trim());
    const max = Math.min(25, params.maxResults || 12);
    const lang = params.relevanceLanguage || 'en';
    const region = params.regionCode || 'US';

    // 1. Call Search endpoint for videos
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&q=${q}&maxResults=${max}&relevanceLanguage=${lang}&regionCode=${region}&key=${customKey}`;

    const res = await fetch(searchUrl);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const message = errData?.error?.message || `YouTube API error: ${res.statusText} (${res.status})`;
      return { items: [], error: message };
    }

    const data = await res.json();
    const searchItems = data.items || [];
    if (searchItems.length === 0) {
      return { items: [] };
    }

    const videoIds = searchItems
      .map((item: any) => item.id?.videoId)
      .filter((id: string | undefined): id is string => Boolean(id));

    // 2. Fetch video details (durations, statistics, status)
    let detailsMap: Record<string, { duration: string; durationMinutes: number; embeddable: boolean }> = {};
    if (videoIds.length > 0) {
      try {
        const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,status&id=${videoIds.join(',')}&key=${customKey}`;
        const detailsRes = await fetch(detailsUrl);
        if (detailsRes.ok) {
          const detailsData = await detailsRes.json();
          (detailsData.items || []).forEach((item: any) => {
            const parsed = parseISODuration(item.contentDetails?.duration);
            detailsMap[item.id] = {
              duration: parsed.formatted,
              durationMinutes: parsed.minutes,
              embeddable: item.status?.embeddable !== false,
            };
          });
        }
      } catch (e) {
        console.warn('Notice fetching video contentDetails:', e);
      }
    }

    // 3. Map to clean SearchResultItem with educational quality filtering
    const results: YouTubeSearchResultItem[] = searchItems
      .filter((item: any) => {
        const title = (item.snippet?.title || '').toLowerCase();
        // Exclude shorts, music clips, and obvious junk
        if (title.includes('#shorts') || title.includes('#short') || title.includes('(shorts)')) {
          return false;
        }
        return true;
      })
      .map((item: any) => {
        const videoId = item.id?.videoId;
        const detail = detailsMap[videoId] || {
          duration: '30 mins',
          durationMinutes: 30,
          embeddable: true,
        };

        return {
          id: videoId,
          type: 'video',
          title: decodeHtmlEntities(item.snippet?.title || 'Educational Lecture'),
          description: decodeHtmlEntities(item.snippet?.description || ''),
          thumbnailUrl:
            item.snippet?.thumbnails?.high?.url ||
            item.snippet?.thumbnails?.medium?.url ||
            item.snippet?.thumbnails?.default?.url ||
            `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          channelTitle: decodeHtmlEntities(item.snippet?.channelTitle || 'Educational Academy'),
          channelId: item.snippet?.channelId,
          publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
          url: `https://www.youtube.com/watch?v=${videoId}`,
          duration: detail.duration,
          durationMinutes: detail.durationMinutes,
          embeddable: detail.embeddable,
        };
      });

    return { items: results };
  } catch (err: any) {
    console.error('Error querying YouTube Search API:', err);
    return {
      items: [],
      error: err?.message || 'Network error while querying YouTube Data API.',
    };
  }
};

/**
 * Search educational YouTube playlists using official YouTube Data API v3
 */
export const searchYouTubePlaylists = async (params: {
  query: string;
  maxResults?: number;
  customApiKey?: string;
}): Promise<{ items: YouTubeSearchResultItem[]; error?: string }> => {
  const customKey = params.customApiKey || (await getActiveYouTubeApiKey());

  // 1. First try server-side proxy
  try {
    const q = encodeURIComponent(params.query.trim());
    const max = Math.min(20, params.maxResults || 10);
    const headers: Record<string, string> = {};
    if (customKey) {
      headers['x-youtube-key'] = customKey;
    }

    const proxyRes = await fetch(`/api/youtube/playlists?q=${q}&maxResults=${max}`, { headers });
    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        return { items: data.items, error: data.error };
      }
      if (data.error && !customKey) {
        return { items: [], error: data.error };
      }
    }
  } catch (err) {
    console.warn('Backend YouTube playlist proxy notice:', err);
  }

  if (!customKey) {
    return {
      items: [],
      error: 'YouTube Data API key is missing. Please configure YOUTUBE_API_KEY in server secrets or add a key in Settings.',
    };
  }

  try {
    const q = encodeURIComponent(params.query.trim());
    const max = Math.min(20, params.maxResults || 10);

    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=playlist&q=${q}&maxResults=${max}&relevanceLanguage=en&key=${customKey}`;

    const res = await fetch(searchUrl);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        items: [],
        error: errData?.error?.message || `YouTube API error: ${res.statusText} (${res.status})`,
      };
    }

    const data = await res.json();
    const searchItems = data.items || [];
    if (searchItems.length === 0) {
      return { items: [] };
    }

    const playlistIds = searchItems
      .map((item: any) => item.id?.playlistId)
      .filter((id: string | undefined): id is string => Boolean(id));

    // Fetch playlist details for item counts
    let countMap: Record<string, number> = {};
    if (playlistIds.length > 0) {
      try {
        const detailsUrl = `https://www.googleapis.com/youtube/v3/playlists?part=contentDetails&id=${playlistIds.join(',')}&key=${customKey}`;
        const detRes = await fetch(detailsUrl);
        if (detRes.ok) {
          const detData = await detRes.json();
          (detData.items || []).forEach((p: any) => {
            countMap[p.id] = p.contentDetails?.itemCount || 0;
          });
        }
      } catch (e) {
        console.warn('Notice fetching playlist contentDetails:', e);
      }
    }

    const results: YouTubeSearchResultItem[] = searchItems.map((item: any) => {
      const playlistId = item.id?.playlistId;
      return {
        id: playlistId,
        type: 'playlist',
        title: decodeHtmlEntities(item.snippet?.title || 'Curriculum Playlist'),
        description: decodeHtmlEntities(item.snippet?.description || ''),
        thumbnailUrl:
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url ||
          '',
        channelTitle: decodeHtmlEntities(item.snippet?.channelTitle || 'Educational Channel'),
        channelId: item.snippet?.channelId,
        publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
        url: `https://www.youtube.com/playlist?list=${playlistId}`,
        itemCount: countMap[playlistId] || 10,
        embeddable: true,
      };
    });

    return { items: results };
  } catch (err: any) {
    console.error('Error searching YouTube playlists:', err);
    return {
      items: [],
      error: err?.message || 'Network error querying playlists.',
    };
  }
};

/**
 * Fetch all video items inside a YouTube playlist
 */
export const getYouTubePlaylistItems = async (
  playlistId: string,
  maxResults = 50,
  customApiKey?: string
): Promise<{ items: YouTubePlaylistItem[]; error?: string }> => {
  const customKey = customApiKey || (await getActiveYouTubeApiKey());

  // 1. Try server-side proxy first
  try {
    const headers: Record<string, string> = {};
    if (customKey) {
      headers['x-youtube-key'] = customKey;
    }

    const proxyRes = await fetch(
      `/api/youtube/playlist-items?playlistId=${encodeURIComponent(playlistId)}&maxResults=${maxResults}`,
      { headers }
    );

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        return { items: data.items, error: data.error };
      }
      if (data.error && !customKey) {
        return { items: [], error: data.error };
      }
    }
  } catch (err) {
    console.warn('Backend YouTube playlist-items proxy notice:', err);
  }

  if (!customKey) {
    return { items: [], error: 'YouTube Data API key is missing. Configure YOUTUBE_API_KEY in server secrets.' };
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=${maxResults}&key=${customKey}`;

    const res = await fetch(url);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        items: [],
        error: errData?.error?.message || `YouTube API error: ${res.statusText}`,
      };
    }

    const data = await res.json();
    const playlistItems: YouTubePlaylistItem[] = (data.items || [])
      .filter((item: any) => {
        const title = item.snippet?.title || '';
        // Skip deleted/private videos in playlist
        return title !== 'Private video' && title !== 'Deleted video' && item.snippet?.resourceId?.videoId;
      })
      .map((item: any, idx: number) => {
        const videoId = item.snippet?.resourceId?.videoId;
        return {
          videoId,
          title: decodeHtmlEntities(item.snippet?.title || `Lesson ${idx + 1}`),
          description: decodeHtmlEntities(item.snippet?.description || ''),
          thumbnailUrl:
            item.snippet?.thumbnails?.high?.url ||
            item.snippet?.thumbnails?.medium?.url ||
            `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          channelTitle: decodeHtmlEntities(item.snippet?.channelTitle || ''),
          position: item.snippet?.position ?? idx,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
          duration: '25 mins',
          durationMinutes: 25,
        };
      });

    return { items: playlistItems };
  } catch (err: any) {
    console.error('Error fetching playlist items:', err);
    return {
      items: [],
      error: err?.message || 'Failed to retrieve videos for this playlist.',
    };
  }
};

/**
 * ==========================================================
 * FIRESTORE PERSISTENCE: VIDEOS, PLAYLISTS & LESSON CREATION
 * ==========================================================
 */

/**
 * Get all saved YouTube videos for a course
 */
export const getCourseYouTubeVideos = async (courseId: string): Promise<YouTubeCourseVideo[]> => {
  try {
    const q = query(collection(db, YOUTUBE_VIDEOS_COL), where('courseId', '==', courseId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as YouTubeCourseVideo);
  } catch (err) {
    console.warn('Notice reading course YouTube videos from Firestore:', err);
    return [];
  }
};

/**
 * Save YouTube video record to Course in Firestore
 */
export const saveYouTubeVideoToCourse = async (
  video: Omit<YouTubeCourseVideo, 'id' | 'addedAt'>
): Promise<YouTubeCourseVideo> => {
  const docId = `${video.courseId}_${video.videoId}`;
  const videoData: YouTubeCourseVideo = {
    ...video,
    id: docId,
    addedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, YOUTUBE_VIDEOS_COL, docId), videoData);
  return videoData;
};

/**
 * Delete a YouTube video reference from course
 */
export const deleteYouTubeVideoFromCourse = async (courseId: string, videoId: string): Promise<void> => {
  const docId = `${courseId}_${videoId}`;
  await deleteDoc(doc(db, YOUTUBE_VIDEOS_COL, docId));
};

/**
 * Get all saved YouTube playlists for a course
 */
export const getCourseYouTubePlaylists = async (courseId: string): Promise<YouTubeCoursePlaylist[]> => {
  try {
    const q = query(collection(db, YOUTUBE_PLAYLISTS_COL), where('courseId', '==', courseId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as YouTubeCoursePlaylist);
  } catch (err) {
    console.warn('Notice reading course YouTube playlists from Firestore:', err);
    return [];
  }
};

/**
 * Save YouTube playlist record to Course in Firestore
 */
export const saveYouTubePlaylistToCourse = async (
  playlist: Omit<YouTubeCoursePlaylist, 'id' | 'addedAt'>
): Promise<YouTubeCoursePlaylist> => {
  const docId = `${playlist.courseId}_${playlist.playlistId}`;
  const playlistData: YouTubeCoursePlaylist = {
    ...playlist,
    id: docId,
    addedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, YOUTUBE_PLAYLISTS_COL, docId), playlistData);
  return playlistData;
};

/**
 * Delete a YouTube playlist reference from course
 */
export const deleteYouTubePlaylistFromCourse = async (courseId: string, playlistId: string): Promise<void> => {
  const docId = `${courseId}_${playlistId}`;
  await deleteDoc(doc(db, YOUTUBE_PLAYLISTS_COL, docId));
};

/**
 * Create a new Lesson in Firestore from a YouTube Video
 */
export const createLessonFromYouTubeVideo = async (params: {
  courseId: string;
  moduleId: string;
  videoId: string;
  videoUrl?: string;
  title: string;
  description: string;
  channelTitle?: string;
  thumbnailUrl?: string;
  durationMinutes?: number;
  required?: boolean;
  order?: number;
}): Promise<Lesson> => {
  const cleanVideoId = extractYouTubeVideoId(params.videoId) || params.videoId;
  const embedUrl = `https://www.youtube.com/embed/${cleanVideoId}`;
  const lessonId = `les-${params.courseId}-${cleanVideoId}-${Date.now().toString(36)}`;

  // Determine lesson order if not provided
  let lessonOrder = params.order;
  if (lessonOrder === undefined) {
    try {
      const q = query(collection(db, LESSONS_COL), where('courseId', '==', params.courseId));
      const snap = await getDocs(q);
      lessonOrder = snap.size + 1;
    } catch {
      lessonOrder = 1;
    }
  }

  const newLesson: Lesson = {
    id: lessonId,
    courseId: params.courseId,
    moduleId: params.moduleId,
    title: params.title,
    description: params.description,
    videoUrl: embedUrl,
    youtubeVideoId: cleanVideoId,
    youtubeChannelTitle: params.channelTitle || 'Atif Skills Hub Instructor',
    youtubeThumbnailUrl: params.thumbnailUrl || `https://img.youtube.com/vi/${cleanVideoId}/hqdefault.jpg`,
    required: params.required !== false,
    order: lessonOrder,
    durationMinutes: params.durationMinutes || 25,
    sourceType: 'youtube',
    notes: `### ${params.title}\n\n**Instructor / Channel**: ${params.channelTitle || 'Educational Partner'}\n\n${params.description}\n\n#### Key Objectives:\n- Master the conceptual foundations presented in this lecture.\n- Complete any practical demonstrations step-by-step.\n- Take notes and prepare for the final certification assessment.`,
  };

  // 1. Save Lesson
  await setDoc(doc(db, LESSONS_COL, lessonId), newLesson);

  // 2. Also register in courseYouTubeVideos as 'added_to_lesson'
  try {
    await saveYouTubeVideoToCourse({
      videoId: cleanVideoId,
      videoUrl: `https://www.youtube.com/watch?v=${cleanVideoId}`,
      title: params.title,
      description: params.description,
      thumbnailUrl: newLesson.youtubeThumbnailUrl || '',
      channelTitle: params.channelTitle || '',
      courseId: params.courseId,
      moduleId: params.moduleId,
      lessonId: lessonId,
      durationMinutes: params.durationMinutes || 25,
      status: 'added_to_lesson',
    });
  } catch (e) {
    console.warn('Notice logging saved youtube video state:', e);
  }

  return newLesson;
};

/**
 * Import a full YouTube Playlist into Course Curriculum (creates Module + Lessons in batch)
 */
export const importPlaylistAsCourseCurriculum = async (params: {
  courseId: string;
  playlistTitle: string;
  playlistDescription?: string;
  targetModuleId?: string; // If creating new module, pass ''
  newModuleName?: string;
  selectedVideos: YouTubePlaylistItem[];
}): Promise<{ moduleId: string; createdLessonsCount: number }> => {
  let targetModuleId = params.targetModuleId;

  // 1. Create or resolve Module
  if (!targetModuleId || targetModuleId === 'new') {
    const newModId = `mod-${params.courseId}-${Date.now().toString(36)}`;
    
    // Count existing modules for order
    let modOrder = 1;
    try {
      const q = query(collection(db, MODULES_COL), where('courseId', '==', params.courseId));
      const snap = await getDocs(q);
      modOrder = snap.size + 1;
    } catch {
      modOrder = 1;
    }

    const newModule: Module = {
      id: newModId,
      courseId: params.courseId,
      title: params.newModuleName || params.playlistTitle || `Module ${modOrder}: Video Curriculum`,
      description: params.playlistDescription || `Structured video curriculum imported from YouTube playlist.`,
      order: modOrder,
    };

    await setDoc(doc(db, MODULES_COL, newModId), newModule);
    targetModuleId = newModId;
  }

  // 2. Query current lessons in course for sequential ordering
  let startOrder = 1;
  try {
    const q = query(collection(db, LESSONS_COL), where('courseId', '==', params.courseId));
    const snap = await getDocs(q);
    startOrder = snap.size + 1;
  } catch {
    startOrder = 1;
  }

  // 3. Create lessons for each selected video
  let count = 0;
  for (const item of params.selectedVideos) {
    const cleanVideoId = extractYouTubeVideoId(item.videoId) || item.videoId;
    const lessonId = `les-${params.courseId}-${cleanVideoId}-${(startOrder + count).toString()}`;
    const embedUrl = `https://www.youtube.com/embed/${cleanVideoId}`;

    const lesson: Lesson = {
      id: lessonId,
      courseId: params.courseId,
      moduleId: targetModuleId,
      title: item.title,
      description: item.description || `Educational video lecture on ${item.title}`,
      videoUrl: embedUrl,
      youtubeVideoId: cleanVideoId,
      youtubeChannelTitle: item.channelTitle || 'Atif Skills Hub Instructor',
      youtubeThumbnailUrl: item.thumbnailUrl || `https://img.youtube.com/vi/${cleanVideoId}/hqdefault.jpg`,
      required: true,
      order: startOrder + count,
      durationMinutes: item.durationMinutes || 25,
      sourceType: 'youtube',
      notes: `### ${item.title}\n\n**Instructor / Channel**: ${item.channelTitle || 'Course Instructor'}\n\n${item.description || 'Watch the lecture carefully, practice along, and complete the coursework to prepare for your certification.'}`,
    };

    await setDoc(doc(db, LESSONS_COL, lessonId), lesson);

    // Register video in course videos collection
    try {
      await saveYouTubeVideoToCourse({
        videoId: cleanVideoId,
        videoUrl: `https://www.youtube.com/watch?v=${cleanVideoId}`,
        title: item.title,
        description: item.description,
        thumbnailUrl: lesson.youtubeThumbnailUrl || '',
        channelTitle: item.channelTitle,
        courseId: params.courseId,
        moduleId: targetModuleId,
        lessonId: lessonId,
        durationMinutes: item.durationMinutes || 25,
        status: 'added_to_lesson',
      });
    } catch {}

    count++;
  }

  return { moduleId: targetModuleId, createdLessonsCount: count };
};

/**
 * Check if a YouTube video ID is already present in a course's lessons or saved video list
 */
export const isVideoInCourse = async (courseId: string, videoId: string): Promise<boolean> => {
  const cleanId = extractYouTubeVideoId(videoId) || videoId;
  try {
    // 1. Check lessons
    const qLessons = query(
      collection(db, LESSONS_COL),
      where('courseId', '==', courseId),
      where('youtubeVideoId', '==', cleanId)
    );
    const snapLessons = await getDocs(qLessons);
    if (!snapLessons.empty) return true;

    // 2. Check saved videos doc
    const docId = `${courseId}_${cleanId}`;
    const snapDoc = await getDoc(doc(db, YOUTUBE_VIDEOS_COL, docId));
    return snapDoc.exists();
  } catch (err) {
    return false;
  }
};

/**
 * HTML entity decoder for clean video titles (e.g. &amp; -> &)
 */
function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec));
}
