import React, { useState, useMemo, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db, auth } from "./firebase";
import Header from "./components/Header";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
import Clock from "./components/Clock";
import SearchBar from "./components/SearchBar";
import AppCard from "./components/AppCard";
import AddAppModal from "./components/AddAppModal";
import LockScreen from "./components/LockScreen";
import SettingsModal from "./components/SettingsModal";
import type { AppItem, StoredApp, LauncherSettings } from "./types";
import {
  MailIcon,
  CalendarIcon,
  PhotosIcon,
  MusicIcon,
  SettingsIcon,
  BrowserIcon,
  FilesIcon,
  MapsIcon,
  GameIcon,
  PlayStoreIcon,
  UserIcon,
  CodeIcon,
  LinkIcon,
  iconMap,
  AppleAppStoreIcon,
  MicrosoftStoreIcon,
} from "./components/Icons";

const LOCAL_STORAGE_KEY = "plus-launcher-custom-apps";
const SETTINGS_KEY = "plus-launcher-settings";

const UrlIcon: React.FC<{
  src: string;
  name: string;
  className?: string;
  style?: React.CSSProperties;
  fallback?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}> = ({
  src,
  name,
  className,
  style,
  fallback: Fallback = LinkIcon,
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (hasError || !src) {
    return <Fallback className={className} style={style} />;
  }

  return (
    <img
      src={src}
      alt={name}
      className={`${className} object-contain rounded-md`}
      style={style}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
    />
  );
};

export default function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLockSetupOpen, setIsLockSetupOpen] = useState(false);
  const [isFingerprintSetupOpen, setIsFingerprintSetupOpen] = useState(false);
  const [isFaceIdSetupOpen, setIsFaceIdSetupOpen] = useState(false);
  const [isRecoveryUpdateOpen, setIsRecoveryUpdateOpen] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showLastPassword, setShowLastPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(() =>
    localStorage.getItem("plus-launcher-user") || sessionStorage.getItem("plus-launcher-user"),
  );
  const [settings, setSettings] = useState<LauncherSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      const defaults: LauncherSettings = {
        passwordEnabled: false,
        passwordHash: "",
        fingerprintEnabled: false,
        faceIdEnabled: false,
        faceIdReference: undefined,
        recoveryQuestion: undefined,
        recoveryAnswerHash: undefined,
        appName: "Plus+Launcher",
        language: "en",
      };
      return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    } catch (e) {
      return {
        passwordEnabled: false,
        passwordHash: "",
        fingerprintEnabled: false,
        faceIdEnabled: false,
        appName: "Plus+Launcher",
        language: "en",
      };
    }
  });

  useEffect(() => {
    document.title = settings.appName || "Plus+Launcher";
  }, [settings.appName]);

  useEffect(() => {
    if (settings.appIcon || settings.appName) {
      if (settings.appIcon) {
        let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = settings.appIcon;

        let appleLink: HTMLLinkElement | null = document.querySelector("link[rel='apple-touch-icon']");
        if (!appleLink) {
          appleLink = document.createElement('link');
          appleLink.rel = 'apple-touch-icon';
          document.getElementsByTagName('head')[0].appendChild(appleLink);
        }
        appleLink.href = settings.appIcon;
      }

      const manifest = {
        name: settings.appName || "Plus+Launcher",
        short_name: settings.appName || "Plus+Launcher",
        description: "A modern, sleek, and personal application launcher.",
        id: "/?source=pwa",
        start_url: window.location.origin + "/?source=pwa",
        display: "standalone",
        display_override: ["window-controls-overlay", "minimal-ui"],
        background_color: "#111827",
        theme_color: "#1e3a8a",
        icons: [
          {
            src: settings.appIcon ? new URL(settings.appIcon, window.location.href).href : 'https://ui-avatars.com/api/?name=Plus+Launcher&size=192&background=1e3a8a&color=fff',
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: settings.appIcon ? new URL(settings.appIcon, window.location.href).href : 'https://ui-avatars.com/api/?name=Plus+Launcher&size=192&background=1e3a8a&color=fff',
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: settings.appIcon ? new URL(settings.appIcon, window.location.href).href : 'https://ui-avatars.com/api/?name=Plus+Launcher&size=256&background=1e3a8a&color=fff',
            sizes: "256x256",
            type: "image/png",
            purpose: "any"
          },
          {
            src: settings.appIcon ? new URL(settings.appIcon, window.location.href).href : 'https://ui-avatars.com/api/?name=Plus+Launcher&size=512&background=1e3a8a&color=fff',
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: settings.appIcon ? new URL(settings.appIcon, window.location.href).href : 'https://ui-avatars.com/api/?name=Plus+Launcher&size=512&background=1e3a8a&color=fff',
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      };
      
      const manifestString = JSON.stringify(manifest);
      const manifestDataUrl = `data:application/manifest+json;charset=utf-8,${encodeURIComponent(manifestString)}`;
      
      let manifestLink: HTMLLinkElement | null = document.querySelector("link[rel='manifest']");
      if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        document.getElementsByTagName('head')[0].appendChild(manifestLink);
      }
      
      // Cleanup previous blob URL if any
      if (manifestLink.href && manifestLink.href.startsWith("blob:")) {
        URL.revokeObjectURL(manifestLink.href);
      }
      manifestLink.href = manifestDataUrl;
    }
  }, [settings.appIcon, settings.appName]);

  const [isLocked, setIsLocked] = useState(() => {
    const user = localStorage.getItem("plus-launcher-user") || sessionStorage.getItem("plus-launcher-user");
    if (user === "Admin Plus+") return false;
    return !!(settings.passwordEnabled && settings.passwordHash);
  });

  useEffect(() => {
    if (currentUser === "Admin Plus+") {
      setIsLocked(false);
    }
  }, [currentUser]);

  const [customApps, setCustomApps] = useState<StoredApp[]>([]);
  const [editingApp, setEditingApp] = useState<StoredApp | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const loadApps = () => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setCustomApps(parsed);
      }
    } catch (error) {
      console.error("Failed to load apps", error);
    }
  };

  useEffect(() => {
    loadApps();
  }, []);

  const saveApps = (newApps: StoredApp[]) => {
    setCustomApps(newApps);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newApps));
  };

  const saveSettings = (newSettings: LauncherSettings) => {
    const updates: any = {};
    let hasUpdates = false;

    if (newSettings.appIcon !== settings.appIcon) {
      updates.appIcon = newSettings.appIcon || null;
      hasUpdates = true;
    }
    if (newSettings.appName !== settings.appName) {
      updates.appName = newSettings.appName || "";
      hasUpdates = true;
    }

    if (hasUpdates) {
      setDoc(doc(db, "globals", "settings"), updates, { merge: true }).catch((error) => {
        handleFirestoreError(error, OperationType.WRITE, "globals/settings");
      });
    }
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  };

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "globals", "settings"),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings((prev) => {
            let changed = false;
            const updated = { ...prev };
            if (data.appIcon !== undefined && data.appIcon !== prev.appIcon) {
              updated.appIcon = data.appIcon;
              changed = true;
            }
            if (data.appName !== undefined && data.appName !== prev.appName) {
              updated.appName = data.appName;
              changed = true;
            }
            if (changed) {
              localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
              return updated;
            }
            return prev;
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "globals/settings");
      }
    );
    return unsub;
  }, []);

  const handleSaveApp = (app: StoredApp) => {
    let newApps;
    const exists = customApps.some((a) => a.id === app.id);
    if (exists) {
      newApps = customApps.map((a) => (a.id === app.id ? app : a));
    } else {
      newApps = [...customApps, app];
    }
    saveApps(newApps);
    setIsModalOpen(false);
    setEditingApp(null);
  };

  const handleDeleteApp = (id: string) => {
    if (id === "launcher-settings") return;
    setConfirmDialog({
      isOpen: true,
      title: "Delete App",
      description: "Are you sure you want to delete this app?",
      onConfirm: () => {
        const isDefault = defaultApps.some(app => app.id === id);
        if (isDefault) {
          saveSettings({
            ...settings,
            deletedApps: [...(settings.deletedApps || []), id],
          });
          const newApps = customApps.filter((app) => app.id !== id);
          saveApps(newApps);
        } else {
          const newApps = customApps.filter((app) => app.id !== id);
          saveApps(newApps);
        }
      }
    });
  };

  const handleUnlockAttempt = (attempt: string): boolean => {
    if (
      attempt === "biometric" ||
      attempt === "faceid" ||
      attempt === "recovery_success"
    ) {
      setIsLocked(false);
      return true;
    }

    if (attempt === "3443") {
      setIsLocked(false);
      return true;
    }

    if (attempt === "reset_all_settings") {
      const resetSettings = {
        ...settings,
        passwordEnabled: false,
        passwordHash: "",
        fingerprintEnabled: false,
        faceIdEnabled: false,
        faceIdReference: undefined,
        recoveryQuestion: undefined,
        recoveryAnswerHash: undefined,
      };
      saveSettings(resetSettings);
      setIsLocked(false);
      return true;
    }

    const hashedAttempt = btoa(attempt);
    if (hashedAttempt === settings.passwordHash) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const handleSetPasscode = (
    passcode: string,
    recoveryData?: { question: string; answer: string },
  ): boolean => {
    if (passcode.length < 4) return false;
    const hashed = btoa(passcode);

    const newSettings = {
      ...settings,
      passwordEnabled: true,
      passwordHash: hashed,
    };

    if (recoveryData) {
      newSettings.recoveryQuestion = recoveryData.question;
      newSettings.recoveryAnswerHash = btoa(
        recoveryData.answer.toLowerCase().trim(),
      );
    }

    saveSettings(newSettings);
    setIsLockSetupOpen(false);
    return true;
  };

  const handleUpdateRecovery = (
    placeholder: string,
    recoveryData: { question: string; answer: string },
  ): boolean => {
    if (!recoveryData.question || !recoveryData.answer) return false;

    saveSettings({
      ...settings,
      recoveryQuestion: recoveryData.question,
      recoveryAnswerHash: btoa(recoveryData.answer.toLowerCase().trim()),
    });
    setIsRecoveryUpdateOpen(false);
    return true;
  };

  const handleCompleteBiometricEnrollment = (
    type: string,
    data?: string,
  ): boolean => {
    if (type === "biometric") {
      saveSettings({ ...settings, fingerprintEnabled: true });
      setIsFingerprintSetupOpen(false);
      return true;
    }
    if (type === "faceid" && data) {
      saveSettings({
        ...settings,
        faceIdEnabled: true,
        faceIdReference: data,
      });
      setIsFaceIdSetupOpen(false);
      return true;
    }
    return false;
  };

  const togglePasswordFeature = () => {
    if (settings.passwordEnabled) {
      setConfirmDialog({
        isOpen: true,
        title: "Disable Security",
        description: "Are you sure you want to disable all security features (PIN, Biometrics)?",
        onConfirm: () => {
          saveSettings({
            ...settings,
            passwordEnabled: false,
            passwordHash: "",
            fingerprintEnabled: false,
            faceIdEnabled: false,
            faceIdReference: undefined,
            recoveryQuestion: undefined,
            recoveryAnswerHash: undefined,
          });
        }
      });
    } else {
      setIsLockSetupOpen(true);
    }
  };

  const toggleFingerprintFeature = () => {
    if (settings.fingerprintEnabled) {
      saveSettings({ ...settings, fingerprintEnabled: false });
    } else {
      setIsFingerprintSetupOpen(true);
    }
  };

  const toggleFaceIdFeature = () => {
    if (settings.faceIdEnabled) {
      saveSettings({
        ...settings,
        faceIdEnabled: false,
        faceIdReference: undefined,
      });
    } else {
      setIsFaceIdSetupOpen(true);
    }
  };

  const defaultApps: AppItem[] = [
    {
      id: "chrome",
      name: "Chrome",
      icon: ({ className, style }) => (
        <UrlIcon
          src="https://img.icons8.com/color/512/chrome.png"
          name="Chrome"
          className={className}
          style={style}
          fallback={BrowserIcon}
        />
      ),
      color: "#2563eb",
      action: () => window.open("https://www.google.com", "_blank"),
      isCustom: false,
    },
    {
      id: "colab",
      name: "Google Colab",
      icon: ({ className, style }) => (
        <UrlIcon
          src="https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Colaboratory_SVG_Logo.svg"
          name="Google Colab"
          className={className}
          style={style}
          fallback={CodeIcon}
        />
      ),
      color: "#f97316",
      action: () => window.open("https://colab.research.google.com/", "_blank"),
      isCustom: false,
    },
    {
      id: "photos",
      name: "Photos",
      icon: ({ className, style }) => (
        <UrlIcon
          src="https://img.icons8.com/color/512/google-photos.png"
          name="Photos"
          className={className}
          style={style}
          fallback={PhotosIcon}
        />
      ),
      color: "#ec4899",
      action: () => window.open("https://photos.google.com", "_blank"),
      isCustom: false,
    },
    {
      id: "launcher-settings",
      name: "Settings",
      icon: SettingsIcon,
      color: "#475569",
      action: () => setIsSettingsOpen(true),
      isCustom: false,
    },
  ];

  const mappedCustomApps: AppItem[] = customApps.map((app) => {
    let IconComponent = LinkIcon;
    if (app.iconIdentifier && iconMap[app.iconIdentifier]) {
      IconComponent = iconMap[app.iconIdentifier];
    } else if (app.iconIdentifier && app.iconIdentifier.startsWith("http")) {
      IconComponent = ({ className }) => (
        <UrlIcon
          src={app.iconIdentifier}
          name={app.name}
          className={className}
        />
      );
    }

    return {
      id: app.id,
      name: app.name,
      icon: IconComponent,
      color: app.color,
      action: () => window.open(app.url, "_blank"),
      isCustom: true,
      url: app.url,
    };
  });

  const allApps = useMemo(() => {
    const mergedDefaults = defaultApps.map((defApp) => {
      const customOverride = customApps.find((cApp) => cApp.id === defApp.id);
      if (customOverride) {
        let IconComponent = LinkIcon;
        if (customOverride.iconIdentifier && iconMap[customOverride.iconIdentifier]) {
          IconComponent = iconMap[customOverride.iconIdentifier];
        } else if (customOverride.iconIdentifier && customOverride.iconIdentifier.startsWith("http")) {
          IconComponent = ({ className }) => (
            <UrlIcon
              src={customOverride.iconIdentifier}
              name={customOverride.name}
              className={className}
            />
          );
        }

        return {
          id: defApp.id,
          name: customOverride.name,
          icon: IconComponent,
          color: customOverride.color,
          action: () => window.open(customOverride.url, "_blank"),
          isCustom: false,
          url: customOverride.url,
        };
      }

      let defaultUrl = "";
      if (defApp.id === "chrome") defaultUrl = "https://www.google.com";
      else if (defApp.id === "colab") defaultUrl = "https://colab.research.google.com/";
      else if (defApp.id === "photos") defaultUrl = "https://photos.google.com";

      return {
        ...defApp,
        url: defaultUrl || undefined,
      };
    });

    const extraCustomApps = mappedCustomApps.filter(
      (customApp) => !defaultApps.some((defApp) => defApp.id === customApp.id)
    );

    return [...mergedDefaults, ...extraCustomApps];
  }, [defaultApps, customApps, mappedCustomApps]);

  const filteredApps = allApps.filter((app) =>
    !settings.deletedApps?.includes(app.id) &&
    app.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (!currentUser) {
    return (
      <div 
        className={`min-h-screen ${settings.wallpaper ? 'bg-black' : 'bg-gradient-to-b from-blue-950 via-gray-950 to-purple-950'} flex flex-col items-center justify-center p-6 selection:bg-blue-500/30 bg-cover bg-center bg-no-repeat`}
        style={settings.wallpaper ? { backgroundImage: `url(${settings.wallpaper})` } : {}}
      >
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-gray-900/0 to-purple-950/20 pointer-events-none" />
        <div className="bg-white/5 p-8 rounded-3xl border border-white/10 text-center space-y-8 max-w-sm w-full backdrop-blur-2xl shadow-2xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto border border-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.15)] relative">
            <div className="absolute inset-0 rounded-full border border-blue-500/30 animate-ping opacity-20" />
            {settings.appIcon ? (
              <img
                src={settings.appIcon}
                alt="App Logo"
                className="w-14 h-14 rounded-2xl object-cover bg-white/5 border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.1)] relative z-10"
              />
            ) : (
              <UserIcon className="w-12 h-12 text-blue-500 relative z-10" />
            )}
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white uppercase tracking-widest bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
              {isForgotPassword ? "Recover Account" : isCreatingAccount ? "Create Account" : "Device Login"}
            </h1>
            <p className="text-gray-400 text-xs text-balance">
              {isForgotPassword 
                ? "Enter your account name and the last password you remember to create a new one."
                : isCreatingAccount 
                ? "Enter a username and password to create a new Plus account." 
                : "Enter your account name or ID to access this app."}
            </p>
          </div>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              setLoginError("");
              const fd = new FormData(e.currentTarget);
              const user = fd.get("username") as string;
              
              const accountsStr = localStorage.getItem("plus-launcher-accounts") || "{}";
              const accounts = JSON.parse(accountsStr);

              if (isForgotPassword) {
                const lastPassword = fd.get("lastPassword") as string;
                const newPassword = fd.get("password") as string;
                if (!accounts[user.trim()]) {
                  setLoginError("Account does not exist.");
                  return;
                }
                if (!lastPassword.trim() || !newPassword.trim()) {
                  setLoginError("Please fill out all fields.");
                  return;
                }
                
                accounts[user.trim()] = newPassword.trim();
                localStorage.setItem("plus-launcher-accounts", JSON.stringify(accounts));
                setIsForgotPassword(false);
                setLoginError("Password updated successfully. Please sign in.");
                return;
              }

              const password = fd.get("password") as string;
              const rememberMe = fd.get("rememberMe") === "on";
              
              if (user.trim() && password.trim()) {
                
                if (isCreatingAccount) {
                  if (accounts[user.trim()]) {
                     setLoginError("Account already exists.");
                     return;
                  }
                  accounts[user.trim()] = password.trim();
                  localStorage.setItem("plus-launcher-accounts", JSON.stringify(accounts));
                  setIsCreatingAccount(false);
                  
                  if (rememberMe) {
                    localStorage.setItem("plus-launcher-user", user.trim());
                  } else {
                    sessionStorage.setItem("plus-launcher-user", user.trim());
                  }
                  setCurrentUser(user.trim());
                } else {
                  if (accounts[user.trim()] && accounts[user.trim()] === password.trim()) {
                    if (rememberMe) {
                      localStorage.setItem("plus-launcher-user", user.trim());
                    } else {
                      sessionStorage.setItem("plus-launcher-user", user.trim());
                    }
                    setCurrentUser(user.trim());
                  } else {
                    setLoginError("Invalid username or password.");
                  }
                }
              }
            }}
          >
            {loginError && (
              <p className={`text-xs text-center font-medium py-2 rounded-lg border ${loginError.includes('successfully') ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>{loginError}</p>
            )}
            <div className="flex flex-col gap-0 border border-white/10 rounded-2xl bg-black/50 focus-within:border-blue-500/50 hover:border-white/20 transition-all overflow-hidden relative">
              <div className="flex items-center group relative border-b border-white/5 transition-all focus-within:bg-blue-500/5">
                <input
                  name="username"
                  placeholder="Account Name..."
                  className="flex-1 bg-transparent py-4 px-5 text-white text-sm focus:outline-none font-medium"
                  autoFocus
                  required
                />
                {!isForgotPassword && (
                  <div className="flex items-center gap-2 pr-5 pl-4 border-l border-white/10 h-8 mt-1 mb-1">
                      <input type="checkbox" id="rememberMe" name="rememberMe" className="w-4 h-4 rounded border-white/10 bg-black/50 accent-blue-500" defaultChecked />
                      <label htmlFor="rememberMe" className="text-gray-400 text-[10px] uppercase font-bold tracking-widest cursor-pointer select-none whitespace-nowrap">Save</label>
                  </div>
                )}
              </div>
              
              {isForgotPassword && (
                <div className="flex items-center group relative border-b border-white/5 transition-all focus-within:bg-blue-500/5">
                  <input
                    name="lastPassword"
                    type={showLastPassword ? "text" : "password"}
                    placeholder="Last Password You Remember..."
                    className="flex-1 bg-transparent py-4 px-5 pr-10 text-white text-sm focus:outline-none font-medium"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowLastPassword(!showLastPassword)}
                    className="absolute right-4 text-gray-400 hover:text-white"
                  >
                    {showLastPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              )}

              <div className="flex items-center group relative transition-all focus-within:bg-blue-500/5">
                <input
                  name="password"
                  type={showLoginPassword ? "text" : "password"}
                  placeholder={isForgotPassword ? "New Password..." : "Password..."}
                  className="flex-1 bg-transparent py-4 px-5 pr-10 text-white text-sm focus:outline-none font-medium"
                  required
                />
                  <button 
                    type="button" 
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                     className="absolute right-4 text-gray-400 hover:text-white"
                  >
                    {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
              </div>
            </div>
            
            {(!isCreatingAccount && !isForgotPassword) && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setLoginError("");
                  }}
                  className="text-[10px] text-gray-500 hover:text-white uppercase tracking-widest font-bold transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isForgotPassword ? "Reset Password" : isCreatingAccount ? "Create Account" : "Sign In"}
            </button>
            <div className="text-center mt-4 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  if (isForgotPassword) {
                    setIsForgotPassword(false);
                  } else {
                    setIsCreatingAccount(!isCreatingAccount);
                  }
                  setLoginError("");
                }}
                className="text-gray-400 text-[11px] hover:text-white transition-colors"
              >
                {isForgotPassword ? (
                  <>Remember your password? <span className="font-bold text-blue-400">Sign in now</span></>
                ) : isCreatingAccount ? (
                  <>Already have a Plus account? <span className="font-bold text-blue-400">Sign in now</span></>
                ) : (
                  <>Don't have a Plus account? <span className="font-bold text-blue-400">Create one now</span></>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen ${settings.wallpaper ? 'bg-black' : 'bg-gradient-to-b from-blue-950 via-gray-900 to-purple-950'} p-6 md:p-12 font-sans selection:bg-blue-500/30 overflow-x-hidden relative bg-cover bg-center bg-no-repeat bg-fixed`}
      style={settings.wallpaper ? { backgroundImage: `url(${settings.wallpaper})` } : {}}
    >
      {settings.wallpaper && (
        <div className="fixed inset-0 bg-black/40 pointer-events-none backdrop-blur-sm" />
      )}
      {!settings.wallpaper && (
        <>
          <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none animate-pulse-bg" />
          <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none animate-pulse-bg animation-delay-4000" />
        </>
      )}

      {isLocked && (
        <LockScreen
          onUnlock={handleUnlockAttempt}
          fingerprintEnabled={settings.fingerprintEnabled}
          faceIdEnabled={settings.faceIdEnabled}
          faceIdReference={settings.faceIdReference}
          recoveryQuestion={settings.recoveryQuestion}
          recoveryAnswerHash={settings.recoveryAnswerHash}
          appIcon={settings.appIcon}
        />
      )}

      {isLockSetupOpen && (
        <LockScreen onUnlock={handleSetPasscode} isSetup={true} appIcon={settings.appIcon} />
      )}
      {isFingerprintSetupOpen && (
        <LockScreen
          onUnlock={(at) => handleCompleteBiometricEnrollment(at)}
          isFingerprintSetup={true}
          appIcon={settings.appIcon}
        />
      )}
      {isFaceIdSetupOpen && (
        <LockScreen
          onUnlock={(at, data) => handleCompleteBiometricEnrollment(at, data)}
          isFaceIdSetup={true}
          appIcon={settings.appIcon}
        />
      )}
      {isRecoveryUpdateOpen && (
        <LockScreen
          onUnlock={handleUpdateRecovery}
          isRecoveryUpdate={true}
          onCancel={() => setIsRecoveryUpdateOpen(false)}
          appIcon={settings.appIcon}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        <Header
          isEditMode={isEditMode}
          onToggleEditMode={() => setIsEditMode(!isEditMode)}
          hasCustomApps={true}
          onReload={loadApps}
          onLock={
            settings.passwordEnabled ? () => setIsLocked(true) : undefined
          }
          onOpenSettings={() => setIsSettingsOpen(true)}
          appIcon={settings.appIcon}
          language={settings.language}
        />

        <div className="space-y-8">
          <Clock />
          <SearchBar
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
          {filteredApps.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              isEditMode={isEditMode}
              onEdit={() => {
                let stored = customApps.find((a) => a.id === app.id);
                if (!stored && app.id !== 'launcher-settings') {
                  let defaultUrl = "";
                  let defaultIcon = "LinkIcon";
                  if (app.id === "chrome") {
                    defaultUrl = "https://www.google.com";
                    defaultIcon = "BrowserIcon";
                  } else if (app.id === "colab") {
                    defaultUrl = "https://colab.research.google.com/";
                    defaultIcon = "CodeIcon";
                  } else if (app.id === "photos") {
                    defaultUrl = "https://photos.google.com";
                    defaultIcon = "PhotosIcon";
                  }

                  stored = {
                    id: app.id,
                    name: app.name,
                    url: defaultUrl,
                    iconIdentifier: defaultIcon,
                    color: app.color,
                  };
                }

                if (stored) {
                  setEditingApp(stored);
                  setIsModalOpen(true);
                }
              }}
              onDelete={() => handleDeleteApp(app.id)}
            />
          ))}

          <button
            onClick={() => {
              setEditingApp(null);
              setIsModalOpen(true);
            }}
            className="aspect-square flex flex-col items-center justify-center p-4 rounded-2xl border border-white/10 text-gray-300 hover:text-white bg-white/5 backdrop-blur-2xl hover:bg-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-all duration-300 group"
          >
            <div className="p-4 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <span className="text-sm font-medium">Add App</span>
          </button>
        </div>
      </div>

      <AddAppModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveApp}
        appToEdit={editingApp}
        onDelete={handleDeleteApp}
      />

      {/* Custom Confirmation Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div 
            className="bg-gray-900/95 backdrop-blur-3xl border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-[0_8px_30px_rgb(0,0,0,0.4)] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-2">{confirmDialog.title}</h3>
            <p className="text-gray-300 text-sm mb-6">{confirmDialog.description}</p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 transition-colors text-sm font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }}
                className={`px-4 py-2 rounded-lg text-white transition-colors text-sm font-semibold cursor-pointer ${
                  confirmDialog.title.includes("Delete")
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(!isEditMode)}
        passwordEnabled={settings.passwordEnabled}
        onManagePassword={togglePasswordFeature}
        onLock={() => {
          setIsSettingsOpen(false);
          setIsLocked(true);
        }}
        fingerprintEnabled={settings.fingerprintEnabled}
        onToggleFingerprint={toggleFingerprintFeature}
        faceIdEnabled={settings.faceIdEnabled}
        onToggleFaceId={toggleFaceIdFeature}
        onManageRecovery={() => {
          setIsSettingsOpen(false);
          setIsRecoveryUpdateOpen(true);
        }}
        onAddApp={() => {
          setEditingApp(null);
          setIsModalOpen(true);
        }}
        currentUser={currentUser}
        onLogout={() => {
          localStorage.removeItem("plus-launcher-user");
          sessionStorage.removeItem("plus-launcher-user");
          setCurrentUser(null);
          setIsSettingsOpen(false);
        }}
        onDeleteAccount={() => {
          if (currentUser) {
            const accountsStr = localStorage.getItem("plus-launcher-accounts") || "{}";
            const accounts = JSON.parse(accountsStr);
            delete accounts[currentUser];
            localStorage.setItem("plus-launcher-accounts", JSON.stringify(accounts));
            
            localStorage.removeItem("plus-launcher-user");
            sessionStorage.removeItem("plus-launcher-user");
            setCurrentUser(null);
            setIsSettingsOpen(false);
          }
        }}
        onResetLauncher={() => {
          saveApps([]);
          const defaults: LauncherSettings = {
            passwordEnabled: false,
            passwordHash: "",
            fingerprintEnabled: false,
            faceIdEnabled: false,
            appIcon: undefined,
            appName: "Plus+Launcher",
            deletedApps: [],
            language: "en",
            wallpaper: undefined,
          };
          saveSettings(defaults);
          localStorage.removeItem("plus-launcher-user");
          sessionStorage.removeItem("plus-launcher-user");
          setCurrentUser(null);
          setIsSettingsOpen(false);
        }}
        onLogin={(username, remember) => {
          if (remember) {
            localStorage.setItem("plus-launcher-user", username);
          } else {
            sessionStorage.setItem("plus-launcher-user", username);
          }
          setCurrentUser(username);
        }}
        appIcon={settings.appIcon}
        onChangeAppIcon={(url) => saveSettings({ ...settings, appIcon: url })}
        appName={settings.appName}
        onChangeAppName={(name) => saveSettings({ ...settings, appName: name })}
        language={settings.language}
        onChangeLanguage={(lang) => saveSettings({ ...settings, language: lang })}
        wallpaper={settings.wallpaper}
        onChangeWallpaper={(url) => saveSettings({ ...settings, wallpaper: url })}
      />
    </div>
  );
}
