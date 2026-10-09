import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useGuestStore } from '../store/guestStore';

// Screens - Auth & Onboarding
import { SplashScreen } from '../screens/splash/SplashScreen';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { ConsentModal } from '../screens/onboarding/ConsentModal';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { GuestLimitModal } from '../screens/auth/GuestLimitModal';
import { ComponentGalleryScreen } from '../screens/dev/ComponentGalleryScreen';

// Core Tabs (Phase 3 & 5)
import { HomeScreen } from '../screens/home/HomeScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { ToolsScreen } from '../screens/tools/ToolsScreen';
import { HistoryScreen } from '../screens/chat/HistoryScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { TabBar, TabRoute } from '../components/ui/TabBar';

// Legal Sub-Screens (Phase 4 & 5)
import { IpcBnsConverterScreen } from '../screens/tools/IpcBnsConverterScreen';
import { FirGuideScreen } from '../screens/tools/FirGuideScreen';
import { KnowYourRightsScreen } from '../screens/tools/KnowYourRightsScreen';
import { LegalSearchScreen } from '../screens/tools/LegalSearchScreen';
import { CyberFraudScreen } from '../screens/tools/CyberFraudScreen';
import { ScenarioGuidesScreen } from '../screens/tools/ScenarioGuidesScreen';
import { LegalGlossaryScreen } from '../screens/tools/LegalGlossaryScreen';
import { LegalDocumentsScreen } from '../screens/tools/LegalDocumentsScreen';
import { DocumentAnalysisScreen } from '../screens/tools/DocumentAnalysisScreen';
import { CaseTrackerScreen } from '../screens/tools/CaseTrackerScreen';
import { LegalAidScreen } from '../screens/tools/LegalAidScreen';
import { SavedLibraryScreen } from '../screens/tools/SavedLibraryScreen';
import { AdminPortalScreen } from '../screens/admin/AdminPortalScreen';

type AuthView = 'login' | 'signup' | 'forgot';
type LegalSubScreen =
  | 'ipc-bns'
  | 'fir-guide'
  | 'know-rights'
  | 'legal-search'
  | 'cyber-fraud'
  | 'scenario-guides'
  | 'legal-glossary'
  | 'legal-documents'
  | 'doc-analysis'
  | 'case-tracker'
  | 'legal-aid'
  | 'saved-library'
  | 'admin-portal'
  | null;

export const RootNavigator: React.FC = () => {
  const [isSplashDone, setIsSplashDone] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [activeTab, setActiveTab] = useState<TabRoute>('home');
  const [activeSubScreen, setActiveSubScreen] = useState<LegalSubScreen>(null);
  const [chatInitialQuery, setChatInitialQuery] = useState<string | undefined>(undefined);
  const [showGallery, setShowGallery] = useState(false);

  const { isAuthenticated, isGuest, startGuestSession, logout } = useAuthStore();
  const {
    hasSeenOnboarding,
    hasAcceptedConsent,
    setOnboardingDone,
    setConsentAccepted,
  } = useSettingsStore();
  const { isLimitReached, remainingQueries } = useGuestStore();

  const [showLimitModal, setShowLimitModal] = useState(false);

  // 1. Show Splash screen during startup
  if (!isSplashDone) {
    return <SplashScreen onFinish={() => setIsSplashDone(true)} />;
  }

  // 2. Show Onboarding on first run
  if (!hasSeenOnboarding) {
    return <OnboardingScreen onComplete={setOnboardingDone} />;
  }

  // 3. Main Authenticated / Guest App Flow
  const isInApp = isAuthenticated || isGuest;

  if (isInApp) {
    // Check if a dedicated legal tool sub-screen is active
    if (activeSubScreen) {
      switch (activeSubScreen) {
        case 'ipc-bns':
          return <IpcBnsConverterScreen onBack={() => setActiveSubScreen(null)} />;
        case 'fir-guide':
          return <FirGuideScreen onBack={() => setActiveSubScreen(null)} />;
        case 'know-rights':
          return <KnowYourRightsScreen onBack={() => setActiveSubScreen(null)} />;
        case 'legal-search':
          return <LegalSearchScreen onBack={() => setActiveSubScreen(null)} />;
        case 'cyber-fraud':
          return <CyberFraudScreen onBack={() => setActiveSubScreen(null)} />;
        case 'scenario-guides':
          return <ScenarioGuidesScreen onBack={() => setActiveSubScreen(null)} />;
        case 'legal-glossary':
          return <LegalGlossaryScreen onBack={() => setActiveSubScreen(null)} />;
        case 'legal-documents':
          return (
            <LegalDocumentsScreen
              onBack={() => setActiveSubScreen(null)}
              onOpenSavedLibrary={() => setActiveSubScreen('saved-library')}
            />
          );
        case 'doc-analysis':
          return (
            <DocumentAnalysisScreen
              onBack={() => setActiveSubScreen(null)}
              onOpenSavedLibrary={() => setActiveSubScreen('saved-library')}
            />
          );
        case 'case-tracker':
          return <CaseTrackerScreen onBack={() => setActiveSubScreen(null)} />;
        case 'legal-aid':
          return <LegalAidScreen onBack={() => setActiveSubScreen(null)} />;
        case 'saved-library':
          return (
            <SavedLibraryScreen
              onBack={() => setActiveSubScreen(null)}
              onOpenDraft={() => setActiveSubScreen('legal-documents')}
            />
          );
        case 'admin-portal':
          return <AdminPortalScreen onBack={() => setActiveSubScreen(null)} />;
      }
    }

    const handleNavigateTools = (toolId?: string) => {
      if (!toolId) {
        setActiveTab('tools');
        return;
      }
      // Normalize aliases from Home and Tools
      if (toolId === 'fir' || toolId === 'fir-guide') {
        setActiveSubScreen('fir-guide');
      } else if (toolId === 'rights' || toolId === 'know-rights') {
        setActiveSubScreen('know-rights');
      } else if (toolId === 'bns' || toolId === 'ipc' || toolId === 'ipc-bns') {
        setActiveSubScreen('ipc-bns');
      } else if (toolId === 'cyber' || toolId === 'cyber-fraud') {
        setActiveSubScreen('cyber-fraud');
      } else if (toolId === 'search' || toolId === 'legal-search') {
        setActiveSubScreen('legal-search');
      } else if (toolId === 'glossary' || toolId === 'legal-glossary') {
        setActiveSubScreen('legal-glossary');
      } else if (toolId === 'scenarios' || toolId === 'scenario-guides') {
        setActiveSubScreen('scenario-guides');
      } else if (toolId === 'legal-documents' || toolId === 'documents' || toolId === 'docs') {
        setActiveSubScreen('legal-documents');
      } else if (toolId === 'doc-analysis' || toolId === 'analysis') {
        setActiveSubScreen('doc-analysis');
      } else if (toolId === 'case-tracker' || toolId === 'case' || toolId === 'tracker') {
        setActiveSubScreen('case-tracker');
      } else if (toolId === 'legal-aid' || toolId === 'aid' || toolId === 'nalsa') {
        setActiveSubScreen('legal-aid');
      } else if (toolId === 'saved-library' || toolId === 'saved' || toolId === 'library') {
        setActiveSubScreen('saved-library');
      } else if (toolId === 'admin-portal' || toolId === 'admin') {
        setActiveSubScreen('admin-portal');
      } else {
        setActiveTab('tools');
      }
    };

    return (
      <View style={styles.appContainer}>
        {/* Render Active Tab Screen or Dev Gallery */}
        {showGallery ? (
          <ComponentGalleryScreen />
        ) : activeTab === 'home' ? (
          <HomeScreen
            onNavigateChat={(initialQuery) => {
              setChatInitialQuery(initialQuery);
              setActiveTab('chat');
            }}
            onNavigateTools={handleNavigateTools}
            onOpenProfile={() => setActiveTab('profile')}
          />
        ) : activeTab === 'chat' ? (
          <ChatScreen
            initialQuery={chatInitialQuery}
            onBack={() => {
              setChatInitialQuery(undefined);
              setActiveTab('home');
            }}
            onOpenGuestLimitModal={() => setShowLimitModal(true)}
          />
        ) : activeTab === 'tools' ? (
          <ToolsScreen
            onSelectTool={(toolId) => handleNavigateTools(toolId)}
            onOpenProfile={() => setActiveTab('profile')}
          />
        ) : activeTab === 'history' ? (
          <HistoryScreen
            onResumeChat={(query) => {
              setChatInitialQuery(query);
              setActiveTab('chat');
            }}
            onNewChat={() => {
              setChatInitialQuery(undefined);
              setActiveTab('chat');
            }}
          />
        ) : (
          <ProfileScreen
            onNavigateAdmin={() => setActiveSubScreen('admin-portal')}
            onNavigateLogin={() => {
              setActiveTab('home');
              setAuthView('login');
            }}
          />
        )}

        {/* Persistent Bottom Tab Bar */}
        <TabBar
          activeTab={activeTab}
          onTabPress={(tab) => {
            setShowGallery(false);
            setActiveTab(tab);
          }}
        />

        {/* First Run Statutory Consent Modal */}
        <ConsentModal
          visible={!hasAcceptedConsent}
          onAccept={setConsentAccepted}
        />

        {/* Guest Limit Modal if quota is depleted */}
        <GuestLimitModal
          visible={isGuest && showLimitModal}
          onClose={() => setShowLimitModal(false)}
          onResetDemo={() => {
            useGuestStore.getState().resetQuota();
            setShowLimitModal(false);
          }}
          onSignUp={() => {
            setShowLimitModal(false);
            logout();
            setAuthView('signup');
          }}
          onLogin={() => {
            setShowLimitModal(false);
            logout();
            setAuthView('login');
          }}
        />
      </View>
    );
  }

  // 4. Auth Stack (Login, Sign Up, Forgot Password)
  return (
    <View style={styles.authContainer}>
      {authView === 'login' ? (
        <LoginScreen
          onNavigateSignUp={() => setAuthView('signup')}
          onNavigateForgotPassword={() => setAuthView('forgot')}
          onExploreGuest={startGuestSession}
        />
      ) : authView === 'signup' ? (
        <SignUpScreen
          onNavigateLogin={() => setAuthView('login')}
          onExploreGuest={startGuestSession}
        />
      ) : (
        <ForgotPasswordScreen onBack={() => setAuthView('login')} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  authContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
