
import React, { useState, useEffect } from 'react';

const getGreeting = (lang: string = "en") => {
  const hour = new Date().getHours();
  
  const greetings: Record<string, { morning: string; afternoon: string; evening: string }> = {
    en: { morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening" },
    tr: { morning: "Günaydın", afternoon: "Tünaydın", evening: "İyi akşamlar" },
    es: { morning: "Buenos días", afternoon: "Buenas tardes", evening: "Buenas noches" },
    fr: { morning: "Bonjour", afternoon: "Bon après-midi", evening: "Bonsoir" },
    de: { morning: "Guten Morgen", afternoon: "Guten Tag", evening: "Guten Abend" }
  };
  
  const trs = greetings[lang] || greetings["en"];

  if (hour < 12) return trs.morning;
  if (hour < 18) return trs.afternoon;
  return trs.evening;
};

interface HeaderProps {
    isEditMode: boolean;
    onToggleEditMode: () => void;
    hasCustomApps: boolean;
    onReload?: () => void;
    onLock?: () => void;
    onOpenSettings?: () => void;
    appIcon?: string;
    language?: string;
}

const Header: React.FC<HeaderProps> = ({ isEditMode, onToggleEditMode, hasCustomApps, onReload, onLock, onOpenSettings, appIcon, language = "en" }) => {
  const [greeting, setGreeting] = useState(getGreeting(language));

  useEffect(() => {
    setGreeting(getGreeting(language));
    const timerId = setInterval(() => {
      setGreeting(getGreeting(language));
    }, 60000); // Update every minute
    return () => clearInterval(timerId);
  }, [language]);

  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-white w-full gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
            {appIcon ? (
                <img src={appIcon} alt="App Icon" className="w-8 h-8 rounded-lg object-cover bg-white/10 shrink-0" />
            ) : (
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-md shadow-[0_0_15px_rgba(59,130,246,0.1)] shrink-0">
                    +
                </div>
            )}
            <h1 className="text-xl font-bold truncate">Plus<span className="text-blue-500">+</span>Launcher</h1>
            <div className="flex-1" />
            <div className="flex items-center gap-2 sm:hidden shrink-0">
               {hasCustomApps && (
                    <button 
                        onClick={onToggleEditMode} 
                        className={`text-sm px-3 py-1 rounded-md transition-colors ${isEditMode ? 'bg-blue-600 text-white' : 'bg-gray-700/50 hover:bg-gray-700'}`}
                    >
                        {isEditMode ? 'Done' : 'Edit'}
                    </button>
               )}
               {onLock && (
                   <button 
                       onClick={onLock}
                       className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-all"
                       title="Lock Launcher"
                   >
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                       </svg>
                   </button>
                )}
                {onReload && (
                   <button 
                       onClick={onReload}
                       className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-all"
                       title="Reload apps"
                   >
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                       </svg>
                   </button>
                )}
                {onOpenSettings && (
                   <button 
                       onClick={onOpenSettings}
                       className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-all"
                       title="Settings"
                   >
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                           <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                       </svg>
                   </button>
                )}
            </div>
        </div>
        <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-2">
                {hasCustomApps && (
                    <button 
                        onClick={onToggleEditMode} 
                        className={`text-sm px-3 py-1 rounded-md transition-colors ${isEditMode ? 'bg-blue-600 text-white' : 'bg-gray-700/50 hover:bg-gray-700'}`}
                    >
                        {isEditMode ? 'Done' : 'Edit'}
                    </button>
                )}
                {onLock && (
                   <button 
                       onClick={onLock}
                       className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-all"
                       title="Lock Launcher"
                   >
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                       </svg>
                   </button>
                )}
                {onReload && (
                   <button 
                       onClick={onReload}
                       className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-all"
                       title="Reload apps"
                   >
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                       </svg>
                   </button>
                )}
                {onOpenSettings && (
                   <button 
                       onClick={onOpenSettings}
                       className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-all"
                       title="Settings"
                   >
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                           <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                       </svg>
                   </button>
                )}
            </div>
            <p className="text-md text-gray-300">{greeting}</p>
        </div>
    </header>
  );
};

export default Header;
