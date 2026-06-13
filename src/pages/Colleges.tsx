import { useState, useMemo } from 'react';
import { useStore, College } from '../lib/store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X, Upload, Loader2, Building2, MapPin, Hash, Pencil, Trash2, AlertTriangle, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadToCloudinary } from '../lib/cloudinary';

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  code: z.string().min(2, "Code is required"),
  address: z.string().min(5, "Address is required"),
});

type FormValues = z.infer<typeof schema>;

type ModalMode = 'add' | 'edit';

export default function Colleges() {
  const { colleges, addCollege, updateCollege, deleteCollege } = useStore();
  const [modalMode, setModalMode] = useState<ModalMode>('add');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingCollege, setEditingCollege] = useState<College | null>(null);
  const [deletingCollege, setDeletingCollege] = useState<College | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const visibleColleges = useMemo(() => {
    if (!searchTerm) return colleges;
    const lower = searchTerm.toLowerCase();
    return colleges.filter(c =>
      c.name.toLowerCase().includes(lower) ||
      c.code.toLowerCase().includes(lower) ||
      c.address.toLowerCase().includes(lower)
    );
  }, [colleges, searchTerm]);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  const openAddModal = () => {
    setModalMode('add');
    setEditingCollege(null);
    setSelectedFile(null);
    reset({ name: '', code: '', address: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (college: College) => {
    setModalMode('edit');
    setEditingCollege(college);
    setSelectedFile(null);
    setValue('name', college.name);
    setValue('code', college.code);
    setValue('address', college.address);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isUploading) return;
    setIsModalOpen(false);
    setEditingCollege(null);
    setSelectedFile(null);
    reset();
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setIsUploading(true);
      let logoUrl = editingCollege?.logoUrl || '';

      if (selectedFile) {
        logoUrl = await uploadToCloudinary(selectedFile);
      }

      if (modalMode === 'add') {
        await addCollege({ ...data, status: 'ACTIVE', logoUrl: logoUrl || undefined });
        toast.success('College added successfully');
      } else if (editingCollege) {
        await updateCollege(editingCollege.id, { ...data, logoUrl: logoUrl || undefined });
        toast.success('College updated successfully');
      }

      closeModal();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${modalMode === 'add' ? 'add' : 'update'} college`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCollege) return;
    setIsDeleting(true);
    try {
      await deleteCollege(deletingCollege.id);
      toast.success('College deleted successfully');
      setDeletingCollege(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete college');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold font-display text-slate-800 tracking-tight">
            Colleges
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage registered colleges and view database summary records
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
              placeholder="Search colleges..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center px-4 py-2.5 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all cursor-pointer shadow-blue-500/10 whitespace-nowrap"
          >
            <Plus className="-ml-1 mr-1.5 h-5 w-5" />
            Add College
          </button>
        </div>
      </div>

      {visibleColleges.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleColleges.map((college) => (
            <div key={college.id} className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {college.logoUrl ? (
                      <img src={college.logoUrl} alt={`${college.name} logo`} className="h-12 w-12 rounded-xl object-cover border border-slate-100 shadow-sm" />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {college.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-slate-800 leading-snug">{college.name}</h3>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400 mt-1">
                        <Hash className="h-3 w-3" />
                        Code: {college.code}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await updateCollege(college.id, { status: college.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' });
                        toast.success(`College ${college.status === 'ACTIVE' ? 'deactivated' : 'activated'}`);
                      } catch { toast.error('Failed to update status'); }
                    }}
                    title={college.status === 'ACTIVE' ? 'Click to deactivate' : 'Click to activate'}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition-all border hover:ring-2 hover:ring-offset-1 ${
                      college.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:ring-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-100 hover:ring-rose-200'
                    }`}
                  >
                    {college.status === 'ACTIVE'
                      ? <ToggleRight className="h-3.5 w-3.5" />
                      : <ToggleLeft className="h-3.5 w-3.5" />}
                    {college.status}
                  </button>
                </div>

                <div className="mt-6 flex items-start gap-1.5 text-sm text-slate-500 leading-relaxed">
                  <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span>{college.address}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => openEditModal(college)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 transition-all cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => setDeletingCollege(college)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 transition-all cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 shadow-sm">
          <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-lg font-medium text-slate-600">{searchTerm ? 'No results found' : 'No colleges found'}</p>
          <p className="text-sm mt-1">{searchTerm ? 'Try adjusting your search.' : 'Click "Add College" above to create your first directory record.'}</p>
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
                    {modalMode === 'add' ? 'Add New College' : `Edit: ${editingCollege?.name}`}
                  </h3>
                  <button onClick={closeModal} disabled={isUploading} className="text-slate-400 hover:text-slate-500 cursor-pointer">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <form id="college-form" onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">College Logo</label>
                      <div className="mt-2 flex items-center gap-3">
                        {(editingCollege?.logoUrl || selectedFile) && (
                          <img
                            src={selectedFile ? URL.createObjectURL(selectedFile) : editingCollege?.logoUrl}
                            alt="Preview"
                            className="h-10 w-10 rounded-xl object-cover border border-slate-200"
                          />
                        )}
                        <label className="cursor-pointer bg-white py-2.5 px-4 border border-slate-200 rounded-xl shadow-sm text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none transition-all flex items-center gap-2">
                          <Upload className="h-4 w-4 text-slate-500" />
                          <span>{selectedFile ? selectedFile.name : 'Upload Logo'}</span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            disabled={isUploading}
                          />
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">College Name</label>
                      <input {...register('name')} type="text" className="mt-1 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm" placeholder="e.g. Stanford University" />
                      {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">College Code</label>
                      <input {...register('code')} type="text" className="mt-1 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm" placeholder="e.g. STAN" />
                      {errors.code && <p className="mt-1 text-sm text-red-500">{errors.code.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Address</label>
                      <textarea {...register('address')} rows={3} className="mt-1 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm" placeholder="e.g. 450 Serra Mall, Stanford, CA" />
                      {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address.message}</p>}
                    </div>
                  </div>
                </form>
              </div>
              <div className="bg-slate-50 px-6 py-4 sm:flex sm:flex-row-reverse border-t border-slate-100">
                <button
                  type="submit"
                  form="college-form"
                  disabled={isUploading}
                  className="w-full inline-flex justify-center items-center rounded-xl border border-transparent shadow-md px-5 py-2.5 bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer shadow-blue-500/10"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Saving...
                    </>
                  ) : modalMode === 'add' ? 'Add College' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isUploading}
                  className="mt-3 w-full inline-flex justify-center rounded-xl border border-slate-200 shadow-sm px-5 py-2.5 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCollege && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isDeleting && setDeletingCollege(null)}></div>
            <div className="relative bg-white rounded-2xl text-left shadow-xl sm:max-w-md w-full p-6 border border-slate-100 z-10">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl">
                  <AlertTriangle className="h-6 w-6 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Delete College</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Are you sure you want to delete <span className="font-semibold text-slate-700">"{deletingCollege.name}"</span>? This will also remove all associated departments and students. This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={() => setDeletingCollege(null)}
                  disabled={isDeleting}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md shadow-rose-500/20"
                >
                  {isDeleting ? <Loader2 className="animate-spin h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                  {isDeleting ? 'Deleting...' : 'Delete College'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
