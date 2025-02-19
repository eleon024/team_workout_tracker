// getProfilePhotoUrl.js
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function getProfilePhotoUrl() {
  const auth = getAuth();
  const user = auth.currentUser;
  
  // Fallback default avatar URL
  const defaultAvatar = '/default-avatar.png';
  
  if (!user) {
    return defaultAvatar;
  }

  try {
    const profileRef = doc(db, 'profiles', user.uid);
    const profileSnap = await getDoc(profileRef);
    if (profileSnap.exists()) {
      const data = profileSnap.data();
      return data.photoUrl || defaultAvatar;
    }
    return defaultAvatar;
  } catch (error) {
    console.error('Error fetching profile photo:', error);
    return defaultAvatar;
  }
}
