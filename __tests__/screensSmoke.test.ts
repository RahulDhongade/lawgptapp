import React from 'react';

jest.mock('react-native', () => {
  const ReactMock = require('react');
  return {
    Platform: { OS: 'android', select: (obj: any) => obj.android || obj.default },
    View: (props: any) => ReactMock.createElement('View', props, props.children),
    Text: (props: any) => ReactMock.createElement('Text', props, props.children),
    TextInput: (props: any) => ReactMock.createElement('TextInput', props, props.children),
    TouchableOpacity: (props: any) => ReactMock.createElement('TouchableOpacity', props, props.children),
    ScrollView: (props: any) => ReactMock.createElement('ScrollView', props, props.children),
    SafeAreaView: (props: any) => ReactMock.createElement('SafeAreaView', props, props.children),
    StatusBar: () => null,
    ActivityIndicator: () => null,
    Alert: { alert: jest.fn() },
    StyleSheet: { create: (styles: any) => styles },
    Share: { share: jest.fn().mockResolvedValue({ action: 'sharedAction' }) },
  };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => () => {}),
  fetch: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true }),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('mock_notif_123'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' },
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn().mockResolvedValue(true),
  isEnrolledAsync: jest.fn().mockResolvedValue(true),
  authenticateAsync: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn().mockResolvedValue({ uri: 'file://mock/draft.pdf' }),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn().mockResolvedValue(false),
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(true),
  getStringAsync: jest.fn().mockResolvedValue(''),
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn().mockResolvedValue({ canceled: true }),
}));

jest.mock('expo-image-picker', () => ({
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
}));

jest.mock('react-native-svg', () => {
  const ReactMock = require('react');
  return {
    Svg: (props: any) => ReactMock.createElement('Svg', props, props.children),
    Path: (props: any) => ReactMock.createElement('Path', props),
    Circle: (props: any) => ReactMock.createElement('Circle', props),
    Rect: (props: any) => ReactMock.createElement('Rect', props),
  };
});

jest.mock('lucide-react-native', () => {
  const ReactMock = require('react');
  return new Proxy(
    {},
    {
      get: (_target, prop) => {
        const MockIcon = (props: any) =>
          ReactMock.createElement('Icon', { name: String(prop), ...props });
        MockIcon.displayName = String(prop);
        return MockIcon;
      },
    }
  );
});

// Import Screens
import { HomeScreen } from '../src/screens/home/HomeScreen';
import { ChatScreen } from '../src/screens/chat/ChatScreen';
import { HistoryScreen } from '../src/screens/chat/HistoryScreen';
import { ToolsScreen } from '../src/screens/tools/ToolsScreen';
import { IpcBnsConverterScreen } from '../src/screens/tools/IpcBnsConverterScreen';
import { FirGuideScreen } from '../src/screens/tools/FirGuideScreen';
import { CyberFraudScreen } from '../src/screens/tools/CyberFraudScreen';
import { LegalGlossaryScreen } from '../src/screens/tools/LegalGlossaryScreen';
import { LegalSearchScreen } from '../src/screens/tools/LegalSearchScreen';
import { ScenarioGuidesScreen } from '../src/screens/tools/ScenarioGuidesScreen';
import { KnowYourRightsScreen } from '../src/screens/tools/KnowYourRightsScreen';
import { LegalDocumentsScreen } from '../src/screens/tools/LegalDocumentsScreen';
import { DocumentAnalysisScreen } from '../src/screens/tools/DocumentAnalysisScreen';
import { CaseTrackerScreen } from '../src/screens/tools/CaseTrackerScreen';
import { SavedLibraryScreen } from '../src/screens/tools/SavedLibraryScreen';
import { LegalAidScreen } from '../src/screens/tools/LegalAidScreen';
import { AdminPortalScreen } from '../src/screens/admin/AdminPortalScreen';
import { ProfileScreen } from '../src/screens/profile/ProfileScreen';
import { LoginScreen } from '../src/screens/auth/LoginScreen';
import { SignUpScreen } from '../src/screens/auth/SignUpScreen';
import { ForgotPasswordScreen } from '../src/screens/auth/ForgotPasswordScreen';
import { SplashScreen } from '../src/screens/splash/SplashScreen';

describe('Screen Smoke Test Suite', () => {
  it('instantiates HomeScreen without crashing', () => {
    const element = React.createElement(HomeScreen, {
      onNavigateChat: jest.fn(),
      onNavigateTools: jest.fn(),
      onOpenProfile: jest.fn(),
    });
    expect(element).toBeDefined();
    expect(element.type).toBe(HomeScreen);
  });

  it('instantiates ChatScreen without crashing', () => {
    const element = React.createElement(ChatScreen, {
      initialQuery: 'Arrest rights',
      onBack: jest.fn(),
      onOpenGuestLimitModal: jest.fn(),
    });
    expect(element).toBeDefined();
    expect(element.type).toBe(ChatScreen);
  });

  it('instantiates HistoryScreen without crashing', () => {
    const element = React.createElement(HistoryScreen, {
      onResumeChat: jest.fn(),
      onNewChat: jest.fn(),
    });
    expect(element).toBeDefined();
    expect(element.type).toBe(HistoryScreen);
  });

  it('instantiates ToolsScreen without crashing', () => {
    const element = React.createElement(ToolsScreen, {
      onSelectTool: jest.fn(),
      onOpenProfile: jest.fn(),
    });
    expect(element).toBeDefined();
    expect(element.type).toBe(ToolsScreen);
  });

  it('instantiates LegalDocumentsScreen without crashing', () => {
    const element = React.createElement(LegalDocumentsScreen, {
      onBack: jest.fn(),
    });
    expect(element).toBeDefined();
    expect(element.type).toBe(LegalDocumentsScreen);
  });

  it('instantiates DocumentAnalysisScreen without crashing', () => {
    const element = React.createElement(DocumentAnalysisScreen, {
      onBack: jest.fn(),
    });
    expect(element).toBeDefined();
    expect(element.type).toBe(DocumentAnalysisScreen);
  });

  it('instantiates CaseTrackerScreen without crashing', () => {
    const element = React.createElement(CaseTrackerScreen, {
      onBack: jest.fn(),
    });
    expect(element).toBeDefined();
    expect(element.type).toBe(CaseTrackerScreen);
  });

  it('instantiates SavedLibraryScreen without crashing', () => {
    const element = React.createElement(SavedLibraryScreen, {
      onBack: jest.fn(),
      onOpenDraft: jest.fn(),
    });
    expect(element).toBeDefined();
    expect(element.type).toBe(SavedLibraryScreen);
  });

  it('instantiates LegalAidScreen without crashing', () => {
    const element = React.createElement(LegalAidScreen, {
      onBack: jest.fn(),
    });
    expect(element).toBeDefined();
    expect(element.type).toBe(LegalAidScreen);
  });

  it('instantiates AdminPortalScreen without crashing', () => {
    const element = React.createElement(AdminPortalScreen, {
      onBack: jest.fn(),
    });
    expect(element).toBeDefined();
    expect(element.type).toBe(AdminPortalScreen);
  });

  it('instantiates ProfileScreen without crashing', () => {
    const element = React.createElement(ProfileScreen, {
      onNavigateAdmin: jest.fn(),
      onNavigateLogin: jest.fn(),
    });
    expect(element).toBeDefined();
    expect(element.type).toBe(ProfileScreen);
  });

  it('instantiates Auth and Onboarding Screens without crashing', () => {
    expect(
      React.createElement(LoginScreen, {
        onNavigateSignUp: jest.fn(),
        onNavigateForgotPassword: jest.fn(),
        onExploreGuest: jest.fn(),
      })
    ).toBeDefined();
    expect(
      React.createElement(SignUpScreen, {
        onNavigateLogin: jest.fn(),
        onExploreGuest: jest.fn(),
      })
    ).toBeDefined();
    expect(React.createElement(ForgotPasswordScreen, { onBack: jest.fn() })).toBeDefined();
    expect(React.createElement(SplashScreen, { onFinish: jest.fn() })).toBeDefined();
  });

  it('instantiates Tool Detail Screens without crashing', () => {
    expect(React.createElement(IpcBnsConverterScreen, { onBack: jest.fn() })).toBeDefined();
    expect(React.createElement(FirGuideScreen, { onBack: jest.fn() })).toBeDefined();
    expect(React.createElement(CyberFraudScreen, { onBack: jest.fn() })).toBeDefined();
    expect(React.createElement(LegalGlossaryScreen, { onBack: jest.fn() })).toBeDefined();
    expect(React.createElement(LegalSearchScreen, { onBack: jest.fn() })).toBeDefined();
    expect(React.createElement(ScenarioGuidesScreen, { onBack: jest.fn() })).toBeDefined();
    expect(React.createElement(KnowYourRightsScreen, { onBack: jest.fn() })).toBeDefined();
  });
});
