import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { useAuth } from '@/lib/auth/AuthContext';
import { useBookings } from '@/lib/booking/hooks';
import { useUnreadCount } from '@/lib/notifications/hooks';

/**
 * Profile, on the v2 system ("Servika Profile" canvas).
 *
 * The tab that had accumulated the most decoration: eight tiles in eight hues,
 * a three-stop gradient support banner, gray-100 hairlines. It now runs the
 * same language as Home, Bookings, Category and onboarding — sand ground,
 * Instrument Sans at 500/600, one orange, hairline-bordered white surfaces.
 */

/** Where "Contact support" / "Help" open. */
const SUPPORT_EMAIL = 'support@servika.com.ng';
const openSupport = () =>
  Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Servika%20Support`).catch(() => {});

const ACTIVE_STATUSES = [
  'Pending',
  'Accepted',
  'OnMyWay',
  'Arrived',
  'InProgress',
  'AwaitingConfirmation',
];

/** Clearance for the floating tab bar (see components/navigation/TabBar). */
const TAB_BAR_HEIGHT = 76;

type IconName = keyof typeof Ionicons.glyphMap;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

/** One stat in the identity card (e.g. 12 Bookings). */
function Stat({
  icon,
  value,
  label,
  divided,
}: {
  icon: IconName;
  value: string;
  label: string;
  /** Hairline on the leading edge — every column but the first. */
  divided?: boolean;
}) {
  return (
    <View style={[styles.stat, divided ? styles.statDivided : null]}>
      <Ionicons name={icon} size={17} color={colors.inkFaint} />
      <AppText weight="semibold" style={styles.statValue}>
        {value}
      </AppText>
      <AppText style={styles.statLabel}>{label}</AppText>
    </View>
  );
}

/** A Quick Access grid tile. */
function QuickTile({
  icon,
  label,
  badge,
  onPress,
}: {
  icon: IconName;
  label: string;
  badge?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.tile}
    >
      <View style={styles.tileIcon}>
        <Ionicons name={icon} size={23} color={colors.accentDeep} />
        {badge ? <View style={styles.tileBadge} /> : null}
      </View>
      {/* Stretched, not shrink-wrapped: Android clips whatever overflows a
          shrink-wrapped Text box, and "Notifications" is the widest label
          here by some margin. */}
      <AppText
        numberOfLines={2}
        // Pinned to 1: "Notifications" is a single unbreakable word in a 72dp
        // column, so a scaled-up label has nowhere to wrap and splits mid-word.
        maxFontSizeMultiplier={1}
        style={styles.tileLabel}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: bookings } = useBookings(undefined, { enabled: !!user });
  const { data: unread } = useUnreadCount({ enabled: !!user });

  const bottomPadding = TAB_BAR_HEIGHT + Math.max(insets.bottom, 14) + 24;
  const hasUnread = (unread?.count ?? 0) > 0;
  const total = bookings?.length ?? 0;
  const activeCount = bookings?.filter((b) => ACTIVE_STATUSES.includes(b.status)).length ?? 0;
  const completedCount = bookings?.filter((b) => b.status === 'Completed').length ?? 0;

  // Guests are normally gated before reaching this tab; safe fallback.
  if (!user) {
    return (
      <View style={[styles.guestRoot, { paddingTop: insets.top }]}>
        {/* Dark glyphs: this screen is white. Without an explicit StatusBar the
            screen inherits whatever the last one set, which on the sand ground
            meant white-on-near-white. */}
        <StatusBar style="dark" />
        <View style={styles.guest}>
          <View style={styles.guestIcon}>
            <Ionicons name="person-outline" size={30} color={colors.accentDeep} />
          </View>
          <AppText weight="semibold" style={styles.guestTitle}>
            You&apos;re browsing as a guest
          </AppText>
          <AppText style={styles.guestBody}>
            Sign in to manage your profile, bookings and messages.
          </AppText>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/login')}
            android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
            style={styles.guestCta}
          >
            <AppText weight="semibold" numberOfLines={1} style={styles.guestCtaLabel}>
              Sign in
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/register')}
            hitSlop={8}
            style={styles.guestLink}
          >
            <AppText weight="semibold" style={styles.guestLinkLabel}>
              Create an account
            </AppText>
          </Pressable>
        </View>
      </View>
    );
  }

  const quickAccess: {
    key: string;
    icon: IconName;
    label: string;
    badge?: boolean;
    onPress: () => void;
  }[] = [
    { key: 'bookings', icon: 'calendar-outline', label: 'Bookings', onPress: () => router.push('/bookings') },
    { key: 'saved', icon: 'heart-outline', label: 'Saved', onPress: () => router.push('/saved') },
    { key: 'messages', icon: 'chatbubble-ellipses-outline', label: 'Messages', onPress: () => router.push('/messages') },
    { key: 'notifications', icon: 'notifications-outline', label: 'Notifications', badge: hasUnread, onPress: () => router.push('/notifications') },
    { key: 'invite', icon: 'gift-outline', label: 'Invite & Earn', onPress: () => router.push('/refer') },
    { key: 'payments', icon: 'card-outline', label: 'Payments', onPress: () => router.push('/wallet') },
    { key: 'settings', icon: 'settings-outline', label: 'Settings', onPress: () => router.push('/settings') },
    { key: 'help', icon: 'help-buoy-outline', label: 'Help & Support', onPress: openSupport },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <AppText weight="semibold" style={styles.title}>
            Profile
          </AppText>
          <AppText weight="medium" style={styles.subtitle}>
            Manage your account and preferences
          </AppText>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={() => router.push('/notifications')}
            style={styles.headerButton}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.ink} />
            {hasUnread ? <View style={styles.headerDot} /> : null}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            onPress={() => router.push('/settings')}
            style={styles.headerButton}
          >
            <Ionicons name="settings-outline" size={20} color={colors.ink} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: bottomPadding }}
      >
        {/* Identity + stats */}
        <View style={styles.card}>
          <View style={styles.identity}>
            <View style={styles.avatar}>
              <AppText weight="semibold" style={styles.avatarLabel}>
                {initials(user.fullName)}
              </AppText>
            </View>

            <View style={styles.identityCopy}>
              <AppText weight="semibold" numberOfLines={1} style={styles.name}>
                {user.fullName}
              </AppText>
              {user.phoneNumber ? (
                <AppText weight="medium" numberOfLines={1} style={styles.phone}>
                  {user.phoneNumber}
                </AppText>
              ) : null}
              <AppText numberOfLines={1} style={styles.email}>
                {user.email}
              </AppText>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
              hitSlop={8}
              onPress={() => router.push('/edit-profile')}
              style={styles.edit}
            >
              <Ionicons name="create-outline" size={14} color={colors.accentDeep} />
              <AppText weight="semibold" style={styles.editLabel}>
                Edit
              </AppText>
            </Pressable>
          </View>

          <View style={styles.stats}>
            <Stat icon="calendar-outline" value={String(total)} label="Bookings" />
            <Stat icon="time-outline" value={String(activeCount)} label="Active" divided />
            <Stat
              icon="checkmark-done-outline"
              value={String(completedCount)}
              label="Completed"
              divided
            />
          </View>
        </View>

        {/* Quick Access */}
        <AppText weight="semibold" style={styles.sectionTitle}>
          Quick Access
        </AppText>
        <View style={styles.gridCard}>
          <View style={styles.grid}>
            {quickAccess.map((t) => (
              <QuickTile
                key={t.key}
                icon={t.icon}
                label={t.label}
                badge={t.badge}
                onPress={t.onPress}
              />
            ))}
          </View>
        </View>

        {/* Support */}
        <View style={styles.card2}>
          <View style={styles.supportCopy}>
            <AppText weight="semibold" style={styles.supportTitle}>
              Need help with a service?
            </AppText>
            <AppText style={styles.supportBody}>
              Our support team is ready to assist you.
            </AppText>
            <Pressable
              accessibilityRole="button"
              onPress={openSupport}
              android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
              style={styles.supportCta}
            >
              <AppText weight="semibold" numberOfLines={1} style={styles.supportCtaLabel}>
                Contact Support
              </AppText>
            </Pressable>
          </View>
          <View style={styles.supportIcon}>
            <Ionicons name="headset-outline" size={26} color={colors.accentDeep} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.sand,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 10,
  },
  headerCopy: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    gap: 4,
  },
  title: {
    fontSize: 27,
    lineHeight: 33,
    // Display size, so it has room for the tracking. The small labels below
    // deliberately have none — Android clips a tightly-tracked short run.
    letterSpacing: -1.08,
    color: colors.ink,
  },
  subtitle: {
    fontSize: 13.5,
    color: colors.inkMuted,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexGrow: 0,
    flexShrink: 0,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  headerDot: {
    position: 'absolute',
    top: 9,
    right: 11,
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: colors.accentDeep,
    borderWidth: 1.5,
    borderColor: colors.white,
  },

  // ── Surfaces ──
  card: {
    marginTop: 20,
    padding: 18,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  card2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 16,
    padding: 18,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
  },

  // ── Identity ──
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    flexGrow: 0,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: colors.accentTint,
  },
  avatarLabel: {
    fontSize: 20,
    color: colors.accentDeep,
  },
  identityCopy: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontSize: 16.5,
    letterSpacing: -0.41,
    color: colors.ink,
  },
  phone: {
    fontSize: 13,
    color: colors.inkMuted,
  },
  email: {
    fontSize: 12.5,
    color: colors.inkFaint,
  },
  edit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexGrow: 0,
    flexShrink: 0,
  },
  editLabel: {
    fontSize: 12.5,
    color: colors.accentDeep,
  },

  // ── Stats ──
  stats: {
    flexDirection: 'row',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  stat: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    alignItems: 'center',
    gap: 3,
  },
  statDivided: {
    borderLeftWidth: 1,
    borderLeftColor: colors.hairline,
  },
  statValue: {
    alignSelf: 'stretch',
    marginTop: 3,
    textAlign: 'center',
    fontSize: 17,
    letterSpacing: -0.51,
    color: colors.ink,
  },
  statLabel: {
    // Stretched across the column with the text centred, rather than letting
    // the Text shrink-wrap inside an align-center parent — that is what turned
    // "Completed" into "Complete" on device.
    alignSelf: 'stretch',
    fontSize: 11,
    textAlign: 'center',
    color: colors.inkFaint,
  },

  // ── Quick Access ──
  sectionTitle: {
    marginTop: 26,
    paddingHorizontal: 4,
    paddingBottom: 12,
    fontSize: 15,
    letterSpacing: -0.38,
    color: colors.ink,
  },
  gridCard: {
    paddingVertical: 16,
    // 10, not the canvas's 12: at 360dp the four columns are ~72dp and
    // "Notifications" is the one label that does not fit, breaking as
    // "Notification / s". Two points per side buys the word.
    paddingHorizontal: 10,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 18,
  },
  tile: {
    // A quarter of the row exactly. flexBasis rather than width so the four
    // columns stay equal whatever the label does.
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: '25%',
    alignItems: 'center',
    gap: 9,
  },
  tileIcon: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.accentTint,
  },
  tileBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 11,
    height: 11,
    borderRadius: 999,
    backgroundColor: colors.accentDeep,
    borderWidth: 2,
    borderColor: colors.white,
  },
  tileLabel: {
    alignSelf: 'stretch',
    height: 30,
    paddingHorizontal: 1,
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
    color: colors.inkMuted,
  },

  // ── Support ──
  supportCopy: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    gap: 4,
  },
  supportTitle: {
    fontSize: 15,
    letterSpacing: -0.38,
    color: colors.ink,
  },
  supportBody: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.inkFaint,
  },
  supportCta: {
    alignSelf: 'flex-start',
    // A stretched label inside a shrink-wrapped button has no width to stretch
    // to, so the button measures short and the label truncates ("Contact
    // Supp…"). The floor is what the words actually need.
    minWidth: 158,
    // 'stretch' with a centred label — the button's padding then becomes the
    // slack the final glyph needs instead of being clipped away.
    alignItems: 'stretch',
    justifyContent: 'center',
    height: 38,
    marginTop: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.accentDeep,
  },
  supportCtaLabel: {
    fontSize: 13,
    textAlign: 'center',
    color: colors.white,
  },
  supportIcon: {
    width: 52,
    height: 52,
    flexGrow: 0,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.accentTint,
  },

  // ── Guest ──
  guestRoot: {
    flex: 1,
    backgroundColor: colors.white,
  },
  guest: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34,
    paddingBottom: 84,
  },
  guestIcon: {
    width: 68,
    height: 68,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  guestTitle: {
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.57,
    textAlign: 'center',
    color: colors.ink,
  },
  guestBody: {
    marginTop: 6,
    maxWidth: 262,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    color: colors.inkMuted,
  },
  guestCta: {
    alignSelf: 'stretch',
    height: 54,
    marginTop: 26,
    alignItems: 'stretch',
    justifyContent: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.accentDeep,
  },
  guestCtaLabel: {
    fontSize: 15,
    letterSpacing: -0.3,
    textAlign: 'center',
    color: colors.white,
  },
  guestLink: {
    marginTop: 14,
  },
  guestLinkLabel: {
    fontSize: 13.5,
    color: colors.accentDeep,
  },
});
