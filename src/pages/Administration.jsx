import React, { useEffect, useState } from 'react';
import { ShieldCheck, Users, KeyRound, History, Plus, Save } from 'lucide-react';
import * as rbacApi from '../api/rbac';
import { useAuth } from '../context/AuthContext';

const card = 'glass-card rounded-2xl border border-slate-800 p-5';
const input = 'w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100';

const Administration = () => {
  const { hasPermission } = useAuth();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [audit, setAudit] = useState([]);
  const [error, setError] = useState('');
  const [userForm, setUserForm] = useState({ username: '', password: '', fullName: '', role: 'front_office', roleId: '' });
  const [roleForm, setRoleForm] = useState({ name: '', description: '', permissionIds: [] });

  const load = async () => {
    try {
      const [u, r, p, a] = await Promise.all([
        hasPermission('users.view') ? rbacApi.getUsers() : Promise.resolve({ data: [] }),
        hasPermission('roles.view') ? rbacApi.getRoles() : Promise.resolve({ data: [] }),
        hasPermission('permissions.view') ? rbacApi.getPermissions() : Promise.resolve({ data: [] }),
        hasPermission('audit.view') ? rbacApi.getAuditLogs({ limit: 50 }) : Promise.resolve({ data: { items: [] } }),
      ]);
      setUsers(u.data); setRoles(r.data); setPermissions(p.data); setAudit(a.data.items || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load administration data');
    }
  };

  useEffect(() => { load(); }, []);

  const submitUser = async (event) => {
    event.preventDefault(); setError('');
    try {
      await rbacApi.createUser(userForm);
      setUserForm({ username: '', password: '', fullName: '', role: 'front_office', roleId: '' });
      await load();
    } catch (err) { setError(err.response?.data?.error || 'Unable to create user'); }
  };

  const submitRole = async (event) => {
    event.preventDefault(); setError('');
    try {
      await rbacApi.createRole({ ...roleForm, permissionIds: roleForm.permissionIds.map(Number) });
      setRoleForm({ name: '', description: '', permissionIds: [] });
      await load();
    } catch (err) { setError(err.response?.data?.error || 'Unable to create role'); }
  };

  const toggleUser = async (user) => {
    try { await rbacApi.updateUser(user.id, { isActive: !user.isActive }); await load(); }
    catch (err) { setError(err.response?.data?.error || 'Unable to update user'); }
  };

  const tabs = [
    ['users', 'Users', Users, 'users.view'],
    ['roles', 'Roles & permissions', KeyRound, 'roles.view'],
    ['audit', 'Audit log', History, 'audit.view'],
  ].filter(([, , , permission]) => hasPermission(permission));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3"><ShieldCheck className="text-amber-400" /><h1 className="text-3xl font-bold">Administration</h1></div>
        <p className="mt-1 text-sm text-slate-400">Manage accounts, roles, permissions, and security history.</p>
      </div>
      {error && <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</div>}
      <div className="flex flex-wrap gap-2">
        {tabs.map(([id, label, Icon]) => <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${tab === id ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}><Icon size={16} />{label}</button>)}
      </div>

      {tab === 'users' && <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className={card}><h2 className="mb-4 text-lg font-semibold">User accounts</h2><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-slate-700 text-slate-400"><th className="p-2">User</th><th className="p-2">Role</th><th className="p-2">Status</th><th className="p-2" /></tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-b border-slate-800"><td className="p-2"><div>{user.fullName || user.username}</div><small className="text-slate-500">{user.username}</small></td><td className="p-2">{user.rbacRole?.name || user.role}</td><td className="p-2">{user.isActive ? <span className="text-emerald-400">Active</span> : <span className="text-rose-400">Inactive</span>}</td><td className="p-2 text-right"><button onClick={() => toggleUser(user)} className="text-xs text-amber-400 hover:underline">{user.isActive ? 'Deactivate' : 'Activate'}</button></td></tr>)}</tbody></table></div></section>
        {hasPermission('users.create') && <form onSubmit={submitUser} className={card}><h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Plus size={18} />New user</h2><div className="space-y-3"><input className={input} placeholder="Username" value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} required /><input className={input} placeholder="Full name" value={userForm.fullName} onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })} /><input className={input} type="password" minLength="8" placeholder="Temporary password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required /><select className={input} value={userForm.roleId || roles.find((role) => role.name === userForm.role)?.id || ''} onChange={(e) => { const selected = roles.find((role) => String(role.id) === e.target.value); setUserForm({ ...userForm, role: ['admin', 'front_office', 'cashier'].includes(selected?.name) ? selected.name : 'front_office', roleId: e.target.value }); }}>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select><button className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-slate-950"><Save size={16} />Create user</button></div></form>}
      </div>}

      {tab === 'roles' && <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className={card}><h2 className="mb-4 text-lg font-semibold">Roles</h2>{roles.map((role) => <div key={role.id} className="mb-3 rounded-lg border border-slate-700 p-3"><div className="flex justify-between"><strong>{role.name}</strong>{role.isSystem && <span className="text-xs text-slate-500">System</span>}</div><p className="text-xs text-slate-400">{role.description}</p><div className="mt-2 flex flex-wrap gap-1">{role.permissions.map((permission) => <span key={permission.id} className="rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-300">{permission.key}</span>)}</div></div>)}</section>
        {hasPermission('roles.create') && <form onSubmit={submitRole} className={card}><h2 className="mb-4 text-lg font-semibold">New role</h2><div className="space-y-3"><input className={input} placeholder="Role name" value={roleForm.name} onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })} required /><input className={input} placeholder="Description" value={roleForm.description} onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })} /><div className="max-h-64 space-y-1 overflow-y-auto">{permissions.map((permission) => <label key={permission.id} className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={roleForm.permissionIds.includes(permission.id)} onChange={(e) => setRoleForm({ ...roleForm, permissionIds: e.target.checked ? [...roleForm.permissionIds, permission.id] : roleForm.permissionIds.filter((id) => id !== permission.id) })} />{permission.key}</label>)}</div><button className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-slate-950"><Save size={16} />Create role</button></div></form>}
      </div>}

      {tab === 'audit' && <section className={card}><h2 className="mb-4 text-lg font-semibold">Recent security activity</h2><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-slate-700 text-slate-400"><th className="p-2">Time</th><th className="p-2">User</th><th className="p-2">Action</th><th className="p-2">Description</th></tr></thead><tbody>{audit.map((entry) => <tr key={entry.id} className="border-b border-slate-800"><td className="p-2 whitespace-nowrap">{new Date(entry.createdAt).toLocaleString()}</td><td className="p-2">{entry.user?.fullName || entry.user?.username}</td><td className="p-2">{entry.action}</td><td className="p-2">{entry.description}</td></tr>)}</tbody></table></div></section>}
    </div>
  );
};

export default Administration;
