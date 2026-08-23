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
    PostgrestVersion: "14.15"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      attempt_answers: {
        Row: {
          attempt_id: string
          choice_id: string | null
          id: string
          is_correct: boolean
          question_id: string
        }
        Insert: {
          attempt_id: string
          choice_id?: string | null
          id?: string
          is_correct: boolean
          question_id: string
        }
        Update: {
          attempt_id?: string
          choice_id?: string | null
          id?: string
          is_correct?: boolean
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_answers_choice_id_fkey"
            columns: ["choice_id"]
            isOneToOne: false
            referencedRelation: "choices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      attempts: {
        Row: {
          attempt_number: number
          id: string
          passed: boolean
          percentage: number
          quiz_id: string
          score: number
          student_id: string
          submitted_at: string
          total_items: number
        }
        Insert: {
          attempt_number: number
          id?: string
          passed: boolean
          percentage: number
          quiz_id: string
          score: number
          student_id: string
          submitted_at?: string
          total_items: number
        }
        Update: {
          attempt_number?: number
          id?: string
          passed?: boolean
          percentage?: number
          quiz_id?: string
          score?: number
          student_id?: string
          submitted_at?: string
          total_items?: number
        }
        Relationships: [
          {
            foreignKeyName: "attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_progress"
            referencedColumns: ["student_id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      choices: {
        Row: {
          body: string
          id: string
          label: string
          question_id: string
          sort_order: number
        }
        Insert: {
          body: string
          id?: string
          label: string
          question_id: string
          sort_order?: number
        }
        Update: {
          body?: string
          id?: string
          label?: string
          question_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "choices_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          id: string
          item: string
          note: string | null
          quantity: string | null
          recipe_id: string
          sort_order: number
        }
        Insert: {
          id?: string
          item: string
          note?: string | null
          quantity?: string | null
          recipe_id: string
          sort_order?: number
        }
        Update: {
          id?: string
          item?: string
          note?: string | null
          quantity?: string | null
          recipe_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          must_change_password: boolean
          role: Database["public"]["Enums"]["app_role"]
          section_id: string | null
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          must_change_password?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          section_id?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          must_change_password?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          section_id?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          correct_choice_id: string | null
          created_at: string
          explanation: string | null
          id: string
          points: number
          prompt: string
          quiz_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          correct_choice_id?: string | null
          created_at?: string
          explanation?: string | null
          id?: string
          points?: number
          prompt: string
          quiz_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          correct_choice_id?: string | null
          created_at?: string
          explanation?: string | null
          id?: string
          points?: number
          prompt?: string
          quiz_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_correct_choice_id_fkey"
            columns: ["correct_choice_id"]
            isOneToOne: false
            referencedRelation: "choices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          id: string
          instructions: string | null
          is_published: boolean
          passing_percentage: number
          recipe_id: string
          reveal_answers: boolean
          shuffle_questions: boolean
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructions?: string | null
          is_published?: boolean
          passing_percentage?: number
          recipe_id: string
          reveal_answers?: boolean
          shuffle_questions?: boolean
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          instructions?: string | null
          is_published?: boolean
          passing_percentage?: number
          recipe_id?: string
          reveal_answers?: boolean
          shuffle_questions?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: true
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_techniques: {
        Row: {
          recipe_id: string
          sort_order: number
          technique_id: string
        }
        Insert: {
          recipe_id: string
          sort_order?: number
          technique_id: string
        }
        Update: {
          recipe_id?: string
          sort_order?: number
          technique_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_techniques_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_techniques_technique_id_fkey"
            columns: ["technique_id"]
            isOneToOne: false
            referencedRelation: "techniques"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          category_id: string | null
          chef_tips: string[]
          cook_minutes: number | null
          created_at: string
          created_by: string | null
          description: string
          difficulty: string | null
          id: string
          image_path: string | null
          is_published: boolean
          objectives: string[]
          prep_minutes: number | null
          safety_notes: string[]
          servings: number | null
          slug: string
          sort_order: number
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          category_id?: string | null
          chef_tips?: string[]
          cook_minutes?: number | null
          created_at?: string
          created_by?: string | null
          description?: string
          difficulty?: string | null
          id?: string
          image_path?: string | null
          is_published?: boolean
          objectives?: string[]
          prep_minutes?: number | null
          safety_notes?: string[]
          servings?: number | null
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          category_id?: string | null
          chef_tips?: string[]
          cook_minutes?: number | null
          created_at?: string
          created_by?: string | null
          description?: string
          difficulty?: string | null
          id?: string
          image_path?: string | null
          is_published?: boolean
          objectives?: string[]
          prep_minutes?: number | null
          safety_notes?: string[]
          servings?: number | null
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "student_progress"
            referencedColumns: ["student_id"]
          },
        ]
      }
      sections: {
        Row: {
          created_at: string
          grade_level: number
          id: string
          is_active: boolean
          name: string
          school_year: string
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          grade_level?: number
          id?: string
          is_active?: boolean
          name: string
          school_year: string
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          grade_level?: number
          id?: string
          is_active?: boolean
          name?: string
          school_year?: string
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "student_progress"
            referencedColumns: ["student_id"]
          },
        ]
      }
      steps: {
        Row: {
          id: string
          image_path: string | null
          instruction: string
          recipe_id: string
          step_number: number
        }
        Insert: {
          id?: string
          image_path?: string | null
          instruction: string
          recipe_id: string
          step_number: number
        }
        Update: {
          id?: string
          image_path?: string | null
          instruction?: string
          recipe_id?: string
          step_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "steps_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      techniques: {
        Row: {
          created_at: string
          description: string
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      student_best_attempts: {
        Row: {
          attempt_number: number | null
          passed: boolean | null
          percentage: number | null
          quiz_id: string | null
          score: number | null
          student_id: string | null
          submitted_at: string | null
          total_items: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_progress"
            referencedColumns: ["student_id"]
          },
        ]
      }
      student_progress: {
        Row: {
          average_percentage: number | null
          full_name: string | null
          last_activity_at: string | null
          quizzes_completed: number | null
          quizzes_passed: number | null
          recipes_completed: number | null
          section_id: string | null
          student_id: string | null
          total_quizzes: number | null
          total_recipes: number | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      auth_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      can_view_student: { Args: { p_student_id: string }; Returns: boolean }
      get_quiz_for_student: { Args: { p_recipe_id: string }; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      list_sections_for_registration: {
        Args: never
        Returns: {
          grade_level: number
          id: string
          name: string
        }[]
      }
      submit_quiz_attempt: {
        Args: { p_answers: Json; p_recipe_id: string }
        Returns: Json
      }
      username_available: { Args: { p_username: string }; Returns: boolean }
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

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "teacher", "student"],
    },
  },
} as const
