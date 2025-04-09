import { createClient } from "@supabase/supabase-js";

// const supabaseUrl = "https://lwoocnxvyaprawhqevsr.supabase.co";
//   const supabaseKey =
//     "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3b29jbnh2eWFwcmF3aHFldnNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAwNzE5MTIsImV4cCI6MjAzNTY0NzkxMn0.EqBa4rnSLsYQME6LAZC5cNXFvrhu8ceGgJxJ58Kr36k";
//   const supabase = createClient(supabaseUrl, supabaseKey);
export const getSupabaseClient = () => {
  return createClient(
    "https://kupoafdsvhvtcjbgefvo.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1cG9hZmRzdmh2dGNqYmdlZnZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxNzIzMDAsImV4cCI6MjA1OTc0ODMwMH0.uIzwtqmYLpghvrcBMdKO8dzkiWzKfJqGLf-olx2ftuc",
    {}
  );
};
