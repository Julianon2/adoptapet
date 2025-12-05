import React, { useState } from 'react';
import { Grid, Heart, PawPrint, FileText } from 'lucide-react';
import UserPosts from './UserPosts';

const ProfileTabs = ({ userId, currentUser }) => {
    const [activeTab, setActiveTab] = useState('posts');

    const tabs = [
        {
            id: 'posts',
            label: 'Publicaciones',
            icon: <Grid className="w-4 h-4" />
        },
        {
            id: 'pets',
            label: 'Mascotas',
            icon: <PawPrint className="w-4 h-4" />
        },
        {
            id: 'favorites',
            label: 'Favoritos',
            icon: <Heart className="w-4 h-4" />
        },
        {
            id: 'about',
            label: 'Acerca de',
            icon: <FileText className="w-4 h-4" />
        }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'posts':
                return <UserPosts userId={userId} currentUser={currentUser} />;
            
            case 'pets':
                return (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                        <PawPrint className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                        <p className="text-gray-600">🐾 Sección de mascotas</p>
                        <p className="text-sm text-gray-500 mt-2">Próximamente...</p>
                    </div>
                );
            
            case 'favorites':
                return (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                        <Heart className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                        <p className="text-gray-600">❤️ Favoritos</p>
                        <p className="text-sm text-gray-500 mt-2">Próximamente...</p>
                    </div>
                );
            
            case 'about':
                return (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold mb-4">Acerca de</h3>
                        <div className="space-y-3 text-gray-700">
                            <p><strong>Nombre:</strong> {currentUser?.name}</p>
                            <p><strong>Email:</strong> {currentUser?.email}</p>
                            {currentUser?.bio && (
                                <p><strong>Bio:</strong> {currentUser.bio}</p>
                            )}
                            {currentUser?.location?.city && (
                                <p><strong>Ubicación:</strong> {currentUser.location.city}</p>
                            )}
                        </div>
                    </div>
                );
            
            default:
                return null;
        }
    };

    return (
        <div className="w-full">
            {/* Tabs Navigation */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="flex justify-around">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative ${
                                activeTab === tab.id
                                    ? 'text-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            {tab.icon}
                            <span className="hidden sm:inline">{tab.label}</span>
                            
                            {/* Active indicator */}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default ProfileTabs;