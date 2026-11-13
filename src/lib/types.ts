export type Profile = { id: string; display_name: string; role: 'owner' | 'member' }
export type Category = { id: string; user_id: string; name: string }
export type LearningEntry = {
  id: string
  user_id: string
  category_id: string
  learning_date: string
  title: string
  minutes: number
  notes: string | null
  reference_url: string | null
  created_at: string
}
export type Course = {
  id: string
  user_id: string
  category_id: string
  name: string
  platform: string
  course_url: string
  total_lectures: number | null
  completed_lectures: number
  progress_percent: number
  target_date: string | null
}
