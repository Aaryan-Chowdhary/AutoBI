import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { api } from '../lib/api';

const settingTabs = [
  { id: 'profile', label: 'profile_settings', icon: 'person' },
  { id: 'notifications', label: 'notification_settings', icon: 'notifications' },
  { id: 'security', label: 'security_settings', icon: 'shield' },
  { id: 'appearance', label: 'appearance_settings', icon: 'palette' },
  { id: 'language', label: 'language_settings', icon: 'language' },
  { id: 'delete', label: 'delete_account', icon: 'person_remove', isDanger: true },
];

function SettingsPage() {
  const { user, setUser } = useAuth();
  const { t, language: currentLang, setLanguage: setGlobalLang } = useTranslation();
  const [activeTab, setActiveTab] = useState('profile');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Toast state
  const [toast, setToast] = useState(null);
  const toastTimeout = useRef(null);

  const showToast = (message, type = 'success') => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToast({ message, type });
    toastTimeout.current = setTimeout(() => setToast(null), 4000);
  };
  
  // States for various settings
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    bio: '',
  });

  const [notifications, setNotifications] = useState({
    email: true,
    dataAlerts: true,
    reportSchedule: false,
  });

  const [security, setSecurity] = useState({
    newPassword: '',
    confirmPassword: '',
    otp: '',
    isOtpSent: false,
    loading: false
  });

  const [appearance, setAppearance] = useState('light');
  const [language, setLanguage] = useState('English');
  const fileInputRef = useRef(null);

  // Sync formData with user when user loads
  useEffect(() => {
    if (user) {
      const parts = user.name?.split(' ') || [];
      setFormData(prev => ({
        ...prev,
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || '',
        email: user.email || '',
        bio: user.bio || '',
      }));

      setNotifications({
        email: user.notifEmail ?? true,
        dataAlerts: user.notifDataAlerts ?? true,
        reportSchedule: user.notifReportSchedule ?? false,
      });

      setAppearance(user.theme || 'light');
      setLanguage(user.language || 'English');
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleNotification = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveProfile = async () => {
    try {
      const data = await api('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          bio: formData.bio
        })
      });
      if (data.success) {
        setUser(prev => ({ ...prev, ...data.user }));
        showToast('Profile updated successfully!');
      }
    } catch (error) {
      showToast(error.message || 'Failed to update profile', 'error');
    }
  };

  const handleSaveSettings = async (overrides = {}) => {
    const freshSettings = {
      notifEmail: notifications.email,
      notifDataAlerts: notifications.dataAlerts,
      notifReportSchedule: notifications.reportSchedule,
      theme: appearance,
      language: language,
      ...overrides
    };

    try {
      const data = await api('/auth/settings', {
        method: 'PUT',
        body: JSON.stringify(freshSettings)
      });
      if (data.success) {
        setUser(prev => ({ ...prev, ...data.settings }));
        if (freshSettings.language) {
          setGlobalLang(freshSettings.language);
        }
        showToast('Settings saved!');
      }
    } catch (error) {
      showToast(error.message || 'Failed to save settings', 'error');
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const upData = new FormData();
    upData.append('avatar', file);

    try {
      const data = await api('/auth/avatar', {
        method: 'POST',
        body: upData
      });
      if (data.success) {
        setUser(prev => ({ ...prev, photoURL: data.photoURL }));
        showToast('Avatar uploaded!');
      }
    } catch (error) {
      showToast(error.message || 'Failed to upload avatar', 'error');
    }
  };

  const handleSendOtp = async () => {
    if (security.newPassword !== security.confirmPassword) {
      return showToast('Passwords do not match', 'error');
    }
    if (security.newPassword.length < 6) {
      return showToast('Password must be at least 6 characters', 'error');
    }

    try {
      setSecurity(prev => ({ ...prev, loading: true }));
      const data = await api('/auth/change-password-send-otp', {
        method: 'POST'
      });
      if (data.success) {
        setSecurity(prev => ({ ...prev, isOtpSent: true, loading: false }));
        showToast('Verification code sent to your email!');
      }
    } catch (error) {
      setSecurity(prev => ({ ...prev, loading: false }));
      showToast(error.message || 'Error sending OTP', 'error');
    }
  };

  const handleVerifyPassword = async () => {
    try {
      const data = await api('/auth/change-password-verify', {
        method: 'POST',
        body: JSON.stringify({
          otp: security.otp,
          newPassword: security.newPassword
        })
      });
      if (data.success) {
        setSecurity({ newPassword: '', confirmPassword: '', otp: '', isOtpSent: false, loading: false });
        showToast('Password changed successfully!');
      } else {
        showToast(data.error || 'Verification failed', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Error verifying OTP', 'error');
    }
  };

  const renderProfile = () => (
    <div className="flex gap-12">
      {/* Profile Picture Section */}
      <div className="flex flex-col items-center">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-50 shadow-sm flex items-center justify-center bg-gray-100">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-gray-300">
                {user?.name?.charAt(0) || 'P'}
              </span>
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
          />
          <button 
            onClick={handleAvatarClick}
            className="absolute bottom-0 right-0 w-8 h-8 bg-[#111318] rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white hover:scale-110 transition-transform"
          >
            <span className="material-symbols-outlined text-[16px]">photo_camera</span>
          </button>
        </div>
        <div className="mt-4 text-center">
          <h4 className="font-bold text-[#111318] text-[16px]">{user?.name || 'Guest User'}</h4>
          <p className="text-[12px] text-gray-400 font-medium">AutoBI Account</p>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-gray-400 ml-1">{t('first_name')}</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[14px] text-gray-700 focus:outline-none focus:bg-white focus:border-primary/30 transition-all font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-gray-400 ml-1">{t('last_name')}</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[14px] text-gray-700 focus:outline-none focus:bg-white focus:border-primary/30 transition-all font-medium"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] font-semibold text-gray-400 ml-1">{t('email_address')}</label>
          <input
            type="email"
            name="email"
            disabled
            value={formData.email}
            className="w-full px-4 py-2.5 bg-gray-100 border border-gray-100 rounded-xl text-[14px] text-gray-400 font-medium cursor-not-allowed"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] font-semibold text-gray-400 ml-1">{t('bio')}</label>
          <textarea
            name="bio"
            rows="4"
            value={formData.bio}
            onChange={handleInputChange}
            placeholder="Tell us about yourself..."
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[14px] text-gray-700 focus:outline-none focus:bg-white focus:border-primary/30 transition-all font-medium resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button className="px-6 py-2.5 text-[14px] font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-all border border-transparent">
            {t('cancel')}
          </button>
          <button 
            onClick={handleSaveProfile}
            className="px-8 py-2.5 bg-primary text-white text-[14px] font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-primary/20 transition-all"
          >
            {t('save_changes')}
          </button>
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-[18px] font-bold text-[#111318] mb-1">{t('notification_settings')}</h3>
        <p className="text-gray-500 text-[14px]">Choose how you want to stay updated with your data and workspace.</p>
      </div>

      <div className="space-y-6">
        {[
          { id: 'email', label: 'Email Notifications', desc: 'Receive daily digests and critical alerts via email.' },
          { id: 'dataAlerts', label: 'Dataset Processing Alerts', desc: 'Get notified when your data sources finish refreshing.' },
          { id: 'reportSchedule', label: 'Scheduled Report Notifications', desc: 'Alerts when your periodic PDF/Excel reports are ready.' },
        ].map(item => (
          <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-50 hover:bg-gray-50/50 transition-colors">
            <div className="space-y-0.5">
              <h4 className="font-bold text-[#111318] text-[15px]">{item.label}</h4>
              <p className="text-[13px] text-gray-400">{item.desc}</p>
            </div>
            <button 
              onClick={() => toggleNotification(item.id)}
              className={`w-12 h-6 rounded-full relative transition-all duration-300 ${notifications[item.id] ? 'bg-primary' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${notifications[item.id] ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <button 
          onClick={() => handleSaveSettings()}
          className="px-8 py-2.5 bg-primary text-white text-[14px] font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-primary/20 transition-all"
        >
          {t('save_changes')}
        </button>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-10">
      <div className="space-y-6">
        <h3 className="text-[18px] font-bold text-[#111318]">{t('security_settings')}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-50 bg-gray-50/30">
            <div className="space-y-0.5">
              <h4 className="font-bold text-[#111318]/40 text-[15px]">Two-Factor Authentication (Disabled)</h4>
              <p className="text-[13px] text-gray-300">This feature has been removed by system policy.</p>
            </div>
            <div className="w-12 h-6 rounded-full bg-gray-100 flex items-center px-1">
              <div className="w-4 h-4 bg-gray-200 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-[18px] font-bold text-[#111318]">Change Password</h3>
        <div className="space-y-4 max-w-md">
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-gray-400 ml-1">New Password</label>
            <div className="relative">
              <input 
                type="password" 
                placeholder="••••••••" 
                value={security.newPassword}
                onChange={(e) => setSecurity(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[14px] focus:outline-none focus:bg-white focus:border-primary/30 transition-all font-medium" 
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-gray-400 ml-1">Confirm New Password</label>
            <div className="relative">
              <input 
                type="password" 
                placeholder="••••••••" 
                value={security.confirmPassword}
                onChange={(e) => setSecurity(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[14px] focus:outline-none focus:bg-white focus:border-primary/30 transition-all font-medium" 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button 
          onClick={handleSendOtp}
          disabled={security.loading}
          className="px-8 py-2.5 bg-primary text-white text-[14px] font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-primary/20 transition-all"
        >
          {security.loading ? 'Sending...' : 'Verify Email & Change Password'}
        </button>
      </div>

      {/* OTP Verification Modal for Password */}
      {security.isOtpSent && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#111318]/40 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-md p-10 shadow-2xl scale-in-center">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[32px]">security</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-[22px] font-bold text-[#111318]">Verify Password Change</h3>
                <p className="text-gray-500 text-[14px]">We've sent a 6-digit code to your email. Enter it below to finalize the changes.</p>
              </div>
              <input
                type="text"
                maxLength="6"
                value={security.otp}
                onChange={(e) => setSecurity(prev => ({ ...prev, otp: e.target.value }))}
                placeholder="000000"
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-[24px] focus:outline-none focus:bg-white focus:border-primary/30 transition-all font-bold text-center tracking-[12px]"
              />
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setSecurity(prev => ({ ...prev, isOtpSent: false }))}
                  className="flex-1 px-6 py-3.5 bg-gray-50 text-gray-500 rounded-2xl font-bold hover:bg-gray-100 transition-all"
                >
                  {t('cancel')}
                </button>
                <button 
                  onClick={handleVerifyPassword}
                  disabled={security.otp.length !== 6}
                  className="flex-1 px-6 py-3.5 bg-primary text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg"
                >
                  Finalize
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAppearance = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-[18px] font-bold text-[#111318] mb-1">{t('appearance_settings')}</h3>
        <p className="text-gray-500 text-[14px]">Customize the look and feel of your AutoBI interface.</p>
      </div>

      <div className="grid grid-cols-2 gap-6 max-w-2xl">
        {[
          { id: 'light', label: 'Light', icon: 'wb_sunny', color: '#ffc107' },
          { id: 'dark', label: 'Dark', icon: 'dark_mode', color: '#6366f1' },
        ].map(item => (
          <button 
            key={item.id}
            onClick={() => setAppearance(item.id)}
            className={`
              p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-4 text-center
              ${appearance === item.id ? 'border-primary bg-primary/5' : 'border-gray-50 bg-white hover:border-gray-200'}
            `}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center`} style={{ backgroundColor: `${item.color}15` }}>
              <span className="material-symbols-outlined" style={{ color: item.color }}>{item.icon}</span>
            </div>
            <div>
              <h4 className="font-bold text-[#111318] text-[15px]">{item.label}</h4>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${appearance === item.id ? 'border-primary bg-primary' : 'border-gray-200'}`}>
              {appearance === item.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <button 
          onClick={() => handleSaveSettings({ theme: appearance })}
          className="px-8 py-2.5 bg-primary text-white text-[14px] font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-primary/20 transition-all"
        >
          {t('save_changes')}
        </button>
      </div>
    </div>
  );

  const renderLanguage = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-[18px] font-bold text-[#111318] mb-1">{t('language_settings')}</h3>
        <p className="text-gray-500 text-[14px]">Select your preferred language for the interface.</p>
      </div>

      <div className="max-w-md space-y-4">
        <div className="space-y-1.5">
          <label className="text-[12px] font-semibold text-gray-400 ml-1">Interface Language</label>
          <div className="relative">
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[14px] text-gray-700 cursor-pointer focus:outline-none focus:bg-white focus:border-primary/30 appearance-none font-medium"
            >
              {['English', 'Hindi'].map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-3 text-gray-400 pointer-events-none">expand_more</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button 
          onClick={() => handleSaveSettings({ language })}
          className="px-8 py-2.5 bg-primary text-white text-[14px] font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-primary/20 transition-all"
        >
          {t('save_changes')}
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'profile': return renderProfile();
      case 'notifications': return renderNotifications();
      case 'security': return renderSecurity();
      case 'appearance': return renderAppearance();
      case 'language': return renderLanguage();
      case 'delete': return (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-red-400 text-[40px]">person_remove</span>
          </div>
          <div>
            <h3 className="text-[20px] font-bold text-[#111318] mb-2">{t('delete_account')}</h3>
            <p className="text-gray-500 text-[14px] max-w-sm">This action will permanently delete your profiles, datasets, and reports. This cannot be undone.</p>
          </div>
          <button 
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-8 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
          >
            {t('delete_account')}
          </button>
        </div>
      );
      default: return renderProfile();
    }
  };

  return (
    <div className="h-screen flex bg-[#f8f9fb] overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar pageTitle={t('settings')} />

        <main className="flex-1 overflow-y-auto px-10 py-8 home-scrollbar">
          <div className="flex gap-8 max-w-6xl mx-auto">
            {/* Sidebar Sub-navigation */}
            <div className="w-68 shrink-0">
              <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-3 border border-white">
                {settingTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[14px] font-bold transition-all mb-1 last:mb-0
                      ${activeTab === tab.id
                        ? 'bg-primary/10 text-primary shadow-[0_8px_16px_rgba(33,101,243,0.08)]'
                        : tab.isDanger 
                          ? 'text-red-400 hover:bg-red-50' 
                          : 'text-gray-400 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className={`material-symbols-outlined text-[22px] ${activeTab === tab.id ? 'text-primary' : ''}`}>
                      {tab.icon}
                    </span>
                    {t(tab.label)}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1">
              <div className="mb-8">
                <h2 className="text-[28px] font-bold text-[#111318] mb-1">
                  {t(settingTabs.find(tab => tab.id === activeTab)?.label)}
                </h2>
                <p className="text-gray-500 text-[14px]">Update your {activeTab} preferences and information</p>
              </div>

              <div className="bg-white rounded-[32px] shadow-[0_4px_32px_rgba(0,0,0,0.02)] border border-white p-10 min-h-[500px]">
                {renderContent()}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`
            fixed bottom-8 right-8 z-[300] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl
            transition-all max-w-md
            ${toast.type === 'error'
              ? 'bg-red-500 text-white shadow-red-500/30'
              : 'bg-[#111318] text-white shadow-black/20'
            }
          `}
          style={{ animation: 'slideUp 0.35s ease-out' }}
        >
          <span className="material-symbols-outlined text-[20px]">
            {toast.type === 'error' ? 'error' : 'check_circle'}
          </span>
          <span className="text-[14px] font-semibold">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#111318]/40 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-md p-10 shadow-2xl scale-in-center">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500 text-[32px]">warning</span>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-[22px] font-bold text-[#111318]">{t('delete_account')}?</h3>
                <p className="text-gray-500 text-[14px]">
                  This action is permanent and cannot be undone. Please type <span className="font-bold text-red-500">DELETE</span> below to confirm.
                </p>
              </div>

              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE here..."
                className="w-full px-5 py-3.5 bg-gray-50 border border-red-100 rounded-2xl text-[14px] focus:outline-none focus:bg-white focus:border-red-400 transition-all font-bold text-center uppercase tracking-widest"
              />

              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-6 py-3.5 bg-gray-50 text-gray-500 rounded-2xl font-bold hover:bg-gray-100 transition-all"
                >
                  {t('cancel')}
                </button>
                <button 
                  disabled={deleteConfirmText !== 'DELETE'}
                  className={`flex-1 px-6 py-3.5 rounded-2xl font-bold transition-all shadow-lg ${deleteConfirmText === 'DELETE' ? 'bg-red-500 text-white shadow-red-500/20 hover:bg-red-600' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast slide-up animation */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default SettingsPage;
