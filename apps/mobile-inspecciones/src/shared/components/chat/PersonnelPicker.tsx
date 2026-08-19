import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fontWeight } from '../../theme/tokens';
import type { UserResponse } from '../../services/api/users.api';

interface Props {
  users: UserResponse[];
  onConfirm: (selected: UserResponse[]) => void;
  confirmed?: boolean;
  suggestedUserId?: string | null;
}

function initials(value: string): string {
  return value
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function PersonnelPicker({ users, onConfirm, confirmed = false, suggestedUserId = null }: Props) {
  const effectiveSuggestedUserId = useMemo(
    () => suggestedUserId ?? users[0]?.id ?? null,
    [suggestedUserId, users],
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(
    () => effectiveSuggestedUserId ? [effectiveSuggestedUserId] : [],
  );

  useEffect(() => {
    setSelectedIds(effectiveSuggestedUserId ? [effectiveSuggestedUserId] : []);
  }, [effectiveSuggestedUserId]);

  const selectedUsers = users.filter((user) => selectedIds.includes(user.id));

  function toggle(id: string) {
    if (confirmed) return;
    setSelectedIds((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.list}>
        {users.map((user) => {
          const active = selectedIds.includes(user.id);
          const suggested = user.id === effectiveSuggestedUserId;

          return (
            <TouchableOpacity
              key={user.id}
              activeOpacity={0.7}
              disabled={confirmed}
              onPress={() => toggle(user.id)}
              style={[styles.personButton, active && styles.personButtonActive, confirmed && styles.disabled]}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials(user.fullName)}</Text>
              </View>
              <View style={styles.personCopy}>
                <Text numberOfLines={1} style={styles.name}>{user.fullName}</Text>
                <Text numberOfLines={1} style={styles.position}>{user.position ?? 'Responsable'}</Text>
              </View>
              {suggested ? <Text style={styles.suggestedBadge}>✦ Sugerido</Text> : null}
              <View style={[styles.check, active && styles.checkActive]}>
                {active ? <Text style={styles.checkText}>✓</Text> : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        disabled={confirmed || selectedUsers.length === 0}
        onPress={() => onConfirm(selectedUsers)}
        style={[styles.confirmButton, (confirmed || selectedUsers.length === 0) && styles.disabled]}
      >
        <Text style={styles.confirmText}>→ Confirmar y ver resumen</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    marginLeft: 33,
    marginRight: 12,
  },
  list: {
    gap: 6,
  },
  personButton: {
    width: '100%',
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderColor: '#D1D1D1',
    borderRadius: 10,
    borderWidth: 1.5,
  },
  personButtonActive: {
    backgroundColor: '#C5FFF6',
    borderColor: '#00B398',
  },
  avatar: {
    width: 30,
    height: 30,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C8A064',
    borderRadius: 999,
  },
  avatarText: {
    color: '#001E39',
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },
  personCopy: {
    minWidth: 0,
    flex: 1,
  },
  name: {
    color: '#131313',
    fontSize: 12,
    fontWeight: fontWeight.bold,
  },
  position: {
    marginTop: 1,
    color: '#646464',
    fontSize: 10,
  },
  suggestedBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    color: '#8E6E3E',
    fontSize: 9,
    fontWeight: fontWeight.bold,
    backgroundColor: '#FDF3E3',
    borderRadius: 3,
  },
  check: {
    width: 20,
    height: 20,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#D1D1D1',
    borderRadius: 999,
    borderWidth: 2,
  },
  checkActive: {
    backgroundColor: '#00B398',
    borderColor: '#00B398',
  },
  checkText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: fontWeight.bold,
  },
  confirmButton: {
    height: 36,
    marginTop: 4,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00B398',
    borderRadius: 999,
  },
  confirmText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: fontWeight.bold,
  },
  disabled: {
    opacity: 0.5,
  },
});