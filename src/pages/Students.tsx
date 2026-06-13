import { useState, useMemo, useRef } from 'react';
import { useStore, Student } from '../lib/store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X, Search, GraduationCap, Pencil, Trash2, Loader2, AlertTriangle, Download, Camera, Upload, Phone, Mail, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadToCloudinary } from '../lib/cloudinary';
export function downloadImportTemplate() {
  const headers = ['name','hallTicket','email','phone','collegeCode','departmentCode','semester','cgpa'];
  const example = ['Alice Johnson','19STAN001','alice@stanford.edu','9876543210','STAN','CSE','6','9.5'];
  const csv = [headers.join(','), example.join(',')].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = 'stuvault_import_template.csv';
  a.click(); URL.revokeObjectURL(url);
  toast.success('Template downloaded');
}




const addSchema = z.object({
  name: z.string().min(2, "Name is required"),
  hallTicket: z.string().min(2, "Hall ticket is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  collegeId: z.string().min(1, "College is required"),
  departmentId: z.string().min(1, "Department is required"),
  semester: z.coerce.number().min(1).max(8),
  cgpa: z.coerce.number().min(0).max(10),
});

const editSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  semester: z.coerce.number().min(1).max(8),
  cgpa: z.coerce.number().min(0).max(10),
  status: z.enum(['ACTIVE', 'GRADUATED', 'DROPOUT']),
});

type AddFormValues = z.infer<typeof addSchema>;
type EditFormValues = z.infer<typeof editSchema>;

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  GRADUATED: 'bg-blue-50 text-blue-700 border border-blue-100',
  DROPOUT: 'bg-rose-50 text-rose-700 border border-rose-100',
};

export default function Students() {
  const { students, colleges, departments, addStudent, updateStudent, deleteStudent, currentUser } = useStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'GRADUATED' | 'DROPOUT'>('ALL');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [editPhotoUrl, setEditPhotoUrl] = useState<string | undefined>(undefined);
  const [isImporting, setIsImporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState<Record<string, string>[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const defaultAddValues: Partial<AddFormValues> = {};
  if (currentUser?.role === 'COLLEGE_ADMIN') {
    defaultAddValues.collegeId = currentUser.collegeId;
  } else if (currentUser?.role === 'DEPARTMENT_ADMIN') {
    defaultAddValues.collegeId = currentUser.collegeId;
    defaultAddValues.departmentId = currentUser.departmentId;
  }

  const addForm = useForm<AddFormValues>({
    resolver: zodResolver(addSchema) as any,
    defaultValues: defaultAddValues
  });

  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editSchema) as any,
  });

  const selectedCollegeId = addForm.watch('collegeId');

  const visibleStudents = useMemo(() => {
    let filtered = students;
    if (currentUser?.role === 'COLLEGE_ADMIN') {
      filtered = filtered.filter(s => s.collegeId === currentUser.collegeId);
    } else if (currentUser?.role === 'DEPARTMENT_ADMIN') {
      filtered = filtered.filter(s => s.departmentId === currentUser.departmentId);
    }
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(s => s.name.toLowerCase().includes(lower) || s.hallTicket.toLowerCase().includes(lower) || s.email.toLowerCase().includes(lower));
    }
    return filtered;
  }, [students, currentUser, searchTerm, statusFilter]);

  const scopedStudents = useMemo(() => {
    let filtered = students;
    if (currentUser?.role === 'COLLEGE_ADMIN') {
      filtered = filtered.filter(s => s.collegeId === currentUser.collegeId);
    } else if (currentUser?.role === 'DEPARTMENT_ADMIN') {
      filtered = filtered.filter(s => s.departmentId === currentUser.departmentId);
    }
    return filtered;
  }, [students, currentUser]);

  const availableColleges = currentUser?.role === 'SUPER_ADMIN'
    ? colleges
    : colleges.filter(c => c.id === currentUser?.collegeId);

  const availableDepartments = useMemo(() => {
    if (currentUser?.role === 'DEPARTMENT_ADMIN') {
      return departments.filter(d => d.id === currentUser.departmentId);
    }
    if (selectedCollegeId) {
      return departments.filter(d => d.collegeId === selectedCollegeId);
    }
    return [];
  }, [selectedCollegeId, currentUser, departments]);

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setEditPhotoUrl(student.photoUrl);
    editForm.setValue('name', student.name);
    editForm.setValue('email', student.email);
    editForm.setValue('phone', student.phone);
    editForm.setValue('semester', student.semester);
    editForm.setValue('cgpa', student.cgpa);
    editForm.setValue('status', student.status);
  };

  const onAddSubmit = async (data: AddFormValues) => {
      setIsSaving(true);
      try {
      await addStudent({ ...data, status: 'ACTIVE' });
      toast.success('Student added successfully');
      setIsAddModalOpen(false);
      addForm.reset(defaultAddValues);
    } catch (error) {
      toast.error('Failed to add student');
    } finally {
      setIsSaving(false);
    }
  };

  const onEditSubmit = async (data: EditFormValues) => {
    if (!editingStudent) return;
    setIsSaving(true);
    try {
      await updateStudent(editingStudent.id, { ...data, photoUrl: editPhotoUrl });
      toast.success('Student updated successfully');
      setEditingStudent(null);
    } catch (error) {
      toast.error('Failed to update student');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const url = await uploadToCloudinary(file);
      setEditPhotoUrl(url);
      toast.success('Photo uploaded!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!deletingStudent) return;
    setIsDeleting(true);
    try {
      await deleteStudent(deletingStudent.id);
      toast.success('Student deleted successfully');
      setDeletingStudent(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete student');
    } finally {
      setIsDeleting(false);
    }
  };

  const canAdd = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'DEPARTMENT_ADMIN'].includes(currentUser?.role ?? '');
  const canEdit = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'DEPARTMENT_ADMIN'].includes(currentUser?.role ?? '');

  const exportToCSV = () => {
    if (visibleStudents.length === 0) { toast.error('No students to export'); return; }
    const headers = ['Name', 'Hall Ticket', 'Email', 'Phone', 'College', 'Department', 'Semester', 'CGPA', 'Status'];
    const rows = visibleStudents.map(s => {
      const college = colleges.find(c => c.id === s.collegeId);
      const dept = departments.find(d => d.id === s.departmentId);
      return [
        `"${s.name}"`, s.hallTicket, s.email, s.phone,
        `"${college?.name ?? ''}"`, `"${dept?.name ?? ''}"`,
        s.semester, s.cgpa, s.status
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `students_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success(`Exported ${visibleStudents.length} students`);
  };



  const handleCSVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split('\n');
      if (lines.length < 2) { toast.error('CSV file must have a header and at least one data row'); return; }
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1).map((line, idx) => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
        row._idx = idx + 2;
        return row;
      });
      const errors: string[] = [];
      rows.forEach((row, i) => {
        if (!row.name) errors.push(`Row ${i + 2}: name is required`);
        if (!row.hallTicket) errors.push(`Row ${i + 2}: hallTicket is required`);
        if (!row.email || !row.email.includes('@')) errors.push(`Row ${i + 2}: invalid email`);
        if (!row.phone || row.phone.length < 10) errors.push(`Row ${i + 2}: phone must be 10+ digits`);
        if (!row.collegeCode && !row.collegeId) errors.push(`Row ${i + 2}: collegeCode is required`);
        if (!row.departmentCode && !row.departmentId) errors.push(`Row ${i + 2}: departmentCode is required`);
        if (!row.semester || isNaN(Number(row.semester))) errors.push(`Row ${i + 2}: invalid semester`);
        if (!row.cgpa || isNaN(Number(row.cgpa))) errors.push(`Row ${i + 2}: invalid cgpa`);
      });
      setImportPreview(rows);
      setImportErrors(errors);
      setShowImportModal(true);
    };
    reader.readAsText(file);
    if (csvInputRef.current) csvInputRef.current.value = '';
  };

  const handleBulkImport = async () => {
    if (importErrors.length > 0) { toast.error('Fix errors before importing'); return; }
    setIsImporting(true);
    let success = 0, failed = 0;
    for (const row of importPreview) {
      try {
        const college = row.collegeId
          ? colleges.find(c => c.id === row.collegeId)
          : colleges.find(c => c.code.toUpperCase() === row.collegeCode?.toUpperCase());
        const dept = row.departmentId
          ? departments.find(d => d.id === row.departmentId)
          : departments.find(d => d.code.toUpperCase() === row.departmentCode?.toUpperCase() && d.collegeId === college?.id);
        if (!college || !dept) { failed++; continue; }
        await addStudent({
          name: row.name,
          hallTicket: row.hallTicket,
          email: row.email,
          phone: row.phone,
          collegeId: college.id,
          departmentId: dept.id,
          semester: Number(row.semester),
          cgpa: Number(row.cgpa),
          status: 'ACTIVE',
        });
        success++;
      } catch { failed++; }
    }
    setIsImporting(false);
    setShowImportModal(false);
    setImportPreview([]);
    setImportErrors([]);
    if (success > 0) toast.success(`Imported ${success} student(s) successfully`);
    if (failed > 0) toast.error(`${failed} row(s) failed to import`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 dark:from-gray-800 dark:via-gray-900 dark:to-black p-6 space-y-8 font-sans">
      {viewingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setViewingStudent(null)}>
            <div className="glass max-w-lg w-full p-6 relative" onClick={e => e.stopPropagation()}>
              <button className="absolute top-2 right-2 text-slate-400 hover:text-slate-600" onClick={() => setViewingStudent(null)} title="Close">
                <X className="h-5 w-5" />
              </button>
              <div className="flex flex-col items-center gap-4">
                {viewingStudent.photoUrl ? (
                  <img src={viewingStudent.photoUrl} alt="Student" className="h-24 w-24 rounded-xl object-cover border" />
                ) : (
                  <div className="h-24 w-24 bg-slate-200 rounded-xl flex items-center justify-center text-slate-500 text-2xl">
                    {viewingStudent.name.charAt(0)}
                  </div>
                )}
                <h3 className="text-xl font-bold text-slate-800">{viewingStudent.name}</h3>
                <div className="w-full space-y-2 text-sm text-slate-600">
                  <p className="flex items-center"><Mail className="h-4 w-4 mr-2" />{viewingStudent.email}</p>
                  <p className="flex items-center"><Phone className="h-4 w-4 mr-2" />{viewingStudent.phone}</p>
                  <p className="flex items-center"><Hash className="h-4 w-4 mr-2" />{viewingStudent.hallTicket}</p>
                  <p>College: {colleges.find(c => c.id === viewingStudent.collegeId)?.name || ''}</p>
                  <p>Department: {departments.find(d => d.id === viewingStudent.departmentId)?.name || ''}</p>
                  <p>Semester: {viewingStudent.semester}</p>
                  <p>CGPA: {viewingStudent.cgpa}</p>
                  <p>Status: {viewingStudent.status}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CSV Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowImportModal(false)}>
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 relative" onClick={e => e.stopPropagation()}>
              <button className="absolute top-2 right-2 text-slate-400 hover:text-slate-600" onClick={() => setShowImportModal(false)} title="Close">
                <X className="h-5 w-5" />
              </button>
              <h3 className="text-lg font-semibold mb-4">CSV Import Preview</h3>
              {importErrors.length > 0 && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded">
                  <p className="font-semibold text-rose-700">Errors detected ({importErrors.length}):</p>
                  <ul className="list-disc list-inside text-sm text-rose-600">
                    {importErrors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
              <div className="overflow-x-auto max-h-96 mb-4">
                <table className="min-w-full text-sm border" >
                  <thead className="bg-slate-100">
                    <tr>
                      {importPreview[0] && Object.keys(importPreview[0]).filter(k => k !== '_idx').map((h, i) => (
                        <th key={i} className="px-2 py-1 border" >{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((row, idx) => (
                      <tr key={idx} className="border-t">
                        {Object.entries(row).filter(([key]) => key !== '_idx').map(([, v], i) => (
                          <td key={i} className="px-2 py-1 border">{v}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 rounded bg-slate-200 hover:bg-slate-300 text-sm"
                  onClick={() => setShowImportModal(false)}
                >Cancel</button>
                <button
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleBulkImport}
                  disabled={isImporting || importErrors.length > 0}
                >
                  {isImporting ? <Loader2 className="animate-spin h-4 w-4 mr-2 inline" /> : null}Import
                </button>
              </div>
            </div>
          </div>
        )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold font-display text-slate-800 tracking-tight">
            Students
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Browse profile registers, search academic records, and manage student rosters
          </p>
        </div>
        <div className="flex gap-3 flex-wrap sm:flex-nowrap">
          <div className="relative rounded-xl shadow-sm max-w-xs w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="focus:ring-2 focus:ring-blue-500 focus:border-transparent block w-full pl-9 text-sm border-slate-200 bg-white rounded-xl py-2 px-3 border outline-none placeholder-slate-400 transition-all"
              placeholder="Search by name, ticket, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {canAdd && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center px-4 py-2.5 rounded-xl shadow-md text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all cursor-pointer shadow-indigo-500/10 whitespace-nowrap"
            >
              <Plus className="-ml-1 mr-1.5 h-5 w-5" />
              Add Student
            </button>
          )}
          {canAdd && (
            <>
              <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSVFile} />
              <button
                onClick={() => csvInputRef.current?.click()}
                className="inline-flex items-center px-4 py-2.5 border border-slate-200 rounded-xl shadow-sm text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-all cursor-pointer whitespace-nowrap"
                title="Import students from CSV"
              >
                <Upload className="-ml-1 mr-1.5 h-5 w-5 text-slate-500" />
                Import CSV
              </button>
              <button
                onClick={downloadImportTemplate}
                className="inline-flex items-center px-4 py-2.5 border border-slate-200 rounded-xl shadow-sm text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-all cursor-pointer whitespace-nowrap"
                title="Download import template"
              >
                <Download className="-ml-1 mr-1.5 h-5 w-5 text-slate-500" />
                Download Template
              </button>
            </>
          )}
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-4 py-2.5 border border-slate-200 rounded-xl shadow-sm text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-all cursor-pointer whitespace-nowrap"
            title="Export to CSV"
          >
            <Download className="-ml-1 mr-1.5 h-5 w-5 text-slate-500" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['ALL', 'ACTIVE', 'GRADUATED', 'DROPOUT'] as const).map((f) => {
          const count = f === 'ALL' ? scopedStudents.length : scopedStudents.filter(s => s.status === f).length;
          return (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                statusFilter === f
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
              <span className={`px-1.5 py-0.5 rounded-lg text-xs font-bold ${statusFilter === f ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/75">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Hall Ticket</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Semester</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">CGPA</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                {canEdit && <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {visibleStudents.length > 0 ? (
                visibleStudents.map((student) => {
                  const dept = departments.find(d => d.id === student.departmentId);
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-blue-50/30 dark:hover:bg-gray-700/30 transition-colors cursor-pointer rounded-xl"
                      onClick={() => setViewingStudent(student)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0 overflow-hidden">
                            {student.photoUrl ? (
                              <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
                            ) : (
                              student.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2)
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-800">{student.name}</div>
                            <div className="text-xs text-slate-400">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono font-medium">
                        {student.hallTicket}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {dept?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg text-xs">
                          Sem {student.semester}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-bold px-2.5 py-0.5 rounded-lg text-xs border ${
                          student.cgpa >= 9 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          student.cgpa >= 7 ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {student.cgpa.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[student.status]}`}>
                          {student.status}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="px-6 py-4 whitespace-nowrap text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); openEditModal(student); }}
                              className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                              title="Edit student"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeletingStudent(student); }}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                              title="Delete student"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={canEdit ? 7 : 6} className="px-6 py-12 whitespace-nowrap text-sm text-slate-400 text-center">
                    <GraduationCap className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-lg font-medium text-slate-600">No students registered</p>
                    <p className="text-xs mt-1">{searchTerm ? 'No results match your search.' : 'Roster is empty.'}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSaving && setIsAddModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom glass rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-slate-100">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold font-display text-slate-800">Add New Student</h3>
                  <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-500 cursor-pointer">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <form id="add-student-form" onSubmit={addForm.handleSubmit(onAddSubmit)}>
                  <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                    {currentUser?.role !== 'DEPARTMENT_ADMIN' && (
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">College</label>
                        <select {...addForm.register('collegeId')} className="mt-1 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm bg-white" disabled={currentUser?.role !== 'SUPER_ADMIN'}>
                          <option value="">Select College</option>
                          {availableColleges.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        {addForm.formState.errors.collegeId && <p className="mt-1 text-sm text-red-500">{addForm.formState.errors.collegeId.message}</p>}
                      </div>
                    )}
                    {currentUser?.role !== 'DEPARTMENT_ADMIN' && (
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</label>
                        <select {...addForm.register('departmentId')} className="mt-1 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm bg-white" disabled={!selectedCollegeId}>
                          <option value="">Select Department</option>
                          {availableDepartments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                        {addForm.formState.errors.departmentId && <p className="mt-1 text-sm text-red-500">{addForm.formState.errors.departmentId.message}</p>}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</label>
                      <input {...addForm.register('name')} type="text" className="mt-1 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm" placeholder="John Doe" />
                      {addForm.formState.errors.name && <p className="mt-1 text-sm text-red-500">{addForm.formState.errors.name.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Hall Ticket No</label>
                      <input {...addForm.register('hallTicket')} type="text" className="mt-1 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm" placeholder="e.g. 19X41A0501" />
                      {addForm.formState.errors.hallTicket && <p className="mt-1 text-sm text-red-500">{addForm.formState.errors.hallTicket.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</label>
                      <input {...addForm.register('email')} type="email" className="mt-1 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm" placeholder="john.doe@email.com" />
                      {addForm.formState.errors.email && <p className="mt-1 text-sm text-red-500">{addForm.formState.errors.email.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</label>
                      <input {...addForm.register('phone')} type="tel" className="mt-1 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm" placeholder="1234567890" />
                      {addForm.formState.errors.phone && <p className="mt-1 text-sm text-red-500">{addForm.formState.errors.phone.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Semester</label>
                      <input {...addForm.register('semester')} type="number" min="1" max="8" className="mt-1 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm" placeholder="1" />
                      {addForm.formState.errors.semester && <p className="mt-1 text-sm text-red-500">{addForm.formState.errors.semester.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">CGPA</label>
                      <input {...addForm.register('cgpa')} type="number" step="0.01" min="0" max="10" className="mt-1 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm" placeholder="9.5" />
                      {addForm.formState.errors.cgpa && <p className="mt-1 text-sm text-red-500">{addForm.formState.errors.cgpa.message}</p>}
                    </div>
                  </div>
                </form>
              </div>
              <div className="bg-slate-50 px-6 py-4 sm:flex sm:flex-row-reverse border-t border-slate-100">
                <button type="submit" form="add-student-form" disabled={isSaving} className="w-full inline-flex justify-center items-center gap-2 rounded-xl border border-transparent shadow-md px-5 py-2.5 bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 sm:ml-3 sm:w-auto disabled:opacity-70 cursor-pointer shadow-blue-500/10">
                  {isSaving ? <><Loader2 className="animate-spin h-4 w-4" />Saving...</> : 'Add Student'}
                </button>
                <button type="button" onClick={() => setIsAddModalOpen(false)} disabled={isSaving} className="mt-3 w-full inline-flex justify-center rounded-xl border border-slate-200 shadow-sm px-5 py-2.5 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:mt-0 sm:ml-3 sm:w-auto cursor-pointer">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSaving && setEditingStudent(null)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="glass text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-slate-100">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold font-display text-slate-800">Edit Student</h3>
                    <p className="text-sm text-slate-400 mt-0.5">{editingStudent.hallTicket}</p>
                  </div>
                  <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-500 cursor-pointer">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <form id="edit-student-form" onSubmit={editForm.handleSubmit(onEditSubmit)}>
                  {/* Photo upload */}
                  <div className="flex items-center gap-4 mb-5 pb-5 border-b border-slate-100">
                    <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    <div
                      className="h-16 w-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg overflow-hidden relative cursor-pointer group flex-shrink-0"
                      onClick={() => photoInputRef.current?.click()}
                    >
                      {editPhotoUrl ? (
                        <img src={editPhotoUrl} alt="Photo" className="w-full h-full object-cover" />
                      ) : (
                        editingStudent?.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2)
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all rounded-2xl">
                        {isUploadingPhoto ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Camera className="h-5 w-5 text-white" />}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Student Photo</p>
                      <button type="button" onClick={() => photoInputRef.current?.click()} disabled={isUploadingPhoto} className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1 cursor-pointer disabled:opacity-50">
                        {isUploadingPhoto ? 'Uploading...' : editPhotoUrl ? 'Change photo' : 'Upload photo'}
                      </button>
                      {editPhotoUrl && (
                        <button type="button" onClick={() => setEditPhotoUrl(undefined)} className="text-xs text-rose-500 hover:text-rose-600 font-medium mt-1 ml-3 cursor-pointer">Remove</button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</label>
                      <input {...editForm.register('name')} type="text" className="mt-1 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm" />
                      {editForm.formState.errors.name && <p className="mt-1 text-sm text-red-500">{editForm.formState.errors.name.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</label>
                      <input {...editForm.register('email')} type="email" className="mt-1 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm" />
                      {editForm.formState.errors.email && <p className="mt-1 text-sm text-red-500">{editForm.formState.errors.email.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</label>
                      <input {...editForm.register('phone')} type="tel" className="mt-1 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm" />
                      {editForm.formState.errors.phone && <p className="mt-1 text-sm text-red-500">{editForm.formState.errors.phone.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Semester</label>
                      <input {...editForm.register('semester')} type="number" min="1" max="8" className="mt-1 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm" />
                      {editForm.formState.errors.semester && <p className="mt-1 text-sm text-red-500">{editForm.formState.errors.semester.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">CGPA</label>
                      <input {...editForm.register('cgpa')} type="number" step="0.01" min="0" max="10" className="mt-1 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm" />
                      {editForm.formState.errors.cgpa && <p className="mt-1 text-sm text-red-500">{editForm.formState.errors.cgpa.message}</p>}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</label>
                      <select {...editForm.register('status')} className="mt-1 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm bg-white">
                        <option value="ACTIVE">Active</option>
                        <option value="GRADUATED">Graduated</option>
                        <option value="DROPOUT">Dropout</option>
                      </select>
                    </div>
                  </div>
                </form>
              </div>
              <div className="bg-slate-50 px-6 py-4 sm:flex sm:flex-row-reverse border-t border-slate-100">
                <button type="submit" form="edit-student-form" disabled={isSaving} className="w-full inline-flex justify-center items-center gap-2 rounded-xl border border-transparent shadow-md px-5 py-2.5 bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 sm:ml-3 sm:w-auto disabled:opacity-70 cursor-pointer shadow-blue-500/10">
                  {isSaving ? <><Loader2 className="animate-spin h-4 w-4" />Saving...</> : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditingStudent(null)} disabled={isSaving} className="mt-3 w-full inline-flex justify-center rounded-xl border border-slate-200 shadow-sm px-5 py-2.5 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:mt-0 sm:ml-3 sm:w-auto cursor-pointer">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingStudent && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isDeleting && setDeletingStudent(null)}></div>
            <div className="glass rounded-2xl shadow-xl sm:max-w-md w-full p-6 border border-slate-100 z-10">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl">
                  <AlertTriangle className="h-6 w-6 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Delete Student</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Are you sure you want to remove <span className="font-semibold text-slate-700">"{deletingStudent.name}"</span> ({deletingStudent.hallTicket}) from the system? This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex gap-3 justify-end">
                <button onClick={() => setDeletingStudent(null)} disabled={isDeleting} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={isDeleting} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-70 transition-all cursor-pointer shadow-md shadow-rose-500/20">
                  {isDeleting ? <Loader2 className="animate-spin h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                  {isDeleting ? 'Deleting...' : 'Delete Student'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
