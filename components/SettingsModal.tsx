import React from "react";
import { t } from "../i18n";
import {
  LockIcon,
  ShieldCheckIcon,
  FingerprintIcon,
  FaceIdIcon,
  MailIcon,
} from "./Icons";
import AdminFeedbackViewer from "./AdminFeedbackViewer";
import { submitFeedback, FeedbackCategory } from "../services/feedbackService";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  passwordEnabled: boolean;
  onManagePassword: () => void;
  patternEnabled?: boolean;
  onManagePattern?: () => void;
  onLock: () => void;
  fingerprintEnabled?: boolean;
  onToggleFingerprint?: () => void;
  faceIdEnabled?: boolean;
  onToggleFaceId?: () => void;
  onManageRecovery?: () => void;
  onAddApp?: () => void;
  currentUser?: string | null;
  onLogout?: () => void;
  onDeleteAccount?: () => void;
  onLogin?: (username: string, remember: boolean) => void;
  appIcon?: string;
  onChangeAppIcon?: (url: string) => void;
  appName?: string;
  onChangeAppName?: (name: string) => void;
  language?: string;
  onChangeLanguage?: (lang: string) => void;
  wallpaper?: string;
  onChangeWallpaper?: (url: string) => void;
  onResetLauncher?: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isEditMode,
  onToggleEditMode,
  passwordEnabled,
  onManagePassword,
  patternEnabled,
  onManagePattern,
  onLock,
  fingerprintEnabled,
  onToggleFingerprint,
  faceIdEnabled,
  onToggleFaceId,
  onManageRecovery,
  onAddApp,
  currentUser,
  onLogout,
  onDeleteAccount,
  onLogin,
  appIcon,
  onChangeAppIcon,
  appName,
  onChangeAppName,
  language = "en",
  onChangeLanguage,
  wallpaper,
  onChangeWallpaper,
  onResetLauncher,
}) => {
  const [adminPin, setAdminPin] = React.useState("");
  const [isAdminUnlocked, setIsAdminUnlocked] = React.useState(false);
  const wallpaperInputRef = React.useRef<HTMLInputElement>(null);
  const [wallpaperUploadSuccess, setWallpaperUploadSuccess] = React.useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = React.useState(false);
  const [showConfirmReset, setShowConfirmReset] = React.useState(false);

  // User feedback drawer state
  const [isFeedbackOpen, setIsFeedbackOpen] = React.useState(false);
  const [userFeedbackText, setUserFeedbackText] = React.useState("");
  const [userName, setUserName] = React.useState(currentUser || "");
  const [userCategory, setUserCategory] = React.useState<FeedbackCategory>("feature");
  const [userRating, setUserRating] = React.useState<number>(5);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = React.useState(false);
  const [feedbackStatusMsg, setFeedbackStatusMsg] = React.useState("");

  const handleUserSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFeedbackText.trim()) return;

    setIsSubmittingFeedback(true);
    try {
      await submitFeedback({
        user: userName.trim() || currentUser || "Anonymous",
        text: userFeedbackText.trim(),
        category: userCategory,
        rating: userRating,
      });
      setUserFeedbackText("");
      setFeedbackStatusMsg("Thank you! Feedback sent to Admin.");
      setTimeout(() => {
        setFeedbackStatusMsg("");
        setIsFeedbackOpen(false);
      }, 2500);
    } catch (err) {
      console.error(err);
      setFeedbackStatusMsg("Saved locally!");
      setTimeout(() => setFeedbackStatusMsg(""), 2500);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };
  // Reset admin state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setIsAdminUnlocked(false);
      setAdminPin("");
      setShowConfirmDelete(false);
      setShowConfirmReset(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900/40 backdrop-blur-3xl border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            {t(language, "settings", "Settings")}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          <div className="space-y-3">
            <p className="text-white text-xs font-medium">Account Settings</p>
            {currentUser ? (
              <div className="flex flex-col gap-3 bg-black/20 p-3 rounded-xl border border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      Active Account
                    </p>
                    <p className="text-sm font-medium text-white truncate max-w-[150px]">
                      {currentUser}
                    </p>
                  </div>
                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-1.5 rounded border border-red-500/20 text-[10px] font-bold uppercase transition-colors"
                    >
                      Sign Out
                    </button>
                  )}
                </div>

                {!showConfirmDelete ? (
                  <button
                    onClick={() => setShowConfirmDelete(true)}
                    className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-400 py-1.5 border border-red-600/20 hover:border-red-600/40 rounded text-[10px] font-bold uppercase transition-all tracking-wider text-center"
                  >
                    Delete Account
                  </button>
                ) : (
                  <div className="flex flex-col gap-2 pt-1 border-t border-gray-800/60 animate-in fade-in duration-200">
                    <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider text-center leading-normal">
                      Are you sure? This will delete your local account credentials and log you out.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          if (onDeleteAccount) onDeleteAccount();
                          setShowConfirmDelete(false);
                        }}
                        className="bg-red-600 hover:bg-red-500 text-white py-1.5 rounded text-[10px] font-bold uppercase transition-colors"
                      >
                        Yes, Delete
                      </button>
                      <button
                        onClick={() => setShowConfirmDelete(false)}
                        className="bg-gray-800 hover:bg-gray-700 text-gray-300 py-1.5 rounded text-[10px] font-bold uppercase transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form
                className="flex flex-col gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const user = fd.get("username") as string;
                  const remember = fd.get("rememberMe") === "on";
                  if (user.trim() && onLogin) {
                    onLogin(user.trim(), remember);
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  <input
                    name="username"
                    placeholder="Account Name..."
                    className="bg-black/50 text-white px-3 py-2 rounded-lg text-xs flex-1 border border-gray-700 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase h-[34px]"
                  >
                    Sign In
                  </button>
                </div>
                <div className="flex items-center gap-2 px-1">
                  <input
                    type="checkbox"
                    id="settingsRememberMe"
                    name="rememberMe"
                    className="w-3.5 h-3.5 rounded border-white/10 bg-black/50 accent-blue-500"
                    defaultChecked
                  />
                  <label
                    htmlFor="settingsRememberMe"
                    className="text-gray-400 text-[10px] cursor-pointer select-none"
                  >
                    Remember account
                  </label>
                </div>
              </form>
            )}
          </div>
          <div className="h-px bg-gray-700" />

          <div className="flex items-center justify-between">
            <p className="text-white text-xs font-medium">
              {t(language, "changeLanguage", "Language")}
            </p>
            <select
              value={language}
              onChange={(e) =>
                onChangeLanguage && onChangeLanguage(e.target.value)
              }
              className="bg-black/50 text-white px-3 py-1 rounded-lg text-xs border border-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="en">English</option>
              <option value="tr">Türkçe</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>

          <div className="pt-1">
            <input
              type="file"
              ref={wallpaperInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    if (
                      typeof reader.result === "string" &&
                      onChangeWallpaper
                    ) {
                      onChangeWallpaper(reader.result);
                      setWallpaperUploadSuccess(true);
                      setTimeout(
                        () => setWallpaperUploadSuccess(false),
                        3000,
                      );
                    }
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            <button
              id="change-wallpaper-button"
              onClick={() => {
                wallpaperInputRef.current?.click();
              }}
              className={`w-full py-2 border text-white shadow-lg rounded-lg text-[10px] font-bold uppercase transition-colors ${wallpaperUploadSuccess ? "bg-green-600 border-green-500/50 hover:bg-green-500 shadow-green-900/20" : "bg-purple-600 border-purple-500/50 hover:bg-purple-500 shadow-purple-900/20"}`}
            >
              {wallpaperUploadSuccess
                ? "Upload Successful!"
                : t(language, "changeWallpaper", "Change Wallpaper")}
            </button>
          </div>

          {!showConfirmReset ? (
            <button
              id="reset-launcher-button"
              onClick={() => setShowConfirmReset(true)}
              className="w-full py-2 bg-red-600/10 hover:bg-red-600/25 text-red-400 border border-red-600/20 hover:border-red-600/40 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all text-center"
            >
              Reset Launcher
            </button>
          ) : (
            <div className="flex flex-col gap-2 bg-red-950/10 border border-red-900/30 p-2.5 rounded-lg animate-in fade-in duration-200">
              <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider text-center leading-normal">
                Reset launcher: all custom apps will be removed, default wallpaper and state restored, and you will sign out.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (onResetLauncher) onResetLauncher();
                    setShowConfirmReset(false);
                  }}
                  className="bg-red-600 hover:bg-red-500 text-white py-1.5 rounded text-[10px] font-bold uppercase transition-colors"
                >
                  Yes, Reset
                </button>
                <button
                  onClick={() => setShowConfirmReset(false)}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 py-1.5 rounded text-[10px] font-bold uppercase transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="h-px bg-gray-700" />

          <div className="flex items-center justify-between">
            <p className="text-white text-xs font-medium">
              {t(language, "customizationMode", "Customization Mode")}
            </p>
            <button
              onClick={onToggleEditMode}
              className={`h-5 w-10 rounded-full transition-colors relative ${isEditMode ? "bg-blue-600" : "bg-gray-700"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-4 w-4 bg-white rounded-full transition-transform ${isEditMode ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>
          {/* User Feedback Submission Card */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2.5">
            <button
              type="button"
              onClick={() => setIsFeedbackOpen(!isFeedbackOpen)}
              className="w-full flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">💬</span>
                <div>
                  <p className="text-white text-xs font-semibold group-hover:text-amber-400 transition-colors">
                    Send App Feedback
                  </p>
                  <p className="text-[9px] text-gray-400">
                    Share suggestions or bug reports with Admin
                  </p>
                </div>
              </div>
              <span className="text-gray-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/5 group-hover:bg-white/10 transition-colors">
                {isFeedbackOpen ? "Close" : "Open"}
              </span>
            </button>

            {isFeedbackOpen && (
              <form onSubmit={handleUserSubmitFeedback} className="pt-2 border-t border-white/10 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-300 font-medium">Rating:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setUserRating(star)}
                        className="p-0.5 hover:scale-110 transition-transform"
                      >
                        <svg
                          className={`w-3.5 h-3.5 ${star <= userRating ? "fill-amber-400 text-amber-400" : "text-gray-600"}`}
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Your Name (optional)"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="bg-black/40 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  />
                  <select
                    value={userCategory}
                    onChange={(e) => setUserCategory(e.target.value as FeedbackCategory)}
                    className="bg-black/40 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="feature">💡 Feature Request</option>
                    <option value="bug">🐛 Bug Report</option>
                    <option value="general">💬 General Feedback</option>
                    <option value="praise">❤️ Praise</option>
                  </select>
                </div>

                <textarea
                  placeholder="What can we improve or add?..."
                  value={userFeedbackText}
                  onChange={(e) => setUserFeedbackText(e.target.value)}
                  rows={2}
                  className="w-full bg-black/40 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none"
                />

                <div className="flex items-center justify-between pt-1">
                  {feedbackStatusMsg ? (
                    <span className="text-[10px] text-emerald-400 font-medium animate-in fade-in">
                      {feedbackStatusMsg}
                    </span>
                  ) : <span />}

                  <button
                    type="submit"
                    disabled={!userFeedbackText.trim() || isSubmittingFeedback}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold uppercase transition-colors"
                  >
                    {isSubmittingFeedback ? "Sending..." : "Submit Feedback"}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="h-px bg-gray-700" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-white text-xs font-medium">
                {t(language, "passwordLock", "Lock Screen")}
              </p>
              {(passwordEnabled || patternEnabled) ? (
                <ShieldCheckIcon className="w-4 h-4 text-green-400" />
              ) : (
                <LockIcon className="w-4 h-4 text-red-500 opacity-40" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onManagePassword}
                className="py-2 bg-gray-700 hover:bg-gray-600 transition-colors text-white rounded-lg text-[10px] font-bold uppercase"
              >
                {passwordEnabled ? "Change PIN" : "Set PIN"}
              </button>
              <button
                onClick={onManagePattern}
                className="py-2 bg-gray-700 hover:bg-gray-600 transition-colors text-white rounded-lg text-[10px] font-bold uppercase"
              >
                {patternEnabled ? "Change Pattern" : "Set Pattern"}
              </button>
              {(passwordEnabled || patternEnabled) && (
                <button
                  onClick={onLock}
                  className="col-span-2 py-2 bg-blue-600 hover:bg-blue-500 transition-colors text-white rounded-lg text-[10px] font-bold uppercase mt-1"
                >
                  Lock Now
                </button>
              )}
            </div>

            {(passwordEnabled || patternEnabled) && onManageRecovery && (
              <div className="pt-1">
                <button
                  onClick={onManageRecovery}
                  className="w-full py-2 border border-gray-700 hover:bg-gray-700/50 text-gray-300 hover:text-white rounded-lg text-[10px] font-bold uppercase flex items-center justify-center gap-2 transition-all"
                >
                  <MailIcon className="w-3 h-3" />
                  Update Recovery Info
                </button>
              </div>
            )}

            {(passwordEnabled || patternEnabled) && onToggleFingerprint && (
              <div className="flex items-center justify-between pt-1">
                <p className="text-white text-[10px] font-medium flex items-center gap-1">
                  <FingerprintIcon className="w-3 h-3" />{" "}
                  {t(language, "fingerprint", "Fingerprint")}
                </p>
                <button
                  onClick={onToggleFingerprint}
                  className={`h-4 w-8 rounded-full transition-colors relative ${fingerprintEnabled ? "bg-blue-600" : "bg-gray-700"}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-3 w-3 bg-white rounded-full transition-transform ${fingerprintEnabled ? "translate-x-4" : "translate-x-0"}`}
                  />
                </button>
              </div>
            )}

            {(passwordEnabled || patternEnabled) && onToggleFaceId && (
              <div className="flex items-center justify-between">
                <p className="text-white text-[10px] font-medium flex items-center gap-1">
                  <FaceIdIcon className="w-3 h-3" />{" "}
                  {t(language, "faceId", "Face ID")}
                </p>
                <button
                  onClick={onToggleFaceId}
                  className={`h-4 w-8 rounded-full transition-colors relative ${faceIdEnabled ? "bg-blue-600" : "bg-gray-700"}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-3 w-3 bg-white rounded-full transition-transform ${faceIdEnabled ? "translate-x-4" : "translate-x-0"}`}
                  />
                </button>
              </div>
            )}

            <div className="h-px bg-gray-700 mt-4 mb-2" />

            <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-3 space-y-3">
              <p className="text-amber-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                <ShieldCheckIcon className="w-3 h-3" /> Administrator
              </p>
              {!isAdminUnlocked ? (
                <div className="flex gap-2">
                  <input
                    type="password"
                    maxLength={4}
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (adminPin === "3443") {
                          setIsAdminUnlocked(true);
                        } else {
                          setAdminPin("");
                        }
                      }
                    }}
                    placeholder="Enter Admin PIN"
                    className="bg-black/50 text-white px-3 py-2 rounded-lg text-xs w-full border border-amber-500/30 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={() => {
                      if (adminPin === "3443") {
                        setIsAdminUnlocked(true);
                      } else {
                        setAdminPin("");
                      }
                    }}
                    className="bg-amber-600 hover:bg-amber-500 transition-colors text-white px-4 rounded-lg text-[10px] font-bold uppercase disabled:opacity-50"
                    disabled={adminPin.length < 4}
                  >
                    Unlock
                  </button>
                </div>
              ) : (
                <div className="space-y-3 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between bg-black/40 border border-amber-500/20 px-3 py-2.5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <div>
                        <p className="text-[11px] font-bold text-amber-400">
                          Admin Mode Unlocked
                        </p>
                        <p className="text-[9px] text-gray-400">
                          PIN verified • Administrator privileges active
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIsAdminUnlocked(false);
                        setAdminPin("");
                      }}
                      className="text-[9px] text-gray-400 hover:text-white uppercase font-bold tracking-wider px-2 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors"
                    >
                      Lock
                    </button>
                  </div>

                  {/* Fully functional, real-time User Feedback Management for Admin */}
                  <AdminFeedbackViewer currentUser={currentUser} />
                </div>
              )}
            </div>
          </div>

          <div className="border border-blue-500/30 bg-blue-500/5 rounded-xl p-3 space-y-2 mt-4">
            <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
              App Information
            </p>
            <div className="space-y-1 text-xs text-gray-400">
              <p>Platform: Web / Plus+Launcher</p>
              <p>Storage: Local Storage</p>
              <p>URL: plus-launcher.vercel.app</p>
              <p>Version: 1.5.0</p>
            </div>
          </div>

          <div className="text-[8px] text-gray-500 text-center uppercase tracking-widest pt-2 flex flex-col gap-1 mt-4">
            <span>Plus+Launcher v1.5.0</span>
            <span className="text-blue-500 font-bold">
              powered by gultekinegem21max
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
