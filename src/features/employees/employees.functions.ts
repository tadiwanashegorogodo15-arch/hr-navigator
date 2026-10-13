import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const createEmployeeSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  email: z.string().trim().email().max(254),
  designation: z.string().trim().min(1).max(100),
  departmentId: z.string().uuid(),
});

type EmployeeStatus = "Active" | "On leave" | "Probation" | "Terminated";
type AuthenticatedSupabase = SupabaseClient<Database>;

async function requireHrRole(supabase: AuthenticatedSupabase, userId: string) {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);

  if (error) {
    console.error("[Employees] Unable to verify the user's role.", error);
    throw new Error("Unable to verify your access.");
  }

  if (!data.some(({ role }) => role === "admin" || role === "hr_manager")) {
    throw new Error("HR administrator access is required.");
  }
}

function displayStatus(status: Database["public"]["Enums"]["employment_status"]): EmployeeStatus {
  switch (status) {
    case "active":
      return "Active";
    case "on_leave":
      return "On leave";
    case "probation":
      return "Probation";
    case "terminated":
    case "archived":
      return "Terminated";
  }
}

export const getPeopleDirectory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireHrRole(context.supabase, context.userId);
    const today = new Date().toISOString().slice(0, 10);
    const upcomingLimit = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const [
      employeesResult,
      departmentsResult,
      pendingLeaveResult,
      currentLeaveResult,
      eventsResult,
    ] = await Promise.all([
      context.supabase
        .from("employees")
        .select(
          "id, first_name, last_name, work_email, designation, date_of_joining, status, department_id",
        )
        .is("archived_at", null)
        .order("created_at", { ascending: false }),
      context.supabase.from("departments").select("id, name").is("archived_at", null).order("name"),
      context.supabase
        .from("leave_requests")
        .select("id, employee_id, leave_type_id, start_date, end_date, days", { count: "exact" })
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(10),
      context.supabase
        .from("leave_requests")
        .select("employee_id")
        .eq("status", "approved")
        .lte("start_date", today)
        .gte("end_date", today),
      context.supabase
        .from("company_events")
        .select("id, title, description, event_date, event_type")
        .gte("event_date", today)
        .lte("event_date", upcomingLimit)
        .order("event_date")
        .limit(5),
    ]);

    if (employeesResult.error) {
      console.error("[Employees] Unable to load the employee directory.", employeesResult.error);
      if (employeesResult.error.code === "42P01") {
        throw new Error(
          "The database schema is not installed yet. Follow the Database setup steps in the project README.",
        );
      }
      throw new Error("Unable to load employee data. Please try again.");
    }
    if (departmentsResult.error) {
      console.error("[Employees] Unable to load departments.", departmentsResult.error);
      throw new Error("Unable to load department data. Please try again.");
    }
    if (pendingLeaveResult.error) {
      console.error("[Employees] Unable to load pending leave requests.", pendingLeaveResult.error);
      throw new Error("Unable to load pending leave requests. Please try again.");
    }
    if (currentLeaveResult.error) {
      console.error(
        "[Employees] Unable to load employees on leave today.",
        currentLeaveResult.error,
      );
      throw new Error("Unable to load today's leave records. Please try again.");
    }
    if (eventsResult.error) {
      console.error("[Employees] Unable to load company events.", eventsResult.error);
      throw new Error("Unable to load upcoming events. Please try again.");
    }

    const leaveTypeIds = [
      ...new Set(pendingLeaveResult.data.map((request) => request.leave_type_id)),
    ];
    const leaveTypesResult =
      leaveTypeIds.length > 0
        ? await context.supabase.from("leave_types").select("id, name").in("id", leaveTypeIds)
        : { data: [], error: null };
    if (leaveTypesResult.error) {
      console.error("[Employees] Unable to load leave types.", leaveTypesResult.error);
      throw new Error("Unable to load leave type details. Please try again.");
    }

    const departmentNames = new Map(
      departmentsResult.data.map((department) => [department.id, department.name]),
    );
    const employeeNames = new Map(
      employeesResult.data.map((employee) => [
        employee.id,
        `${employee.first_name} ${employee.last_name}`,
      ]),
    );
    const leaveTypeNames = new Map(leaveTypesResult.data.map((type) => [type.id, type.name]));

    return {
      employees: employeesResult.data.map((employee) => ({
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
        role: employee.designation ?? "Employee",
        department: employee.department_id
          ? (departmentNames.get(employee.department_id) ?? "Unassigned")
          : "Unassigned",
        departmentId: employee.department_id,
        email: employee.work_email,
        startDate: employee.date_of_joining,
        status: displayStatus(employee.status),
      })),
      departments: departmentsResult.data,
      pendingLeave: pendingLeaveResult.data.map((request) => ({
        id: request.id,
        employeeName: employeeNames.get(request.employee_id) ?? "Employee",
        leaveType: leaveTypeNames.get(request.leave_type_id) ?? "Time off",
        startDate: request.start_date,
        endDate: request.end_date,
        days: request.days,
      })),
      pendingLeaveCount: pendingLeaveResult.count ?? pendingLeaveResult.data.length,
      onLeaveToday: new Set(currentLeaveResult.data.map((request) => request.employee_id)).size,
      upcomingEvents: eventsResult.data,
    };
  });

export const createEmployee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(createEmployeeSchema)
  .handler(async ({ context, data }) => {
    await requireHrRole(context.supabase, context.userId);

    const { error } = await context.supabase.from("employees").insert({
      first_name: data.firstName,
      last_name: data.lastName,
      work_email: data.email,
      designation: data.designation,
      department_id: data.departmentId,
    });

    if (error) {
      if (error.code === "23505") {
        throw new Error("An employee with this work email already exists.");
      }
      console.error("[Employees] Unable to create employee.", error);
      throw new Error("Unable to add this employee. Please try again.");
    }
  });

const reviewLeaveSchema = z.object({
  id: z.string().uuid(),
  approve: z.boolean(),
  comment: z.string().trim().max(1000).default(""),
});

export const reviewLeaveRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(reviewLeaveSchema)
  .handler(async ({ context, data }) => {
    await requireHrRole(context.supabase, context.userId);

    const { error } = await context.supabase.rpc("review_leave", {
      _id: data.id,
      _approve: data.approve,
      _comment: data.comment,
    });

    if (error) {
      console.error("[Employees] Unable to review leave request.", error);
      throw new Error(error.message || "Unable to review this leave request. Please try again.");
    }
  });
