-- Run this in your Supabase SQL Editor

-- 1. Create custom ENUM types
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'DEPARTMENT_ADMIN');
CREATE TYPE account_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'BLOCKED');
CREATE TYPE student_status AS ENUM ('ACTIVE', 'GRADUATED', 'DROPOUT');
CREATE TYPE notification_type AS ENUM ('success', 'warning', 'error', 'info');

-- 2. Create Colleges Table
CREATE TABLE public.colleges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    address TEXT NOT NULL,
    status account_status DEFAULT 'ACTIVE'::account_status,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Departments Table
CREATE TABLE public.departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    college_id UUID REFERENCES public.colleges(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    admin_id UUID, -- Will reference profiles(id)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(college_id, code)
);

-- 4. Create Profiles Table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role user_role NOT NULL,
    status account_status DEFAULT 'PENDING'::account_status,
    college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    mobile TEXT,
    designation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Update Departments to reference Profiles
ALTER TABLE public.departments 
ADD CONSTRAINT fk_admin FOREIGN KEY (admin_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 5. Create Students Table
CREATE TABLE public.students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    college_id UUID REFERENCES public.colleges(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
    hall_ticket TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    semester INTEGER NOT NULL,
    cgpa NUMERIC(4,2) NOT NULL,
    status student_status DEFAULT 'ACTIVE'::student_status,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create Notifications Table
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Setup Row Level Security (RLS)
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Simple Policies (For demo purposes, allowing authenticated users full access)
-- Note: In production, you'd want to restrict these based on role!
CREATE POLICY "Allow authenticated read access" ON public.colleges FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert access" ON public.colleges FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update access" ON public.colleges FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.departments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert access" ON public.departments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update access" ON public.departments FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update access" ON public.profiles FOR UPDATE USING (auth.role() = 'authenticated');

-- Trigger to create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, status, college_id, department_id, mobile, designation)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    (new.raw_user_meta_data->>'role')::public.user_role,
    'PENDING'::public.account_status,
    NULLIF(new.raw_user_meta_data->>'college_id', '')::UUID,
    NULLIF(new.raw_user_meta_data->>'department_id', '')::UUID,
    NULLIF(new.raw_user_meta_data->>'mobile', ''),
    NULLIF(new.raw_user_meta_data->>'designation', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Policies for students
CREATE POLICY "Allow authenticated read access" ON public.students FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert access" ON public.students FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update access" ON public.students FOR UPDATE USING (auth.role() = 'authenticated');

-- Policies for notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow authenticated insert access" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
