import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Download,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  createEmployee,
  getPeopleDirectory,
  reviewLeaveRequest,
} from "@/features/employees/employees.functions";

export const Route = createFileRoute("/")({
  component: Index,
});

function AuthMessage({ title, message }: { title: string; message: string }) {
  return (
    <main className="auth-page">
      <section className="auth-card auth-message-card">
        <span className="brand-mark">
          <Sparkles size={18} strokeWidth={2.5} />
        </span>
        <h1>{title}</h1>
        <p className="auth-intro">{message}</p>
      </section>
    </main>
  );
}

function getUserLabel(user: User | null) {
  if (!user) return "HR Administrator";
  const fullName = user.user_metadata["full_name"];
  if (typeof fullName === "string" && fullName.trim()) return fullName.trim();
  const firstName = user.user_metadata["first_name"];
  const lastName = user.user_metadata["last_name"];
  const name = [firstName, lastName]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ");
  return name || user.email || "HR Administrator";
}

type Employee = {
  id: string;
  name: string;
  role: string;
  department: string;
  departmentId: string | null;
  email: string;
  startDate: string;
  startDateISO: string;
  status: "Active" | "On leave" | "Probation" | "Terminated";
  initials: string;
  color: string;
};

type Department = { id: string; name: string };
type PendingLeave = {
  id: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
};
type CompanyEvent = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_type: string;
};

const demoCredentials = {
  email: "demo@peopleflow.test",
  password: "PeopleflowDemo2026!",
};

const demoDepartments: Department[] = [
  { id: "demo-department-people", name: "People" },
  { id: "demo-department-design", name: "Design" },
  { id: "demo-department-engineering", name: "Engineering" },
  { id: "demo-department-marketing", name: "Marketing" },
];

function getDemoDirectory() {
  const today = new Date();
  const dateString = (offset: number) => {
    const date = new Date(today);
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10);
  };
  const employees = [
    {
      id: "demo-employee-1",
      name: "Amelia Hart",
      role: "People Operations Lead",
      department: "People",
      departmentId: demoDepartments[0].id,
      email: "amelia.hart@example.test",
      startDate: dateString(-920),
      status: "Active" as const,
    },
    {
      id: "demo-employee-2",
      name: "Noah Bennett",
      role: "Product Designer",
      department: "Design",
      departmentId: demoDepartments[1].id,
      email: "noah.bennett@example.test",
      startDate: dateString(-530),
      status: "Active" as const,
    },
    {
      id: "demo-employee-3",
      name: "Sofia Chen",
      role: "Software Engineer",
      department: "Engineering",
      departmentId: demoDepartments[2].id,
      email: "sofia.chen@example.test",
      startDate: dateString(-350),
      status: "On leave" as const,
    },
    {
      id: "demo-employee-4",
      name: "Ethan Brooks",
      role: "Marketing Manager",
      department: "Marketing",
      departmentId: demoDepartments[3].id,
      email: "ethan.brooks@example.test",
      startDate: dateString(-170),
      status: "Probation" as const,
    },
  ].map((employee, index) => {
    const [year, month, day] = employee.startDate.split("-").map(Number);
    return {
      ...employee,
      startDateISO: employee.startDate,
      startDate: new Date(year, month - 1, day).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      initials: employee.name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase(),
      color: ["lilac", "peach", "mint", "blue"][index],
    };
  });

  return {
    employees,
    departments: demoDepartments,
    pendingLeave: [
      {
        id: "demo-leave-1",
        employeeName: "Sofia Chen",
        leaveType: "Annual leave",
        startDate: dateString(3),
        endDate: dateString(5),
        days: 3,
      },
      {
        id: "demo-leave-2",
        employeeName: "Noah Bennett",
        leaveType: "Personal leave",
        startDate: dateString(8),
        endDate: dateString(8),
        days: 1,
      },
    ],
    pendingLeaveCount: 2,
    onLeaveToday: 1,
    upcomingEvents: [
      {
        id: "demo-event-1",
        title: "Team welcome lunch",
        description: "Meet new teammates",
        event_date: dateString(4),
        event_type: "Team",
      },
      {
        id: "demo-event-2",
        title: "Design show and tell",
        description: "Share this month's work",
        event_date: dateString(12),
        event_type: "Culture",
      },
    ] satisfies CompanyEvent[],
  };
}

function buildChartPath(values: number[], maximum = Math.max(...values, 1)) {
  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 700;
      const y = 192 - (value / maximum) * 160;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function getYearlyHeadcounts(employees: Employee[], year: number) {
  return Array.from({ length: 12 }, (_, month) => {
    const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const lastDay = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDayOfMonth).padStart(2, "0")}`;
    return employees.filter(
      (employee) => employee.status !== "Terminated" && employee.startDateISO <= lastDay,
    ).length;
  });
}

const navItems = [
  { label: "Overview", icon: LayoutDashboard, target: "overview" },
  { label: "People", icon: UsersRound, target: "people" },
  { label: "Leave requests", icon: CalendarDays, target: "time-off" },
  { label: "Payroll", icon: Wallet, target: "payroll" },
];

function Index() {
  const isDemoBuild = import.meta.env.DEV;
  const [authStatus, setAuthStatus] = useState<"checking" | "signed-in" | "signed-out" | "error">(
    "checking",
  );
  const [isDemoUser, setIsDemoUser] = useState(false);
  const [authError, setAuthError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [currentUserLabel, setCurrentUserLabel] = useState("HR Administrator");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [pendingLeave, setPendingLeave] = useState<PendingLeave[]>([]);
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [onLeaveToday, setOnLeaveToday] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState<CompanyEvent[]>([]);
  const [reviewingLeaveId, setReviewingLeaveId] = useState("");
  const [isDirectoryLoading, setIsDirectoryLoading] = useState(true);
  const [directoryError, setDirectoryError] = useState("");
  const [refreshDirectory, setRefreshDirectory] = useState(0);
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState("Overview");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSavingEmployee, setIsSavingEmployee] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let isMounted = true;
    if (isDemoBuild) {
      setAuthStatus("signed-out");
      return () => {
        isMounted = false;
      };
    }

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setCurrentUserLabel(getUserLabel(session?.user ?? null));
        setAuthStatus(session ? "signed-in" : "signed-out");
      }
    });

    supabase.auth
      .getSession()
      .then(({ data: sessionData, error }) => {
        if (!isMounted) return;
        if (error) {
          console.error("[Auth] Unable to restore the current session.", error);
          setAuthError("Unable to check your sign-in status. Refresh the page to try again.");
          setAuthStatus("error");
          return;
        }
        setCurrentUserLabel(getUserLabel(sessionData.session?.user ?? null));
        setAuthStatus(sessionData.session ? "signed-in" : "signed-out");
      })
      .catch((error: unknown) => {
        console.error("[Auth] Unable to restore the current session.", error);
        if (!isMounted) return;
        setAuthError("Unable to connect to sign-in. Check your connection and refresh the page.");
        setAuthStatus("error");
      });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, [isDemoBuild]);

  useEffect(() => {
    if (authStatus !== "signed-in") return;
    let isMounted = true;
    setIsDirectoryLoading(true);
    setDirectoryError("");

    if (isDemoUser) {
      const directory = getDemoDirectory();
      setEmployees(directory.employees);
      setDepartments(directory.departments);
      setPendingLeave(directory.pendingLeave);
      setPendingLeaveCount(directory.pendingLeaveCount);
      setOnLeaveToday(directory.onLeaveToday);
      setUpcomingEvents(directory.upcomingEvents);
      setIsDirectoryLoading(false);
      return () => {
        isMounted = false;
      };
    }

    getPeopleDirectory()
      .then((directory) => {
        if (!isMounted) return;
        const colors = ["lilac", "peach", "mint", "blue", "yellow"];
        setEmployees(
          directory.employees.map((employee, index) => {
            const initials = employee.name
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0])
              .join("")
              .toUpperCase();
            const [year, month, day] = employee.startDate.split("-").map(Number);
            const formattedStartDate = new Date(year, month - 1, day).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            return {
              ...employee,
              startDate: formattedStartDate,
              startDateISO: employee.startDate,
              initials,
              color: colors[index % colors.length],
            };
          }),
        );
        setDepartments(directory.departments);
        setPendingLeave(directory.pendingLeave);
        setPendingLeaveCount(directory.pendingLeaveCount);
        setOnLeaveToday(directory.onLeaveToday);
        setUpcomingEvents(directory.upcomingEvents);
      })
      .catch((error: unknown) => {
        console.error("[Employees] Unable to load the directory.", error);
        if (isMounted) {
          setDirectoryError(
            error instanceof Error ? error.message : "Unable to load employee data.",
          );
        }
      })
      .finally(() => {
        if (isMounted) setIsDirectoryLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [authStatus, isDemoUser, refreshDirectory]);

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return employees;
    return employees.filter((employee) =>
      [employee.name, employee.role, employee.department, employee.email].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [employees, search]);

  function navigateTo(label: string, target: string) {
    setActiveSection(label);
    if (target === "payroll") {
      setNotice("Payroll tools are coming soon.");
      window.setTimeout(() => setNotice(""), 2800);
      return;
    }
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    setIsSigningIn(true);
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email")).trim();
    const password = String(formData.get("password"));
    if (isDemoBuild) {
      if (email.toLowerCase() !== demoCredentials.email || password !== demoCredentials.password) {
        setLoginError("Use the demo email and password shown below.");
        setIsSigningIn(false);
        return;
      }
      setIsDemoUser(true);
      setCurrentUserLabel("Demo HR Admin");
      setAuthStatus("signed-in");
      setIsSigningIn(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error("[Auth] Sign-in failed.", error);
        setLoginError("Sign-in failed. Check your email and password and try again.");
        return;
      }
      setAuthStatus("signed-in");
    } catch (error) {
      console.error("[Auth] Sign-in request failed.", error);
      setLoginError("Unable to connect to sign-in. Check your connection and try again.");
    } finally {
      setIsSigningIn(false);
    }
  }

  async function signOut() {
    if (isDemoUser) {
      setIsDemoUser(false);
      setAuthStatus("signed-out");
      setEmployees([]);
      setDepartments([]);
      setPendingLeave([]);
      setUpcomingEvents([]);
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (!error) return;
      console.error("[Auth] Sign-out failed.", error);
      setNotice("Unable to sign out. Please try again.");
    } catch (error) {
      console.error("[Auth] Sign-out request failed.", error);
      setNotice("Unable to connect to sign-out. Please try again.");
    }
  }

  async function addEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name")).trim();
    const [firstName, ...remainingName] = name.split(/\s+/);
    const lastName = remainingName.join(" ");
    const designation = String(formData.get("role")).trim();
    const departmentId = String(formData.get("departmentId"));
    const email = String(formData.get("email")).trim();
    setIsSavingEmployee(true);
    try {
      if (isDemoUser) {
        const department = departments.find((item) => item.id === departmentId);
        if (!department) {
          throw new Error("Choose a department from the list.");
        }
        setEmployees((current) => [
          {
            id: `demo-employee-${Date.now()}`,
            name,
            role: designation,
            department: department.name,
            departmentId,
            email,
            startDate: new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            startDateISO: new Date().toISOString().slice(0, 10),
            status: "Active",
            initials: name
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0])
              .join("")
              .toUpperCase(),
            color: "lilac",
          },
          ...current,
        ]);
        setIsAddOpen(false);
        setNotice(`${name} was added to the demo directory.`);
        return;
      }

      await createEmployee({
        data: { firstName, lastName, email, designation, departmentId },
      });
      setIsAddOpen(false);
      setNotice(`${name} was added to your people directory.`);
      setRefreshDirectory((current) => current + 1);
    } catch (error) {
      console.error("[Employees] Unable to add employee.", error);
      setNotice(error instanceof Error ? error.message : "Unable to add this employee.");
    } finally {
      setIsSavingEmployee(false);
    }
  }

  async function reviewLeave(id: string, approve: boolean) {
    setReviewingLeaveId(id);
    try {
      if (isDemoUser) {
        setPendingLeave((current) => current.filter((request) => request.id !== id));
        setPendingLeaveCount((current) => Math.max(0, current - 1));
        setNotice(approve ? "Demo leave request approved." : "Demo leave request declined.");
        return;
      }

      await reviewLeaveRequest({ data: { id, approve, comment: "" } });
      setNotice(approve ? "Leave request approved." : "Leave request declined.");
      setRefreshDirectory((current) => current + 1);
    } catch (error) {
      console.error("[Employees] Unable to review leave request.", error);
      setNotice(error instanceof Error ? error.message : "Unable to review this leave request.");
    } finally {
      setReviewingLeaveId("");
    }
  }

  if (authStatus === "checking") {
    return (
      <AuthMessage title="Checking your session" message="Connecting securely to your workspace…" />
    );
  }

  if (authStatus === "error") {
    return <AuthMessage title="Unable to connect" message={authError} />;
  }

  if (authStatus === "signed-out") {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <a className="brand auth-brand" href="#overview">
            <span className="brand-mark">
              <Sparkles size={18} strokeWidth={2.5} />
            </span>
            <span>
              people<span className="brand-light">flow</span>
            </span>
          </a>
          <p className="auth-eyebrow">YOUR PEOPLE, IN ONE PLACE</p>
          <h1>Welcome back</h1>
          <p className="auth-intro">
            {isDemoBuild
              ? "Use the demo credentials below to preview the HR workspace."
              : "Sign in with your work account to open your HR workspace."}
          </p>
          <form className="auth-form" onSubmit={signIn}>
            <label>
              Email address
              <input
                type="email"
                name="email"
                autoComplete="username"
                placeholder={isDemoBuild ? demoCredentials.email : "you@company.com"}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder={isDemoBuild ? demoCredentials.password : "Enter your password"}
                required
              />
            </label>
            {loginError && (
              <p className="auth-error" role="alert">
                {loginError}
              </p>
            )}
            <button className="primary-button auth-submit" type="submit" disabled={isSigningIn}>
              {isSigningIn ? "Signing in…" : isDemoBuild ? "Open demo workspace" : "Sign in"}
            </button>
          </form>
          {isDemoBuild ? (
            <div className="demo-credentials" aria-label="Demo login credentials">
              <span>Demo email</span>
              <code>{demoCredentials.email}</code>
              <span>Demo password</span>
              <code>{demoCredentials.password}</code>
              <small>Development preview only. No Supabase account or database is used.</small>
            </div>
          ) : (
            <p className="auth-footnote">Access is managed by your organization.</p>
          )}
        </section>
      </main>
    );
  }

  const currentYear = new Date().getFullYear();
  const currentHeadcounts = getYearlyHeadcounts(employees, currentYear);
  const previousHeadcounts = getYearlyHeadcounts(employees, currentYear - 1);
  const currentChartMaximum = Math.max(...currentHeadcounts, ...previousHeadcounts, 1);
  const currentChartPath = buildChartPath(currentHeadcounts, currentChartMaximum);
  const previousChartPath = buildChartPath(previousHeadcounts, currentChartMaximum);
  const currentChartLastY = 192 - (currentHeadcounts.at(-1)! / currentChartMaximum) * 160;
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="hr-app" id="overview">
      <aside className="sidebar">
        <a className="brand" href="#overview" onClick={() => setActiveSection("Overview")}>
          <span className="brand-mark">
            <Sparkles size={18} strokeWidth={2.5} />
          </span>
          <span>
            people<span className="brand-light">flow</span>
          </span>
        </a>

        <div className="workspace-switcher">
          <div className="workspace-logo">A</div>
          <div className="workspace-copy">
            <strong>Acme Studio</strong>
            <span>Free workspace</span>
          </div>
          <ChevronDown size={15} />
        </div>

        <p className="nav-caption">WORKSPACE</p>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map(({ label, icon: Icon, target, count }) => (
            <button
              className={`nav-item ${activeSection === label ? "is-active" : ""}`}
              key={label}
              onClick={() => navigateTo(label, target)}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {count && <span className="nav-count">{count}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <div className="tip-icon">
              <Sparkles size={16} />
            </div>
            <strong>Make people work feel lighter</strong>
            <p>Keep your team in sync, from first day to every day.</p>
            <button onClick={() => setNotice("Your workspace guide is coming soon.")}>
              Explore guide <ArrowRight size={14} />
            </button>
          </div>
          <button
            className="nav-item help-link"
            onClick={() => setNotice("Help center is coming soon.")}
          >
            <CircleHelp size={18} strokeWidth={1.8} />
            <span>Help & support</span>
          </button>
          <div className="profile-row">
            <div className="avatar avatar-dark">JD</div>
            <div className="profile-copy">
              <strong>{currentUserLabel}</strong>
              <span>HR Administrator</span>
            </div>
            <button
              className="signout-button"
              aria-label="Sign out"
              title="Sign out"
              onClick={signOut}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {isDemoUser && (
          <div className="demo-banner" role="status">
            Demo preview: sample data only. Changes are temporary and reset when you refresh.
          </div>
        )}
        <header className="topbar">
          <button
            className="mobile-menu"
            aria-label="Open menu"
            onClick={() => setNotice("Use the sidebar to navigate your workspace.")}
          >
            <Menu size={20} />
          </button>
          <div className="breadcrumbs">
            <span>Workspace</span>
            <span className="crumb-slash">/</span>
            <strong>{activeSection}</strong>
          </div>
          <div className="topbar-actions">
            <span className="today-label">
              <CalendarDays size={15} /> {today}
            </span>
            <button
              className="icon-button notification-button"
              aria-label="Notifications"
              onClick={() => setNotice("You’re all caught up on notifications.")}
            >
              <Bell size={18} />
              <i />
            </button>
            <button
              className="avatar avatar-dark top-avatar top-signout"
              aria-label="Sign out"
              title="Sign out"
              onClick={signOut}
            >
              {currentUserLabel
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase()}
            </button>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <p className="eyebrow">YOUR PEOPLE, AT A GLANCE</p>
              <h1>
                Good morning, {currentUserLabel.split(/\s+/)[0]} <span className="wave">✳</span>
              </h1>
              <p className="welcome-subtitle">Here’s what’s happening with your team today.</p>
            </div>
            <button className="primary-button" onClick={() => setIsAddOpen(true)}>
              <Plus size={17} /> Add employee
            </button>
          </section>

          <section className="stats-grid" aria-label="Workforce summary">
            <article className="stat-card">
              <div className="stat-label">
                Total employees{" "}
                <span className="stat-icon violet">
                  <UsersRound size={17} />
                </span>
              </div>
              <div className="stat-value">{employees.length}</div>
              <p className="stat-foot">employee profiles in the directory</p>
              <div className="mini-bars" aria-hidden="true">
                {currentHeadcounts.map((count, index) => (
                  <i
                    key={index}
                    style={{
                      height: `${Math.max(8, (count / currentChartMaximum) * 100)}%`,
                    }}
                  />
                ))}
              </div>
            </article>
            <article className="stat-card">
              <div className="stat-label">
                Leave requests{" "}
                <span className="stat-icon peach-icon">
                  <CalendarDays size={17} />
                </span>
              </div>
              <div className="stat-value">{pendingLeaveCount}</div>
              <p className="stat-foot">pending HR review</p>
              <button className="stat-link" onClick={() => navigateTo("Time off", "time-off")}>
                Review requests <ArrowRight size={13} />
              </button>
            </article>
            <article className="stat-card">
              <div className="stat-label">
                On leave today{" "}
                <span className="stat-icon green-icon">
                  <CalendarDays size={17} />
                </span>
              </div>
              <div className="stat-value">{onLeaveToday}</div>
              <p className="stat-foot">approved leave requests</p>
              <div className="stat-progress">
                <span style={{ width: `${Math.min(onLeaveToday * 10, 100)}%` }} />
              </div>
            </article>
            <article className="stat-card">
              <div className="stat-label">
                Departments{" "}
                <span className="stat-icon yellow-icon">
                  <BriefcaseBusiness size={17} />
                </span>
              </div>
              <div className="stat-value">{departments.length}</div>
              <p className="stat-foot">active departments</p>
              <div className="avatar-stack" aria-label={`${departments.length} active departments`}>
                {departments.slice(0, 4).map((department, index) => (
                  <span
                    key={department.id}
                    className={`avatar avatar-small ${["peach", "lilac", "blue", "mint"][index]}`}
                  >
                    {department.name.slice(0, 1).toUpperCase()}
                  </span>
                ))}
              </div>
            </article>
          </section>

          <section className="insights-grid">
            <article className="panel workforce-panel">
              <div className="panel-heading">
                <div>
                  <h2>Workforce overview</h2>
                  <p>Employee start dates by year</p>
                </div>
                <button className="select-button">
                  This year <ChevronDown size={14} />
                </button>
              </div>
              <div className="chart-legend">
                <span>
                  <i className="legend-current" /> {currentYear}
                </span>
                <span>
                  <i className="legend-previous" /> {currentYear - 1}
                </span>
                <strong>
                  {currentHeadcounts.at(-1)} <small>this year</small>
                </strong>
              </div>
              <div className="chart-wrap">
                <div className="chart-axis">
                  <span>{currentChartMaximum}</span>
                  <span>{Math.round(currentChartMaximum * 0.75)}</span>
                  <span>{Math.round(currentChartMaximum * 0.5)}</span>
                  <span>{Math.round(currentChartMaximum * 0.25)}</span>
                  <span>0</span>
                </div>
                <svg
                  className="workforce-chart"
                  viewBox="0 0 700 220"
                  role="img"
                  aria-label={`Employee headcount by month, ${currentYear} compared with ${currentYear - 1}`}
                >
                  <defs>
                    <linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#6b66d9" stopOpacity=".18" />
                      <stop offset="100%" stopColor="#6b66d9" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[20, 63, 106, 149, 192].map((y) => (
                    <line key={y} x1="0" y1={y} x2="700" y2={y} className="chart-gridline" />
                  ))}
                  <path d={`${currentChartPath} L700 205 L0 205 Z`} fill="url(#chart-fill)" />
                  <path d={currentChartPath} className="chart-line" />
                  <path d={previousChartPath} className="chart-line chart-line-previous" />
                  <circle cx="700" cy={currentChartLastY} r="5" className="chart-dot" />
                </svg>
                <div className="chart-months">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Aug</span>
                  <span>Sep</span>
                  <span>Oct</span>
                  <span>Nov</span>
                  <span>Dec</span>
                </div>
              </div>
            </article>

            <article className="panel departments-panel">
              <div className="panel-heading">
                <div>
                  <h2>By department</h2>
                  <p>Team distribution</p>
                </div>
                <button className="icon-button subtle-icon" aria-label="More department options">
                  <MoreHorizontal size={19} />
                </button>
              </div>
              <div className="department-total">
                <strong>{employees.length}</strong>
                <span>team members</span>
              </div>
              <div className="department-chart" aria-label="Department distribution">
                {departments.map((department, index) => {
                  const count = employees.filter(
                    (employee) => employee.departmentId === department.id,
                  ).length;
                  const colors = [
                    "segment-design",
                    "segment-engineering",
                    "segment-marketing",
                    "segment-people",
                  ];
                  return (
                    <span
                      key={department.id}
                      className={colors[index % colors.length]}
                      style={{ flex: count }}
                      title={`${department.name}: ${count}`}
                    />
                  );
                })}
              </div>
              <div className="department-list">
                {departments.map((department, index) => {
                  const count = employees.filter(
                    (employee) => employee.departmentId === department.id,
                  ).length;
                  const colors = ["design-dot", "engineering-dot", "marketing-dot", "people-dot"];
                  return (
                    <div key={department.id}>
                      <span className="department-name">
                        <i className={`dot ${colors[index % colors.length]}`} />
                        {department.name}
                      </span>
                      <strong>
                        {count}{" "}
                        <small>
                          {employees.length ? Math.round((count / employees.length) * 100) : 0}%
                        </small>
                      </strong>
                    </div>
                  );
                })}
              </div>
            </article>
          </section>

          <section className="lower-grid">
            <article className="panel employees-panel" id="people">
              <div className="panel-heading employee-heading">
                <div>
                  <h2>People</h2>
                  <p>A little hello goes a long way.</p>
                </div>
                <button
                  className="text-button"
                  onClick={() => setNotice("Showing all employees in your directory.")}
                >
                  View directory <ArrowRight size={15} />
                </button>
              </div>
              <div className="table-toolbar">
                <label className="search-box">
                  <Search size={16} />
                  <input
                    aria-label="Search employees"
                    placeholder="Search people..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  <kbd>⌘ K</kbd>
                </label>
                <button
                  className="filter-button"
                  onClick={() => setNotice("Showing all departments.")}
                >
                  <SlidersHorizontal size={15} /> Filter
                </button>
                <button
                  className="filter-button export-button"
                  onClick={() => setNotice("Your employee list is ready to export.")}
                >
                  <Download size={15} /> Export
                </button>
              </div>
              <div className="employee-table-wrap">
                <table className="employee-table">
                  <thead>
                    <tr>
                      <th>NAME</th>
                      <th>DEPARTMENT</th>
                      <th>START DATE</th>
                      <th>STATUS</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((employee) => (
                      <tr key={employee.email}>
                        <td>
                          <div className="employee-identity">
                            <span className={`avatar employee-avatar ${employee.color}`}>
                              {employee.initials}
                            </span>
                            <span>
                              <strong>{employee.name}</strong>
                              <small>{employee.role}</small>
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="department-pill">{employee.department}</span>
                        </td>
                        <td className="start-date">{employee.startDate}</td>
                        <td>
                          <span
                            className={`status-pill ${
                              employee.status === "Active"
                                ? "status-active"
                                : employee.status === "On leave"
                                  ? "status-leave"
                                  : "status-other"
                            }`}
                          >
                            <i />
                            {employee.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="row-more"
                            aria-label={`More options for ${employee.name}`}
                            onClick={() => setNotice(`${employee.name} · ${employee.email}`)}
                          >
                            <MoreHorizontal size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {isDirectoryLoading && (
                      <tr>
                        <td colSpan={5} className="empty-state">
                          Loading employee records…
                        </td>
                      </tr>
                    )}
                    {!isDirectoryLoading && directoryError && (
                      <tr>
                        <td colSpan={5} className="empty-state">
                          {directoryError}{" "}
                          <button
                            className="retry-button"
                            onClick={() => setRefreshDirectory((current) => current + 1)}
                          >
                            Retry
                          </button>
                        </td>
                      </tr>
                    )}
                    {!isDirectoryLoading && !directoryError && filteredEmployees.length === 0 && (
                      <tr>
                        <td colSpan={5} className="empty-state">
                          {search
                            ? `No people match “${search}”. Try another name or department.`
                            : "No employee records yet. Add your first teammate to get started."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="table-footer">
                <span>
                  Showing <strong>{filteredEmployees.length}</strong> of{" "}
                  <strong>{employees.length}</strong> employees
                </span>
                <button
                  className="pagination-button"
                  onClick={() => setNotice("You’re viewing the latest employees.")}
                >
                  View all <ArrowRight size={14} />
                </button>
              </div>
            </article>

            <div className="right-column">
              <article className="panel birthdays-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Upcoming events</h2>
                    <p>From your company calendar</p>
                  </div>
                  <button
                    className="icon-button subtle-icon"
                    aria-label="Refresh calendar events"
                    onClick={() => setRefreshDirectory((current) => current + 1)}
                  >
                    <CalendarDays size={17} />
                  </button>
                </div>
                {upcomingEvents.length === 0 && (
                  <p className="empty-events">No events scheduled in the next 30 days.</p>
                )}
                {upcomingEvents.map((event) => {
                  const eventDate = new Date(`${event.event_date}T00:00:00`);
                  return (
                    <div className="celebration-item" key={event.id}>
                      <span className="date-tile">
                        <strong>{eventDate.getDate()}</strong>
                        <small>
                          {eventDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}
                        </small>
                      </span>
                      <span className="celebration-copy">
                        <strong>{event.title}</strong>
                        <small>{event.description || event.event_type}</small>
                      </span>
                      <span className="event-kind">{event.event_type}</span>
                    </div>
                  );
                })}
              </article>
              <article className="panel hiring-panel" id="time-off">
                <div className="panel-heading">
                  <div>
                    <h2>Leave requests</h2>
                    <p>{pendingLeaveCount} awaiting your review</p>
                  </div>
                  <button
                    className="text-button compact-link"
                    onClick={() => setRefreshDirectory((current) => current + 1)}
                  >
                    Refresh <ArrowRight size={14} />
                  </button>
                </div>
                {isDirectoryLoading && <p className="empty-events">Loading leave requests…</p>}
                {!isDirectoryLoading && !directoryError && pendingLeave.length === 0 && (
                  <p className="empty-events">There are no pending leave requests.</p>
                )}
                {pendingLeave.map((request) => (
                  <div className="leave-request" key={request.id}>
                    <div className="leave-request-info">
                      <strong>{request.employeeName}</strong>
                      <small>
                        {request.leaveType} · {request.days} {request.days === 1 ? "day" : "days"}
                      </small>
                      <small>
                        {new Date(`${request.startDate}T00:00:00`).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                        {" – "}
                        {new Date(`${request.endDate}T00:00:00`).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </small>
                    </div>
                    <div className="leave-actions">
                      <button
                        className="leave-approve"
                        disabled={reviewingLeaveId === request.id}
                        onClick={() => reviewLeave(request.id, true)}
                      >
                        Approve
                      </button>
                      <button
                        className="leave-decline"
                        disabled={reviewingLeaveId === request.id}
                        onClick={() => reviewLeave(request.id, false)}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </article>
              <article className="timeoff-card">
                <div className="timeoff-icon">
                  <CalendarDays size={18} />
                </div>
                <div>
                  <strong>{onLeaveToday} team members on leave</strong>
                  <p>Approved time off today</p>
                </div>
                <button
                  aria-label="Refresh leave records"
                  onClick={() => setRefreshDirectory((current) => current + 1)}
                >
                  <ArrowRight size={16} />
                </button>
              </article>
              <div id="payroll" className="section-anchor" />
            </div>
          </section>

          <footer className="page-footer">
            <span>Made for people people.</span>
            <span>
              <i className="online-dot" /> All systems operational
            </span>
          </footer>
        </div>
      </main>

      {notice && (
        <div className="toast-message" role="status">
          <span className="toast-check">
            <Check size={15} />
          </span>
          {notice}
          <button aria-label="Dismiss message" onClick={() => setNotice("")}>
            <X size={15} />
          </button>
        </div>
      )}

      {isAddOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsAddOpen(false);
          }}
        >
          <section
            className="employee-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="modal-heading">
              <div>
                <span className="modal-icon">
                  <UsersRound size={18} />
                </span>
                <h2 id="modal-title">Add a teammate</h2>
                <p>Start a new employee profile in your directory.</p>
              </div>
              <button
                className="icon-button"
                aria-label="Close dialog"
                onClick={() => setIsAddOpen(false)}
              >
                <X size={19} />
              </button>
            </div>
            <form onSubmit={addEmployee}>
              <label>
                Full name
                <input
                  name="name"
                  placeholder="e.g. Alex Morgan"
                  pattern="\\S+\\s+\\S+"
                  title="Enter a first and last name."
                  autoFocus
                  required
                />
              </label>
              <label>
                Work email
                <input
                  name="email"
                  type="email"
                  placeholder="alex@company.com"
                  maxLength={254}
                  required
                />
              </label>
              <div className="form-row">
                <label>
                  Job title
                  <input name="role" placeholder="e.g. Product Designer" maxLength={100} required />
                </label>
                <label>
                  Department
                  <select name="departmentId" defaultValue="" required>
                    <option value="" disabled>
                      Select department
                    </option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  disabled={isSavingEmployee}
                  onClick={() => setIsAddOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={isSavingEmployee || departments.length === 0}
                >
                  <Plus size={16} /> {isSavingEmployee ? "Saving…" : "Add employee"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
