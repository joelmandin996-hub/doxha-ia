import { ActionSheetIOS, Alert, Platform } from 'react-native';

// Long-press quick actions, the same pattern as Photos/Files/Mail: a
// native bottom sheet on iOS. Android has no equivalent system sheet in
// React Native core, so it falls back to a plain alert with the same
// options — same behaviour, less native chrome.
export function showItemActions({ title, onEdit, onDelete }) {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        options: ['Modifier', 'Supprimer', 'Annuler'],
        destructiveButtonIndex: 1,
        cancelButtonIndex: 2,
      },
      (index) => {
        if (index === 0) onEdit();
        else if (index === 1) onDelete();
      }
    );
    return;
  }

  Alert.alert(title, undefined, [
    { text: 'Modifier', onPress: onEdit },
    { text: 'Supprimer', style: 'destructive', onPress: onDelete },
    { text: 'Annuler', style: 'cancel' },
  ]);
}
