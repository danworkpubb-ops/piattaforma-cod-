import React, { useState } from 'react';
import { User, Affiliate, Manager, LogisticsUser } from '../types';
import ProfileForm from './ProfileForm';
import SecurityForm from './SecurityForm';

interface ProfilePageProps {
  user: User;
  fullUserObject: Affiliate | Manager | LogisticsUser | User;
  onUpdateProfile: (updatedData: Partial<User & { privacyPolicyUrl?: string }>) => void;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, fullUserObject, onUpdateProfile, onChangePassword }) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

    return (
        <div className="p-8">
            <h2 className="text-3xl font-bold text-on-surface mb-6">Il Mio Profilo</h2>

            <div className="bg-surface rounded-xl shadow-md">
                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex gap-6 px-6" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'profile'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Dettagli Profilo
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'security'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Sicurezza
                        </button>
                    </nav>
                </div>
                
                {/* Content */}
                <div className="p-6">
                    {activeTab === 'profile' && (
                        <ProfileForm user={fullUserObject} onSave={onUpdateProfile} />
                    )}
                    {activeTab === 'security' && (
                        <SecurityForm onChangePassword={onChangePassword} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
