/**
 * Admin Chat Page
 * Quản lý tất cả conversations của tất cả restaurants
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';
import { useChat } from '@/modules/chat/hooks/useChat';
import ChatConversationList from '@/modules/chat/components/ChatConversationList';
import ChatMessageArea from '@/modules/chat/components/ChatMessageArea';

const AdminChatPage = () => {
  const { getSupportConversations, conversations } = useChat();

  // Load tất cả support conversations (CSKH) khi component mount
  useEffect(() => {
    getSupportConversations();
  }, [getSupportConversations]);

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Sidebar Navigation */}
      <aside className="hidden lg:flex flex-col w-72 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark flex-shrink-0">
        <div className="flex h-full flex-col justify-between p-6">
          <div className="flex flex-col gap-8">
            {/* Logo / User */}
            <div className="flex items-center gap-4 px-2">
              <div
                className="bg-center bg-no-repeat bg-cover rounded-full size-12 shadow-sm border-2 border-primary"
                style={{backgroundImage: "url('https://i.pravatar.cc/150?img=5')"}}
              />
              <div className="flex flex-col">
                <h1 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-tight">ShopeeFood Admin</h1>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">Super Admin</p>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col gap-2">
              <Link to={ROUTES.ADMIN_DASHBOARD} className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <span className="material-symbols-outlined">dashboard</span>
                <span className="text-sm font-medium">Dashboard</span>
              </Link>
              <Link to={ROUTES.ADMIN_RESTAURANTS} className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <span className="material-symbols-outlined">storefront</span>
                <span className="text-sm font-medium">Restaurants</span>
              </Link>
              <Link to={ROUTES.ADMIN_MENUS} className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <span className="material-symbols-outlined">restaurant_menu</span>
                <span className="text-sm font-medium">Menus</span>
              </Link>
              <Link to={ROUTES.ADMIN_CATEGORIES} className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <span className="material-symbols-outlined">category</span>
                <span className="text-sm font-medium">Categories</span>
              </Link>
              <Link to={ROUTES.ADMIN_USERS} className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <span className="material-symbols-outlined">group</span>
                <span className="text-sm font-medium">Users</span>
              </Link>
              <Link to={ROUTES.ADMIN_CHAT} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary transition-all hover:bg-primary/20">
                <span className="material-symbols-outlined icon-filled">chat_bubble</span>
                <span className="text-sm font-bold">Chat Support</span>
              </Link>
              <div className="h-px bg-border-light dark:bg-border-dark my-2 mx-4"></div>
              <Link to={ROUTES.ADMIN_SETTINGS} className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <span className="material-symbols-outlined">settings</span>
                <span className="text-sm font-medium">Settings</span>
              </Link>
              <Link to={ROUTES.LOGIN} className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <span className="material-symbols-outlined">logout</span>
                <span className="text-sm font-medium">Logout</span>
              </Link>
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="px-8 py-5 bg-white dark:bg-gray-900 border-b border-border-light dark:border-border-dark">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chat Support (CSKH)</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {conversations.length} yêu cầu hỗ trợ từ nhà hàng
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
                <input
                  className="pl-10 pr-4 py-2.5 w-64 rounded-full bg-gray-50 dark:bg-surface-dark border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-gray-700 dark:text-gray-200 transition-all"
                  placeholder="Tìm kiếm cuộc hội thoại..."
                  type="text"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Chat Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Conversation List */}
          <div className="w-96 border-r border-border-light dark:border-border-dark bg-white dark:bg-gray-900 overflow-y-auto">
            <ChatConversationList />
          </div>

          {/* Message Area */}
          <div className="flex-1 bg-white dark:bg-gray-900">
            <ChatMessageArea />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminChatPage;
