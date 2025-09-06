import React, { useState, useEffect } from 'react'; // Added useEffect
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonAlert,
  IonSpinner, // Added
  IonText     // Added
} from '@ionic/react';
import { personCircleOutline, logOutOutline, settingsOutline, helpCircleOutline } from 'ionicons/icons';
import { supabase } from '../supabaseClient'; // Added

// Define an interface for the profile data from Supabase
interface SupabaseProfile {
  id: string; // UUID from auth.users
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  // Add other fields from your 'profiles' table if needed
}

const ProfilePage: React.FC = () => {
  const [profileData, setProfileData] = useState<SupabaseProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        let userProfile: SupabaseProfile | null = null;

        if (session?.user) {
          const { data, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found, not a fatal error
            throw profileError;
          }
          userProfile = data as SupabaseProfile | null;
        }

        // If no logged-in user's profile found, or no session, try fetching a default/first profile
        if (!userProfile) {
          console.log("No active user session or profile found for user, fetching first available profile as placeholder.");
          const { data, error: defaultProfileError } = await supabase
            .from('profiles')
            .select('*')
            .order('username', { ascending: true }) // Or by created_at, etc.
            .limit(1)
            .single();
          if (defaultProfileError && defaultProfileError.code !== 'PGRST116') {
            throw defaultProfileError;
          }
          userProfile = data as SupabaseProfile | null;
        }
        
        setProfileData(userProfile);

        if (!userProfile) {
            setError("No profile data found. Please ensure there is data in the 'profiles' table or log in.");
        }

      } catch (err: any) {
        console.error('Error fetching profile data:', err);
        setError(err.message || 'Failed to fetch profile data.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []); // Empty dependency array means this runs once on mount

  const handleLogout = async () => {
    setLoading(true); // Show spinner during logout
    const { error: signOutError } = await supabase.auth.signOut();
    setShowLogoutAlert(false);
    if (signOutError) {
      console.error('Error logging out:', signOutError);
      setError('Failed to log out.');
    } else {
      console.log('User logged out');
      setProfileData(null); // Clear profile data
      // Optionally, re-fetch a default profile or redirect
      // For now, refetching to show default (if any)
      const { data, error: defaultProfileError } = await supabase
        .from('profiles')
        .select('*')
        .order('username', { ascending: true })
        .limit(1)
        .single();
      if (data) setProfileData(data as SupabaseProfile);
      else if (defaultProfileError && defaultProfileError.code !== 'PGRST116') {
        setError(defaultProfileError.message);
      } else {
        setError("Logged out. No default profile found.");
      }
    }
    setLoading(false);
  };

  if (loading && !profileData) { // Only show full page spinner if no profile data yet
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="dark"><IonTitle>Profile</IonTitle></IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="ion-padding ion-text-center">
          <IonSpinner name="crescent" />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="dark">
          <IonTitle>Profile</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        {loading && <IonSpinner style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} name="crescent" />} {/* Show a smaller spinner if reloading */}
        {error && !profileData && ( /* Show error prominently if no profileData could be loaded initially */
          <div className="ion-padding ion-text-center">
            <IonText color="danger"><p>{error}</p></IonText>
          </div>
        )}

        <div className="profile-container">
          <div className="profile-avatar">
            <img src={profileData?.avatar_url || '/placeholder_avatar.png'} alt="User avatar" />
          </div>
          <IonLabel className="profile-name">{profileData?.full_name || profileData?.username || 'Guest User'}</IonLabel>
          <IonLabel className="profile-email">{/* Email is not in profiles table by default, comes from auth.user.email */}</IonLabel>
        </div>

        {/* Action List */}
        <IonList className="profile-list" lines="full">
          <IonItem button detail={true} routerLink="/profile/account" disabled={!profileData || loading}> {/* Disable if no profile or loading */}
            <IonIcon slot="start" icon={personCircleOutline} />
            <IonLabel>Account Details</IonLabel>
          </IonItem>
          <IonItem button detail={true} routerLink="/profile/settings" disabled={!profileData || loading}> {/* Disable if no profile or loading */}
            <IonIcon slot="start" icon={settingsOutline} />
            <IonLabel>Settings</IonLabel>
          </IonItem>
          <IonItem button detail={true} routerLink="/profile/help">
            <IonIcon slot="start" icon={helpCircleOutline} />
            <IonLabel>Help & Support</IonLabel>
          </IonItem>
        </IonList>

        {/* Logout List */}
        <IonList className="profile-list" lines="none">
          <IonItem button={true} detail={false} onClick={() => setShowLogoutAlert(true)} className="logout-item" disabled={loading}> {/* Disable if loading */}
            <IonIcon slot="start" icon={logOutOutline} />
            <IonLabel>Logout</IonLabel>
          </IonItem>
        </IonList>

        {/* Logout Confirmation Alert */}
        <IonAlert
          isOpen={showLogoutAlert}
          onDidDismiss={() => setShowLogoutAlert(false)}
          header={'Logout'}
          message={'Are you sure you want to log out?'}
          buttons={[
            { text: 'Cancel', role: 'cancel', cssClass: 'secondary' },
            { text: 'Logout', cssClass: 'danger', handler: handleLogout },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default ProfilePage;
