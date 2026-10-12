/** Chart.js registration + shared dark-theme options (imported once). */
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);
ChartJS.defaults.color = '#94A3B8';
ChartJS.defaults.font.family = 'Inter, system-ui, sans-serif';
ChartJS.defaults.borderColor = 'rgba(255,255,255,0.08)';

export const VERDICT_COLORS = { safe: '#22C55E', suspicious: '#F59E0B', dangerous: '#EF4444' };
