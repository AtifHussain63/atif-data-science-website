import React, { useEffect, useState } from 'react';
import { BookOpen, PlayCircle, Clock, Award, ArrowRight } from 'lucide-react';
import { Course } from '../types';
import { useAuth } from '../context/AuthContext';
import { getAllCourses, getStudentEnrollments, getStudentCourseProgress } from '../services/courseService';

interface MyCoursesPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const MyCoursesPage: React.FC<MyCoursesPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [coursesWithProgress, setCoursesWithProgress] = useState<Array<{
    course: Course;
    progressPercentage: number;
    completedCount: number;
    totalCount: number;
    status: 'In Progress' | 'Completed' | 'Not Started';
  }>>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      const [allCourses, enrollments] = await Promise.all([
        getAllCourses(),
        getStudentEnrollments(user.uid),
      ]);

      const courseMap = new Map(allCourses.map((c) => [c.id, c]));

      const list = await Promise.all(
        enrollments.map(async (enr) => {
          const course = courseMap.get(enr.courseId);
          if (!course) return null;

          const progress = await getStudentCourseProgress(user.uid, enr.courseId);
          const completedCount = progress.filter((p) => p.completed).length;
          const totalCount = 4;
          const progressPercentage = Math.min(100, Math.round((completedCount / totalCount) * 100));

          let status: 'In Progress' | 'Completed' | 'Not Started' = 'Not Started';
          if (progressPercentage === 100) status = 'Completed';
          else if (progressPercentage > 0) status = 'In Progress';

          return {
            course,
            progressPercentage,
            completedCount,
            totalCount,
            status,
          };
        })
      );

      setCoursesWithProgress(list.filter(Boolean) as any);
      setLoading(false);
    };

    load();
  }, [user]);

  return (
    <div id="my-courses-page" className="min-h-screen bg-slate-950 text-slate-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-amber-400 text-xs font-bold uppercase tracking-wider">Enrolled Catalog</p>
            <h1 className="text-3xl font-extrabold text-white mt-1">My Enrolled Courses</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">Access your active classrooms and resume learning.</p>
          </div>

          <button
            onClick={() => onNavigate('courses')}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <BookOpen className="w-4 h-4" /> Browse More Courses
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-72 bg-slate-900 rounded-2xl animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : coursesWithProgress.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 max-w-lg mx-auto">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No enrolled courses yet</h3>
            <p className="text-xs text-slate-400 mt-1">Explore our full curriculum of 46 courses to begin.</p>
            <button
              onClick={() => onNavigate('courses')}
              className="mt-5 px-6 py-2.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
            >
              Explore 46 Courses
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coursesWithProgress.map(({ course, progressPercentage, completedCount, totalCount, status }) => (
              <div
                key={course.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                <div className="relative h-44 bg-slate-950 overflow-hidden">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute top-3 left-3 bg-slate-950/90 text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded border border-slate-800">
                    {course.category}
                  </span>
                  <span
                    className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded border ${
                      status === 'Completed'
                        ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-900/90 text-slate-300 border-slate-700'
                    }`}
                  >
                    {status}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white truncate">{course.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{course.description}</p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-1.5 font-semibold">
                      <span className="text-slate-400">{completedCount} of {totalCount} lessons completed</span>
                      <span className="text-amber-400">{progressPercentage}%</span>
                    </div>

                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-400"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>

                    <button
                      onClick={() => onNavigate('learning', course.id)}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <PlayCircle className="w-4 h-4 text-amber-400" /> Continue Classroom
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
