/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useMemo } from "react";
import { Plus, Search, Edit, Trash2, Shield, Eye, EyeOff } from "lucide-react";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import { AdminUser, AdminRole } from "../../types";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

const roleColors: Record<AdminRole, string> = {
  super_admin: "bg-primary/10 text-primary",
  editor: "bg-accent/20 text-foreground",
  support: "bg-muted text-muted-foreground",
};

const AdminUsersPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    displayName: "",
    role: "editor" as AdminRole,
    password: "",
    confirmPassword: "",
  });

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Check if user has super_admin role
  const isSuperAdmin = hasPermission(["super_admin"]);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setIsLoading(true);
      const q = query(collection(db, "admins"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const adminsData = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          uid: docSnap.id,
          email: data.email || "",
          displayName: data.displayName || "N/A",
          role: data.role || ("support" as AdminRole),
          createdAt: data.createdAt ? data.createdAt.toDate() : null,
          lastLogin: data.lastLogin ? data.lastLogin.toDate() : null,
        } as AdminUser;
      });
      setAdmins(adminsData);
    } catch (error) {
      console.error("Error fetching admins:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (admin?: AdminUser) => {
    setFormError(null);
    setSubmitLoading(false);
    setPasswordVisible(false);
    setConfirmPasswordVisible(false);

    if (admin) {
      // Edit existing admin: keep existing data, no password fields used
      setEditingAdmin(admin);
      setFormData({
        email: admin.email || "",
        displayName: admin.displayName || "",
        role: admin.role || "editor",
        password: "",
        confirmPassword: "",
      });
    } else {
      // Create new admin
      setEditingAdmin(null);
      setFormData({
        email: "",
        displayName: "",
        role: "editor",
        password: "",
        confirmPassword: "",
      });
    }
    setShowModal(true);
  };

  const buildPermissionsForRole = (role: AdminRole): string[] => {
    if (role === "super_admin") {
      // Full access: match your example
      return [
        "blogs",
        "categories",
        "coupons",
        "orders",
        "payments",
        "products",
        "users",
      ];
    }
    if (role === "editor") {
      return ["blogs", "categories", "coupons", "products"];
    }
    // support
    return ["orders", "payments", "users"];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      setSubmitLoading(true);

      // Editing existing admin: update Firestore doc only
      if (editingAdmin) {
        const now = Timestamp.now();
        const perms = buildPermissionsForRole(formData.role);

        const docRef = doc(db, "admins", editingAdmin.uid);
        await setDoc(
          docRef,
          {
            uid: editingAdmin.uid,
            email: formData.email,
            displayName: formData.displayName,
            name: formData.displayName,
            role: formData.role,
            permissions: perms,
            updatedAt: now,
          },
          { merge: true }
        );

        setShowModal(false);
        await fetchAdmins();
        return;
      }

      // Creating new admin user
      if (!formData.email.trim() || !formData.displayName.trim()) {
        setFormError("Display name and email are required.");
        setSubmitLoading(false);
        return;
      }

      if (formData.password.length < 8) {
        setFormError("Password must be at least 8 characters long.");
        setSubmitLoading(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setFormError("Password and confirm password do not match.");
        setSubmitLoading(false);
        return;
      }

      const auth = getAuth();
      // Create user in Firebase Auth
      const cred = await createUserWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      ); // [web:86][web:87]
      const user = cred.user;

      // Set displayName on Auth user
      if (user && formData.displayName.trim()) {
        await updateProfile(user, {
          displayName: formData.displayName.trim(),
        });
      }

      const now = Timestamp.now();
      const permissions = buildPermissionsForRole(formData.role);

      // Create admin doc in Firestore with uid as docId (admins/{uid})
      const adminDocRef = doc(db, "admins", user.uid);
      await setDoc(adminDocRef, {
        uid: user.uid,
        email: formData.email.trim(),
        displayName: formData.displayName.trim(),
        name: formData.displayName.trim(),
        role: formData.role,
        permissions,
        createdAt: now,
        updatedAt: now,
        lastLogin: null,
      });

      setShowModal(false);
      await fetchAdmins();
    } catch (error: any) {
      console.error("Error saving admin:", error);
      setFormError(error.message || "Failed to save admin.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (uid: string) => {
    try {
      const docRef = doc(db, "admins", uid);
      await deleteDoc(docRef);
      setDeleteConfirm(null);
      fetchAdmins();
    } catch (error) {
      console.error("Error deleting admin:", error);
    }
  };

  const filteredAdmins = useMemo(() => {
    if (!searchQuery.trim()) return admins;

    const queryStr = searchQuery.toLowerCase();
    return admins.filter((admin) => {
      const displayName = admin.displayName?.toLowerCase() || "";
      const email = admin.email?.toLowerCase() || "";

      return displayName.includes(queryStr) || email.includes(queryStr);
    });
  }, [admins, searchQuery]);

  const columns = [
    {
      key: "displayName",
      header: "Admin",
      render: (admin: AdminUser) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
            {(admin.displayName || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium">{admin.displayName || "N/A"}</p>
            <p className="text-xs text-muted-foreground">
              {admin.email || "-"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (admin: AdminUser) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            roleColors[admin.role] || "bg-muted text-muted-foreground"
          }`}
        >
          <Shield className="w-3 h-3" />
          {admin.role?.replace("_", " ") || "Unknown"}
        </span>
      ),
    },
    {
      key: "lastLogin",
      header: "Last Login",
      render: (admin: AdminUser) => (
        <span className="text-muted-foreground text-sm">
          {admin.lastLogin
            ? new Date(admin.lastLogin).toLocaleString("en-IN")
            : "Never"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (admin: AdminUser) => (
        <span className="text-muted-foreground text-sm">
          {admin.createdAt
            ? new Date(admin.createdAt).toLocaleDateString("en-IN")
            : "-"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (admin: AdminUser) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(admin)}
            className="admin-btn-ghost p-2"
            title="Edit"
            disabled={!isSuperAdmin}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteConfirm(admin.uid)}
            className="admin-btn-ghost p-2 text-destructive"
            title="Delete"
            disabled={!isSuperAdmin || admin.role === "super_admin"}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  if (!isSuperAdmin) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Admin Users</h1>
            <p className="page-subtitle">
              You don't have permission to view this page
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Users</h1>
          <p className="page-subtitle">Manage admin accounts and roles</p>
        </div>
        <button onClick={() => handleOpenModal()} className="admin-btn-primary">
          <Plus className="w-5 h-5" />
          Add Admin
        </button>
      </div>

      {/* Info Banner */}
      <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> New admin users are created via email/password
          and stored in the admins collection with roles and permissions.
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search admins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-input pl-10"
          />
        </div>
      </div>

      {/* Admins Table */}
      <DataTable
        columns={columns}
        data={filteredAdmins}
        isLoading={isLoading}
        emptyMessage="No admin users found"
        keyExtractor={(admin) => admin.uid}
      />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingAdmin ? "Edit Admin" : "Add Admin"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-2 text-sm text-destructive bg-destructive/10 rounded">
              {formError}
            </div>
          )}

          <div>
            <label className="admin-label">Display Name</label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) =>
                setFormData({ ...formData, displayName: e.target.value })
              }
              className="admin-input"
              required
            />
          </div>

          <div>
            <label className="admin-label">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="admin-input"
              required
              disabled={!!editingAdmin}
            />
          </div>

          {/* Only show password fields when creating a new admin */}
          {!editingAdmin && (
            <>
              <div>
                <label className="admin-label">Password</label>
                <div className="relative">
                  <input
                    type={passwordVisible ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="admin-input pr-10"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-muted-foreground"
                    onClick={() => setPasswordVisible((v) => !v)}
                    tabIndex={-1}
                  >
                    {passwordVisible ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum 8 characters.
                </p>
              </div>

              <div>
                <label className="admin-label">Confirm Password</label>
                <div className="relative">
                  <input
                    type={confirmPasswordVisible ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="admin-input pr-10"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-muted-foreground"
                    onClick={() => setConfirmPasswordVisible((v) => !v)}
                    tabIndex={-1}
                  >
                    {confirmPasswordVisible ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="admin-label">Role</label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value as AdminRole })
              }
              className="admin-input"
            >
              <option value="super_admin">Super Admin</option>
              <option value="editor">Editor</option>
              <option value="support">Support</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Super Admin: Full access | Editor: Products, Coupons, Blogs |
              Support: Orders, Reviews, Tickets
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="admin-btn-outline"
              disabled={submitLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-btn-primary"
              disabled={submitLoading}
            >
              {submitLoading
                ? "Saving..."
                : editingAdmin
                ? "Update Admin"
                : "Create Admin"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Remove Admin"
        size="sm"
      >
        <p className="text-muted-foreground mb-6">
          Are you sure you want to remove this admin? They will no longer have
          access to the admin panel.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setDeleteConfirm(null)}
            className="admin-btn-outline"
          >
            Cancel
          </button>
          <button
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            className="admin-btn-danger"
          >
            Remove
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminUsersPage;
