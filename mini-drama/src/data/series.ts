export interface Episode {
  id: string;
  title: string;
  thumb?: string;
  srcMp4?: string;
  srcHls?: string;
}

export interface Series {
  id: string;
  title: string;
  description: string;
  episodes: Episode[];
}

export const ALL_SERIES: Series[] = [
  {
    id: "series1",
    title: "The Initial Series",
    description: "Catch the first two exciting episodes.",
    episodes: [
      {
        id: "e1",
        title: "Opening Scene",
        thumb: "/Videos/EP_01.jpg",
        srcMp4: "/Videos/EP_01.mp4",
      },
      {
        id: "e2",
        title: "Twist Reveal",
        thumb: "/Videos/EP_02.jpg",
        srcMp4: "/Videos/EP_02.mp4",
      },
    ],
  },
  {
    id: "series2",
    title: "Another Exciting Tale",
    description: "More adventures await in this dummy series.",
    episodes: [
      {
        id: "s2e1",
        title: "Episode 1",
        thumb: "/Videos/EP_01.jpg", // Using existing video as placeholder
        srcMp4: "/Videos/EP_01.mp4", // Using existing video as placeholder
      },
    ],
  },
];