import React, { useState, useEffect } from 'react';
import { Search, Filter, BookOpen, Clock, Award, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { Course } from '../types';
import { getAllCourses, getStudentEnrollments } from '../services/courseService';
import { COURSE_CATEGORIES } from '../data/coursesData';
import { useAuth } from '../context/AuthContext';

interface CoursesPageProps {
  initialCategory?: string;
  onNavigate: (view: string, param?: string) => void;
}

export const CoursesPage: React.FC<CoursesPageProps> = ({ initialCategory = 'All', onNavigate }) => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const all = await getAllCourses();
      setCourses(all);

      if (user) {
        const enrollments = await getStudentEnrollments(user.uid);
        setEnrolledCourseIds(new Set(enrollments.map((e) => e.courseId)));
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' ||
      course.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesDifficulty =
      selectedDifficulty === 'All' ||
      course.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  return (
    <div id="courses-page" className="min-h-screen bg-slate-950 text-slate-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <p className="text-amber-400 text-xs font-bold uppercase tracking-wider">
            Explore Full Curriculum
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mt-1">
            Data Science & AI Courses ({courses.length})
          </h1>
          <p className="text-slate-400 text-sm mt-3 leading-relaxed">
            Choose from beginner to advanced courses with practical projects, quizzes, and verifiable certificates.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-4 sm:p-6 rounded-2xl shadow-xl mb-8 space-y-4">
          
          {/* Top Row: Search input + Difficulty select */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="input-course-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Python, Machine Learning, SQL, Statistics..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Difficulty Toggle */}
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Level:
              </span>
              {['All', 'Beginner', 'Intermediate', 'Advanced'].map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    selectedDifficulty === diff
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Category Chips Carousel */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {COURSE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold shadow-md shadow-amber-900/20'
                    : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>

        {/* Course Count Display */}
        <div className="flex items-center justify-between mb-6 text-xs text-slate-400">
          <span>Showing <strong className="text-white">{filteredCourses.length}</strong> of {courses.length} courses</span>
          {(searchQuery || selectedCategory !== 'All' || selectedDifficulty !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedDifficulty('All');
              }}
              className="text-amber-400 hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-80 bg-slate-900 rounded-2xl animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 max-w-md mx-auto">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No courses match your search</h3>
            <p className="text-xs text-slate-400 mt-1">Try adjusting keywords or selecting 'All' categories.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedDifficulty('All');
              }}
              className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-semibold"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const isEnrolled = enrolledCourseIds.has(course.id);
              return (
                <div
                  key={course.id}
                  id={`course-card-${course.id}`}
                  onClick={() => onNavigate(isEnrolled ? 'learning' : 'course-detail', course.id)}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-amber-950/20 transition-all duration-300 flex flex-col cursor-pointer group"
                >
                  {/* Thumbnail */}
                  <div className="relative h-44 overflow-hidden bg-slate-950">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-md text-[11px] font-semibold text-amber-400 border border-slate-800">
                      {course.category}
                    </div>
                    <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur px-2 py-0.5 rounded text-[10px] font-medium text-slate-300 border border-slate-800">
                      {course.difficulty}
                    </div>

                    {isEnrolled && (
                      <div className="absolute bottom-3 left-3 bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 backdrop-blur">
                        <CheckCircle2 className="w-3 h-3" /> Enrolled
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3 text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {course.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          Pass {course.passingPercentage || 80}%
                        </span>
                      </div>

                      <span className="text-amber-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        {isEnrolled ? 'Continue' : 'Details'} <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
