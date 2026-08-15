import React, { useState, useEffect } from 'react';
import { User, UserStatus, RoleDefinition, PermissionKey } from '../../../types/index';
import { useAccountingCoreStore } from "../../../store/modules/useAccountingCoreStore";
import { Plus, Edit2, Shield, Users as UsersIcon, Search, X, Check, Activity, ShieldAlert, Briefcase, AlertTriangle } from 'lucide-react';

const PERMISSION_GROUPS = [
  {
    label: 'Sales & Accounts Receivable',
    items: [
      { key: 'invoice_view', label: 'View Invoices' },
      { key: 'invoice_create', label: 'Create Invoices' },
      { key: 'invoice_edit', label: 'Modify Invoices' },
      { key: 'invoice_void', label: 'Void Invoices' },
      { key: 'customer_view', label: 'Browse Customers' },
      { key: 'customer_manage', label: 'Manage Customers' },
      { key: 'credit_note_manage', label: 'Manage Credit Notes' },
    ]
  },
  {
    label: 'Purchases & Accounts Payable',
    items: [
      { key: 'bill_view', label: 'View Vendor Bills' },
      { key: 'bill_create', label: 'Record Vendor Bills' },
      { key: 'expense_view', label: 'View Direct Expenses' },
      { key: 'expense_create', label: 'Log New Expenses' },
      { key: 'vendor_view', label: 'Browse Vendors' },
      { key: 'vendor_manage', label: 'Manage Vendors' },
    ]
  },
  {
    label: 'Inventory & Operations',
    items: [
      { key: 'product_view', label: 'View Products & Stock' },
      { key: 'product_manage', label: 'Create & Edit Products' },
      { key: 'stock_adjust', label: 'Inventory Adjustments' },
      { key: 'warehouse_manage', label: 'Warehouse Management' },
    ]
  },
  {
    label: 'Accounting & General Ledger',
    items: [
      { key: 'ledger_view', label: 'View General Ledger' },
      { key: 'ledger_post', label: 'Executive Journal Posting' },
      { key: 'journal_create', label: 'Draft Journal Entries' },
      { key: 'chart_of_accounts_manage', label: 'Structure COA' },
      { key: 'report_financial', label: 'Financial Statements & Audits' },
    ]
  },
  {
    label: 'HR & Payroll Management',
    items: [
      { key: 'employee_view', label: 'View Employees' },
      { key: 'employee_manage', label: 'Manage Employee Records' },
      { key: 'payroll_process', label: 'Execute Payroll' },
      { key: 'loan_manage', label: 'Manage Employee Loans' },
    ]
  },
  {
    label: 'System Administration',
    items: [
      { key: 'team_manage', label: 'Security & Access Control' },
      { key: 'settings_manage', label: 'Global Company Settings' },
      { key: 'data_import', label: 'Bulk Data Migration' },
    ]
  }
];

const DEFAULT_ROLES: RoleDefinition[] = [
  { id: 'role-admin', name: 'System Administrator', description: 'Unrestricted full system control', isSystem: true, color: 'bg-rose-600', permissions: [] },
  { id: 'role-finance-manager', name: 'Chief Financial Officer / Finance Manager', description: 'Financial statements, GL posting, period closing & COA control', isSystem: true, color: 'bg-purple-600', permissions: ['invoice_view', 'bill_view', 'ledger_view', 'ledger_post', 'journal_create', 'chart_of_accounts_manage', 'report_financial'] },
  { id: 'role-accountant', name: 'Senior Accountant', description: 'Day-to-day accounting, journals, invoice & bill verification', isSystem: true, color: 'bg-indigo-600', permissions: ['invoice_view', 'bill_view', 'expense_view', 'expense_create', 'ledger_view', 'journal_create', 'report_financial'] },
  { id: 'role-ar-specialist', name: 'Accounts Receivable (A/R) Specialist', description: 'Customer billing, collections, credit notes & A/R ledgers', isSystem: true, color: 'bg-blue-600', permissions: ['invoice_view', 'invoice_create', 'invoice_edit', 'customer_view', 'customer_manage', 'credit_note_manage'] },
  { id: 'role-ap-specialist', name: 'Accounts Payable (A/P) Specialist', description: 'Vendor bills, expense tracking & disbursement management', isSystem: true, color: 'bg-cyan-600', permissions: ['bill_view', 'bill_create', 'expense_view', 'expense_create', 'vendor_view', 'vendor_manage'] },
  { id: 'role-inventory-manager', name: 'Inventory & Stock Controller', description: 'Product catalog, stock adjustments & warehouse transfers', isSystem: true, color: 'bg-amber-600', permissions: ['product_view', 'product_manage', 'stock_adjust', 'warehouse_manage'] },
  { id: 'role-cashier', name: 'POS Cashier / Sales Agent', description: 'Point of sale operations, creating customer invoices', isSystem: true, color: 'bg-emerald-600', permissions: ['invoice_view', 'invoice_create', 'customer_view'] },
  { id: 'role-hr-payroll', name: 'HR & Payroll Administrator', description: 'Employee records, attendance tracking & payroll processing', isSystem: true, color: 'bg-pink-600', permissions: ['employee_view', 'employee_manage', 'payroll_process', 'loan_manage'] },
  { id: 'role-auditor', name: 'Financial Auditor', description: 'Read-only access to all ledgers, financial statements & reports', isSystem: true, color: 'bg-slate-600', permissions: ['invoice_view', 'bill_view', 'expense_view', 'customer_view', 'vendor_view', 'product_view', 'ledger_view', 'report_financial'] },
];

const UserManagement: React.FC = () => {
  const companies = useAccountingCoreStore((state: any) => state.allCompanies || state.companies) || [];
  const currentUser = useAccountingCoreStore((state: any) => state.currentUser);
  const isAdmin = currentUser?.roleId === 'role-admin' || currentUser?.roleId === 'role-superadmin' || currentUser?.email === 'raihansheikh145@gmail.com' || currentUser?.email === 'raihanhansheikh145@gmail.com';

  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>(DEFAULT_ROLES);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const openEdit = (user: User | null) => {
    setSelectedUser(user);
    if (user) {
      setEditForm({
        name: user.name,
        email: user.email,
        username: user.username,
        roleId: user.roleId,
        companyIds: [...(user.companyIds || [])],
      });
    } else {
      setEditForm({
        name: '',
        email: '',
        username: '',
        pin: '',
        roleId: 'role-accountant',
        companyIds: [companies[0]?.id],
      });
    }
    setIsEditingUser(true);
  };

  const handleSaveUser = async () => {
    if (!editForm.name || !editForm.email) {
      alert("Name and Email are required");
      return;
    }
    setIsSaving(true);
    try {
      if (selectedUser) {
        const { apiFetch } = await import('../../../lib/apiFetch');
        const res = await apiFetch(`/api/users/${selectedUser.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: editForm.name,
            email: editForm.email,
            role_id: editForm.roleId,
            company_ids: editForm.companyIds || [],
            password: editForm.pin || undefined
          })
        });
        
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || 'Failed to update user');
        }
      } else {
        if (!editForm.username || !editForm.pin) {
          alert("Username and Password are required for new users");
          setIsSaving(false);
          return;
        }
        const { apiFetch } = await import('../../../lib/apiFetch');
        const res = await apiFetch(`/api/auth/register`, {
          method: 'POST',
          body: JSON.stringify({
            id: crypto.randomUUID(),
            name: editForm.name,
            username: editForm.username,
            email: editForm.email,
            pin: editForm.pin,
            roleId: editForm.roleId,
            companyIds: editForm.companyIds || []
          })
        });
        
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || 'Failed to create user');
        }
        alert("User created successfully. They will need to be approved by an admin or you can approve them via the database.");
      }
      
      await fetchData();
      setIsEditingUser(false);
    } catch (e: any) {
      alert("Failed to save user: " + e.message);
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLockdown = async () => {
    const confirmation = prompt("EMERGENCY LOCKDOWN\n\nThis will instantly log out ALL other users and randomize their passwords. They will not be able to log back in until you provide them with new passwords and reactivate their accounts.\n\nType 'LOCKDOWN' to confirm:");
    if (confirmation !== 'LOCKDOWN') {
      if (confirmation !== null) alert("Lockdown cancelled.");
      return;
    }
    
    try {
      setLoading(true);
      const { apiFetch } = await import('../../../lib/apiFetch');
      const res = await apiFetch('/api/users/lockdown', {
        method: 'POST'
      });
      
      if (res.ok) {
        const result = await res.json();
        alert(result.message || "Lockdown successful.");
        await fetchData(); // Refresh the list to show users as inactive
      } else {
        const err = await res.json();
        alert("Lockdown failed: " + (err.detail || "Unknown error"));
      }
    } catch (e: any) {
      alert("Lockdown failed: " + e.message);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const { apiFetch } = await import('../../../lib/apiFetch');
      const res = await apiFetch('/api/users');
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setUsers(result.data.map((u: any) => ({
            ...u,
            roleId: u.role_id || u.roleId,
            companyIds: typeof u.company_ids === 'string' ? JSON.parse(u.company_ids) : (u.company_ids || u.companyIds || []),
            emailConfirmed: u.email_confirmed || u.emailConfirmed,
          })));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-[#F9FAFB]">
      {/* Enterprise Application Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-indigo-900 rounded-lg flex items-center justify-center text-white shadow-sm">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 leading-tight">Identity & Access Management</h1>
            <p className="text-xs text-slate-500 font-medium">Enterprise Security Profiles</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {isAdmin && (
            <button 
              onClick={handleLockdown} 
              className="px-4 py-2 border border-red-500 bg-red-50 text-red-700 text-sm font-bold rounded hover:bg-red-100 transition-colors flex items-center shadow-sm"
            >
              <AlertTriangle size={16} className="mr-2" />
              Emergency Lockdown
            </button>
          )}
          <button onClick={() => {}} className="px-4 py-2 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded hover:bg-slate-50 transition-colors">
            Export Audit Log
          </button>
          <button 
            onClick={() => openEdit(null)}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 transition-colors shadow-sm flex items-center"
          >
            <Plus size={16} className="mr-2" />
            New User
          </button>
        </div>
      </div>

      {/* Tabs / Sub-navigation */}
      <div className="bg-white border-b border-slate-200 px-8 flex space-x-8">
        <button 
          onClick={() => setActiveTab('users')}
          className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center ${activeTab === 'users' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
        >
          <UsersIcon size={16} className="mr-2" />
          Active Users
        </button>
        <button 
          onClick={() => setActiveTab('roles')}
          className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center ${activeTab === 'roles' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
        >
          <Shield size={16} className="mr-2" />
          Access Roles
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          
          {activeTab === 'users' && !isEditingUser && (
            <div className="bg-white border border-slate-200 rounded shadow-sm flex flex-col h-full overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div className="relative w-72">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search users..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="text-sm text-slate-500 font-medium">
                  {filteredUsers.length} Users Found
                </div>
              </div>
              
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 font-semibold">User</th>
                      <th className="px-6 py-3 font-semibold">Username</th>
                      <th className="px-6 py-3 font-semibold">Security Role</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Loading user directory...</td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No users found.</td>
                      </tr>
                    ) : filteredUsers.map(user => {
                      const role = roles.find(r => r.id === user.roleId) || DEFAULT_ROLES[1];
                      return (
                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => openEdit(user)}>
                          <td className="px-6 py-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded bg-slate-200 flex items-center justify-center text-slate-700 font-semibold text-xs">
                                {user.name ? user.name[0] : '?'}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">{user.name}</p>
                                <p className="text-xs text-slate-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-slate-600">{user.username}</td>
                          <td className="px-6 py-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {role.name}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                              {user.status || 'ACTIVE'}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <button className="text-indigo-600 hover:text-indigo-900 font-medium text-xs uppercase tracking-wider">
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden h-full flex flex-col">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h3 className="text-sm font-semibold text-slate-900">Access Rights Matrix</h3>
                <p className="text-xs text-slate-500">Define global security permissions across the organization.</p>
              </div>
              
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-sm border-collapse min-w-[800px]">
                  <thead className="bg-slate-50 sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-slate-700 border-b border-slate-200 w-1/3">Authorization Object</th>
                      {roles.map(role => (
                        <th key={role.id} className="px-4 py-4 font-semibold text-slate-700 border-b border-l border-slate-200 text-center">
                          {role.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {PERMISSION_GROUPS.map((group, gIdx) => (
                      <React.Fragment key={gIdx}>
                        <tr className="bg-slate-100/50">
                          <td colSpan={roles.length + 1} className="px-6 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider border-y border-slate-200">
                            {group.label}
                          </td>
                        </tr>
                        {group.items.map((item, iIdx) => (
                          <tr key={iIdx} className="hover:bg-slate-50">
                            <td className="px-6 py-3 border-r border-slate-200">
                              <p className="font-medium text-slate-900 text-xs">{item.label}</p>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">{item.key}</p>
                            </td>
                            {roles.map(role => {
                              const hasPerm = role.permissions.includes(item.key as any) || role.id === 'role-admin';
                              return (
                                <td key={role.id} className="px-4 py-3 border-r border-slate-200 text-center align-middle">
                                  <div className="flex justify-center">
                                    <div className={`w-5 h-5 rounded flex items-center justify-center border ${hasPerm ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300 text-transparent'} ${role.isSystem ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-indigo-400'}`}>
                                      <Check size={14} strokeWidth={3} />
                                    </div>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {isEditingUser && (
            <div className="absolute inset-0 bg-[#F9FAFB] z-30 flex flex-col">
              <div className="px-8 py-4 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm">
                <div className="flex items-center space-x-4">
                  <button onClick={() => setIsEditingUser(false)} className="text-slate-400 hover:text-slate-700">
                    <X size={20} />
                  </button>
                  <h2 className="text-lg font-semibold text-slate-900">{selectedUser ? 'Edit User Profile' : 'Create New User'}</h2>
                </div>
                <div className="flex space-x-3">
                  <button onClick={() => setIsEditingUser(false)} className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded hover:bg-slate-50">
                    Discard
                  </button>
                  <button onClick={handleSaveUser} disabled={isSaving} className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 shadow-sm disabled:opacity-50">
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* General Info Card */}
                  <div className="bg-white border border-slate-200 rounded shadow-sm">
                    <div className="p-4 border-b border-slate-200 bg-slate-50">
                      <h3 className="font-semibold text-slate-800 flex items-center text-sm">
                        <Briefcase size={16} className="mr-2 text-slate-500" />
                        General Information
                      </h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                        <input type="text" value={editForm.name || ''} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full p-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Username</label>
                        <input type="text" value={editForm.username || ''} onChange={(e) => setEditForm({...editForm, username: e.target.value})} className="w-full p-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none" readOnly={!!selectedUser} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                        <input type="email" value={editForm.email || ''} onChange={(e) => setEditForm({...editForm, email: e.target.value})} className="w-full p-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none" />
                      </div>
                      {(!selectedUser || isAdmin) && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            {selectedUser ? 'New Password (Optional)' : 'Password'}
                          </label>
                          <input type="password" value={editForm.pin || ''} onChange={(e) => setEditForm({...editForm, pin: e.target.value})} className="w-full p-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none" placeholder={selectedUser ? 'Leave blank to keep unchanged' : 'Enter password (min 6 chars)'} />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Access Role</label>
                        <select value={editForm.roleId || 'role-accountant'} onChange={(e) => setEditForm({...editForm, roleId: e.target.value})} className="w-full p-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none">
                          {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Company Assignment Card */}
                  <div className="bg-white border border-slate-200 rounded shadow-sm">
                    <div className="p-4 border-b border-slate-200 bg-slate-50">
                      <h3 className="font-semibold text-slate-800 flex items-center text-sm">
                        <Activity size={16} className="mr-2 text-slate-500" />
                        Company Access (Assign Companies)
                      </h3>
                    </div>
                    <div className="p-6">
                      <p className="text-xs text-slate-500 mb-4">Select the companies this user is authorized to access.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {companies.map(c => {
                          const isAssigned = editForm.companyIds?.includes(c.id);
                          return (
                            <div key={c.id} onClick={() => {
                              const newIds = isAssigned 
                                ? (editForm.companyIds || []).filter(id => id !== c.id)
                                : [...(editForm.companyIds || []), c.id];
                              setEditForm({...editForm, companyIds: newIds});
                            }} className={`flex items-center p-3 border rounded cursor-pointer transition-colors ${isAssigned ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 hover:border-slate-300'}`}>
                              <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 ${isAssigned ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                                {isAssigned && <Check size={12} strokeWidth={3} />}
                              </div>
                              <span className="text-sm font-medium text-slate-800">{c.name}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;