/**
 * RestaurantChatPage Component
 * Trang chat cho nhà hàng - nhắn tin với user hoặc CSKH
 */

import { useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import { useRestaurant } from '@/modules/restaurant/hooks/useRestaurant';
import RestaurantSidebar from '@/components/layout/RestaurantSidebar';
import RestaurantHeader from '@/components/layout/RestaurantHeader';
import ChatConversationList from '../components/ChatConversationList.tsx';
import ChatMessageArea from '../components/ChatMessageArea.tsx';

const RestaurantChatPage = () => {
  const { currentRestaurant } = useRestaurant();
  const {
    conversations,
    currentConversation,
    loading,
    getRestaurantConversations,
  } = useChat();

  // Load conversations khi component mount
  useEffect(() => {
    if (currentRestaurant?.id) {
      getRestaurantConversations(currentRestaurant.id);
    }
  }, [currentRestaurant, getRestaurantConversations]);

  return (
    <div className="flex min-h-screen w-full bg-background-light dark:bg-background-dark">
      {/* Sidebar */}
      <RestaurantSidebar
        restaurantName={currentRestaurant?.name}
        restaurantImage={currentRestaurant?.image}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <RestaurantHeader
          title="Nhắn tin"
          subtitle={`${conversations.length} cuộc hội thoại`}
          showSearch={false}
        />

        {/* Chat Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Conversation List */}
          <div className="w-80 border-r border-border-light dark:border-border-dark overflow-y-auto">
            <ChatConversationList loading={loading} />
          </div>

          {/* Message Area */}
          <div className="flex-1 flex flex-col">
            {currentConversation ? (
              <ChatMessageArea />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <span className="material-symbols-outlined text-6xl mb-4 block">chat</span>
                  <p className="text-lg font-semibold">Chọn cuộc hội thoại để bắt đầu</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RestaurantChatPage;
