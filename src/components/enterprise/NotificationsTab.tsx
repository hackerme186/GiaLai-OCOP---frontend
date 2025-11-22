"use client"

import { useEffect, useState } from "react"
import { type User } from "@/lib/api"

interface NotificationsTabProps {
  user: User | null
}

interface Notification {
  id: number
  type: "product_approved" | "product_rejected" | "new_order" | "low_stock" | "system"
  title: string
  message: string
  read: boolean
  createdAt: string
  link?: string
}

export default function NotificationsTab({ user }: NotificationsTabProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")

  useEffect(() => {
    loadNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      // TODO: Implement API call to get notifications
      // For now, use mock data
      const mockNotifications: Notification[] = [
        {
          id: 1,
          type: "product_approved",
          title: "Sản phẩm đã được duyệt",
          message: "Sản phẩm 'Cà phê Gia Lai' đã được System Admin phê duyệt",
          read: false,
          createdAt: new Date().toISOString(),
          link: "/enterprise-admin?tab=products",
        },
        {
          id: 2,
          type: "new_order",
          title: "Đơn hàng mới",
          message: "Bạn có đơn hàng mới #1234",
          read: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          link: "/enterprise-admin?tab=orders",
        },
        {
          id: 3,
          type: "low_stock",
          title: "Cảnh báo tồn thấp",
          message: "Sản phẩm 'Hạt điều' đang tồn thấp",
          read: true,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          link: "/enterprise-admin?tab=inventory",
        },
      ]
      setNotifications(mockNotifications)
    } catch (err) {
      console.error("Failed to load notifications:", err)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: number) => {
    // TODO: Implement API call to mark notification as read
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllAsRead = async () => {
    // TODO: Implement API call to mark all as read
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = async (id: number) => {
    // TODO: Implement API call to delete notification
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      product_approved: "✅",
      product_rejected: "❌",
      new_order: "📦",
      low_stock: "⚠️",
      system: "🔔",
    }
    return icons[type] || "🔔"
  }

  const getNotificationColor = (type: string) => {
    const colors: Record<string, string> = {
      product_approved: "bg-green-50 border-green-200",
      product_rejected: "bg-red-50 border-red-200",
      new_order: "bg-blue-50 border-blue-200",
      low_stock: "bg-yellow-50 border-yellow-200",
      system: "bg-gray-50 border-gray-200",
    }
    return colors[type] || "bg-gray-50 border-gray-200"
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === "unread") return !n.read
    if (filter === "read") return n.read
    return true
  })

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600 mx-auto mb-4" />
        <p className="text-gray-600">Đang tải thông báo...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Thông báo</h2>
            <p className="text-sm text-gray-500 mt-1">Quản lý thông báo và cập nhật từ hệ thống</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {[
            { id: "all", label: `Tất cả (${notifications.length})` },
            { id: "unread", label: `Chưa đọc (${unreadCount})` },
            { id: "read", label: `Đã đọc (${notifications.length - unreadCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === tab.id
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Không có thông báo</h3>
          <p className="text-gray-500">Bạn chưa có thông báo nào.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map(notification => (
            <div
              key={notification.id}
              className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${
                notification.read ? "border-gray-300" : "border-green-600"
              } ${getNotificationColor(notification.type)}`}
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-semibold ${notification.read ? "text-gray-700" : "text-gray-900"}`}>
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{notification.message}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleString("vi-VN")}
                    </span>
                    <div className="flex gap-2">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs text-green-600 hover:text-green-800 font-medium"
                        >
                          Đánh dấu đã đọc
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

