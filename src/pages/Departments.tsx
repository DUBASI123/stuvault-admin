import { useState, useMemo } from 'react';
import { useStore, Department } from '../lib/store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X, Library, Hash, Building, Pencil, Trash2, Loader2, AlertTriangle, Search, UserCog, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  code: z.string().min(2, "Code is required"),
  collegeId: z.string().min(1, "College is required"),
  adminId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
type ModalMode = 'add' | 'edit';

export default function Departments() {
  const { departments, colleges, users, students, addDepartment, updateDepartment, deleteDepartment, currentUser } = useStore();
  const [modalMode, setModalMode] = useState<ModalMode>('add');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [collegeFilter, setCollegeFilter] = useState<string>('ALL');

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      collegeId: currentUser?.role === 'COLLEGE_ADMIN' ? currentUser.collegeId : undefined
    }
  });

  const selectedCollegeId = watch('collegeId');

  const availableColleges = currentUser?.role === 'COLLEGE_ADMIN'
    ? colleges.filter(c => c.id === currentUser.collegeId)
    : colleges;

  // Department Admins available to be assigned (approved, same college)
  const availableAdmins = useMemo(() => {
    return users.filter(u =>
      u.role === 'DEPARTMENT_ADMIN' &&
      (u.status === 'APPROVED' || u.status === 'ACTIVE') &&
      (selectedCollegeId ? u.collegeId === selectedCollegeId : true)
    );
  }, [users, selectedCollegeId]);

  const visibleDepartments = useMemo(() => {
    let depts = currentUser?.role === 'COLLEGE_ADMIN'
      ? departments.filter(d => d.collegeId === currentUser.collegeId)
      : departments;
    if (collegeFilter !== 'ALL') {
      depts = depts.filter(d => d.collegeId === collegeFilter);
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      depts = depts.filter(d =>
        d.name.toLowerCase().includes(lower) ||
        d.code.toLowerCase().includes(lower) ||
        colleges.find(c => c.id === d.collegeId)?.name.toLowerCase().includes(lower)
      );
    }
    return depts;
  }, [departments, currentUser, colleges, searchTerm, collegeFilter]);

  const openAddModal = () => {
    setModalMode('add');
    setEditingDept(null);
    reset({ name: '', code: '', collegeId: currentUser?.role === 'COLLEGE_ADMIN' ? currentUser.collegeId : '', adminId: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (dept: Department) => {
    setModalMode('edit');
    setEditingDept(dept);
    setValue('name', dept.name);
    setValue('code', dept.code);
    setValue('collegeId', dept.collegeId);
    setValue('adminId', dept.adminId || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingDept(null);
    reset();
  };

  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    try {
      const payload = { ...data, adminId: data.adminId || undefined };
      if (modalMode === 'add') {
        await addDepartment(payload);
        toast.success('Department added successfully');
      } else if (editingDept) {
        await updateDepartment(editingDept.id, payload);
        toast.success('Department updated successfully');
      }
      closeModal();
    } catch (error) {
      toast.error(`Failed to ${modalMode === 'add' ? 'add' : 'update'} department`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingDept) return;
    setIsDeleting(true);
    try {
      await deleteDepartment(deletingDept.id);
      toast.success('Department deleted successfully');
      setDeletingDept(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete department');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold font-display text-slate-800 tracking-tight">
            Departments
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Configure academic departments and assign department administrators
          </p>
        </div>
        <div className="flex gap-3 flex-wrap sm:flex-nowrap">
          {/* Search */}
          <div className="relative rounded-xl shadow-sm max-w-xs w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="focus:ring-2 focus:ring-blue-500 focus:border-transparent block w-full pl-9 text-sm border-slate-200 bg-white rounded-xl py-2 px-3 border outline-none placeholder-slate-400 transition-all"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center px-4 py-2.5 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all cursor-pointer shadow-blue-500/10 whitespace-nowrap"
          >
            <Plus className="-ml-1 mr-1.5 h-5 w-5" />
            Add Department
          </button>
        </div>
      </div>

      {/* College filter tabs for Super Admin */}
      {currentUser?.role === 'SUPER_ADMIN' && colleges.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCollegeFilter('ALL')}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              collegeFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Colleges
            <span className={`px-1.5 py-0.5 rounded-lg text-xs font-bold ${collegeFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {departments.length}
            </span>
          </button>
          {colleges.map(c => (
            <button
              key={c.id}
              onClick={() => setCollegeFilter(c.id)}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                collegeFilter === c.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {c.code}
              <span className={`px-1.5 py-0.5 rounded-lg text-xs font-bold ${collegeFilter === c.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {departments.filter(d => d.collegeId === c.id).length}
              </span>
            </button>
          ))}
        </div>
      )}

      {visibleDepartments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleDepartments.map((dept) => {
            const college = colleges.find(c => c.id === dept.collegeId);
            const admin = users.find(u => u.id === dept.adminId);
            const studentCount = students.filter(s => s.departmentId === dept.id).length;
            return (
              <div key={dept.id} className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-500">
                        <Library className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 leading-snug">{dept.name}</h3>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 mt-1">
                          <Hash className="h-3 w-3" />
                          Code: {dept.code}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-xl flex-shrink-0">
                      <GraduationCap className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-xs font-bold text-blue-700">{studentCount}</span>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Building className="h-4 w-4 text-slate-400" />
                      <span className="font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {college?.name || 'Unknown College'}
                      </span>
                    </div>
                    {admin ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <UserCog className="h-4 w-4 text-indigo-400" />
                        <span className="font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {admin.name}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-amber-500">
                        <UserCog className="h-4 w-4" />
                        <span className="italic">No admin assigned</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => openEditModal(dept)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 transition-all cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => setDeletingDept(dept)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 transition-all cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 shadow-sm">
          <Library className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-lg font-medium text-slate-600">No departments found</p>
          <p className="text-sm mt-1">{searchTerm ? 'Try adjusting your search.' : 'Click "Add Department" to configure academic divisions.'}</p>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={closeModal}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-slate-100">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold font-display text-slate-800">
                    {modalMode === 'add' ? 'Add New Department' : `Edit: ${editingDept?.name}`}
                  </h3>
                  <button onClick={closeModal} className="text-slate-400 hover:text-slate-500 cursor-pointer">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <form id="dept-form" onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-5">
                    {currentUser?.role === 'SUPER_ADMIN' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">College</label>
                        <select {...register('collegeId')} className="mt-1 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm bg-white">
                          <option value="">Select College</option>
                          {availableColleges.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        {errors.collegeId && <p className="mt-1 text-sm text-red-600">{errors.collegeId.message}</p>}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Department Name</label>
                      <input {...register('name')} type="text" className="mt-1 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm" placeholder="e.g. Computer Science & Engineering" />
                      {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Department Code</label>
                      <input {...register('code')} type="text" className="mt-1 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm" placeholder="e.g. CSE" />
                      {errors.code && <p className="mt-1 text-sm text-red-500">{errors.code.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Assign Department Admin <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <select {...register('adminId')} className="mt-1 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm bg-white">
                        <option value="">-- No admin assigned --</option>
                        {availableAdmins.map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                        ))}
                      </select>
                      {availableAdmins.length === 0 && (
                        <p className="mt-1 text-xs text-amber-600">No approved Department Admins available{selectedCollegeId ? ' for this college' : ''}.</p>
                      )}
                    </div>
                  </div>
                </form>
              </div>
              <div className="bg-slate-50 px-6 py-4 sm:flex sm:flex-row-reverse border-t border-slate-100">
                <button
                  type="submit"
                  form="dept-form"
                  disabled={isSaving}
                  className="w-full inline-flex justify-center items-center gap-2 rounded-xl border border-transparent shadow-md px-5 py-2.5 bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto disabled:opacity-70 cursor-pointer shadow-blue-500/10"
                >
                  {isSaving ? <><Loader2 className="animate-spin h-4 w-4" />Saving...</> : modalMode === 'add' ? 'Add Department' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="mt-3 w-full inline-flex justify-center rounded-xl border border-slate-200 shadow-sm px-5 py-2.5 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:mt-0 sm:ml-3 sm:w-auto cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingDept && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isDeleting && setDeletingDept(null)}></div>
            <div className="relative bg-white rounded-2xl shadow-xl sm:max-w-md w-full p-6 border border-slate-100 z-10">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl">
                  <AlertTriangle className="h-6 w-6 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Delete Department</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Are you sure you want to delete <span className="font-semibold text-slate-700">"{deletingDept.name}"</span>? All associated students will be removed too. This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex gap-3 justify-end">
                <button onClick={() => setDeletingDept(null)} disabled={isDeleting} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={isDeleting} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-70 transition-all cursor-pointer shadow-md shadow-rose-500/20">
                  {isDeleting ? <Loader2 className="animate-spin h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                  {isDeleting ? 'Deleting...' : 'Delete Department'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
