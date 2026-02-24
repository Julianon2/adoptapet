import React, { useState } from 'react';

// ============================================================
// CONSTANTS
// ============================================================
const API_URL = '${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api';

const BUTTON_STYLES = {
  gradientBlue: 'bg-gradient-to-r from-blue-500 to-purple-600',
  gradientRed: 'bg-gradient-to-r from-red-500 to-red-600',
};

// ============================================================
// COMPONENT
// ============================================================
const CuentaModal = ({ isOpen, onClose }) => {
  // ========== States for Password Modal ==========
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ========== States for Deactivate Modal ==========
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');

  // ========== Loading State ==========
  const [loading, setLoading] = useState(false);

  // ========== Early Return if Modal is Closed ==========
  if (!isOpen) return null;

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================
  const getToken = () => localStorage.getItem('token');

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordModal(false);
  };

  const resetDeactivateForm = () => {
    setDeactivateReason('');
    setShowDeactivateModal(false);
  };

  const logoutAndRedirect = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // ============================================================
  // HANDLERS - PASSWORD CHANGE
  // ============================================================
  const validatePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return false;
    }

    if (newPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    const token = getToken();
    if (!token) {
      alert('❌ No hay sesión activa. Inicia sesión nuevamente.');
      return false;
    }

    return true;
  };

  const handlePasswordChange = async () => {
    if (!validatePasswordChange()) return;

    setLoading(true);

    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/users/me/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert('❌ ' + (data.message || 'Error al cambiar contraseña'));
        return;
      }

      alert('✅ Contraseña cambiada exitosamente');
      resetPasswordForm();
    } catch (error) {
      console.error(error);
      alert('❌ Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // HANDLERS - DEACTIVATE ACCOUNT
  // ============================================================
  const validateDeactivateAccount = () => {
    if (!deactivateReason.trim()) {
      alert('Por favor indica el motivo de desactivación');
      return false;
    }

    const confirmed = window.confirm(
      '⚠️ ¿Estás seguro de que quieres desactivar tu cuenta? Luego no podrás iniciar sesión.'
    );

    if (!confirmed) return false;

    const token = getToken();
    if (!token) {
      alert('❌ No hay sesión activa. Inicia sesión nuevamente.');
      return false;
    }

    return true;
  };

  const handleDeactivateAccount = async () => {
    if (!validateDeactivateAccount()) return;

    setLoading(true);

    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/users/me/deactivate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: deactivateReason,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert('❌ ' + (data.message || 'Error al desactivar cuenta'));
        return;
      }

      alert('✅ Cuenta desactivada. Serás redirigido al inicio de sesión.');
      logoutAndRedirect();
    } catch (error) {
      console.error(error);
      alert('❌ Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // RENDER - MAIN CONTENT
  // ============================================================
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold">Cuenta</h2>
            <div className="w-10" />
          </div>
        </div>

        {/* Contenido principal */}
        <div className="p-6 space-y-4">
          {/* Opción de Contraseña */}
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all group"
          >
            <span className="text-lg font-medium text-gray-800">Contraseña</span>
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Opción de Desactivar cuenta */}
          <button
            onClick={() => setShowDeactivateModal(true)}
            className="w-full flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 rounded-xl transition-all group"
          >
            <span className="text-lg font-medium text-red-600">Desactivar cuenta</span>
            <svg
              className="w-5 h-5 text-red-400 group-hover:text-red-600 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Modales */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        loading={loading}
        currentPassword={currentPassword}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        onCurrentPasswordChange={setCurrentPassword}
        onNewPasswordChange={setNewPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onSubmit={handlePasswordChange}
      />

      <DeactivateModal
        isOpen={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        loading={loading}
        deactivateReason={deactivateReason}
        onReasonChange={setDeactivateReason}
        onSubmit={handleDeactivateAccount}
      />
    </div>
  );
};

// ============================================================
// SUB-COMPONENTS
// ============================================================
const PasswordModal = ({
  isOpen,
  onClose,
  loading,
  currentPassword,
  newPassword,
  confirmPassword,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-60">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full m-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2"
              disabled={loading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="text-xl font-bold">Cambiar Contraseña</h3>
            <div className="w-10" />
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña actual</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => onCurrentPasswordChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nueva contraseña</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => onNewPasswordChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar nueva contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => onConfirmPasswordChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={onSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
          </button>
        </div>
      </div>
    </div>
  );
};

const DeactivateModal = ({
  isOpen,
  onClose,
  loading,
  deactivateReason,
  onReasonChange,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-60">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full m-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2"
              disabled={loading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="text-xl font-bold">Desactivar Cuenta</h3>
            <div className="w-10" />
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium mb-2">⚠️ Advertencia</p>
            <p className="text-red-600 text-sm">
              Esta acción desactivará tu cuenta. Luego no podrás iniciar sesión.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Motivo de desactivación</label>
            <textarea
              value={deactivateReason}
              onChange={(e) => onReasonChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="Por favor cuéntanos por qué deseas desactivar tu cuenta..."
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={onSubmit}
              disabled={loading}
              className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Desactivando...' : 'Desactivar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CuentaModal;