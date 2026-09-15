import { useEffect } from 'react';
import { StyleSheet as RNStyleSheet, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';

import type { CardId } from '../../specs/cardSpecs';

// Palindrome (forward + reversed) re-encodes of the Figma shader screen
// recordings — the loop point is seamless by construction, so the native
// player can just loop forever with no visible jump.
const SOURCES: Record<CardId, number> = {
  debit: require('../../../assets/card-bg-debit.mp4'),
  checking: require('../../../assets/card-bg-checking.mp4'),
};

type Props = {
  card: CardId;
  /** Pause decoding entirely while this card isn't the focused page. */
  active?: boolean;
  children?: React.ReactNode;
};

/** Video-backed card face — the pixel-faithful capture of the Figma shader. */
export function VideoCard({ card, active = true, children }: Props) {
  const player = useVideoPlayer(SOURCES[card], (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  useEffect(() => {
    if (active) {
      player.play();
    } else {
      player.pause();
    }
  }, [active, player]);

  return (
    <View style={RNStyleSheet.absoluteFill}>
      <VideoView
        player={player}
        style={RNStyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}
