import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import {
  Layers,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Mic,
  Send,
  ExternalLink,
  BookOpen,
  Cpu,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { TechnicalRequest } from '../types/crm';

interface CtoDashboardProps {
  onSelectLead: (leadId: string) => void;
}

export const CtoDashboard: React.FC<CtoDashboardProps> = ({ onSelectLead }) => {
  const { techRequests, answerTechRequest, knowledgeBase, leads } = useCRM();

  const [activeTab, setActiveTab] = useState<'queue' | 'answered' | 'tech_stack'>('queue');
  const [answeringRequestId, setAnsweringRequestId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const pendingRequests = techRequests.filter((r) => r.status === 'Awaiting Technical Response');
  const answeredRequests = techRequests.filter((r) => r.status === 'Answered');

  const handleStartRecording = () => {
    setIsRecordingVoice(true);
    setRecordingSeconds(0);
    const interval = setInterval(() => {
      setRecordingSeconds((prev) => {
        if (prev >= 60) {
          clearInterval(interval);
          setIsRecordingVoice(false);
          return 60;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const handleStopRecording = () => {
    setIsRecordingVoice(false);
    setAnswerText((prev) => (prev ? prev + ' [Attached Voice Note: Technical Audio Spec]' : '[Attached Voice Note: Technical Audio Spec - 45s]'));
  };

  const handleSubmitAnswer = (requestId: string) => {
    if (!answerText.trim()) {
      alert('Please provide technical guidance or answer text.');
      return;
    }
    answerTechRequest(requestId, answerText);
    setAnsweringRequestId(null);
    setAnswerText('');
    alert('Technical response submitted and logged to communication timeline! Intern has been notified.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Technical Escalation Queue & Architecture Review
            </h2>
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-800">
              CTO Desk
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Support non-technical interns with approved technical responses, architecture feasibility, and integration specs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700">
            {pendingRequests.length} Awaiting Response
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'queue'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="h-4 w-4" />
          Awaiting CTO Response ({pendingRequests.length})
        </button>

        <button
          onClick={() => setActiveTab('answered')}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'answered'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          Answered Archive ({answeredRequests.length})
        </button>

        <button
          onClick={() => setActiveTab('tech_stack')}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'tech_stack'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          SaroHub Approved Tech Stack
        </button>
      </div>

      {/* Tab 1: Pending Queue */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center shadow-2xs">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
              <h3 className="text-sm font-bold text-slate-800">Technical Queue is Clear</h3>
              <p className="text-xs text-slate-400 mt-1">
                No pending questions from outreach interns at this moment.
              </p>
            </div>
          ) : (
            pendingRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {req.businessName}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          req.urgency === 'Critical'
                            ? 'bg-rose-100 text-rose-800'
                            : req.urgency === 'High'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        Urgency: {req.urgency}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Escalated by intern: <strong className="text-slate-700">{req.internName}</strong> •{' '}
                      {new Date(req.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>

                  <button
                    onClick={() => onSelectLead(req.leadId)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 shrink-0 self-start"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open Lead Workspace
                  </button>
                </div>

                {/* Prospect Query Box */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-xs space-y-2">
                  <div>
                    <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">
                      Prospect's Technical Question:
                    </span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      "{req.question}"
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                    <div>
                      <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">
                        Background Context:
                      </span>
                      <p className="text-slate-700 mt-0.5">{req.context}</p>
                    </div>
                    <div>
                      <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">
                        Client System Requirement:
                      </span>
                      <p className="text-slate-700 mt-0.5">{req.clientRequirement}</p>
                    </div>
                  </div>
                </div>

                {/* Response Drawer / Form */}
                {answeringRequestId === req.id ? (
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-900">
                        Provide Technical Answer for Intern {req.internName}:
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Will automatically format into client-friendly language
                      </span>
                    </div>

                    <textarea
                      rows={4}
                      placeholder="e.g. Yes, we can connect to their Dentrix clinic database using a lightweight REST bridge or local sync agent. It syncs appointment slots every 60 seconds with SSL encryption..."
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-hidden"
                    />

                    {/* Audio Recorder simulation */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        {!isRecordingVoice ? (
                          <button
                            type="button"
                            onClick={handleStartRecording}
                            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                          >
                            <Mic className="h-3.5 w-3.5 text-rose-500" />
                            Record CTO Voice Note
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleStopRecording}
                            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white animate-pulse flex items-center gap-1.5"
                          >
                            <Mic className="h-3.5 w-3.5" />
                            Stop Recording ({recordingSeconds}s)
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAnsweringRequestId(null);
                            setAnswerText('');
                          }}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSubmitAnswer(req.id)}
                          className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 flex items-center gap-1.5"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Send to Intern & Timeline
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setAnsweringRequestId(req.id);
                        setAnswerText(
                          `Yes, SaroHub can handle this integration for ${req.businessName}. Our engineering team implements secure API bridges with automated error retries and webhooks.`
                        );
                      }}
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 flex items-center gap-1.5"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Answer Technical Question
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Answered Archive */}
      {activeTab === 'answered' && (
        <div className="space-y-3">
          {answeredRequests.map((req) => (
            <div
              key={req.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{req.businessName}</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  Answered by CTO
                </span>
              </div>
              <p className="text-slate-600 italic">Q: "{req.question}"</p>
              <div className="rounded-lg bg-emerald-50/60 p-3 border border-emerald-100 text-emerald-950 font-medium">
                <span className="font-bold uppercase text-[10px] text-emerald-700 block mb-1">
                  CTO Official Response:
                </span>
                {req.ctoAnswer}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: SaroHub Approved Tech Stack */}
      {activeTab === 'tech_stack' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {knowledgeBase.map((kb) => (
            <div key={kb.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 uppercase">
                  {kb.category}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">{kb.title}</h4>
              <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">{kb.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
