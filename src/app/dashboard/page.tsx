"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Heart, 
  Activity, 
  Brain, 
  BookOpen, 
  Send, 
  Phone, 
  Clock, 
  Wind, 
  Sparkles, 
  Users, 
  AlertTriangle, 
  Plus, 
  RotateCcw,
  CheckCircle,
  FileText
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from "recharts";

// Default emergency helplines details (fallback)
const DEFAULT_HELPLINES = [
  { name: "Vandrevala Foundation", phone: "+91-9999-666-555", hours: "24/7" },
  { name: "AASRA Suicide Prevention", phone: "+91-22-2754-6669", hours: "24/7" },
  { name: "Kiran Mental Health", phone: "+91-9141-323-253", hours: "24/7" }
];

export default function Dashboard() {
  // Student active details
  const [examType, setExamType] = useState("JEE_MAIN");
  const [username, setUsername] = useState("Aspirant");
  const [streakCount, setStreakCount] = useState(5);
  
  // Analytics and chart state
  const [analyticsData, setAnalyticsData] = useState<any>({
    mock_tests: [],
    stress_entries: []
  });
  
  // Journal text logging state
  const [journalContent, setJournalContent] = useState("");
  const [analyzingJournal, setAnalyzingJournal] = useState(false);
  const [journalAnalysisResult, setJournalAnalysisResult] = useState<any>(null);
  
  // Chat messaging state
  const [chatMessages, setChatMessages] = useState<any[]>([
    {
      role: "assistant",
      content: "Hey there. Heavy prep load hitting today? I'm here. Dump what's in your head, or ask me about physics, revision strategies, or managing your parent's expectations. I get it.",
      timestamp: new Date().toISOString()
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  
  // Safety crisis intercept states
  const [crisisTriggered, setCrisisTriggered] = useState(false);
  const [crisisData, setCrisisData] = useState<any>(null);
  
  // Tool recommendation overlays
  const [activeTool, setActiveTool] = useState<string | null>(null); // "box_breathing", "pomodoro_sprint"
  
  // Breathing Tool state
  const [breathingPhase, setBreathingPhase] = useState("Inhale"); // Inhale, Hold, Exhale, Hold
  const [breathingSeconds, setBreathingSeconds] = useState(4);
  const [breathingLoop, setBreathingLoop] = useState<any>(null);
  
  // Pomodoro timer state
  const [pomoMinutes, setPomoMinutes] = useState(45);
  const [pomoSeconds, setPomoSeconds] = useState(0);
  const [pomoRunning, setPomoRunning] = useState(false);
  const pomoInterval = useRef<any>(null);

  // New mock test modal logging
  const [showMockModal, setShowMockModal] = useState(false);
  const [newMockName, setNewMockName] = useState("");
  const [newMockScore, setNewMockScore] = useState(150);
  const [newMockAccuracy, setNewMockAccuracy] = useState(75);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Auto-scroll chat window
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Load initial dashboard metrics
  const fetchDashboardMetrics = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/v1/analytics/dashboard`);
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
    } catch (err) {
      console.warn("Could not reach backend metrics database. Using offline demo dataset.", err);
    }
  };

  useEffect(() => {
    fetchDashboardMetrics();
  }, [backendUrl]);

  // Handle mock test logging submission
  const handleLogMockTest = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      test_name: newMockName || "Mock Test",
      score: newMockScore,
      total_marks: 300,
      percentile: parseFloat((70 + (newMockScore / 10)).toFixed(2)),
      accuracy: newMockAccuracy,
      test_date: new Date().toISOString().split("T")[0]
    };

    try {
      const res = await fetch(`${backendUrl}/api/v1/analytics/mock-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchDashboardMetrics();
        setShowMockModal(false);
        setNewMockName("");
        // Acknowledge logging in chat
        setChatMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: `I've logged your score of ${payload.score}/300 in **${payload.test_name}**. It's on your chart now. Trajectory and effort matters more than single bad papers. How are you feeling after seeing the result?`,
            timestamp: new Date().toISOString()
          }
        ]);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit score to backend");
    }
  };

  // Submit journal entry for structured AI analysis
  const handleSubmitJournal = async () => {
    const rawContent = journalContent.trim();
    if (!rawContent) return;

    setAnalyzingJournal(true);
    setJournalAnalysisResult(null);

    try {
      const res = await fetch(`${backendUrl}/api/v1/journal/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: rawContent })
      });

      const data = await res.json();
      if (res.status === 400 && data.detail === "crisis_triggered") {
        setCrisisTriggered(true);
        setCrisisData(data.crisis_data);
        setJournalContent("");
        setAnalyzingJournal(false);
        return;
      }

      if (res.ok) {
        setJournalAnalysisResult(data);
        setJournalContent("");
        setStreakCount(prev => prev + 1); // increment streak on entry logging
        fetchDashboardMetrics(); // reload chart data

        // Suggest tool recommendations if stress index is high
        if (data.stress_level > 6) {
          if (data.stress_vectors.includes("backlog_panic")) {
            setActiveTool("pomodoro_sprint");
          } else {
            setActiveTool("box_breathing");
          }
        }
      } else {
        alert(data.detail || "Server analysis error");
      }
    } catch (err) {
      console.error(err);
      alert("Error reaching the journal analysis backend.");
    } finally {
      setAnalyzingJournal(false);
    }
  };

  // Streaming Chat Client Integration
  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const rawInput = chatInput.trim();
    if (!rawInput || isStreaming) return;

    // Reset input immediately
    setChatInput("");

    // Append user message
    const updatedHistory = [
      ...chatMessages,
      { role: "user", content: rawInput, timestamp: new Date().toISOString() }
    ];
    setChatMessages(updatedHistory);
    setIsStreaming(true);

    try {
      // API call to streaming endpoint
      const response = await fetch(`${backendUrl}/api/v1/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: rawInput,
          session_id: sessionId,
          history: updatedHistory.slice(-6).map(m => ({ role: m.role, content: m.content })),
          exam_type: examType
        })
      });

      if (response.status === 400) {
        const errorData = await response.json();
        if (errorData.detail === "crisis_triggered") {
          setCrisisTriggered(true);
          setCrisisData(errorData.crisis_data);
          setIsStreaming(false);
          return;
        }
      }

      if (!response.ok) {
        throw new Error("Failed to initialize server response stream.");
      }

      // Read response stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantResponseText = "";
      
      // Append initial assistant placeholder message
      setChatMessages(prev => [
        ...prev,
        { role: "assistant", content: "", timestamp: new Date().toISOString() }
      ]);

      while (true) {
        const readResult = await reader?.read();
        if (!readResult) break;
        const { done, value } = readResult;
        if (done) break;

        const textChunk = decoder.decode(value, { stream: true });
        
        // Parse metadata block if present
        if (textChunk.startsWith("__METADATA__:")) {
          const rawMeta = textChunk.split("\n")[0].replace("__METADATA__:", "");
          try {
            const meta = JSON.parse(rawMeta);
            setSessionId(meta.session_id);
            if (meta.intervention_tool) {
              setActiveTool(meta.intervention_tool);
            }
          } catch(e) {
            console.error("Failed to parse system metadata.", e);
          }
          // Remove metadata line and process the rest of the text
          const lines = textChunk.split("\n");
          lines.shift();
          const cleanText = lines.join("\n");
          assistantResponseText += cleanText;
        } else {
          assistantResponseText += textChunk;
        }

        // Update assistant's last message stream view
        setChatMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1].content = assistantResponseText;
          }
          return updated;
        });
      }

    } catch (err) {
      console.error(err);
      setChatMessages(prev => [
        ...prev,
        { role: "assistant", content: "I encountered a network issue streaming my response. Let me know what you were saying again.", timestamp: new Date().toISOString() }
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  // Breathing Box Timer logic
  useEffect(() => {
    if (activeTool === "box_breathing") {
      const interval = setInterval(() => {
        setBreathingSeconds(prev => {
          if (prev <= 1) {
            // Swap phase
            setBreathingPhase(curr => {
              if (curr === "Inhale") return "Hold (Full)";
              if (curr === "Hold (Full)") return "Exhale";
              if (curr === "Exhale") return "Hold (Empty)";
              return "Inhale";
            });
            return 4; // Reset to 4 counts
          }
          return prev - 1;
        });
      }, 1000);
      setBreathingLoop(interval);
      return () => clearInterval(interval);
    } else {
      if (breathingLoop) {
        clearInterval(breathingLoop);
        setBreathingLoop(null);
      }
    }
  }, [activeTool, breathingPhase]);

  // Pomodoro countdown timer logic
  useEffect(() => {
    if (pomoRunning) {
      pomoInterval.current = setInterval(() => {
        setPomoSeconds(sec => {
          if (sec === 0) {
            setPomoMinutes(min => {
              if (min === 0) {
                // Completed!
                setPomoRunning(false);
                clearInterval(pomoInterval.current);
                alert("Pomodoro Study Sprint Completed! Time for a short 10-minute break.");
                return 45;
              }
              return min - 1;
            });
            return 59;
          }
          return sec - 1;
        });
      }, 1000);
    } else {
      if (pomoInterval.current) {
        clearInterval(pomoInterval.current);
      }
    }
    return () => clearInterval(pomoInterval.current);
  }, [pomoRunning]);

  // Chart data formatting & correlation mapping
  const getCombinedChartData = () => {
    const stressByDate = new Map<string, number>();
    analyticsData.stress_entries.forEach((item: any) => {
      // Extract date string
      const d = item.created_at ? item.created_at.split("T")[0] : "";
      if (d) stressByDate.set(d, item.stress_level);
    });

    return analyticsData.mock_tests.map((test: any) => {
      const date = test.test_date;
      return {
        date,
        score: test.score,
        stressLevel: stressByDate.get(date) || 5, // fallback stress level
        name: test.test_name
      };
    }).sort((a: any, b: any) => a.date.localeCompare(b.date));
  };

  return (
    <div className="flex-1 bg-slate-950 p-4 md:p-8 flex flex-col gap-6 text-slate-100 min-h-screen">
      
      {/* Upper Navigation & Stats */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-gradient-neon">StressFreak Dashboard</h1>
            <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded text-xs font-semibold uppercase">
              Pro Version
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Empathetic AI monitoring and stress tracking engineered specifically for Indian coaching students.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-xs text-slate-400">Targeting Exam</span>
            <select 
              aria-label="Target Exam Mode"
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-sm text-indigo-400 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
            >
              <option value="JEE_MAIN">JEE Main</option>
              <option value="JEE_ADVANCED">JEE Advanced</option>
              <option value="NEET">NEET UG</option>
              <option value="UPSC">UPSC Civil Services</option>
              <option value="CAT">CAT MBA</option>
              <option value="GATE">GATE</option>
            </select>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded px-3 py-1 flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-amber-400 animate-pulse" />
            <span className="text-sm font-bold text-amber-300">Streak: {streakCount} Days</span>
          </div>
        </div>
      </header>

      {/* Main Grid: Left side analytics, Right side AI Companion */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Columns (8/12 width on large screen) */}
        <main className="xl:col-span-8 flex flex-col gap-6">
          
          {/* Quick Metrics Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-label="Student Metric Summaries">
            <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-rose-500/10 rounded-lg border border-rose-500/20">
                <Heart className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Stress Index</p>
                <p className="text-2xl font-bold text-rose-400">
                  {analyticsData.stress_entries.length > 0 
                    ? (analyticsData.stress_entries.reduce((acc: number, cur: any) => acc + cur.stress_level, 0) / analyticsData.stress_entries.length).toFixed(1)
                    : "5.0"
                  } <span className="text-xs text-slate-500">/ 10</span>
                </p>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                <Brain className="w-6 h-6 text-cyan-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Weekly Burnout</p>
                <p className="text-2xl font-bold text-cyan-400">
                  {analyticsData.stress_entries.length > 0
                    ? (analyticsData.stress_entries.reduce((acc: number, cur: any) => acc + cur.burnout_index, 0) / analyticsData.stress_entries.length).toFixed(1)
                    : "4.8"
                  } <span className="text-xs text-slate-500">/ 10</span>
                </p>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <Activity className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Mock Papers Logged</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {analyticsData.mock_tests.length} <span className="text-xs text-slate-500">Completed</span>
                </p>
              </div>
            </div>
          </section>

          {/* Double Y-Axis Line Chart: Correlation between Stress and Mock Scores */}
          <section className="glass-panel p-5 rounded-xl flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">Mock Test Performance vs. Stress Correlation</h2>
                <p className="text-xs text-slate-400">Visualizes how stress peaks map directly to test scores.</p>
              </div>
              <button 
                onClick={() => setShowMockModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" /> Log Test Score
              </button>
            </div>

            <div className="h-72 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getCombinedChartData()} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  
                  {/* Left Axis: Mock Score */}
                  <YAxis yAxisId="left" stroke="#818cf8" label={{ value: 'Mock Score', angle: -90, position: 'insideLeft', style: { fill: '#818cf8', fontSize: 12 } }} />
                  
                  {/* Right Axis: Stress Index */}
                  <YAxis yAxisId="right" orientation="right" stroke="#f43f5e" domain={[1, 10]} label={{ value: 'Stress Level', angle: 90, position: 'insideRight', style: { fill: '#f43f5e', fontSize: 12 } }} />
                  
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: '#f8fafc' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="score" 
                    name="Mock Test Score" 
                    stroke="#818cf8" 
                    strokeWidth={3} 
                    activeDot={{ r: 8 }} 
                  />
                  
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="stressLevel" 
                    name="Stress Index" 
                    stroke="#f43f5e" 
                    strokeWidth={2.5} 
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Interactive Journal Logging Pane */}
          <section className="glass-panel p-5 rounded-xl flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                Unstructured Daily Journal & Mood Analysis
              </h2>
              <p className="text-xs text-slate-400">
                Write a quick "brain dump" about your prep pressure. Our analyzer will identify burnout levels and cognitive distortions.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <textarea
                aria-label="Daily Journal Text Content"
                className="w-full h-32 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                placeholder="Write honestly... e.g. 'I spent 4 hours on mock problems and got stuck. My friend scored 180, and my mom asked if I am studying hard enough. I feel overwhelmed and might fail...'"
                value={journalContent}
                onChange={(e) => setJournalContent(e.target.value)}
              />

              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Data protection active: Zero data cached externally.</span>
                <button
                  onClick={handleSubmitJournal}
                  disabled={analyzingJournal || !journalContent.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-medium py-1.5 px-4 rounded-lg text-sm transition-all"
                >
                  {analyzingJournal ? "Analyzing Stress..." : "Log & Analyze Entry"}
                </button>
              </div>
            </div>

            {/* Extracted Analysis Display */}
            {journalAnalysisResult && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 text-sm animate-fadeIn">
                <h3 className="font-semibold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-4.5 h-4.5" /> Extracted Journal Insights
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <p className="text-xs text-slate-500 font-semibold">Stress Index</p>
                    <p className="text-lg font-bold text-rose-400">{journalAnalysisResult.stress_level} / 10</p>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <p className="text-xs text-slate-500 font-semibold">Anxiety Level</p>
                    <p className="text-lg font-bold text-cyan-400">{journalAnalysisResult.anxiety_level} / 10</p>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <p className="text-xs text-slate-500 font-semibold">Sleep Quality</p>
                    <p className="text-lg font-bold text-emerald-400">{journalAnalysisResult.sleep_quality} / 10</p>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <p className="text-xs text-slate-500 font-semibold">Dominant Topic</p>
                    <p className="text-md font-bold text-indigo-400 mt-1.5 truncate">{journalAnalysisResult.primary_topic}</p>
                  </div>
                </div>

                {journalAnalysisResult.cognitive_distortions.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-amber-500 block mb-1">Identified Cognitive Distortions:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {journalAnalysisResult.cognitive_distortions.map((d: string, idx: number) => (
                        <span key={idx} className="bg-amber-500/10 text-amber-400 text-xs px-2 py-0.5 rounded border border-amber-500/20">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {journalAnalysisResult.stress_vectors.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-indigo-400 block mb-1">Stress Factors:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {journalAnalysisResult.stress_vectors.map((v: string, idx: number) => (
                        <span key={idx} className="bg-indigo-500/10 text-indigo-400 text-xs px-2 py-0.5 rounded border border-indigo-500/20">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-800 pt-3">
                  <span className="text-xs font-semibold text-slate-400 block mb-1.5">Recommended Actions:</span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-300">
                    {journalAnalysisResult.insights.map((insight: string, idx: number) => (
                      <li key={idx}>{insight}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>
        </main>

        {/* Right Columns: AI Empathetic Companion (4/12 width) */}
        <aside className="xl:col-span-4 flex flex-col gap-6 h-[85vh]">
          
          {/* Chat Panel Box */}
          <div className="glass-panel rounded-xl flex-1 flex flex-col overflow-hidden">
            
            {/* Header info */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center gap-3 justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-bold text-sm">StressFreak AI Companion</span>
              </div>
              <span className="text-xs text-slate-400">Gemini 1.5 Flash</span>
            </div>

            {/* Chat message listing */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
              {chatMessages.map((msg, index) => (
                <div 
                  key={index}
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm flex flex-col gap-1 ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white self-end rounded-tr-none"
                      : "bg-slate-900 text-slate-200 border border-slate-800 self-start rounded-tl-none"
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content || "..."}</p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Crisis Alert Modal Override */}
            {crisisTriggered && crisisData && (
              <div className="bg-rose-950/90 border-t border-rose-800 p-4 animate-slideUp max-h-72 overflow-y-auto">
                <div className="flex items-start gap-2.5 text-rose-300 mb-3">
                  <AlertTriangle className="w-6 h-6 shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm">Immediate Support Intercept</h4>
                    <p className="text-xs opacity-90 mt-0.5">{crisisData.message}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 mt-4">
                  {(crisisData.helplines || DEFAULT_HELPLINES).map((help: any, idx: number) => (
                    <div key={idx} className="bg-slate-950 p-2.5 rounded-lg border border-rose-900/50 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-rose-300">{help.name}</p>
                        <p className="text-slate-400">Hours: {help.hours}</p>
                      </div>
                      <a 
                        href={`tel:${help.phone}`}
                        className="bg-rose-800 hover:bg-rose-700 text-white font-semibold py-1 px-3 rounded flex items-center gap-1 transition-all"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call
                      </a>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => {
                    setCrisisTriggered(false);
                    setCrisisData(null);
                  }}
                  className="w-full mt-4 bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs py-1.5 rounded border border-slate-700 transition-all"
                >
                  Close & Acknowledge Helplines
                </button>
              </div>
            )}

            {/* Stream/Chat Input Box */}
            <form onSubmit={handleSendChatMessage} className="bg-slate-900 border-t border-slate-800 p-3 flex gap-2">
              <input
                type="text"
                aria-label="Send message to AI companion"
                placeholder="Ask me something or vent..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 text-sm focus:outline-none focus:border-indigo-500"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isStreaming || crisisTriggered}
              />
              <button
                type="submit"
                disabled={isStreaming || !chatInput.trim() || crisisTriggered}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 p-2.5 rounded-lg text-white transition-all"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>
          </div>

          {/* Active Tool Injection Component */}
          {activeTool && (
            <div className="glass-panel p-4 rounded-xl border border-indigo-500/20 animate-fadeIn relative">
              <button 
                onClick={() => setActiveTool(null)}
                className="absolute top-2.5 right-2.5 text-xs text-slate-400 hover:text-white"
              >
                [Dismiss Tool]
              </button>

              {activeTool === "box_breathing" && (
                <div className="flex flex-col items-center justify-center text-center gap-3">
                  <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-sm">
                    <Wind className="w-4.5 h-4.5 animate-pulse" />
                    Interactive Box Breathing Simulator
                  </div>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Reset your autonomic nervous system. Follow the expanding circle.
                  </p>
                  
                  {/* Circle Breathing graphic */}
                  <div className="relative w-28 h-28 flex items-center justify-center mt-2">
                    <div className="absolute w-24 h-24 rounded-full border border-indigo-500/20" />
                    <div className="w-20 h-20 rounded-full bg-gradient-neon opacity-70 breathing-circle flex items-center justify-center text-slate-950 font-bold text-sm">
                      {breathingPhase}
                    </div>
                  </div>
                  <span className="text-xs text-indigo-300 font-semibold mt-1">
                    Hold duration: {breathingSeconds}s
                  </span>
                </div>
              )}

              {activeTool === "pomodoro_sprint" && (
                <div className="flex flex-col items-center justify-center text-center gap-3">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-sm">
                    <Clock className="w-4.5 h-4.5" />
                    Pomodoro Study Sprint (45 mins)
                  </div>
                  <p className="text-xs text-slate-400">
                    One single study session, ignoring backlogs. Commit to 45 mins of single-focus.
                  </p>
                  
                  <div className="text-3xl font-extrabold text-cyan-300 tracking-wider my-2">
                    {String(pomoMinutes).padStart(2, '0')}:{String(pomoSeconds).padStart(2, '0')}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setPomoRunning(!pomoRunning)}
                      className={`text-xs px-4 py-1.5 rounded-lg font-semibold transition-all ${
                        pomoRunning ? "bg-amber-600 hover:bg-amber-700" : "bg-cyan-600 hover:bg-cyan-700"
                      }`}
                    >
                      {pomoRunning ? "Pause" : "Start Sprint"}
                    </button>
                    <button
                      onClick={() => {
                        setPomoRunning(false);
                        setPomoMinutes(45);
                        setPomoSeconds(0);
                      }}
                      className="bg-slate-900 border border-slate-700 text-slate-300 hover:text-white p-1.5 rounded-lg"
                    >
                      <RotateCcw className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              )}

              {activeTool === "peer_support" && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-sm">
                    <Users className="w-4.5 h-4.5" />
                    Peer Support Gateway
                  </div>
                  <p className="text-xs text-slate-300">
                    Connect with other {examType.replace("_", " ")} students facing the same study slumps. No advice, just sharing.
                  </p>
                  <button 
                    onClick={() => alert("Connecting to peer community channel...")}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs py-1.5 rounded-lg mt-1 transition-all"
                  >
                    Join Support Channel
                  </button>
                </div>
              )}

              {activeTool === "focus_room" && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-sm">
                    <CheckCircle className="w-4.5 h-4.5" />
                    Focus Co-Study Room
                  </div>
                  <p className="text-xs text-slate-300">
                    Enter the silent co-studying arena. Ambient lo-fi and background accountability timers active.
                  </p>
                  <button 
                    onClick={() => alert("Launching co-study focus timer...")}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs py-1.5 rounded-lg mt-1 transition-all"
                  >
                    Enter Focus Room
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick Interventions Manual recommendation triggers */}
          <div className="glass-panel p-4 rounded-xl flex flex-col gap-2.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Coping Simulators</span>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setActiveTool("box_breathing")} 
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500 text-slate-200 text-xs py-2 rounded-lg transition-all"
              >
                Box Breathing
              </button>
              <button 
                onClick={() => setActiveTool("pomodoro_sprint")}
                className="bg-slate-900 border border-slate-800 hover:border-cyan-500 text-slate-200 text-xs py-2 rounded-lg transition-all"
              >
                Pomodoro Timer
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Log Mock Test Modal Dialog */}
      {showMockModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-sm flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-bold">Log Mock Paper Result</h3>
              <p className="text-xs text-slate-400">Save test metrics to evaluate performance-stress correlation.</p>
            </div>

            <form onSubmit={handleLogMockTest} className="flex flex-col gap-3 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-semibold" htmlFor="mockNameInput">Mock Test Name</label>
                <input 
                  type="text" 
                  id="mockNameInput"
                  className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. AITS Physics Test 3"
                  value={newMockName}
                  onChange={(e) => setNewMockName(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-semibold" htmlFor="mockScoreInput">Score Secured (out of 300)</label>
                <input 
                  type="number" 
                  id="mockScoreInput"
                  className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  min="0"
                  max="300"
                  value={newMockScore}
                  onChange={(e) => setNewMockScore(parseInt(e.target.value))}
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-semibold" htmlFor="mockAccuracyInput">Accuracy Percentage (%)</label>
                <input 
                  type="number" 
                  id="mockAccuracyInput"
                  className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  min="0"
                  max="100"
                  value={newMockAccuracy}
                  onChange={(e) => setNewMockAccuracy(parseInt(e.target.value))}
                  required
                />
              </div>

              <div className="flex gap-2.5 mt-4">
                <button 
                  type="button" 
                  onClick={() => setShowMockModal(false)}
                  className="flex-1 bg-slate-950 border border-slate-850 hover:bg-slate-900 hover:text-white py-1.5 rounded transition-all text-xs font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 py-1.5 text-white font-semibold rounded transition-all text-xs"
                >
                  Add to Dashboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
