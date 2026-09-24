import React, { useState } from 'react';
import { CRMProvider, useCRM } from './context/CRMContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { InternDashboard } from './components/InternDashboard';
import { CeoDashboard } from './components/CeoDashboard';
import { CtoDashboard } from './components/CtoDashboard';
import { LeadDetailPage } from './components/LeadDetailPage';
import { PipelineView } from './components/PipelineView';
import { FollowUpCenter } from './components/FollowUpCenter';
import { HandoverCenterView } from './components/HandoverCenterView';
import { CheckLeadModal } from './components/CheckLeadModal';
import { NewLeadModal } from './components/NewLeadModal';
import { CommandPalette } from './components/CommandPalette';
import { MessageTemplatesView } from './components/MessageTemplatesView';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { SettingsView } from './components/SettingsView';
import { AuditLogsView } from './components/AuditLogsView';
import { ReportsView } from './components/ReportsView';
import { LeadsListView } from './components/LeadsListView';
import { AiSalesAssistantModal } from './components/AiSalesAssistantModal';
import { CreateInternModal } from './components/CreateInternModal';
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  KanbanSquare,
  Clock,
  Sparkles,
  Layers,
  ArrowRightLeft,
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const {
    currentUser,
    selectedLeadId,
    setSelectedLeadId,
    isCheckLeadModalOpen,
    setIsCheckLeadModalOpen,
    isNewLeadModalOpen,
    setIsNewLeadModalOpen,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
  } = useCRM();

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [prefillPhoneNumber, setPrefillPhoneNumber] = useState<string>('');
  const [isStandaloneAiOpen, setIsStandaloneAiOpen] = useState(false);

  const handleOpenCreateWithNumber = (phone: string) => {
    setPrefillPhoneNumber(phone);
    setIsNewLeadModalOpen(true);
  };

  const renderActiveView = () => {
    // If a lead is selected, render the detailed lead workspace
    if (selectedLeadId) {
      return (
        <LeadDetailPage
          leadId={selectedLeadId}
          onBack={() => setSelectedLeadId(null)}
        />
      );
    }

    switch (currentTab) {
      case 'dashboard':
        if (currentUser.role === 'intern') {
          return (
            <InternDashboard
              onSelectLead={(id) => setSelectedLeadId(id)}
              onOpenNewLead={() => setIsNewLeadModalOpen(true)}
              onOpenCheckLead={() => setIsCheckLeadModalOpen(true)}
            />
          );
        } else if (currentUser.role === 'cto') {
          return <CtoDashboard onSelectLead={(id) => setSelectedLeadId(id)} />;
        } else {
          return (
            <CeoDashboard
              onSelectLead={(id) => setSelectedLeadId(id)}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          );
        }

      case 'check_lead':
        return (
          <div className="p-4">
            <CheckLeadModal
              isOpen={true}
              onClose={() => setCurrentTab('dashboard')}
              onOpenCreateWithNumber={handleOpenCreateWithNumber}
            />
          </div>
        );

      case 'leads':
        return (
          <LeadsListView
            onSelectLead={(id) => setSelectedLeadId(id)}
            onOpenNewLead={() => setIsNewLeadModalOpen(true)}
            onOpenCheckLead={() => setIsCheckLeadModalOpen(true)}
          />
        );

      case 'pipeline':
        return (
          <PipelineView
            onSelectLead={(id) => setSelectedLeadId(id)}
            onOpenNewLead={() => setIsNewLeadModalOpen(true)}
          />
        );

      case 'follow_ups':
        return <FollowUpCenter onSelectLead={(id) => setSelectedLeadId(id)} />;

      case 'technical_queue':
        return <CtoDashboard onSelectLead={(id) => setSelectedLeadId(id)} />;

      case 'handover_center':
        return <HandoverCenterView onSelectLead={(id) => setSelectedLeadId(id)} />;

      case 'ai_assistant':
        return (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                SaroHub Sales & Technical AI Copilot
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Launch the assistant to draft messages, handle prospect objections, simplify technical specs, or review sales guardrails.
              </p>
              <div className="mt-4">
                <button
                  onClick={() => setIsStandaloneAiOpen(true)}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Open AI Assistant Tool
                </button>
              </div>
            </div>

            <KnowledgeBaseView />
          </div>
        );

      case 'templates':
        return <MessageTemplatesView />;

      case 'knowledge_base':
        return <KnowledgeBaseView />;

      case 'team_activity':
        return (
          <CeoDashboard
            onSelectLead={(id) => setSelectedLeadId(id)}
            onNavigateTab={(tab) => setCurrentTab(tab)}
          />
        );

      case 'reports':
        return <ReportsView />;

      case 'settings':
        return <SettingsView />;

      case 'audit_logs':
        return <AuditLogsView />;

      default:
        return (
          <InternDashboard
            onSelectLead={(id) => setSelectedLeadId(id)}
            onOpenNewLead={() => setIsNewLeadModalOpen(true)}
            onOpenCheckLead={() => setIsCheckLeadModalOpen(true)}
          />
        );
    }
  };

  return (
    <div className="flex h-screen flex-col bg-slate-100 text-slate-900 font-sans antialiased overflow-hidden">
      {/* Top Navbar */}
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Workspace Frame */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

        {/* Dynamic Center Stage */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 lg:p-7">
          <div className="max-w-7xl mx-auto">{renderActiveView()}</div>
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="flex lg:hidden items-center justify-around border-t border-slate-200 bg-white py-2 px-1 text-[10px] text-slate-600 shrink-0">
        <button
          onClick={() => {
            setSelectedLeadId(null);
            setCurrentTab('dashboard');
          }}
          className={`flex flex-col items-center gap-0.5 ${currentTab === 'dashboard' ? 'text-emerald-600 font-bold' : ''}`}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setIsCheckLeadModalOpen(true)}
          className="flex flex-col items-center gap-0.5 text-emerald-700 font-bold"
        >
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Check</span>
        </button>

        <button
          onClick={() => {
            setSelectedLeadId(null);
            setCurrentTab('leads');
          }}
          className={`flex flex-col items-center gap-0.5 ${currentTab === 'leads' ? 'text-emerald-600 font-bold' : ''}`}
        >
          <Users className="h-4 w-4" />
          <span>Leads</span>
        </button>

        <button
          onClick={() => {
            setSelectedLeadId(null);
            setCurrentTab('pipeline');
          }}
          className={`flex flex-col items-center gap-0.5 ${currentTab === 'pipeline' ? 'text-emerald-600 font-bold' : ''}`}
        >
          <KanbanSquare className="h-4 w-4" />
          <span>Pipeline</span>
        </button>

        <button
          onClick={() => {
            setSelectedLeadId(null);
            setCurrentTab('follow_ups');
          }}
          className={`flex flex-col items-center gap-0.5 ${currentTab === 'follow_ups' ? 'text-emerald-600 font-bold' : ''}`}
        >
          <Clock className="h-4 w-4" />
          <span>Tasks</span>
        </button>
      </nav>

      {/* Global Modals */}
      <CheckLeadModal
        isOpen={isCheckLeadModalOpen}
        onClose={() => setIsCheckLeadModalOpen(false)}
        onOpenCreateWithNumber={handleOpenCreateWithNumber}
      />

      <NewLeadModal
        isOpen={isNewLeadModalOpen}
        onClose={() => {
          setIsNewLeadModalOpen(false);
          setPrefillPhoneNumber('');
        }}
        prefillPhone={prefillPhoneNumber}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateTab={(tab) => {
          setSelectedLeadId(null);
          setCurrentTab(tab);
        }}
        onSelectLead={(id) => setSelectedLeadId(id)}
      />

      {isStandaloneAiOpen && (
        <AiSalesAssistantModal
          isOpen={isStandaloneAiOpen}
          onClose={() => setIsStandaloneAiOpen(false)}
        />
      )}

      <CreateInternModal />
    </div>
  );
};

export default function App() {
  return (
    <CRMProvider>
      <MainAppContent />
    </CRMProvider>
  );
}
