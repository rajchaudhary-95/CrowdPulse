import React, { useState, useEffect } from 'react';
import {
  Compass,
  Clock,
  Navigation,
  Sparkles,
  ArrowRight,
  Bookmark,
  Bell,
  Sliders,
  CheckCircle2,
  Lock,
  ArrowLeftRight,
  TrendingUp,
  MapPin,
  Flame,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Footprints,
  AlertTriangle,
  Check,
  Zap,
  Train,
  ExternalLink,
} from 'lucide-react';
import MapView from '../components/MapView';
import { useAuth } from '../context/AuthContext';
import {
  fetchRouteRecommendation,
  fetchEgressWindow,
  fetchConcessions,
  fetchWaitTimes,
  fetchAnnouncements,
  setReminder,
  fetchReminders,
  toggleBookmark as apiToggleBookmark,
  fetchBookmarks,
} from '../services/api';

const CAMPUS_ZONES = [
  { value: 'zone-atrium-main', label: 'Gate 1 — Front Gate', sublabel: 'Girls Entry, Artists & VIPs' },
  { value: 'zone-canteen-back', label: 'Gate 2 — Canteen Gate', sublabel: 'Boys Dedicated Entry' },
  { value: 'zone-quadrangle', label: 'The Central Quadrangle', sublabel: 'The Quad Stage' },
  { value: 'zone-sports-ground', label: 'PICA Lawn & Sports Ground', sublabel: 'Chill Lawn & Acoustic Stage' },
  { value: 'zone-main-ground', label: 'Main Concert Ground', sublabel: 'Alegria Mainstage Arena' },
  { value: 'zone-panvel-transit', label: 'Panvel Station Auto Stand', sublabel: 'Sector 16 Share-Auto Feeder' },
];

function getCrowdDensityLevel(density) {
  if (!density && density !== 0) return 'Low';
  if (typeof density === 'string') {
    const lower = density.toLowerCase();
    if (lower.includes('low')) return 'Low';
    if (lower.includes('med')) return 'Medium';
    if (lower.includes('high') || lower.includes('heavy') || lower.includes('choke')) return 'High';
  }
  const val = Number(density);
  if (isNaN(val)) return 'Low';
  if (val < 45) return 'Low';
  if (val < 75) return 'Medium';
  return 'High';
}

function cleanChokepointText(text) {
  if (!text) return '';
  return text
    .replace(/\[CHOKEPOINT\s*\d+%?\]/gi, '')
    .replace(/\[CHOKEPOINT\]/gi, '')
    .replace(/\[Chokepoint\]/gi, '')
    .replace(/\bchokepoint\b/gi, 'high-traffic area')
    .replace(/\bbottleneck\b/gi, 'congestion')
    .replace(/\bbottlenecks\b/gi, 'congestion areas')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const PANVEL_TRAIN_SCHEDULE = [
  { dest: 'CSMT', line: 'Harbour', type: 'Slow', pf: 'PF 2', offsetMins: 5, crowd: 'Low', status: 'On Time' },
  { dest: 'Thane', line: 'Trans-Harbour', type: 'Slow', pf: 'PF 1', offsetMins: 12, crowd: 'Moderate', status: '+2m Delay' },
  { dest: 'CSMT', line: 'Harbour', type: 'Fast', pf: 'PF 3', offsetMins: 19, crowd: 'Moderate', status: 'On Time' },
  { dest: 'Goregaon', line: 'Western Link', type: 'Slow', pf: 'PF 2', offsetMins: 28, crowd: 'Low', status: 'On Time' },
  { dest: 'Thane', line: 'Trans-Harbour', type: 'Slow', pf: 'PF 1', offsetMins: 36, crowd: 'High', status: '+3m Delay' },
  { dest: 'Wadala Road', line: 'Harbour', type: 'Slow', pf: 'PF 2', offsetMins: 45, crowd: 'Low', status: 'On Time' },
  { dest: 'CSMT', line: 'Harbour', type: 'Slow', pf: 'PF 3', offsetMins: 55, crowd: 'Moderate', status: 'On Time' },
];

function getUpcomingPanvelTrains() {
  const now = new Date();
  return PANVEL_TRAIN_SCHEDULE.map((train, idx) => {
    const depTime = new Date(now.getTime() + train.offsetMins * 60000);
    const hh = String(depTime.getHours()).padStart(2, '0');
    const mm = String(depTime.getMinutes()).padStart(2, '0');
    return {
      id: `train-${idx}`,
      ...train,
      timeFormatted: `${hh}:${mm}`,
    };
  });
}

function CampusZoneSelect({
  value,
  onChange,
  options,
  icon: Icon,
  placeholder = 'Select location',
  excludeValue,
  excludeReason = 'Already Selected',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value) || options[0];
  const ref = React.useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`custom-zone-select ${isOpen ? 'open' : ''}`} ref={ref}>
      <button
        type="button"
        className={`custom-select-trigger font-display ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="trigger-left">
          {Icon && <Icon size={16} className="trigger-icon text-cyan" />}
          <span className="trigger-text">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown size={14} className={`trigger-chevron ${isOpen ? 'rotated' : ''}`} />
      </button>

      {isOpen && (
        <div className="custom-select-menu glass-panel font-display">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            const isDisabled = Boolean(excludeValue && opt.value === excludeValue);
            return (
              <div
                key={opt.value}
                className={`custom-select-option ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                onClick={() => {
                  if (isDisabled) return;
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                <div className="option-info">
                  <span className="option-label">{opt.label}</span>
                  {opt.sublabel && <span className="option-sublabel font-mono">{opt.sublabel}</span>}
                </div>
                {isSelected && <Check size={14} className="text-cyan check-icon" />}
                {isDisabled && <span className="option-disabled-badge font-mono">{excludeReason}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function VisitorGuidance({
  zones = [],
  transitEdges = [],
  venues = [],
  forecast = {},
  recommendations = [],
  simulatedTime,
  festivalPhase = {},
  gateStatuses = [],
  onUpdateClock,
}) {
  const { promptLogin } = useAuth();

  const [previewPhase, setPreviewPhase] = useState(festivalPhase?.phase || 'EGRESS');

  useEffect(() => {
    if (festivalPhase?.phase) {
      setPreviewPhase(festivalPhase.phase);
    }
  }, [festivalPhase?.phase]);

  const activePhase = previewPhase || festivalPhase?.phase || 'EGRESS';
  const isEgress = activePhase === 'EGRESS';
  const isIngress = activePhase === 'INGRESS';

  const [originZone, setOriginZone] = useState(isEgress ? 'zone-main-ground' : 'zone-atrium-main');
  const [destZone, setDestZone] = useState(isEgress ? 'zone-panvel-transit' : 'zone-main-ground');

  const handlePreviewPhase = async (phase) => {
    setPreviewPhase(phase);
    if (phase === 'INGRESS') {
      setOriginZone('zone-atrium-main');
      setDestZone('zone-main-ground');
    } else if (phase === 'EGRESS') {
      setOriginZone('zone-main-ground');
      setDestZone('zone-panvel-transit');
    } else {
      setOriginZone('zone-quadrangle');
      setDestZone('zone-sports-ground');
    }

    if (onUpdateClock) {
      try {
        await onUpdateClock({ setPhase: phase });
      } catch (err) {
        console.warn('Clock phase sync error:', err.message);
      }
    }
  };

  const [activeCategory, setActiveCategory] = useState('all');
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [reminderSet, setReminderSet] = useState(false);
  const [reminderToast, setReminderToast] = useState(null);

  // Dynamic Egress & Live Telemetry State
  const [egressAdvisory, setEgressAdvisory] = useState(null);
  const [concessionsList, setConcessionsList] = useState([]);
  const [facilityWaitTimes, setFacilityWaitTimes] = useState([]);
  const [liveAnnouncements, setLiveAnnouncements] = useState([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState(new Set());
  const [showTrainSchedule, setShowTrainSchedule] = useState(false);
  const [activeTrainFilter, setActiveTrainFilter] = useState('all');

  // Dynamic Routing State
  const [routeData, setRouteData] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [activePreference, setActivePreference] = useState('least_crowded');
  const [showPreferences, setShowPreferences] = useState(false);
  const [selectedRouteType, setSelectedRouteType] = useState('recommended');

  // Fetch live route whenever origin, destination, or preference changes
  useEffect(() => {
    let isMounted = true;
    async function loadPath() {
      if (!originZone || !destZone) return;
      setLoadingRoute(true);
      try {
        const data = await fetchRouteRecommendation(originZone, destZone, activePreference);
        if (isMounted) {
          setRouteData(data);
        }
      } catch (err) {
        console.warn('Path finding fetch warning:', err);
      } finally {
        if (isMounted) setLoadingRoute(false);
      }
    }
    loadPath();
    return () => {
      isMounted = false;
    };
  }, [originZone, destZone, activePreference]);

  // Fetch live companion feeds (egress, facility queues, announcements, bookmarks)
  useEffect(() => {
    let isMounted = true;
    async function loadCompanionFeeds() {
      try {
        const [egress, waitTimes, announce, bmarks] = await Promise.all([
          fetchEgressWindow().catch(() => null),
          fetchWaitTimes().catch(() => []),
          fetchAnnouncements().catch(() => []),
          fetchBookmarks().catch(() => ({ bookmarkedIds: [] })),
        ]);
        if (isMounted) {
          if (egress) setEgressAdvisory(egress);
          if (Array.isArray(waitTimes)) setFacilityWaitTimes(waitTimes);
          if (Array.isArray(announce)) setLiveAnnouncements(announce);
          if (bmarks?.bookmarkedIds) setBookmarkedIds(new Set(bmarks.bookmarkedIds));
        }
      } catch (err) {
        console.warn('Companion feeds warning:', err);
      }
    }
    loadCompanionFeeds();
    const intervalId = setInterval(loadCompanionFeeds, 10000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // Fetch concessions whenever activeCategory changes
  useEffect(() => {
    let isMounted = true;
    async function loadConcessions() {
      try {
        const list = await fetchConcessions(activeCategory);
        if (isMounted && Array.isArray(list)) {
          setConcessionsList(list);
        }
      } catch (err) {
        console.warn('Concessions fetch warning:', err);
      }
    }
    loadConcessions();
    return () => {
      isMounted = false;
    };
  }, [activeCategory]);

  const handleToggleBookmark = async (concessionId) => {
    try {
      const res = await apiToggleBookmark(concessionId);
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (res.isBookmarked) next.add(concessionId);
        else next.delete(concessionId);
        return next;
      });
    } catch {
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (next.has(concessionId)) next.delete(concessionId);
        else next.add(concessionId);
        return next;
      });
    }
  };

  const handleSetReminder = async () => {
    const target = egressAdvisory?.recommendedExitTarget || '22:15';
    try {
      await setReminder({
        title: 'Alegria Egress Departure Notice',
        targetTime: target,
        reminderType: 'egress',
      });
      setReminderSet(true);
      setReminderToast(`Reminder set for ${target}. We will alert you before the post-concert crush.`);
      setTimeout(() => setReminderToast(null), 5000);
    } catch {
      setReminderSet(true);
      setReminderToast(`Reminder set for ${target}`);
      setTimeout(() => setReminderToast(null), 5000);
    }
  };

  const handleSelectOrigin = (newOrigin) => {
    if (!newOrigin || newOrigin === destZone) return;
    setOriginZone(newOrigin);
  };

  const handleSelectDest = (newDest) => {
    if (!newDest || newDest === originZone) return;
    setDestZone(newDest);
  };

  const handleDirectTo = (zoneId, options = {}) => {
    if (zoneId) {
      if (zoneId === originZone) {
        const otherZone = CAMPUS_ZONES.find((z) => z.value !== zoneId);
        if (otherZone) setOriginZone(otherZone.value);
      }
      setDestZone(zoneId);

      if (options.preference) {
        setActivePreference(options.preference);
      }

      // Accessibility: Smooth scroll up to wayfinding section & shift focus
      setTimeout(() => {
        const target = document.getElementById('campus-wayfinding-section');
        if (target) {
          const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
          target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
          target.focus({ preventScroll: true });
        }
      }, 50);
    }
  };

  // Accessibility: Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showTrainSchedule) {
        setShowTrainSchedule(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTrainSchedule]);

  const handleSwapZones = () => {
    const temp = originZone;
    setOriginZone(destZone);
    setDestZone(temp);
  };

  // Safe fallback values if loading or network failure
  const recommended = routeData?.recommendedRoute || {
    title: 'Crowd-Free Path (Recommended)',
    badge: 'CROWD-FREE PATH (RECOMMENDED)',
    totalMinutes: 6,
    baseWalkMinutes: 6,
    delayMinutes: 0,
    totalDistanceMeters: 450,
    crowdDensityPct: 28,
    pace: 'Smooth Pace (1.3 m/s)',
    surface: 'Paved & Garden Ramp (Step-Free)',
    turnstileWait: '0 - 1 min wait',
    corridorSummary: 'Canteen Gate 2 Path → PICA Shaded Garden Lawn → Main Concert Ground',
    steps: [
      {
        stepNumber: 1,
        instruction: 'Depart from Gate 1 Turnstiles past Engineering Atrium walkway.',
        landmark: 'Atrium Welcome Hall',
        distanceMeters: 180,
        baseWalkSeconds: 130,
        isChokepoint: false,
        crowdLevel: 'free_flow',
        surfaceType: 'Paved Walkway',
        icon: 'gate',
      },
      {
        stepNumber: 2,
        instruction: 'Bear left onto the shaded PICA Architecture Lawn bypass.',
        landmark: 'PICA Architecture Courtyard',
        distanceMeters: 280,
        baseWalkSeconds: 210,
        isChokepoint: false,
        crowdLevel: 'free_flow',
        surfaceType: 'Paved & Garden Ramp',
        icon: 'nature',
      },
      {
        stepNumber: 3,
        instruction: 'Walk through open North Lawn perimeter turnstiles into the Main Concert Ground with zero queue.',
        landmark: 'Alegria Main Concert Arena',
        distanceMeters: 190,
        baseWalkSeconds: 140,
        isChokepoint: false,
        crowdLevel: 'free_flow',
        surfaceType: 'Paved Deck',
        icon: 'arena',
      },
    ],
  };

  const standard = routeData?.standardRoute || {
    title: 'Direct Walkway Option',
    badge: 'High Foot Traffic',
    totalMinutes: 14,
    baseWalkMinutes: 5,
    delayMinutes: 9,
    totalDistanceMeters: 320,
    crowdDensityPct: 92,
    pace: 'Slow Crawl (< 0.4 m/s)',
    surface: 'Main Central Walkway',
    turnstileWait: '8 - 12 min queue',
    chokepointNote: 'High foot traffic along The Quad Walkway',
    corridorSummary: 'The Quad Walkway → Alegria Main Concert Arena',
    steps: [
      {
        stepNumber: 1,
        instruction: 'Proceed from Gate 1 directly towards the central campus axis.',
        landmark: 'Gate 1 Entry',
        distanceMeters: 140,
        baseWalkSeconds: 100,
        isChokepoint: false,
        crowdLevel: 'moderate',
        surfaceType: 'Paved Walkway',
        paceDescription: 'Normal Pace (1.1 m/s)',
        studentProTip: 'Follow directional signs towards the central axis.',
        icon: 'gate',
      },
      {
        stepNumber: 2,
        instruction: 'Walk through The Central Quadrangle. Daytime stage setups and high attendee foot traffic cause walking delays.',
        landmark: 'The Quadrangle (Central Axis)',
        distanceMeters: 180,
        baseWalkSeconds: 140,
        isChokepoint: true,
        crowdLevel: 'gridlock',
        surfaceType: 'Narrow Arterial Walkway',
        paceDescription: 'Slow Crawl (< 0.4 m/s)',
        studentProTip: 'High event volume and stage crowds cause dense foot traffic. Keep along the perimeter walkway for smoother passage.',
        icon: 'alert',
      },
    ],
  };

  const timeSaved = routeData?.timeSavedMinutes ?? Math.max(0, standard.totalMinutes - recommended.totalMinutes);

  return (
    <div className="visitor-view-root">
      <div className="visitor-content-container">

        {/* Floating Reminder Confirmation Toast */}
        {reminderToast && (
          <div className="reminder-toast-banner font-mono">
            <CheckCircle2 size={16} className="text-success" />
            <span>{reminderToast}</span>
          </div>
        )}

        {/* SECTION 1: Hero Live Flow Guide (Dynamic Ingress vs Egress) */}
        <section className="visitor-hero-section">
          <div className="hero-left-col">
            <div className={`flow-guide-badge font-mono ${isEgress ? 'badge-egress' : isIngress ? 'badge-ingress' : ''}`}>
              <span className={`dot-live-status ${isEgress ? 'dot-cyan' : isIngress ? 'dot-green' : 'dot-amber'}`}></span>
              <span>
                {isEgress
                  ? 'ALEGRIA • NIGHT EXIT (HEADING HOME)'
                  : isIngress
                  ? 'ALEGRIA • DAYTIME ENTRY (ARRIVING)'
                  : 'ALEGRIA • LIVE FESTIVAL RADAR'}
              </span>
            </div>

            <h1 className="hero-main-title font-display">
              Pillai University's Alegria
            </h1>
            <div className={`hero-mode-subtitle font-display ${isEgress ? 'subtitle-egress' : isIngress ? 'subtitle-ingress' : 'subtitle-midday'}`}>
              {isEgress ? 'Night Exit & Safe Walking Guide' : isIngress ? 'Daytime Entry & Campus Arrival Guide' : 'Live Campus Walkway Guide'}
            </div>

            <p className="hero-description">
              {isEgress ? (
                <>
                  Celebrity concert wrapped. <strong>Gates 1 &amp; 2</strong> have flipped to rapid outbound corridors towards Panvel Railway Station &amp; Sector 16 Auto Loop.
                </>
              ) : isIngress ? (
                <>
                  Welcome to Alegria! Daytime festival entry is open via <strong>Gate 1</strong> (Girls &amp; VIP ticket scanning turnstiles) and <strong>Gate 2</strong> (Dedicated Boys frisking lane).
                </>
              ) : (
                <>
                  Live festival crowd guide for Alegria at Pillai Campus. Walking routes open between Quadrangle, Sports Ground, and Canteen.
                </>
              )}
            </p>
          </div>

          {/* Right Card: Dynamic Entry / Departure Planner */}
          <div className="hero-right-col">
            <div className={`optimal-window-card glass-panel ${isEgress ? 'theme-egress-card' : isIngress ? 'theme-ingress-card' : ''}`}>
              <div className="window-card-header">
                <span className="window-label font-mono">
                  {isEgress ? 'SMOOTH EXIT & TRANSIT GUIDE' : 'LIVE GATE ACCESS & ENTRY GUIDE'}
                </span>
              </div>

              <div className="window-target-row">
                <span className="target-time font-display">
                  {isEgress ? (egressAdvisory?.recommendedExitTarget || '21:45') : 'Gate 1 (Fastest)'}
                </span>
                <span className="target-desc font-mono">
                  {isEgress ? 'Recommended Departure Time' : 'Estimated Wait: ~2 mins (4 Turnstiles)'}
                </span>
              </div>

              <p className="window-advice font-body">
                {isEgress
                  ? (egressAdvisory?.tacticalAdvice || 'Head out via Gate 2 to reach Panvel Railway Station in 7 mins, bypassing the crowded Central Quad stairs.')
                  : 'Gate 1 turnstiles have lowest queue for student ID and digital barcode passes. Unzip bags before entering security doorframe at Gate 2.'}
              </p>

              {isEgress ? (
                <div className="delay-estimate-badge font-mono">
                  <Clock size={15} className="text-cyan" />
                  <span className="delay-text">
                    Extra walk time if leaving later (after {egressAdvisory?.busyDepartureTime || '22:15'}):
                  </span>
                  <strong className="delay-minutes-highlight">
                    +{egressAdvisory?.estimatedExtraDelayMinutes || '15–20 mins'}
                  </strong>
                </div>
              ) : (
                <div className="delay-estimate-badge font-mono">
                  <Zap size={15} className="text-success" />
                  <span className="delay-text">Fast-Track Turnstile Lane:</span>
                  <strong className="delay-minutes-highlight text-success">
                    Gate 1 Scan Active
                  </strong>
                </div>
              )}

              {isEgress ? (
                <button
                  className={`btn-reminder-notification font-mono ${reminderSet ? 'set' : ''}`}
                  onClick={handleSetReminder}
                >
                  <Bell size={15} />
                  <span>{reminderSet ? `REMINDER SET FOR ${egressAdvisory?.recommendedExitTarget || '21:45'}` : `Set Departure Reminder (${egressAdvisory?.recommendedExitTarget || '21:45'})`}</span>
                </button>
              ) : (
                <button
                  className="btn-reminder-notification font-mono"
                  onClick={() => handleDirectTo('zone-atrium-main')}
                >
                  <Navigation size={15} />
                  <span>Directions to Gate 1 Turnstiles</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Dynamic Festival Schedule & Time Travel Preview Bar */}
        <div className="visitor-phase-tester glass-panel font-mono">
          <div className="phase-tester-left">
            <span className="tester-label">FESTIVAL SCHEDULE TIMELINE:</span>
            <span className="tester-current">
              <strong>
                {festivalPhase?.phaseIcon || (isEgress ? '🌙' : isIngress ? '🌅' : '☀️')}{' '}
                {festivalPhase?.phaseLabel || (isEgress ? 'Night Exit & Heading Home' : isIngress ? 'Daytime Arrival' : 'Peak Festival Crowd')}
              </strong>
            </span>
            <span className="tester-sub font-body">
              {isEgress
                ? 'Going Out Mode: Gates 1 & 2 turnstiles reversed for mass exit towards Panvel Station & Autos'
                : isIngress
                ? 'Coming In Mode: Gates 1 & 2 scanning incoming student passes & baggage'
                : 'Festival Mode: Normal walking routes between stages'}
            </span>
          </div>

          <div className="phase-tester-presets">
            <span className="presets-label">TIME TRAVEL PREVIEW:</span>
            <button
              type="button"
              className={`btn-tester-pill ${isIngress ? 'active' : ''}`}
              onClick={() => handlePreviewPhase('INGRESS')}
              title="Simulate Daytime Entry (Arriving on Campus)"
            >
              🌅 11:30 AM (Coming In)
            </button>
            <button
              type="button"
              className={`btn-tester-pill ${!isIngress && !isEgress ? 'active' : ''}`}
              onClick={() => handlePreviewPhase('CIRCULATION')}
              title="Simulate Peak Festival Crowd"
            >
              ☀️ 4:30 PM (Midday Events)
            </button>
            <button
              type="button"
              className={`btn-tester-pill ${isEgress ? 'active' : ''}`}
              onClick={() => handlePreviewPhase('EGRESS')}
              title="Simulate Night Exit (Leaving Campus)"
            >
              🌙 9:45 PM (Going Out)
            </button>
          </div>
        </div>

        {/* SECTION 2: Routing Assistant */}
        <section
          className="routing-assistant-section"
          id="campus-wayfinding-section"
          tabIndex={-1}
          aria-label="Campus Wayfinding and Walking Directions"
        >
          <div className="section-header-row">
            <div className="section-title-group">
              <h2 className="section-main-title font-display">Campus Wayfinding</h2>
            </div>
            <div className="header-meta-group font-mono">
              {loadingRoute ? (
                <span className="recalc-note text-cyan">
                  <Sparkles size={12} className="spin-slow" />
                  <span>Finding best path...</span>
                </span>
              ) : (
                <span className="recalc-note">
                  <Sparkles size={12} className="text-cyan" />
                  <span>Live Path Guidance</span>
                </span>
              )}
            </div>
          </div>

          {/* Search Selector Bar */}
          <div className="route-selector-bar glass-panel">
            <button
              className={`btn-preferences font-mono ${showPreferences ? 'active' : ''}`}
              onClick={() => setShowPreferences(!showPreferences)}
              aria-expanded={showPreferences}
              aria-label="Routing Criteria Preferences"
            >
              <Sliders size={14} />
              <span>Routing Criteria</span>
            </button>

            {/* Accessible Step-Free Quick Toggle */}
            <button
              type="button"
              className={`btn-stepfree-quick font-mono ${activePreference === 'step_free' ? 'active' : ''}`}
              onClick={() => setActivePreference(activePreference === 'step_free' ? 'least_crowded' : 'step_free')}
              aria-pressed={activePreference === 'step_free'}
              title="Toggle Step-Free accessible route (ADA Ramps, No Stairs)"
            >
              <span>♿ Step-Free</span>
            </button>

            <div className="selector-field">
              <span className="field-label font-mono">I AM CURRENTLY AT (DEPARTURE)</span>
              <CampusZoneSelect
                value={originZone}
                onChange={handleSelectOrigin}
                options={CAMPUS_ZONES}
                excludeValue={destZone}
                excludeReason="Current Destination"
                icon={MapPin}
              />
            </div>

            <button
              className="btn-swap-zones"
              onClick={handleSwapZones}
              title="Swap Origin and Destination"
            >
              <ArrowLeftRight size={16} />
            </button>

            <div className="selector-field">
              <span className="field-label font-mono">I WANT TO GO TO (DESTINATION)</span>
              <CampusZoneSelect
                value={destZone}
                onChange={handleSelectDest}
                options={CAMPUS_ZONES}
                excludeValue={originZone}
                excludeReason="Current Departure"
                icon={Navigation}
              />
            </div>
          </div>

          {/* Preferences Sub-Bar */}
          {showPreferences && (
            <div className="preferences-drawer glass-panel font-mono">
              <span className="pref-title">OPTIMIZATION PREFERENCE:</span>
              <button
                className={`pref-chip ${activePreference === 'least_crowded' ? 'active' : ''}`}
                onClick={() => setActivePreference('least_crowded')}
              >
                🌿 Least Crowded (Bypass Chokes)
              </button>
              <button
                className={`pref-chip ${activePreference === 'shortest_distance' ? 'active' : ''}`}
                onClick={() => setActivePreference('shortest_distance')}
              >
                ⚡ Shortest Distance
              </button>
              <button
                className={`pref-chip ${activePreference === 'step_free' ? 'active' : ''}`}
                onClick={() => setActivePreference('step_free')}
              >
                ♿ Step-Free (ADA Ramps &amp; Lawn)
              </button>
              <button
                className={`pref-chip ${activePreference === 'food_restroom' ? 'active' : ''}`}
                onClick={() => setActivePreference('food_restroom')}
              >
                🍔 Food &amp; Refill Pitstop
              </button>
            </div>
          )}

          {/* Gate Operational Intelligence Alert Card */}
          {routeData?.gateOperationalInfo && (
            <div className="gate-intel-banner glass-panel font-mono">
              <div className="gate-intel-header">
                <span className="gate-tag-pill">
                  <span>🚪</span>
                  <span>{routeData.gateOperationalInfo.gateName}</span>
                </span>
              </div>
              <div className="gate-intel-body">
                <p><strong>Designation:</strong> {routeData.gateOperationalInfo.designatedFor}</p>
                <p><strong>Checkpoints:</strong> {routeData.gateOperationalInfo.checkpointType}</p>
                <div className="student-tip-row">
                  <span>💡</span>
                  <span><strong>Student Advice:</strong> {routeData.gateOperationalInfo.studentTip}</span>
                </div>
              </div>
            </div>
          )}

          {/* Route Comparison Dual Cards */}
          <div className="path-options-header font-mono">
            <Footprints size={14} className="text-cyan" />
            <span>AVAILABLE WALKING PATHS:</span>
          </div>

          <div className="route-cards-grid">
            {/* Card 1: Recommended Crowd-Free Path */}
            <div className={`route-card-recommended glass-panel ${selectedRouteType === 'recommended' ? 'active-selected' : ''}`}>
              <div className="route-card-top">
                <div className="path-label-wrap">
                  <span className="path-title-tag font-mono">PATH 1</span>
                  <div className="recommended-badge font-mono">
                    <span className="dot-live-green"></span>
                    <span>RECOMMENDED • LEAST CROWDED</span>
                  </div>
                </div>
                <div className="top-actions-wrap">
                  {timeSaved > 0 && (
                    <span className="save-mins-note font-mono">
                      Saves {timeSaved} min{timeSaved > 1 ? 's' : ''}
                    </span>
                  )}
                  <button
                    type="button"
                    className={`btn-select-path font-mono ${selectedRouteType === 'recommended' ? 'active' : ''}`}
                    onClick={() => setSelectedRouteType('recommended')}
                  >
                    {selectedRouteType === 'recommended' ? (
                      <>
                        <Check size={12} />
                        <span>ACTIVE ON MAP</span>
                      </>
                    ) : (
                      <span>USE THIS PATH</span>
                    )}
                  </button>
                </div>
              </div>

              <div className="route-time-row">
                <div className="time-stat-group">
                  <span className="route-minutes font-display">{recommended.totalMinutes} min</span>
                  <span className="route-distance font-mono">walk ({recommended.totalDistanceMeters} meters)</span>
                </div>
                <div className="pace-pill font-mono">
                  <span>🏃</span>
                  <span>{recommended.pace}</span>
                </div>
              </div>

              <div className="waypoints-box">
                <span className="waypoints-label font-mono">WALKING PATH VIA:</span>
                <p className="waypoints-flow font-body">
                  {cleanChokepointText(recommended.corridorSummary)}
                </p>
              </div>

              <div className="route-metrics-row font-mono">
                <div className="metric-chip">
                  <span className="chip-lbl">CROWD LEVEL</span>
                  <span className={`chip-val ${getCrowdDensityLevel(recommended.crowdDensityPct) === 'Low' ? 'text-success' : getCrowdDensityLevel(recommended.crowdDensityPct) === 'Medium' ? 'text-warning' : 'text-error'}`}>
                    {getCrowdDensityLevel(recommended.crowdDensityPct)}
                  </span>
                </div>
                <div className="metric-chip">
                  <span className="chip-lbl">WALK SURFACE</span>
                  <span className="chip-val">{recommended.surface}</span>
                </div>
              </div>

              {/* Turn-by-Turn Detailed Walkthrough Drawer (Always displayed directly) */}
              {recommended.steps && recommended.steps.length > 0 && (
                <div className="directions-timeline-wrap font-mono">
                  <span className="timeline-heading">CAMPUS TURN-BY-TURN GUIDANCE:</span>
                  <div className="timeline-steps-list">
                    {recommended.steps.map((step) => (
                      <div key={step.stepNumber} className="timeline-step-row">
                        <div className="step-num-pill">{step.stepNumber}</div>
                        <div className="step-body-col">
                          <span className="step-landmark">{cleanChokepointText(step.landmark)}</span>
                          <p className="step-instruction font-body">{step.instruction}</p>
                          <div className="step-meta-chips">
                            <span>{step.distanceMeters}m</span>
                            <span>•</span>
                            <span>~{Math.round(step.baseWalkSeconds / 60) || 1} min</span>
                            <span>•</span>
                            <span className="text-success">{step.surfaceType}</span>
                            <span>•</span>
                            <span className="text-cyan">{step.paceDescription}</span>
                          </div>
                          {step.studentProTip && (
                            <div className="student-tip-box font-mono">
                              <span>💡</span>
                              <span>{step.studentProTip}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Advisory: Why this route is recommended */}
              <div className="why-optimal-card font-mono">
                <div className="why-optimal-header">
                  <CheckCircle2 size={13} className="text-success" />
                  <span>WHY THIS ROUTE IS RECOMMENDED:</span>
                </div>
                <p className="why-optimal-text font-body">
                  Bypasses crowded central walkways via the shaded PICA Architecture Lawn and wide ADA ramps. Continuous smooth walking pace with zero stairs.
                </p>
              </div>
            </div>

            {/* Card 2: Standard Option */}
            {standard && (
              <div className={`route-card-standard glass-panel ${selectedRouteType === 'standard' ? 'active-selected-standard' : ''}`}>
                <div className="route-card-top">
                  <div className="path-label-wrap">
                    <span className="path-title-tag font-mono">PATH 2</span>
                    <span className="congestion-pill font-mono">
                      <span className="dot-live-amber"></span>
                      <span>DIRECT • HIGH FOOT TRAFFIC</span>
                    </span>
                  </div>
                  <div className="top-actions-wrap">
                    {standard.delayMinutes > 0 && (
                      <div className="delay-box font-mono">
                        <span>+{standard.delayMinutes} min delay</span>
                      </div>
                    )}
                    <button
                      type="button"
                      className={`btn-select-path btn-select-path-standard font-mono ${selectedRouteType === 'standard' ? 'active-standard' : ''}`}
                      onClick={() => setSelectedRouteType('standard')}
                    >
                      {selectedRouteType === 'standard' ? (
                        <>
                          <Check size={12} />
                          <span>ACTIVE ON MAP</span>
                        </>
                      ) : (
                        <span>USE THIS PATH</span>
                      )}
                    </button>
                  </div>
                </div>

                <div className="route-time-row">
                  <div className="time-stat-group">
                    <span className="route-minutes text-muted font-display">{standard.totalMinutes} min</span>
                    <span className="route-distance font-mono">walk ({standard.totalDistanceMeters} meters)</span>
                  </div>
                  <div className="pace-pill font-mono">
                    <span>🚶</span>
                    <span>{cleanChokepointText(standard.pace)}</span>
                  </div>
                </div>

                <div className="waypoints-box">
                  <span className="waypoints-label font-mono">WALKING PATH VIA:</span>
                  <p className="waypoints-flow font-body">
                    {cleanChokepointText(standard.corridorSummary)}
                  </p>
                </div>

                <div className="route-metrics-row font-mono">
                  <div className="metric-chip">
                    <span className="chip-lbl">CROWD LEVEL</span>
                    <span className={`chip-val ${getCrowdDensityLevel(standard.crowdDensityPct) === 'Low' ? 'text-success' : getCrowdDensityLevel(standard.crowdDensityPct) === 'Medium' ? 'text-warning' : 'text-error'}`}>
                      {getCrowdDensityLevel(standard.crowdDensityPct)}
                    </span>
                  </div>
                  <div className="metric-chip">
                    <span className="chip-lbl">WALK SURFACE</span>
                    <span className="chip-val">{standard.surface}</span>
                  </div>
                </div>

                {/* Turn-by-Turn Detailed Walkthrough Drawer (Always displayed directly without touching button) */}
                {standard.steps && standard.steps.length > 0 && (
                  <div className="directions-timeline-wrap font-mono">
                    <span className="timeline-heading">CAMPUS TURN-BY-TURN GUIDANCE:</span>
                    <div className="timeline-steps-list">
                      {standard.steps.map((step) => (
                        <div key={step.stepNumber} className="timeline-step-row">
                          <div className="step-num-pill step-num-pill-standard">{step.stepNumber}</div>
                          <div className="step-body-col">
                            <span className="step-landmark">{cleanChokepointText(step.landmark)}</span>
                            <p className="step-instruction font-body">{cleanChokepointText(step.instruction)}</p>
                            <div className="step-meta-chips">
                              <span>{step.distanceMeters}m</span>
                              <span>•</span>
                              <span>~{Math.round(step.baseWalkSeconds / 60) || 1} min</span>
                              <span>•</span>
                              <span>{step.surfaceType}</span>
                              {step.isChokepoint && (
                                <>
                                  <span>•</span>
                                  <span className="text-warning font-bold">Crowded Main Walkway</span>
                                </>
                              )}
                            </div>
                            {step.studentProTip && (
                              <div className="student-tip-box font-mono">
                                <span>💡</span>
                                <span>{cleanChokepointText(step.studentProTip)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Problem Below It: Why this route is not optimal */}
                <div className="why-slower-card">
                  <div className="why-slower-header font-mono">
                    <AlertTriangle size={13} className="text-warning" />
                    <span>WHY THIS ROUTE IS NOT OPTIMAL:</span>
                  </div>
                  <p className="why-slower-text font-body">
                    Direct path through the central campus axis. While physically shorter in distance, high festival foot traffic and stage crossroads cause crowd congestion and slower movement.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 3: Interactive Wayfinding Map */}
        <section className="interactive-wayfinding-section">
          <MapView
            zones={zones}
            transitEdges={transitEdges}
            venues={venues}
            forecast={forecast}
            isVisitorView={true}
            routeData={routeData}
            originZone={originZone}
            destZone={destZone}
            selectedRouteType={selectedRouteType}
            onSelectRouteType={setSelectedRouteType}
            onSelectOrigin={handleSelectOrigin}
            onSelectDest={handleSelectDest}
            festivalPhase={festivalPhase}
            gateStatuses={gateStatuses}
          />
        </section>

        {/* SECTION 4: Live Spot Finder Discovery Hub */}
        <section className="discovery-hub-section">
          <div className="section-header-row">
            <div className="section-title-group">
              <span className="section-eyebrow font-mono">LIVE SPOT FINDER</span>
              <h2 className="section-main-title font-display">&quot;Skip the Queues&quot; Nearby Discovery Hub</h2>
            </div>
            <span className="recalc-note font-mono">Estimated wait based on live sensor tracking</span>
          </div>

          {/* Filter Chips Bar */}
          <div className="filter-chips-row font-mono">
            <button
              className={`filter-chip ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              All Zones ({concessionsList.length || 12})
            </button>
            <button
              className={`filter-chip ${activeCategory === 'food' ? 'active' : ''}`}
              onClick={() => setActiveCategory('food')}
            >
              🍔 Food &amp; Drinks
            </button>
            <button
              className={`filter-chip ${activeCategory === 'relax' ? 'active' : ''}`}
              onClick={() => setActiveCategory('relax')}
            >
              🌳 Shaded Chill Spots
            </button>
            <button
              className={`filter-chip ${activeCategory === 'screens' ? 'active' : ''}`}
              onClick={() => setActiveCategory('screens')}
            >
              📺 Giant 4K Screens
            </button>
            <button
              className={`filter-chip ${activeCategory === 'restrooms' ? 'active' : ''}`}
              onClick={() => setActiveCategory('restrooms')}
            >
              🚻 Restrooms
            </button>
            <button
              className={`filter-chip ${activeCategory === 'transit' ? 'active' : ''}`}
              onClick={() => setActiveCategory('transit')}
            >
              🚆 Transit Exits
            </button>
          </div>

          {/* Dynamic Discovery Cards Grid */}
          <div className="discovery-cards-grid">
            {(concessionsList && concessionsList.length > 0 ? concessionsList : [
              {
                _id: 'poi-canteen-main',
                name: 'Campus Canteen & Food Stalls',
                category: 'food',
                zoneId: 'zone-canteen-back',
                parentZoneName: 'Campus Canteen & Boys Gate 2',
                description: 'Frankie, Dosa, Nescafe, juice counters, and fast snacks.',
                liveWaitMinutes: 3,
                liveOccupancyPct: 45,
                capacityRating: 'moderate',
                items: ['Veg Frankie', 'Cold Coffee', 'Masala Dosa'],
              },
              {
                _id: 'poi-pica-lawn',
                name: 'PICA Architecture Lawn & Courtyard',
                category: 'relax',
                zoneId: 'zone-sports-ground',
                parentZoneName: 'PICA Lawn & Sports Ground',
                description: 'Shaded seating, phone charging stations, free chilled water dispensers, acoustic sets.',
                liveWaitMinutes: 0,
                liveOccupancyPct: 25,
                capacityRating: 'low',
                items: ['Cold Water Refill', 'Power Banks', 'Acoustic Stage'],
              },
              {
                _id: 'poi-restroom-atrium',
                name: 'Engineering Ground Floor Restrooms',
                category: 'restrooms',
                zoneId: 'zone-atrium-main',
                parentZoneName: 'Engineering Atrium & Gate 1',
                description: '10 clean stalls, ADA compliant with ramp, dedicated attendants.',
                liveWaitMinutes: 0,
                liveOccupancyPct: 20,
                capacityRating: 'low',
                items: ['Clean Stalls', 'Wheelchair Ramp', 'Soap Dispensers'],
              },
            ]).map((c) => {
              const isBmarked = bookmarkedIds.has(c._id || c.concessionId);
              return (
                <div key={c._id || c.concessionId} className="discovery-card glass-panel">
                  <div className="disc-card-top">
                    <span className="disc-cat-tag font-mono">
                      {c.category === 'food' ? '🍔 FOOD & REFRESHMENTS' :
                       c.category === 'restrooms' ? '🚻 ESSENTIAL FACILITIES' :
                       c.category === 'transit' ? '🛺 TRANSIT & AUTO FEEDER' :
                       c.category === 'screens' ? '📺 4K LIVESTREAM SCREEN' : '🌳 RELAX & RECHARGE'}
                    </span>
                    <button
                      className={`disc-bookmark-btn ${isBmarked ? 'active' : ''}`}
                      onClick={() => handleToggleBookmark(c._id || c.concessionId)}
                      title="Bookmark Spot"
                    >
                      <Bookmark size={15} fill={isBmarked ? '#4cd7f6' : 'none'} />
                    </button>
                  </div>

                  <h3 className="disc-title font-display">{c.name}</h3>
                  <span className="disc-location font-mono">📍 {c.parentZoneName || c.zoneId}</span>

                  <div className="disc-stat-highlight font-mono">
                    <span className="highlight-label">LIVE QUEUE / OCCUPANCY</span>
                    <div className="highlight-flex">
                      <span className={`highlight-val ${c.liveWaitMinutes <= 3 ? 'text-success' : c.liveWaitMinutes <= 8 ? 'text-warning' : 'text-error'}`}>
                        {c.liveWaitMinutes} min wait
                      </span>
                      <span className="highlight-vs text-muted">
                        ({c.liveOccupancyPct}% load • {c.capacityRating})
                      </span>
                    </div>
                  </div>

                  <p className="disc-body-desc font-body">{c.description}</p>
                  <span className="disc-caption font-mono">
                    ● {c.items?.slice(0, 3).join(', ') || 'Active Checkpoint'}
                  </span>

                  <button
                    className="btn-disc-direct font-mono"
                    onClick={() => handleDirectTo(c.zoneId)}
                  >
                    <span>Directions Here</span>
                    <span>&rarr;</span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 4.5: Real-Time Facility & Checkpoints Radar */}
        {facilityWaitTimes && facilityWaitTimes.length > 0 && (
          <section className="facility-radar-section glass-panel">
            <div className="section-header-row">
              <div className="section-title-group">
                <span className="section-eyebrow font-mono">LIVE GATE STATUS</span>
                <h2 className="section-main-title font-display">Live Gate &amp; Facility Wait Times</h2>
              </div>
              <span className="recalc-note font-mono">Sensor frequency: 5s pulse</span>
            </div>

            <div className="facility-cards-grid font-mono">
              {facilityWaitTimes.map((f) => (
                <div key={f.facilityId} className={`facility-check-card status-${f.status}`}>
                  <div className="fac-card-header">
                    <span className="fac-name font-display">{f.name}</span>
                    <span className={`fac-status-tag status-${f.status}`}>{f.statusLabel}</span>
                  </div>
                  <div className="fac-card-meta">
                    <span>📍 {f.zoneName}</span>
                    <span>•</span>
                    <span>{f.activeLanes} Active Lanes</span>
                    <span>•</span>
                    <span>Load: {f.capacityPct}%</span>
                  </div>
                  <div className="fac-tip-row">
                    <span>💡</span>
                    <span>{f.tip}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 5: Bottom Auxiliary Cards (Transit Sync & Ops Clearance) */}
        <section className="auxiliary-bottom-grid">
          {/* Card 1: Egress Transit Sync */}
          <div className="transit-sync-card glass-panel">
            <div className="transit-details-col">
              <div className="transit-sync-header">
                <span className="sync-eyebrow font-mono">🛺 TRANSIT &amp; STATION SYNC</span>
                <span className="sync-platform font-mono">Auto Depot Load: 44%</span>
              </div>

              <h4 className="transit-sync-title font-display">Sector 16 Auto Stand &amp; Station Shuttles Running</h4>

              <p className="transit-sync-body font-body">
                Auto-rickshaws and NMMT buses to Panvel Railway Station depart every 2-3 minutes. Boys exit via Canteen Back Gate 2 to reach the auto line directly without Gate 1 congestion.
              </p>

              {/* Real-time local train pulse preview */}
              <div className="train-live-ticker font-mono">
                <span className="ticker-pulse-dot"></span>
                <span>Next Panvel Local: <strong>CSMT in 5m (PF 2)</strong> &bull; <strong>Thane in 12m (PF 1)</strong></span>
              </div>

              <div className="transit-sync-buttons font-mono">
                <button
                  type="button"
                  className="btn-aux-ghost font-mono btn-train-schedule"
                  onClick={() => setShowTrainSchedule(true)}
                >
                  <Train size={13} />
                  <span>Panvel Local Schedule</span>
                </button>
                <button
                  type="button"
                  className="btn-aux-ghost font-mono btn-auto-directions"
                  onClick={() => handleDirectTo('zone-panvel-transit')}
                  aria-label="Show walking path to Sector 16 Auto Stand"
                  title="Navigate from your current location to Sector 16 Auto Stand"
                >
                  <Navigation size={13} className="text-cyan" />
                  <span>Sector 16 Auto Stand Path</span>
                  <span aria-hidden="true">&rarr;</span>
                </button>
              </div>
            </div>
          </div>


        </section>
      </div>

      {/* Panvel Railway Station Real-Time Departures Modal */}
      {showTrainSchedule && (
        <div
          className="train-modal-backdrop"
          onClick={() => setShowTrainSchedule(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="train-modal-title"
        >
          <div className="train-modal-card glass-panel font-display" onClick={(e) => e.stopPropagation()}>
            <div className="train-modal-header">
              <div className="train-modal-title-wrap">
                <div className="train-modal-badge font-mono">
                  <span className="dot-live-green"></span>
                  <span>PANVEL RAILWAY STATION &bull; REAL-TIME DEPARTURES</span>
                </div>
                <h3 className="train-modal-title">Panvel Local Train Timetable</h3>
                <p className="train-modal-subtitle font-body">
                  Upcoming departures from Panvel towards CSMT (Harbour), Thane (Trans-Harbour) &amp; Western line.
                </p>
              </div>
              <button
                type="button"
                className="btn-train-modal-close font-mono"
                onClick={() => setShowTrainSchedule(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Line Filter Tabs */}
            <div className="train-filter-bar font-mono">
              {[
                { key: 'all', label: 'All Lines' },
                { key: 'Harbour', label: 'Harbour (CSMT)' },
                { key: 'Trans-Harbour', label: 'Trans-Harbour (Thane)' },
                { key: 'Western Link', label: 'Western (Goregaon)' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`train-tab-chip ${activeTrainFilter === tab.key ? 'active' : ''}`}
                  onClick={() => setActiveTrainFilter(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Departures List */}
            <div className="trains-departure-list font-mono">
              {getUpcomingPanvelTrains()
                .filter((t) => activeTrainFilter === 'all' || t.line === activeTrainFilter)
                .map((train) => (
                  <div key={train.id} className="train-row-card">
                    <div className="train-dest-info">
                      <div className="train-dest-title-row font-display">
                        <span className="train-dest-name">{train.dest}</span>
                        <span className={`train-speed-badge ${train.type.toLowerCase()}`}>{train.type}</span>
                      </div>
                      <div className="train-route-meta font-mono">
                        <span className="line-tag">{train.line} Line</span>
                        <span className="dot-sep">&bull;</span>
                        <span className="pf-tag">{train.pf}</span>
                      </div>
                    </div>

                    <div className="train-timing-block">
                      <span className="train-dep-clock font-display">{train.timeFormatted}</span>
                      <span className="train-countdown-pill font-mono">in {train.offsetMins} mins</span>
                    </div>

                    <div className="train-status-block">
                      <span className={`train-delay-pill font-mono ${train.status === 'On Time' ? 'ontime' : 'delayed'}`}>
                        {train.status}
                      </span>
                      <span className="train-crowd-hint font-mono">
                        Crowd: <strong>{train.crowd}</strong>
                      </span>
                    </div>
                  </div>
                ))}
            </div>

            {/* Footer with Shuttle Advice & m-Indicator Link */}
            <div className="train-modal-footer">
              <div className="station-shuttle-note font-body">
                <span>🛺</span>
                <span>
                  <strong>Campus to Station:</strong> Take Sector 16 Auto from Gate 2 (~8 mins, ₹25–30 shared). Plan to leave campus 15 mins before your train departs.
                </span>
              </div>
              <div className="train-modal-actions font-mono">
                <button
                  type="button"
                  className="btn-train-modal-done"
                  onClick={() => setShowTrainSchedule(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Aerospace System Footer */}
      <footer className="app-aerospace-footer">
        <div>CROWDPULSE CORE ENGINE v4.8.2  •  AEROSPACE-GRADE TELEMETRY</div>
        <div>© 2025 CrowdPulse Logistics Network. Secured Feed.</div>
      </footer>

      <style>{`
        .visitor-view-root {
          min-height: calc(100vh - var(--nav-height));
          background: transparent;
          display: flex;
          flex-direction: column;
        }

        .visitor-content-container {
          max-width: 1360px;
          width: 100%;
          margin: 0 auto;
          padding: 24px 24px;
          display: flex;
          flex-direction: column;
          gap: 32px;
          flex: 1;
        }

        /* Announcements & Live Broadcast Stack */
        .announcements-banner-stack {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .live-announcement-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 18px;
          border-radius: 8px;
          background: rgba(14, 165, 233, 0.08);
          border: 1px solid rgba(14, 165, 233, 0.3);
          color: #0284c7;
          font-size: 0.8rem;
          box-shadow: 0 2px 10px rgba(14, 165, 233, 0.06);
        }
        .live-announcement-card.severity-warning {
          background: rgba(245, 158, 11, 0.08);
          border-color: rgba(245, 158, 11, 0.35);
          color: #b45309;
        }
        .live-announcement-card.severity-urgent {
          background: rgba(225, 29, 72, 0.08);
          border-color: rgba(225, 29, 72, 0.35);
          color: #e11d48;
        }
        .announcement-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }
        .announcement-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-weight: 800;
          font-size: 0.68rem;
          letter-spacing: 0.05em;
          padding: 3px 8px;
          border-radius: 4px;
          background: rgba(14, 165, 233, 0.15);
        }
        .announcement-meta {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .author-tag {
          font-size: 0.7rem;
          opacity: 0.7;
        }
        .btn-dismiss-announcement {
          background: transparent;
          border: none;
          color: currentColor;
          opacity: 0.6;
          cursor: pointer;
          font-size: 0.85rem;
          padding: 2px 6px;
          border-radius: 4px;
          transition: all 0.15s ease;
        }
        .btn-dismiss-announcement:hover {
          opacity: 1;
          background: rgba(0, 0, 0, 0.05);
        }

        /* Floating Reminder Confirmation Toast */
        .reminder-toast-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          border-radius: 6px;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #065f46;
          font-size: 0.82rem;
          font-weight: 600;
          animation: fadeIn 0.3s ease;
        }

        /* Facility Wait Times Radar */
        .facility-radar-section {
          padding: 24px;
          border-radius: var(--radius-lg);
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(226, 232, 240, 0.8);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .facility-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 16px;
        }
        .facility-check-card {
          padding: 16px;
          border-radius: 8px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 8px;
          box-shadow: 0 1px 4px rgba(15, 23, 42, 0.04);
        }
        .facility-check-card.status-optimal {
          border-left: 4px solid #10b981;
        }
        .facility-check-card.status-moderate {
          border-left: 4px solid #f59e0b;
        }
        .facility-check-card.status-gridlock {
          border-left: 4px solid #e11d48;
          background: #fff1f2;
        }
        .fac-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .fac-name {
          font-size: 0.92rem;
          font-weight: 700;
          color: #0f172a;
        }
        .fac-status-tag {
          font-size: 0.68rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 4px;
        }
        .fac-status-tag.status-optimal {
          background: #ecfdf5;
          color: #059669;
        }
        .fac-status-tag.status-moderate {
          background: #fffbeb;
          color: #d97706;
        }
        .fac-status-tag.status-gridlock {
          background: #ffe4e6;
          color: #e11d48;
        }
        .fac-card-meta {
          font-size: 0.72rem;
          color: #64748b;
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .fac-tip-row {
          font-size: 0.74rem;
          color: #475569;
          display: flex;
          gap: 6px;
          align-items: center;
          margin-top: 4px;
        }

        /* SECTION 1: Hero Section */
        .visitor-hero-section {
          display: grid;
          grid-template-columns: 1.25fr 1fr;
          gap: 32px;
          align-items: center;
        }
        @media (max-width: 960px) {
          .visitor-hero-section {
            grid-template-columns: 1fr;
          }
        }

        .hero-left-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .flow-guide-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.68rem;
          font-weight: 700;
          color: #059669;
          letter-spacing: 0.08em;
        }
        .dot-live-green {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        }
        .dot-live-red {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #e11d48;
          box-shadow: 0 0 8px #e11d48;
        }
        .hero-main-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.15;
          letter-spacing: -0.02em;
        }
        .hero-mode-subtitle {
          font-size: 1.18rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          margin-top: -4px;
        }
        .hero-mode-subtitle.subtitle-egress {
          color: #ea580c;
        }
        .hero-mode-subtitle.subtitle-ingress {
          color: #0284c7;
        }
        .hero-mode-subtitle.subtitle-midday {
          color: #10b981;
        }
        .hero-description {
          font-size: 0.95rem;
          color: #475569;
          line-height: 1.5;
          max-width: 620px;
        }
        .hero-feature-tags {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 4px;
        }
        .feature-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 5px 12px;
          border-radius: var(--radius-full);
          font-size: 0.72rem;
          color: #475569;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }

        /* Optimal Travel Window Card */
        .optimal-window-card {
          padding: 22px 24px;
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(226, 232, 240, 0.85);
          border-radius: var(--radius-xl);
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 4px 20px rgba(100, 116, 139, 0.08);
          transition: all 0.2s ease;
        }
        .optimal-window-card:hover {
          box-shadow: 0 8px 24px rgba(100, 116, 139, 0.12);
          border-color: rgba(99, 102, 241, 0.25);
        }
        .window-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .window-label {
          font-size: 0.65rem;
          font-weight: 800;
          color: #64748b;
          letter-spacing: 0.08em;
        }
        .window-status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #059669;
          font-size: 0.68rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: var(--radius-full);
        }
        .window-target-row {
          display: flex;
          align-items: baseline;
          gap: 10px;
        }
        .target-time {
          font-size: 2.2rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1;
        }
        .target-desc {
          font-size: 0.75rem;
          color: #64748b;
        }
        .delay-estimate-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(14, 165, 233, 0.07);
          border: 1px solid rgba(14, 165, 233, 0.25);
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 0.76rem;
          color: #0369a1;
          flex-wrap: wrap;
        }
        .delay-text {
          flex: 1;
          line-height: 1.35;
        }
        .delay-minutes-highlight {
          background: #fee2e2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 3px 8px;
          border-radius: 4px;
          font-weight: 800;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }
        .window-advice {
          font-size: 0.8rem;
          color: #334155;
          line-height: 1.45;
        }
        .btn-reminder-notification {
          width: 100%;
          padding: 10px 16px;
          background: #0f172a;
          color: #ffffff;
          border: none;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.15);
          margin-top: 4px;
        }
        .btn-reminder-notification:hover {
          background: #1e293b;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.22);
        }
        .btn-reminder-notification.set {
          background: #059669;
          color: #ffffff;
        }

        /* SECTION 2: Routing Assistant */
        .routing-assistant-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .section-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          flex-wrap: wrap;
          gap: 12px;
        }
        .section-title-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .section-eyebrow {
          font-size: 0.65rem;
          color: #64748b;
          font-weight: 800;
          letter-spacing: 0.08em;
        }
        .section-main-title {
          font-size: 1.45rem;
          font-weight: 800;
          color: #0f172a;
        }
        .recalc-note {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          color: #64748b;
        }

        .route-selector-bar {
          position: relative;
          z-index: 50;
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(226, 232, 240, 0.85);
          border-radius: var(--radius-lg);
          display: flex;
          align-items: flex-end;
          gap: 14px;
          flex-wrap: wrap;
          box-shadow: 0 2px 10px rgba(100, 116, 139, 0.06);
        }
        .selector-field {
          flex: 1;
          min-width: 220px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          position: relative;
        }
        .field-label {
          font-size: 0.64rem;
          color: #64748b;
          font-weight: 800;
          letter-spacing: 0.06em;
        }
        .field-input-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          padding: 9px 12px;
          border-radius: 8px;
        }
        .clean-select {
          background: transparent;
          border: none;
          color: #0f172a;
          font-size: 0.88rem;
          font-weight: 600;
          width: 100%;
          outline: none;
        }
        /* Custom Themed Zone Dropdown */
        .custom-zone-select {
          position: relative;
          width: 100%;
          z-index: 10;
        }
        .custom-zone-select.open {
          z-index: 100;
        }
        .custom-select-trigger {
          width: 100%;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          padding: 0 14px;
          border-radius: 8px;
          color: #0f172a;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          outline: none;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }
        .custom-select-trigger:hover, .custom-select-trigger.open {
          background: #ffffff;
          border-color: #38bdf8;
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
        }
        .trigger-left {
          display: flex;
          align-items: center;
          gap: 10px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .trigger-icon {
          flex-shrink: 0;
        }
        .trigger-text {
          font-size: 0.88rem;
          font-weight: 600;
          color: #0f172a;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .trigger-chevron {
          color: #64748b;
          transition: transform 0.2s ease;
          flex-shrink: 0;
        }
        .trigger-chevron.rotated {
          transform: rotate(180deg);
        }
        .custom-select-menu {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          box-shadow: 0 16px 36px -4px rgba(15, 23, 42, 0.2), 0 6px 14px rgba(15, 23, 42, 0.08);
          z-index: 1000;
          max-height: 280px;
          overflow-y: auto;
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          animation: fadeIn 0.15s ease;
        }
        .custom-select-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.1s ease;
        }
        .custom-select-option:hover {
          background: #f1f5f9;
        }
        .custom-select-option.selected {
          background: #e0f2fe;
        }
        .custom-select-option.disabled {
          opacity: 0.45;
          cursor: not-allowed;
          background: transparent !important;
        }
        .custom-select-option.disabled:hover {
          background: transparent !important;
        }
        .option-disabled-badge {
          font-size: 0.62rem;
          font-weight: 700;
          color: #94a3b8;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          padding: 2px 7px;
          border-radius: 4px;
          letter-spacing: 0.03em;
        }
        .option-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .option-label {
          font-size: 0.86rem;
          font-weight: 700;
          color: #0f172a;
        }
        .option-sublabel {
          font-size: 0.68rem;
          color: #64748b;
        }

        .btn-swap-zones {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
          flex-shrink: 0;
        }
        .btn-swap-zones:hover {
          color: #0284c7;
          background: #f0f9ff;
          border-color: #38bdf8;
          transform: rotate(180deg);
        }
        .btn-preferences {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          height: 40px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #334155;
          padding: 0 14px;
          border-radius: 8px;
          font-size: 0.76rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
          transition: all 0.15s ease;
          white-space: nowrap;
        }
        .btn-preferences:hover {
          background: #f8fafc;
          color: #0f172a;
          border-color: #94a3b8;
        }
        .btn-preferences.active {
          background: #e0f2fe;
          border-color: #38bdf8;
          color: #0284c7;
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.12);
        }

        /* Themed Optimization Preference Drawer */
        .preferences-drawer {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(226, 232, 240, 0.85);
          border-radius: var(--radius-lg);
          box-shadow: 0 2px 12px rgba(100, 116, 139, 0.06);
          flex-wrap: wrap;
          margin-top: -8px;
          animation: fadeIn 0.2s ease;
        }
        .pref-title {
          font-size: 0.68rem;
          font-weight: 800;
          color: #64748b;
          letter-spacing: 0.06em;
          margin-right: 4px;
        }
        .pref-chip {
          padding: 7px 14px;
          border-radius: var(--radius-full);
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #475569;
          font-size: 0.74rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }
        .pref-chip:hover {
          background: #f1f5f9;
          color: #0f172a;
          border-color: #cbd5e1;
          transform: translateY(-1px);
        }
        .pref-chip.active {
          background: #e0f2fe;
          border-color: #38bdf8;
          color: #0284c7;
          box-shadow: 0 2px 8px rgba(14, 165, 233, 0.18);
        }

        .path-options-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.72rem;
          font-weight: 800;
          color: #64748b;
          letter-spacing: 0.06em;
          margin-bottom: -4px;
        }
        .path-label-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .path-title-tag {
          font-size: 0.65rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: 0.08em;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          padding: 3px 8px;
          border-radius: 4px;
        }

        .route-cards-grid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 860px) {
          .route-cards-grid {
            grid-template-columns: 1fr;
          }
        }

        .route-card-recommended {
          padding: 22px 24px;
          background: #ffffff;
          border: 1px solid #bae6fd;
          border-radius: var(--radius-xl);
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: 0 4px 20px -2px rgba(14, 165, 233, 0.12);
          transition: all 0.2s ease;
        }
        .route-card-recommended:hover {
          box-shadow: 0 8px 24px -2px rgba(14, 165, 233, 0.18);
          transform: translateY(-1px);
        }
        .route-card-recommended.active-selected {
          border-color: #38bdf8;
          box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.35), 0 8px 24px -2px rgba(14, 165, 233, 0.18);
        }
        .route-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .top-actions-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-select-path {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #475569;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }
        .btn-select-path:hover {
          background: #f8fafc;
          border-color: #94a3b8;
          color: #0f172a;
          transform: translateY(-1px);
        }
        .btn-select-path.active {
          background: #0284c7;
          border-color: #0284c7;
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(2, 132, 199, 0.25);
        }
        .btn-select-path-standard.active-standard {
          background: #ea580c;
          border-color: #ea580c;
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(234, 88, 12, 0.25);
        }
        .recommended-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #059669;
          font-size: 0.68rem;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: var(--radius-full);
          letter-spacing: 0.04em;
        }
        .save-mins-note {
          font-size: 0.68rem;
          color: #64748b;
        }
        .route-time-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .time-stat-group {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .route-minutes {
          font-size: 2.2rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1;
        }
        .route-distance {
          font-size: 0.8rem;
          color: #64748b;
        }
        .pace-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          padding: 4px 10px;
          border-radius: var(--radius-full);
          font-size: 0.72rem;
          color: #0f172a;
        }

        .waypoints-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 10px 14px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .waypoints-label {
          font-size: 0.62rem;
          color: #64748b;
          font-weight: 800;
          letter-spacing: 0.06em;
        }
        .waypoints-flow {
          font-size: 0.8rem;
          color: #0f172a;
        }

        .route-metrics-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .metric-chip {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 6px 10px;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .chip-lbl {
          font-size: 0.58rem;
          color: #64748b;
          font-weight: 800;
        }
        .chip-val {
          font-size: 0.76rem;
          font-weight: 700;
          color: #0f172a;
        }

        .btn-start-nav {
          width: 100%;
          padding: 12px 18px;
          background: #0f172a;
          color: #ffffff;
          border: none;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.15s;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.15);
        }
        .btn-start-nav:hover {
          background: #1e293b;
          transform: translateY(-1px);
        }
        .btn-start-nav-standard {
          background: #334155;
        }
        .btn-start-nav-standard:hover {
          background: #1e293b;
        }

        /* Why This Route Is Slower / Recommended Cards */
        .why-slower-card {
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-left: 3px solid #f59e0b;
          border-radius: 8px;
          padding: 10px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: auto;
        }
        .why-slower-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.65rem;
          font-weight: 800;
          color: #92400e;
          letter-spacing: 0.05em;
        }
        .why-slower-text {
          font-size: 0.76rem;
          color: #78350f;
          line-height: 1.4;
          margin: 0;
        }

        .why-optimal-card {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-left: 3px solid #10b981;
          border-radius: 8px;
          padding: 10px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: auto;
        }
        .why-optimal-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.65rem;
          font-weight: 800;
          color: #065f46;
          letter-spacing: 0.05em;
        }
        .why-optimal-text {
          font-size: 0.76rem;
          color: #047857;
          line-height: 1.4;
          margin: 0;
        }

        /* Gate Operational Intelligence Banner */
        .gate-intel-banner {
          position: relative;
          z-index: 1;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-left: 4px solid #0284c7;
          border-radius: var(--radius-md);
          padding: 14px 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          box-shadow: 0 2px 10px rgba(100, 116, 139, 0.08);
        }
        .gate-intel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }
        .gate-tag-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 800;
          color: #0f172a;
          font-size: 0.82rem;
        }
        .gate-wait-pill {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #16a34a;
          font-size: 0.72rem;
          padding: 3px 8px;
          border-radius: 4px;
          font-weight: 700;
        }
        .gate-intel-body {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 0.76rem;
          color: #475569;
        }
        .student-tip-row {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          background: #fefce8;
          border: 1px solid #fef08a;
          padding: 6px 10px;
          border-radius: 6px;
          color: #854d0e;
          font-size: 0.72rem;
        }

        /* Turn-by-Turn Timeline Drawer */
        .directions-timeline-wrap {
          margin-top: 8px;
          border-top: 1px solid #e2e8f0;
          padding-top: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .timeline-heading {
          font-size: 0.68rem;
          font-weight: 800;
          color: #64748b;
          letter-spacing: 0.06em;
        }
        .timeline-steps-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .timeline-step-row {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 10px 14px;
          border-radius: 8px;
        }
        .step-num-pill {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #0284c7;
          color: #ffffff;
          font-size: 0.72rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .step-num-pill-standard {
          background: #475569;
          box-shadow: 0 2px 6px rgba(71, 85, 105, 0.25);
        }
        .step-body-col {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }
        .step-landmark {
          font-size: 0.82rem;
          font-weight: 800;
          color: #0f172a;
        }
        .step-instruction {
          font-size: 0.78rem;
          color: #475569;
          line-height: 1.4;
          margin: 0;
        }
        .step-meta-chips {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.68rem;
          color: #64748b;
          margin-top: 2px;
        }
        .student-tip-box {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          background: #fefce8;
          border: 1px solid #fef08a;
          padding: 4px 8px;
          border-radius: 4px;
          color: #854d0e;
          font-size: 0.7rem;
          margin-top: 4px;
        }
        .standard-steps-preview {
          margin-top: 8px;
          border-top: 1px solid #e2e8f0;
          padding-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 0.72rem;
        }
        .standard-step-mini {
          display: flex;
          justify-content: space-between;
          padding: 4px 8px;
          background: #f8fafc;
          border-radius: 4px;
          border: 1px solid #f1f5f9;
        }

        /* Standard Route Card */
        .route-card-standard {
          padding: 22px 24px;
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(226, 232, 240, 0.85);
          border-radius: var(--radius-xl);
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: 0 2px 10px rgba(100, 116, 139, 0.06);
          transition: all 0.2s ease;
        }
        .route-card-standard:hover {
          box-shadow: 0 6px 20px rgba(100, 116, 139, 0.1);
        }
        .route-card-standard.active-selected-standard {
          border-color: #f97316;
          box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.35), 0 8px 24px -2px rgba(234, 88, 12, 0.18);
        }
        .standard-label {
          font-size: 0.68rem;
          color: #64748b;
          font-weight: 800;
          letter-spacing: 0.04em;
        }
        .congestion-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #fffbeb;
          border: 1px solid #fde68a;
          color: #b45309;
          font-size: 0.68rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: var(--radius-full);
        }
        .dot-live-amber {
          width: 7px;
          height: 7px;
          background-color: #f59e0b;
          border-radius: 50%;
          display: inline-block;
          animation: pulse 2s infinite;
        }
        .delay-box {
          background: #fffbeb;
          border: 1px solid #fde68a;
          color: #b45309;
          font-size: 0.68rem;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 6px;
        }
        .quickbar-switch-btn {
          margin-left: auto;
          background: #0f172a;
          color: #ffffff;
          border: 1px solid #334155;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.68rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }
        .quickbar-switch-btn:hover {
          background: #1e293b;
          border-color: #64748b;
          transform: translateY(-1px);
        }
        .quickbar-saved-badge.warning-badge {
          background: #fffbeb;
          border-color: #fde68a;
          color: #b45309;
        }
        .standard-description {
          font-size: 0.78rem;
          color: #64748b;
          line-height: 1.4;
        }
        .btn-route-details {
          width: 100%;
          padding: 12px 18px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #0f172a;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.15s;
          margin-top: auto;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }
        .btn-route-details:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        /* SECTION 4: Discovery Hub */
        .discovery-hub-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .filter-chips-row {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
        }
        .filter-chip {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #64748b;
          padding: 6px 14px;
          border-radius: var(--radius-full);
          font-size: 0.72rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }
        .filter-chip:hover {
          color: #0f172a;
          border-color: #cbd5e1;
        }
        .filter-chip.active {
          background: #0f172a;
          border-color: #0f172a;
          color: #ffffff;
          font-weight: 800;
        }

        .discovery-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        @media (max-width: 960px) {
          .discovery-cards-grid {
            grid-template-columns: 1fr;
          }
        }

        .discovery-card {
          padding: 20px 22px;
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(226, 232, 240, 0.85);
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          gap: 10px;
          box-shadow: 0 2px 10px rgba(100, 116, 139, 0.06);
          transition: all 0.2s ease;
        }
        .discovery-card:hover {
          box-shadow: 0 6px 20px rgba(100, 116, 139, 0.1);
          border-color: rgba(99, 102, 241, 0.25);
        }
        .disc-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .disc-cat-tag {
          font-size: 0.65rem;
          font-weight: 800;
          color: #64748b;
          letter-spacing: 0.06em;
        }
        .disc-bookmark-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 2px;
          transition: color 0.15s;
        }
        .disc-bookmark-btn:hover {
          color: #0284c7;
        }
        .disc-bookmark-btn.active {
          color: #0284c7;
        }
        .disc-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.25;
        }
        .disc-location {
          font-size: 0.7rem;
          color: #64748b;
        }
        .disc-stat-highlight {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 8px 12px;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .highlight-label {
          font-size: 0.58rem;
          color: #64748b;
          font-weight: 800;
        }
        .highlight-flex {
          display: flex;
          align-items: baseline;
          gap: 8px;
          flex-wrap: wrap;
        }
        .highlight-val {
          font-size: 0.95rem;
          font-weight: 800;
        }
        .highlight-vs {
          font-size: 0.68rem;
        }
        .disc-body-desc {
          font-size: 0.76rem;
          color: #475569;
          line-height: 1.35;
        }
        .disc-caption {
          font-size: 0.68rem;
          color: #64748b;
        }
        .btn-disc-direct {
          width: 100%;
          padding: 8px 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #0f172a;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.15s;
          margin-top: auto;
        }
        .btn-disc-direct:hover {
          background: #f1f5f9;
          color: #0284c7;
          border-color: #cbd5e1;
        }

        /* SECTION 5: Bottom Auxiliary Grid */
        .auxiliary-bottom-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .transit-sync-card {
          padding: 20px 22px;
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(226, 232, 240, 0.85);
          border-radius: var(--radius-lg);
          display: flex;
          gap: 20px;
          align-items: center;
          box-shadow: 0 2px 10px rgba(100, 116, 139, 0.06);
          transition: all 0.2s ease;
        }
        .transit-sync-card:hover {
          box-shadow: 0 6px 20px rgba(100, 116, 139, 0.1);
        }
        .transit-thumb-col {
          display: flex;
          align-items: center;
        }
        .metro-thumb-mock {
          width: 90px;
          height: 90px;
          border-radius: 12px;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 1.6rem;
          color: #0284c7;
        }
        .metro-thumb-mock span {
          font-size: 0.72rem;
          font-weight: 700;
        }
        .transit-details-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .transit-sync-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.65rem;
          color: #64748b;
          font-weight: 800;
        }
        .sync-platform {
          color: #0284c7;
        }
        .transit-sync-title {
          font-size: 1rem;
          font-weight: 700;
          color: #0f172a;
        }
        .transit-sync-body {
          font-size: 0.76rem;
          color: #475569;
          line-height: 1.35;
        }
        .transit-sync-buttons {
          display: flex;
          gap: 10px;
          margin-top: 4px;
          flex-wrap: wrap;
        }
        .train-live-ticker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 4px 10px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 6px;
          font-size: 0.7rem;
          color: #166534;
          width: fit-content;
        }
        .ticker-pulse-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #16a34a;
          box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.3);
          animation: pulseRing 1.5s infinite;
        }
        .btn-aux-ghost {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #334155;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.15s;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
          text-decoration: none;
        }
        .btn-aux-ghost:hover {
          background: #f8fafc;
          color: #0f172a;
          border-color: #cbd5e1;
        }
        .btn-train-schedule {
          background: #f0f9ff;
          border-color: #bae6fd;
          color: #0284c7;
        }
        .btn-train-schedule:hover {
          background: #e0f2fe;
          border-color: #7dd3fc;
          color: #0369a1;
        }
        .btn-auto-directions {
          background: #ffffff;
          border-color: #cbd5e1;
          color: #0f172a;
        }
        .btn-auto-directions:hover {
          background: #f0f9ff;
          border-color: #38bdf8;
          color: #0284c7;
        }
        .btn-stepfree-quick {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 700;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-stepfree-quick:hover {
          background: #f1f5f9;
          border-color: #94a3b8;
          color: #0f172a;
        }
        .btn-stepfree-quick.active {
          background: #e0f2fe;
          border-color: #38bdf8;
          color: #0284c7;
          box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.3);
        }
        .routing-assistant-section:focus {
          outline: none;
        }

        /* Panvel Train Schedule Modal */
        .train-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 999;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.2s ease-out;
        }
        .train-modal-card {
          width: 100%;
          max-width: 680px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.18);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          max-height: 88vh;
        }
        .train-modal-header {
          padding: 20px 24px 16px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          background: #ffffff;
        }
        .train-modal-title-wrap {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .train-modal-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.65rem;
          color: #0284c7;
          font-weight: 800;
          letter-spacing: 0.06em;
        }
        .train-modal-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }
        .train-modal-subtitle {
          font-size: 0.78rem;
          color: #64748b;
          margin: 0;
        }
        .btn-train-modal-close {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 1rem;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-train-modal-close:hover {
          background: #f1f5f9;
          color: #0f172a;
          border-color: #cbd5e1;
        }

        .train-filter-bar {
          display: flex;
          gap: 8px;
          padding: 12px 24px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          overflow-x: auto;
        }
        .train-tab-chip {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.72rem;
          font-weight: 700;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #475569;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }
        .train-tab-chip:hover {
          background: #f1f5f9;
          color: #0f172a;
        }
        .train-tab-chip.active {
          background: #0284c7;
          color: #ffffff;
          border-color: #0284c7;
          box-shadow: 0 2px 6px rgba(2, 132, 199, 0.25);
        }

        .trains-departure-list {
          padding: 16px 24px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 380px;
          background: #fafafa;
        }
        .train-row-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
          transition: all 0.15s ease;
        }
        .train-row-card:hover {
          border-color: #bae6fd;
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.08);
        }
        .train-dest-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
          flex: 1.2;
        }
        .train-dest-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .train-dest-name {
          font-size: 1.05rem;
          font-weight: 800;
          color: #0f172a;
        }
        .train-speed-badge {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          letter-spacing: 0.04em;
        }
        .train-speed-badge.slow {
          background: #e0f2fe;
          color: #0369a1;
        }
        .train-speed-badge.fast {
          background: #fef3c7;
          color: #b45309;
        }
        .train-route-meta {
          font-size: 0.72rem;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .pf-tag {
          font-weight: 700;
          color: #0f172a;
        }

        .train-timing-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          flex: 1;
        }
        .train-dep-clock {
          font-size: 1.15rem;
          font-weight: 800;
          color: #0f172a;
        }
        .train-countdown-pill {
          font-size: 0.68rem;
          color: #0284c7;
          font-weight: 700;
          background: #f0f9ff;
          padding: 2px 6px;
          border-radius: 10px;
        }

        .train-status-block {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 3px;
          flex: 1;
        }
        .train-delay-pill {
          font-size: 0.68rem;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
        }
        .train-delay-pill.ontime {
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
        }
        .train-delay-pill.delayed {
          background: #fffbeb;
          color: #b45309;
          border: 1px solid #fde68a;
        }
        .train-crowd-hint {
          font-size: 0.68rem;
          color: #64748b;
        }
        .train-crowd-hint strong {
          color: #334155;
        }

        .train-modal-footer {
          padding: 16px 24px;
          border-top: 1px solid #f1f5f9;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .station-shuttle-note {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 0.75rem;
          color: #475569;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 8px 12px;
          border-radius: 8px;
          line-height: 1.35;
        }
        .train-modal-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .btn-mindicator-modal {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.76rem;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.15s ease;
        }
        .btn-mindicator-modal:hover {
          background: #d1fae5;
          color: #065f46;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
        }
        .btn-train-modal-done {
          padding: 8px 18px;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          color: #334155;
          border-radius: 8px;
          font-size: 0.76rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-train-modal-done:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        /* Security Preview Card */
        .security-preview-card {
          padding: 20px 22px;
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(226, 232, 240, 0.85);
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          gap: 8px;
          box-shadow: 0 2px 10px rgba(100, 116, 139, 0.06);
          transition: all 0.2s ease;
        }
        .security-preview-card:hover {
          box-shadow: 0 6px 20px rgba(100, 116, 139, 0.1);
        }
        .security-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .sec-label-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.65rem;
          color: #64748b;
          font-weight: 800;
        }
        .sec-tag-restricted {
          font-size: 0.62rem;
          font-weight: 800;
          background: #fffbeb;
          border: 1px solid #fde68a;
          color: #b45309;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .security-title {
          font-size: 1rem;
          font-weight: 700;
          color: #0f172a;
        }
        .security-desc {
          font-size: 0.75rem;
          color: #475569;
          line-height: 1.35;
        }
        .btn-sign-in-ops {
          width: 100%;
          padding: 9px 14px;
          background: #0f172a;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          font-size: 0.76rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.15s;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.15);
          margin-top: 4px;
        }
        .btn-sign-in-ops:hover {
          background: #1e293b;
        }
        .security-note {
          font-size: 0.65rem;
          color: #64748b;
          text-align: center;
        }

        .text-cyan { color: #0284c7; }
        .text-muted { color: #64748b; }
        .text-success { color: #059669; }
        .text-warning { color: #b45309; }
        .text-error { color: #e11d48; }

        /* Dynamic Festival Operational Phase Switcher / Tester */
        .visitor-phase-tester {
          margin-top: 1rem;
          margin-bottom: 0.75rem;
          padding: 12px 18px;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          box-shadow: 0 2px 8px rgba(100, 116, 139, 0.05);
        }
        .phase-tester-left {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .tester-label {
          font-size: 0.62rem;
          color: #64748b;
          letter-spacing: 0.06em;
        }
        .tester-current {
          font-size: 0.82rem;
          color: #0f172a;
        }
        .tester-sub {
          font-size: 0.7rem;
          color: #64748b;
        }
        .phase-tester-presets {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .presets-label {
          font-size: 0.62rem;
          color: #94a3b8;
          margin-right: 4px;
        }
        .btn-tester-pill {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.68rem;
          font-weight: 700;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-tester-pill:hover {
          background: #f1f5f9;
          color: #0f172a;
          border-color: #cbd5e1;
        }
        .btn-tester-pill.active {
          background: #e0f2fe;
          border-color: #0284c7;
          color: #0284c7;
          box-shadow: 0 0 0 1px #0284c7;
        }

        .flow-guide-badge.badge-ingress {
          background: #f0fdf4;
          border-color: #bbf7d0;
          color: #166534;
        }
        .flow-guide-badge.badge-egress {
          background: #f0f9ff;
          border-color: #bae6fd;
          color: #0369a1;
        }
        .dot-live-status {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }
        .dot-live-status.dot-green { background: #16a34a; box-shadow: 0 0 6px #22c55e; }
        .dot-live-status.dot-cyan { background: #0284c7; box-shadow: 0 0 6px #38bdf8; }
        .dot-live-status.dot-amber { background: #d97706; box-shadow: 0 0 6px #f59e0b; }

        .optimal-window-card.theme-ingress-card {
          border-left: 3px solid #10b981;
        }
        .optimal-window-card.theme-egress-card {
          border-left: 3px solid #0284c7;
        }
      `}</style>
    </div>
  );
}
