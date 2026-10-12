# HR Navigator

# MASTER PROMPT: PROJECT 26 — ADVANCED EMPLOYEE MANAGEMENT SYSTEM

## 1. YOUR ROLE

Act as a senior full-stack software engineer, software architect, UI/UX designer, database engineer, cybersecurity specialist, QA engineer, and technical documentation writer.

Build a complete, professional, responsive, full-stack Employee Management System (EMS) suitable for real-world business use, academic assessment, software demonstrations, and a developer portfolio.

Do not create only a frontend prototype, static dashboard, landing page, or UI mockup. Implement the client, server, database integration, business logic, authentication, authorization, validations, and automated tests.

The application must be runnable locally and prepared for online deployment.

## 2. PROJECT NAME AND OBJECTIVE

Project name: Employee Management System (EMS)

Main objective:
Create a secure centralized HR management platform for managing employees, departments, attendance, leave requests, payroll, performance reviews, notifications, company documents, reports, and company settings.

The application must support three roles:

1. ADMIN
2. HR_MANAGER
3. EMPLOYEE

All role permissions must be enforced on the server, not merely hidden in the frontend.

## 3. MANDATORY TECHNOLOGY STACK

CLIENT:
- React with JavaScript
- Vite
- HTML5
- CSS3
- React Router
- Axios
- Reusable functional components and hooks
- A suitable charting library
- Responsive CSS and accessible UI components

SERVER:
- Node.js
- Express.js
- REST API
- Modular route, controller, service, repository/model, and middleware layers
- JWT-based authentication
- bcrypt password hashing
- Input validation
- Centralized error handling
- Request logging and security middleware

DATABASE:
- PostgreSQL only
- Use a maintained PostgreSQL driver or a suitable ORM such as Prisma
- Provide database migrations and seed scripts
- Use relational constraints, indexes, transactions, and parameterized queries
- Do not replace PostgreSQL with Firebase, MongoDB, localStorage, or mock data

AUTHENTICATION AND SECURITY:
- Short-lived access tokens
- A secure refresh-token strategy, preferably using HttpOnly, Secure, SameSite cookies where deployment permits
- bcrypt password hashing
- Server-side role-based access control
- Password reset workflow
- Account activation and deactivation
- Login rate limiting
- CORS restrictions
- Helmet security headers
- Input validation and output sanitization where appropriate
- Audit logs
- Secrets stored in environment variables

## 4. REQUIRED PROJECT STRUCTURE

Create a clearly separated full-stack project:

employee-management/
  client/
    public/
    src/
      assets/
      components/
      layouts/
      pages/
      dashboard/
      features/
        auth/
        employees/
        departments/
        attendance/
        leave/
        payroll/
        performance/
        notifications/
        reports/
        documents/
      services/
      hooks/
      context/
      utils/
      styles/
      App.jsx
      main.jsx
    package.json
    .env.example
    vite.config.js

  server/
    src/
      config/
      routes/
      controllers/
      services/
      repositories/
      middleware/
      validators/
      utils/
      jobs/
      tests/
      app.js
      server.js
    prisma/
      schema.prisma
      migrations/
      seed.js
    package.json
    .env.example

  docs/
    architecture.md
    database-design.md
    api-documentation.md
    security.md
    user-guide.md
    deployment-guide.md

  .gitignore
  docker-compose.yml
  package.json
  README.md

Adapt the structure where technically necessary, but preserve the distinct client and server directories. Include every file required to run the application. Do not reference nonexistent files.

## 5. USER INTERFACE AND DESIGN

Build a premium enterprise HR dashboard.

Design requirements:
- Clean professional layout
- Collapsible sidebar
- Top navigation bar
- User profile menu
- Breadcrumbs
- Search, filters, pagination, sorting, and tables
- Data cards and interactive charts
- Forms with clear validation errors
- Loading states and skeletons
- Empty states
- Success and error notifications
- Confirmation dialogs for destructive actions
- Light and dark modes
- Mobile navigation
- Responsive desktop, tablet, and mobile layouts
- Keyboard accessibility
- Consistent typography, spacing, colors, icons, and buttons

Suggested navigation:
- Dashboard
- Employees
- Departments
- Attendance
- Leave Management
- Payroll
- Performance
- Company Calendar
- Documents
- Notifications
- Reports and Analytics
- User Management
- Audit Logs
- Settings

Create functional login, registration where permitted, password recovery, and role-specific dashboards.

Use realistic demonstration data only through the database seed script. Clearly identify demo records and never present fake data as live production information.

## 6. AUTHENTICATION AND ROLE PERMISSIONS

Implement:
- User registration with appropriate restrictions
- Login and logout
- Password hashing
- Token issuance and expiration
- Refresh-token rotation and revocation
- Forgot-password and reset-password workflow
- Authenticated route protection
- Session expiration handling
- Account activation and deactivation
- Role-specific navigation and dashboards

Registration must not allow anyone to become an administrator by submitting an arbitrary role. Public registration, if enabled, must create only an employee or a pending account. Initial administrator creation must use a secure seed or bootstrap procedure.

ADMIN permissions:
- Full authorized system administration
- Manage users, employees, departments, and company settings
- Configure roles and permissions
- View organization-wide reports
- Manage payroll processing permissions
- Review audit logs

HR_MANAGER permissions:
- Manage employee records
- Manage departments as permitted
- Review attendance and leave requests
- Manage performance reviews
- Prepare and process authorized payroll
- Generate HR reports
- Publish company announcements

EMPLOYEE permissions:
- View their own profile
- Update permitted personal information
- Check in and check out
- View personal attendance
- Apply for and cancel eligible leave requests
- View leave balances and leave history
- View and download their own payslips
- View their own performance reviews and goals
- Read announcements and manage notifications

Enforce object-level authorization. Employees must never access another employee's confidential information by changing an ID in a URL or API request.

## 7. EMPLOYEE MANAGEMENT MODULE

Implement full create, read, update, and delete or archive functionality.

Employee fields:
- Employee database ID
- Unique employee number, such as EMP101
- First and last name
- Work email
- Phone number
- Address where required
- Department
- Designation
- Manager
- Employment type
- Employment status
- Date of joining
- Date of leaving, if applicable
- Salary and currency
- Emergency contact where required
- Profile photo
- Created and updated timestamps

Requirements:
- Unique employee number and appropriate email constraints
- Search by name, employee number, email, department, or designation
- Filters by department, status, and employment type
- Pagination and sorting
- Employee profile page
- Employment history where appropriate
- Archive employees rather than destroying records required for payroll or audit
- Validate all changes on the server

Protect sensitive employee information and restrict access according to role.

## 8. DEPARTMENT MANAGEMENT MODULE

Implement:
- Create departments
- Edit departments
- View department details
- Assign department managers
- Assign employees to departments
- Display employee counts
- Store department budgets
- Search and filter departments
- Handle deletion safely when employees or historical records depend on a department

Use foreign keys and consistent database transactions.

## 9. ATTENDANCE MANAGEMENT MODULE

Implement:
- Employee check-in
- Employee check-out
- Server-generated timestamps
- Duplicate check-in prevention
- Prevention of invalid checkout sequences
- Working-hours calculation
- Configurable break deductions
- Overtime calculations based on company rules
- Attendance status
- Late arrivals and missing attendance
- Manual corrections requiring authorization
- Correction history and audit records
- Daily, weekly, and monthly reports

Use company timezone settings consistently. Store timestamps in PostgreSQL using appropriate timezone-aware types.

Enforce one valid attendance session at a time per employee and prevent duplicate sessions using database constraints and transactional logic.

If GPS attendance is implemented, request explicit browser permission, validate supplied coordinates, document its limitations, and never treat client-provided GPS coordinates as independently verified proof of physical presence.

## 10. LEAVE MANAGEMENT MODULE

Leave types:
- Casual Leave
- Sick Leave
- Paid Leave
- Unpaid Leave

Implement:
- Leave balance tracking
- Leave application
- Start date and end date
- Leave reason
- Supporting document upload where appropriate
- Leave history
- Cancellation of eligible pending requests
- Approval and rejection by authorized HR users
- Reviewer comments
- Notifications when status changes
- Configurable leave policies
- Leave balance updates
- Conflict detection for overlapping requests
- Leave calendar

Use a defined approval workflow and database transactions to prevent duplicate approvals, incorrect balances, and race conditions.

Calculate eligible leave days using configured working days, weekends, and company holidays. Clearly define the rules for unpaid leave and partial days.

Employees must not approve their own leave requests unless a specifically authorized policy allows it.

## 11. PAYROLL MANAGEMENT MODULE

Implement a secure payroll subsystem with:
- Basic salary
- Allowances
- Bonuses
- Overtime payments
- Deductions
- Tax
- Pension or other statutory deductions where applicable
- Gross salary
- Net salary
- Pay period
- Payroll status
- Payment date
- Payslip generation and download

Define the formula:

Gross Pay = Basic Salary + Allowances + Bonuses + Overtime Pay

Net Pay = Gross Pay - Tax - Other Deductions

Implement a configurable payroll calculation service. Do not hardcode tax rates or statutory contribution rules. Support jurisdiction-specific, effective-dated payroll rules and clearly document any demo calculation assumptions.

Use decimal-safe numeric types and appropriate currency precision. Never use JavaScript floating-point arithmetic for financial calculations without a safe decimal strategy.

Implement:
- Payroll period creation
- Draft payroll
- Payroll preview
- Validation before processing
- Authorized approval and processing
- Duplicate processing prevention
- Payroll history
- Individual payslips
- Printable and downloadable PDF payslips
- Payroll summary reports
- Audit records for payroll changes

Processed payroll must be immutable by default. Corrections must use an authorized adjustment, reversal, or new payroll record with an audit trail.

Restrict payroll access to authorized roles and employees' own payslips.

## 12. PERFORMANCE MANAGEMENT MODULE

Implement:
- Performance review cycles
- Review periods
- Employee goals
- Measurable objectives
- Manager feedback
- Employee comments where permitted
- Configurable rating scales
- Review status
- Review history
- Notifications for upcoming reviews
- Performance summaries

Enforce manager and employee permissions.

If AI-powered performance insights are added, treat them as optional decision-support suggestions. Never generate unsupported claims, automatically make employment decisions, or expose sensitive information to external AI services without explicit authorization and privacy safeguards.

## 13. DASHBOARD AND ANALYTICS

Admin and HR dashboards must display database-backed information:
- Total employees
- Active employees
- Employees present today
- Employees on approved leave
- Department-wise employee counts
- Upcoming birthdays where permitted
- Attendance trends
- Leave statistics
- Monthly payroll totals
- Recent activities
- Pending leave requests
- Upcoming performance reviews

Employee dashboard:
- Personal profile summary
- Today's attendance
- Attendance history
- Available leave balance
- Leave request status
- Latest payslip
- Upcoming goals and reviews
- Notifications

Use efficient database aggregation queries. All charts and metrics must be based on API responses and PostgreSQL data, not hardcoded frontend numbers.

## 14. NOTIFICATIONS AND COMPANY CALENDAR

Implement in-app notifications for:
- Leave approved or rejected
- Payroll processed
- Missing attendance
- Upcoming performance reviews
- Company announcements
- Upcoming holidays and events

Include:
- Notification list
- Read/unread status
- Mark-as-read action
- Unread count
- Relevant navigation links
- Company calendar

Use scheduled jobs for time-based reminders. If real-time updates are implemented, use an appropriate WebSocket solution with authentication and authorization.

Never claim an email, push notification, or real-time delivery succeeded unless the corresponding service is configured and the result is confirmed.

## 15. REPORTS AND EXPORTS

Provide reports for:
- Employee directory
- Department staffing
- Attendance
- Leave usage and balances
- Payroll summaries
- Performance review completion

Include date filters, department filters, sorting, pagination, and appropriate access restrictions.

Support CSV export and PDF reports where useful. Validate report parameters and enforce authorization on every export endpoint.

Do not expose confidential payroll or employee information through public download URLs.

## 16. DOCUMENT MANAGEMENT

Where implemented, allow authorized users to upload, categorize, view, and download employee documents.

Requirements:
- File size limits
- Allowed file types
- Server-side file validation
- Private storage
- Authorization checks before every download
- Safe filenames
- Protection against malicious uploads
- Audit logs for sensitive document access

Do not expose private documents in a public static directory.

## 17. DATABASE DESIGN

Create normalized PostgreSQL tables for at least:
- users
- roles or permissions
- employees
- departments
- attendance_records
- leave_types
- leave_balances
- leave_requests
- leave_approvals
- payroll_periods
- payroll_records
- payroll_items
- payroll_rules
- performance_reviews
- performance_goals
- notifications
- announcements
- company_events
- employee_documents
- audit_logs
- refresh_tokens or secure session records

Add any additional tables needed for a correct implementation.

Requirements:
- Primary keys
- Foreign keys
- Unique constraints
- Check constraints
- Appropriate indexes
- Created and updated timestamps
- Soft deletion or archival where appropriate
- Transactional workflows

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8a5d05c5-4a30-4664-816d-5606448f201d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
