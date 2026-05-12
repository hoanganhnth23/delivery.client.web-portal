import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  setDoc,
  Unsubscribe,
  limit,
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

// Firestore comment document structure (matches Flutter's LivestreamCommentDto)
interface FirestoreComment {
  id: string;
  livestreamId: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  message: string;
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
   * Path: livestreams/{livestreamId}/comments/{autoId}
   * (Matches Flutter's sub-collection structure)
   */
  async sendMessage(livestreamId: string, message: Omit<LiveMessage, 'id' | 'timestamp'>) {
    const commentId = `web_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const commentData: FirestoreComment = {
      id: commentId,
      livestreamId,
      userId: message.senderId,
      userName: message.senderName,
      userAvatar: null,
      message: message.content,
      timestamp: serverTimestamp(),
    };
    // Use setDoc with the generated ID to match Flutter's doc(comment.id).set() pattern
    const docRef = doc(db, 'livestreams', livestreamId, 'comments', commentId);
    return await setDoc(docRef, commentData);
  },

  /**
   * Lắng nghe tin nhắn real-time
   * Path: livestreams/{livestreamId}/comments (ordered by timestamp ASC)
   * (Matches Flutter's streamComments query)
   */
  subscribeToMessages(livestreamId: string, callback: (messages: LiveMessage[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'livestreams', livestreamId, 'comments'),
      orderBy('timestamp', 'asc'),
      limit(100),
    );

    return onSnapshot(q, (snapshot) => {
      const messages: LiveMessage[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as FirestoreComment;
        messages.push({
          id: docSnap.id,
          livestreamId: data.livestreamId,
          senderId: data.userId,
          senderName: data.userName,
          senderRole: 'viewer', // Default; could be enriched later
          content: data.message,
          timestamp: data.timestamp?.toDate() || new Date(),
        });
      });
      callback(messages);
    });
  },

  /**
   * Ghim sản phẩm lên livestream
   * Path: livestreams_metadata/{livestreamId}
   */
  async pinProduct(livestreamId: string, product: LiveProductPin) {
    const liveRef = doc(db, 'livestreams_metadata', livestreamId);
    return await setDoc(liveRef, {
      pinnedProduct: {
        ...product,
        updatedAt: serverTimestamp(),
      }
    }, { merge: true }).catch(async (err) => {
      console.error('Error pinning product:', err);
      throw err;
    });
  },

  /**
   * Lắng nghe metadata của livestream (ghim sản phẩm, interactions)
   * Path: livestreams_metadata/{livestreamId}
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
   * Path: livestreams/{livestreamId}/likes/{autoId}
   * (Matches Flutter's sendLike structure)
   */
  async sendLike(livestreamId: string) {
    const likeId = `web_like_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const likeData = {
      id: likeId,
      livestreamId,
      userId: 'web_user',
      userName: null,
      userAvatar: null,
      timestamp: serverTimestamp(),
    };
    const docRef = doc(db, 'livestreams', livestreamId, 'likes', likeId);
    return await setDoc(docRef, likeData);
  },

  /**
   * Lắng nghe likes real-time (for floating heart animations)
   * Path: livestreams/{livestreamId}/likes
   */
  subscribeToLikes(livestreamId: string, callback: (likes: any[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'livestreams', livestreamId, 'likes'),
      orderBy('timestamp', 'desc'),
      limit(50),
    );

    return onSnapshot(q, (snapshot) => {
      const likes: any[] = [];
      snapshot.forEach((docSnap) => {
        likes.push({ id: docSnap.id, ...docSnap.data() });
      });
      callback(likes);
    });
  },
};
