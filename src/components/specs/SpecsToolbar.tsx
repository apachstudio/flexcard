import { useRef, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import type {
  BorderBeamColorVariant,
  BorderBeamSize,
} from '../card-effects/border-beam/types';
import { type CardId, useCardSpecs } from '../../specs/cardSpecs';
import { SpecSlider } from './SpecSlider';

const BEAM_SIZES: { value: BorderBeamSize; label: string }[] = [
  { value: 'sm', label: 'SM' },
  { value: 'md', label: 'MD' },
  { value: 'line', label: 'Line' },
  { value: 'pulse-outside', label: 'Pulse out' },
  { value: 'pulse-inner', label: 'Pulse in' },
];
const BEAM_COLORS: { value: BorderBeamColorVariant; label: string }[] = [
  { value: 'brand', label: 'Brand' },
  { value: 'colorful', label: 'Colorful' },
  { value: 'mono', label: 'Mono' },
  { value: 'ocean', label: 'Ocean' },
  { value: 'sunset', label: 'Sunset' },
];

const PARTICLE_COLORS: { value: string; label: string }[] = [
  { value: '#FFFFFF', label: 'White' },
  { value: '#EEE2FC', label: 'Light' },
  { value: '#6A3DB8', label: 'Purple' },
  { value: '#2C194D', label: 'Dark' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <View style={styles.section}>
      <Pressable style={styles.sectionHeader} onPress={() => setOpen((o) => !o)}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionChevron}>{open ? '−' : '+'}</Text>
      </Pressable>
      {open && <View style={styles.sectionBody}>{children}</View>}
    </View>
  );
}

function SegmentedRow<T extends string>({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.segmentedRoot}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.segmentedRow}>
        {options.map((opt) => {
          const active = opt.value === selected;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onSelect(opt.value)}
              style={[styles.segment, active && styles.segmentActive]}
            >
              <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Little "sliders" glyph for the entry button, drawn with plain Views. */
function SlidersIcon() {
  return (
    <View style={styles.icon}>
      {[0.25, 0.7, 0.45].map((knob, i) => (
        <View key={i} style={styles.iconRow}>
          <View style={styles.iconTrack} />
          <View style={[styles.iconKnob, { left: `${knob * 100}%` }]} />
        </View>
      ))}
    </View>
  );
}

/**
 * Dev toolbar for tuning the card carousel's animation + visual specs live.
 * Entry point is a floating button; the panel edits one card at a time
 * (Card 1 = debit, Card 2 = checking account) with contextual sections for
 * particles, tilt, shadow, shader and border beam.
 */
// Entry-point FAB hidden per request — flip to true to bring the specs
// toolbar back (the panel itself and all wiring stay intact).
const SHOW_ENTRY_POINT = false;

export function SpecsToolbar() {
  const [open, setOpen] = useState(false);
  const [card, setCard] = useState<CardId>('debit');
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { specs, setSpec, resetCard } = useCardSpecs();

  const s = specs[card];

  const copyPrompt = async () => {
    const prompt = [
      'Atualize os specs dos cartões do flexcard para exatamente estes valores,',
      'editando DEFAULT_SPECS em src/specs/cardSpecs.tsx (card 1 = debit, card 2 = checking):',
      '',
      '```json',
      JSON.stringify(specs, null, 2),
      '```',
    ].join('\n');
    await Clipboard.setStringAsync(prompt);
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      {SHOW_ENTRY_POINT && !open && (
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(100)} style={styles.fabSlot}>
          <Pressable style={styles.fab} onPress={() => setOpen(true)} hitSlop={8}>
            <SlidersIcon />
          </Pressable>
        </Animated.View>
      )}

      {open && (
        <Animated.View
          entering={SlideInDown.duration(260)}
          exiting={SlideOutDown.duration(200)}
          style={styles.panel}
        >
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Card specs</Text>
            <View style={styles.panelHeaderActions}>
              <Pressable onPress={copyPrompt} hitSlop={8} style={styles.copyButton}>
                <Text style={styles.copyLabel}>{copied ? 'Copied ✓' : 'Copy prompt'}</Text>
              </Pressable>
              <Pressable onPress={() => resetCard(card)} hitSlop={8}>
                <Text style={styles.resetLabel}>Reset</Text>
              </Pressable>
              <Pressable onPress={() => setOpen(false)} hitSlop={8} style={styles.closeButton}>
                <Text style={styles.closeGlyph}>✕</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.tabs}>
            {(
              [
                { id: 'debit' as CardId, label: 'Card 1 · Debit' },
                { id: 'checking' as CardId, label: 'Card 2 · Checking' },
              ]
            ).map((tab) => {
              const active = tab.id === card;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setCard(tab.id)}
                  style={[styles.tab, active && styles.tabActive]}
                >
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Section title="Particles motion">
              <View style={styles.switchRow}>
                <Text style={styles.label}>Enabled</Text>
                <Switch
                  value={s.particles.enabled}
                  onValueChange={(enabled) => setSpec(card, 'particles', { enabled })}
                />
              </View>
              <SpecSlider
                label="Count"
                value={s.particles.count}
                min={0}
                max={60}
                step={1}
                onChange={(count) => setSpec(card, 'particles', { count })}
              />
              <SpecSlider
                label="Max diameter"
                value={s.particles.maxDiameter}
                min={1}
                max={8}
                step={0.1}
                decimals={1}
                onChange={(maxDiameter) => setSpec(card, 'particles', { maxDiameter })}
              />
              <SegmentedRow
                label="Color"
                options={PARTICLE_COLORS}
                selected={s.particles.color}
                onSelect={(color) => setSpec(card, 'particles', { color })}
              />
              <SpecSlider
                label="Rest opacity"
                value={s.particles.restOpacity}
                min={0}
                max={1}
                step={0.05}
                decimals={2}
                onChange={(restOpacity) => setSpec(card, 'particles', { restOpacity })}
              />
            </Section>

            <Section title="Tilt motion">
              <SpecSlider
                label="Perspective"
                value={s.tilt.perspective}
                min={400}
                max={3000}
                step={50}
                onChange={(perspective) => setSpec(card, 'tilt', { perspective })}
              />
              <SpecSlider
                label="Spring damping"
                value={s.tilt.damping}
                min={2}
                max={40}
                step={1}
                onChange={(damping) => setSpec(card, 'tilt', { damping })}
              />
              <SpecSlider
                label="Spring stiffness"
                value={s.tilt.stiffness}
                min={20}
                max={400}
                step={5}
                onChange={(stiffness) => setSpec(card, 'tilt', { stiffness })}
              />
              <SpecSlider
                label="Spring mass"
                value={s.tilt.mass}
                min={0.2}
                max={4}
                step={0.1}
                decimals={1}
                onChange={(mass) => setSpec(card, 'tilt', { mass })}
              />
            </Section>

            <Section title="Card shadow">
              <SpecSlider
                label="Offset Y"
                value={s.shadow.offsetY}
                min={0}
                max={40}
                step={1}
                onChange={(offsetY) => setSpec(card, 'shadow', { offsetY })}
              />
              <SpecSlider
                label="Blur"
                value={s.shadow.blur}
                min={0}
                max={80}
                step={1}
                onChange={(blur) => setSpec(card, 'shadow', { blur })}
              />
              <SpecSlider
                label="Opacity"
                value={s.shadow.opacity}
                min={0}
                max={1}
                step={0.01}
                decimals={2}
                onChange={(opacity) => setSpec(card, 'shadow', { opacity })}
              />
            </Section>

            {/* Same order, names and value shapes as the Figma "Moving
                gradient" panel, so values can be compared 1:1. */}
            <Section title="Card shaders">
              <SegmentedRow
                label="Background"
                options={[
                  { value: 'video' as const, label: 'Video (Figma capture)' },
                  { value: 'shader' as const, label: 'Shader' },
                ]}
                selected={s.bg.mode}
                onSelect={(mode) => setSpec(card, 'bg', { mode })}
              />
              <SpecSlider
                label="Detail"
                value={s.shader.detail}
                min={0}
                max={5}
                step={0.05}
                decimals={2}
                onChange={(detail) => setSpec(card, 'shader', { detail })}
              />
              <SpecSlider
                label="Intensity"
                value={s.shader.intensity}
                min={0}
                max={5}
                step={0.01}
                decimals={2}
                onChange={(intensity) => setSpec(card, 'shader', { intensity })}
              />
              <SpecSlider
                label="Twist"
                value={s.shader.twist}
                min={0}
                max={7}
                step={0.05}
                decimals={2}
                onChange={(twist) => setSpec(card, 'shader', { twist })}
              />
              <SpecSlider
                label="Flow"
                value={s.shader.warp}
                min={0}
                max={2}
                step={0.01}
                decimals={2}
                onChange={(warp) => setSpec(card, 'shader', { warp })}
              />
              <SpecSlider
                label="Zoom (%)"
                value={s.shader.zoom}
                min={1}
                max={100}
                step={1}
                onChange={(zoom) => setSpec(card, 'shader', { zoom })}
              />
              <SpecSlider
                label="Speed (%)"
                value={s.shader.rotationSpeed}
                min={0}
                max={150}
                step={1}
                onChange={(rotationSpeed) => setSpec(card, 'shader', { rotationSpeed })}
              />
              <SpecSlider
                label="Morph speed"
                value={s.shader.morphSpeed}
                min={0}
                max={3}
                step={0.01}
                decimals={2}
                onChange={(morphSpeed) => setSpec(card, 'shader', { morphSpeed })}
              />
              <View style={styles.gradientRow}>
                <Text style={styles.label}>Colors</Text>
                <View style={styles.gradientChips}>
                  {s.shader.gradient.map((stop) => (
                    <View key={stop.position} style={styles.gradientChip}>
                      <View style={[styles.gradientSwatch, { backgroundColor: stop.hex }]} />
                      <Text style={styles.gradientHex}>
                        {Math.round(stop.position * 100)}% {stop.hex}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </Section>

            <Section title="Border beam">
              <View style={styles.switchRow}>
                <Text style={styles.label}>Enabled</Text>
                <Switch
                  value={s.beam.enabled}
                  onValueChange={(enabled) => setSpec(card, 'beam', { enabled })}
                />
              </View>
              <SegmentedRow
                label="Size"
                options={BEAM_SIZES}
                selected={s.beam.size}
                onSelect={(size) => setSpec(card, 'beam', { size })}
              />
              <SegmentedRow
                label="Color"
                options={BEAM_COLORS}
                selected={s.beam.colorVariant}
                onSelect={(colorVariant) => setSpec(card, 'beam', { colorVariant })}
              />
              <SpecSlider
                label="Duration (s)"
                value={s.beam.duration}
                min={0.5}
                max={8}
                step={0.1}
                decimals={1}
                onChange={(duration) => setSpec(card, 'beam', { duration })}
              />
              <SpecSlider
                label="Strength"
                value={s.beam.strength}
                min={0}
                max={1}
                step={0.01}
                decimals={2}
                onChange={(strength) => setSpec(card, 'beam', { strength })}
              />
              <SpecSlider
                label="Brightness"
                value={s.beam.brightness}
                min={0.2}
                max={3}
                step={0.05}
                decimals={2}
                onChange={(brightness) => setSpec(card, 'beam', { brightness })}
              />
              <SpecSlider
                label="Hue range"
                value={s.beam.hueRange}
                min={0}
                max={180}
                step={5}
                onChange={(hueRange) => setSpec(card, 'beam', { hueRange })}
              />
            </Section>
          </ScrollView>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  fabSlot: {
    position: 'absolute',
    right: 16,
    bottom: 108,
  },
  fab: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.actionPrimaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#150B25',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  icon: {
    width: 18,
    gap: 4,
  },
  iconRow: {
    height: 2,
    justifyContent: 'center',
  },
  iconTrack: {
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  iconKnob: {
    position: 'absolute',
    width: 6,
    height: 6,
    marginLeft: -3,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '62%',
    backgroundColor: theme.colors.surfaceDefault,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    paddingTop: theme.spacing.default,
    shadowColor: '#0E0622',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.loose,
  },
  panelTitle: {
    ...theme.typography.headerSm,
    color: theme.colors.textDefault,
  },
  panelHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.default,
  },
  resetLabel: {
    ...theme.typography.bodyMd,
    color: theme.colors.textAction,
  },
  copyButton: {
    paddingHorizontal: theme.spacing.dense,
    paddingVertical: theme.spacing.densest,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.actionPrimaryDefault,
  },
  copyLabel: {
    ...theme.typography.bodyMd,
    color: '#FFFFFF',
  },
  gradientRow: {
    gap: 6,
  },
  gradientChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gradientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.denser,
    paddingVertical: theme.spacing.base,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.purple['04'],
  },
  gradientSwatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  gradientHex: {
    ...theme.typography.bodyMd,
    fontVariant: ['tabular-nums'],
    color: theme.colors.textDefault,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.purple['04'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeGlyph: {
    fontSize: 13,
    color: theme.colors.textDefault,
  },
  tabs: {
    flexDirection: 'row',
    gap: theme.spacing.denser,
    paddingHorizontal: theme.spacing.loose,
    marginTop: theme.spacing.dense,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.denser,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.purple['04'],
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: theme.colors.actionPrimaryDark,
  },
  tabLabel: {
    ...theme.typography.bodyMd,
    color: theme.colors.textDefault,
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  scroll: {
    marginTop: theme.spacing.dense,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.loose,
    paddingBottom: theme.spacing.looser,
    gap: theme.spacing.dense,
  },
  section: {
    borderRadius: theme.radius.md,
    backgroundColor: '#F6F3FB',
    paddingHorizontal: theme.spacing.default,
    paddingVertical: theme.spacing.dense,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...theme.typography.headerXs,
    color: theme.colors.textDefault,
  },
  sectionChevron: {
    fontSize: 18,
    color: theme.colors.textAction,
  },
  sectionBody: {
    marginTop: theme.spacing.dense,
    gap: theme.spacing.dense,
  },
  label: {
    ...theme.typography.bodyMd,
    color: theme.colors.textDefault,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  segmentedRoot: {
    gap: 6,
  },
  segmentedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  segment: {
    paddingHorizontal: theme.spacing.dense,
    paddingVertical: theme.spacing.densest,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.purple['04'],
  },
  segmentActive: {
    backgroundColor: theme.colors.actionPrimaryDefault,
  },
  segmentLabel: {
    ...theme.typography.bodyMd,
    color: theme.colors.textDefault,
  },
  segmentLabelActive: {
    color: '#FFFFFF',
  },
}));
