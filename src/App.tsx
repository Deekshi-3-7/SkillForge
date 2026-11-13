import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import {
  ArrowRight, BookOpen, CalendarDays, Check, ChevronDown,
  Clock3, Flame, GraduationCap, Home as HomeIcon, Leaf, LogOut,
  Menu, Pencil, Plus, Search, Settings as SettingsIcon,
  Sparkles, Trash2, UsersRound, X,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { dayLevel, learningStats, localDate, periodActivity, shiftDate } from './lib/stats'
import { canManageEntry, createDate, watchLocalDate } from './lib/entryRules'
import { initials, monthCalendar } from './lib/circle'
import type { CircleSnapshot } from './lib/circle'
import { readTheme, saveTheme, themes } from './lib/theme'
import type { Theme } from './lib/theme'
import type { Category, Course, LearningEntry, Profile } from './lib/types'

const nav = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/learning', label: 'My Learning', icon: BookOpen },
  { to: '/circle', label: 'Learning Circle', icon: UsersRound },
  { to: '/courses', label: 'Courses', icon: GraduationCap },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

function Brand() {
  return <Link to="/" className="brand" aria-label="SkillForge home">
    <span className="brand-mark"><Leaf size={20} strokeWidth={2.4} /></span>
    <span><strong>SkillForge</strong><small>Grow a little every day</small></span>
  </Link>
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return <button className="icon-button" type="button" aria-label={label} title={label} onClick={onClick}>{children}</button>
}

function Button({ children, onClick, type = 'button', disabled = false, subtle = false }: {
  children: ReactNode; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean; subtle?: boolean
}) {
  return <button className={subtle ? 'button button-subtle' : 'button button-primary'} type={type} onClick={onClick} disabled={disabled}>{children}</button>
}

function AppShell({ profile, onLog, onSignOut, children }: {
  profile: Profile; onLog: () => void; onSignOut: () => void; children: ReactNode
}) {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => setMenuOpen(false), [location.pathname])
  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-top"><Brand /><IconButton label="Close menu" onClick={() => setMenuOpen(false)}><X size={19} /></IconButton></div>
      <div className="sidebar-section-label">YOUR SPACE</div>
      <nav className="side-nav" aria-label="Main navigation">
        {nav.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={17} strokeWidth={1.8} /><span>{label}</span></NavLink>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-profile"><div className="avatar">{profile.display_name.charAt(0).toUpperCase()}</div><div className="profile-text"><strong>{profile.display_name}</strong><small>{profile.role === 'owner' ? 'Workspace owner' : 'Learning member'}</small></div><IconButton label="Sign out" onClick={onSignOut}><LogOut size={17} /></IconButton></div>
      </div>
    </aside>
    {menuOpen && <button className="sidebar-scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
    <div className="app-main">
      <header className="topbar"><div className="topbar-left"><IconButton label="Open menu" onClick={() => setMenuOpen(true)}><Menu size={21} /></IconButton><span className="topbar-breadcrumb"><span className="topbar-breadcrumb-root">WORKSPACE</span><span className="topbar-slash">/</span>{nav.find(item => item.to === location.pathname)?.label ?? 'Home'}</span></div><div className="topbar-actions"><span className="topbar-date"><CalendarDays size={15} />{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>{location.pathname !== '/' && location.pathname !== '/learning' && <button className="topbar-log" onClick={onLog}><Plus size={16} /> Log learning</button>}</div></header>
      <main className="page-container">{children}</main>
    </div>
    <nav className="mobile-nav" aria-label="Mobile navigation">{nav.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}><Icon size={20} /><span>{label === 'My Learning' ? 'Learning' : label === 'Learning Circle' ? 'Circle' : label}</span></NavLink>)}</nav>
  </div>
}

function SetupScreen() {
  return <div className="auth-page"><div className="auth-card"><Brand /><div className="auth-orb"><Leaf size={31} /></div><h1>Set up your learning space</h1><p>This app needs its own Supabase project to save private learning records.</p><ol><li>Apply <code>supabase/migrations/202611070001_initial.sql</code> to a new Supabase project.</li><li>Copy <code>.env.example</code> to <code>.env.local</code> and add the project URL and publishable key.</li><li>Restart the development server.</li></ol></div></div>
}

function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!supabase) return
    setBusy(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setBusy(false)
  }
  return <div className="auth-page"><div className="auth-card"><Brand /><div className="auth-orb"><Leaf size={31} /></div><div className="eyebrow">YOUR SPACE TO GROW</div><h1>Welcome back<span className="accent">.</span></h1><p>A little learning today goes a long way.</p><form onSubmit={submit} className="auth-form"><label>Email address<input autoComplete="email" type="email" value={email} onChange={event => setEmail(event.target.value)} required placeholder="you@example.com" /></label><label>Password<input autoComplete="current-password" type="password" value={password} onChange={event => setPassword(event.target.value)} required placeholder="Enter your password" /></label>{error && <p className="form-error" role="alert">{error}</p>}<Button type="submit" disabled={busy}>{busy ? 'Signing in…' : <>Continue <ArrowRight size={18} /></>}</Button></form><div className="auth-foot">Your learning is private to your account.</div></div></div>
}

type Data = { profile: Profile; categories: Category[]; entries: LearningEntry[]; courses: Course[]; adminEntries: LearningEntry[]; adminCategories: Category[]; adminProfiles: Profile[] }

async function loadAllEntries(userId?: string) {
  if (!supabase) return { data: [] as LearningEntry[], error: null as { message: string } | null }
  const all: LearningEntry[] = []
  const pageSize = 500
  for (let from = 0; ; from += pageSize) {
    let query = supabase.from('learning_entries')
      .select('id,user_id,category_id,learning_date,title,minutes,notes,reference_url,created_at')
    if (userId) query = query.eq('user_id', userId)
    const result = await query
      .order('learning_date', { ascending: false })
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(from, from + pageSize - 1)
    if (result.error) return { data: all, error: result.error }
    all.push(...result.data as LearningEntry[])
    if (result.data.length < pageSize) return { data: all, error: null }
  }
}

function loadAllEntriesForAdmin() { return loadAllEntries() }

function useData(user: User | null) {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const refresh = useCallback(async () => {
    if (!supabase || !user) { setData(null); setLoading(false); return }
    setLoading(true); setError('')
    const [profile, categories, entries, courses] = await Promise.all([
      supabase.from('profiles').select('id,display_name,role').eq('id', user.id).single(),
      supabase.from('learning_categories').select('id,user_id,name').eq('user_id', user.id).order('name'),
      loadAllEntries(user.id),
      supabase.from('courses').select('id,user_id,category_id,name,platform,course_url,total_lectures,completed_lectures,progress_percent,target_date').eq('user_id', user.id).order('updated_at', { ascending: false }),
    ])
    const failure = profile.error || categories.error || entries.error || courses.error
    if (failure) setError(failure.message)
    else {
      const currentProfile = profile.data as Profile
      if (canManageEntry(currentProfile.role)) {
        const [allEntries, allCategories, allProfiles] = await Promise.all([
          loadAllEntriesForAdmin(),
          supabase.from('learning_categories').select('id,user_id,name'),
          supabase.from('profiles').select('id,display_name,role'),
        ])
        const adminFailure = allEntries.error || allCategories.error || allProfiles.error
        if (adminFailure) setError(adminFailure.message)
        else setData({ profile: currentProfile, categories: categories.data as Category[], entries: entries.data as LearningEntry[], courses: courses.data as Course[], adminEntries: allEntries.data.filter(entry => entry.user_id !== user.id), adminCategories: allCategories.data as Category[], adminProfiles: allProfiles.data as Profile[] })
      } else setData({ profile: currentProfile, categories: categories.data as Category[], entries: entries.data as LearningEntry[], courses: courses.data as Course[], adminEntries: [], adminCategories: [], adminProfiles: [] })
    }
    setLoading(false)
  }, [user])
  useEffect(() => { void refresh() }, [refresh])
  return { data, loading, error, refresh }
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  return `${hours}h${minutes % 60 ? ` ${minutes % 60}m` : ''}`
}

function ActivityHeatmap({ entries }: { entries: LearningEntry[] }) {
  const [view, setView] = useState<'month' | 'year'>('month')
  const today = localDate()
  const totals = learningStats(entries).totals
  const year = new Date().getFullYear()
  const start = view === 'month' ? `${today.slice(0, 7)}-01` : `${year}-01-01`
  const end = view === 'month' ? shiftDate(`${today.slice(0, 7)}-01`, new Date(year, new Date().getMonth() + 1, 0).getDate() - 1) : `${year}-12-31`
  const offset = new Date(Number(start.slice(0, 4)), Number(start.slice(5, 7)) - 1, 1).getDay()
  const first = shiftDate(start, -offset)
  const days: string[] = []
  for (let day = first; day <= end; day = shiftDate(day, 1)) days.push(day)
  const columns = Math.ceil(days.length / 7)
  const { activeDays, minutes: periodMinutes } = periodActivity(totals, start, today)
  return <section className="panel heatmap-panel"><div className="section-head"><div><div className="eyebrow">CONSISTENCY MAP</div><h2>Learning activity</h2></div><div className="segmented"><button type="button" className={view === 'month' ? 'selected' : ''} onClick={() => setView('month')}>Month</button><button type="button" className={view === 'year' ? 'selected' : ''} onClick={() => setView('year')}>Year</button></div></div><div className="heatmap-content"><div className="heatmap-scroll"><div className="heatmap-with-labels"><div className={`weekday-labels ${view}`}><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div><div className={`heatmap-grid ${view}`} style={{ gridTemplateColumns: `repeat(${columns}, ${view === 'month' ? 28 : 12}px)` }}>{days.map(date => { const minutes = totals.get(date) ?? 0; const level = date < start || date > today ? 'outside' : dayLevel(minutes); return <div key={date} className={`heat-cell ${level}`} title={`${date}: ${minutes} minutes`} aria-label={`${date}: ${minutes} minutes`} /> })}</div></div></div><div className="heatmap-insight"><span className="heatmap-period">{view === 'month' ? new Date(`${start}T12:00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : year}</span><div><strong>{activeDays}</strong><span>active days</span></div><div><strong>{formatMinutes(periodMinutes)}</strong><span>time invested</span></div><p>Five minutes makes a day count.</p></div></div><div className="heatmap-footer"><span>Each square is one calendar day</span><div className="heat-legend"><span>Less</span>{['none', 'minimum', 'regular', 'deep'].map(level => <i key={level} className={`heat-cell ${level}`} />)}<span>More</span></div></div></section>
}

function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return <div className="empty-state"><span className="empty-icon">{icon}</span><strong>{title}</strong><p>{text}</p>{action}</div>
}

function EntryRow({ entry, category, onEdit, onDelete, ownerName }: { entry: LearningEntry; category?: Category; onEdit?: () => void; onDelete?: () => void; ownerName?: string }) {
  return <div className="entry-row"><div className="entry-glyph"><BookOpen size={18} /></div><div className="entry-main"><strong>{entry.title}</strong>{ownerName && <span className="entry-owner" title={ownerName}>By {ownerName}</span>}<div className="entry-meta"><span>{category?.name ?? 'Category'}</span><i />{new Date(`${entry.learning_date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div></div><div className="entry-time"><Clock3 size={14} />{formatMinutes(entry.minutes)}</div>{onEdit && onDelete && <div className="entry-actions"><IconButton label="Edit entry" onClick={onEdit}><Pencil size={15} /></IconButton><IconButton label="Delete entry" onClick={onDelete}><Trash2 size={15} /></IconButton></div>}</div>
}

function HomePage({ data, onLog, onEdit, onDelete }: { data: Data; onLog: () => void; onEdit: (entry: LearningEntry) => void; onDelete: (entry: LearningEntry) => void }) {
  const stats = learningStats(data.entries)
  const firstName = data.profile.display_name.trim().split(/\s+/)[0]
  const todayDone = stats.todayLevel !== 'none'
  return <div className="home-page"><div className="page-intro home-intro"><div><div className="eyebrow">PERSONAL OVERVIEW</div><h1>Good to see you, {firstName}<span className="accent">.</span></h1><p>Small learning. Daily consistency. Visible growth.</p><span className="home-date-mobile"><CalendarDays size={13} />{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span></div></div>
    <section className="hero-panel"><div className="hero-content"><div className="hero-kicker"><span className="status-pulse" /> {todayDone ? 'TODAY IS AN ACTIVE DAY' : 'TODAY IS YOURS TO START'}</div><h2>{todayDone ? 'You made time to grow.' : 'Make today count.'}</h2><p>{todayDone ? 'Your daily baseline is complete. Keep going if curiosity takes you further.' : stats.todayMinutes > 0 ? `${5 - stats.todayMinutes} more minute${5 - stats.todayMinutes === 1 ? '' : 's'} to make today an active day.` : 'Five focused minutes is enough to begin a new streak.'}</p><Button onClick={onLog}><Plus size={17} /> Log today’s learning <ArrowRight size={16} /></Button></div><div className="hero-visual" aria-label={`${stats.todayMinutes} minutes learned today; five minutes makes an active day`}><div className="hero-visual-header"><span>DAILY PROGRESS</span><span>{todayDone ? 'BASELINE REACHED' : 'IN PROGRESS'}</span></div><div className="hero-progress-row"><div className="hero-progress" style={{ background: `conic-gradient(var(--sf-hero-accent) ${Math.min(stats.todayMinutes / 5 * 100, 100)}%, var(--sf-ring-track) 0)` }}><div className="hero-progress-core"><strong>{stats.todayMinutes}</strong><span>MINUTES</span></div></div><div className="hero-progress-copy"><strong>{formatMinutes(stats.todayMinutes)}</strong><span>learned today</span><i /><strong>5 min</strong><span>to count as active</span></div></div><div className="hero-progress-caption"><span>YOUR DAILY BASELINE</span><strong>{todayDone ? 'Complete' : `${Math.max(0, 5 - stats.todayMinutes)} min to go`}</strong></div></div></section>
    <section className="stats-row" aria-label="Learning statistics"><div className="stat-block"><div className="stat-label"><Flame size={15} /> CURRENT STREAK</div><div className="stat-value">{stats.currentStreak}<span>days</span></div><div className="stat-note">{stats.currentStreak ? 'One day at a time' : 'A fresh start is one log away'}</div></div><div className="stat-block"><div className="stat-label"><Sparkles size={15} /> LONGEST STREAK</div><div className="stat-value">{stats.longestStreak}<span>days</span></div><div className="stat-note">Your personal best</div></div><div className="stat-block"><div className="stat-label"><CalendarDays size={15} /> LEARNING DAYS</div><div className="stat-value">{stats.totalDays}<span>days</span></div><div className="stat-note">Days you made time</div></div><div className="stat-block"><div className="stat-label"><Clock3 size={15} /> TIME INVESTED</div><div className="stat-value">{(stats.totalMinutes / 60).toFixed(1)}<span>hrs</span></div><div className="stat-note">Every minute counts</div></div></section>
    <div className="dashboard-lower"><ActivityHeatmap entries={data.entries} /><section className="panel recent-panel"><div className="section-head"><div><div className="eyebrow">YOUR JOURNAL</div><h2>Recent learning</h2></div><Link to="/learning" className="text-link">View all <ArrowRight size={15} /></Link></div>{data.entries.length ? <div className="entry-list">{data.entries.slice(0, 3).map(entry => <EntryRow key={entry.id} entry={entry} category={data.categories.find(c => c.id === entry.category_id)} onEdit={canManageEntry(data.profile.role) ? () => onEdit(entry) : undefined} onDelete={canManageEntry(data.profile.role) ? () => onDelete(entry) : undefined} />)}</div> : <EmptyState icon={<BookOpen size={22} />} title="Your story starts here" text="Log something you learned and it will appear here." action={<Button subtle onClick={onLog}>Add first entry <ArrowRight size={15} /></Button>} />}</section></div>
  </div>
}

function LearningPage({ data, onLog, onEdit, onDelete }: { data: Data; onLog: () => void; onEdit: (entry: LearningEntry) => void; onDelete: (entry: LearningEntry) => void }) {
  const [query, setQuery] = useState('')
  const filtered = data.entries.filter(entry => entry.title.toLowerCase().includes(query.toLowerCase()) || (data.categories.find(c => c.id === entry.category_id)?.name ?? '').toLowerCase().includes(query.toLowerCase()))
  const dates = [...new Set(filtered.map(entry => entry.learning_date))]
  const canManage = canManageEntry(data.profile.role)
  return <div><div className="page-intro inner-intro"><div><div className="eyebrow"><span className="eyebrow-line" /> YOUR JOURNEY</div><h1>My Learning<span className="accent">.</span></h1><p>A simple record of what you’ve learned, one session at a time.</p></div><Button onClick={onLog}><Plus size={17} /> Log learning</Button></div><div className="panel learning-panel"><div className="list-toolbar"><div><h2>Learning journal</h2><p>{data.entries.length} session{data.entries.length === 1 ? '' : 's'} logged</p></div><label className="search-field"><Search size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search learning" aria-label="Search learning" /></label></div>{dates.length ? dates.map(date => <div className="date-group" key={date}><div className="date-group-head"><span>{date === localDate() ? 'Today' : date === shiftDate(localDate(), -1) ? 'Yesterday' : new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span><small>{formatMinutes(data.entries.filter(entry => entry.learning_date === date).reduce((sum, entry) => sum + entry.minutes, 0))}</small></div>{filtered.filter(entry => entry.learning_date === date).map(entry => <EntryRow key={entry.id} entry={entry} category={data.categories.find(c => c.id === entry.category_id)} onEdit={canManage ? () => onEdit(entry) : undefined} onDelete={canManage ? () => onDelete(entry) : undefined} />)}</div>) : <EmptyState icon={<BookOpen size={22} />} title={query ? 'No matching entries' : 'No learning logged yet'} text={query ? 'Try a different search.' : 'Your next small step can start right now.'} action={!query && <Button subtle onClick={onLog}>Log learning <ArrowRight size={15} /></Button>} />}</div>{canManage && <section className="panel learning-panel" style={{ marginTop: 24 }}><div className="list-toolbar"><div><h2>Member entries</h2><p>Review and manage learning logged by other members.</p></div></div>{data.adminEntries.length ? <div className="entry-list">{data.adminEntries.map(entry => <EntryRow key={entry.id} entry={entry} ownerName={data.adminProfiles.find(profile => profile.id === entry.user_id)?.display_name ?? 'Member'} category={data.adminCategories.find(category => category.id === entry.category_id)} onEdit={() => onEdit(entry)} onDelete={() => onDelete(entry)} />)}</div> : <EmptyState icon={<BookOpen size={22} />} title="No member entries yet" text="Their entries will appear here when they log learning." />}</section>}</div>
}

function LearningCirclePage({ today }: { today: string }) {
  const [snapshot, setSnapshot] = useState<CircleSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const client = supabase
    if (!client) return
    let cancelled = false
    client.rpc('learning_circle_snapshot').then(({ data, error: requestError }) => {
      if (cancelled) return
      setError(requestError?.message ?? '')
      setSnapshot(requestError ? null : data as CircleSnapshot)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [today, retry])
  const days = monthCalendar(today)
  const columns = Math.ceil(days.length / 7)
  return <div className="circle-page"><div className="page-intro inner-intro"><div><div className="eyebrow"><span className="eyebrow-line" /> GROW TOGETHER</div><h1>Learning Circle<span className="accent">.</span></h1><p>A quiet view of how our community keeps showing up.</p></div></div>
    {loading ? <div className="panel circle-status">Loading your circle…</div> : error ? <div className="panel circle-status"><p>Learning Circle is unavailable right now.</p><Button subtle onClick={() => { setLoading(true); setRetry(value => value + 1) }}>Try again</Button></div> : snapshot && <>
      <section className="panel circle-overview"><div><div className="eyebrow">OUR SHARED PROGRESS</div><h2>Small steps, taken together.</h2><p>Only learning totals are shared here. Your journal stays yours.</p></div><div className="circle-overview-stats"><div><strong>{(snapshot.community_minutes / 60).toFixed(1)}</strong><span>community hours</span></div><div><strong>{snapshot.community_active_days}</strong><span>active calendar days</span></div></div></section>
      <div className="circle-list">{snapshot.members.map((member, index) => <section className="panel circle-member" key={`${member.name}-${index}`}><div className="circle-member-head"><div className="circle-avatar" aria-hidden="true">{initials(member.name)}</div><div className="circle-member-name"><h2>{member.name}</h2><span>Learning member</span></div><span className="circle-member-mark"><Flame size={14} /> {member.current_streak ? `${member.current_streak} day streak` : 'Fresh start'}</span></div><div className="circle-member-stats"><div><strong>{member.current_streak}</strong><span>current streak</span></div><div><strong>{member.active_days}</strong><span>learning days</span></div><div><strong>{formatMinutes(member.week_minutes)}</strong><span>this week</span></div></div><div className="circle-activity"><div className="circle-month-head"><span>{new Date(`${today}T12:00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span><small>MONTHLY ACTIVITY</small></div><div className="circle-heatmap-scroll"><div className="circle-heatmap" style={{ gridTemplateColumns: `repeat(${columns}, 16px)` }}>{days.map(day => { const minutes = member.month_days[day.date] ?? 0; const level = day.outside ? 'outside' : dayLevel(minutes); return <span key={day.date} className={`heat-cell ${level}`} title={`${day.date}: ${minutes} minutes`} aria-label={`${day.date}: ${minutes} minutes`} /> })}</div></div><div className="circle-legend"><span>Less</span><i className="heat-cell minimum" /><i className="heat-cell regular" /><i className="heat-cell deep" /><span>More</span></div></div></section>)}</div>
    </>}
  </div>
}

function Modal({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey) }, [onClose])
  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><div className="modal" role="dialog" aria-modal="true" aria-label={title}><div className="modal-head"><div><div className="eyebrow">SMALL STEPS, BIG GROWTH</div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><IconButton label="Close" onClick={onClose}><X size={20} /></IconButton></div>{children}</div></div>
}

function EntryModal({ data, entry, today, onClose, onSaved }: { data: Data; entry: LearningEntry | null; today: string; onClose: () => void; onSaved: () => Promise<void> }) {
  const [title, setTitle] = useState(entry?.title ?? '')
  const targetCategories = entry && entry.user_id !== data.profile.id ? data.adminCategories.filter(category => category.user_id === entry.user_id) : data.categories
  const [categoryId, setCategoryId] = useState(entry?.category_id ?? targetCategories[0]?.id ?? '')
  const [minutes, setMinutes] = useState(entry?.minutes ?? 15)
  const [custom, setCustom] = useState(!!entry && ![5, 10, 15, 30, 60].includes(entry.minutes))
  const [details, setDetails] = useState(!!entry?.notes || !!entry?.reference_url)
  const [notes, setNotes] = useState(entry?.notes ?? '')
  const [referenceUrl, setReferenceUrl] = useState(entry?.reference_url ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)
  const [categories, setCategories] = useState(targetCategories)
  async function addCategory() {
    if (!supabase || !newCategory.trim() || (entry && entry.user_id !== data.profile.id)) return
    const { data: added, error } = await supabase.from('learning_categories').insert({ user_id: data.profile.id, name: newCategory.trim() }).select('id,user_id,name').single()
    if (error) { setError(error.message); return }
    setCategories([...categories, added as Category]); setCategoryId(added.id); setNewCategory(''); setAddingCategory(false)
  }
  async function save(event: FormEvent) {
    event.preventDefault()
    if (!supabase) return
    if (entry && !canManageEntry(data.profile.role)) { setError('Only an owner can edit learning entries.'); return }
    if (!categoryId) { setError('Choose a category.'); return }
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) { setError('Enter 1 to 1,440 minutes. A day becomes active at 5 minutes total.'); return }
    if (referenceUrl && !/^https?:\/\//i.test(referenceUrl)) { setError('The reference link must start with http:// or https://.'); return }
    setBusy(true); setError('')
    const values = { category_id: categoryId, title: title.trim(), minutes, notes: notes.trim() || null, reference_url: referenceUrl.trim() || null }
    const result = entry ? await supabase.from('learning_entries').update(values).eq('id', entry.id).eq('user_id', entry.user_id) : await supabase.from('learning_entries').insert({ ...values, user_id: data.profile.id, learning_date: createDate() })
    if (result.error) { setError(result.error.message); setBusy(false); return }
    await onSaved(); onClose()
  }
  return <Modal title={entry ? 'Edit learning' : 'Log your learning'} subtitle={entry ? `Learning date: ${entry.learning_date}` : `Logging for today, ${today}`} onClose={onClose}><form onSubmit={save} className="modal-form"><label className="field-label">What did you learn?<input autoFocus maxLength={180} value={title} onChange={event => setTitle(event.target.value)} required placeholder="e.g. How React hooks handle state" /></label><label className="field-label">Category<select value={categoryId} onChange={event => setCategoryId(event.target.value)} required><option value="" disabled>Choose a category</option>{categories.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select></label>{(!entry || entry.user_id === data.profile.id) && (addingCategory ? <div className="inline-add"><input value={newCategory} onChange={event => setNewCategory(event.target.value)} placeholder="New category name" maxLength={40} aria-label="New category name" /><Button subtle onClick={addCategory}>Add</Button></div> : <button className="inline-link" type="button" onClick={() => setAddingCategory(true)}><Plus size={14} /> Add your own category</button>)}<div className="field-label">Time spent<div className="duration-options">{[5, 10, 15, 30, 60].map(value => <button key={value} className={minutes === value && !custom ? 'selected' : ''} type="button" onClick={() => { setMinutes(value); setCustom(false) }}>{value === 60 ? '1 hour' : `${value} min`}</button>)}<button type="button" className={custom ? 'selected' : ''} onClick={() => setCustom(true)}>Custom</button></div>{custom && <div className="custom-duration"><input type="number" min={1} max={1440} value={minutes} onChange={event => setMinutes(Number(event.target.value))} aria-label="Custom minutes" /><span>minutes</span></div>}<small className="field-hint">A day counts as active once your sessions total 5 minutes.</small></div><button type="button" className="optional-toggle" onClick={() => setDetails(!details)}>More details (optional) <ChevronDown size={16} className={details ? 'rotated' : ''} /></button>{details && <div className="optional-fields"><label className="field-label">Notes<textarea value={notes} onChange={event => setNotes(event.target.value)} maxLength={2000} placeholder="A takeaway you want to remember" rows={3} /></label><label className="field-label">Reference link<input type="url" value={referenceUrl} onChange={event => setReferenceUrl(event.target.value)} placeholder="https://…" /></label></div>}{error && <p className="form-error" role="alert">{error}</p>}<Button type="submit" disabled={busy || !title.trim()}>{busy ? 'Saving…' : <><Check size={17} /> Save learning</>}</Button></form></Modal>
}

function CoursesPage({ data, onRefresh }: { data: Data; onRefresh: () => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const [error, setError] = useState('')
  const [drafts, setDrafts] = useState<Record<string, number>>({})
  async function changeProgress(course: Course, progress: number) {
    if (!supabase) return
    const completed = course.total_lectures ? Math.round(course.total_lectures * progress / 100) : course.completed_lectures
    const actualProgress = course.total_lectures ? Math.round(completed / course.total_lectures * 100) : progress
    const { error } = await supabase.from('courses').update({ progress_percent: actualProgress, completed_lectures: completed }).eq('id', course.id).eq('user_id', data.profile.id)
    if (error) setError(error.message)
    else { await onRefresh(); setDrafts(previous => { const next = { ...previous }; delete next[course.id]; return next }) }
  }
  async function remove(course: Course) {
    if (!supabase || !window.confirm(`Delete “${course.name}”?`)) return
    const { error } = await supabase.from('courses').delete().eq('id', course.id).eq('user_id', data.profile.id)
    if (error) setError(error.message); else await onRefresh()
  }
  return <div>
    <div className="page-intro inner-intro"><div><div className="eyebrow"><span className="eyebrow-line" /> KEEP MOVING FORWARD</div><h1>Courses<span className="accent">.</span></h1><p>Keep the courses you’re working through in one simple place.</p></div><Button onClick={() => { setEditing(null); setOpen(true) }}><Plus size={17} /> Add course</Button></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {data.courses.length ? <div className="course-grid">{data.courses.map(course => {
      const progress = drafts[course.id] ?? course.progress_percent
      const status = progress === 0 ? 'Not Started' : progress === 100 ? 'Completed' : 'In Progress'
      return <article className="panel course-card" key={course.id}>
        <div className="course-top"><span className="course-icon"><GraduationCap size={22} /></span><div className="course-actions"><IconButton label="Edit course" onClick={() => { setEditing(course); setOpen(true) }}><Pencil size={16} /></IconButton><IconButton label="Delete course" onClick={() => remove(course)}><Trash2 size={16} /></IconButton></div></div>
        <div className="eyebrow">{course.platform}</div><h2>{course.name}</h2><a href={course.course_url} target="_blank" rel="noreferrer" className="course-link">Open course <ArrowRight size={14} /></a>
        <div className="course-progress-head"><span>{status}</span><strong>{progress}%</strong></div><div className="progress-track"><div style={{ width: `${progress}%` }} /></div>
        <label className="course-slider-label">Update progress<input type="range" min={0} max={100} step={5} value={progress} onChange={event => setDrafts(previous => ({ ...previous, [course.id]: Number(event.target.value) }))} onPointerUp={() => { if (drafts[course.id] !== undefined) void changeProgress(course, drafts[course.id]) }} onKeyUp={() => { if (drafts[course.id] !== undefined) void changeProgress(course, drafts[course.id]) }} aria-label={`Progress for ${course.name}`} /></label>
        {course.total_lectures && <small>{course.completed_lectures} of {course.total_lectures} lectures</small>}
      </article>
    })}</div> : <div className="panel"><EmptyState icon={<GraduationCap size={24} />} title="Courses worth finishing" text="Add a course and update its progress manually whenever you like." action={<Button subtle onClick={() => setOpen(true)}>Add a course <ArrowRight size={15} /></Button>} /></div>}
    {open && <CourseModal data={data} course={editing} onClose={() => setOpen(false)} onSaved={onRefresh} />}
  </div>
}

function CourseModal({ data, course, onClose, onSaved }: { data: Data; course: Course | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(course?.name ?? '')
  const [platform, setPlatform] = useState(course?.platform ?? '')
  const [url, setUrl] = useState(course?.course_url ?? '')
  const [categoryId, setCategoryId] = useState(course?.category_id ?? data.categories[0]?.id ?? '')
  const [total, setTotal] = useState(course?.total_lectures?.toString() ?? '')
  const [completed, setCompleted] = useState(course?.completed_lectures?.toString() ?? '0')
  const [progress, setProgress] = useState(course?.progress_percent ?? 0)
  const [target, setTarget] = useState(course?.target_date ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function save(event: FormEvent) {
    event.preventDefault()
    if (!supabase) return
    if (!/^https?:\/\//i.test(url)) { setError('Course URL must start with http:// or https://.'); return }
    const totalValue = total ? Number(total) : null
    const completedValue = Number(completed)
    if (totalValue !== null && (!Number.isInteger(totalValue) || totalValue < 1 || completedValue > totalValue)) { setError('Enter a valid lecture total at least as large as completed lectures.'); return }
    setBusy(true); setError('')
    const values = { user_id: data.profile.id, category_id: categoryId, name: name.trim(), platform: platform.trim(), course_url: url.trim(), total_lectures: totalValue, completed_lectures: completedValue, progress_percent: totalValue ? Math.round(completedValue / totalValue * 100) : progress, target_date: target || null }
    const result = course ? await supabase.from('courses').update(values).eq('id', course.id).eq('user_id', data.profile.id) : await supabase.from('courses').insert(values)
    if (result.error) { setError(result.error.message); setBusy(false); return }
    await onSaved(); onClose()
  }
  return <Modal title={course ? 'Edit course' : 'Add a course'} subtitle="Track your progress at your own pace." onClose={onClose}><form onSubmit={save} className="modal-form"><label className="field-label">Course name<input value={name} onChange={event => setName(event.target.value)} maxLength={180} required placeholder="e.g. Advanced TypeScript" /></label><label className="field-label">Platform<input value={platform} onChange={event => setPlatform(event.target.value)} maxLength={80} required placeholder="e.g. Udemy" /></label><label className="field-label">Course URL<input type="url" value={url} onChange={event => setUrl(event.target.value)} required placeholder="https://…" /></label><label className="field-label">Category<select value={categoryId} onChange={event => setCategoryId(event.target.value)} required>{data.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><div className="form-two"><label className="field-label">Total lectures <small>optional</small><input type="number" min={1} value={total} onChange={event => setTotal(event.target.value)} placeholder="e.g. 24" /></label><label className="field-label">Completed lectures <small>optional</small><input type="number" min={0} value={completed} onChange={event => setCompleted(event.target.value)} /></label></div>{!total && <label className="field-label">Manual progress: {progress}%<input type="range" min={0} max={100} step={5} value={progress} onChange={event => setProgress(Number(event.target.value))} /></label>}<label className="field-label">Target date <small>optional</small><input type="date" value={target} onChange={event => setTarget(event.target.value)} /></label>{error && <p className="form-error" role="alert">{error}</p>}<Button type="submit" disabled={busy}>{busy ? 'Saving…' : <><Check size={17} /> Save course</>}</Button></form></Modal>
}

function SettingsPage({ data, onRefresh, theme, onThemeChange }: { data: Data; onRefresh: () => Promise<void>; theme: Theme; onThemeChange: (theme: Theme) => void }) {
  const [name, setName] = useState(data.profile.display_name)
  const [newCategory, setNewCategory] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  async function saveName(event: FormEvent) {
    event.preventDefault(); if (!supabase) return
    const { error } = await supabase.from('profiles').update({ display_name: name.trim() }).eq('id', data.profile.id)
    if (error) setError(error.message); else { setMessage('Name saved.'); await onRefresh() }
  }
  async function addCategory(event: FormEvent) {
    event.preventDefault(); if (!supabase || !newCategory.trim()) return
    const { error } = await supabase.from('learning_categories').insert({ user_id: data.profile.id, name: newCategory.trim() })
    if (error) setError(error.message); else { setNewCategory(''); setMessage('Category added.'); await onRefresh() }
  }
  async function deleteCategory(category: Category) {
    if (!supabase || !window.confirm(`Delete category “${category.name}”?`)) return
    const { error } = await supabase.from('learning_categories').delete().eq('id', category.id).eq('user_id', data.profile.id)
    if (error) setError('This category is in use. Move its entries or courses to another category first.'); else await onRefresh()
  }
  return <div><div className="page-intro inner-intro"><div><div className="eyebrow"><span className="eyebrow-line" /> MAKE IT YOURS</div><h1>Settings<span className="accent">.</span></h1><p>Keep your learning space personal and simple.</p></div></div>{error && <p className="form-error" role="alert">{error}</p>}{message && <p className="success-message" role="status">{message}</p>}<div className="settings-grid"><section className="panel settings-panel"><div className="eyebrow">PROFILE</div><h2>Your name</h2><p>How you’d like to be welcomed.</p><form onSubmit={saveName} className="settings-form"><label className="field-label">Display name<input value={name} onChange={event => setName(event.target.value)} maxLength={80} required /></label><Button type="submit">Save name</Button></form></section><section className="panel settings-panel"><div className="eyebrow">ORGANIZE</div><h2>Your categories</h2><p>Make your learning journal feel like yours.</p><div className="category-list">{data.categories.map(c => <div key={c.id}><span>{c.name}</span><IconButton label={`Delete ${c.name}`} onClick={() => deleteCategory(c)}><Trash2 size={15} /></IconButton></div>)}</div><form onSubmit={addCategory} className="category-form"><input value={newCategory} onChange={event => setNewCategory(event.target.value)} placeholder="New category" maxLength={40} aria-label="New category" required /><Button type="submit" subtle><Plus size={16} /> Add</Button></form></section><section className="panel settings-panel"><div className="eyebrow">APPEARANCE</div><h2>Theme</h2><p>Choose a look that feels right for your learning space. Saved in this browser.</p><div className="theme-options" role="group" aria-label="Theme">{themes.map(option => <button key={option.id} type="button" className={`theme-option ${theme === option.id ? 'selected' : ''}`} onClick={() => onThemeChange(option.id)} aria-pressed={theme === option.id}><span className={`theme-swatch ${option.id}`} /><span className="theme-option-copy"><strong>{option.name}</strong><small>{option.description}</small></span>{theme === option.id && <Check size={17} aria-hidden="true" />}</button>)}</div></section></div></div>
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [theme, setTheme] = useState<Theme>(readTheme)
  const [today, setToday] = useState(createDate)
  const [authLoading, setAuthLoading] = useState(true)
  const [logOpen, setLogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<LearningEntry | null>(null)
  const { data, loading, error, refresh } = useData(user)
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'arctic' ? '#e8eef3' : theme === 'violet' ? '#08070e' : '#020505')
    saveTheme(theme)
  }, [theme])
  useEffect(() => watchLocalDate(setToday), [])
  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return }
    const client = supabase
    void client.auth.getUser().then(({ data }) => { setUser(data.user); setAuthLoading(false) })
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => { setUser(session?.user ?? null); setAuthLoading(false) })
    return () => listener.subscription.unsubscribe()
  }, [])
  async function deleteEntry(entry: LearningEntry) {
    if (!supabase || !data || !canManageEntry(data.profile.role) || !window.confirm(`Delete “${entry.title}”?`)) return
    const { error } = await supabase.from('learning_entries').delete().eq('id', entry.id).eq('user_id', entry.user_id)
    if (error) window.alert(error.message); else await refresh()
  }
  if (!supabase) return <SetupScreen />
  if (authLoading) return <div className="loading-screen"><Leaf size={27} />Loading SkillForge…</div>
  if (!user) return <LoginScreen />
  if (loading && !data) return <div className="loading-screen"><Leaf size={27} />Loading your learning…</div>
  if (error || !data) return <div className="loading-screen error-screen"><p>{error || 'Unable to load your workspace.'}</p><Button onClick={() => void refresh()}>Try again</Button></div>
  const openLog = () => { setEditingEntry(null); setLogOpen(true) }
  const openEdit = (entry: LearningEntry) => { if (!canManageEntry(data.profile.role)) return; setEditingEntry(entry); setLogOpen(true) }
  return <AppShell profile={data.profile} onLog={openLog} onSignOut={() => void supabase?.auth.signOut()}><Routes><Route path="/" element={<HomePage data={data} onLog={openLog} onEdit={openEdit} onDelete={entry => void deleteEntry(entry)} />} /><Route path="/learning" element={<LearningPage data={data} onLog={openLog} onEdit={openEdit} onDelete={entry => void deleteEntry(entry)} />} /><Route path="/circle" element={<LearningCirclePage today={today} />} /><Route path="/courses" element={<CoursesPage data={data} onRefresh={refresh} />} /><Route path="/settings" element={<SettingsPage data={data} onRefresh={refresh} theme={theme} onThemeChange={setTheme} />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes>{logOpen && <EntryModal data={data} entry={editingEntry} today={today} onClose={() => { setLogOpen(false); setEditingEntry(null) }} onSaved={refresh} />}</AppShell>
}
