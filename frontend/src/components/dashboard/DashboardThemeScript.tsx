import { DASHBOARD_THEME_KEY } from '@/lib/dashboard-theme';

/** Applies stored dashboard theme before paint to avoid flash and broken defaults. */
export function DashboardThemeScript() {
  const script = `(function(){try{var k=${JSON.stringify(DASHBOARD_THEME_KEY)};var keys=[k,'saDashboardTheme','paDashboardTheme','iaDashboardTheme','memberDashboardTheme'];var t='light';for(var i=0;i<keys.length;i++){var v=localStorage.getItem(keys[i]);if(v==='dark'||v==='ocean'||v==='lavender'||v==='light'){t=v;break;}}var d=document.documentElement;d.setAttribute('data-sa-theme',t);d.classList.toggle('dark',t==='dark');d.style.colorScheme=t==='dark'?'dark':'light';}catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
