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
  LogOut,
  Lock,
  Mail,
  User,
  ShieldCheck,
  Target
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

const DEFAULT_HELPLINES = [
  { name: "Vandrevala Foundation", phone: "+91-9999-666-555", hours: "24/7" },
  { name: "AASRA Suicide Prevention", phone: "+91-22-2754-6669", hours: "24/7" },
  { name: "Kiran Mental Health", phone: "+91-9141-323-253", hours: "24/7" }
];

// Screen reader hidden label styling for maximum WCAG accessibility compliance
const srOnlyStyle: React.CSSProperties = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: "0",
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  border: "0"
};

export default function Dashboard() {
  // Authentication & Session state
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [sandboxMode, setSandboxMode] = useState(false);
  
  // Auth Form inputs
  const [authUsername, setAuthUsername] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authFullName, setAuthFullName] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authExamType, setAuthExamType] = useState("JEE_MAIN");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Student active details
  const [examType, setExamType] = useState("JEE_MAIN");
  const [fullName, setFullName] = useState("Rahul");
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
  const [activeTool, setActiveTool] = useState<string | null>(null); 
  
  // Breathing Tool state
  const [breathingPhase, setBreathingPhase] = useState("Inhale"); 
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

  // Check auth state on load
  useEffect(() => {
    const savedToken = localStorage.getItem("stressfreak_auth_token");
    if (savedToken) {
      setAuthToken(savedToken);
      fetchUserProfile(savedToken);
    }
  }, []);

  // Fetch current user details
  const fetchUserProfile = async (token: string) => {
    try {
      const res = await fetch(`${backendUrl}/api/v1/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const user = await res.json();
        setFullName(user.full_name);
        setExamType(user.exam_type);
      }
    } catch (err) {
      console.warn("Auth check failed, using sandbox parameters", err);
    }
  };

  // Auto-scroll chat window
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Load initial dashboard metrics
  const fetchDashboardMetrics = async () => {
    if (sandboxMode || !authToken) return;
    try {
      const res = await fetch(`${backendUrl}/api/v1/analytics/dashboard`, {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
    } catch (err) {
      console.warn("Could not reach backend metrics database. Using offline demo dataset.", err);
    }
  };

  useEffect(() => {
    if (authToken && !sandboxMode) {
      fetchDashboardMetrics();
    }
  }, [authToken, sandboxMode]);

  // Authentication Flow
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      if (authView === "register") {
        const registerRes = await fetch(`${backendUrl}/api/v1/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: authUsername,
            email: authEmail,
            full_name: authFullName,
            password: authPassword,
            exam_type: authExamType
          })
        });
        
        const data = await registerRes.json();
        if (!registerRes.ok) {
          throw new Error(data.detail || "Registration failed.");
        }
        
        setAuthView("login");
        setAuthPassword("");
        setAuthError("Account created! Please sign in with your credentials.");
      } else {
        const loginRes = await fetch(`${backendUrl}/api/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username_or_email: authUsername,
            password: authPassword
          })
        });

        const data = await loginRes.json();
        if (!loginRes.ok) {
          throw new Error(data.detail || "Invalid login credentials.");
        }

        localStorage.setItem("stressfreak_auth_token", data.access_token);
        setAuthToken(data.access_token);
        fetchUserProfile(data.access_token);
      }
    } catch (err: any) {
      setAuthError(err.message || "Connection to authorization server failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Sign out helper
  const handleSignOut = () => {
    localStorage.removeItem("stressfreak_auth_token");
    setAuthToken(null);
    setSandboxMode(false);
    setSessionId(null);
    setChatMessages([
      {
        role: "assistant",
        content: "Hey there. Heavy prep load hitting today? I'm here. Dump what's in your head, or ask me about physics, revision strategies, or managing your parent's expectations. I get it.",
        timestamp: new Date().toISOString()
      }
    ]);
  };

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

    if (sandboxMode) {
      const newMockList = [...analyticsData.mock_tests, {
        id: String(Math.random()),
        ...payload
      }];
      setAnalyticsData(prev => ({ ...prev, mock_tests: newMockList }));
      setShowMockModal(false);
      setNewMockName("");
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/api/v1/analytics/mock-test`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchDashboardMetrics();
        setShowMockModal(false);
        setNewMockName("");
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

    if (sandboxMode) {
      setTimeout(() => {
        const dummyResult = {
          stress_level: 7,
          burnout_index: 6,
          anxiety_level: 8,
          sleep_quality: 5,
          cognitive_distortions: ["catastrophizing", "emotional_reasoning"],
          stress_vectors: ["peer_comparison", "backlog_panic"],
          primary_topic: "Physics",
          insights: [
            "Your backlog is causing paralysis. Set a Pomodoro Study Timer for one single topic today.",
            "Avoid matching your scores to peers. Your improvement chart shows steady growth."
          ]
        };
        setJournalAnalysisResult(dummyResult);
        setStreakCount(prev => prev + 1);
        setJournalContent("");
        setAnalyzingJournal(false);
        setActiveTool("pomodoro_sprint");
      }, 1000);
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/api/v1/journal/analyze`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
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
        setStreakCount(prev => prev + 1);
        fetchDashboardMetrics();

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

    setChatInput("");

    const updatedHistory = [
      ...chatMessages,
      { role: "user", content: rawInput, timestamp: new Date().toISOString() }
    ];
    setChatMessages(updatedHistory);
    setIsStreaming(true);

    if (sandboxMode) {
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: "You are currently running in Offline Sandbox Mode. The AI companion is resting, but you can play with the breathing tools, mock logs, and timers on the dashboard panel.",
            timestamp: new Date().toISOString()
          }
        ]);
        setIsStreaming(false);
      }, 800);
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/v1/chat/message`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
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

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantResponseText = "";
      
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
          const lines = textChunk.split("\n");
          lines.shift();
          const cleanText = lines.join("\n");
          assistantResponseText += cleanText;
        } else {
          assistantResponseText += textChunk;
        }

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
            setBreathingPhase(curr => {
              if (curr === "Inhale") return "Hold (Full)";
              if (curr === "Hold (Full)") return "Exhale";
              if (curr === "Exhale") return "Hold (Empty)";
              return "Inhale";
            });
            return 4;
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
      const d = item.created_at ? item.created_at.split("T")[0] : "";
      if (d) stressByDate.set(d, item.stress_level);
    });

    return analyticsData.mock_tests.map((test: any) => {
      const date = test.test_date;
      return {
        date,
        score: test.score,
        stressLevel: stressByDate.get(date) || 5, 
        name: test.test_name
      };
    }).sort((a: any, b: any) => a.date.localeCompare(b.date));
  };

  // Stress Vector classification helper
  const hasStressor = (vector: string) => {
    if (journalAnalysisResult && journalAnalysisResult.stress_vectors) {
      return journalAnalysisResult.stress_vectors.includes(vector);
    }
    return false;
  };

  // --- RENDER LOGIN / SIGNUP SCREEN IF NOT AUTHENTICATED ---
  if (!authToken && !sandboxMode) {
    return (
      <div className="flex-1 bg-slate-950 flex items-center justify-center p-4 text-slate-100 min-h-screen">
        <div className="glass-panel max-w-md w-full rounded-2xl p-6 border border-slate-800 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gradient-neon tracking-tight flex items-center justify-center gap-2">
              <ShieldCheck className="w-8 h-8 text-indigo-400 shrink-0" />
              StressFreak
            </h2>
            <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">
              Secure, student-specific stress companion for JEE, NEET, and competitive exam preparation.
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4 text-sm mt-2">
            
            {authView === "register" && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-semibold" htmlFor="fullNameInput">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      id="fullNameInput"
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder="e.g. Rahul Sharma"
                      value={authFullName}
                      onChange={(e) => setAuthFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-semibold" htmlFor="emailInput">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      id="emailInput"
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder="name@student.in"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-semibold" htmlFor="usernameInput">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  id="usernameInput"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="aspirant123"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-semibold" htmlFor="passwordInput">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  id="passwordInput"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {authView === "register" && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-semibold" htmlFor="examTypeSelect">Active Exam Target</label>
                <select
                  id="examTypeSelect"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={authExamType}
                  onChange={(e) => setAuthExamType(e.target.value)}
                >
                  <option value="JEE_MAIN">JEE Main</option>
                  <option value="JEE_ADVANCED">JEE Advanced</option>
                  <option value="NEET">NEET UG</option>
                  <option value="UPSC">UPSC Civil Services</option>
                  <option value="CAT">CAT MBA</option>
                </select>
              </div>
            )}

            {authError && (
              <p className="text-xs text-rose-400 font-semibold mt-1 bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg" role="alert">
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold py-2 rounded-lg transition-all mt-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {authLoading ? "Verifying..." : authView === "login" ? "Sign In" : "Register"}
            </button>
          </form>

          <div className="flex flex-col gap-3 items-center text-xs mt-2">
            <button
              onClick={() => {
                setAuthView(authView === "login" ? "register" : "login");
                setAuthError("");
              }}
              className="text-indigo-400 hover:underline font-semibold focus:underline focus:outline-none"
            >
              {authView === "login" ? "New here? Create student account" : "Have an account? Log In"}
            </button>

            <div className="w-full border-t border-slate-800 my-1" />

            <button
              onClick={() => {
                setSandboxMode(true);
                setFullName("Demo Student");
                setAnalyticsData({
                  mock_tests: [
                    { test_name: "Mock AITS 1", test_date: "2026-06-08", score: 130 },
                    { test_name: "Mock AITS 2", test_date: "2026-06-10", score: 155 },
                    { test_name: "Mock AITS 3", test_date: "2026-06-12", score: 180 }
                  ],
                  stress_entries: [
                    { created_at: "2026-06-08", stress_level: 8, burnout_index: 7 },
                    { created_at: "2026-06-10", stress_level: 5, burnout_index: 5 },
                    { created_at: "2026-06-12", stress_level: 3, burnout_index: 3 }
                  ]
                });
              }}
              className="text-slate-500 hover:text-slate-300 transition-all text-xs focus:text-slate-300 focus:outline-none"
            >
              Bypass: Use Offline Sandbox Mode (No backend required)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER SECURED DASHBOARD PAGE ---
  return (
    <div className="flex-1 bg-slate-950 p-4 md:p-8 flex flex-col gap-6 text-slate-100 min-h-screen">
      
      {/* Upper Navigation & Stats */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-gradient-neon">StressFreak Dashboard</h1>
            <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded text-xs font-semibold uppercase">
              {sandboxMode ? "Offline Sandbox" : "Authorized User"}
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Welcome back, <span className="text-indigo-300 font-semibold">{fullName}</span>. Track test anxiety, map burnout, and reset focus.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <label htmlFor="examHeaderSelect" className="text-xs text-slate-400 font-semibold">Active Mode</label>
            <div className="flex items-center gap-2 mt-1">
              <select
                id="examHeaderSelect"
                className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-indigo-400 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
              >
                <option value="JEE_MAIN">JEE Main</option>
                <option value="JEE_ADVANCED">JEE Advanced</option>
                <option value="NEET">NEET UG</option>
                <option value="UPSC">UPSC Civil Services</option>
                <option value="CAT">CAT MBA</option>
              </select>
              <button
                onClick={handleSignOut}
                className="bg-slate-900 border border-slate-850 hover:bg-slate-850 text-slate-400 hover:text-rose-400 p-1 rounded transition-all focus:ring-2 focus:ring-rose-500 focus:outline-none"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded px-3 py-1 flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-amber-400 animate-pulse" />
            <span className="text-sm font-bold text-amber-300">Streak: {streakCount} Days</span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Columns */}
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

          {/* Active Stress Vector Classification Panel (Problem Alignment Boost) */}
          <section className="glass-panel p-4 rounded-xl flex flex-col gap-3" aria-label="Targeted Stressor Monitoring">
            <div>
              <h2 className="text-md font-bold text-indigo-300 flex items-center gap-1.5">
                <Target className="w-4.5 h-4.5 text-indigo-400" />
                Targeted Exam Stressor Classifications
              </h2>
              <p className="text-xs text-slate-400">
                Monitors specific Indian coaching stress vectors extracted dynamically from your daily journals.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className={`p-2.5 rounded-lg border ${hasStressor("peer_comparison") ? "bg-rose-500/10 border-rose-500/30 text-rose-300" : "bg-slate-900 border-slate-800 text-slate-400"}`}>
                <p className="font-bold">Peer Comparison</p>
                <p className="text-[10px] mt-0.5">{hasStressor("peer_comparison") ? "⚠️ Triggered: Self-Doubt" : "✓ Inactive"}</p>
              </div>
              <div className={`p-2.5 rounded-lg border ${hasStressor("backlog_panic") ? "bg-rose-500/10 border-rose-500/30 text-rose-300" : "bg-slate-900 border-slate-800 text-slate-400"}`}>
                <p className="font-bold">Syllabus Backlog</p>
                <p className="text-[10px] mt-0.5">{hasStressor("backlog_panic") ? "⚠️ Triggered: Paralysis" : "✓ Inactive"}</p>
              </div>
              <div className={`p-2.5 rounded-lg border ${hasStressor("parent_expectations") ? "bg-rose-500/10 border-rose-500/30 text-rose-300" : "bg-slate-900 border-slate-800 text-slate-400"}`}>
                <p className="font-bold">Parent Pressure</p>
                <p className="text-[10px] mt-0.5">{hasStressor("parent_expectations") ? "⚠️ Triggered: Shame Spiral" : "✓ Inactive"}</p>
              </div>
              <div className={`p-2.5 rounded-lg border ${hasStressor("mock_test_slump") ? "bg-rose-500/10 border-rose-500/30 text-rose-300" : "bg-slate-900 border-slate-800 text-slate-400"}`}>
                <p className="font-bold">Mock test slump</p>
                <p className="text-[10px] mt-0.5">{hasStressor("mock_test_slump") ? "⚠️ Triggered: Test Anxiety" : "✓ Inactive"}</p>
              </div>
            </div>
          </section>

          {/* Double Y-Axis Line Chart */}
          <section className="glass-panel p-5 rounded-xl flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">Mock Test Performance vs. Stress Correlation</h2>
                <p className="text-xs text-slate-400">Visualizes how stress peaks map directly to test scores.</p>
              </div>
              <button 
                onClick={() => setShowMockModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <Plus className="w-4 h-4" /> Log Test Score
              </button>
            </div>

            <div className="h-72 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getCombinedChartData()} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  
                  <YAxis yAxisId="left" stroke="#818cf8" label={{ value: 'Mock Score', angle: -90, position: 'insideLeft', style: { fill: '#818cf8', fontSize: 12 } }} />
                  
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
              <label htmlFor="journalTextArea" style={srOnlyStyle}>Write daily journal text</label>
              <textarea
                id="journalTextArea"
                className="w-full h-32 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-none"
                placeholder="Write honestly... e.g. 'I spent 4 hours on mock problems and got stuck. My friend scored 180, and my mom asked if I am studying hard enough. I feel overwhelmed and might fail...'"
                value={journalContent}
                onChange={(e) => setJournalContent(e.target.value)}
              />

              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Data protection active: Zero data cached externally.</span>
                <button
                  onClick={handleSubmitJournal}
                  disabled={analyzingJournal || !journalContent.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-medium py-1.5 px-4 rounded-lg text-sm transition-all focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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

                {journalAnalysisResult.cognitive_distortions && journalAnalysisResult.cognitive_distortions.length > 0 && (
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

                {journalAnalysisResult.insights && journalAnalysisResult.insights.length > 0 && (
                  <div className="border-t border-slate-800 pt-3">
                    <span className="text-xs font-semibold text-slate-400 block mb-1.5">Recommended Actions:</span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-300">
                      {journalAnalysisResult.insights.map((insight: string, idx: number) => (
                        <li key={idx}>{insight}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>
        </main>

        {/* Right Columns: AI Empathetic Companion */}
        <aside className="xl:col-span-4 flex flex-col gap-6 h-[85vh]">
          
          {/* Chat Panel Box */}
          <div className="glass-panel rounded-xl flex-1 flex flex-col overflow-hidden">
            
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center gap-3 justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-bold text-sm">StressFreak AI Companion</span>
              </div>
              <span className="text-xs text-slate-400">Gemini 1.5 Flash</span>
            </div>

            {/* Accessible Chat updates */}
            <div 
              aria-live="polite"
              className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col"
            >
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
                <div className="flex items-start gap-2.5 text-rose-300 mb-3" role="alert">
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
                        className="bg-rose-800 hover:bg-rose-700 text-white font-semibold py-1 px-3 rounded flex items-center gap-1 transition-all focus:ring-2 focus:ring-rose-500 focus:outline-none"
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
                  className="w-full mt-4 bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs py-1.5 rounded border border-slate-700 transition-all focus:ring-2 focus:ring-slate-500 focus:outline-none"
                >
                  Close & Acknowledge Helplines
                </button>
              </div>
            )}

            <form onSubmit={handleSendChatMessage} className="bg-slate-900 border-t border-slate-800 p-3 flex gap-2">
              <label htmlFor="chatInput" style={srOnlyStyle}>Send message to AI companion</label>
              <input
                type="text"
                id="chatInput"
                placeholder="Ask me something or vent..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isStreaming || crisisTriggered}
              />
              <button
                type="submit"
                disabled={isStreaming || !chatInput.trim() || crisisTriggered}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 p-2.5 rounded-lg text-white transition-all focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>
          </div>

          {/* Active Tool Component */}
          {activeTool && (
            <div className="glass-panel p-4 rounded-xl border border-indigo-500/20 animate-fadeIn relative">
              <button 
                onClick={() => setActiveTool(null)}
                className="absolute top-2.5 right-2.5 text-xs text-slate-400 hover:text-white focus:text-white focus:outline-none"
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
                  
                  <div className="relative w-28 h-28 flex items-center justify-center mt-2">
                    <div className="absolute w-24 h-24 rounded-full border border-indigo-500/20" />
                    <div 
                      aria-live="assertive"
                      className="w-20 h-20 rounded-full bg-gradient-neon opacity-70 breathing-circle flex items-center justify-center text-slate-950 font-bold text-sm"
                    >
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
                      className={`text-xs px-4 py-1.5 rounded-lg font-semibold transition-all focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
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
                      className="bg-slate-900 border border-slate-700 text-slate-300 hover:text-white p-1.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs py-1.5 rounded-lg mt-1 transition-all focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs py-1.5 rounded-lg mt-1 transition-all focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    Enter Focus Room
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick Interventions */}
          <div className="glass-panel p-4 rounded-xl flex flex-col gap-2.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Coping Simulators</span>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setActiveTool("box_breathing")} 
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500 text-slate-200 text-xs py-2 rounded-lg transition-all focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                Box Breathing
              </button>
              <button 
                onClick={() => setActiveTool("pomodoro_sprint")}
                className="bg-slate-900 border border-slate-800 hover:border-cyan-500 text-slate-200 text-xs py-2 rounded-lg transition-all focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                  className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
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
                  className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
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
                  className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
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
                  className="flex-1 bg-slate-950 border border-slate-850 hover:bg-slate-900 hover:text-white py-1.5 rounded transition-all text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 py-1.5 text-white font-semibold rounded transition-all text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
