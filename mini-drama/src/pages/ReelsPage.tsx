import React, { useEffect, useRef, useState } from "react";
import {
  IonContent,
  IonPage,
  useIonViewDidEnter,
  useIonViewWillLeave,
  IonSpinner, // Added
  IonText     // Added
} from "@ionic/react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Mousewheel } from "swiper/modules";
import "swiper/css";
import "swiper/css/mousewheel";
import { supabase } from '../supabaseClient'; // Added
import Hls from "hls.js";
import { useLocation } from "react-router-dom";

// Define new interfaces for Supabase data
interface SupabaseEpisode {
  id: string;
  title: string;
  thumbnail_url?: string | null;
  video_url_mp4?: string | null;
  video_url_hls?: string | null;
  // Add other fields from your 'episodes' table if needed
}

interface SupabaseSeries {
  id: string;
  title: string;
  episodes: SupabaseEpisode[];
  // Add other fields from your 'series' table if needed
}

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

interface VideoSlideProps {
  ep: SupabaseEpisode; // Updated type
  active: boolean;
  onPlay: () => void;
  isPageVisible: boolean;
}

const VideoSlide = ({ ep, active, onPlay, isPageVisible }: VideoSlideProps): JSX.Element => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const cleanupVideo = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.currentTime = 0;
    };

    if (active && isPageVisible) {
      if (hlsRef.current) { // Ensure previous HLS instance is destroyed before creating a new one
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (ep.video_url_hls) { // Use Supabase field name
        if (Hls.isSupported()) {
          const hls = new Hls({ maxBufferLength: 15 });
          hlsRef.current = hls;
          hls.loadSource(ep.video_url_hls);
          hls.attachMedia(video);
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = ep.video_url_hls;
        }
      } else if (ep.video_url_mp4) { // Use Supabase field name
        video.src = ep.video_url_mp4;
      }

      video.playsInline = true;
      video.loop = true;
      video.preload = "metadata";
      video.poster = ep.thumbnail_url || ''; // Use Supabase field name, provide fallback

      const handlePlayInternal = () => {
        onPlay();
      };
      
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          handlePlayInternal();
        }).catch(error => {
          console.warn("Autoplay prevented for video:", ep.title, error);
          const playOnClick = () => {
            video.play().then(handlePlayInternal).catch(e => console.error("Play on click failed", e));
            video.removeEventListener('click', playOnClick);
          };
          video.addEventListener('click', playOnClick);
        });
      }
    } else {
      cleanupVideo();
    }

    return () => {
      cleanupVideo();
    };
  }, [ep, active, isPageVisible, onPlay]); // onPlay was missing, added it back to deps

  return (
    <div className="slide-wrap" style={{ height: "100vh", position: "relative" }}>
      <video
        ref={videoRef}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          background: "#000",
        }}
      />
      <div style={{
        position: "absolute",
        bottom: "70px",
        left: "16px",
        maxWidth: "calc(100% - 32px)",
        boxSizing: "border-box",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        color: "#f1f1f1",
        padding: "6px 10px",
        borderRadius: "4px",
        fontSize: "0.9em",
        fontWeight: "bold",
      }}>
        {ep.title}
      </div>
    </div>
  );
};

const ReelsPage: React.FC = () => {
  const query = useQuery();
  const [currentSeries, setCurrentSeries] = useState<SupabaseSeries | null>(null); // Updated type
  const [episodesToPlay, setEpisodesToPlay] = useState<SupabaseEpisode[]>([]); // Updated type
  const [initialSlide, setInitialSlide] = useState(0);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [loading, setLoading] = useState<boolean>(true); // Added
  const [error, setError] = useState<string | null>(null); // Added

  useIonViewDidEnter(() => {
    setIsPageVisible(true);
    // Potentially re-trigger data loading if seriesId in query changes while page was cached
    // For now, primary load is in useEffect triggered by 'query'
  });

  useIonViewWillLeave(() => {
    setIsPageVisible(false);
  });

  useEffect(() => {
    const loadSeriesData = async () => {
      setLoading(true);
      setError(null);
      setCurrentSeries(null);
      setEpisodesToPlay([]);

      try {
        let seriesIdToLoad = query.get("seriesId");
        let startEpisodeIndex = 0;
        let fetchedSeriesData: SupabaseSeries | null = null;

        if (seriesIdToLoad) {
          const { data, error: dbError } = await supabase
            .from('series')
            .select(`id, title, episodes (id, title, thumbnail_url, video_url_mp4, video_url_hls)`)
            .eq('id', seriesIdToLoad)
            .single();
          if (dbError && dbError.code !== 'PGRST116') throw dbError; // PGRST116: Not found, not a fatal error yet
          fetchedSeriesData = data as SupabaseSeries | null;
          if (fetchedSeriesData) {
            localStorage.setItem('lastWatchedSeriesId', seriesIdToLoad);
            localStorage.removeItem('lastWatchedEpisodeIndex');
          }
        }

        if (!fetchedSeriesData) {
          const lastWatchedSeriesId = localStorage.getItem('lastWatchedSeriesId');
          if (lastWatchedSeriesId) {
            const { data, error: dbError } = await supabase
              .from('series')
              .select(`id, title, episodes (id, title, thumbnail_url, video_url_mp4, video_url_hls)`)
              .eq('id', lastWatchedSeriesId)
              .single();
            if (dbError && dbError.code !== 'PGRST116') throw dbError;
            fetchedSeriesData = data as SupabaseSeries | null;
            if (fetchedSeriesData) {
              const lastWatchedEpisodeIndexStr = localStorage.getItem('lastWatchedEpisodeIndex');
              if (fetchedSeriesData.episodes && lastWatchedEpisodeIndexStr) {
                const idx = parseInt(lastWatchedEpisodeIndexStr, 10);
                if (idx < fetchedSeriesData.episodes.length) startEpisodeIndex = idx;
              }
            }
          }
        }

        if (!fetchedSeriesData) { // If still no series, try loading the first one from DB
          const { data, error: dbError } = await supabase
            .from('series')
            .select(`id, title, episodes (id, title, thumbnail_url, video_url_mp4, video_url_hls)`)
            .order('created_at', { ascending: true }) // Or by title, etc.
            .limit(1)
            .single();
          if (dbError && dbError.code !== 'PGRST116') throw dbError;
          fetchedSeriesData = data as SupabaseSeries | null;
          if (fetchedSeriesData) {
            localStorage.setItem('lastWatchedSeriesId', fetchedSeriesData.id);
            localStorage.removeItem('lastWatchedEpisodeIndex');
          }
        }

        if (fetchedSeriesData) {
          const episodes = fetchedSeriesData.episodes || []; // Ensure episodes is an array
          setCurrentSeries({ ...fetchedSeriesData, episodes });
          setEpisodesToPlay(episodes);
          setInitialSlide(startEpisodeIndex);
          setActiveIndex(startEpisodeIndex);
          if (episodes.length === 0) {
            setError(fetchedSeriesData.title ? `No episodes found for "${fetchedSeriesData.title}".` : "No episodes found for this series.");
          }
        } else {
           setError("No series available to play. Please check if there is data in the database.");
        }

      } catch (err: any) {
        console.error("Error loading series for ReelsPage:", err);
        setError(err.message || "Failed to load video series.");
      } finally {
        setLoading(false);
      }
    };

    loadSeriesData();
  }, [query]); // Re-fetch if query params (seriesId) change

  const handleEpisodePlay = (seriesId: string, episodeIndex: number) => {
    localStorage.setItem('lastWatchedSeriesId', seriesId);
    localStorage.setItem('lastWatchedEpisodeIndex', episodeIndex.toString());
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent fullscreen className="ion-padding ion-text-center">
          <IonSpinner name="crescent" />
          <p>Loading reels...</p>
        </IonContent>
      </IonPage>
    );
  }

  if (error) {
    return (
      <IonPage>
        <IonContent fullscreen className="ion-padding ion-text-center">
          <IonText color="danger">
            <p>{error}</p>
          </IonText>
        </IonContent>
      </IonPage>
    );
  }
  
  // Only show "No videos to play" if not loading, no error, but still no episodes
  if (!loading && !error && episodesToPlay.length === 0) {
    return (
      <IonPage>
        <IonContent fullscreen className="ion-padding ion-text-center">
          <p>No videos available to play for the selected series.</p>
        </IonContent>
      </IonPage>
    );
  }


  return (
    <IonPage>
      <IonContent fullscreen>
        {currentSeries && episodesToPlay.length > 0 && (
          <Swiper
            direction="vertical"
            slidesPerView={1}
            initialSlide={initialSlide}
            onSlideChange={(s) => {
              setActiveIndex(s.activeIndex);
              if (currentSeries) {
                   handleEpisodePlay(currentSeries.id, s.activeIndex);
              }
            }}
            mousewheel={{ forceToAxis: true }}
            modules={[Mousewheel]}
            style={{ height: "100vh" }}
            key={currentSeries.id} // Re-initialize Swiper if series changes
          >
            {episodesToPlay.map((ep, idx) => (
              // @ts-ignore - Suppressing JSX validity error for SwiperSlide
              <SwiperSlide key={ep.id + idx}>
                <VideoSlide
                  ep={ep}
                  active={idx === activeIndex}
                  onPlay={() => {
                      if (currentSeries) {
                          handleEpisodePlay(currentSeries.id, idx);
                      }
                  }}
                  isPageVisible={isPageVisible}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ReelsPage;
