import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonSearchbar,
  IonList,
  IonLabel,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSpinner, // For loading state
  IonText // For error messages
} from '@ionic/react';
import { supabase } from '../supabaseClient'; // Import Supabase client

// Define interfaces for the data structure from Supabase
interface Episode {
  id: string;
  title: string;
  thumbnail_url?: string | null; // Assuming this is the column name in your 'episodes' table
  video_url_mp4?: string | null;
  video_url_hls?: string | null;
  // Add other episode fields if needed from your 'episodes' table
}

interface Series {
  id: string;
  title: string;
  description?: string | null;
  cover_image_url?: string | null; // Assuming this is the column name in your 'series' table
  episodes: Episode[];
}

const HomePage: React.FC = () => {
  const [allSeriesData, setAllSeriesData] = useState<Series[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSeries = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch series and all their related episodes
        const { data, error: supabaseError } = await supabase
          .from('series')
          .select(`
            id,
            title,
            description,
            cover_image_url,
            episodes (
              id,
              title,
              thumbnail_url,
              video_url_mp4,
              video_url_hls
            )
          `);

        if (supabaseError) {
          throw supabaseError;
        }

        if (data) {
          // Ensure episodes is always an array, even if null from DB
          const formattedData = data.map(series => ({
            ...series,
            episodes: series.episodes || []
          }));
          setAllSeriesData(formattedData as Series[]);
        }
      } catch (err: any) {
        console.error('Error fetching series data:', err);
        setError(err.message || 'Failed to fetch series data.');
      } finally {
        setLoading(false);
      }
    };

    fetchSeries();
  }, []);

  const suggestedSeries = allSeriesData.slice(0, 1);
  const featuredSeries = allSeriesData.slice(1, 2); // Ensure you have at least 2 series for this to work as intended
  const trendingSeries = allSeriesData; // Or some other logic for trending

  const continueWatchingSeries = null; // Placeholder - to be implemented with actual user data

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="dark">
            <IonTitle>Home</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="ion-padding ion-text-center">
          <IonSpinner name="crescent" />
          <p>Loading shows...</p>
        </IonContent>
      </IonPage>
    );
  }

  if (error) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="dark">
            <IonTitle>Home</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="ion-padding">
          <IonText color="danger">
            <p>Error: {error}</p>
            <p>Please check your connection or try again later.</p>
          </IonText>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="dark">
          <IonTitle>Home</IonTitle>
        </IonToolbar>
        <IonToolbar color="dark">
          <IonSearchbar
            placeholder="Search series, films..."
            color="light"
            className="ion-padding-horizontal"
          />
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>

        {/* Continue Watching Section - Placeholder */}
        {continueWatchingSeries && (
          <IonCard className="home-page-card">
            <IonCardHeader>
              <IonLabel style={{ paddingLeft: 0, marginBottom: '8px', fontSize: '1.2em', fontWeight: 'bold', color: 'var(--ion-text-color)' }}>Continue Watching</IonLabel>
              {/* <IonCardTitle>{continueWatchingSeries.title}</IonCardTitle> */}
            </IonCardHeader>
            <IonCardContent>
              {/* Logic here would need access to the specific episode title from continueWatchingSeries object */}
              {/* <p>You were watching: {allSeriesData.find(s => s.episodes.some(e => e.id === continueWatchingSeries.episodeId))?.title} - {continueWatchingSeries.episodeTitle}</p> */}
            </IonCardContent>
          </IonCard>
        )}

        {/* Suggested Series Section */}
        {suggestedSeries.length > 0 && (
          <>
            <div className="list-header-label"><IonLabel>Suggested For You</IonLabel></div>
            <IonList lines="none">
              {suggestedSeries.map(series => (
                <IonCard key={series.id} routerLink={`/reels?seriesId=${series.id}`} className="home-page-card">
                  <IonCardContent className="ion-no-padding">
                    <img alt={series.title} src={series.cover_image_url || '/placeholder_cover_dark.png'} style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} />
                  </IonCardContent>
                  <IonCardHeader>
                    <IonCardTitle>{series.title}</IonCardTitle>
                  </IonCardHeader>
                </IonCard>
              ))}
            </IonList>
          </>
        )}

        {/* Featured Series Section */}
        {featuredSeries.length > 0 && (
          <>
            <div className="list-header-label"><IonLabel>Featured Series</IonLabel></div>
            <IonList lines="none">
              {featuredSeries.map(series => (
                <IonCard key={series.id} routerLink={`/reels?seriesId=${series.id}`} className="home-page-card">
                  <IonCardContent className="ion-no-padding">
                    <img alt={series.title} src={series.cover_image_url || '/placeholder_cover_dark.png'} style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} />
                  </IonCardContent>
                  <IonCardHeader>
                    <IonCardTitle>{series.title}</IonCardTitle>
                  </IonCardHeader>
                </IonCard>
              ))}
            </IonList>
          </>
        )}

        {/* Trending Series Section */}
        {trendingSeries.length > 0 && (
          <>
            <div className="list-header-label"><IonLabel>Trending Now</IonLabel></div>
            <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', padding: '0 8px 8px 8px' }}>
              {trendingSeries.map(series => (
                <IonCard
                  key={series.id}
                  routerLink={`/reels?seriesId=${series.id}`}
                  style={{
                    display: 'inline-block',
                    width: '160px', // Smaller cards for trending
                    margin: '0 8px 8px 0',
                    background: 'var(--ion-color-light)',
                    borderRadius: '4px',
                  }}
                >
                  <IonCardContent className="ion-no-padding">
                    {/* For trending, if cover_image_url is too large, you might use episode thumb or a different image variant */}
                    <img alt={series.title} src={series.cover_image_url || series.episodes[0]?.thumbnail_url || '/placeholder_thumb_dark.png'} style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block' }} />
                  </IonCardContent>
                  <IonCardHeader style={{ padding: '8px' }}>
                    <IonCardTitle style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>{series.title}</IonCardTitle>
                  </IonCardHeader>
                </IonCard>
              ))}
            </div>
          </>
        )}

        {allSeriesData.length === 0 && !loading && !error && (
            <div className="ion-padding ion-text-center">
                <p>No series found.</p>
            </div>
        )}

      </IonContent>
    </IonPage>
  );
};

export default HomePage;
