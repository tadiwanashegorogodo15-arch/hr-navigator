export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          body: string
          created_at: string
          id: string
          is_demo: boolean
          published_by: string | null
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_demo?: boolean
          published_by?: string | null
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          published_by?: string | null
          title?: string
        }
        Relationships: []
      }
      attendance_corrections: {
        Row: {
          attendance_id: string
          corrected_by: string
          created_at: string
          id: string
          new_check_in: string
          new_check_out: string | null
          old_check_in: string | null
          old_check_out: string | null
          reason: string
        }
        Insert: {
          attendance_id: string
          corrected_by: string
          created_at?: string
          id?: string
          new_check_in: string
          new_check_out?: string | null
          old_check_in?: string | null
          old_check_out?: string | null
          reason: string
        }
        Update: {
          attendance_id?: string
          corrected_by?: string
          created_at?: string
          id?: string
          new_check_in?: string
          new_check_out?: string | null
          old_check_in?: string | null
          old_check_out?: string | null
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_corrections_attendance_id_fkey"
            columns: ["attendance_id"]
            isOneToOne: false
            referencedRelation: "attendance_records"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          break_minutes: number
          check_in: string
          check_out: string | null
          created_at: string
          employee_id: string
          id: string
          is_late: boolean
          latitude: number | null
          longitude: number | null
          notes: string | null
          overtime_minutes: number
          status: string
          updated_at: string
          work_date: string
          worked_minutes: number
        }
        Insert: {
          break_minutes?: number
          check_in: string
          check_out?: string | null
          created_at?: string
          employee_id: string
          id?: string
          is_late?: boolean
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          overtime_minutes?: number
          status?: string
          updated_at?: string
          work_date: string
          worked_minutes?: number
        }
        Update: {
          break_minutes?: number
          check_in?: string
          check_out?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          is_late?: boolean
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          overtime_minutes?: number
          status?: string
          updated_at?: string
          work_date?: string
          worked_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          entity: string
          entity_id: string | null
          id: number
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity: string
          entity_id?: string | null
          id?: never
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity?: string
          entity_id?: string | null
          id?: never
        }
        Relationships: []
      }
      company_events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          event_date: string
          event_type: string
          id: string
          is_demo: boolean
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_date: string
          event_type?: string
          id?: string
          is_demo?: boolean
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_date?: string
          event_type?: string
          id?: string
          is_demo?: boolean
          title?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          allow_public_signup: boolean
          break_minutes: number
          company_name: string
          currency: string
          id: number
          late_grace_minutes: number
          monthly_working_days: number
          overtime_multiplier: number
          standard_daily_minutes: number
          timezone: string
          updated_at: string
          work_start: string
          working_days: number[]
        }
        Insert: {
          allow_public_signup?: boolean
          break_minutes?: number
          company_name?: string
          currency?: string
          id?: number
          late_grace_minutes?: number
          monthly_working_days?: number
          overtime_multiplier?: number
          standard_daily_minutes?: number
          timezone?: string
          updated_at?: string
          work_start?: string
          working_days?: number[]
        }
        Update: {
          allow_public_signup?: boolean
          break_minutes?: number
          company_name?: string
          currency?: string
          id?: number
          late_grace_minutes?: number
          monthly_working_days?: number
          overtime_multiplier?: number
          standard_daily_minutes?: number
          timezone?: string
          updated_at?: string
          work_start?: string
          working_days?: number[]
        }
        Relationships: []
      }
      departments: {
        Row: {
          archived_at: string | null
          budget: number
          code: string
          created_at: string
          description: string | null
          id: string
          is_demo: boolean
          manager_id: string | null
          name: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          budget?: number
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_demo?: boolean
          manager_id?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          budget?: number
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_demo?: boolean
          manager_id?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_manager_fk"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          category: string
          created_at: string
          employee_id: string
          file_name: string
          id: string
          mime_type: string
          size_bytes: number
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          category: string
          created_at?: string
          employee_id: string
          file_name: string
          id?: string
          mime_type: string
          size_bytes: number
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          employee_id?: string
          file_name?: string
          id?: string
          mime_type?: string
          size_bytes?: number
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          archived_at: string | null
          created_at: string
          currency: string
          date_of_birth: string | null
          date_of_joining: string
          date_of_leaving: string | null
          department_id: string | null
          designation: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_number: string
          employment_type: Database["public"]["Enums"]["employment_type"]
          first_name: string
          id: string
          is_demo: boolean
          last_name: string
          manager_id: string | null
          monthly_salary: number
          phone: string | null
          photo_url: string | null
          status: Database["public"]["Enums"]["employment_status"]
          updated_at: string
          user_id: string | null
          work_email: string
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          created_at?: string
          currency?: string
          date_of_birth?: string | null
          date_of_joining?: string
          date_of_leaving?: string | null
          department_id?: string | null
          designation?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_number?: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          first_name: string
          id?: string
          is_demo?: boolean
          last_name: string
          manager_id?: string | null
          monthly_salary?: number
          phone?: string | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["employment_status"]
          updated_at?: string
          user_id?: string | null
          work_email: string
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          created_at?: string
          currency?: string
          date_of_birth?: string | null
          date_of_joining?: string
          date_of_leaving?: string | null
          department_id?: string | null
          designation?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_number?: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          first_name?: string
          id?: string
          is_demo?: boolean
          last_name?: string
          manager_id?: string | null
          monthly_salary?: number
          phone?: string | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["employment_status"]
          updated_at?: string
          user_id?: string | null
          work_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employment_history: {
        Row: {
          change_type: string
          changed_by: string | null
          created_at: string
          employee_id: string
          id: string
          new_value: Json | null
          old_value: Json | null
        }
        Insert: {
          change_type: string
          changed_by?: string | null
          created_at?: string
          employee_id: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Update: {
          change_type?: string
          changed_by?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "employment_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_approvals: {
        Row: {
          action: string
          actor_id: string
          comment: string | null
          created_at: string
          id: string
          leave_request_id: string
        }
        Insert: {
          action: string
          actor_id: string
          comment?: string | null
          created_at?: string
          id?: string
          leave_request_id: string
        }
        Update: {
          action?: string
          actor_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          leave_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_approvals_leave_request_id_fkey"
            columns: ["leave_request_id"]
            isOneToOne: false
            referencedRelation: "leave_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_balances: {
        Row: {
          allocated: number
          employee_id: string
          id: string
          leave_type_id: string
          updated_at: string
          used: number
          year: number
        }
        Insert: {
          allocated?: number
          employee_id: string
          id?: string
          leave_type_id: string
          updated_at?: string
          used?: number
          year: number
        }
        Update: {
          allocated?: number
          employee_id?: string
          id?: string
          leave_type_id?: string
          updated_at?: string
          used?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_balances_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          created_at: string
          days: number
          document_path: string | null
          employee_id: string
          end_date: string
          half_day: boolean
          id: string
          leave_type_id: string
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_comment: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          days: number
          document_path?: string | null
          employee_id: string
          end_date: string
          half_day?: boolean
          id?: string
          leave_type_id: string
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_comment?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          days?: number
          document_path?: string | null
          employee_id?: string
          end_date?: string
          half_day?: boolean
          id?: string
          leave_type_id?: string
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_comment?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          annual_allowance: number
          code: string
          created_at: string
          id: string
          is_paid: boolean
          name: string
          requires_document: boolean
          tracks_balance: boolean
        }
        Insert: {
          annual_allowance?: number
          code: string
          created_at?: string
          id?: string
          is_paid?: boolean
          name: string
          requires_document?: boolean
          tracks_balance?: boolean
        }
        Update: {
          annual_allowance?: number
          code?: string
          created_at?: string
          id?: string
          is_paid?: boolean
          name?: string
          requires_document?: boolean
          tracks_balance?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          category: string
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          category?: string
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          category?: string
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      payroll_items: {
        Row: {
          amount: number
          created_at: string
          id: string
          kind: string
          label: string
          record_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          kind: string
          label: string
          record_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          kind?: string
          label?: string
          record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_items_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "payroll_records"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_periods: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          pay_date: string
          period_end: string
          period_start: string
          processed_at: string | null
          processed_by: string | null
          status: Database["public"]["Enums"]["payroll_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          pay_date: string
          period_end: string
          period_start: string
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["payroll_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          pay_date?: string
          period_end?: string
          period_start?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["payroll_status"]
          updated_at?: string
        }
        Relationships: []
      }
      payroll_records: {
        Row: {
          allowances: number
          basic_salary: number
          bonuses: number
          created_at: string
          currency: string
          employee_id: string
          gross_pay: number
          id: string
          net_pay: number
          other_deductions: number
          overtime_minutes: number
          overtime_pay: number
          period_id: string
          tax: number
          unpaid_leave_days: number
          updated_at: string
        }
        Insert: {
          allowances?: number
          basic_salary?: number
          bonuses?: number
          created_at?: string
          currency: string
          employee_id: string
          gross_pay?: number
          id?: string
          net_pay?: number
          other_deductions?: number
          overtime_minutes?: number
          overtime_pay?: number
          period_id: string
          tax?: number
          unpaid_leave_days?: number
          updated_at?: string
        }
        Update: {
          allowances?: number
          basic_salary?: number
          bonuses?: number
          created_at?: string
          currency?: string
          employee_id?: string
          gross_pay?: number
          id?: string
          net_pay?: number
          other_deductions?: number
          overtime_minutes?: number
          overtime_pay?: number
          period_id?: string
          tax?: number
          unpaid_leave_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_records_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_rules: {
        Row: {
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          is_active: boolean
          jurisdiction: string
          name: string
          notes: string | null
          rate: number
          rule_type: string
        }
        Insert: {
          created_at?: string
          effective_from: string
          effective_to?: string | null
          id?: string
          is_active?: boolean
          jurisdiction?: string
          name: string
          notes?: string | null
          rate: number
          rule_type: string
        }
        Update: {
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean
          jurisdiction?: string
          name?: string
          notes?: string | null
          rate?: number
          rule_type?: string
        }
        Relationships: []
      }
      performance_cycles: {
        Row: {
          created_at: string
          id: string
          is_demo: boolean
          name: string
          period_end: string
          period_start: string
          rating_scale: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_demo?: boolean
          name: string
          period_end: string
          period_start: string
          rating_scale?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_demo?: boolean
          name?: string
          period_end?: string
          period_start?: string
          rating_scale?: number
        }
        Relationships: []
      }
      performance_goals: {
        Row: {
          created_at: string
          current_value: number
          due_date: string | null
          employee_id: string
          id: string
          measure: string | null
          review_id: string | null
          status: Database["public"]["Enums"]["goal_status"]
          target_value: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_value?: number
          due_date?: string | null
          employee_id: string
          id?: string
          measure?: string | null
          review_id?: string | null
          status?: Database["public"]["Enums"]["goal_status"]
          target_value?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_value?: number
          due_date?: string | null
          employee_id?: string
          id?: string
          measure?: string | null
          review_id?: string | null
          status?: Database["public"]["Enums"]["goal_status"]
          target_value?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_goals_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_goals_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "performance_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_reviews: {
        Row: {
          completed_at: string | null
          created_at: string
          cycle_id: string
          due_date: string
          employee_comment: string | null
          employee_id: string
          id: string
          manager_feedback: string | null
          rating: number | null
          reviewer_id: string | null
          status: Database["public"]["Enums"]["review_status"]
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          cycle_id: string
          due_date: string
          employee_comment?: string | null
          employee_id: string
          id?: string
          manager_feedback?: string | null
          rating?: number | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          cycle_id?: string
          due_date?: string
          employee_comment?: string | null
          employee_id?: string
          id?: string
          manager_feedback?: string | null
          rating?: number | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_reviews_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "performance_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      advance_payroll: {
        Args: { _period: string }
        Returns: Database["public"]["Enums"]["payroll_status"]
      }
      apply_leave: {
        Args: {
          _doc?: string
          _end: string
          _half: boolean
          _reason: string
          _start: string
          _type: string
        }
        Returns: {
          created_at: string
          days: number
          document_path: string | null
          employee_id: string
          end_date: string
          half_day: boolean
          id: string
          leave_type_id: string
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_comment: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "leave_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      attendance_check_in: {
        Args: { _lat?: number; _lng?: number }
        Returns: {
          break_minutes: number
          check_in: string
          check_out: string | null
          created_at: string
          employee_id: string
          id: string
          is_late: boolean
          latitude: number | null
          longitude: number | null
          notes: string | null
          overtime_minutes: number
          status: string
          updated_at: string
          work_date: string
          worked_minutes: number
        }
        SetofOptions: {
          from: "*"
          to: "attendance_records"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      attendance_check_out: {
        Args: never
        Returns: {
          break_minutes: number
          check_in: string
          check_out: string | null
          created_at: string
          employee_id: string
          id: string
          is_late: boolean
          latitude: number | null
          longitude: number | null
          notes: string | null
          overtime_minutes: number
          status: string
          updated_at: string
          work_date: string
          worked_minutes: number
        }
        SetofOptions: {
          from: "*"
          to: "attendance_records"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_leave: { Args: { _id: string }; Returns: undefined }
      comment_on_review: {
        Args: { _comment: string; _id: string }
        Returns: undefined
      }
      compute_attendance: {
        Args: { _in: string; _out: string }
        Returns: Record<string, unknown>
      }
      correct_attendance: {
        Args: { _id: string; _in: string; _out: string; _reason: string }
        Returns: undefined
      }
      count_leave_days: {
        Args: { _end: string; _half?: boolean; _start: string }
        Returns: number
      }
      current_employee_id: { Args: never; Returns: string }
      employee_directory: {
        Args: never
        Returns: {
          department_id: string
          designation: string
          employee_number: string
          first_name: string
          id: string
          last_name: string
          photo_url: string
          work_email: string
        }[]
      }
      generate_payroll: { Args: { _period: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hr_dashboard_stats: { Args: never; Returns: Json }
      is_hr: { Args: { _user_id: string }; Returns: boolean }
      log_audit: {
        Args: {
          _action: string
          _details: Json
          _entity: string
          _entity_id: string
        }
        Returns: undefined
      }
      notify_employee: {
        Args: {
          _body: string
          _cat: string
          _emp: string
          _link: string
          _title: string
        }
        Returns: undefined
      }
      review_leave: {
        Args: { _approve: boolean; _comment: string; _id: string }
        Returns: undefined
      }
      run_daily_reminders: { Args: never; Returns: undefined }
      set_payroll_bonus: {
        Args: { _bonus: number; _record: string }
        Returns: undefined
      }
      set_user_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"]; _user: string }
        Returns: undefined
      }
      update_goal_progress: {
        Args: {
          _id: string
          _status: Database["public"]["Enums"]["goal_status"]
          _value: number
        }
        Returns: undefined
      }
      update_my_profile: {
        Args: {
          _address: string
          _ec_name: string
          _ec_phone: string
          _phone: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "hr_manager" | "employee"
      employment_status:
        | "active"
        | "on_leave"
        | "probation"
        | "terminated"
        | "archived"
      employment_type: "full_time" | "part_time" | "contract" | "intern"
      goal_status: "not_started" | "in_progress" | "achieved" | "missed"
      leave_status: "pending" | "approved" | "rejected" | "cancelled"
      payroll_status: "draft" | "approved" | "processed"
      review_status: "scheduled" | "in_progress" | "submitted" | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "hr_manager", "employee"],
      employment_status: [
        "active",
        "on_leave",
        "probation",
        "terminated",
        "archived",
      ],
      employment_type: ["full_time", "part_time", "contract", "intern"],
      goal_status: ["not_started", "in_progress", "achieved", "missed"],
      leave_status: ["pending", "approved", "rejected", "cancelled"],
      payroll_status: ["draft", "approved", "processed"],
      review_status: ["scheduled", "in_progress", "submitted", "completed"],
    },
  },
} as const
