'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout, isAuthenticated, type User } from '@/lib/api';

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check authentication
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }

        // Get user data
        const userData = getCurrentUser();
        if (!userData) {
            router.push('/login');
            return;
        }

        setUser(userData);
        setLoading(false);
    }, [router]);

    const handleLogout = () => {
        if (confirm('Bạn có chắc muốn đăng xuất?')) {
            logout();
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <svg className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect to login
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-bold text-gray-900">
                                GiaLai OCOP Dashboard
                            </h1>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                            Đăng xuất
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Card */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex items-center gap-4">
                        {user.avatarUrl && (
                            <img
                                src={user.avatarUrl}
                                alt={user.name}
                                className="w-20 h-20 rounded-full ring-4 ring-indigo-50"
                            />
                        )}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                Xin chào, {user.name}!
                            </h2>
                            <p className="text-gray-600">{user.email}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                                    {user.role}
                                </span>
                                {user.isEmailVerified && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                        ✓ Email đã xác thực
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Info Card */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">
                        Thông tin tài khoản
                    </h3>
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <dt className="text-sm font-medium text-gray-500">ID</dt>
                            <dd className="mt-1 text-sm text-gray-900">{user.id}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Email</dt>
                            <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Họ tên</dt>
                            <dd className="mt-1 text-sm text-gray-900">{user.name}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Vai trò</dt>
                            <dd className="mt-1 text-sm text-gray-900">{user.role}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Trạng thái</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {user.isActive ? (
                                    <span className="text-green-600">✓ Đang hoạt động</span>
                                ) : (
                                    <span className="text-red-600">✗ Bị vô hiệu hóa</span>
                                )}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Enterprise ID</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {user.enterpriseId || 'Ch╞░a li├¬n kß║┐t'}
                            </dd>
                        </div>
                    </dl>
                </div>

                {/* Debug Info (Development only) */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-6 bg-gray-800 text-white rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">≡ƒöº Debug Info</h3>
                        <pre className="text-xs overflow-auto">
                            {JSON.stringify(user, null, 2)}
                        </pre>
                    </div>
                )}
            </main>
        </div>
    );
}
