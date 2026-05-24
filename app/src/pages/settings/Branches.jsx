import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import useAuthStore from '../../store/authStore-multi-branch'
import FirestoreService from '../../firebase/firestore-multi-branch'
import { handleError, showSuccess } from '../../utils/errorHandler'
import {
    Building2, Plus, MapPin, User, Phone, Mail,
    Pencil, Trash2, X, CheckCircle, XCircle, GitBranch
} from 'lucide-react'

export default function Branches() {
    const { businessId, isOwner } = useAuthStore()
    const [branches, setBranches] = useState([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [formData, setFormData] = useState({
        branchName: '', location: '', phone: '', email: '', manager: '', isActive: true
    })

    const fetchBranches = async () => {
        if (!businessId) return
        try {
            setLoading(true)
            const snap = await FirestoreService.getBranches(businessId)
            setBranches(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        } catch (err) {
            handleError(err, 'Fetch Branches', 'Failed to load branches')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { if (businessId) fetchBranches() }, [businessId])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.branchName.trim()) return handleError(null, 'Validation', 'Branch name is required')
        setSubmitting(true)
        try {
            if (editingId) {
                await FirestoreService.updateBranch(businessId, editingId, { ...formData, updatedAt: new Date() })
                showSuccess(`"${formData.branchName}" updated`)
            } else {
                await FirestoreService.addBranch(businessId, { ...formData, createdAt: new Date() })
                showSuccess(`"${formData.branchName}" added`)
            }
            handleCancel()
            await fetchBranches()
        } catch (err) {
            handleError(err, 'Save Branch', 'Failed to save branch')
        } finally {
            setSubmitting(false)
        }
    }

    const handleEdit = (branch) => {
        setFormData({
            branchName: branch.branchName,
            location: branch.location || '',
            phone: branch.phone || '',
            email: branch.email || '',
            manager: branch.manager || '',
            isActive: branch.isActive !== false
        })
        setEditingId(branch.id)
        setShowForm(true)
    }

    const handleDelete = async (branchId, branchName) => {
        if (!confirm(`Delete "${branchName}"? Historical data will be kept.`)) return
        try {
            setLoading(true)
            await FirestoreService.deleteBranch(businessId, branchId)
            showSuccess(`"${branchName}" deleted`)
            await fetchBranches()
        } catch (err) {
            handleError(err, 'Delete Branch', 'Failed to delete branch')
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        setFormData({ branchName: '', location: '', phone: '', email: '', manager: '', isActive: true })
        setEditingId(null)
        setShowForm(false)
    }

    const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))

    if (!isOwner()) {
        return (
            <Layout title="Branches">
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 mt-12">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                        <XCircle size={28} className="text-red-500" />
                    </div>
                    <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 mb-2">Access Restricted</h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm">Only the business owner can manage branches.</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="Branches">
            <div className="mt-12 max-w-5xl mx-auto pb-20">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <GitBranch size={18} className="text-blue-600" />
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Branches</h1>
                        </div>
                        <p className="text-gray-400 text-sm">{branches.length} branch{branches.length !== 1 ? 'es' : ''} registered</p>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition shadow-sm"
                    >
                        <Plus size={16} /> Add Branch
                    </button>
                </div>

                {/* ── Branch Cards ── */}
                {loading && !showForm ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                ) : branches.length === 0 ? (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-16 text-center border border-gray-100 dark:border-gray-800 shadow-sm">
                        <Building2 size={40} className="text-gray-200 dark:text-gray-700 mx-auto mb-4" />
                        <h3 className="text-lg font-black text-gray-800 dark:text-gray-200 mb-1">No branches yet</h3>
                        <p className="text-gray-400 text-sm">Add your first branch to get started.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {branches.map(branch => (
                            <div key={branch.id} className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow group">

                                {/* Card Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${branch.isActive ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                            <Building2 size={18} className={branch.isActive ? 'text-blue-600' : 'text-gray-400'} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-gray-900 dark:text-white text-sm leading-tight">{branch.branchName}</h3>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${branch.isActive ? 'text-green-600' : 'text-red-500'}`}>
                                                {branch.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Details */}
                                <div className="space-y-2 mb-4">
                                    {branch.location && (
                                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                            <MapPin size={13} className="flex-shrink-0" />
                                            <span className="text-xs truncate">{branch.location}</span>
                                        </div>
                                    )}
                                    {branch.manager && (
                                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                            <User size={13} className="flex-shrink-0" />
                                            <span className="text-xs">{branch.manager}</span>
                                        </div>
                                    )}
                                    {branch.phone && (
                                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                            <Phone size={13} className="flex-shrink-0" />
                                            <span className="text-xs">{branch.phone}</span>
                                        </div>
                                    )}
                                    {branch.email && (
                                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                            <Mail size={13} className="flex-shrink-0" />
                                            <span className="text-xs truncate">{branch.email}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                                    <button
                                        onClick={() => handleEdit(branch)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 hover:bg-blue-600 hover:text-white transition"
                                    >
                                        <Pencil size={12} /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(branch.id, branch.branchName)}
                                        className="px-3 py-2 rounded-lg text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-600 hover:text-white transition"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Modal Form ── */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-800">

                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2">
                                <Building2 size={16} className="text-blue-600" />
                                <h3 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-widest">
                                    {editingId ? 'Edit Branch' : 'Add New Branch'}
                                </h3>
                            </div>
                            <button onClick={handleCancel} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {/* Branch Name */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest block mb-1.5">
                                    Branch Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.branchName}
                                    onChange={set('branchName')}
                                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-semibold text-sm transition"
                                    placeholder="e.g. Karachi Main, Thailand Bangkok"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Location */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest block mb-1.5">Location</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={set('location')}
                                        className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm transition"
                                        placeholder="City, Country"
                                    />
                                </div>

                                {/* Manager */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest block mb-1.5">Manager</label>
                                    <input
                                        type="text"
                                        value={formData.manager}
                                        onChange={set('manager')}
                                        className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm transition"
                                        placeholder="Full name"
                                    />
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest block mb-1.5">Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={set('phone')}
                                        className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm transition"
                                        placeholder="+92 300 0000000"
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest block mb-1.5">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={set('email')}
                                        className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm transition"
                                        placeholder="branch@example.com"
                                    />
                                </div>
                            </div>

                            {/* Active Toggle */}
                            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3">
                                <div>
                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Active Branch</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Show in POS and inventory</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={formData.isActive}
                                        onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={handleCancel}
                                    className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting}
                                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition shadow-sm flex items-center justify-center gap-2">
                                    {submitting
                                        ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving...</>
                                        : <><CheckCircle size={14} /> {editingId ? 'Save Changes' : 'Add Branch'}</>
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    )
}
