import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { COLORS } from '../../services/theme';
import { useTheme } from '../../context/ThemeContext';

const MessageBubble = ({ message, isMe }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, isMe ? styles.myMessage : [styles.theirMessage, { backgroundColor: colors.card }]]}>
      <Text style={[styles.text, isMe ? styles.myText : [styles.theirText, { color: colors.text }]]}>
        {message.text}
      </Text>
      <Text style={[styles.time, isMe ? styles.myTime : styles.theirTime]}>
        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    elevation: 1,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.accent,
    borderBottomRightRadius: 2,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 2,
  },
  text: {
    fontSize: 15,
  },
  myText: {
    color: COLORS.white,
  },
  theirText: {
    color: COLORS.primary,
  },
  time: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  theirTime: {
    color: COLORS.placeholder,
  },
});

export default MessageBubble;
