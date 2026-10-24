export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          id: string
          title: string | null
          description: string | null
          link: string | null
          students: string[] | null
          teacheremail: string | null
          workspaceid: string | null
          type: string | null
          requiredfields: string[] | null
          created_at: string | null
        }
        Insert: {
          id?: string
          title?: string | null
          description?: string | null
          link?: string | null
          students?: string[] | null
          teacheremail?: string | null
          workspaceid?: string | null
          type?: string | null
          requiredfields?: string[] | null
          created_at?: string | null
        }
        Update: {
          id?: string
          title?: string | null
          description?: string | null
          link?: string | null
          students?: string[] | null
          teacheremail?: string | null
          workspaceid?: string | null
          type?: string | null
          requiredfields?: string[] | null
          created_at?: string | null
        }
        Relationships: []
      }
      exams: {
        Row: {
          id: string
          title: string
          description: string | null
          drivelink: string | null
          type: string
          duedate: string | null
          students: string[] | null
          teacheremail: string | null
          workspaceid: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          drivelink?: string | null
          type?: string
          duedate?: string | null
          students?: string[] | null
          teacheremail?: string | null
          workspaceid?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          drivelink?: string | null
          type?: string
          duedate?: string | null
          students?: string[] | null
          teacheremail?: string | null
          workspaceid?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_createdBy_fkey"
            columns: ["createdBy"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          link: string | null
          read: boolean
          sender: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          sender?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          sender?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          id: string
          data: Json
          updatedAt: string | null
        }
        Insert: {
          id: string
          data: Json
          updatedAt?: string | null
        }
        Update: {
          id?: string
          data?: Json
          updatedAt?: string | null
        }
        Relationships: []
      }
      submissions: {
        Row: {
          id: string
          assignmentid: string | null
          assignmenttitle: string | null
          studentid: string | null
          studentemail: string | null
          filelink: string | null
          status: string | null
          marks: number | null
          submittedat: string
          gradedat: string | null
          teacheremail: string | null
        }
        Insert: {
          id?: string
          assignmentid?: string | null
          assignmenttitle?: string | null
          studentid?: string | null
          studentemail?: string | null
          filelink?: string | null
          status?: string | null
          marks?: number | null
          submittedat?: string
          gradedat?: string | null
          teacheremail?: string | null
        }
        Update: {
          id?: string
          assignmentid?: string | null
          assignmenttitle?: string | null
          studentid?: string | null
          studentemail?: string | null
          filelink?: string | null
          status?: string | null
          marks?: number | null
          submittedat?: string
          gradedat?: string | null
          teacheremail?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_studentId_fkey"
            columns: ["studentid"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      teacher_attendance: {
        Row: {
          id: string
          dateStr: string
          date: string
          teacherId: string | null
          teacherName: string | null
          department: string | null
          status: string | null
          remarks: string | null
          updatedAt: string | null
        }
        Insert: {
          id: string
          dateStr: string
          date: string
          teacherId?: string | null
          teacherName?: string | null
          department?: string | null
          status?: string | null
          remarks?: string | null
          updatedAt?: string | null
        }
        Update: {
          id?: string
          dateStr?: string
          date?: string
          teacherId?: string | null
          teacherName?: string | null
          department?: string | null
          status?: string | null
          remarks?: string | null
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_attendance_teacherId_fkey"
            columns: ["teacherId"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      syllabi: {
        Row: {
          id: string
          title: string
          link: string | null
          department: string | null
          units: string[] | null
          workspaceid: string | null
          students: string[] | null
          uploaded_by: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          link?: string | null
          department?: string | null
          units?: string[] | null
          workspaceid?: string | null
          students?: string[] | null
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          link?: string | null
          department?: string | null
          units?: string[] | null
          workspaceid?: string | null
          students?: string[] | null
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          department: string | null
          vta_no: string | null
          personal_mobile: string | null
          date_of_joining: string | null
          date_of_birth: string | null
          address: string | null
          current_salary: string | null
          assignedWorkspaces: string[] | null
          activeSessionId: string | null
          activeSessionTimestamp: string | null
          hashed_password: string | null
          portalStatus: "open" | "closed" | null
          profile_picture: string | null
          face_descriptor: Json | null
          has_face: boolean | null
          biometric_cred_id: string | null
          biometric_cred_ids: string[] | null
          custom_fields: Json | null
          face_landmarks: Json | null
          biometric_data_encrypted: string | null
          profile_updated_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          department?: string | null
          vta_no?: string | null
          personal_mobile?: string | null
          date_of_joining?: string | null
          date_of_birth?: string | null
          address?: string | null
          current_salary?: string | null
          assignedWorkspaces?: string[] | null
          activeSessionId?: string | null
          activeSessionTimestamp?: string | null
          hashed_password?: string | null
          portalStatus?: "open" | "closed" | null
          profile_picture: string | null
          face_descriptor?: Json | null
          has_face?: boolean | null
          biometric_cred_id?: string | null
          biometric_cred_ids?: string[] | null
          custom_fields?: Json | null
          face_landmarks?: Json | null
          biometric_data_encrypted?: string | null
          profile_updated_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          department?: string | null
          vta_no?: string | null
          personal_mobile?: string | null
          date_of_joining?: string | null
          date_of_birth?: string | null
          address?: string | null
          current_salary?: string | null
          assignedWorkspaces?: string[] | null
          activeSessionId?: string | null
          activeSessionTimestamp?: string | null
          hashed_password?: string | null
          portalStatus?: "open" | "closed" | null
          profile_picture?: string | null
          face_descriptor?: Json | null
          has_face?: boolean | null
          biometric_cred_id?: string | null
          biometric_cred_ids?: string[] | null
          custom_fields?: Json | null
          face_landmarks?: Json | null
          biometric_data_encrypted?: string | null
          profile_updated_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      workspaces: {
        Row: {
          id: string
          name: string
          category: string
          teachers: string[] | null
          students: string[] | null
          classTeacher: string | null
          mentor: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          category: string
          teachers?: string[] | null
          students?: string[] | null
          classTeacher?: string | null
          mentor?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          category?: string
          teachers?: string[] | null
          students?: string[] | null
          classTeacher?: string | null
          mentor?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      queries: {
        Row: {
          id: string
          query: string
          userEmail: string
          status: string
          reply: string | null
          adminReply: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          query: string
          userEmail: string
          status?: string
          reply?: string | null
          adminReply?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          query?: string
          userEmail?: string
          status?: string
          reply?: string | null
          adminReply?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      system: {
        Row: {
          id: string
          enabled: boolean | null
          updatedAt: string | null
          routine: string | null
          lastBackup: string | null
        }
        Insert: {
          id: string
          enabled?: boolean | null
          updatedAt?: string | null
          routine?: string | null
          lastBackup?: string | null
        }
        Update: {
          id?: string
          enabled?: boolean | null
          updatedAt?: string | null
          routine?: string | null
          lastBackup?: string | null
        }
        Relationships: []
      }
      attendance: {
        Row: {
          id: string
          workspaceId: string
          date: string
          presentStudents: Json
          teacherEmail: string | null
          createdAt: string | null
          updatedAt: string | null
        }
        Insert: {
          id?: string
          workspaceId: string
          date: string
          presentStudents?: Json
          teacherEmail?: string | null
          createdAt?: string | null
          updatedAt?: string | null
        }
        Update: {
          id?: string
          workspaceId?: string
          date?: string
          presentStudents?: Json
          teacherEmail?: string | null
          createdAt?: string | null
          updatedAt?: string | null
        }
        Relationships: []
      }
      attendance_stats: {
        Row: {
          id: string
          totalDays: number | null
          studentStats: Json
          updatedAt: string | null
        }
        Insert: {
          id: string
          totalDays?: number | null
          studentStats?: Json
          updatedAt?: string | null
        }
        Update: {
          id?: string
          totalDays?: number | null
          studentStats?: Json
          updatedAt?: string | null
        }
        Relationships: []
      }
      mark_batches: {
        Row: {
          id: string
          subject: string
          sectiontitle: string
          teacheremail: string
          workspaceid: string | null
          count: number | null
          status: string | null
          created_at: string
        }
        Insert: {
          id?: string
          subject: string
          sectiontitle: string
          teacheremail: string
          workspaceid?: string | null
          count?: number | null
          status?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          subject?: string
          sectiontitle?: string
          teacheremail?: string
          workspaceid?: string | null
          count?: number | null
          status?: string | null
          created_at?: string
        }
        Relationships: []
      }
      marks: {
        Row: {
          id: string
          studentemail: string
          subject: string
          sectiontitle: string
          marks: string | null
          teacheremail: string
          batchid: string | null
          publishedat: string | null
          type: string | null
          deleted: boolean | null
        }
        Insert: {
          id?: string
          studentemail: string
          subject: string
          sectiontitle: string
          marks?: string | null
          teacheremail: string
          batchid?: string | null
          publishedat?: string | null
          type?: string | null
          deleted?: boolean | null
        }
        Update: {
          id?: string
          studentemail?: string
          subject?: string
          sectiontitle?: string
          marks?: string | null
          teacheremail?: string
          batchid?: string | null
          publishedat?: string | null
          type?: string | null
          deleted?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "marks_batchId_fkey"
            columns: ["batchid"]
            referencedRelation: "mark_batches"
            referencedColumns: ["id"]
          }
        ]
      }
      unom_reports: {
        Row: {
          id: string
          title: string
          teacherEmail: string
          workspaceId: string
          subjects: string[] | null
          labSubjects: string[] | null
          link: string | null
          data: Json | null
          status: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          teacherEmail: string
          workspaceId: string
          subjects?: string[] | null
          labSubjects?: string[] | null
          link?: string | null
          data?: Json | null
          status?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          teacherEmail?: string
          workspaceId?: string
          subjects?: string[] | null
          labSubjects?: string[] | null
          link?: string | null
          data?: Json | null
          status?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      confirm_user_by_email: {
        Args: {
          target_email: string
        }
        Returns: void
      }
      admin_create_user_profile: {
        Args: {
          p_user_id: string
          p_email: string
          p_full_name: string
          p_role: string
          p_department?: string
          p_hashed_password?: string
        }
        Returns: void
      }
      create_user_profile_secure: {
        Args: {
          p_user_id: string
          p_email: string
          p_full_name: string
          p_role: string
          p_department?: string
          p_hashed_password?: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "student"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never
