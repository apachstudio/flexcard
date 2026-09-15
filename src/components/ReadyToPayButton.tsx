import { Pressable, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

/** Full-width outlined button for single-payment bills — the current spec. */
export function ReadyToPayButton() {
  return (
    <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
      <Text style={styles.label}>Ready to pay</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  button: {
    height: 48,
    width: '100%',
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.actionPrimaryDefault,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: theme.colors.purple[50],
  },
  label: {
    ...theme.typography.button,
    color: theme.colors.actionPrimaryDefault,
  },
}));
