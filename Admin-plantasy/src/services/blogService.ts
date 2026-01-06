import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  Timestamp,
  DocumentSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/firebaseConfig';
import { Blog } from '../types';

const COLLECTION_NAME = 'blogs';
const ITEMS_PER_PAGE = 10;

export const blogService = {
  // Get all blogs with pagination
  async getBlogs(
    pageSize: number = ITEMS_PER_PAGE,
    lastDoc?: DocumentSnapshot | null,
    publishedOnly: boolean = false
  ): Promise<{ blogs: Blog[]; lastDoc: DocumentSnapshot | null }> {
    try {
      let q = query(
        collection(db, COLLECTION_NAME),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      if (publishedOnly) {
        q = query(q, where('isPublished', '==', true));
      }

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const blogs: Blog[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        publishedAt: doc.data().publishedAt?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Blog[];

      const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

      return { blogs, lastDoc: lastVisible };
    } catch (error) {
      console.error('Error fetching blogs:', error);
      throw error;
    }
  },

  // Get single blog
  async getBlog(id: string): Promise<Blog | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          publishedAt: docSnap.data().publishedAt?.toDate(),
          createdAt: docSnap.data().createdAt?.toDate(),
          updatedAt: docSnap.data().updatedAt?.toDate(),
        } as Blog;
      }
      return null;
    } catch (error) {
      console.error('Error fetching blog:', error);
      throw error;
    }
  },

  // Create blog
  async createBlog(blog: Omit<Blog, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...blog,
        publishedAt: blog.isPublished ? Timestamp.now() : null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating blog:', error);
      throw error;
    }
  },

  // Update blog
  async updateBlog(id: string, updates: Partial<Blog>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const updateData: Record<string, unknown> = {
        ...updates,
        updatedAt: Timestamp.now(),
      };
      
      // Set publishedAt if being published for the first time
      if (updates.isPublished) {
        const currentBlog = await this.getBlog(id);
        if (currentBlog && !currentBlog.isPublished) {
          updateData.publishedAt = Timestamp.now();
        }
      }
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating blog:', error);
      throw error;
    }
  },

  // Delete blog
  async deleteBlog(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting blog:', error);
      throw error;
    }
  },

  // Upload cover image
  async uploadCoverImage(file: File, blogId: string): Promise<string> {
    try {
      const fileName = `cover_${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `blogs/${blogId}/${fileName}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading cover image:', error);
      throw error;
    }
  },

  // Upload gallery image
  async uploadGalleryImage(file: File, blogId: string): Promise<string> {
    try {
      const fileName = `gallery_${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `blogs/${blogId}/gallery/${fileName}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading gallery image:', error);
      throw error;
    }
  },

  // Generate slug from title
  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  },
};
