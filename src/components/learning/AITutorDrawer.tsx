import React, { useState } from 'react';
import { Sparkles, Send, X, Bot, BookOpen, Lightbulb, Code2, AlertCircle } from 'lucide-react';
import { Course, Lesson } from '../../types';

interface AITutorDrawerProps {
  course: Course;
  lesson?: Lesson;
  studentName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  role: 'student' | 'tutor';
  content: string;
  timestamp: string;
}

export const AITutorDrawer: React.FC<AITutorDrawerProps> = ({
  course,
  lesson,
  studentName,
  isOpen,
  onClose,
}) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'tutor',
      content: `Hello ${studentName || 'Student'}! I am your AI Academic Tutor for "${course.title}". Ask me any conceptual question, request a code example, or ask for clarification on "${lesson?.title || 'the current topic'}".`,
      timestamp: 'Just now',
    },
  ]);

  if (!isOpen) return null;

  const handleAsk = async (customPrompt?: string) => {
    const q = (customPrompt || question).trim();
    if (!q || loading) return;

    const studentMsg: ChatMessage = {
      role: 'student',
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, studentMsg]);
    if (!customPrompt) setQuestion('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          courseTitle: course.title,
          lessonTitle: lesson?.title || 'General Coursework',
          studentName: studentName || 'Student',
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      const tutorMsg: ChatMessage = {
        role: 'tutor',
        content: data.answer || 'I could not generate an answer right now. Please review the lesson notes.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, tutorMsg]);
    } catch (err: any) {
      console.error('Error contacting AI Tutor API:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'tutor',
          content:
            'Notice: The AI Tutor is temporarily unable to reach the server. Please check your internet connection or verify that GEMINI_API_KEY is configured in your project secrets.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'Explain the core concept in simple terms',
    'Provide a practical code example for this lesson',
    'What key concepts are asked in the 50-MCQ assessment?',
  ];

  return (
    <div
      id="ai-tutor-drawer"
      className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col transition-all duration-300"
    >
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow">
            <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              AI Academic Tutor
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded">
                Gemini 2.5
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 truncate max-w-[240px]">
              {lesson ? lesson.title : course.title}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title="Close AI Tutor"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-2.5 ${m.role === 'student' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'tutor' && (
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-amber-400" />
              </div>
            )}
            <div
              className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed whitespace-pre-line shadow-sm ${
                m.role === 'student'
                  ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none font-sans'
              }`}
            >
              {m.content}
              <span
                className={`block text-[9px] mt-1.5 ${
                  m.role === 'student' ? 'text-slate-900/70 text-right' : 'text-slate-500'
                }`}
              >
                {m.timestamp}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5 items-center text-slate-400">
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-2 text-slate-300">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>AI Tutor is formulating your answer...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-3 border-t border-slate-900 bg-slate-950/70 space-y-1.5">
        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
          <Lightbulb className="w-3 h-3 text-amber-400" /> Quick Questions:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleAsk(p)}
              disabled={loading}
              className="text-[10px] px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 text-left transition-colors truncate max-w-full"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-3 bg-slate-900 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about this lesson..."
            disabled={loading}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="p-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition-colors shadow"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
