import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  updateDoc,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface LiveMessage {
  id: string;
  livestreamId: string;
  senderId: string;
  senderName: string;
  senderRole: 'host' | 'viewer';
  content: string;
  timestamp: any;
}

export interface LiveProductPin {
  productId: number;
  productName: string;
  price: number;
  image: string;
  isPinned: boolean;
  updatedAt: any;
}

export const livestreamRealtimeService = {
  /**
   * Gửi tin nhắn trong phòng live
   */
  async sendMessage(livestreamId: string, message: Omit<LiveMessage, 'id' | 'timestamp'>) {
    const data = {
      ...message,
      livestreamId,
      timestamp: serverTimestamp(),
    };
    return await addDoc(collection(db, 'livestream_messages'), data);
  },

  /**
   * Lắng nghe tin nhắn real-time
   */
  subscribeToMessages(livestreamId: string, callback: (messages: LiveMessage[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'livestream_messages'),
      where('livestreamId', '==', livestreamId),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const messages: LiveMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
        } as LiveMessage);
      });
      callback(messages);
    });
  },

  /**
   * Ghim sản phẩm lên livestream
   */
  async pinProduct(livestreamId: string, product: LiveProductPin) {
    const liveRef = doc(db, 'livestreams_metadata', livestreamId);
    return await updateDoc(liveRef, {
      pinnedProduct: {
        ...product,
        updatedAt: serverTimestamp(),
      }
    }).catch(async (err) => {
      // Nếu doc chưa tồn tại thì tạo mới (dùng setDoc)
      // Nhưng thường thì metadata nên được tạo khi start live
      console.error('Error pinning product:', err);
      throw err;
    });
  },

  /**
   * Lắng nghe metadata của livestream (ghim sản phẩm, interactions)
   */
  subscribeToMetadata(livestreamId: string, callback: (metadata: any) => void): Unsubscribe {
    const docRef = doc(db, 'livestreams_metadata', livestreamId);
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data());
      }
    });
  },

  /**
   * Thả tim (Like)
   */
  async sendLike(_livestreamId: string) {
    // Increment like count in Firestore
    // Implement as needed
  }
};
