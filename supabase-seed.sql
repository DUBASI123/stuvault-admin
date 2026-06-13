-- Run this in your Supabase SQL Editor after running supabase-schema.sql to populate mock data

-- 1. Insert Mock Colleges
INSERT INTO public.colleges (id, name, code, address, status, logo_url) VALUES
('a37e1a3a-1b1a-4d92-b430-686940fb17df', 'Stanford University', 'STAN', '450 Serra Mall, Stanford, CA 94305', 'ACTIVE', 'https://res.cloudinary.com/dtdb4irno/image/upload/v1700000000/stanford_logo.jpg'),
('b58f2b4b-2c2b-4e93-c541-797051fc28e0', 'Massachusetts Institute of Technology', 'MIT', '77 Massachusetts Ave, Cambridge, MA 02139', 'ACTIVE', 'https://res.cloudinary.com/dtdb4irno/image/upload/v1700000000/mit_logo.jpg')
ON CONFLICT (code) DO NOTHING;

-- 2. Insert Mock Departments
INSERT INTO public.departments (id, college_id, name, code, admin_id) VALUES
('c69a3c6c-3d3c-4f94-d652-898162fd39f1', 'a37e1a3a-1b1a-4d92-b430-686940fb17df', 'Computer Science & Engineering', 'CSE', NULL),
('d70b4d7d-4e4d-5f95-e763-909273fe40f2', 'a37e1a3a-1b1a-4d92-b430-686940fb17df', 'Electrical Engineering', 'EE', NULL),
('e81c5e8e-5f5e-6f96-f874-910384ff51f3', 'b58f2b4b-2c2b-4e93-c541-797051fc28e0', 'Physics', 'PHYS', NULL),
('f92d6f9f-6f6f-7f97-0985-021495ff62f4', 'b58f2b4b-2c2b-4e93-c541-797051fc28e0', 'Mechanical Engineering', 'MECH', NULL)
ON CONFLICT (college_id, code) DO NOTHING;

-- 3. Insert Mock Students
INSERT INTO public.students (college_id, department_id, hall_ticket, name, email, phone, semester, cgpa, status) VALUES
('a37e1a3a-1b1a-4d92-b430-686940fb17df', 'c69a3c6c-3d3c-4f94-d652-898162fd39f1', '19STAN001', 'Alice Johnson', 'alice.j@stanford.edu', '1234567890', 6, 9.82, 'ACTIVE'),
('a37e1a3a-1b1a-4d92-b430-686940fb17df', 'c69a3c6c-3d3c-4f94-d652-898162fd39f1', '19STAN002', 'Bob Smith', 'bob.s@stanford.edu', '2345678901', 6, 8.45, 'ACTIVE'),
('a37e1a3a-1b1a-4d92-b430-686940fb17df', 'd70b4d7d-4e4d-5f95-e763-909273fe40f2', '19STAN015', 'Charlie Brown', 'charlie.b@stanford.edu', '3456789012', 4, 7.89, 'ACTIVE'),
('b58f2b4b-2c2b-4e93-c541-797051fc28e0', 'e81c5e8e-5f5e-6f96-f874-910384ff51f3', '19MIT051', 'David Miller', 'david.m@mit.edu', '4567890123', 8, 9.50, 'GRADUATED'),
('b58f2b4b-2c2b-4e93-c541-797051fc28e0', 'f92d6f9f-6f6f-7f97-0985-021495ff62f4', '19MIT102', 'Eva Watson', 'eva.w@mit.edu', '5678901234', 6, 6.75, 'DROPOUT')
ON CONFLICT (hall_ticket) DO NOTHING;
